import React, { useState } from 'react';
import { Playlist, Track, SortOption, ThemeConfig } from '../types/player';
import { translations } from '../utils/translations';
import { TrackContextMenu, AnchorRect } from './TrackContextMenu';
import {
  ListMusic,
  Plus,
  Play,
  Trash2,
  ArrowUpDown,
  Music,
  MoreVertical,
  Sparkles,
} from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  theme: ThemeConfig;
  accentHex: string;
  onPlayTrack: (track: Track, playlistQueue?: Track[]) => void;
  onCreatePlaylist: (playlist: Playlist) => Promise<void>;
  onUpdatePlaylist: (playlist: Playlist) => Promise<void>;
  onDeletePlaylist: (id: string) => Promise<void>;
  onPlayNext?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onToggleFavorite?: (trackId: string) => void;
  onAddToPlaylist?: (playlistId: string, trackId: string) => Promise<void>;
  onCreatePlaylistAndAdd?: (playlistName: string, trackId: string) => Promise<void>;
  onOpenTrimmer?: (track: Track) => void;
  onOpenEditor?: (track: Track) => void;
  onHideTrack?: (trackId: string) => Promise<void>;
  onDeleteTrack?: (trackId: string) => Promise<void>;
  onBoost300?: () => void;
  onOpenEqualizer?: () => void;
  onOpenLiquidPlayer?: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  currentTrack,
  isPlaying,
  theme,
  accentHex,
  onPlayTrack,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onPlayNext = () => {},
  onAddToQueue = () => {},
  onToggleFavorite = () => {},
  onAddToPlaylist = async () => {},
  onCreatePlaylistAndAdd,
  onOpenTrimmer = () => {},
  onOpenEditor = () => {},
  onHideTrack = async () => {},
  onDeleteTrack = async () => {},
  onBoost300,
  onOpenEqualizer,
  onOpenLiquidPlayer,
}) => {
  const t = translations[theme.language];
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [newPlaylistColor, setNewPlaylistColor] = useState('#00f2fe');

  // Track context menu state
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<AnchorRect | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      description: newPlaylistDesc.trim(),
      trackIds: [],
      createdAt: Date.now(),
      coverColor: newPlaylistColor,
      autoSort: 'title-asc',
    };

    await onCreatePlaylist(newPl);
    setSelectedPlaylist(newPl);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
  };

  const handleAutoSortChange = async (playlist: Playlist, sortType: SortOption | 'manual') => {
    const updated = { ...playlist, autoSort: sortType };
    await onUpdatePlaylist(updated);
    setSelectedPlaylist(updated);
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    const targetPl = playlists.find((p) => p.id === playlistId) || selectedPlaylist;
    if (!targetPl) return;

    const updated = {
      ...targetPl,
      trackIds: targetPl.trackIds.filter((id) => id !== trackId),
    };
    await onUpdatePlaylist(updated);
    setSelectedPlaylist(updated);
  };

  // If a playlist is selected, show its tracks list
  if (selectedPlaylist) {
    const playlistTracks = selectedPlaylist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is Track => Boolean(t));

    const sortedTracks = [...playlistTracks].sort((a, b) => {
      if (selectedPlaylist.autoSort === 'manual') return 0;
      switch (selectedPlaylist.autoSort) {
        case 'title-asc':
          return a.title.localeCompare(b.title, 'ar');
        case 'title-desc':
          return b.title.localeCompare(a.title, 'ar');
        case 'artist':
          return a.artist.localeCompare(b.artist, 'ar');
        case 'duration-asc':
          return a.duration - b.duration;
        case 'duration-desc':
          return b.duration - a.duration;
        case 'date-newest':
          return b.dateAdded - a.dateAdded;
        case 'date-oldest':
          return a.dateAdded - b.dateAdded;
        case 'plays-desc':
          return b.playCount - a.playCount;
        default:
          return 0;
      }
    });

    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-24">
        {/* Back Button and Banner */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="px-4 py-2 rounded-xl liquid-glass text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
          >
            ← العودة لجميع القوائم
          </button>
        </div>

        {/* Selected Playlist Banner */}
        <div
          className="p-6 sm:p-8 rounded-[32px] liquid-glass border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          style={{
            background: `linear-gradient(135deg, ${selectedPlaylist.coverColor}25 0%, rgba(15,23,42,0.7) 100%)`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-2xl shrink-0"
              style={{ backgroundColor: selectedPlaylist.coverColor }}
            >
              <ListMusic className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">{selectedPlaylist.name}</h3>
              <p className="text-xs text-slate-300 mt-1">
                {selectedPlaylist.description || 'قائمة مخصصة'} · {sortedTracks.length} مقطع صوتي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sortedTracks.length > 0 && (
              <button
                onClick={() => onPlayTrack(sortedTracks[0], sortedTracks)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs text-black transition shadow-xl hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <Play className="w-4 h-4 fill-black" />
                <span>تشغيل الكل</span>
              </button>
            )}
          </div>
        </div>

        {/* Auto-Sort Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl liquid-glass border border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <ArrowUpDown className="w-4 h-4 text-cyan-400" />
            <span>الترتيب التلقائي الذكي:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'title-asc', label: t.sorting.titleAsc },
              { id: 'artist', label: t.sorting.artist },
              { id: 'duration-asc', label: t.sorting.durationAsc },
              { id: 'date-newest', label: t.sorting.dateNewest },
              { id: 'plays-desc', label: t.sorting.playsDesc },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => handleAutoSortChange(selectedPlaylist, s.id as SortOption)}
                className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition cursor-pointer ${
                  selectedPlaylist.autoSort === s.id
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks List inside Selected Playlist */}
        <div className="space-y-2">
          {sortedTracks.length === 0 ? (
            <div className="p-10 rounded-3xl liquid-glass border border-white/10 text-center space-y-2">
              <Music className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">هذه القائمة فارغة حالياً</p>
              <p className="text-xs text-slate-500">
                انتقل لتبويب الأغاني واضغط على زر الثلاث نقاط (⋯) واختر "إضافة لقائمة".
              </p>
            </div>
          ) : (
            sortedTracks.map((trk, idx) => {
              const isTrkPlaying = currentTrack?.id === trk.id && isPlaying;
              return (
                <div
                  key={trk.id}
                  className={`p-3.5 rounded-2xl liquid-glass-card flex items-center justify-between gap-4 transition cursor-pointer hover:border-cyan-400/40 ${
                    currentTrack?.id === trk.id ? 'liquid-glass-active' : ''
                  }`}
                  onClick={() => onPlayTrack(trk, sortedTracks)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xs font-mono text-slate-500 w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {trk.coverArt ? (
                        <img src={trk.coverArt} alt={trk.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isTrkPlaying ? 'text-cyan-400' : 'text-white'}`}>
                        {trk.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{trk.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      {Math.floor(trk.duration / 60)}:{(trk.duration % 60).toString().padStart(2, '0')}
                    </span>

                    {/* 3-dots Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenuAnchor({
                          top: rect.top,
                          bottom: rect.bottom,
                          left: rect.left,
                          right: rect.right,
                          width: rect.width,
                          height: rect.height,
                        });
                        setContextMenuTrack(trk);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="المزيد من الخيارات"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Quick remove from playlist */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTrack(selectedPlaylist.id, trk.id);
                      }}
                      title="إزالة من القائمة"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-white/5 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Context menu for playlist tracks */}
        <TrackContextMenu
          track={contextMenuTrack}
          isOpen={Boolean(contextMenuTrack)}
          anchorRect={contextMenuAnchor}
          playlists={playlists}
          theme={theme}
          accentHex={accentHex}
          currentPlaylistId={selectedPlaylist.id}
          onClose={() => {
            setContextMenuTrack(null);
            setContextMenuAnchor(null);
          }}
          onPlayNow={(trk) => onPlayTrack(trk, sortedTracks)}
          onPlayNext={onPlayNext}
          onAddToQueue={onAddToQueue}
          onToggleFavorite={onToggleFavorite}
          onAddToPlaylist={onAddToPlaylist}
          onCreatePlaylistAndAdd={onCreatePlaylistAndAdd}
          onOpenTrimmer={onOpenTrimmer}
          onOpenEditor={onOpenEditor}
          onHideTrack={onHideTrack}
          onDeleteTrack={onDeleteTrack}
          onBoost300={onBoost300}
          onOpenEqualizer={onOpenEqualizer}
          onOpenLiquidPlayer={onOpenLiquidPlayer}
          onRemoveFromPlaylist={handleRemoveTrack}
        />
      </div>
    );
  }

  // Main Playlists Overview Grid matching Screenshot 2
  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-24">
      {/* 1. Big "+ إضافة جديد" Card matching screenshot 2 */}
      <div
        onClick={() => setShowCreateModal(true)}
        className="p-8 rounded-[28px] liquid-glass hover:bg-white/10 border border-white/10 transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 cursor-pointer group shadow-xl active:scale-[0.99]"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
          <Plus className="w-8 h-8" />
        </div>
        <span className="text-sm font-bold text-white tracking-wide mt-1">
          إضافة جديد
        </span>
      </div>

      {/* 2. Playlist Cards List matching layout in screenshot 2 */}
      <div className="space-y-3">
        {playlists.map((pl) => {
          // Resolve top 2 preview tracks
          const previewTracks = pl.trackIds
            .slice(0, 2)
            .map((id) => tracks.find((t) => t.id === id))
            .filter((t): t is Track => Boolean(t));

          const firstTrackWithCover = pl.trackIds
            .map((id) => tracks.find((t) => t.id === id))
            .find((t) => t?.coverArt);

          return (
            <div
              key={pl.id}
              onClick={() => setSelectedPlaylist(pl)}
              className="p-4 rounded-[26px] liquid-glass hover:bg-white/8 border border-white/10 transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer group shadow-lg"
            >
              {/* Left Zone: Track Count Badge (as seen in screenshot 2) */}
              <div className="text-sm font-bold font-mono text-slate-400 shrink-0 w-8 text-center">
                {pl.trackIds.length}
              </div>

              {/* Center Zone: Playlist Name + Top 2 song previews */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                  {pl.name}
                </h3>

                {previewTracks.length > 0 ? (
                  <div className="space-y-0.5">
                    {previewTracks.map((pt) => (
                      <div key={pt.id} className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                        <Music className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{pt.title} {pt.artist ? `- ${pt.artist}` : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">قائمة تشغيل فارغة</p>
                )}
              </div>

              {/* Right Zone: Large Square Album Art Collage (as seen in screenshot 2) */}
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 shadow-md border border-white/10 flex items-center justify-center relative"
                style={{ backgroundColor: pl.coverColor || '#1e293b' }}
              >
                {firstTrackWithCover?.coverArt ? (
                  <img
                    src={firstTrackWithCover.coverArt}
                    alt={pl.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListMusic className="w-8 h-8 text-white/80" />
                )}
                {/* Play hover badge */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>{t.actions.createPlaylist}</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم القائمة</label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="مثال: أغاني السفر، تدريب، هدوء..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الوصف (اختياري)</label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="وصف مختصر لمود القائمة"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">لون تمييز القائمة</label>
                <div className="flex gap-2">
                  {['#00f2fe', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewPlaylistColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        newPlaylistColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl text-black hover:brightness-110 cursor-pointer"
                  style={{ backgroundColor: accentHex }}
                >
                  {t.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
