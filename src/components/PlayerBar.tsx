import React, { useEffect, useRef, useState } from 'react';
import { Track, AudioSettings, ThemeConfig } from '../types/player';
import { translations } from '../utils/translations';
import { AnchorRect } from './TrackContextMenu';
import { audioEngine } from '../services/audioEngine';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Music,
  Video,
  Sliders,
  MoreVertical,
  Compass,
  Mic,
  Brain,
  Sparkles,
} from 'lucide-react';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  settings: AudioSettings;
  theme: ThemeConfig;
  accentHex: string;
  sleepTimerMinutes: number | null;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenEqualizer: () => void;
  onOpenVisualizer: () => void;
  onOpenSleepTimer: () => void;
  onOpenVideoStudio?: () => void;
  onOpenLiquidPlayer: () => void;
  onOpenTrackMenu?: (track: Track, anchorRect: AnchorRect) => void;
  onOpenSpatialModal?: () => void;
  onOpenKaraokeModal?: () => void;
  onOpenBrainwaveModal?: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  settings,
  theme,
  accentHex,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleFavorite,
  onOpenLiquidPlayer,
  onOpenEqualizer,
  onOpenTrackMenu,
  onOpenSpatialModal,
  onOpenKaraokeModal,
  onOpenBrainwaveModal,
}) => {
  const t = translations[theme.language];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const [waveHeights, setWaveHeights] = useState<number[]>([4, 6, 8, 5, 7]);

  // Mini live equalizer waveform bars inside the Dynamic Island Pill
  useEffect(() => {
    if (!isPlaying) {
      setWaveHeights([3, 3, 3, 3, 3]);
      return;
    }

    const interval = setInterval(() => {
      setWaveHeights([
        Math.floor(3 + Math.random() * 12),
        Math.floor(4 + Math.random() * 14),
        Math.floor(3 + Math.random() * 16),
        Math.floor(4 + Math.random() * 13),
        Math.floor(3 + Math.random() * 11),
      ]);
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <footer className="fixed bottom-3 inset-x-2 sm:inset-x-8 md:max-w-4xl md:mx-auto z-40 transition-all duration-300">
      {/* Floating Dynamic Pill Container */}
      <div
        className="relative rounded-[32px] border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(0,242,254,0.1)] p-2.5 sm:px-4 sm:py-2.5 overflow-hidden flex flex-col gap-1.5 backdrop-blur-[35px] transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 22, 38, 0.88) 0%, rgba(8, 11, 20, 0.94) 100%)',
        }}
      >
        {/* Specular Rim Light */}
        <div className="absolute top-0 inset-x-10 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 pointer-events-none" />

        {/* Slim Liquid Progress Scrubber Bar on Top */}
        <div
          className="relative h-1.5 rounded-full bg-white/10 cursor-pointer group overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
            onSeek(ratio * duration);
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-150 relative"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: accentHex,
              boxShadow: `0 0 12px ${accentHex}`,
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
          </div>
        </div>

        {/* Dynamic Island Pill Content */}
        <div className="flex items-center justify-between gap-3">
          {/* Track Info (Click anywhere to open Liquid Now Playing Screen) */}
          <div
            onClick={onOpenLiquidPlayer}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group select-none"
            title="انقر لفتح واجهة المشغل الكاملة (Liquid Player)"
          >
            {/* Album Artwork Thumbnail with live audio indicator */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center shadow-lg group-hover:border-cyan-400/80 transition-colors">
              {currentTrack?.coverArt ? (
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : currentTrack?.fileType === 'video' ? (
                <Video className="w-5 h-5 text-purple-400" />
              ) : (
                <Music className="w-5 h-5 text-cyan-400" />
              )}

              {/* Dynamic Waveform Bars overlay on album art */}
              {isPlaying && (
                <div className="absolute inset-x-0 bottom-1 flex items-end justify-center gap-0.5 px-1 h-3 pointer-events-none">
                  {waveHeights.map((h, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#00f2fe]"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Title, Artist and Futuristic Mode Badges */}
            <div className="min-w-0 pr-1 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {currentTrack ? currentTrack.title : 'لم يتم اختيار مقطع'}
                </h4>
                {/* 3D Spatial active badge */}
                {settings?.spatial3D?.enabled && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                    3D
                  </span>
                )}
                {/* Karaoke active badge */}
                {settings?.karaokeMode && settings.karaokeMode !== 'off' && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                    KARAOKE
                  </span>
                )}
                {/* Binaural active badge */}
                {settings?.binauralMode && settings.binauralMode !== 'off' && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    BEATS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-slate-400 truncate">
                  {currentTrack ? currentTrack.artist : 'SoundPulse Studio'}
                </p>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] font-semibold text-cyan-400/90 whitespace-nowrap">
                  by Abdallah Mahmoud
                </span>
              </div>
            </div>
          </div>

          {/* Controls Dock */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick 3D Spatial Audio Button */}
            {onOpenSpatialModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSpatialModal();
                }}
                className={`p-2 rounded-2xl transition cursor-pointer border ${
                  settings?.spatial3D?.enabled
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    : 'hover:bg-white/10 text-slate-400 border-transparent'
                }`}
                title="المسرح الصوتي ثلاثي الأبعاد 3D"
              >
                <Compass className="w-4 h-4" />
              </button>
            )}

            {/* Quick Karaoke Button */}
            {onOpenKaraokeModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenKaraokeModal();
                }}
                className={`p-2 rounded-2xl transition cursor-pointer border ${
                  settings?.karaokeMode && settings.karaokeMode !== 'off'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'hover:bg-white/10 text-slate-400 border-transparent'
                }`}
                title="استوديو الكاريوكي وعزل الصوت"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Quick Binaural Beats Button */}
            {onOpenBrainwaveModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBrainwaveModal();
                }}
                className={`hidden md:flex p-2 rounded-2xl transition cursor-pointer border ${
                  settings?.binauralMode && settings.binauralMode !== 'off'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : 'hover:bg-white/10 text-slate-400 border-transparent'
                }`}
                title="موجات الدماغ ومحفزات التركيز"
              >
                <Brain className="w-4 h-4" />
              </button>
            )}

            {/* Favorite button */}
            {currentTrack && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(currentTrack.id);
                }}
                className="p-2 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="إضافة للمفضلة"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    currentTrack.isFavorite ? 'text-rose-500 fill-rose-500' : ''
                  }`}
                />
              </button>
            )}

            {/* 3-Dots Quick Menu trigger */}
            {currentTrack && onOpenTrackMenu && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  onOpenTrackMenu(currentTrack, {
                    top: rect.top,
                    bottom: rect.bottom,
                    left: rect.left,
                    right: rect.right,
                    width: rect.width,
                    height: rect.height,
                  });
                }}
                className="p-2 rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                title="خيارات الأغنية الحالية"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}

            {/* Previous */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="hidden sm:flex p-2 rounded-2xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title={t.actions.prev}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Primary Play/Pause Button with Liquid Spring Physics */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              title={isPlaying ? t.actions.pause : t.actions.play}
              className="w-11 h-11 rounded-full flex items-center justify-center text-black font-extrabold transition-all active:scale-85 hover:scale-105 cursor-pointer shadow-xl hover:brightness-110 shrink-0"
              style={{
                backgroundColor: accentHex,
                boxShadow: `0 0 20px ${accentHex}99`,
              }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black translate-x-0.5" />
              )}
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              title={t.actions.next}
              className="p-2 rounded-2xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer active:scale-90"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
