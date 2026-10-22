import { Track } from '../types/player';
import { createSvgCover, saveTrack } from '../services/storage';
import { Capacitor } from '@capacitor/core';

export const LOCAL_TRACKS_STORAGE_KEY = 'soundpulse_tracks';

/**
 * Converts local native file paths (e.g. file:///storage/emulated/0/...)
 * into a WebView-accessible URL via Capacitor's local bridge (https://localhost/_capacitor_file_/...)
 */
export function toPlayableUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  try {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.convertFileSrc === 'function') {
      return Capacitor.convertFileSrc(url);
    }
  } catch (err) {
    console.warn('Capacitor.convertFileSrc error:', err);
  }
  return url;
}

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
 * Detects whether a file is a WhatsApp voice note, call recording, short notification tone, or junk audio.
 */
export function isJunkOrVoiceNote(raw: any): boolean {
  if (!raw) return true;
  const url = String(raw.url || raw.blobUrl || '').toLowerCase();
  const title = String(raw.title || '').toLowerCase().trim();
  const artist = String(raw.artist || '').toLowerCase().trim();
  const album = String(raw.album || '').toLowerCase().trim();
  const duration = typeof raw.duration === 'number' ? raw.duration : 0;

  // 1. WhatsApp Voice Notes and Audio
  if (
    url.includes('whatsapp') ||
    url.includes('com.whatsapp') ||
    url.includes('voice notes') ||
    url.includes('/media/whatsapp') ||
    title.startsWith('ptt-') ||
    title.startsWith('aud-') ||
    title.includes('wa00') ||
    album.includes('whatsapp')
  ) {
    return true;
  }

  // 2. Telegram, Call Recordings, Dictaphone, Voice Recorder
  if (
    url.includes('/telegram/') ||
    url.includes('org.telegram') ||
    url.includes('/call_rec') ||
    url.includes('/callrec') ||
    url.includes('/voice_record') ||
    url.includes('/sound_recorder') ||
    url.includes('/recordings/') ||
    title.includes('call_') ||
    title.includes('voice_') ||
    title.includes('recording_')
  ) {
    return true;
  }

  // 3. Android System ringtones, notifications, alarms, UI sounds, cache
  if (
    url.includes('/notifications/') ||
    url.includes('/ringtones/') ||
    url.includes('/alarms/') ||
    url.includes('/ui/') ||
    url.includes('/cache/') ||
    url.includes('/.cache/') ||
    url.includes('/temp/')
  ) {
    return true;
  }

  // 4. Timestamp-style filenames (e.g. 20260108_151158 or 151158_20260108) with unknown artist and short or 0 duration
  const timestampRegex = /^(\d{8}_\d{6}|\d{6}_\d{8}|rec_\d+|audio_\d+|voice_\d+)/i;
  const isGenericTimestamp = timestampRegex.test(title.replace(/\s+/g, ''));
  if (isGenericTimestamp && (!artist || artist === 'unknown artist' || artist === 'ملف محلي') && (duration < 60 || duration === 0)) {
    return true;
  }

  // 5. Very short notification clips (< 15 seconds) without valid title or artist
  if (duration > 0 && duration < 15 && (!artist || artist === 'unknown artist')) {
    return true;
  }

  // 6. Opus / AMR audio usually associated with voice notes if duration < 60
  const ext = url.split('.').pop()?.toLowerCase();
  if ((ext === 'opus' || ext === 'amr') && duration < 90) {
    return true;
  }

  return false;
}

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
    blobUrl: toPlayableUrl(directUrl) || directUrl, // Enables immediate playback in <audio> via WebView bridge
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
    if (isJunkOrVoiceNote(raw)) {
      return;
    }
    const normalized = normalizeScannedTrack(raw, idx);
    if (isJunkOrVoiceNote(normalized)) {
      return;
    }
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
