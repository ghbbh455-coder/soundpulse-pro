import React, { useState, useEffect, useRef } from 'react';
import { Track, Playlist, ThemeConfig } from '../types/player';
import { translations } from '../utils/translations';
import {
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
  Zap,
  Sliders,
  Sparkles,
  Maximize2,
  Shuffle,
  FolderMinus,
  X,
  ChevronLeft,
} from 'lucide-react';

export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

interface TrackContextMenuProps {
  track: Track | null;
  isOpen: boolean;
  anchorRect?: AnchorRect | null;
  playlists: Playlist[];
  theme: ThemeConfig;
  accentHex: string;
  currentPlaylistId?: string; // if opened inside a specific playlist
  onClose: () => void;
  onPlayNow?: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  onCreatePlaylistAndAdd?: (playlistName: string, trackId: string) => Promise<void>;
  onOpenTrimmer: (track: Track) => void;
  onOpenEditor: (track: Track) => void;
  onHideTrack: (trackId: string) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
  onBoost300?: () => void;
  onOpenEqualizer?: () => void;
  onOpenLiquidPlayer?: () => void;
  onRemoveFromPlaylist?: (playlistId: string, trackId: string) => void;
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  track,
  isOpen,
  anchorRect,
  playlists,
  theme,
  accentHex,
  currentPlaylistId,
  onClose,
  onPlayNow,
  onPlayNext,
  onAddToQueue,
  onToggleFavorite,
  onAddToPlaylist,
  onCreatePlaylistAndAdd,
  onOpenTrimmer,
  onOpenEditor,
  onHideTrack,
  onDeleteTrack,
  onBoost300,
  onOpenEqualizer,
  onOpenLiquidPlayer,
  onRemoveFromPlaylist,
}) => {
  const [activeSubView, setActiveSubView] = useState<'main' | 'playlists' | 'details'>('main');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveSubView('main');
      setToastMsg(null);
      setNewPlaylistName('');
    }
  }, [isOpen, track?.id]);

  if (!isOpen || !track) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  const handleDownload = () => {
    if (!track.blobUrl) return;
    const a = document.createElement('a');
    a.href = track.blobUrl;
    a.download = `${track.artist} - ${track.title}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('جارٍ تحميل ملف الصوت عالي النقاء...');
    setTimeout(onClose, 1200);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: track.title,
          text: `استمع إلى ${track.title} للفنان ${track.artist} عبر مشغل SoundPulse Pro`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${track.title} - ${track.artist}`);
      showToast('تم نسخ اسم ومعلومات الأغنية للحافظة!');
    }
  };

  // Calculate desktop position based on anchorRect
  let desktopStyle: React.CSSProperties = {};
  if (!isMobile && anchorRect) {
    const menuWidth = 340;
    const menuHeight = 520;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Position horizontally: align with anchor or fit inside viewport
    let left = anchorRect.left - menuWidth + anchorRect.width;
    if (left < 16) left = 16;
    if (left + menuWidth > windowWidth - 16) {
      left = windowWidth - menuWidth - 16;
    }

    // Position vertically: flip upwards if not enough room below
    let top = anchorRect.bottom + 8;
    if (top + menuHeight > windowHeight - 16) {
      top = Math.max(16, anchorRect.top - menuHeight - 8);
    }

    desktopStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      maxHeight: `${Math.min(menuHeight, windowHeight - 40)}px`,
    };
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Universal Dimmed Backdrop with Blur - Click Outside closes menu */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Menu Container: Floating Popover on Desktop, Smooth Bottom Sheet on Mobile */}
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        style={
          isMobile
            ? {
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '85vh',
                background: 'linear-gradient(180deg, rgba(16, 20, 36, 0.98) 0%, rgba(8, 10, 18, 0.99) 100%)',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.85)',
              }
            : {
                ...desktopStyle,
                background: 'linear-gradient(160deg, rgba(20, 26, 48, 0.97) 0%, rgba(9, 12, 22, 0.98) 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 25px rgba(0,242,254,0.15)',
              }
        }
        className={`z-[10000] border border-white/15 flex flex-col overflow-hidden text-slate-100 ${
          isMobile
            ? 'rounded-t-[36px] p-5 animate-in slide-in-from-bottom duration-300'
            : 'rounded-[28px] p-4 animate-in zoom-in-95 duration-200'
        }`}
      >
        {/* Mobile Drag Indicator Bar */}
        {isMobile && (
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-3 shrink-0" />
        )}

        {/* 1. Track Mini Header Card */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 shadow-lg border border-white/15 flex items-center justify-center">
              {track.coverArt ? (
                <img src={track.coverArt} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <Music className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">{track.title}</h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {track.artist} {track.album ? `· ${track.album}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-cyan-400">
                <span>
                  {Math.floor(track.duration / 60)}:
                  {(track.duration % 60).toString().padStart(2, '0')}
                </span>
                <span>·</span>
                <span className="uppercase">{track.fileFormat}</span>
                {track.playCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400 font-bold">{track.playCount} تشغيل</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            title="إغلاق القائمة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Toast Feedback inside menu */}
        {toastMsg && (
          <div className="my-2 p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs text-center font-bold animate-in fade-in duration-150">
            {toastMsg}
          </div>
        )}

        {/* 2. Menu Content: Main Options vs Playlists Sub-view vs Details Sub-view */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-0.5 scrollbar-thin">
          {activeSubView === 'playlists' ? (
            /* Subview: Add to Playlist */
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveSubView('main')}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  <span>العودة للخيارات</span>
                </button>
                <span className="text-xs font-bold text-white">إضافة لقائمة تشغيل</span>
              </div>

              {/* Quick Create New Playlist Input */}
              <div className="p-2 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="اسم قائمة تشغيل جديدة..."
                  className="flex-1 bg-transparent text-white text-xs px-2 focus:outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={async () => {
                    if (!newPlaylistName.trim()) return;
                    if (onCreatePlaylistAndAdd) {
                      await onCreatePlaylistAndAdd(newPlaylistName.trim(), track.id);
                    }
                    showToast(`تم إنشاء "${newPlaylistName}" وإضافة المقطع إليها!`);
                    setNewPlaylistName('');
                    setTimeout(onClose, 1000);
                  }}
                  disabled={!newPlaylistName.trim()}
                  className="px-3 py-1.5 rounded-xl text-black font-bold text-xs transition cursor-pointer disabled:opacity-40"
                  style={{ backgroundColor: accentHex }}
                >
                  إنشاء وإضافة
                </button>
              </div>

              {/* Playlists List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {playlists.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    لا توجد قوائم تشغيل حتى الآن، أنشئ أول قائمة أعلاه!
                  </p>
                ) : (
                  playlists.map((pl) => {
                    const isAlreadyIn = pl.trackIds.includes(track.id);
                    return (
                      <button
                        key={pl.id}
                        disabled={isAlreadyIn}
                        onClick={async () => {
                          await onAddToPlaylist(pl.id, track.id);
                          showToast(`تمت إضافة المقطع إلى قائمة "${pl.name}" بنجاح!`);
                          setTimeout(onClose, 1000);
                        }}
                        className={`w-full p-2.5 rounded-2xl border text-right transition flex items-center justify-between cursor-pointer ${
                          isAlreadyIn
                            ? 'bg-white/5 border-white/5 opacity-60 cursor-not-allowed'
                            : 'bg-white/5 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: pl.coverColor || accentHex }}
                          />
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {pl.name}
                          </span>
                        </div>
                        {isAlreadyIn ? (
                          <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> مضافة بالفعل
                          </span>
                        ) : (
                          <Plus className="w-4 h-4 text-cyan-400" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeSubView === 'details' ? (
            /* Subview: Technical Audio Specs */
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveSubView('main')}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                  <span>العودة للخيارات</span>
                </button>
                <span className="text-xs font-bold text-white">تفاصيل الملف التقنية</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">العنوان:</span>
                  <span className="text-white font-medium truncate max-w-[190px]">{track.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">الفنان:</span>
                  <span className="text-white font-medium truncate max-w-[190px]">{track.artist}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">الألبوم:</span>
                  <span className="text-white font-medium truncate max-w-[190px]">{track.album || 'Single'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">النوع الموسيقي:</span>
                  <span className="text-white font-medium">{track.genre || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">صيغة الملف:</span>
                  <span className="text-cyan-400 font-mono font-bold uppercase">{track.fileFormat}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">حجم الملف:</span>
                  <span className="text-white font-mono">
                    {(track.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">المدة الدقيقة:</span>
                  <span className="text-white font-mono">
                    {Math.floor(track.duration / 60)} دقيقة و{' '}
                    {(track.duration % 60).toFixed(0)} ثانية
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">تاريخ الإضافة:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {new Date(track.dateAdded).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">مرات الاستماع:</span>
                  <span className="text-amber-400 font-bold font-mono">{track.playCount} مرة</span>
                </div>
              </div>
            </div>
          ) : (
            /* Main Rich Menu Options Organized into Categorized Sections */
            <div className="space-y-3">
              {/* Category 1: Playback & Queue */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                  التشغيل والطابور
                </span>

                {/* 1. Play Now */}
                <button
                  onClick={() => {
                    if (onPlayNow) onPlayNow(track);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                        تشغيل الآن
                      </h4>
                      <p className="text-[10px] text-slate-400">بدء تشغيل هذا المقطع فوراً</p>
                    </div>
                  </div>
                </button>

                {/* 2. Play Next */}
                <button
                  onClick={() => {
                    onPlayNext(track);
                    showToast('تمت جدولة الأغنية لتكون التالية مباشرة في التشغيل!');
                    setTimeout(onClose, 800);
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform">
                      <ListPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        تشغيل التالي (Play Next)
                      </h4>
                      <p className="text-[10px] text-slate-400">إدراجها بعد المقطع الحالي مباشرة</p>
                    </div>
                  </div>
                </button>

                {/* 3. Add to Queue */}
                <button
                  onClick={() => {
                    onAddToQueue(track);
                    showToast('تمت إضافة الأغنية إلى نهاية طابور الانتظار!');
                    setTimeout(onClose, 800);
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform">
                      <Shuffle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                        إضافة لقائمة الانتظار (Queue)
                      </h4>
                      <p className="text-[10px] text-slate-400">وضعها في نهاية قائمة التشغيل</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Category 2: Playlists & Favorites */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                  القوائم والمفضلة
                </span>

                {/* 4. Add to Playlist */}
                <button
                  onClick={() => setActiveSubView('playlists')}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-purple-500/15 text-purple-400 group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                        إضافة إلى قائمة تشغيل
                      </h4>
                      <p className="text-[10px] text-slate-400">اختر قائمة أو أنشئ قائمة جديدة</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>

                {/* 5. Toggle Favorite */}
                <button
                  onClick={() => {
                    onToggleFavorite(track.id);
                    showToast(
                      track.isFavorite
                        ? 'تمت الإزالة من المفضلة'
                        : 'تمت الإضافة إلى الأغاني المفضلة ❤️'
                    );
                    setTimeout(onClose, 800);
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-rose-500/15 text-rose-400 group-hover:scale-110 transition-transform">
                      <Heart
                        className={`w-4 h-4 ${track.isFavorite ? 'text-rose-500 fill-rose-500' : ''}`}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                        {track.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      </h4>
                      <p className="text-[10px] text-slate-400">الوصول السريع من تبويب المفضلة</p>
                    </div>
                  </div>
                </button>

                {/* Remove from current playlist (if opened inside a playlist) */}
                {currentPlaylistId && onRemoveFromPlaylist && (
                  <button
                    onClick={() => {
                      onRemoveFromPlaylist(currentPlaylistId, track.id);
                      showToast('تمت إزالة المقطع من هذه القائمة');
                      setTimeout(onClose, 800);
                    }}
                    className="w-full p-2.5 rounded-2xl hover:bg-rose-500/10 text-rose-300 transition flex items-center justify-between text-right cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-xl bg-rose-500/15 text-rose-400 group-hover:scale-110 transition-transform">
                        <FolderMinus className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-rose-300">
                          إزالة من هذه القائمة
                        </h4>
                        <p className="text-[10px] text-rose-400/70">حذف المقطع من القائمة الحالية</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Category 3: Sound Studio & Special FX */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                  استوديو الصوت والتأثيرات
                </span>

                {/* 6. Boost Volume 300% */}
                <button
                  onClick={() => {
                    if (onBoost300) onBoost300();
                    showToast('تم تفعيل التيربو ومضاعفة الصوت إلى 300% ⚡');
                    setTimeout(onClose, 1000);
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
                        تضخيم الصوت 300% فورياً (Turbo Boost)
                      </h4>
                      <p className="text-[10px] text-slate-400">تفعيل أقصى طاقة لمكبرات الصوت بدون تشويش</p>
                    </div>
                  </div>
                </button>

                {/* 7. Audio Trimmer & Ringtone */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenTrimmer(track);
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-yellow-500/15 text-yellow-400 group-hover:scale-110 transition-transform">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">
                        قص الصوت وصانع النغمات
                      </h4>
                      <p className="text-[10px] text-slate-400">قص جزء محدد بدقة وحفظه كنغمة</p>
                    </div>
                  </div>
                </button>

                {/* 8. Open in Equalizer */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenEqualizer) onOpenEqualizer();
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                        ضبط في المعادل الصوتي (10-Band EQ)
                      </h4>
                      <p className="text-[10px] text-slate-400">تعديل الترددات، الباس، والتجسيم الصوتي</p>
                    </div>
                  </div>
                </button>

                {/* 9. Open Liquid Fullscreen Player */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenLiquidPlayer) onOpenLiquidPlayer();
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 group-hover:scale-110 transition-transform">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                        فتح شاشة التشغيل والمؤثرات (Liquid Player)
                      </h4>
                      <p className="text-[10px] text-slate-400">عرض الأسطوانة والمحلل البصري 60fps</p>
                    </div>
                  </div>
                </button>

                {/* 10. Edit ID3 Tags */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenEditor(track);
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-teal-500/15 text-teal-400 group-hover:scale-110 transition-transform">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors">
                        تعديل بيانات المقطع (ID3 Tags)
                      </h4>
                      <p className="text-[10px] text-slate-400">تغيير الاسم، الفنان، الألبوم، والنوع</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Category 4: Share & Export */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                  المشاركة والتنزيل
                </span>

                {/* 11. Download Audio File */}
                <button
                  onClick={handleDownload}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-blue-500/15 text-blue-400 group-hover:scale-110 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                        تحميل ملف الصوت عالي الدقة (WAV)
                      </h4>
                      <p className="text-[10px] text-slate-400">حفظ نسخة نقية غير مضغوطة على جهازك</p>
                    </div>
                  </div>
                </button>

                {/* 12. Share Track */}
                <button
                  onClick={handleShare}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-400 group-hover:scale-110 transition-transform">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                        مشاركة المقطع
                      </h4>
                      <p className="text-[10px] text-slate-400">مشاركة العنوان والفنان أو نسخها</p>
                    </div>
                  </div>
                </button>

                {/* 13. Technical File Details */}
                <button
                  onClick={() => setActiveSubView('details')}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-slate-700/40 text-slate-300 group-hover:scale-110 transition-transform">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-slate-200 transition-colors">
                        تفاصيل ومعلومات الملف الفنية
                      </h4>
                      <p className="text-[10px] text-slate-400">الصيغة، الحجم، المدة ومعدل الاستماع</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Category 5: Library Organization & Deletion */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
                  التنظيم والحذف
                </span>

                {/* 14. Hide Track */}
                <button
                  onClick={async () => {
                    await onHideTrack(track.id);
                    showToast('تم إخفاء الأغنية، يمكنك استعادتها من الإعدادات');
                    setTimeout(onClose, 800);
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/10 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-slate-700/40 text-slate-400 group-hover:scale-110 transition-transform">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-slate-200 transition-colors">
                        إخفاء من المكتبة
                      </h4>
                      <p className="text-[10px] text-slate-400">إخفاء دون حذف، تظهر في قسم الإعدادات</p>
                    </div>
                  </div>
                </button>

                {/* 15. Delete Track to Recycle Bin */}
                <button
                  onClick={async () => {
                    await onDeleteTrack(track.id);
                    showToast('تم نقل المقطع إلى سلة المحذوفات');
                    setTimeout(onClose, 800);
                  }}
                  className="w-full p-2.5 rounded-2xl bg-rose-950/20 hover:bg-rose-900/40 border border-rose-500/20 transition flex items-center justify-between text-right cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-300">
                        حذف إلى سلة المحذوفات
                      </h4>
                      <p className="text-[10px] text-rose-400/80">يمكن استرجاع المقطع لاحقاً من الإعدادات</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
