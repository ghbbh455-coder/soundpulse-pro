import React, { useState, useEffect, useRef } from 'react';
import { Track, AudioSettings, ThemeConfig } from '../types/player';
import { VisualizerCanvas } from './VisualizerCanvas';
import { translations } from '../utils/translations';
import { AnchorRect } from './TrackContextMenu';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  Zap,
  Sliders,
  Disc,
  Activity,
  Sparkles,
  Share2,
  MoreVertical,
  AlignLeft,
  Edit2,
  Save,
  X,
  Gauge,
  Flame,
  Moon,
  Car,
  Compass,
  Brain,
  Mic,
} from 'lucide-react';

interface LiquidNowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  settings: AudioSettings;
  theme: ThemeConfig;
  accentHex: string;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenEqualizer: () => void;
  onOpenTrackMenu?: (track: Track, anchorRect: AnchorRect) => void;
  onOpenDriveMode?: () => void;
  onSaveLyrics?: (trackId: string, lyrics: string) => Promise<void>;
  onOpenSpatialModal?: () => void;
  onOpenKaraokeModal?: () => void;
  onOpenBrainwaveModal?: () => void;
}

interface ParsedLyricLine {
  time: number;
  text: string;
}

export const LiquidNowPlayingModal: React.FC<LiquidNowPlayingModalProps> = ({
  isOpen,
  onClose,
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
  onUpdateSettings,
  onToggleFavorite,
  onOpenEqualizer,
  onOpenTrackMenu,
  onOpenDriveMode,
  onSaveLyrics,
  onOpenSpatialModal,
  onOpenKaraokeModal,
  onOpenBrainwaveModal,
}) => {
  const t = translations[theme.language];
  const [activeCenterView, setActiveCenterView] = useState<'art' | 'visualizer' | 'lyrics'>('art');
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [lyricsDraft, setLyricsDraft] = useState('');
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync lyrics draft when track changes
  useEffect(() => {
    if (currentTrack) {
      setLyricsDraft(currentTrack.lyrics || '');
      setIsEditingLyrics(false);
    }
  }, [currentTrack?.id, currentTrack?.lyrics]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRepeatCycle = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(settings.repeatMode) + 1) % modes.length;
    onUpdateSettings({ repeatMode: modes[nextIdx] });
  };

  // Parse lyrics into synchronized timestamped lines
  const parseLyrics = (rawText: string, trackDuration: number): ParsedLyricLine[] => {
    if (!rawText.trim()) return [];
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const hasTimestamps = lines.some((l) => /\[\d{2}:\d{2}/.test(l));

    if (hasTimestamps) {
      const parsed: ParsedLyricLine[] = [];
      const regex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/;

      lines.forEach((line) => {
        const match = line.match(regex);
        if (match) {
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
          const time = mins * 60 + secs + ms / 1000;
          parsed.push({ time, text: match[4].trim() });
        } else {
          parsed.push({ time: 0, text: line.trim() });
        }
      });
      return parsed.sort((a, b) => a.time - b.time);
    } else {
      // Evenly distribute non-timestamped lines across track duration
      const totalLines = lines.length;
      const step = totalLines > 1 ? trackDuration / totalLines : 0;
      return lines.map((text, idx) => ({
        time: idx * step,
        text: text.trim(),
      }));
    }
  };

  const parsedLyrics = currentTrack ? parseLyrics(currentTrack.lyrics || '', duration || 180) : [];

  // Determine current active lyric line
  let activeLyricIndex = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currentTime >= parsedLyrics[i].time) {
      activeLyricIndex = i;
    } else {
      break;
    }
  }

  // Smoothly auto-scroll active lyric into center
  useEffect(() => {
    if (activeCenterView === 'lyrics' && lyricsContainerRef.current && activeLyricIndex >= 0) {
      const activeEl = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, activeCenterView]);

  if (!isOpen || !currentTrack) return null;

  const handleSaveLyricsSubmit = async () => {
    if (onSaveLyrics) {
      await onSaveLyrics(currentTrack.id, lyricsDraft);
    }
    currentTrack.lyrics = lyricsDraft;
    setIsEditingLyrics(false);
  };

  const isTurbo = settings.volumeBoost > 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-300">
      {/* Liquid Backdrop Blur with Floating Colored Mesh */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-3xl transition-opacity duration-500"
        onClick={onClose}
      />

      {/* Floating Morphing Liquid Orbs */}
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-[140px] opacity-30 pointer-events-none animate-liquid-1"
        style={{ backgroundColor: accentHex }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full blur-[160px] opacity-25 pointer-events-none animate-liquid-2"
        style={{ backgroundColor: '#a855f7' }}
      />

      {/* Main Liquid Glass Shell */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-xl max-h-[96vh] flex flex-col justify-between p-6 sm:p-8 rounded-[36px] liquid-glass text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-white/15 overflow-y-auto"
        style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(20, 24, 40, 0.5) 100%)',
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 cursor-pointer shadow-sm"
            title="تصغير الواجهة للرجوع للمكتبة"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Mode switch tabs: Album Art vs Visualizer vs Lyrics */}
          <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setActiveCenterView('art')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCenterView === 'art'
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>الغلاف</span>
            </button>

            <button
              onClick={() => setActiveCenterView('visualizer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCenterView === 'visualizer'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>المحلل</span>
            </button>

            <button
              onClick={() => setActiveCenterView('lyrics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCenterView === 'lyrics'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>الكلمات</span>
            </button>
          </div>

          {/* Quick Header Actions: Drive Mode, EQ, 3-Dots Menu */}
          <div className="flex items-center gap-1.5">
            {onOpenDriveMode && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDriveMode();
                }}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 cursor-pointer shadow-sm"
                title="وضع القيادة السريع"
              >
                <Car className="w-5 h-5 text-amber-400" />
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenEqualizer();
              }}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 cursor-pointer shadow-sm"
              title="فتح المعادل الصوتي"
            >
              <Sliders className="w-5 h-5 text-cyan-400" />
            </button>

            {onOpenTrackMenu && currentTrack && (
              <button
                onClick={(e) => {
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
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
                title="المزيد من خيارات الأغنية"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Stage: Album Art with Vinyl / Visualizer / Lyrics */}
        <div className="my-3 flex items-center justify-center min-h-[260px] sm:min-h-[290px]">
          {activeCenterView === 'art' ? (
            <div className="relative group flex items-center justify-center">
              {/* Spinning Vinyl Record Peek Out Effect */}
              <div
                className={`absolute w-56 h-56 sm:w-68 sm:h-68 rounded-full bg-slate-950 border-2 border-white/10 shadow-2xl flex items-center justify-center transition-all duration-700 pointer-events-none ${
                  isPlaying ? 'translate-x-12 rotate-180 animate-spin [animation-duration:10s]' : 'translate-x-0 rotate-0'
                }`}
              >
                <div className="w-48 h-48 rounded-full border border-white/5" />
                <div className="absolute w-36 h-36 rounded-full border border-white/5" />
                <div
                  className="absolute w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: accentHex }}
                >
                  <div className="w-4 h-4 rounded-full bg-black border border-white/40" />
                </div>
              </div>

              {/* Main Album Sleeve Card with Liquid Glass Border */}
              <div className="relative z-10 w-60 h-60 sm:w-72 sm:h-72 rounded-[28px] overflow-hidden bg-slate-900 border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-300">
                {currentTrack.coverArt ? (
                  <img
                    src={currentTrack.coverArt}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${accentHex}33 0%, #0a0b14 100%)`,
                    }}
                  >
                    <Disc className="w-16 h-16 text-cyan-400 mb-2 animate-spin [animation-duration:12s]" />
                    <span className="text-sm font-bold text-white line-clamp-2">
                      {currentTrack.title}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
              </div>
            </div>
          ) : activeCenterView === 'visualizer' ? (
            /* Immersive Visualizer Canvas */
            <div className="w-full h-64 sm:h-72 rounded-3xl bg-black/40 border border-white/10 p-2 overflow-hidden backdrop-blur-xl">
              <VisualizerCanvas
                isPlaying={isPlaying}
                theme={theme}
                accentHex={accentHex}
                activeTrack={currentTrack}
                className="w-full h-full"
              />
            </div>
          ) : (
            /* Synchronized Interactive Lyrics View */
            <div className="w-full h-64 sm:h-72 rounded-3xl bg-black/50 border border-white/10 p-4 overflow-hidden backdrop-blur-xl flex flex-col justify-between relative">
              {isEditingLyrics ? (
                /* Lyrics Editor */
                <div className="flex-1 flex flex-col space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="text-xs font-bold text-cyan-400">تعديل كلمات الأغنية</span>
                    <button
                      onClick={() => setIsEditingLyrics(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={lyricsDraft}
                    onChange={(e) => setLyricsDraft(e.target.value)}
                    placeholder="الصق الكلمات هنا، يمكنك كتابة التوقيت مثل [00:15.00] أو نص عادي سطراً بسطر..."
                    className="flex-1 w-full bg-slate-950/70 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-mono"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsEditingLyrics(false)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-slate-300 hover:bg-white/15"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveLyricsSubmit}
                      className="px-4 py-1.5 rounded-xl text-black font-bold text-xs flex items-center gap-1.5 shadow-md"
                      style={{ backgroundColor: accentHex }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ الكلمات</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Karaoke Scrolling View */
                <>
                  <div
                    ref={lyricsContainerRef}
                    className="flex-1 overflow-y-auto space-y-4 py-6 text-center select-none scrollbar-none"
                  >
                    {parsedLyrics.length === 0 ? (
                      <div className="py-12 space-y-3">
                        <AlignLeft className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-sm font-bold text-slate-300">لا توجد كلمات مسجلة لهذا المقطع</p>
                        <button
                          onClick={() => setIsEditingLyrics(true)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md cursor-pointer inline-flex items-center gap-1.5"
                          style={{ backgroundColor: accentHex }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>إضافة كلمات الأغنية</span>
                        </button>
                      </div>
                    ) : (
                      parsedLyrics.map((line, idx) => {
                        const isActive = idx === activeLyricIndex;
                        return (
                          <p
                            key={idx}
                            onClick={() => onSeek(line.time)}
                            className={`transition-all duration-300 cursor-pointer font-bold ${
                              isActive
                                ? 'text-lg sm:text-xl font-black scale-105 drop-shadow-[0_0_15px_rgba(0,242,254,0.7)]'
                                : 'text-xs sm:text-sm text-slate-500 hover:text-slate-300'
                            }`}
                            style={isActive ? { color: accentHex } : {}}
                          >
                            {line.text}
                          </p>
                        );
                      })
                    )}
                  </div>

                  {/* Lyrics Bottom Controls: Edit button */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                    <span>انقر على أي سطر للانتقال للتوقيت</span>
                    <button
                      onClick={() => setIsEditingLyrics(true)}
                      className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer font-bold"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>تعديل الكلمات</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Track Title, Artist & Favorite */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow-md">
                {currentTrack.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium truncate mt-0.5">
                {currentTrack.artist} {currentTrack.album ? `· ${currentTrack.album}` : ''}
              </p>
            </div>

            <button
              onClick={() => onToggleFavorite(currentTrack.id)}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all active:scale-90 cursor-pointer shadow-md shrink-0"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  currentTrack.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Ergonomic Liquid Scrubber */}
        <div className="mt-3 space-y-1">
          <div className="relative flex items-center h-5">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              aria-label="Seek track"
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 transition-all"
              style={{
                background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${
                  duration ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.15) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.15) 100%)`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls: Shuffle, Prev, Big Glowing Play, Next, Repeat */}
        <div className="my-2.5 flex items-center justify-between px-2 sm:px-6">
          <button
            onClick={() => onUpdateSettings({ isShuffle: !settings.isShuffle })}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              settings.isShuffle
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-400/40 shadow-lg'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
            title={t.actions.shuffle}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={onPrev}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all active:scale-95 cursor-pointer shadow-md"
            title={t.actions.prev}
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Big Glowing Play / Pause Glass Orb */}
          <button
            onClick={onTogglePlay}
            className="w-18 h-18 rounded-full flex items-center justify-center text-black font-extrabold transition-all transform active:scale-90 hover:scale-105 cursor-pointer shadow-2xl hover:brightness-110"
            style={{
              backgroundColor: accentHex,
              boxShadow: `0 0 35px ${accentHex}99`,
            }}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-black" />
            ) : (
              <Play className="w-8 h-8 fill-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all active:scale-95 cursor-pointer shadow-md"
            title={t.actions.next}
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={handleRepeatCycle}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              settings.repeatMode !== 'off'
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-400/40 shadow-lg'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
            title={t.actions.repeat}
          >
            {settings.repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Speed & Remix Bar (Nightcore / Slowed & Reverb / 1.0x / 1.5x) */}
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 mb-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>سرعة التشغيل والريمكس</span>
            </span>
            <span className="text-cyan-400 font-mono font-bold text-xs">
              {settings.playbackRate}x
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { label: '0.85x تبطيء هادئ', rate: 0.85, icon: <Moon className="w-3 h-3 text-purple-400" /> },
              { label: '1.0x عادي', rate: 1.0 },
              { label: '1.25x نايت كور ⚡', rate: 1.25, icon: <Flame className="w-3 h-3 text-amber-400" /> },
              { label: '1.5x سريع', rate: 1.5 },
              { label: '2.0x أقصى سرعة', rate: 2.0 },
            ].map((preset) => (
              <button
                key={preset.rate}
                onClick={() => onUpdateSettings({ playbackRate: preset.rate })}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  settings.playbackRate === preset.rate
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {preset.icon}
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Futuristic Audio Features Quick Dock (3D Spatial, AI Karaoke, Brainwave Beats, Tube Amp) */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {/* 3D Spatial Audio */}
          <button
            onClick={onOpenSpatialModal}
            className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              settings?.spatial3D?.enabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] font-bold">صوت 3D</span>
          </button>

          {/* Karaoke Studio */}
          <button
            onClick={onOpenKaraokeModal}
            className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              settings?.karaokeMode && settings.karaokeMode !== 'off'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="text-[10px] font-bold">كاريوكي</span>
          </button>

          {/* Brainwave Beats */}
          <button
            onClick={onOpenBrainwaveModal}
            className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
              settings?.binauralMode && settings.binauralMode !== 'off'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span className="text-[10px] font-bold">موجات تركيز</span>
          </button>

          {/* Pro EQ */}
          <button
            onClick={onOpenEqualizer}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-cyan-400 flex flex-col items-center justify-center gap-1 transition cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[10px] font-bold">المعادل Pro</span>
          </button>
        </div>

        {/* System Media Volume Unified Banner (Requested by User) */}
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white">الصوت موحد مع أزرار الهاتف</h5>
              <p className="text-[10px] text-slate-400">تحكم بالصوت مباشرة عبر مفاتيح الهاتف مع حماية Limiter مانعة للخرفشة</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
            100% UNITY
          </span>
        </div>

        {/* Signature Watermark Badge Requested by User */}
        <div className="pt-2 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide text-cyan-300">
              by Abdallah Mahmoud
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
