import React from 'react';
import { Track, Playlist, AudioSettings, ThemeConfig } from '../types/player';
import {
  X,
  BarChart3,
  Clock,
  Music,
  Flame,
  Trophy,
  Play,
  Heart,
  Video,
  ListMusic,
  HardDrive,
  Sparkles,
} from 'lucide-react';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  playlists: Playlist[];
  settings: AudioSettings;
  accentHex: string;
  theme: ThemeConfig;
  onPlayTrack: (track: Track) => void;
}

export const InsightsModal: React.FC<InsightsModalProps> = ({
  isOpen,
  onClose,
  tracks,
  playlists,
  settings,
  accentHex,
  theme,
  onPlayTrack,
}) => {
  if (!isOpen) return null;

  const totalListeningSeconds = settings.listeningSeconds || 0;
  const hours = Math.floor(totalListeningSeconds / 3600);
  const minutes = Math.floor((totalListeningSeconds % 3600) / 60);

  // Active non-deleted tracks
  const activeTracks = tracks.filter((t) => !t.isDeleted);
  const favoriteCount = activeTracks.filter((t) => t.isFavorite).length;
  const videoCount = activeTracks.filter((t) => t.fileType === 'video').length;
  const extractedCount = activeTracks.filter((t) => t.extractedFromVideo).length;

  // Approximate storage
  const totalSizeBytes = activeTracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  // Top tracks sorted by playCount
  const topTracks = [...activeTracks]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5);

  const mostPlayedTrack = topTracks.length > 0 && topTracks[0].playCount > 0 ? topTracks[0] : null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-[36px] p-6 space-y-5 shadow-2xl overflow-y-auto text-slate-100 animate-in zoom-in-95 duration-200"
        style={{
          background: 'linear-gradient(160deg, rgba(20, 26, 48, 0.96) 0%, rgba(9, 12, 22, 0.98) 100%)',
          boxShadow: `0 25px 60px rgba(0,0,0,0.85), 0 0 35px ${accentHex}20`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-black font-bold shadow-md"
              style={{ backgroundColor: accentHex }}
            >
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">إحصائيات واستعراض الاستماع</h2>
              <p className="text-[11px] text-slate-400">ملخص نشاطك في SoundPulse Pro</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Listening Time Hero Card */}
        <div
          className="p-5 rounded-[28px] border border-white/10 relative overflow-hidden space-y-2"
          style={{
            background: `linear-gradient(135deg, ${accentHex}25 0%, rgba(15, 23, 42, 0.7) 100%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>إجمالي وقت الاستماع التراكمي</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-cyan-300">
              محدث مباشرة
            </span>
          </div>

          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-4xl font-black text-white tracking-tight font-mono">
              {hours}
            </span>
            <span className="text-sm font-bold text-slate-400">ساعة</span>
            <span className="text-3xl font-black text-cyan-400 tracking-tight font-mono mr-2">
              {minutes}
            </span>
            <span className="text-sm font-bold text-slate-400">دقيقة</span>
          </div>
          <p className="text-[11px] text-slate-400">
            مجموع الوقت الفعلي الذي قضيته في الاستمتاع بموسيقاك بدون إنترنت.
          </p>
        </div>

        {/* Most Played Track Trophy */}
        {mostPlayedTrack && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                  الأغنية الأكثر تشغيلاً
                </span>
                <h4 className="text-xs font-bold text-white truncate">{mostPlayedTrack.title}</h4>
                <p className="text-[11px] text-slate-400 truncate">{mostPlayedTrack.artist}</p>
              </div>
            </div>

            <button
              onClick={() => {
                onPlayTrack(mostPlayedTrack);
                onClose();
              }}
              className="p-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>تشغيل</span>
            </button>
          </div>
        )}

        {/* Metric Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <Music className="w-5 h-5 text-cyan-400 mx-auto" />
            <div className="text-lg font-black text-white font-mono">{activeTracks.length}</div>
            <div className="text-[10px] text-slate-400">إجمالي الأغاني</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <Heart className="w-5 h-5 text-rose-400 mx-auto" />
            <div className="text-lg font-black text-white font-mono">{favoriteCount}</div>
            <div className="text-[10px] text-slate-400">المفضلة</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <ListMusic className="w-5 h-5 text-purple-400 mx-auto" />
            <div className="text-lg font-black text-white font-mono">{playlists.length}</div>
            <div className="text-[10px] text-slate-400">قوائم التشغيل</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
            <HardDrive className="w-5 h-5 text-emerald-400 mx-auto" />
            <div className="text-lg font-black text-white font-mono">{totalSizeMB} MB</div>
            <div className="text-[10px] text-slate-400">المساحة التخزينية</div>
          </div>
        </div>

        {/* Top 5 Songs List */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>أعلى المقاطع استماعاً (Top 5)</span>
            </h3>
          </div>

          <div className="space-y-1.5">
            {topTracks.map((trk, idx) => (
              <div
                key={trk.id}
                onClick={() => {
                  onPlayTrack(trk);
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 text-center text-xs font-mono font-bold ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                      {trk.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{trk.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold shrink-0">
                  <span>{trk.playCount} تشغيل</span>
                  <Play className="w-3.5 h-3.5 fill-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Author badge */}
        <div className="text-center pt-2">
          <span className="text-[11px] font-medium text-cyan-300/80">
            SoundPulse Analytics · by Abdallah Mahmoud
          </span>
        </div>
      </div>
    </div>
  );
};
