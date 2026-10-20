import React, { useState, useEffect } from 'react';
import { Track, AudioSettings, ThemeConfig } from '../types/player';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Zap,
  X,
  Volume2,
  Car,
  Clock,
  Sparkles,
  Music,
} from 'lucide-react';

interface DriveModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  settings: AudioSettings;
  accentHex: string;
  theme: ThemeConfig;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleFavorite: (trackId: string) => void;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
}

export const DriveModeModal: React.FC<DriveModeModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  settings,
  accentHex,
  theme,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleFavorite,
  onUpdateSettings,
}) => {
  const [clockStr, setClockStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockStr(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isTurbo = settings.volumeBoost > 100;

  return (
    <div className="fixed inset-0 z-[10000] bg-black text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] opacity-20 pointer-events-none"
        style={{ backgroundColor: accentHex }}
      />

      {/* Top Bar: Car Mode Indicator, Clock, Exit Button */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 border border-white/10">
          <Car className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold tracking-wide">وضع القيادة السريع</span>
        </div>

        <div className="flex items-center gap-2 text-lg font-mono font-bold text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{clockStr}</span>
        </div>

        <button
          onClick={onClose}
          className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-white cursor-pointer"
          title="الخروج من وضع القيادة"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Stage: Huge Track Info & Artwork */}
      <div className="relative z-10 my-auto flex flex-col sm:flex-row items-center justify-center gap-8 max-w-4xl mx-auto w-full text-center sm:text-right">
        {/* Giant Glowing Cover Artwork */}
        <div
          className="w-56 h-56 sm:w-72 sm:h-72 rounded-[32px] overflow-hidden bg-slate-900 border-4 border-white/20 shadow-2xl flex items-center justify-center shrink-0 transition-transform"
          style={{
            boxShadow: `0 0 50px ${accentHex}40`,
          }}
        >
          {currentTrack?.coverArt ? (
            <img
              src={currentTrack.coverArt}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="w-24 h-24 text-cyan-400" />
          )}
        </div>

        {/* Huge Title & Artist */}
        <div className="space-y-3 min-w-0 max-w-lg">
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight line-clamp-2">
            {currentTrack ? currentTrack.title : 'لم يتم اختيار مقطع'}
          </h1>
          <p className="text-base sm:text-2xl text-slate-300 font-semibold line-clamp-1">
            {currentTrack ? currentTrack.artist : 'SoundPulse Studio'}
          </p>
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
            <span className="text-xs font-mono text-cyan-400">
              {Math.floor(currentTime / 60)}:
              {(Math.floor(currentTime) % 60).toString().padStart(2, '0')} /{' '}
              {Math.floor(duration / 60)}:
              {(Math.floor(duration) % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Scrubber progress indicator */}
      <div className="relative z-10 w-full h-2 rounded-full bg-white/15 overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-200"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: accentHex,
            boxShadow: `0 0 15px ${accentHex}`,
          }}
        />
      </div>

      {/* Bottom Giant Road Controls */}
      <div className="relative z-10 space-y-4 max-w-3xl mx-auto w-full">
        {/* Main Drive Buttons: Favorite, Prev, Huge Play/Pause, Next, 300% Boost */}
        <div className="flex items-center justify-between gap-4">
          {/* Big Favorite Button */}
          {currentTrack && (
            <button
              onClick={() => onToggleFavorite(currentTrack.id)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition cursor-pointer"
              title="المفضلة"
            >
              <Heart
                className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  currentTrack.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-white'
                }`}
              />
            </button>
          )}

          {/* Big Prev Button */}
          <button
            onClick={onPrev}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition text-white cursor-pointer"
            title="السابق"
          >
            <SkipBack className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>

          {/* Giant Play/Pause Center Button (88px!) */}
          <button
            onClick={onTogglePlay}
            className="w-22 h-22 sm:w-26 sm:h-26 rounded-full flex items-center justify-center text-black font-black transition transform active:scale-90 hover:scale-105 cursor-pointer shadow-2xl hover:brightness-110"
            style={{
              backgroundColor: accentHex,
              boxShadow: `0 0 45px ${accentHex}99`,
            }}
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 sm:w-12 sm:h-12 fill-black" />
            ) : (
              <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-black translate-x-1" />
            )}
          </button>

          {/* Big Next Button */}
          <button
            onClick={onNext}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition text-white cursor-pointer"
            title="التالي"
          >
            <SkipForward className="w-8 h-8 sm:w-10 sm:h-10" />
          </button>

          {/* Giant 300% Boost Button */}
          <button
            onClick={() => {
              onUpdateSettings({ volumeBoost: isTurbo ? 100 : 300 });
            }}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex flex-col items-center justify-center transition active:scale-90 cursor-pointer ${
              isTurbo
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50 font-black'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
            title="مضخم الصوت 300%"
          >
            <Zap className={`w-6 h-6 sm:w-8 sm:h-8 ${isTurbo ? 'fill-black' : ''}`} />
            <span className="text-[10px] sm:text-xs font-bold mt-0.5">300%</span>
          </button>
        </div>

        {/* Small Signature Watermark */}
        <div className="text-center pt-2">
          <span className="text-xs font-medium text-slate-500">
            SoundPulse Drive Mode · by Abdallah Mahmoud
          </span>
        </div>
      </div>
    </div>
  );
};
