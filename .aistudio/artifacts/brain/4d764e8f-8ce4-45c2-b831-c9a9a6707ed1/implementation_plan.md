# SoundPulse Pro - Audio & Video Studio Player

A comprehensive, fully offline audio and video player featuring 300% volume boosting, client-side video-to-audio conversion, 10-band graphic equalizer, real-time frequency spectrum visualizer, customizable glassmorphic themes, and auto-sorting playlists.

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural baseline and styling choices have been aligned with your preferences:

- **Confirmed Aesthetic**: Cyber Neon with subtle glassmorphism, glowing accents, and dark/light mode toggle with comprehensive UI customization (custom accent colors, layout density, background gradients, and player styles).
- **Confirmed Video-to-Audio Workflow**: Direct in-browser video-to-audio extraction saving to offline storage, with a dual-mode video player toggle allowing seamless switching between audio-only listening and full/PiP video playback.
- **Confirmed Audio Visualizer**: Live real-time frequency spectrum bars with bass reactive pulse, plus alternate views (rotating vinyl disc and synced lyrics).
- **Audio Engine**: Web Audio API GainNode pipeline providing distortion-managed 300% (3.0x) volume boost and a 10-band equalizer with bass boost and 3D spatial virtualizer.
- **Offline Persistence**: Browser-native IndexedDB for storing audio tracks, extracted MP3/WAV/WebM audio, video files, custom playlists, and user theme settings with 0kb external server dependency.
- **Branding & Signature**: A refined, elegant "by Abdallah Mahmoud" signature badge anchored in the bottom playback controller.

---

### 1. Overview & Core Concept

- **What It Does**: SoundPulse Pro is a studio-grade media player engineered for audiophiles and power users. Users can drag and drop or import local music (MP3, WAV, FLAC, AAC, OGG) and video files (MP4, WebM, MKV). It extracts audio from video with one click, boosts volume up to 300%, applies a 10-band master equalizer with custom presets, renders audio frequency visualizers, manages smart playlists with automatic sorting (title, duration, date, artist, most played), and works 100% offline.
- **Target Audience**: Music enthusiasts, students, and video watchers who want an all-in-one local media player with advanced audio control, theme customization, and privacy without relying on internet connectivity.
- **Key Value**: Studio sound manipulation (300% boost + 10-band EQ) paired with video-to-audio conversion and client-side UI theming without any cloud backend required.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Library & File Ingestion**:
   - User uploads audio or video files or folders via drag-and-drop or file picker.
   - Files are indexed with duration, format, title, artist, and waveforms into IndexedDB.
   - Built-in demo tracks allow instant testing upon first launch.
2. **Playback & Full Player Experience**:
   - Bottom persistent player bar with play/pause, seek scrubber, track info, repeat/shuffle, volume boost slider (up to 300%), and the signature `"by Abdallah Mahmoud"`.
   - Expanding to full-screen or side-panel mode reveals the live audio frequency spectrum visualizer, 10-band equalizer, and lyrics/video viewport.
3. **Video-to-Audio Extraction & Video Watching**:
   - In the Video Hub tab, users can watch imported videos in a clean video player (with fullscreen, speed controls, loop, and PiP).
   - "Extract Audio" button instantly decodes the video's audio track, processes it via offline AudioContext, and creates a standalone high-quality audio track in the Music Library.
4. **10-Band Equalizer & 300% Volume Boost**:
   - Equalizer tab features 10 frequency sliders (32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz) with Bass Boost knob, Virtualizer knob, and presets (Flat, Bass Boost, Rock, Pop, Jazz, Electronic, Vocal, Acoustic).
   - Volume boost knob/slider goes smoothly from 0% to 100% (standard) and unlocks the turbo boost zone up to 300% with soft limiter protection against severe digital clipping.
5. **Smart Playlists & Automatic Sorting**:
   - Users create custom playlists or use Smart Playlists (Favorites, Most Played, Recently Added, Videos).
   - One-click auto-sorting: by Title (A-Z / Z-A), Artist, Duration (shortest/longest), Date Added, or Play Count.
6. **Full UI Customization & Dark/Light Themes**:
   - Theme Studio modal allows toggling Dark / Light / Midnight / Cyberpunk / AMOLED Black.
   - Accent color picker (Neon Cyan, Electric Violet, Emerald Glow, Sunset Amber, Crimson Red).
   - Visualizer density, background blur, and player bar layout controls saved permanently in local storage.

#### Visual Identity & Theme
- **Aesthetic Direction**: Cyber Neon with subtle glassmorphic backdrop filters, sleek metallic hairline borders, and dark/light adaptive surfaces.
- **Color Tokens**:
  - *Dark Canvas*: Deep obsidian `#0a0b10` with slate structural cards (`#121520`).
  - *Light Canvas*: Clean pearl `#f8fafc` with subtle frosted cards (`#ffffff`).
  - *Accents*: Neon Cyan `#00f2fe` to Electric Violet `#4facfe` gradient, Emerald Glow `#10b981` for active boosters.
- **Typography**: Clean modern sans-serif (`system-ui`, `Outfit` / `Plus Jakarta Sans`) with tabular monospace numerals for playback timers and EQ decibel levels.
- **Signature Badge**: Elegant micro-badge `"by Abdallah Mahmoud"` rendered with subtle glow in the bottom player bar.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Audio & Video Storage via IndexedDB**
  - *Chosen Approach*: Store audio and video files as `Blob` objects directly in browser IndexedDB along with metadata and playlist associations.
  - *Why*: Enables true offline operation, works across page reloads, and respects user privacy with zero cloud upload.
- **Decision 2: Web Audio API Pipeline for 300% Boost & 10-Band EQ**
  - *Chosen Approach*: Route `HTMLMediaElement` audio through an `AudioContext` connected to a chain of 10 `BiquadFilterNode`s, a `DynamicsCompressorNode` (soft limiter to prevent harsh clipping at 300%), an `AnalyserNode` for the visualizer, and a `GainNode` scaled up to `3.0`.
  - *Why*: Delivers studio-level real-time sound control and 300% volume amplification without distortion crashes.
- **Decision 3: Video-to-Audio Extraction via Offline Audio Decoding**
  - *Chosen Approach*: Read video file buffer -> decode via `AudioContext.decodeAudioData` -> encode to uncompressed WAV blob or capture via `MediaStreamAudioDestinationNode` and `MediaRecorder` -> store in Music Library.
  - *Why*: 100% in-browser, instantaneous, requires no external FFmpeg server or wasm heavy downloads.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SoundPulse Pro Architecture                     │
└────────────────────────────────────────────────────────────────────────┘

 [ Media Files: MP3 / WAV / MP4 / WebM ]
                  │
                  ▼
 ┌─────────────────────────────────┐      ┌─────────────────────────────┐
 │       IndexedDB Store           │ ◄──► │    Playlist & Meta Engine   │
 │ • Tracks (Blobs + Tags)         │      │ • Smart Sorting (A-Z, Time) │
 │ • Videos (Blobs + Posters)      │      │ • Custom Playlists & Favs   │
 │ • Themes & EQ Presets           │      │ • Play History & Counters   │
 └────────────────┬────────────────┘      └──────────────┬──────────────┘
                  │                                      │
                  ▼                                      ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                      Web Audio API Pipeline                          │
 │                                                                      │
 │ HTMLAudio / Video Element ──► MediaElementSourceNode                 │
 │                                    │                                 │
 │ ┌──────────────────────────────────┴───────────────────────────────┐ │
 │ │ 10-Band BiquadFilter EQ (32Hz -> 16kHz)                          │ │
 │ ├──────────────────────────────────────────────────────────────────┤ │
 │ │ Dynamics Compressor (Soft Limiter)                               │ │
 │ ├──────────────────────────────────────────────────────────────────┤ │
 │ │ GainNode (0% - 300% Volume Multiplier)                           │ │
 │ ├──────────────────────────────────────────────────────────────────┤ │
 │ │ AnalyserNode (FFT Size 256 for Frequency Bars Visualizer)        │ │
 │ └──────────────────────────────────┬───────────────────────────────┘ │
 │                                    │                                 │
 │                                    ▼                                 │
 │                              AudioDestination (Speakers / Headset)   │
 └────────────────────────────────────┬─────────────────────────────────┘
                                      │
                                      ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                           User Interface                             │
 │  ┌───────────────────────┐ ┌───────────────────┐ ┌────────────────┐  │
 │  │ Music Library View    │ │ Video Player &    │ │ 10-Band EQ &   │  │
 │  │ • Tracks, Playlists   │ │ Extraction Studio │ │ 300% Booster   │  │
 │  │ • Auto-Sort Controls  │ │ • PiP & Watch     │ │ • Presets      │  │
 │  └───────────────────────┘ └───────────────────┘ └────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────┐  │
 │  │ Real-Time Frequency Spectrum Visualizer (Canvas 60 FPS)        │  │
 │  └────────────────────────────────────────────────────────────────┘  │
 │  ┌────────────────────────────────────────────────────────────────┐  │
 │  │ Persistent Bottom Player Bar & Signature ("by Abdallah Mahmoud")│  │
 │  └────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────┘
```

#### State & Storage Schema
- `Track`: `{ id, title, artist, album, duration, fileBlob, type: 'audio' | 'video', extractedFromVideo?: boolean, dateAdded, playCount, isFavorite }`
- `Playlist`: `{ id, name, trackIds: string[], createdAt, autoSortBy: 'title' | 'date' | 'artist' | 'duration' | 'plays' }`
- `ThemeSettings`: `{ mode: 'dark' | 'light' | 'amoled' | 'cyberpunk', accentColor: string, visualizerBars: number, glassmorphism: boolean }`
- `AudioSettings`: `{ volumeBoost: number (0-300), eqGains: number[], preset: string, bassBoost: number }`

---
