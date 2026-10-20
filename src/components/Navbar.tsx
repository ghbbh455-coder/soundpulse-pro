import React from 'react';
import { ThemeConfig } from '../types/player';
import { translations } from '../utils/translations';
import {
  Settings,
  Search,
  Disc,
  Music,
  ListMusic,
  User,
  Folder,
  Sliders,
  Activity,
  Car,
  BarChart3,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  theme: ThemeConfig;
  accentHex: string;
  onOpenSettings: () => void;
  onOpenDriveMode?: () => void;
  onOpenInsights?: () => void;
  onToggleSearch?: () => void;
  onToggleSort?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  theme,
  accentHex,
  onOpenSettings,
  onOpenDriveMode,
  onOpenInsights,
}) => {
  const t = translations[theme.language];

  // Category navigation tabs
  const navTabs = [
    { id: 'music', label: 'الأغاني', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'playlists', label: 'قوائم التشغيل', icon: <ListMusic className="w-3.5 h-3.5" /> },
    { id: 'artists', label: 'الفنانون', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'albums', label: 'الألبومات', icon: <Disc className="w-3.5 h-3.5" /> },
    { id: 'folders', label: 'المجلدات', icon: <Folder className="w-3.5 h-3.5" /> },
    { id: 'equalizer', label: 'المعادل الصوتي', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'visualizer', label: 'المؤثرات البصرية', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-30 transition-all duration-200 border-b border-white/10 liquid-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Header Row matching modern mobile audio apps */}
        <div className="flex items-center justify-between py-3 gap-3">
          {/* Left Tools: Settings + Insights + Drive Mode */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95 cursor-pointer shadow-sm"
              title="الإعدادات والخيارات"
            >
              <Settings className="w-5 h-5 text-cyan-400" />
            </button>

            {onOpenInsights && (
              <button
                onClick={onOpenInsights}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95 cursor-pointer shadow-sm"
                title="إحصائيات واستعراض الاستماع"
              >
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </button>
            )}

            {onOpenDriveMode && (
              <button
                onClick={onOpenDriveMode}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95 cursor-pointer shadow-sm"
                title="وضع القيادة السريع"
              >
                <Car className="w-5 h-5 text-amber-400" />
              </button>
            )}
          </div>

          {/* Center Brand Title */}
          <div
            onClick={() => onSelectTab('music')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-black font-extrabold shadow-md"
              style={{ backgroundColor: accentHex }}
            >
              <Disc className="w-5 h-5 text-black animate-spin [animation-duration:10s]" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white">
              SoundPulse <span style={{ color: accentHex }}>Pro</span>
            </span>
          </div>

          {/* Right Tools: Quick Search */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('music')}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95 cursor-pointer shadow-sm"
              title="بحث سريع في المكتبة"
            >
              <Search className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Horizontal Category Nav Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar">
          {navTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-black shadow-lg shadow-cyan-500/25 scale-[1.02]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
                style={isActive ? { backgroundColor: accentHex } : {}}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
