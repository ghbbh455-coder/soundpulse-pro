import React from 'react';
import { EQ_FREQUENCIES, EQ_PRESETS, AudioSettings, ThemeConfig } from '../types/player';
import { audioEngine } from '../services/audioEngine';
import { translations } from '../utils/translations';
import { Sliders, Volume2, Zap, RotateCcw, Sparkles, ShieldCheck } from 'lucide-react';

interface EqualizerViewProps {
  settings: AudioSettings;
  theme: ThemeConfig;
  accentHex: string;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
}

export const EqualizerView: React.FC<EqualizerViewProps> = ({
  settings,
  theme,
  accentHex,
  onUpdateSettings,
}) => {
  const t = translations[theme.language];

  const handleBandChange = (index: number, val: number) => {
    const updatedGains = [...settings.eqGains];
    updatedGains[index] = val;
    audioEngine.setEQBandGain(index, val);
    onUpdateSettings({ eqGains: updatedGains, activePreset: 'Custom' });
  };

  const handlePresetChange = (presetName: string) => {
    const gains = EQ_PRESETS[presetName];
    if (gains) {
      audioEngine.applyPreset(presetName);
      onUpdateSettings({ eqGains: [...gains], activePreset: presetName });
    }
  };

  const handleBassBoostChange = (val: number) => {
    audioEngine.setBassBoost(val);
    onUpdateSettings({ bassBoost: val });
  };

  const handleVirtualizerChange = (val: number) => {
    audioEngine.setVirtualizer(val);
    onUpdateSettings({ virtualizer: val });
  };

  const handleBoostChange = (val: number) => {
    audioEngine.setVolumeAndBoost(settings.volume, val);
    onUpdateSettings({ volumeBoost: val });
  };

  const handleReset = () => {
    handlePresetChange('Flat');
    handleBassBoostChange(0);
    handleVirtualizerChange(0);
    handleBoostChange(100);
  };

  const isTurbo = settings.volumeBoost > 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl text-white shadow-lg flex items-center justify-center"
              style={{ backgroundColor: accentHex, boxShadow: `0 0 20px ${accentHex}44` }}
            >
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{t.eq.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.eq.boostWarning}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60 self-start md:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط المصنع</span>
        </button>
      </div>

      {/* 300% Volume Boost Highlight Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-300 ${
          isTurbo
            ? 'bg-gradient-to-r from-amber-950/40 via-red-950/30 to-purple-950/40 border-amber-500/50 shadow-xl shadow-amber-900/20'
            : 'bg-slate-900/40 border-slate-800/80'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${isTurbo ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{t.actions.volumeBoost}</span>
                {isTurbo && (
                  <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    TURBO 300% ACTIVE
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              تضخيم إشارة الصوت حتى 3 أضعاف (300%) مع حماية ديناميكية (Dynamics Compressor Limiter) لمنع تشويش وتلف المكبرات.
            </p>
          </div>

          {/* Quick Boost Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[100, 150, 200, 250, 300].map((level) => (
              <button
                key={level}
                onClick={() => handleBoostChange(level)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  settings.volumeBoost === level
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-black shadow-lg shadow-amber-500/30 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {level}% {level === 300 ? '⚡ MAX' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Boost Slider with Meter */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">0% (صامت)</span>
            <span className="text-cyan-400 font-bold">100% (المستوى القياسي)</span>
            <span className="text-amber-400 font-bold">200% (مضاعف)</span>
            <span className="text-rose-400 font-extrabold text-sm">300% (أقصى قدرة)</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={settings.volumeBoost}
              onChange={(e) => handleBoostChange(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              style={{
                background: `linear-gradient(to right, #00f2fe 0%, #10b981 33%, #f59e0b 66%, #f43f5e 100%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نظام منع التشوه والقص الرقمي (Anti-Clipping Soft Knee) نشط</span>
            </div>
            <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {settings.volumeBoost}%
            </span>
          </div>
        </div>
      </div>

      {/* Presets Row */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{t.eq.presets}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">الوضع الحالي: {settings.activePreset}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.keys(EQ_PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                settings.activePreset === preset
                  ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/40'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 10-Band Sliders Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">الترددات الصوتية (10-Band Sliders)</h3>
          <span className="text-xs text-slate-400 font-mono">-12dB إلى +12dB</span>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-3 md:gap-4 items-center justify-items-center">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = settings.eqGains[idx] ?? 0;
            const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}Hz`;

            return (
              <div key={freq} className="flex flex-col items-center gap-3 w-full">
                {/* Decibel value */}
                <span className="text-[11px] font-mono text-cyan-400 font-semibold h-4">
                  {gain > 0 ? `+${gain}` : gain}dB
                </span>

                {/* Vertical slider wrapper */}
                <div className="h-44 flex items-center justify-center relative py-2">
                  {/* Center 0dB hairline line */}
                  <div className="absolute w-6 h-[1px] bg-slate-700 pointer-events-none" />

                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={gain}
                    onChange={(e) => handleBandChange(idx, Number(e.target.value))}
                    className="w-36 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer -rotate-90 accent-cyan-400"
                  />
                </div>

                {/* Frequency Label */}
                <span className="text-xs font-mono font-medium text-slate-300 mt-1">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bass Boost & 3D Virtualizer Knobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Super Bass Card */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>{t.eq.bassBoost}</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {settings.bassBoost}%
            </span>
          </div>
          <p className="text-xs text-slate-400">
            تضخيم الترددات تحت 90Hz لمنح ضربات الإيقاع عمقاً وقوة استوديو ملموسة.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.bassBoost}
            onChange={(e) => handleBassBoostChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* 3D Virtualizer Card */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{t.eq.virtualizer}</span>
            </span>
            <span className="text-xs font-mono font-bold text-purple-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {settings.virtualizer}%
            </span>
          </div>
          <p className="text-xs text-slate-400">
            توسيع الساحة الصوتية (Stereo Widening) لخلق تجربة صوت محيطي ثلاثي الأبعاد بالسماعات.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.virtualizer}
            onChange={(e) => handleVirtualizerChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
        </div>

        {/* Crossfade Transition Card */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>التلاشي التلقائي (Crossfade)</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {settings.crossfade} ثوانٍ
            </span>
          </div>
          <p className="text-xs text-slate-400">
            دمج نهاية الأغنية الحالية ببداية الأغنية التالية بسلاسة مثل الدي جي (DJ Transition).
          </p>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={settings.crossfade}
            onChange={(e) => onUpdateSettings({ crossfade: Number(e.target.value) })}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>

        {/* Speed & Remix Engine Card */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>محرك الريمكس والسرعة</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {settings.playbackRate}x
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {[
              { label: '0.85x Slowed', rate: 0.85 },
              { label: '1.0x Normal', rate: 1.0 },
              { label: '1.25x Nightcore ⚡', rate: 1.25 },
              { label: '1.5x Fast', rate: 1.5 },
            ].map((p) => (
              <button
                key={p.rate}
                onClick={() => onUpdateSettings({ playbackRate: p.rate })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  settings.playbackRate === p.rate
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Analog Tube Amp Warmth Simulator Card (Feature [4]) */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 to-slate-900/60 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-lg">🏮</span>
              <span>محاكي أمبليفاير الصمامات (Analog Tube Amp)</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
              {settings.tubeWarmth}% الدفء التناظري
            </span>
          </div>
          <p className="text-xs text-slate-400">
            إضافة توافقيات ناعمة (Warm Harmonic Saturation via WaveShaper) لإعطاء دفء وعمق للملفات الرقمية مثل مشغلات الفينيل القديمة.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={settings.tubeWarmth}
              onChange={(e) => {
                const val = Number(e.target.value);
                audioEngine.setTubeWarmth(val);
                onUpdateSettings({ tubeWarmth: val });
              }}
              className="flex-1 h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            {/* Glowing Tube Filament Indicator */}
            <div
              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                settings.tubeWarmth > 0
                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-white/5 border-white/10 opacity-40'
              }`}
            >
              <span className="text-xs">💡</span>
            </div>
          </div>
        </div>

        {/* 5. Safe Volume Normalizer (ReplayGain / Dynamics Compressor - Feature [10]) */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>موازن مستوى الصوت الآمن (Volume Normalizer)</span>
            </span>
            <button
              onClick={() => {
                const next = !settings.volumeNormalizer;
                audioEngine.setVolumeNormalizer(next);
                onUpdateSettings({ volumeNormalizer: next });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer border ${
                settings.volumeNormalizer
                  ? 'bg-emerald-500 border-emerald-400'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform shadow-md absolute top-0.5 ${
                  settings.volumeNormalizer ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            محدد ديناميكي ذكي يضبط علو الصوت تلقائياً بين الأغاني الهادئة والصاخبة لكي لا تفاجئك مقاطع مرتفعة جداً بعد مقطع هادئ.
          </p>
        </div>
      </div>
    </div>
  );
};
