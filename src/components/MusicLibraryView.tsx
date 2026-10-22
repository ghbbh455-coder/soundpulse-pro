import React, { useState, useRef, useEffect } from 'react';
import { Track, Playlist, SortOption, ThemeConfig } from '../types/player';
import { translations } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import { TrackContextMenu, AnchorRect } from './TrackContextMenu';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Music,
  Search,
  ArrowUpDown,
  Upload,
  Heart,
  MoreVertical,
  Play,
  Video,
  X,
  FolderSearch,
  FolderSync,
} from 'lucide-react';

interface MusicLibraryViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  theme: ThemeConfig;
  accentHex: string;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onPlayNext?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (trackId: string) => void;
  onAddFiles: (files: FileList) => Promise<void>;
  onPickAndScanFolder?: () => Promise<void>;
  onScanFromFileInput?: (files: FileList) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
  onAddToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  onCreatePlaylistAndAdd?: (playlistName: string, trackId: string) => Promise<void>;
  onOpenTrimmer: (track: Track) => void;
  onOpenEditor: (track: Track) => void;
  onHideTrack?: (trackId: string) => Promise<void>;
  onBoost300?: () => void;
  onOpenEqualizer?: () => void;
  onOpenLiquidPlayer?: () => void;
}

export const MusicLibraryView: React.FC<MusicLibraryViewProps> = ({
  tracks,
  playlists,
  currentTrack,
  isPlaying,
  theme,
  accentHex,
  onPlayTrack,
  onPlayNext = () => {},
  onAddToQueue = () => {},
  onToggleFavorite,
  onAddFiles,
  onPickAndScanFolder,
  onScanFromFileInput,
  onDeleteTrack,
  onAddToPlaylist,
  onCreatePlaylistAndAdd,
  onOpenTrimmer,
  onOpenEditor,
  onHideTrack = async () => {},
  onBoost300,
  onOpenEqualizer,
  onOpenLiquidPlayer,
}) => {
  const t = translations[theme.language];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'extracted' | 'audio'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');

  // Track Context Menu State
  const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<AnchorRect | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Filter tracks in real-time
  const filtered = tracks.filter((trk) => {
    if (trimmedQuery) {
      const matchTitle = trk.title.toLowerCase().includes(trimmedQuery);
      const matchArtist = trk.artist.toLowerCase().includes(trimmedQuery);
      const matchAlbum = trk.album.toLowerCase().includes(trimmedQuery);
      const matchGenre = trk.genre ? trk.genre.toLowerCase().includes(trimmedQuery) : false;

      if (!matchTitle && !matchArtist && !matchAlbum && !matchGenre) {
        return false;
      }
    }

    if (activeFilter === 'favorites') return trk.isFavorite;
    if (activeFilter === 'extracted') return trk.extractedFromVideo;
    if (activeFilter === 'audio') return trk.fileType === 'audio';

    return true;
  });

  // Sort tracks
  filtered.sort((a, b) => {
    switch (sortBy) {
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

  // Helper to highlight matching text in real-time
  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-cyan-400/30 text-cyan-200 px-0.5 rounded font-semibold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-4 max-w-5xl mx-auto pb-28"
    >
      {/* 1. Clean Compact Real-Time Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-[26px] liquid-glass border border-white/10 shadow-lg space-y-3">
        <div className="flex items-center gap-2.5">
          {/* Real-time search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الأغاني، الفنانين، الألبومات..."
              className="w-full pr-10 pl-9 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              <option value="date-newest" className="bg-slate-900 text-white">الأحدث</option>
              <option value="title-asc" className="bg-slate-900 text-white">العنوان (أ - ي)</option>
              <option value="artist" className="bg-slate-900 text-white">الفنان</option>
              <option value="duration-asc" className="bg-slate-900 text-white">المدة</option>
              <option value="plays-desc" className="bg-slate-900 text-white">الأكثر تشغيلاً</option>
            </select>
          </div>

          {/* Auto-Scan Music Folder Button (Requested Feature [1]) */}
          <button
            onClick={() => {
              if (onPickAndScanFolder) {
                onPickAndScanFolder();
              } else {
                folderInputRef.current?.click();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition cursor-pointer shrink-0 shadow-sm hover:brightness-110 active:scale-95"
            title="فحص مجلدات الهاتف تلقائياً وإضافة جميع ملفات الصوت (MP3, WAV, FLAC, M4A)"
          >
            <FolderSearch className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold hidden md:inline">فحص مجلد الهاتف</span>
          </button>

          {/* Directory Picker Fallback Input for mobile browsers */}
          <input
            ref={folderInputRef}
            type="file"
            {...({ webkitdirectory: '', directory: '' } as any)}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && onScanFromFileInput) {
                onScanFromFileInput(e.target.files);
              } else if (e.target.files) {
                onAddFiles(e.target.files);
              }
            }}
          />

          {/* Quick Upload Icon Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-2xl text-black font-bold transition shadow-md hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
            style={{ backgroundColor: accentHex }}
            title="استيراد ملفات فردية"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) onAddFiles(e.target.files);
            }}
          />

          {/* In-App PWA Install Button */}
          <PWAInstallButton accentHex={accentHex} />
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pt-0.5">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'favorites', label: 'المفضلة' },
              { id: 'extracted', label: 'صوت مستخرج من فيديو' },
              { id: 'audio', label: 'ملفات الصوت' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Count Badge */}
          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
            {filtered.length} مقطع
          </span>
        </div>
      </div>

      {/* 2. Track List with Smooth Motion Transitions */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-10 rounded-[28px] liquid-glass border border-white/10 text-center space-y-3"
            >
              {trimmedQuery ? (
                <>
                  <Search className="w-10 h-10 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-bold text-white">لا توجد نتائج تطابق "{searchQuery}"</h3>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-black cursor-pointer shadow-md"
                    style={{ backgroundColor: accentHex }}
                  >
                    مسح البحث
                  </button>
                </>
              ) : (
                <>
                  <Music className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-300">لا توجد مقاطع صوتية</h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-black cursor-pointer shadow-md"
                    style={{ backgroundColor: accentHex }}
                  >
                    استيراد ملفات
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            filtered.map((track, idx) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying;

              return (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.2) }}
                  onClick={() => onPlayTrack(track, filtered)}
                  className={`group p-3 sm:p-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between gap-3.5 cursor-pointer relative liquid-glass-card hover:border-cyan-400/40 hover:scale-[1.008] active:scale-[0.99] ${
                    currentTrack?.id === track.id
                      ? 'liquid-glass-active border-cyan-400/60 shadow-[0_4px_24px_rgba(0,242,254,0.18)]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Left zone: Index + Cover + Title & Artist */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-500 w-5 text-center shrink-0">
                      {idx + 1}
                    </span>

                    <div className="relative w-11 h-11 rounded-xl bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center shadow-md border border-white/10">
                      {track.coverArt ? (
                        <img
                          src={track.coverArt}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : track.fileType === 'video' ? (
                        <Video className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Music className="w-5 h-5 text-cyan-400" />
                      )}

                      {/* Play overlay */}
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                          isThisTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isThisTrackPlaying ? (
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 bg-cyan-400 h-full animate-bounce" />
                            <span className="w-0.5 bg-cyan-400 h-2/3 animate-bounce [animation-delay:0.15s]" />
                            <span className="w-0.5 bg-cyan-400 h-4/5 animate-bounce [animation-delay:0.3s]" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            currentTrack?.id === track.id ? 'text-cyan-400' : 'text-white'
                          }`}
                        >
                          {renderHighlightedText(track.title, trimmedQuery)}
                        </h4>
                        {track.extractedFromVideo && (
                          <span className="px-1.5 py-0.5 text-[8px] font-black rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                            صوت مستخرج
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {renderHighlightedText(track.artist, trimmedQuery)} ·{' '}
                        {renderHighlightedText(track.album, trimmedQuery)}
                      </p>
                    </div>
                  </div>

                  {/* Right Zone: Duration, Favorite, 3-dots Menu trigger */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                      {Math.floor(track.duration / 60)}:
                      {(track.duration % 60).toString().padStart(2, '0')}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="المفضلة"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          track.isFavorite ? 'text-rose-500 fill-rose-500' : ''
                        }`}
                      />
                    </button>

                    {/* 3-Dots Button: Opens the Fixed High Z-Index Floating Menu / Action Sheet (NEVER hides under next song) */}
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
                        setContextMenuTrack(track);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="المزيد من الخيارات"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Supercharged Track Context Menu with 16+ Rich Options & Zero-clipping */}
      <TrackContextMenu
        track={contextMenuTrack}
        isOpen={Boolean(contextMenuTrack)}
        anchorRect={contextMenuAnchor}
        playlists={playlists}
        theme={theme}
        accentHex={accentHex}
        onClose={() => {
          setContextMenuTrack(null);
          setContextMenuAnchor(null);
        }}
        onPlayNow={(trk) => onPlayTrack(trk, filtered)}
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
      />
    </motion.div>
  );
};
