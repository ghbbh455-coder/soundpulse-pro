import React from 'react';
import { Track, ThemeConfig } from '../types/player';
import { VisualizerCanvas } from './VisualizerCanvas';
import { translations } from '../utils/translations';
import { Disc, Activity, BarChart3, Radio, Sparkles, Music, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface VisualizerViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  theme: ThemeConfig;
  accentHex: string;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onUpdateTheme: (newTheme: Partial<ThemeConfig>) => void;
}

export const VisualizerView: React.FC<VisualizerViewProps> = ({
  currentTrack,
  isPlaying,
  theme,
  accentHex,
  onTogglePlay,
  onNext,
  onPrev,
  onUpdateTheme,
}) => {
  const t = translations[theme.language];

  const visualizerStyles = [
    { id: 'bars', label: t.theme.bars, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'wave', label: t.theme.wave, icon: <Activity className="w-4 h-4" /> },
    { id: 'circle', label: t.theme.circle, icon: <Radio className="w-4 h-4" /> },
    { id: 'vinyl', label: t.theme.vinyl, icon: <Disc className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white shadow-lg flex items-center justify-center"
            style={{ backgroundColor: accentHex, boxShadow: `0 0 20px ${accentHex}44` }}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">{t.tabs.visualizer}</h2>
            <p className="text-xs text-slate-400 mt-0.5">محلل طيف ترددي متفاعل مع نبضات الباس والصوت بدقة 60 إطاراً بالثانية</p>
          </div>
        </div>

        {/* Visualizer Style Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
          {visualizerStyles.map((vs) => {
            const active = theme.visualizerStyle === vs.id;
            return (
              <button
                key={vs.id}
                onClick={() => onUpdateTheme({ visualizerStyle: vs.id as any })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {vs.icon}
                <span>{vs.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Big Stage Canvas Card */}
      <div className="relative rounded-3xl bg-slate-950/90 border border-slate-800/80 overflow-hidden p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center min-h-[460px]">
        {/* Ambient background glow */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-30 transition-all duration-700"
          style={{ backgroundColor: accentHex }}
        />

        {/* Canvas Display */}
        <div className="w-full max-w-2xl h-72 sm:h-80 z-10">
          <VisualizerCanvas
            isPlaying={isPlaying}
            theme={theme}
            accentHex={accentHex}
            activeTrack={currentTrack}
            className="w-full h-full"
          />
        </div>

        {/* Track Title & Artist Overlay */}
        <div className="mt-6 text-center z-10 space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {currentTrack ? currentTrack.title : 'SoundPulse Studio Pro'}
          </h3>
          <p className="text-xs text-slate-400">
            {currentTrack ? `${currentTrack.artist} — ${currentTrack.album}` : 'جاهز للتشغيل بأعلى جودة'}
          </p>

          <p className="text-xs text-cyan-400 font-mono mt-1">
            by Abdallah Mahmoud
          </p>
        </div>

        {/* Floating Quick Playback Controls */}
        <div className="mt-6 flex items-center gap-4 z-10">
          <button
            onClick={onPrev}
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white transition cursor-pointer shadow-lg"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full flex items-center justify-center text-black font-bold transition transform active:scale-95 cursor-pointer shadow-2xl hover:brightness-110"
            style={{ backgroundColor: accentHex, boxShadow: `0 0 25px ${accentHex}88` }}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black translate-x-0.5" />}
          </button>
          <button
            onClick={onNext}
            className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white transition cursor-pointer shadow-lg"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
