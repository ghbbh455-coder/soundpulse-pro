export type ThemeMode = 'cyberpunk' | 'dark' | 'midnight' | 'amoled' | 'light';

export type AccentColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'crimson' | 'custom';

export type VisualizerStyle = 'bars' | 'wave' | 'circle' | 'vinyl' | 'nebula' | 'liquid' | 'energy_core';

export type SortOption = 'title-asc' | 'title-desc' | 'artist' | 'duration-asc' | 'duration-desc' | 'date-newest' | 'date-oldest' | 'plays-desc';

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentColor;
  customAccentColor: string;
  glassmorphism: boolean;
  visualizerStyle: VisualizerStyle;
  visualizerBars: number;
  uiDensity: 'compact' | 'normal' | 'spacious';
  language: 'ar' | 'en';
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  duration: number; // in seconds
  fileBlob?: Blob;
  blobUrl?: string;
  url?: string; // Direct file URL (file:///..., capacitor://..., etc.)
  fileType: 'audio' | 'video';
  fileFormat: string;
  fileSize: number;
  dateAdded: number;
  playCount: number;
  isFavorite: boolean;
  extractedFromVideo?: boolean;
  coverArt?: string;
  lyrics?: string;
  isHidden?: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  coverColor: string;
  coverImage?: string;
  autoSort: SortOption | 'manual';
}

export type KaraokeMode = 'off' | 'karaoke' | 'vocal_only';
export type BinauralMode = 'off' | 'alpha' | 'theta' | 'delta' | 'beta';

export interface Spatial3DSettings {
  enabled: boolean;
  x: number; // -1 (left) to 1 (right)
  y: number; // -1 (back) to 1 (front)
  z: number; // -1 (below) to 1 (above)
  autoRotate: boolean;
  rotationSpeed: number; // 0.1 to 2.0
}

export interface AudioSettings {
  volume: number; // 0 - 100
  volumeBoost: number; // 0 - 300 (100 is standard 1x, 300 is 3x)
  playbackRate: number; // 0.5 - 2.5
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  eqGains: number[];
  activePreset: string;
  bassBoost: number;
  virtualizer: number;
  crossfade: number; // 0 to 12 seconds
  listeningSeconds: number; // cumulative listening time
  tubeWarmth: number; // 0 to 100 (Analog Tube Saturation)
  karaokeMode: KaraokeMode;
  binauralMode: BinauralMode;
  binauralVolume: number; // 0 to 100
  spatial3D: Spatial3DSettings;
  volumeNormalizer: boolean; // Safe dynamic volume compressor
  neuroSleepFade: boolean; // Low-pass filter darkening on sleep
}

export const DEFAULT_SPATIAL_SETTINGS: Spatial3DSettings = {
  enabled: false,
  x: 0,
  y: 0.5,
  z: 0,
  autoRotate: false,
  rotationSpeed: 0.5,
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  volume: 100,
  volumeBoost: 100,
  playbackRate: 1.0,
  repeatMode: 'off',
  isShuffle: false,
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  activePreset: 'Flat',
  bassBoost: 15,
  virtualizer: 10,
  crossfade: 3,
  listeningSeconds: 0,
  tubeWarmth: 0,
  karaokeMode: 'off',
  binauralMode: 'off',
  binauralVolume: 25,
  spatial3D: DEFAULT_SPATIAL_SETTINGS,
  volumeNormalizer: true,
  neuroSleepFade: true,
};

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 1, 2, 3],
  'Treble Boost': [-2, -1, 0, 0, 1, 2, 4, 6, 8, 9],
  Rock: [5, 4, 3, 1, -1, -1, 2, 4, 5, 6],
  Pop: [-1, 1, 3, 4, 4, 3, 1, -1, 2, 3],
  Electronic: [6, 5, 2, 0, -2, 2, 1, 3, 5, 6],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 1, 3, 4],
  Classical: [4, 3, 2, 2, -1, -1, 0, 2, 3, 4],
  Vocal: [-2, -2, 0, 3, 5, 4, 2, 0, -1, -2],
  Acoustic: [3, 2, 1, 1, 2, 2, 3, 3, 2, 1],
  'Tube Warmth': [3, 3, 2, 1, 0, 0, 1, 2, 3, 2],
  'Spatial Arena': [4, 3, 1, 0, 1, 2, 3, 4, 5, 5],
};
