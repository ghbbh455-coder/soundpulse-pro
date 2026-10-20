import { ThemeConfig } from '../types/player';

export const ACCENT_PALETTES = {
  cyan: {
    name: 'نيون سماوي (Neon Cyan)',
    hex: '#00f2fe',
    glow: 'rgba(0, 242, 254, 0.4)',
    bgGradient: 'from-cyan-500 to-blue-600',
    ring: 'focus:ring-cyan-400',
  },
  violet: {
    name: 'بنفسجي كهربائي (Electric Violet)',
    hex: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    bgGradient: 'from-purple-500 to-indigo-600',
    ring: 'focus:ring-purple-400',
  },
  emerald: {
    name: 'زمردي متوهج (Emerald Glow)',
    hex: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    bgGradient: 'from-emerald-400 to-teal-600',
    ring: 'focus:ring-emerald-400',
  },
  amber: {
    name: 'لهب العنبر (Sunset Amber)',
    hex: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    bgGradient: 'from-amber-400 to-orange-600',
    ring: 'focus:ring-amber-400',
  },
  crimson: {
    name: 'قرمزي ساطع (Crimson Pulse)',
    hex: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    bgGradient: 'from-rose-500 to-pink-600',
    ring: 'focus:ring-rose-400',
  },
  custom: {
    name: 'لون مخصص (Custom Accent)',
    hex: '#00f2fe',
    glow: 'rgba(0, 242, 254, 0.4)',
    bgGradient: 'from-cyan-500 to-blue-600',
    ring: 'focus:ring-cyan-400',
  },
};

export function getThemeClasses(theme: ThemeConfig) {
  const isLight = theme.mode === 'light';

  let bgClass = 'bg-[#0a0b12] text-slate-100';
  let cardClass = theme.glassmorphism
    ? 'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl'
    : 'bg-[#121526] border border-slate-800 shadow-xl';
  let headerClass = theme.glassmorphism
    ? 'bg-[#0a0b12]/80 backdrop-blur-md border-b border-slate-800/60'
    : 'bg-[#0a0b12] border-b border-slate-800';
  let playerBarClass = theme.glassmorphism
    ? 'bg-slate-950/85 backdrop-blur-2xl border-t border-slate-800/80'
    : 'bg-[#08090f] border-t border-slate-800';
  let textPrimary = 'text-white';
  let textMuted = 'text-slate-400';
  let inputClass = 'bg-slate-900/80 border border-slate-800 text-slate-100 focus:border-cyan-500';

  if (theme.mode === 'dark') {
    bgClass = 'bg-slate-950 text-slate-100';
    cardClass = theme.glassmorphism
      ? 'bg-slate-900/70 backdrop-blur-xl border border-slate-800/70'
      : 'bg-slate-900 border border-slate-800';
    headerClass = theme.glassmorphism
      ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50'
      : 'bg-slate-950 border-b border-slate-800';
    playerBarClass = theme.glassmorphism
      ? 'bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80'
      : 'bg-slate-950 border-t border-slate-800';
  } else if (theme.mode === 'midnight') {
    bgClass = 'bg-[#060914] text-slate-100';
    cardClass = theme.glassmorphism
      ? 'bg-[#0e162b]/70 backdrop-blur-xl border border-blue-900/40'
      : 'bg-[#0e162b] border border-blue-900/50';
    headerClass = theme.glassmorphism
      ? 'bg-[#060914]/80 backdrop-blur-md border-b border-blue-950'
      : 'bg-[#060914] border-b border-blue-950';
    playerBarClass = theme.glassmorphism
      ? 'bg-[#060914]/90 backdrop-blur-xl border-t border-blue-950'
      : 'bg-[#060914] border-t border-blue-950';
  } else if (theme.mode === 'amoled') {
    bgClass = 'bg-black text-slate-100';
    cardClass = 'bg-[#0d0d0d] border border-neutral-800';
    headerClass = 'bg-black border-b border-neutral-900';
    playerBarClass = 'bg-black border-t border-neutral-900';
  } else if (theme.mode === 'light') {
    bgClass = 'bg-slate-50 text-slate-900';
    cardClass = theme.glassmorphism
      ? 'bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-md'
      : 'bg-white border border-slate-200 shadow-sm';
    headerClass = theme.glassmorphism
      ? 'bg-white/80 backdrop-blur-md border-b border-slate-200'
      : 'bg-white border-b border-slate-200';
    playerBarClass = theme.glassmorphism
      ? 'bg-white/90 backdrop-blur-xl border-t border-slate-200'
      : 'bg-white border-t border-slate-200';
    textPrimary = 'text-slate-900';
    textMuted = 'text-slate-500';
    inputClass = 'bg-white border border-slate-200 text-slate-900 focus:border-cyan-600';
  }

  const accentHex = theme.accent === 'custom' ? theme.customAccentColor : ACCENT_PALETTES[theme.accent].hex;

  return {
    isLight,
    bgClass,
    cardClass,
    headerClass,
    playerBarClass,
    textPrimary,
    textMuted,
    inputClass,
    accentHex,
  };
}
