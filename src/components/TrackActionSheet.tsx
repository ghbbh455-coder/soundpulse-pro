import React, { useState } from 'react';
import { Track, Playlist, ThemeConfig } from '../types/player';
import { translations } from '../utils/translations';
import {
  X,
  Play,
  ListPlus,
  Heart,
  Plus,
  Scissors,
  Edit3,
  Download,
  EyeOff,
  Trash2,
  Info,
  Check,
  Music,
  Share2,
} from 'lucide-react';

interface TrackActionSheetProps {
  track: Track | null;
  isOpen: boolean;
  playlists: Playlist[];
  theme: ThemeConfig;
  accentHex: string;
  onClose: () => void;
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  onOpenTrimmer: (track: Track) => void;
  onOpenEditor: (track: Track) => void;
  onHideTrack: (trackId: string) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isOpen,
  playlists,
  theme,
  accentHex,
  onClose,
  onPlayNext,
  onAddToQueue,
  onToggleFavorite,
  onAddToPlaylist,
  onOpenTrimmer,
  onOpenEditor,
  onHideTrack,
  onDeleteTrack,
}) => {
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen || !track) return null;

  const handleDownload = () => {
    if (!track.blobUrl) return;
    const a = document.createElement('a');
    a.href = track.blobUrl;
    a.download = `${track.artist} - ${track.title}.wav`;
    a.click();
    onClose();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: `استمع إلى ${track.title} للفنان ${track.artist} عبر SoundPulse Pro`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${track.title} - ${track.artist}`);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container with Liquid Glass Styling */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full sm:max-w-lg bg-slate-900 border-t sm:border border-white/15 rounded-t-[36px] sm:rounded-[36px] p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto text-slate-100"
        style={{
          background: 'linear-gradient(180deg, rgba(22, 27, 46, 0.95) 0%, rgba(10, 12, 22, 0.98) 100%)',
          backdropFilter: 'blur(32px)',
        }}
      >
        {/* Grab Handle for touch */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

        {/* Track Header Card inside sheet */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 overflow-hidden shrink-0 shadow-lg border border-white/10 flex items-center justify-center">
              {track.coverArt ? (
                <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <Music className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{track.title}</h3>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {track.artist} · {track.album || 'Single'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-cyan-400">
                <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                <span>·</span>
                <span className="uppercase">{track.fileFormat}</span>
                <span>·</span>
                <span>{(track.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {copiedNotice && (
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs text-center font-bold">
            تم نسخ معلومات الأغنية للحافظة!
          </div>
        )}

        {/* Playlist Sub-Picker View */}
        {showPlaylistPicker ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">اختر قائمة لإضافة الأغنية إليها:</h4>
              <button
                onClick={() => setShowPlaylistPicker(false)}
                className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                ← عودة للخيارات
              </button>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={async () => {
                    await onAddToPlaylist(pl.id, track.id);
                    setShowPlaylistPicker(false);
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs font-bold text-white">{pl.name}</span>
                  <Plus className="w-4 h-4 text-cyan-400" />
                </button>
              ))}
            </div>
          </div>
        ) : showDetails ? (
          /* File Technical Details View */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">تفاصيل الملف التقنية:</h4>
              <button
                onClick={() => setShowDetails(false)}
                className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
              >
                ← عودة للخيارات
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">العنوان:</span>
                <span className="text-white font-medium truncate max-w-[200px]">{track.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">الفنان:</span>
                <span className="text-white font-medium">{track.artist}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">الألبوم:</span>
                <span className="text-white font-medium">{track.album}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">النوع:</span>
                <span className="text-white font-medium">{track.genre || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">الصيغة ومعدل البت:</span>
                <span className="text-cyan-400 font-mono font-bold">{track.fileFormat.toUpperCase()} · 16-bit 44.1kHz</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">عدد مرات التشغيل:</span>
                <span className="text-amber-400 font-bold font-mono">{track.playCount} مرة</span>
              </div>
            </div>
          </div>
        ) : (
          /* Rich Full Options List */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. Play Next */}
            <button
              onClick={() => {
                onPlayNext(track);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">تشغيل التالي</h4>
                <p className="text-[10px] text-slate-400">إدراج بعد المقطع الحالي مباشرة</p>
              </div>
            </button>

            {/* 2. Add to Queue */}
            <button
              onClick={() => {
                onAddToQueue(track);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <ListPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">إضافة للانتظار</h4>
                <p className="text-[10px] text-slate-400">إضافة لنهاية قائمة التشغيل الحالية</p>
              </div>
            </button>

            {/* 3. Add to Playlist */}
            <button
              onClick={() => setShowPlaylistPicker(true)}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">إضافة لقائمة تشغيل</h4>
                <p className="text-[10px] text-slate-400">حفظ داخل إحدى قوائمك المخصصة</p>
              </div>
            </button>

            {/* 4. Favorite Toggle */}
            <button
              onClick={() => {
                onToggleFavorite(track.id);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500' : ''}`} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {track.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                </h4>
                <p className="text-[10px] text-slate-400">الوصول السريع من تبويب المفضلة</p>
              </div>
            </button>

            {/* 5. Trim Audio / Ringtone Maker */}
            <button
              onClick={() => {
                onClose();
                onOpenTrimmer(track);
              }}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">قص الصوت وصانع النغمات</h4>
                <p className="text-[10px] text-slate-400">تحديد مقطع معين وحفظه كنغمة</p>
              </div>
            </button>

            {/* 6. Edit Tags (Metadata) */}
            <button
              onClick={() => {
                onClose();
                onOpenEditor(track);
              }}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">تعديل البيانات (ID3 Tags)</h4>
                <p className="text-[10px] text-slate-400">تعديل الاسم، الفنان، الألبوم، والنوع</p>
              </div>
            </button>

            {/* 7. Download WAV file */}
            <button
              onClick={handleDownload}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">تحميل ملف الصوت (WAV)</h4>
                <p className="text-[10px] text-slate-400">حفظ نسخة نقية على ذاكرة جهازك</p>
              </div>
            </button>

            {/* 8. Share track */}
            <button
              onClick={handleShare}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">مشاركة الأغنية</h4>
                <p className="text-[10px] text-slate-400">مشاركة العنوان والفنان</p>
              </div>
            </button>

            {/* 9. File Details */}
            <button
              onClick={() => setShowDetails(true)}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-slate-700 text-slate-300 group-hover:scale-110 transition-transform">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">تفاصيل الملف</h4>
                <p className="text-[10px] text-slate-400">الصيغة، الحجم، ومعدل البت</p>
              </div>
            </button>

            {/* 10. Hide Track */}
            <button
              onClick={async () => {
                await onHideTrack(track.id);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-right transition flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-xl bg-slate-700 text-slate-300 group-hover:scale-110 transition-transform">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">إخفاء من المكتبة</h4>
                <p className="text-[10px] text-slate-400">يمكنك إظهارها من الإعدادات</p>
              </div>
            </button>

            {/* 11. Delete Track to Recycle Bin */}
            <button
              onClick={async () => {
                await onDeleteTrack(track.id);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/20 text-right transition flex items-center gap-3 cursor-pointer group sm:col-span-2"
            >
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-300">حذف إلى سلة المحذوفات</h4>
                <p className="text-[10px] text-rose-400/80">يمكن استرجاعها لاحقاً من الإعدادات</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
