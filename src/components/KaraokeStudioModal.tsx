import React, { useState, useEffect } from 'react';
import { KaraokeMode, ThemeConfig, Track } from '../types/player';
import {
  Mic,
  MicOff,
  User,
  Music,
  Sliders,
  Sparkles,
  X,
  Check,
  FileText,
  Volume2,
} from 'lucide-react';

interface KaraokeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  karaokeMode: KaraokeMode;
  onUpdateKaraokeMode: (mode: KaraokeMode) => void;
  onOpenLyrics?: () => void;
  currentTrack: Track | null;
  accentHex: string;
  theme: ThemeConfig;
}

export const KaraokeStudioModal: React.FC<KaraokeStudioModalProps> = ({
  isOpen,
  onClose,
  karaokeMode,
  onUpdateKaraokeMode,
  onOpenLyrics,
  currentTrack,
  accentHex,
  theme,
}) => {
  const [selectedMode, setSelectedMode] = useState<KaraokeMode>(karaokeMode);

  useEffect(() => {
    setSelectedMode(karaokeMode);
  }, [karaokeMode]);

  // Hook rules guarantee: All hooks called unconditionally before early return!
  if (!isOpen) return null;

  const handleSelect = (mode: KaraokeMode) => {
    setSelectedMode(mode);
    onUpdateKaraokeMode(mode);
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-2xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* VisionOS Glass Modal */}
      <div className="relative w-full max-w-lg rounded-[36px] bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-black border border-white/20 p-6 shadow-2xl overflow-hidden text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Specular Rim Glow */}
        <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>استوديو الكاريوكي وعزل الصوت الفوري</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  AI Vocal Cut
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                كتم صوت المغني للغناء مع اللحن أو عزل صوته وتصفية الموسيقى
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Track Info */}
        {currentTrack && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <Music className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-white font-bold truncate">{currentTrack.title}</span>
              <span className="text-slate-400 truncate">· {currentTrack.artist}</span>
            </div>
            {onOpenLyrics && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLyrics();
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>عرض الكلمات</span>
              </button>
            )}
          </div>
        )}

        {/* Mode Selector Cards */}
        <div className="space-y-3">
          {/* 1. Karaoke Mode */}
          <div
            onClick={() => handleSelect('karaoke')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              selectedMode === 'karaoke'
                ? 'border-rose-400 bg-rose-950/30 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <MicOff className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">وضع الكاريوكي (Karaoke Mode)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                    عزل المغني
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  كتم ترددات الصوت البشري المركزية مع الحفاظ الكامل على إيقاع الموسيقى والآلات
                  والبيز لتغني بنفسك.
                </p>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedMode === 'karaoke'
                  ? 'bg-rose-500 border-rose-400'
                  : 'border-white/20 bg-transparent'
              }`}
            >
              {selectedMode === 'karaoke' && <Check className="w-3.5 h-3.5 text-white font-bold" />}
            </div>
          </div>

          {/* 2. Vocal Isolator Mode */}
          <div
            onClick={() => handleSelect('vocal_only')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              selectedMode === 'vocal_only'
                ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(0,242,254,0.2)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">عزل الصوت البشري (Acapella / Vocals)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                    أكابيلا
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  تخفيض صوت الآلات والمؤثرات الجانبية وإبراز صوت المغني بدقة ونقاء عاليين.
                </p>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedMode === 'vocal_only'
                  ? 'bg-cyan-500 border-cyan-400'
                  : 'border-white/20 bg-transparent'
              }`}
            >
              {selectedMode === 'vocal_only' && <Check className="w-3.5 h-3.5 text-black font-bold" />}
            </div>
          </div>

          {/* 3. Original Normal Mode */}
          <div
            onClick={() => handleSelect('off')}
            className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              selectedMode === 'off'
                ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Music className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">الوضع الأصلي الطبيعي (Original)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    هاي-فاي
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  تشغيل المقطع بتوزيعه الستيريو الأصلي الكامل دون أي تعديل على توازن الأصوات.
                </p>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedMode === 'off'
                  ? 'bg-emerald-500 border-emerald-400'
                  : 'border-white/20 bg-transparent'
              }`}
            >
              {selectedMode === 'off' && <Check className="w-3.5 h-3.5 text-black font-bold" />}
            </div>
          </div>
        </div>

        {/* Explanatory Technical Note */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 text-right leading-relaxed">
          💡 <strong>تقنية العزل الميداني:</strong> تعمل الخوارزمية بنظام إلغاء الطور للقناة المركزية
          (Center-Channel Mid-Side Cancellation) مع ترشيح حزم التردد من 300Hz إلى 3400Hz للحصول على أفضل
          نتيجة فورية دون أي تأخير زمني وبدون الحاجة لإنترنت.
        </div>
      </div>
    </div>
  );
};
