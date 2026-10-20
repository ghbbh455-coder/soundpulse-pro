import React from 'react';
import { Track, ThemeConfig } from '../types/player';
import { User, Disc, Folder, Music, Play } from 'lucide-react';

interface ArtistsAlbumsViewProps {
  type: 'artists' | 'albums' | 'folders';
  tracks: Track[];
  accentHex: string;
  theme: ThemeConfig;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
}

export const ArtistsAlbumsView: React.FC<ArtistsAlbumsViewProps> = ({
  type,
  tracks,
  accentHex,
  theme,
  onPlayTrack,
}) => {
  // Group tracks by Artist, Album, or Folder
  const grouped: Record<string, Track[]> = {};

  tracks.forEach((t) => {
    let key = 'غير معروف';
    if (type === 'artists') {
      key = t.artist || 'فنان غير معروف';
    } else if (type === 'albums') {
      key = t.album || 'ألبوم فردي';
    } else if (type === 'folders') {
      key = t.fileType === 'video' ? 'مجلد الفيديوهات' : 'مجلد الصوتيات والموسيقى';
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const keys = Object.keys(grouped);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          {type === 'artists' ? (
            <User className="w-5 h-5 text-cyan-400" />
          ) : type === 'albums' ? (
            <Disc className="w-5 h-5 text-purple-400" />
          ) : (
            <Folder className="w-5 h-5 text-emerald-400" />
          )}
          <span>
            {type === 'artists' ? 'كل الفنانين' : type === 'albums' ? 'جميع الألبومات' : 'مجلدات التخزين'} ({keys.length})
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {keys.map((groupName) => {
          const groupTracks = grouped[groupName];
          const firstWithCover = groupTracks.find((t) => t.coverArt);

          return (
            <div
              key={groupName}
              onClick={() => onPlayTrack(groupTracks[0], groupTracks)}
              className="p-4 rounded-[26px] liquid-glass hover:bg-white/8 border border-white/10 transition-all duration-200 flex items-center gap-4 cursor-pointer group shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative shadow-md">
                {firstWithCover?.coverArt ? (
                  <img src={firstWithCover.coverArt} alt={groupName} className="w-full h-full object-cover" />
                ) : type === 'artists' ? (
                  <User className="w-7 h-7 text-cyan-400" />
                ) : (
                  <Disc className="w-7 h-7 text-purple-400" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
                  {groupName}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {groupTracks.length} مقطع صوتي
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
