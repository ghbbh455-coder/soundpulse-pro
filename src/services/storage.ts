import { Track, Playlist, ThemeConfig, AudioSettings } from '../types/player';
import { generateDemoTrack1, generateDemoTrack2, generateDemoVideoBlob } from '../utils/audioSynthesizer';

const DB_NAME = 'soundpulse_pro_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('tracks')) {
        db.createObjectStore('tracks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export const defaultThemeConfig: ThemeConfig = {
  mode: 'cyberpunk',
  accent: 'cyan',
  customAccentColor: '#00f2fe',
  glassmorphism: true,
  visualizerStyle: 'bars',
  visualizerBars: 48,
  uiDensity: 'normal',
  language: 'ar',
};

export const defaultAudioSettings: AudioSettings = {
  volume: 85,
  volumeBoost: 100, // 100% normal
  playbackRate: 1.0,
  repeatMode: 'all',
  isShuffle: false,
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  activePreset: 'Flat',
  bassBoost: 15,
  virtualizer: 10,
  crossfade: 2,
  listeningSeconds: 7420, // Initial listening stats
  tubeWarmth: 0,
  karaokeMode: 'off',
  binauralMode: 'off',
  binauralVolume: 25,
  spatial3D: {
    enabled: false,
    x: 0,
    y: 0.5,
    z: 0,
    autoRotate: false,
    rotationSpeed: 0.5,
  },
  volumeNormalizer: true,
  neuroSleepFade: true,
};

// Tracks Operations
export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readonly');
    const store = tx.objectStore('tracks');
    const request = store.getAll();

    request.onsuccess = () => {
      const tracks = request.result as Track[];
      // Hydrate blob URLs
      tracks.forEach(track => {
        if (track.fileBlob && !track.blobUrl) {
          track.blobUrl = URL.createObjectURL(track.fileBlob);
        }
      });
      resolve(tracks);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function saveTrack(track: Track): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readwrite');
    const store = tx.objectStore('tracks');
    // Ensure blob is saved; blobUrl can be recreated
    const record = { ...track };
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTrack(trackId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['tracks', 'playlists'], 'readwrite');
    const tracksStore = tx.objectStore('tracks');
    const playlistsStore = tx.objectStore('playlists');

    tracksStore.delete(trackId);

    // Also remove from any playlists containing it
    const plRequest = playlistsStore.getAll();
    plRequest.onsuccess = () => {
      const playlists = plRequest.result as Playlist[];
      playlists.forEach(pl => {
        if (pl.trackIds.includes(trackId)) {
          pl.trackIds = pl.trackIds.filter(id => id !== trackId);
          playlistsStore.put(pl);
        }
      });
      resolve();
    };
    plRequest.onerror = () => reject(plRequest.error);
  });
}

// Playlists Operations
export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readonly');
    const store = tx.objectStore('playlists');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as Playlist[]);
    request.onerror = () => reject(request.error);
  });
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const request = store.put(playlist);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const request = store.delete(playlistId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Settings Operations
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result && request.result.value !== undefined) {
          const val = request.result.value;
          if (
            typeof val === 'object' &&
            val !== null &&
            typeof defaultValue === 'object' &&
            defaultValue !== null &&
            !Array.isArray(defaultValue)
          ) {
            resolve({ ...defaultValue, ...val } as T);
          } else {
            resolve(val as T);
          }
        } else {
          resolve(defaultValue);
        }
      };

      request.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Initializes default demo tracks and playlists if storage is empty
 */
export async function initializeDefaultLibrary(): Promise<{ tracks: Track[]; playlists: Playlist[] }> {
  let tracks = await getAllTracks();
  let playlists = await getAllPlaylists();

  if (tracks.length === 0) {
    // Generate built-in offline test tracks
    const t1 = generateDemoTrack1();
    const track1: Track = {
      id: 'demo-1',
      title: 'Cyber Pulse (Synthwave Odyssey)',
      artist: 'SoundPulse Studio',
      album: 'Neon Horizon',
      genre: 'Synthwave',
      duration: t1.duration,
      fileBlob: t1.blob,
      blobUrl: URL.createObjectURL(t1.blob),
      fileType: 'audio',
      fileFormat: 'wav',
      fileSize: t1.blob.size,
      dateAdded: Date.now() - 3600000,
      playCount: 12,
      isFavorite: true,
      coverArt: createSvgCover('Cyber Pulse', '#00f2fe', '#4facfe'),
      lyrics: `[00:00.00]SoundPulse Pro - Cyber Pulse
[00:03.50]نغمات النيون في ليل المدينة الهادئ
[00:07.00]أصوات المستقبل تنبض بالحياة والإيقاع
[00:11.00]سافر في عالم الصوت الفائق 300%
[00:14.50]Cybernetic dreams in a neon haze
[00:18.00]SoundPulse Studio - Music unleashed!
[00:22.00]by Abdallah Mahmoud`,
    };

    const t2 = generateDemoTrack2();
    const track2: Track = {
      id: 'demo-2',
      title: 'Midnight Reverie (Chill Lo-Fi)',
      artist: 'Abdallah Mahmoud',
      album: 'Quiet Hours',
      genre: 'Lo-Fi Chill',
      duration: t2.duration,
      fileBlob: t2.blob,
      blobUrl: URL.createObjectURL(t2.blob),
      fileType: 'audio',
      fileFormat: 'wav',
      fileSize: t2.blob.size,
      dateAdded: Date.now() - 1800000,
      playCount: 8,
      isFavorite: true,
      coverArt: createSvgCover('Midnight Reverie', '#a855f7', '#ec4899'),
      lyrics: `[00:00.00]Midnight Reverie - Lo-Fi Chill
[00:04.00]هدوء الليل يملأ الأرجاء والسكينة
[00:08.50]أنغام هادئة تريح البال وتصفي الذهن
[00:13.00]Quiet hours, endless peace and dreams
[00:17.50]by Abdallah Mahmoud
[00:22.00]استمتع بالنقاء والصفاء الصوتي مع SoundPulse`,
    };

    // Generate demo video with audio
    try {
      const v = await generateDemoVideoBlob();
      if (v.duration > 0 && v.blob.size > 0) {
        const videoTrack: Track = {
          id: 'demo-video-1',
          title: 'Neon Waves Visual Showcase',
          artist: 'Studio Visuals',
          album: 'Motion Clips',
          genre: 'Visual Showcase',
          duration: v.duration,
          fileBlob: v.blob,
          blobUrl: URL.createObjectURL(v.blob),
          fileType: 'video',
          fileFormat: 'webm',
          fileSize: v.blob.size,
          dateAdded: Date.now() - 900000,
          playCount: 4,
          isFavorite: false,
          coverArt: createSvgCover('Video Showcase', '#10b981', '#06b6d4'),
        };
        await saveTrack(videoTrack);
        tracks.push(videoTrack);
      }
    } catch {
      // Continue if video creation is unsupported in certain environments
    }

    await saveTrack(track1);
    await saveTrack(track2);
    tracks.unshift(track1, track2);

    // Create default starter playlists
    const favPlaylist: Playlist = {
      id: 'pl-favorites',
      name: 'المفضلة (Favorites)',
      description: 'أغانيك ومقاطعك المفضلة',
      trackIds: ['demo-1', 'demo-2'],
      createdAt: Date.now(),
      coverColor: '#ec4899',
      autoSort: 'plays-desc',
    };

    const chillPlaylist: Playlist = {
      id: 'pl-chill',
      name: 'أجواء الاسترخاء والتركيز',
      description: 'موسيقى هادئة للدراسة والاسترخاء',
      trackIds: ['demo-2'],
      createdAt: Date.now(),
      coverColor: '#8b5cf6',
      autoSort: 'title-asc',
    };

    await savePlaylist(favPlaylist);
    await savePlaylist(chillPlaylist);
    playlists = [favPlaylist, chillPlaylist];
  }

  return { tracks, playlists };
}

function createSvgCover(title: string, color1: string, color2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <rect width="300" height="300" rx="20" fill="url(#grad)" />
    <circle cx="150" cy="150" r="70" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4"/>
    <circle cx="150" cy="150" r="30" fill="rgba(255,255,255,0.15)"/>
    <polygon points="142,135 165,150 142,165" fill="#ffffff" />
    <text x="150" y="255" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${title.slice(0, 20)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
