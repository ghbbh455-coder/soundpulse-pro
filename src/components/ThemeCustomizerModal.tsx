import React from 'react';
import { ThemeConfig, ThemeMode, AccentColor, VisualizerStyle } from '../types/player';
import { ACCENT_PALETTES } from '../utils/themeHelper';
import { translations } from '../utils/translations';
import { Palette, Sun, Moon, Sparkles, X, Check, Disc, Activity, BarChart3, Radio } from 'lucide-react';

interface ThemeCustomizerModalProps {
  theme: ThemeConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTheme: (newTheme: Partial<ThemeConfig>) => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  theme,
  isOpen,
  onClose,
  onUpdateTheme,
}) => {
  if (!isOpen) return null;
  const t = translations[theme.language];

  const modes: { id: ThemeMode; label: string; icon: React.ReactNode; bg: string }[] = [
    { id: 'cyberpunk', label: t.theme.dark, icon: <Sparkles className="w-4 h-4 text-cyan-400" />, bg: 'bg-[#0a0b12]' },
    { id: 'dark', label: t.theme.slate, icon: <Moon className="w-4 h-4 text-slate-300" />, bg: 'bg-slate-900' },
    { id: 'midnight', label: t.theme.midnight, icon: <Moon className="w-4 h-4 text-indigo-400" />, bg: 'bg-[#060914]' },
    { id: 'amoled', label: t.theme.amoled, icon: <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/40" />, bg: 'bg-black' },
    { id: 'light', label: t.theme.light, icon: <Sun className="w-4 h-4 text-amber-500" />, bg: 'bg-slate-100 text-slate-900' },
  ];

  const visualizerStyles: { id: VisualizerStyle; label: string; icon: React.ReactNode }[] = [
    { id: 'bars', label: t.theme.bars, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'wave', label: t.theme.wave, icon: <Activity className="w-4 h-4" /> },
    { id: 'circle', label: t.theme.circle, icon: <Radio className="w-4 h-4" /> },
    { id: 'vinyl', label: t.theme.vinyl, icon: <Disc className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.theme.title}</h2>
              <p className="text-xs text-slate-400">تخصيص المظهر، الألوان، تأثيرات الزجاج البلوري وشكل محلل الصوت</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Theme Modes (Dark, Light, Cyberpunk, AMOLED, etc.) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            {t.theme.modes}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {modes.map((m) => {
              const active = theme.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onUpdateTheme({ mode: m.id })}
                  className={`p-3.5 rounded-2xl border transition-all text-right flex items-center justify-between gap-2 cursor-pointer ${m.bg} ${
                    active
                      ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {m.icon}
                    <span className="text-xs font-bold text-white">{m.label}</span>
                  </div>
                  {active && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Accent Colors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.theme.accentColors}
            </label>
            {theme.accent === 'custom' && (
              <span className="text-xs font-mono text-cyan-400">{theme.customAccentColor}</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(ACCENT_PALETTES) as AccentColor[]).map((key) => {
              if (key === 'custom') {
                return (
                  <div
                    key="custom"
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${
                      theme.accent === 'custom'
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30 bg-slate-800/80'
                        : 'border-slate-800 bg-slate-800/40'
                    }`}
                    onClick={() => onUpdateTheme({ accent: 'custom' })}
                  >
                    <span className="text-xs font-semibold text-slate-200">لون مخصص</span>
                    <input
                      type="color"
                      value={theme.customAccentColor}
                      onChange={(e) => {
                        onUpdateTheme({ accent: 'custom', customAccentColor: e.target.value });
                      }}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                );
              }

              const pal = ACCENT_PALETTES[key];
              const active = theme.accent === key;
              return (
                <button
                  key={key}
                  onClick={() => onUpdateTheme({ accent: key })}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    active
                      ? 'border-white ring-2 ring-white/20 bg-slate-800'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: pal.hex }}
                    />
                    <span className="text-xs font-medium text-slate-200">{pal.name.split(' ')[0]}</span>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Glassmorphism Toggle */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">{t.theme.glassmorphism}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              تفعيل التمويه الزجاجي البلوري للبطاقات والشريط السفلي لمظهر فائق الحداثة
            </p>
          </div>
          <button
            onClick={() => onUpdateTheme({ glassmorphism: !theme.glassmorphism })}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              theme.glassmorphism ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                theme.glassmorphism ? 'right-1' : 'right-7'
              }`}
            />
          </button>
        </div>

        {/* 4. Visualizer Style */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            {t.theme.visualizerStyle}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {visualizerStyles.map((vs) => {
              const active = theme.visualizerStyle === vs.id;
              return (
                <button
                  key={vs.id}
                  onClick={() => onUpdateTheme({ visualizerStyle: vs.id })}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    active
                      ? 'border-cyan-400 bg-slate-800 ring-2 ring-cyan-400/20'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {vs.icon}
                    <span className="text-xs font-semibold text-white">{vs.label}</span>
                  </div>
                  {active && <Check className="w-4 h-4 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Spectrum Bar Count */}
        {theme.visualizerStyle === 'bars' && (
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">عدد أعمدة الطيف الترددي:</span>
              <span className="font-mono text-cyan-400 font-bold">{theme.visualizerBars} عمود</span>
            </div>
            <div className="flex gap-2">
              {[32, 48, 64].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => onUpdateTheme({ visualizerBars: cnt })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    theme.visualizerBars === cnt
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cnt} عمود
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. Language Toggle */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">لغة الواجهة (Language)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">التبديل بين العربية والإنجليزية</p>
          </div>
          <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                onUpdateTheme({ language: 'ar' });
                document.documentElement.dir = 'rtl';
                document.documentElement.lang = 'ar';
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                theme.language === 'ar' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => {
                onUpdateTheme({ language: 'en' });
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = 'en';
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                theme.language === 'en' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 text-black hover:bg-cyan-400 transition cursor-pointer shadow-lg shadow-cyan-500/25"
          >
            {t.actions.save} والتطبيق
          </button>
        </div>
      </div>
    </div>
  );
};
