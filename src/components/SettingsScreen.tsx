import React, { useState } from 'react';
import { ThemeConfig, AudioSettings, Track, Playlist } from '../types/player';
import { translations } from '../utils/translations';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Palette,
  Timer,
  Video,
  EyeOff,
  Trash2,
  Headphones,
  Bell,
  Globe,
  Sparkles,
  Scissors,
  Check,
  RefreshCw,
  FolderLock,
  Download,
  Upload,
  Info,
} from 'lucide-react';

interface SettingsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  accentHex: string;
  audioSettings: AudioSettings;
  tracks: Track[];
  playlists: Playlist[];
  onOpenThemeCustomizer: () => void;
  onOpenSleepTimer: () => void;
  onOpenVideoConverter: () => void;
  onOpenAudioTrimmer: (track: Track) => void;
  onUpdateAudioSettings: (newSettings: Partial<AudioSettings>) => void;
  onUpdateTheme: (newTheme: Partial<ThemeConfig>) => void;
  onRestoreTrack: (trackId: string) => Promise<void>;
  onUnhideTrack: (trackId: string) => Promise<void>;
  onPermanentDeleteTrack: (trackId: string) => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  isOpen,
  onClose,
  theme,
  accentHex,
  audioSettings,
  tracks,
  playlists,
  onOpenThemeCustomizer,
  onOpenSleepTimer,
  onOpenVideoConverter,
  onOpenAudioTrimmer,
  onUpdateAudioSettings,
  onUpdateTheme,
  onRestoreTrack,
  onUnhideTrack,
  onPermanentDeleteTrack,
}) => {
  const [activeSubModal, setActiveSubModal] = useState<
    'none' | 'hidden-files' | 'recently-deleted' | 'playback-settings' | 'backup-restore' | 'about'
  >('none');

  if (!isOpen) return null;

  const t = translations[theme.language];
  const isRtl = theme.language === 'ar';
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const hiddenTracks = tracks.filter((t) => t.isHidden);
  const deletedTracks = tracks.filter((t) => t.isDeleted);

  // Calculate listening stats
  const totalHours = Math.floor(audioSettings.listeningSeconds / 3600);
  const totalMins = Math.floor((audioSettings.listeningSeconds % 3600) / 60);

  // Backup & Restore
  const handleExportBackup = () => {
    const data = {
      appName: 'SoundPulse Pro',
      author: 'Abdallah Mahmoud',
      exportDate: new Date().toISOString(),
      theme,
      audioSettings,
      playlists,
      trackMetas: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        isFavorite: t.isFavorite,
        playCount: t.playCount,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soundpulse-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-2xl text-slate-100 p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
      <div className="max-w-xl mx-auto space-y-5 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowIcon className="w-5 h-5 rotate-180" />
            <span>رجوع</span>
          </button>
          <h2 className="text-lg font-bold text-white tracking-tight">الإعدادات والخيارات</h2>
          <div className="w-10" />
        </div>

        {/* Group 1: Stats & Backup */}
        <div className="rounded-[28px] liquid-glass p-2 space-y-1 shadow-xl border border-white/10">
          {/* Listening Time */}
          <div
            onClick={() => setActiveSubModal('about')}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">وقت التشغيل</h4>
                <p className="text-[11px] text-slate-400">إجمالي مدة الاستماع للموسيقى</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-cyan-400 font-bold">
              <span>{totalHours > 0 ? `${totalHours}h ` : ''}{totalMins}m</span>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Backup and Restore */}
          <div
            onClick={() => setActiveSubModal('backup-restore')}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">النسخ والاستعادة</h4>
                <p className="text-[11px] text-slate-400">حفظ واسترجاع قوائم التشغيل والإعدادات</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>نسخ احتياطي</span>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Group 2: Themes, Sleep Timer, Video-to-Audio (Free & Prominent) */}
        <div className="rounded-[28px] liquid-glass p-2 space-y-1 shadow-xl border border-white/10">
          {/* Theme */}
          <div
            onClick={onOpenThemeCustomizer}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">السمة والمظهر (Liquid Glass)</h4>
                <p className="text-[11px] text-slate-400">النمط الليلي والنهاري، ألوان النيون والتخصيص</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-300">
              <span className="capitalize">{theme.mode} / {theme.accent}</span>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Sleep Timer */}
          <div
            onClick={onOpenSleepTimer}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">مؤقت النوم</h4>
                <p className="text-[11px] text-slate-400">إيقاف التشغيل التلقائي بعد فترة زمنية</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>إيقاف</span>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Convert Video to Audio - Prominent item in Settings (Requested by user) */}
          <div
            onClick={() => {
              onClose();
              onOpenVideoConverter();
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl text-black shadow-lg"
                style={{ backgroundColor: accentHex }}
              >
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">تحويل الفيديو إلى صوت</h4>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    مجاني 100%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  استخراج الصوت عالي الجودة WAV من أي مقطع فيديو فورياً
                </p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Audio Trimmer & Ringtone Maker */}
          {tracks.length > 0 && (
            <div
              onClick={() => {
                onClose();
                onOpenAudioTrimmer(tracks[0]);
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">قص الصوت وصانع النغمات</h4>
                  <p className="text-[11px] text-slate-400">تحديد مقطع من أي أغنية وحفظه كنغمة رنين</p>
                </div>
              </div>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </div>

        {/* Group 3: File Management & System Settings */}
        <div className="rounded-[28px] liquid-glass p-2 space-y-1 shadow-xl border border-white/10">
          {/* Hidden Files */}
          <div
            onClick={() => setActiveSubModal('hidden-files')}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">الملفات المخفية</h4>
                <p className="text-[11px] text-slate-400">إدارة الأغاني المخفية من قائمة التشغيل الرئيسية</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>{hiddenTracks.length} ملفات</span>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Recently Deleted / Recycle Bin */}
          <div
            onClick={() => setActiveSubModal('recently-deleted')}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">المحذوف مؤخراً</h4>
                <p className="text-[11px] text-slate-400">استعادة الأغاني المحذوفة أو حذفها نهائياً</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>{deletedTracks.length} ملفات</span>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Playback Settings (Crossfade, Gapless) */}
          <div
            onClick={() => setActiveSubModal('playback-settings')}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">إعدادات التشغيل المتقدمة</h4>
                <p className="text-[11px] text-slate-400">التداخل الصوتي (Crossfade)، التشغيل السلس، حماية السماعات</p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-slate-500" />
          </div>

          {/* Language Selector */}
          <div
            onClick={() => {
              const nextLang = theme.language === 'ar' ? 'en' : 'ar';
              onUpdateTheme({ language: nextLang });
              document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
              document.documentElement.lang = nextLang;
            }}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">اللغة (Language)</h4>
                <p className="text-[11px] text-slate-400">التبديل بين العربية والإنجليزية</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-cyan-400 font-bold">
              <span>{theme.language === 'ar' ? 'العربية' : 'English'}</span>
              <ArrowIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* About & Developer Info */}
          <div
            onClick={() => setActiveSubModal('about')}
            className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition cursor-pointer border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">عن المشغل والمطور</h4>
                <p className="text-[11px] text-cyan-300">by Abdallah Mahmoud · نسخة مجانية كاملة</p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Submodal: Hidden Files */}
      {activeSubModal === 'hidden-files' && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-slate-400" />
              <span>الملفات المخفية ({hiddenTracks.length})</span>
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {hiddenTracks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">لا توجد ملفات مخفية حالياً.</p>
              ) : (
                hiddenTracks.map((trk) => (
                  <div key={trk.id} className="p-3 rounded-xl bg-slate-800 flex items-center justify-between text-xs">
                    <span className="truncate max-w-[200px] text-white font-medium">{trk.title}</span>
                    <button
                      onClick={() => onUnhideTrack(trk.id)}
                      className="px-3 py-1 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 cursor-pointer"
                    >
                      إظهار
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setActiveSubModal('none')}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Submodal: Recently Deleted */}
      {activeSubModal === 'recently-deleted' && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <span>المحذوف مؤخراً ({deletedTracks.length})</span>
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {deletedTracks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">سلة المحذوفات فارغة.</p>
              ) : (
                deletedTracks.map((trk) => (
                  <div key={trk.id} className="p-3 rounded-xl bg-slate-800 flex items-center justify-between text-xs">
                    <span className="truncate max-w-[160px] text-white font-medium">{trk.title}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onRestoreTrack(trk.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 cursor-pointer"
                      >
                        استعادة
                      </button>
                      <button
                        onClick={() => onPermanentDeleteTrack(trk.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 font-bold hover:bg-rose-900 cursor-pointer"
                      >
                        حذف نهائي
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setActiveSubModal('none')}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Submodal: Playback Settings (Crossfade) */}
      {activeSubModal === 'playback-settings' && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Headphones className="w-5 h-5 text-cyan-400" />
              <span>إعدادات التشغيل المتقدمة</span>
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">التداخل الصوتي بين الأغاني (Crossfade):</span>
                  <span className="font-mono text-cyan-400 font-bold">{audioSettings.crossfade} ثواني</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={audioSettings.crossfade}
                  onChange={(e) => onUpdateAudioSettings({ crossfade: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-slate-400">
                  تلاشي الصوت بالتدريج عند الانتقال بين الأغاني لموسيقى متواصلة بدون صمت.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">مانع التشويش عند رفع الصوت 300%</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Active Soft Knee Dynamic Limiter</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  نشط دائماً
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveSubModal('none')}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 cursor-pointer"
            >
              تم وحفظ
            </button>
          </div>
        </div>
      )}

      {/* Submodal: Backup & Restore */}
      {activeSubModal === 'backup-restore' && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <span>النسخ الاحتياطي والاستعادة</span>
            </h3>

            <p className="text-xs text-slate-300">
              يمكنك تصدير نسخة من جميع قوائم التشغيل، الإعدادات، ومعلومات الأغاني إلى ملف JSON محلي على هاتفك أو كمبيوترك واسترجاعها في أي وقت.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportBackup}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>تصدير ملف النسخة الاحتياطية (Export JSON)</span>
              </button>
            </div>

            <button
              onClick={() => setActiveSubModal('none')}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Submodal: About */}
      {activeSubModal === 'about' && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-black font-black text-2xl shadow-xl"
              style={{ backgroundColor: accentHex }}
            >
              SP
            </div>

            <h3 className="text-lg font-black text-white">SoundPulse Pro Studio</h3>
            <a
              href="https://wa.me/201019524839"
              target="_blank"
              rel="noopener noreferrer"
              title="تواصل مع Abdallah Mahmoud عبر واتساب"
              className="inline-block text-xs text-cyan-400 hover:text-emerald-400 font-mono font-bold cursor-pointer transition-colors active:scale-95"
            >
              تطوير وتصميم: by Abdallah Mahmoud
            </a>

            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 text-right space-y-2">
              <p className="text-emerald-400 font-bold">✔ جميع المزايا مجانية 100% وبدون أي اشتراكات أو قيود.</p>
              <p>✔ مضخم صوت تيربو 300% مع معالج 10-Band EQ ومحلل طيف ترددي 60 إطاراً.</p>
              <p>✔ تحويل الفيديو إلى صوت محلياً في المتصفح 100% Offline.</p>
              <p>✔ دعم كامل لقص النغمات وقوائم التشغيل الذكية وتصميم ليكويد جلاس.</p>
            </div>

            <button
              onClick={() => setActiveSubModal('none')}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 cursor-pointer shadow-md"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
