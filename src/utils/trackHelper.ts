import { Track } from '../types/player';
import { createSvgCover, saveTrack } from '../services/storage';

export const LOCAL_TRACKS_STORAGE_KEY = 'soundpulse_tracks';

const GRADIENTS = [
  ['#00f2fe', '#4facfe'],
  ['#a855f7', '#ec4899'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#6366f1', '#a855f7'],
  ['#ec4899', '#f43f5e'],
  ['#14b8a6', '#3b82f6'],
];

/**
 * Normalizes any raw scanned audio track object from Android native scanner
 * or localStorage into a full SoundPulse Track.
 *
 * Expected Android Scanner object shape:
 * { id: string, title: string, artist: string, url: string, duration: number }
 */
export function normalizeScannedTrack(raw: any, index: number = 0): Track {
  const directUrl = raw.url || raw.blobUrl || '';
  const rawTitle = raw.title?.trim() || '';
  const rawArtist = raw.artist?.trim() || '';
  const rawAlbum = raw.album?.trim() || '';

  // Extract file extension or default to mp3
  let cleanExt = 'mp3';
  if (directUrl) {
    const cleanPath = directUrl.split('?')[0].split('#')[0];
    const match = cleanPath.match(/\.([0-9a-z]+)$/i);
    if (match && match[1]) {
      cleanExt = match[1].toLowerCase();
    }
  }

  // Derive pretty title if not provided
  let title = rawTitle;
  if (!title && directUrl) {
    const fileName = directUrl.split('/').pop() || 'Track';
    title = decodeURIComponent(fileName).replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }
  if (!title) {
    title = `Audio Track ${index + 1}`;
  }

  const artist = rawArtist || 'Unknown Artist';
  const album = rawAlbum || 'الذاكرة المحلية (Android)';
  const id = raw.id ? String(raw.id) : `scanned-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
  const duration = typeof raw.duration === 'number' && !isNaN(raw.duration) && raw.duration > 0
    ? raw.duration
    : 0;

  // Pick deterministic aesthetic gradient for cover art
  const gradPair = GRADIENTS[Math.abs(index) % GRADIENTS.length];
  const coverArt = raw.coverArt || createSvgCover(title, gradPair[0], gradPair[1]);

  return {
    id,
    title,
    artist,
    album,
    genre: raw.genre || 'SoundPulse Music',
    duration,
    url: directUrl,
    blobUrl: directUrl, // Enables immediate playback in <audio>
    fileType: 'audio',
    fileFormat: cleanExt,
    fileSize: typeof raw.fileSize === 'number' ? raw.fileSize : 0,
    dateAdded: typeof raw.dateAdded === 'number' ? raw.dateAdded : Date.now(),
    playCount: typeof raw.playCount === 'number' ? raw.playCount : 0,
    isFavorite: Boolean(raw.isFavorite),
    coverArt,
    lyrics: raw.lyrics || undefined,
    extractedFromVideo: false,
    isHidden: Boolean(raw.isHidden),
    isDeleted: Boolean(raw.isDeleted),
  };
}

/**
 * Loads tracks persisted in localStorage
 */
export function getPersistedTracks(): Track[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRACKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, idx) => normalizeScannedTrack(item, idx));
  } catch (err) {
    console.warn('Failed to parse soundpulse_tracks from localStorage:', err);
    return [];
  }
}

/**
 * Safely persists track list into localStorage without cyclic or non-serializable properties (e.g. fileBlob)
 */
export function persistTracksToStorage(tracks: Track[]): void {
  try {
    const serializable = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      genre: t.genre,
      duration: t.duration,
      url: t.url || t.blobUrl,
      fileType: t.fileType,
      fileFormat: t.fileFormat,
      fileSize: t.fileSize,
      dateAdded: t.dateAdded,
      playCount: t.playCount,
      isFavorite: t.isFavorite,
      coverArt: t.coverArt,
      lyrics: t.lyrics,
      isDeleted: t.isDeleted,
      isHidden: t.isHidden,
    }));
    localStorage.setItem(LOCAL_TRACKS_STORAGE_KEY, JSON.stringify(serializable));
  } catch (err) {
    console.warn('Failed to persist tracks to localStorage:', err);
  }
}

/**
 * Merges new scanned tracks into an existing track array, avoiding duplicate IDs or URLs,
 * and saves additions to IndexedDB and localStorage.
 */
export async function mergeAndPersistScannedTracks(
  existingTracks: Track[],
  incomingTracks: any[]
): Promise<{ merged: Track[]; addedCount: number }> {
  if (!Array.isArray(incomingTracks) || incomingTracks.length === 0) {
    return { merged: existingTracks, addedCount: 0 };
  }

  const existingIds = new Set(existingTracks.map((t) => t.id));
  const existingUrls = new Set(
    existingTracks.map((t) => (t.url || t.blobUrl || '').trim().toLowerCase()).filter(Boolean)
  );

  const newTracks: Track[] = [];

  incomingTracks.forEach((raw, idx) => {
    const normalized = normalizeScannedTrack(raw, idx);
    const normalizedUrl = (normalized.url || normalized.blobUrl || '').trim().toLowerCase();

    const isDuplicate =
      existingIds.has(normalized.id) ||
      (normalizedUrl && existingUrls.has(normalizedUrl));

    if (!isDuplicate) {
      existingIds.add(normalized.id);
      if (normalizedUrl) existingUrls.add(normalizedUrl);
      newTracks.push(normalized);
    }
  });

  if (newTracks.length === 0) {
    return { merged: existingTracks, addedCount: 0 };
  }

  // Prepend newly scanned tracks
  const merged = [...newTracks, ...existingTracks];

  // Persist to localStorage
  persistTracksToStorage(merged);

  // Persist each to IndexedDB asynchronously
  for (const track of newTracks) {
    saveTrack(track).catch((err) => console.warn('Error saving scanned track to IndexedDB:', err));
  }

  return { merged, addedCount: newTracks.length };
}
