import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Spatial3DSettings, ThemeConfig, DEFAULT_SPATIAL_SETTINGS } from '../types/player';
import {
  Compass,
  RotateCw,
  X,
  Volume2,
  Sparkles,
  Headphones,
  Maximize2,
  Sliders,
  Check,
} from 'lucide-react';

interface SpatialAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Spatial3DSettings;
  onUpdateSpatial: (settings: Spatial3DSettings) => void;
  accentHex: string;
  theme: ThemeConfig;
}

export const SpatialAudioModal: React.FC<SpatialAudioModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSpatial,
  accentHex,
  theme,
}) => {
  const radarRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localSettings, setLocalSettings] = useState<Spatial3DSettings>(
    settings || DEFAULT_SPATIAL_SETTINGS
  );

  useEffect(() => {
    setLocalSettings(settings || DEFAULT_SPATIAL_SETTINGS);
  }, [settings]);

  // Handle dragging the sound source inside the 3D circular radar
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !radarRef.current) return;
      const rect = radarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const radius = rect.width / 2;

      let dx = (e.clientX - centerX) / radius;
      let dy = (e.clientY - centerY) / radius;

      // Clamp within unit sphere circle
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        dx /= dist;
        dy /= dist;
      }

      // dx is Left/Right (-1 to 1), dy inverted is Front/Back (-1 to 1)
      const newSettings: Spatial3DSettings = {
        ...localSettings,
        enabled: true,
        autoRotate: false,
        x: Math.round(dx * 100) / 100,
        y: Math.round(-dy * 100) / 100,
      };

      setLocalSettings(newSettings);
      onUpdateSpatial(newSettings);
    },
    [isDragging, localSettings, onUpdateSpatial]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Keep all hooks unconditionally at top before any early return!
  if (!isOpen) return null;

  const presets = [
    {
      id: 'center',
      label: 'المسرح الأمامي (Center Stage)',
      x: 0,
      y: 0.8,
      z: 0.1,
      autoRotate: false,
    },
    {
      id: 'orbit',
      label: 'مدار 360° دوراني (Orbiting 3D)',
      x: 0,
      y: 0.5,
      z: 0,
      autoRotate: true,
    },
    {
      id: 'left_ear',
      label: 'الجانب الأيسر (Left Intimate)',
      x: -0.85,
      y: 0.2,
      z: 0,
      autoRotate: false,
    },
    {
      id: 'right_ear',
      label: 'الجانب الأيمن (Right Intimate)',
      x: 0.85,
      y: 0.2,
      z: 0,
      autoRotate: false,
    },
    {
      id: 'surround',
      label: 'أجواء محيطية واسعة (Surround Arena)',
      x: 0,
      y: -0.7,
      z: 0.4,
      autoRotate: false,
    },
  ];

  const handlePresetSelect = (p: (typeof presets)[0]) => {
    const updated: Spatial3DSettings = {
      ...localSettings,
      enabled: true,
      x: p.x,
      y: p.y,
      z: p.z,
      autoRotate: p.autoRotate,
    };
    setLocalSettings(updated);
    onUpdateSpatial(updated);
  };

  // Coordinates normalized to radar percentage (0% to 100%)
  const orbLeftPercent = 50 + localSettings.x * 45;
  const orbTopPercent = 50 - localSettings.y * 45;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      {/* Universal blurred backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-2xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main VisionOS Glass Container */}
      <div className="relative w-full max-w-lg rounded-[36px] bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-black/98 border border-white/20 p-6 shadow-2xl overflow-hidden text-slate-100 flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Specular Rim Light */}
        <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-2xl border border-white/20 shadow-lg flex items-center justify-center"
              style={{ backgroundColor: `${accentHex}20` }}
            >
              <Compass className="w-6 h-6" style={{ color: accentHex }} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>المسرح الصوتي ثلاثي الأبعاد</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  HRTF 3D
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                حرك مصدر الصوت بحرية لتشعر بالموسيقى تدور حول رأسك بالكامل
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

        {/* Master Spatial Audio Switch */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-sm font-bold text-white">تفعيل تقنية الصوت المكاني 3D</p>
              <p className="text-xs text-slate-400">
                {localSettings.enabled
                  ? 'المعالج الصوتي المكاني نشط ومفعل'
                  : 'معطل (ستيريو كلاسيكي)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const updated = { ...localSettings, enabled: !localSettings.enabled };
              setLocalSettings(updated);
              onUpdateSpatial(updated);
            }}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer border ${
              localSettings.enabled
                ? 'bg-cyan-500 border-cyan-400'
                : 'bg-white/10 border-white/20'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform shadow-md absolute top-0.5 ${
                localSettings.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Interactive 3D Audio Radar Sphere */}
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div
            ref={radarRef}
            onPointerDown={(e) => {
              setIsDragging(true);
              const rect = e.currentTarget.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const radius = rect.width / 2;
              let dx = (e.clientX - centerX) / radius;
              let dy = (e.clientY - centerY) / radius;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 1) {
                dx /= dist;
                dy /= dist;
              }
              const newSettings = {
                ...localSettings,
                enabled: true,
                autoRotate: false,
                x: Math.round(dx * 100) / 100,
                y: Math.round(-dy * 100) / 100,
              };
              setLocalSettings(newSettings);
              onUpdateSpatial(newSettings);
            }}
            className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-dashed border-cyan-500/30 flex items-center justify-center select-none cursor-crosshair overflow-hidden shadow-[inset_0_0_60px_rgba(0,242,254,0.15)] bg-slate-950/80 transition-all ${
              !localSettings.enabled ? 'opacity-40 grayscale pointer-events-none' : ''
            }`}
          >
            {/* Concentric distance soundwave rings */}
            <div className="absolute inset-6 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-16 rounded-full border border-cyan-500/25" />
            <div className="absolute inset-28 rounded-full border border-cyan-500/30" />

            {/* Crosshair axes */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20 pointer-events-none" />

            {/* Orientation Labels */}
            <span className="absolute top-2 text-[10px] font-mono text-cyan-400/80 font-bold">
              الأمام (Front)
            </span>
            <span className="absolute bottom-2 text-[10px] font-mono text-cyan-400/80 font-bold">
              الخلف (Back)
            </span>
            <span className="absolute left-2 text-[10px] font-mono text-cyan-400/80 font-bold">
              يسار (L)
            </span>
            <span className="absolute right-2 text-[10px] font-mono text-cyan-400/80 font-bold">
              يمين (R)
            </span>

            {/* Central Listener Head Avatar */}
            <div className="relative z-10 w-12 h-12 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.4)] pointer-events-none">
              <Headphones className="w-6 h-6 text-cyan-300" />
            </div>

            {/* Draggable Sound Orb (The Music Source) */}
            <div
              style={{
                left: `${orbLeftPercent}%`,
                top: `${orbTopPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-20 w-10 h-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
                isDragging ? 'scale-125' : 'hover:scale-110'
              }`}
            >
              {/* Outer pulsing ring */}
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: accentHex }}
              />
              {/* Core sound orb */}
              <div
                className="relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: accentHex,
                  boxShadow: `0 0 25px ${accentHex}`,
                }}
              >
                <Volume2 className="w-4 h-4 text-black font-black" />
              </div>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400 mt-1">
            الإحداثيات الحالية: X: {localSettings.x > 0 ? `+${localSettings.x}` : localSettings.x} |
            Y: {localSettings.y > 0 ? `+${localSettings.y}` : localSettings.y} | Z:{' '}
            {localSettings.z}
          </span>
        </div>

        {/* 360 Auto-Rotate Feature */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RotateCw
                className={`w-4 h-4 text-cyan-400 ${
                  localSettings.autoRotate ? 'animate-spin' : ''
                }`}
              />
              <span className="text-xs font-bold text-white">دوران محيطي 360° تلقائي حول الرأس</span>
            </div>
            <button
              onClick={() => {
                const updated = {
                  ...localSettings,
                  enabled: true,
                  autoRotate: !localSettings.autoRotate,
                };
                setLocalSettings(updated);
                onUpdateSpatial(updated);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                localSettings.autoRotate
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-white/10 text-slate-300 border-white/20'
              }`}
            >
              {localSettings.autoRotate ? 'قيد الدوران' : 'تفعيل'}
            </button>
          </div>

          {localSettings.autoRotate && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-slate-400 shrink-0">سرعة الدوران:</span>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={localSettings.rotationSpeed}
                onChange={(e) => {
                  const spd = parseFloat(e.target.value);
                  const updated = { ...localSettings, rotationSpeed: spd };
                  setLocalSettings(updated);
                  onUpdateSpatial(updated);
                }}
                className="flex-1 accent-cyan-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">
                {localSettings.rotationSpeed}x
              </span>
            </div>
          )}
        </div>

        {/* Elevation Z-Axis (Height / Vertical Depth) */}
        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>الارتفاع الرأسي للصوت (Z-Elevation):</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {localSettings.z > 0 ? `+${localSettings.z}` : localSettings.z}
            </span>
          </div>
          <input
            type="range"
            min="-1.0"
            max="1.0"
            step="0.1"
            value={localSettings.z}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const updated = { ...localSettings, z: val };
              setLocalSettings(updated);
              onUpdateSpatial(updated);
            }}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>من الأسفل (Below)</span>
            <span>مستوى الأذن (Level)</span>
            <span>من الأعلى (Overhead)</span>
          </div>
        </div>

        {/* Spatial Presets */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300">أوضاع المسرح الصوتي الجاهزة:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-right flex items-center justify-between text-xs transition cursor-pointer group"
              >
                <span className="font-medium text-slate-200 group-hover:text-white">
                  {preset.label}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
