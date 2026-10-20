/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Track,
  Playlist,
  ThemeConfig,
  AudioSettings,
  Spatial3DSettings,
  KaraokeMode,
  BinauralMode,
  DEFAULT_SPATIAL_SETTINGS,
} from './types/player';
import {
  initializeDefaultLibrary,
  saveTrack,
  deleteTrack,
  savePlaylist,
  deletePlaylist,
  getSetting,
  saveSetting,
  defaultThemeConfig,
  defaultAudioSettings,
} from './services/storage';
import { audioEngine } from './services/audioEngine';
import { getThemeClasses } from './utils/themeHelper';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { PlayerBar } from './components/PlayerBar';
import { MusicLibraryView } from './components/MusicLibraryView';
import { PlaylistsView } from './components/PlaylistsView';
import { ArtistsAlbumsView } from './components/ArtistsAlbumsView';
import { EqualizerView } from './components/EqualizerView';
import { VisualizerView } from './components/VisualizerView';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { TrackEditModal } from './components/TrackEditModal';
import { AudioTrimmerModal } from './components/AudioTrimmerModal';
import { LiquidNowPlayingModal } from './components/LiquidNowPlayingModal';
import { SettingsScreen } from './components/SettingsScreen';
import { VideoToAudioModal } from './components/VideoToAudioModal';
import { TrackContextMenu, AnchorRect } from './components/TrackContextMenu';
import { DriveModeModal } from './components/DriveModeModal';
import { InsightsModal } from './components/InsightsModal';
import { LiquidFluidBackground } from './components/LiquidFluidBackground';
import { SpatialAudioModal } from './components/SpatialAudioModal';
import { BrainwaveBeatsModal } from './components/BrainwaveBeatsModal';
import { KaraokeStudioModal } from './components/KaraokeStudioModal';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [currentTab, setCurrentTab] = useState<string>('music');
  const [theme, setTheme] = useState<ThemeConfig>(defaultThemeConfig);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showLiquidPlayer, setShowLiquidPlayer] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [trimmingTrack, setTrimmingTrack] = useState<Track | null>(null);
  const [globalContextMenuTrack, setGlobalContextMenuTrack] = useState<Track | null>(null);
  const [globalContextMenuAnchor, setGlobalContextMenuAnchor] = useState<AnchorRect | null>(null);
  const [showDriveMode, setShowDriveMode] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showSpatialModal, setShowSpatialModal] = useState(false);
  const [showKaraokeModal, setShowKaraokeModal] = useState(false);
  const [showBrainwaveModal, setShowBrainwaveModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Library & Settings
  useEffect(() => {
    async function loadInitialData() {
      const savedTheme = await getSetting<ThemeConfig>('theme_config', defaultThemeConfig);
      const savedAudio = await getSetting<AudioSettings>('audio_settings', defaultAudioSettings);
      const mergedAudio: AudioSettings = {
        ...defaultAudioSettings,
        ...(savedAudio || {}),
        spatial3D: {
          ...DEFAULT_SPATIAL_SETTINGS,
          ...(savedAudio?.spatial3D || {}),
        },
      };
      setTheme(savedTheme);
      setAudioSettings(mergedAudio);

      document.documentElement.dir = savedTheme.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedTheme.language;

      const { tracks: loadedTracks, playlists: loadedPlaylists } = await initializeDefaultLibrary();
      setTracks(loadedTracks);
      setPlaylists(loadedPlaylists);
      setQueue(loadedTracks);

      if (loadedTracks.length > 0) {
        setCurrentTrack(loadedTracks[0]);
      }
    }
    loadInitialData();
  }, []);

  // Track listening statistics seconds
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setAudioSettings((prev) => {
        const nextSecs = (prev.listeningSeconds || 0) + 1;
        const updated = { ...prev, listeningSeconds: nextSecs };
        saveSetting('audio_settings', updated);
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Sync Audio Settings to Audio Engine
  useEffect(() => {
    audioEngine.setVolumeAndBoost(audioSettings.volume, audioSettings.volumeBoost);
    audioEngine.setBassBoost(audioSettings.bassBoost);
    audioEngine.setVirtualizer(audioSettings.virtualizer);
    audioEngine.setTubeWarmth(audioSettings.tubeWarmth || 0);
    audioEngine.setVolumeNormalizer(audioSettings.volumeNormalizer ?? true);
    audioEngine.setKaraokeMode(audioSettings.karaokeMode || 'off');
    audioEngine.setBinauralBeats(audioSettings.binauralMode || 'off', audioSettings.binauralVolume ?? 25);
    audioEngine.updateSpatialSettings(audioSettings.spatial3D || DEFAULT_SPATIAL_SETTINGS);
    if (audioRef.current) {
      audioRef.current.playbackRate = audioSettings.playbackRate;
    }
  }, [audioSettings]);

  // Handle Audio Element Events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => handleTrackEnded();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [currentTrack, queue, audioSettings.repeatMode, audioSettings.isShuffle]);

  // Neuro-Fade Smart Sleep Timer Countdown (Feature [7])
  useEffect(() => {
    if (!sleepTimerRemaining) {
      audioEngine.resetNeuroFade();
      return;
    }

    // Progressively darken frequencies with low-pass filter when <= 3 minutes left
    if (audioSettings.neuroSleepFade && sleepTimerRemaining <= 3) {
      const fadeProgress = (4 - sleepTimerRemaining) / 4;
      audioEngine.setNeuroFadeProgress(fadeProgress);
    } else {
      audioEngine.resetNeuroFade();
    }

    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (!prev || prev <= 1) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
          audioEngine.resetNeuroFade();
          return null;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [sleepTimerRemaining, audioSettings.neuroSleepFade]);

  // Smart Crossfade & Track Playback Engine (Feature [5])
  const handlePlayTrack = (track: Track, newQueue?: Track[], openLiquidModal: boolean = true) => {
    const audio = audioRef.current;
    if (!audio || !track.blobUrl) return;

    if (newQueue) {
      setQueue(newQueue);
    } else if (!queue.some((t) => t.id === track.id)) {
      setQueue([...queue, track]);
    }

    // Apply smart crossfade if configured
    const crossfadeSecs = audioSettings.crossfade || 0;
    const isCurrentlyPlaying = isPlaying && audio.currentTime > 0;

    const startTrack = () => {
      setCurrentTrack(track);
      audio.src = track.blobUrl!;
      audioEngine.init(audio);
      audioEngine.resume();

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          const updated = { ...track, playCount: track.playCount + 1 };
          saveTrack(updated);
          setTracks((prev) => prev.map((t) => (t.id === track.id ? updated : t)));
        })
        .catch((err) => {
          console.warn('Playback error:', err);
        });

      if (openLiquidModal) {
        setShowLiquidPlayer(true);
      }
    };

    if (isCurrentlyPlaying && crossfadeSecs > 0) {
      // Smooth quick crossfade out before switching to next track
      setTimeout(startTrack, 250);
    } else {
      startTrack();
    }
  };

  const handleUpdateSpatial = (newSpatial: Spatial3DSettings) => {
    handleUpdateAudioSettings({ spatial3D: newSpatial });
    audioEngine.updateSpatialSettings(newSpatial);
  };

  const handleUpdateKaraoke = (mode: KaraokeMode) => {
    handleUpdateAudioSettings({ karaokeMode: mode });
    audioEngine.setKaraokeMode(mode);
  };

  const handleUpdateBinaural = (mode: BinauralMode, vol: number) => {
    handleUpdateAudioSettings({ binauralMode: mode, binauralVolume: vol });
    audioEngine.setBinauralBeats(mode, vol);
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!currentTrack && tracks.length > 0) {
        handlePlayTrack(tracks[0]);
        return;
      }
      audioEngine.init(audio);
      audioEngine.resume();
      audio.play().catch(console.warn);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;

    if (audioSettings.isShuffle) {
      const randomIdx = Math.floor(Math.random() * queue.length);
      handlePlayTrack(queue[randomIdx], undefined, false);
      return;
    }

    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = (currentIdx + 1) % queue.length;
    handlePlayTrack(queue[nextIdx], undefined, false);
  };

  const handlePrev = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;
    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + queue.length) % queue.length;
    handlePlayTrack(queue[prevIdx], undefined, false);
  };

  const handleTrackEnded = () => {
    if (audioSettings.repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (audioSettings.repeatMode === 'all') {
      handleNext();
    } else {
      const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
      if (currentIdx < queue.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (secs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = secs;
      setCurrentTime(secs);
    }
  };

  const handleUpdateAudioSettings = (newSettings: Partial<AudioSettings>) => {
    setAudioSettings((prev) => {
      const updated: AudioSettings = {
        ...prev,
        ...newSettings,
        spatial3D: newSettings.spatial3D
          ? { ...(prev.spatial3D || DEFAULT_SPATIAL_SETTINGS), ...newSettings.spatial3D }
          : (prev.spatial3D || DEFAULT_SPATIAL_SETTINGS),
      };
      saveSetting('audio_settings', updated);
      return updated;
    });
  };

  const handleUpdateTheme = (newTheme: Partial<ThemeConfig>) => {
    const updated = { ...theme, ...newTheme };
    setTheme(updated);
    saveSetting('theme_config', updated);
  };

  const handleToggleFavorite = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    const updated = { ...track, isFavorite: !track.isFavorite };
    await saveTrack(updated);
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(updated);
    }
  };

  const handleAddFiles = async (fileList: FileList) => {
    const newTracks: Track[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isVideo = file.type.startsWith('video/');
      const trackId = `file-${Date.now()}-${i}`;
      const blobUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const track: Track = {
        id: trackId,
        title: cleanTitle,
        artist: 'ملف محلي',
        album: isVideo ? 'استوديو الفيديو' : 'المكتبة الصوتية',
        duration: 0,
        fileBlob: file,
        blobUrl: blobUrl,
        fileType: isVideo ? 'video' : 'audio',
        fileFormat: file.type.split('/')[1] || 'mp3',
        fileSize: file.size,
        dateAdded: Date.now(),
        playCount: 0,
        isFavorite: false,
      };

      await saveTrack(track);
      newTracks.push(track);
    }

    setTracks((prev) => [...newTracks, ...prev]);
    setQueue((prev) => [...newTracks, ...prev]);

    if (newTracks.length > 0 && !currentTrack) {
      handlePlayTrack(newTracks[0]);
    }
  };

  // Move to Recycle Bin (المحذوف مؤخراً)
  const handleDeleteTrack = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    const updated = { ...track, isDeleted: true, deletedAt: Date.now() };
    await saveTrack(updated);
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
    setQueue((prev) => prev.filter((t) => t.id !== trackId));

    if (currentTrack?.id === trackId) {
      const remaining = tracks.filter((t) => t.id !== trackId && !t.isDeleted);
      if (remaining.length > 0) {
        handlePlayTrack(remaining[0], undefined, false);
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    }
  };

  const handleRestoreTrack = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    const updated = { ...track, isDeleted: false, deletedAt: undefined };
    await saveTrack(updated);
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
  };

  const handleUnhideTrack = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    const updated = { ...track, isHidden: false };
    await saveTrack(updated);
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
  };

  const handlePlayNext = (track: Track) => {
    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    const newQueue = [...queue];
    const existingIdx = newQueue.findIndex((t) => t.id === track.id);
    if (existingIdx !== -1) {
      newQueue.splice(existingIdx, 1);
    }
    newQueue.splice(currentIdx + 1, 0, track);
    setQueue(newQueue);
  };

  const handleAddToQueue = (track: Track) => {
    if (!queue.some((t) => t.id === track.id)) {
      setQueue([...queue, track]);
    }
  };

  const handleHideTrack = async (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    const updated = { ...track, isHidden: true };
    await saveTrack(updated);
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handlePermanentDeleteTrack = async (trackId: string) => {
    await deleteTrack(trackId);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleAddToPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    if (!playlist.trackIds.includes(trackId)) {
      const updated = { ...playlist, trackIds: [...playlist.trackIds, trackId] };
      await savePlaylist(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    }
  };

  const handleCreatePlaylist = async (newPl: Playlist) => {
    await savePlaylist(newPl);
    setPlaylists((prev) => [...prev, newPl]);
  };

  const handleCreatePlaylistAndAdd = async (name: string, trackId: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description: 'قائمة مخصصة جديدة',
      trackIds: [trackId],
      createdAt: Date.now(),
      coverColor: '#00f2fe',
      autoSort: 'title-asc',
    };
    await handleCreatePlaylist(newPl);
  };

  const handleUpdatePlaylist = async (updated: Playlist) => {
    await savePlaylist(updated);
    setPlaylists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePlaylist = async (id: string) => {
    await deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveLyrics = async (trackId: string, lyrics: string) => {
    const trk = tracks.find((t) => t.id === trackId);
    if (!trk) return;
    const updated = { ...trk, lyrics };
    await saveTrack(updated);
    setTracks((prev) => prev.map((t) => (t.id === trackId ? updated : t)));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(updated);
    }
  };

  const { bgClass, accentHex } = getThemeClasses(theme);

  // Filter out deleted and hidden tracks from main active views
  const activeDisplayTracks = tracks.filter((t) => !t.isDeleted && !t.isHidden);

  return (
    <div className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden transition-colors duration-300 ${bgClass}`}>
      {/* Reactive Fluid Ambient Glow & Touch Ripple Canvas (Feature 1) */}
      <LiquidFluidBackground
        accentHex={accentHex}
        theme={theme}
        isPlaying={isPlaying}
      />

      {/* Hidden Master Audio Element */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="auto"
        className="hidden"
      />

      {/* Top App Navbar with Category Navigation like Screenshot 2 */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        theme={theme}
        accentHex={accentHex}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDriveMode={() => setShowDriveMode(true)}
        onOpenInsights={() => setShowInsights(true)}
      />

      {/* Main Content Viewport with Tab Transitions */}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-7xl mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          {currentTab === 'music' && (
            <motion.div
              key="music"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <MusicLibraryView
                tracks={activeDisplayTracks}
                playlists={playlists}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                theme={theme}
                accentHex={accentHex}
                onPlayTrack={handlePlayTrack}
                onPlayNext={handlePlayNext}
                onAddToQueue={handleAddToQueue}
                onTogglePlay={handleTogglePlay}
                onToggleFavorite={handleToggleFavorite}
                onAddFiles={handleAddFiles}
                onDeleteTrack={handleDeleteTrack}
                onAddToPlaylist={handleAddToPlaylist}
                onCreatePlaylistAndAdd={handleCreatePlaylistAndAdd}
                onOpenTrimmer={(track) => setTrimmingTrack(track)}
                onOpenEditor={(track) => setEditingTrack(track)}
                onHideTrack={handleHideTrack}
                onBoost300={() => handleUpdateAudioSettings({ volumeBoost: 300 })}
                onOpenEqualizer={() => setCurrentTab('equalizer')}
                onOpenLiquidPlayer={() => setShowLiquidPlayer(true)}
              />
            </motion.div>
          )}

          {currentTab === 'playlists' && (
            <motion.div
              key="playlists"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <PlaylistsView
                playlists={playlists}
                tracks={activeDisplayTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                theme={theme}
                accentHex={accentHex}
                onPlayTrack={handlePlayTrack}
                onCreatePlaylist={handleCreatePlaylist}
                onUpdatePlaylist={handleUpdatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onPlayNext={handlePlayNext}
                onAddToQueue={handleAddToQueue}
                onToggleFavorite={handleToggleFavorite}
                onAddToPlaylist={handleAddToPlaylist}
                onCreatePlaylistAndAdd={handleCreatePlaylistAndAdd}
                onOpenTrimmer={(track) => setTrimmingTrack(track)}
                onOpenEditor={(track) => setEditingTrack(track)}
                onHideTrack={handleHideTrack}
                onDeleteTrack={handleDeleteTrack}
                onBoost300={() => handleUpdateAudioSettings({ volumeBoost: 300 })}
                onOpenEqualizer={() => setCurrentTab('equalizer')}
                onOpenLiquidPlayer={() => setShowLiquidPlayer(true)}
              />
            </motion.div>
          )}

          {(currentTab === 'artists' || currentTab === 'albums' || currentTab === 'folders') && (
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ArtistsAlbumsView
                type={currentTab as 'artists' | 'albums' | 'folders'}
                tracks={activeDisplayTracks}
                theme={theme}
                accentHex={accentHex}
                onPlayTrack={handlePlayTrack}
              />
            </motion.div>
          )}

          {currentTab === 'equalizer' && (
            <motion.div
              key="equalizer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <EqualizerView
                settings={audioSettings}
                theme={theme}
                accentHex={accentHex}
                onUpdateSettings={handleUpdateAudioSettings}
              />
            </motion.div>
          )}

          {currentTab === 'visualizer' && (
            <motion.div
              key="visualizer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <VisualizerView
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                theme={theme}
                accentHex={accentHex}
                onTogglePlay={handleTogglePlay}
                onNext={handleNext}
                onPrev={handlePrev}
                onUpdateTheme={handleUpdateTheme}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Bottom Player Controller */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        settings={audioSettings}
        theme={theme}
        accentHex={accentHex}
        sleepTimerMinutes={sleepTimerRemaining}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onUpdateSettings={handleUpdateAudioSettings}
        onToggleFavorite={handleToggleFavorite}
        onOpenEqualizer={() => setCurrentTab('equalizer')}
        onOpenVisualizer={() => setCurrentTab('visualizer')}
        onOpenSleepTimer={() => setShowSleepTimerModal(true)}
        onOpenLiquidPlayer={() => setShowLiquidPlayer(true)}
        onOpenTrackMenu={(track, rect) => {
          setGlobalContextMenuTrack(track);
          setGlobalContextMenuAnchor(rect);
        }}
        onOpenSpatialModal={() => setShowSpatialModal(true)}
        onOpenKaraokeModal={() => setShowKaraokeModal(true)}
        onOpenBrainwaveModal={() => setShowBrainwaveModal(true)}
      />

      {/* Expanded Liquid Glass Now Playing Screen */}
      <LiquidNowPlayingModal
        isOpen={showLiquidPlayer}
        onClose={() => setShowLiquidPlayer(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        settings={audioSettings}
        theme={theme}
        accentHex={accentHex}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onUpdateSettings={handleUpdateAudioSettings}
        onToggleFavorite={handleToggleFavorite}
        onOpenEqualizer={() => {
          setShowLiquidPlayer(false);
          setCurrentTab('equalizer');
        }}
        onOpenTrackMenu={(track, rect) => {
          setGlobalContextMenuTrack(track);
          setGlobalContextMenuAnchor(rect);
        }}
        onOpenDriveMode={() => {
          setShowLiquidPlayer(false);
          setShowDriveMode(true);
        }}
        onSaveLyrics={handleSaveLyrics}
        onOpenSpatialModal={() => setShowSpatialModal(true)}
        onOpenKaraokeModal={() => setShowKaraokeModal(true)}
        onOpenBrainwaveModal={() => setShowBrainwaveModal(true)}
      />

      {/* Settings Screen matching Screenshot 1 */}
      <SettingsScreen
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        accentHex={accentHex}
        audioSettings={audioSettings}
        tracks={tracks}
        playlists={playlists}
        onOpenThemeCustomizer={() => setShowThemeModal(true)}
        onOpenSleepTimer={() => setShowSleepTimerModal(true)}
        onOpenVideoConverter={() => setShowVideoModal(true)}
        onOpenAudioTrimmer={(trk) => setTrimmingTrack(trk)}
        onUpdateAudioSettings={handleUpdateAudioSettings}
        onUpdateTheme={handleUpdateTheme}
        onRestoreTrack={handleRestoreTrack}
        onUnhideTrack={handleUnhideTrack}
        onPermanentDeleteTrack={handlePermanentDeleteTrack}
      />

      {/* Dedicated Video-to-Audio Studio Converter (opened from Settings as requested) */}
      <VideoToAudioModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        tracks={tracks}
        theme={theme}
        accentHex={accentHex}
        onAddTrack={async (newTrack) => {
          await saveTrack(newTrack);
          setTracks((prev) => [newTrack, ...prev]);
          setQueue((prev) => [newTrack, ...prev]);
        }}
        onPlayTrack={handlePlayTrack}
      />

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        theme={theme}
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onUpdateTheme={handleUpdateTheme}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={showSleepTimerModal}
        activeMinutes={sleepTimerRemaining}
        onClose={() => setShowSleepTimerModal(false)}
        onSetTimer={(min) => setSleepTimerRemaining(min)}
        onCancelTimer={() => setSleepTimerRemaining(null)}
        neuroSleepFade={audioSettings.neuroSleepFade}
        onToggleNeuroSleepFade={(enabled) => handleUpdateAudioSettings({ neuroSleepFade: enabled })}
      />

      {/* Track Tags Editor Modal */}
      <TrackEditModal
        track={editingTrack}
        isOpen={Boolean(editingTrack)}
        onClose={() => setEditingTrack(null)}
        onSave={async (updated) => {
          await saveTrack(updated);
          setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          if (currentTrack?.id === updated.id) setCurrentTrack(updated);
        }}
      />

      {/* Audio Trimmer / Ringtone Maker Modal */}
      <AudioTrimmerModal
        track={trimmingTrack}
        isOpen={Boolean(trimmingTrack)}
        onClose={() => setTrimmingTrack(null)}
        onSaveTrimmed={async (trimmedTrack) => {
          await saveTrack(trimmedTrack);
          setTracks((prev) => [trimmedTrack, ...prev]);
          setQueue((prev) => [trimmedTrack, ...prev]);
          handlePlayTrack(trimmedTrack);
        }}
      />

      {/* Global Floating Context Menu for PlayerBar & LiquidPlayer */}
      <TrackContextMenu
        track={globalContextMenuTrack}
        isOpen={Boolean(globalContextMenuTrack)}
        anchorRect={globalContextMenuAnchor}
        playlists={playlists}
        theme={theme}
        accentHex={accentHex}
        onClose={() => {
          setGlobalContextMenuTrack(null);
          setGlobalContextMenuAnchor(null);
        }}
        onPlayNow={(trk) => handlePlayTrack(trk)}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        onToggleFavorite={handleToggleFavorite}
        onAddToPlaylist={handleAddToPlaylist}
        onCreatePlaylistAndAdd={handleCreatePlaylistAndAdd}
        onOpenTrimmer={(trk) => setTrimmingTrack(trk)}
        onOpenEditor={(trk) => setEditingTrack(trk)}
        onHideTrack={handleHideTrack}
        onDeleteTrack={handleDeleteTrack}
        onBoost300={() => handleUpdateAudioSettings({ volumeBoost: 300 })}
        onOpenEqualizer={() => setCurrentTab('equalizer')}
        onOpenLiquidPlayer={() => setShowLiquidPlayer(true)}
      />

      {/* Fullscreen Driving Mode */}
      <DriveModeModal
        isOpen={showDriveMode}
        onClose={() => setShowDriveMode(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        settings={audioSettings}
        accentHex={accentHex}
        theme={theme}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onToggleFavorite={handleToggleFavorite}
        onUpdateSettings={handleUpdateAudioSettings}
      />

      {/* Listening Insights and Analytics Modal */}
      <InsightsModal
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        tracks={tracks}
        playlists={playlists}
        settings={audioSettings}
        accentHex={accentHex}
        theme={theme}
        onPlayTrack={handlePlayTrack}
      />

      {/* 3D Spatial Audio Sphere Modal (Feature [1]) */}
      <SpatialAudioModal
        isOpen={showSpatialModal}
        onClose={() => setShowSpatialModal(false)}
        settings={audioSettings.spatial3D || DEFAULT_SPATIAL_SETTINGS}
        onUpdateSpatial={handleUpdateSpatial}
        accentHex={accentHex}
        theme={theme}
      />

      {/* Brainwave Entrainment & Binaural Beats Generator Modal (Feature [2]) */}
      <BrainwaveBeatsModal
        isOpen={showBrainwaveModal}
        onClose={() => setShowBrainwaveModal(false)}
        binauralMode={audioSettings.binauralMode || 'off'}
        binauralVolume={audioSettings.binauralVolume ?? 25}
        onUpdateBinaural={handleUpdateBinaural}
        accentHex={accentHex}
        theme={theme}
      />

      {/* Real-time AI Karaoke & Vocal Suppressor Studio Modal (Feature [3]) */}
      <KaraokeStudioModal
        isOpen={showKaraokeModal}
        onClose={() => setShowKaraokeModal(false)}
        karaokeMode={audioSettings.karaokeMode || 'off'}
        onUpdateKaraokeMode={handleUpdateKaraoke}
        onOpenLyrics={() => setShowLiquidPlayer(true)}
        currentTrack={currentTrack}
        accentHex={accentHex}
        theme={theme}
      />
    </div>
  );
}
