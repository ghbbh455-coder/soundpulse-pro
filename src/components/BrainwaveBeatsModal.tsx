import React, { useState, useEffect, useRef } from 'react';
import { BinauralMode, ThemeConfig } from '../types/player';
import {
  Brain,
  Zap,
  Moon,
  Sparkles,
  Waves,
  X,
  Volume2,
  Check,
  Headphones,
  Info,
} from 'lucide-react';

interface BrainwaveBeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  binauralMode: BinauralMode;
  binauralVolume: number;
  onUpdateBinaural: (mode: BinauralMode, volume: number) => void;
  accentHex: string;
  theme: ThemeConfig;
}

export const BrainwaveBeatsModal: React.FC<BrainwaveBeatsModalProps> = ({
  isOpen,
  onClose,
  binauralMode,
  binauralVolume,
  onUpdateBinaural,
  accentHex,
  theme,
}) => {
  const [currentMode, setCurrentMode] = useState<BinauralMode>(binauralMode);
  const [currentVol, setCurrentVol] = useState<number>(binauralVolume);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    setCurrentMode(binauralMode);
    setCurrentVol(binauralVolume);
  }, [binauralMode, binauralVolume]);

  // Animated Sine Wave frequency visualizer
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || 400);
    let height = (canvas.height = 100);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      phaseRef.current += currentMode !== 'off' ? 0.05 : 0.01;
      const p = phaseRef.current;

      const activeColor =
        currentMode === 'alpha'
          ? '#00f2fe'
          : currentMode === 'theta'
          ? '#a855f7'
          : currentMode === 'delta'
          ? '#3b82f6'
          : currentMode === 'beta'
          ? '#eab308'
          : '#64748b';

      // Left Channel Wave
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2.5;
      for (let x = 0; x < width; x++) {
        const freq = currentMode === 'delta' ? 0.02 : 0.04;
        const y = height / 2 + Math.sin(x * freq + p) * (currentMode === 'off' ? 6 : 28);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Right Channel Wave (shifted by delta frequency)
      if (currentMode !== 'off') {
        ctx.beginPath();
        ctx.strokeStyle = `${activeColor}88`;
        ctx.lineWidth = 1.5;
        const diff =
          currentMode === 'alpha'
            ? 0.045
            : currentMode === 'theta'
            ? 0.043
            : currentMode === 'delta'
            ? 0.022
            : 0.052;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * diff + p * 1.05) * 26;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, currentMode]);

  // Hook rules guarantee: All hooks called before early return
  if (!isOpen) return null;

  const modes = [
    {
      id: 'alpha' as BinauralMode,
      hz: '10 Hz',
      title: 'موجات ألفا (Alpha) - التركيز والمذاكرة',
      subtitle: 'صفاء ذهني، هدوء عصبي، استيعاب سريع للمعلومات دون توتر',
      icon: Zap,
      color: '#00f2fe',
      bg: 'rgba(0, 242, 254, 0.12)',
    },
    {
      id: 'theta' as BinauralMode,
      hz: '6 Hz',
      title: 'موجات ثيتا (Theta) - التأمل والإلهام',
      subtitle: 'استرخاء عميق، تحفيز الخيال والإبداع، وتفريغ الضغوط النفسية',
      icon: Waves,
      color: '#c084fc',
      bg: 'rgba(192, 132, 252, 0.12)',
    },
    {
      id: 'delta' as BinauralMode,
      hz: '2 Hz',
      title: 'موجات دلتا (Delta) - النوم العميق والاستشفاء',
      subtitle: 'تهدئة خلايا الدماغ للمساعدة على الدخول السريع في نوم هادئ ومتجدد',
      icon: Moon,
      color: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.12)',
    },
    {
      id: 'beta' as BinauralMode,
      hz: '18 Hz',
      title: 'موجات بيتا (Beta) - اليقظة والطاقة العالية',
      subtitle: 'نشاط ذهني مكثف، حل المشكلات المعقدة، وزيادة سرعة رد الفعل',
      icon: Sparkles,
      color: '#facc15',
      bg: 'rgba(250, 204, 21, 0.12)',
    },
  ];

  const handleSelectMode = (mode: BinauralMode) => {
    const next = currentMode === mode ? 'off' : mode;
    setCurrentMode(next);
    onUpdateBinaural(next, currentVol);
  };

  const handleVolumeChange = (newVol: number) => {
    setCurrentVol(newVol);
    onUpdateBinaural(currentMode, newVol);
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-2xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* VisionOS Glass Card */}
      <div className="relative w-full max-w-lg rounded-[36px] bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-black border border-white/20 p-6 shadow-2xl overflow-hidden text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Specular Rim */}
        <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>موجات الدماغ ومحفزات التركيز</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Binaural Beats
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                توليد ترددات صوتية ثنائية الأذن مدمجة بنعومة خلف الموسيقى
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

        {/* Headphones Recommendation Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-200">
          <Headphones className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong>تنبيه هام:</strong> تعمل موجات التردد الثنائي (Binaural Beats) بكفاءتها الكاملة
            عند ارتداء سماعات الرأس (Headphones) للاستفادة من فارق التردد بين الأذنين.
          </span>
        </div>

        {/* Live Frequency Oscillator Canvas */}
        <div className="relative rounded-2xl bg-black/60 border border-white/10 p-3 overflow-hidden flex flex-col items-center">
          <canvas ref={canvasRef} className="w-full h-20 block" />
          <div className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 pt-1 border-t border-white/10">
            <span>التردد الأيسر: 200 Hz</span>
            <span className="font-bold text-white">
              {currentMode === 'off' ? 'المولد متوقف' : `الوضع النشط: ${currentMode.toUpperCase()}`}
            </span>
            <span>التردد الأيمن: +Δ Beat</span>
          </div>
        </div>

        {/* Brainwave Mode Selection Cards */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-300">اختر نوع الموجة الدماغية المرغوبة:</h3>
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = currentMode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => handleSelectMode(m.id)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-cyan-400 bg-white/10 shadow-[0_0_25px_rgba(0,242,254,0.15)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="p-3 rounded-2xl shrink-0 flex items-center justify-center border border-white/15"
                    style={{ backgroundColor: m.bg, color: m.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {m.title}
                      </span>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shrink-0"
                        style={{ backgroundColor: `${m.color}25`, color: m.color }}
                      >
                        {m.hz}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{m.subtitle}</p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-cyan-500 border-cyan-400' : 'border-white/20 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Volume Blend Slider */}
        {currentMode !== 'off' && (
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>مستوى مزج الموجات الدماغية في الخلفية:</span>
              </span>
              <span className="font-mono text-purple-400 font-bold">{currentVol}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={currentVol}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 text-right">
              ينصح بضبط المستوى بين 15% إلى 35% لكي تندمج الموجات بهدوء تام دون تغطية تفاصيل الموسيقى.
            </p>
          </div>
        )}

        {/* Quick Stop Button */}
        {currentMode !== 'off' && (
          <button
            onClick={() => handleSelectMode(currentMode)}
            className="w-full py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer"
          >
            إيقاف مولد موجات الدماغ
          </button>
        )}
      </div>
    </div>
  );
};
