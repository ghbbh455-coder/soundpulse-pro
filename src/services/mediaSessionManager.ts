import { Track } from '../types/player';

interface MediaActionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekTo: (seconds: number) => void;
  onSeekBackward?: (seconds: number) => void;
  onSeekForward?: (seconds: number) => void;
  onStop?: () => void;
}

class MediaSessionManager {
  private handlers: MediaActionHandlers | null = null;
  private currentTrackId: string | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'mediaSession' in navigator;
  }

  /**
   * Registers all system media session action handlers (Play, Pause, Next, Prev, Seek)
   * This is what powers Android Notification Player, Lockscreen Controls, and Infinix Magic Ring
   */
  public registerHandlers(handlers: MediaActionHandlers): void {
    if (!this.isSupported()) return;
    this.handlers = handlers;

    const actionMap: Array<[MediaSessionAction, (details: MediaSessionActionDetails) => void]> = [
      ['play', () => this.handlers?.onPlay()],
      ['pause', () => this.handlers?.onPause()],
      ['previoustrack', () => this.handlers?.onPrev()],
      ['nexttrack', () => this.handlers?.onNext()],
      [
        'seekto',
        (details) => {
          if (typeof details.seekTime === 'number' && !isNaN(details.seekTime)) {
            this.handlers?.onSeekTo(details.seekTime);
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          const offset = details.seekOffset || 10;
          if (this.handlers?.onSeekBackward) {
            this.handlers.onSeekBackward(offset);
          }
        },
      ],
      [
        'seekforward',
        (details) => {
          const offset = details.seekOffset || 10;
          if (this.handlers?.onSeekForward) {
            this.handlers.onSeekForward(offset);
          }
        },
      ],
      [
        'stop',
        () => {
          if (this.handlers?.onStop) {
            this.handlers.onStop();
          } else {
            this.handlers?.onPause();
          }
        },
      ],
    ];

    actionMap.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions might not be supported by specific Android browsers / OS variants
      }
    });
  }

  /**
   * Updates track metadata shown in Infinix Magic Ring, Dynamic Island, and System Notification
   */
  public updateMetadata(track: Track | null): void {
    if (!this.isSupported()) return;

    if (!track) {
      navigator.mediaSession.metadata = null;
      this.currentTrackId = null;
      return;
    }

    this.currentTrackId = track.id;

    const artworkSrc = track.coverArt || this.generateDefaultArtwork(track.title, track.artist);

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'SoundPulse Studio',
        album: track.album || 'SoundPulse Pro',
        artwork: [
          { src: artworkSrc, sizes: '96x96', type: 'image/png' },
          { src: artworkSrc, sizes: '128x128', type: 'image/png' },
          { src: artworkSrc, sizes: '192x192', type: 'image/png' },
          { src: artworkSrc, sizes: '256x256', type: 'image/png' },
          { src: artworkSrc, sizes: '384x384', type: 'image/png' },
          { src: artworkSrc, sizes: '512x512', type: 'image/png' },
        ],
      });
    } catch (e) {
      console.warn('MediaSession metadata update warning:', e);
    }
  }

  /**
   * Syncs playback state (playing vs paused)
   */
  public updatePlaybackState(isPlaying: boolean): void {
    if (!this.isSupported()) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // Ignore unsupported state setting
    }
  }

  /**
   * Syncs track duration, playback speed, and current position in real-time
   * Crucial for the scrubber bar on Android notification and Magic Ring capsule
   */
  public updatePositionState(currentTime: number, duration: number, playbackRate = 1.0): void {
    if (!this.isSupported() || !duration || isNaN(duration) || duration <= 0) return;
    if (typeof navigator.mediaSession.setPositionState !== 'function') return;

    try {
      const safePosition = Math.max(0, Math.min(currentTime, duration));
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: playbackRate > 0 ? playbackRate : 1.0,
        position: safePosition,
      });
    } catch {
      // Ignore position state errors
    }
  }

  /**
   * Fallback crisp SVG cover art rendered as high-contrast image
   */
  private generateDefaultArtwork(title: string, artist: string): string {
    const cleanTitle = (title || 'SoundPulse').slice(0, 18);
    const cleanArtist = (artist || 'Audio Studio').slice(0, 22);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#030712"/>
        </linearGradient>
        <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#4facfe"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="64" fill="url(#bg)"/>
      <circle cx="256" cy="220" r="110" fill="none" stroke="url(#glow)" stroke-width="8" opacity="0.8"/>
      <circle cx="256" cy="220" r="60" fill="#00f2fe" opacity="0.15"/>
      <polygon points="245,185 285,220 245,255" fill="#00f2fe"/>
      <text x="256" y="380" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">${cleanTitle}</text>
      <text x="256" y="420" font-family="system-ui, sans-serif" font-size="20" fill="#38bdf8" text-anchor="middle">${cleanArtist}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

export const mediaSessionManager = new MediaSessionManager();
