import React, { useState } from 'react';
import { Clock, X, Check, StopCircle, Sparkles, Moon, Waves } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  activeMinutes: number | null;
  onClose: () => void;
  onSetTimer: (minutes: number) => void;
  onCancelTimer: () => void;
  neuroSleepFade?: boolean;
  onToggleNeuroSleepFade?: (enabled: boolean) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  activeMinutes,
  onClose,
  onSetTimer,
  onCancelTimer,
  neuroSleepFade = true,
  onToggleNeuroSleepFade,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [localNeuroFade, setLocalNeuroFade] = useState(neuroSleepFade);

  // Hook rules guarantee: All hooks called before early return
  if (!isOpen) return null;

  const presetTimes = [15, 30, 45, 60, 90];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const min = parseInt(customInput, 10);
    if (!isNaN(min) && min > 0) {
      onSetTimer(min);
      onClose();
    }
  };

  const handleToggleFade = () => {
    const next = !localNeuroFade;
    setLocalNeuroFade(next);
    if (onToggleNeuroSleepFade) onToggleNeuroSleepFade(next);
  };

  return (
    <div className="fixed inset-0 z-[10050] bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-black border border-white/20 rounded-[36px] max-w-sm w-full p-6 space-y-5 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Specular Rim Glow */}
        <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>مؤقت النوم العصبي</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  Neuro-Fade
                </span>
              </h3>
              <p className="text-xs text-slate-400">تعتيم الصوت تدريجياً لمساعدتك على الاستغراق بالنوم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeMinutes && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs">
            <span className="text-amber-300 font-semibold">المؤقت نشط: {activeMinutes} دقيقة متبقية</span>
            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="text-rose-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>إلغاء المؤقت</span>
            </button>
          </div>
        )}

        {/* Neuro-Fade Feature Toggle (Feature [7]) */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">تعتيم الترددات (Neuro Low-Pass)</span>
            </div>
            <button
              onClick={handleToggleFade}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border ${
                localNeuroFade
                  ? 'bg-amber-500 border-amber-400'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform shadow-md absolute top-0.5 ${
                  localNeuroFade ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed text-right">
            لا يتوقف الصوت بشكل مفاجئ؛ بل يخفض الترددات الحادة تدريجياً ليتحول الصوت إلى نمط دافئ ومكتوم
            مع هبوط تدريجي لمستوى الصوت لتنام بهدوء.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">أوقات جاهزة:</label>
          <div className="grid grid-cols-3 gap-2">
            {presetTimes.map((m) => (
              <button
                key={m}
                onClick={() => {
                  onSetTimer(m);
                  onClose();
                }}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeMinutes === m
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {m} دقيقة
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-300">تحديد مدة مخصصة بالدقائق:</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="600"
              placeholder="مثال: 25"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
            >
              تفعيل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
