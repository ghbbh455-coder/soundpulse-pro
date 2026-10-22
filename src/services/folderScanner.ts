import { Track } from '../types/player';
import { saveTrack, saveSetting, getSetting } from './storage';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.opus', '.wma'];

export interface ScanResult {
  newTracks: Track[];
  totalScanned: number;
  folderName: string;
}

/**
 * Checks if Modern File System Access API (showDirectoryPicker) is supported
 */
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { showDirectoryPicker?: () => unknown }).showDirectoryPicker === 'function';
}

/**
 * Clean audio title & artist from filename (e.g. "01 - Artist - Song.mp3" -> "Song" & "Artist")
 */
export function parseAudioFilename(filename: string): { title: string; artist: string } {
  // Strip extension
  const baseName = filename.replace(/\.[^/.]+$/, '');
  // Remove leading track numbers (e.g. "01 - ", "1. ", "01_")
  const strippedNumber = baseName.replace(/^[\d\s.\-_]+/, '').trim();

  // If format is "Artist - Title" or "Artist - Track"
  if (strippedNumber.includes(' - ')) {
    const parts = strippedNumber.split(' - ');
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    if (title && artist) {
      return { title, artist };
    }
  }

  return {
    title: strippedNumber || baseName,
    artist: 'مكتبة الهاتف (Local Audio)',
  };
}

/**
 * Reads duration of an audio blob using a temporary audio element
 */
export function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanUp = () => {
      audio.onloadedmetadata = null;
      audio.onerror = null;
      URL.revokeObjectURL(url);
    };

    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      cleanUp();
      resolve(isFinite(dur) && dur > 0 ? dur : 180);
    };

    audio.onerror = () => {
      cleanUp();
      resolve(180); // Default 3 min fallback if format metadata cannot be read immediately
    };

    audio.src = url;
  });
}

/**
 * Recursively scans a FileSystemDirectoryHandle for audio files
 */
async function scanDirectoryEntries(
  dirHandle: FileSystemDirectoryHandle,
  existingIds: Set<string>,
  newTracks: Track[],
  totalScannedRef: { count: number }
): Promise<void> {
  for await (const entry of (dirHandle as any).values()) {
    if (entry.kind === 'file') {
      const fileName = entry.name.toLowerCase();
      const hasAudioExt = AUDIO_EXTENSIONS.some((ext) => fileName.endsWith(ext));
      if (hasAudioExt) {
        totalScannedRef.count++;
        const file = await entry.getFile();
        const trackId = `track-${file.name}-${file.size}`;

        if (!existingIds.has(trackId)) {
          const { title, artist } = parseAudioFilename(file.name);
          const duration = await getAudioDuration(file);
          const blobUrl = URL.createObjectURL(file);

          const track: Track = {
            id: trackId,
            title,
            artist,
            album: 'مجلد الهاتف (Auto Scanned)',
            genre: 'Local Audio',
            duration,
            fileBlob: file,
            blobUrl,
            fileType: 'audio',
            fileFormat: file.name.split('.').pop() || 'mp3',
            fileSize: file.size,
            dateAdded: Date.now(),
            playCount: 0,
            isFavorite: false,
          };

          newTracks.push(track);
          existingIds.add(trackId);
          // Persist directly to IndexedDB
          await saveTrack(track);
        }
      }
    } else if (entry.kind === 'directory') {
      // Recurse sub-folders (e.g. Albums / Artists folders)
      try {
        await scanDirectoryEntries(entry, existingIds, newTracks, totalScannedRef);
      } catch {
        // Continue scanning parent if permission for subfolder is denied
      }
    }
  }
}

/**
 * Triggers native folder selector, stores handle, and imports all audio
 */
export async function pickAndScanMusicFolder(
  existingTracks: Track[]
): Promise<ScanResult | null> {
  if (!isDirectoryPickerSupported()) {
    return null;
  }

  try {
    const dirHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
      id: 'soundpulse-music-folder',
      mode: 'read',
    });

    if (!dirHandle) return null;

    // Save handle in IndexedDB for auto-sync on next startup
    try {
      await saveSetting('music_folder_handle', dirHandle);
      await saveSetting('music_folder_name', dirHandle.name);
    } catch (err) {
      console.warn('Could not persist directory handle:', err);
    }

    const existingIds = new Set(existingTracks.map((t) => t.id));
    const newTracks: Track[] = [];
    const totalScannedRef = { count: 0 };

    await scanDirectoryEntries(dirHandle, existingIds, newTracks, totalScannedRef);

    return {
      newTracks,
      totalScanned: totalScannedRef.count,
      folderName: dirHandle.name,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null; // User cancelled
    }
    console.error('Directory scanning error:', err);
    throw err;
  }
}

/**
 * Checks for previously saved folder handle and automatically syncs new files on startup
 */
export async function autoSyncSavedMusicFolder(
  existingTracks: Track[]
): Promise<ScanResult | null> {
  if (!isDirectoryPickerSupported()) return null;

  try {
    const savedHandle = await getSetting<FileSystemDirectoryHandle | null>('music_folder_handle', null);
    if (!savedHandle) return null;

    // Check permission without prompting aggressively
    const permissionStatus = await (savedHandle as any).queryPermission({ mode: 'read' });
    if (permissionStatus !== 'granted') {
      return null;
    }

    const existingIds = new Set(existingTracks.map((t) => t.id));
    const newTracks: Track[] = [];
    const totalScannedRef = { count: 0 };

    await scanDirectoryEntries(savedHandle, existingIds, newTracks, totalScannedRef);

    const folderName = await getSetting<string>('music_folder_name', savedHandle.name || 'مجلد الموسيقى');

    return {
      newTracks,
      totalScanned: totalScannedRef.count,
      folderName,
    };
  } catch (err) {
    console.warn('Auto sync saved folder skipped:', err);
    return null;
  }
}

/**
 * Fallback scanner from FileList (via <input type="file" webkitdirectory />)
 */
export async function scanFromFileInput(
  fileList: FileList,
  existingTracks: Track[]
): Promise<ScanResult> {
  const existingIds = new Set(existingTracks.map((t) => t.id));
  const newTracks: Track[] = [];
  let totalScanned = 0;

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const fileName = file.name.toLowerCase();
    const hasAudioExt = AUDIO_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (hasAudioExt) {
      totalScanned++;
      const trackId = `track-${file.name}-${file.size}`;
      if (!existingIds.has(trackId)) {
        const { title, artist } = parseAudioFilename(file.name);
        const duration = await getAudioDuration(file);
        const blobUrl = URL.createObjectURL(file);

        const track: Track = {
          id: trackId,
          title,
          artist,
          album: 'مجلد الموسيقى المستورد',
          genre: 'Local Audio',
          duration,
          fileBlob: file,
          blobUrl,
          fileType: 'audio',
          fileFormat: file.name.split('.').pop() || 'mp3',
          fileSize: file.size,
          dateAdded: Date.now(),
          playCount: 0,
          isFavorite: false,
        };

        newTracks.push(track);
        existingIds.add(trackId);
        await saveTrack(track);
      }
    }
  }

  return {
    newTracks,
    totalScanned,
    folderName: fileList[0]?.webkitRelativePath?.split('/')[0] || 'مجلد الموسيقى',
  };
}
