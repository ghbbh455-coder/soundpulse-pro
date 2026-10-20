import React, { useState, useRef } from 'react';
import { Track, ThemeConfig } from '../types/player';
import { extractAudioFromVideo } from '../services/videoExtractor';
import { translations } from '../utils/translations';
import { Video, Music, ArrowDownToLine, Play, Pause, Maximize, PictureInPicture2, Sparkles, Check, AlertCircle } from 'lucide-react';

interface VideoStudioViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  theme: ThemeConfig;
  accentHex: string;
  onPlayTrack: (track: Track) => void;
  onAddTrack: (newTrack: Track) => Promise<void>;
  onTogglePlay: () => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  theme,
  accentHex,
  onPlayTrack,
  onAddTrack,
  onTogglePlay,
}) => {
  const t = translations[theme.language];
  const [selectedVideo, setSelectedVideo] = useState<Track | null>(
    currentTrack?.fileType === 'video' ? currentTrack : tracks.find(t => t.fileType === 'video') || null
  );
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStage, setConversionStage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const videoTracks = tracks.filter((t) => t.fileType === 'video');

  const handleSelectVideo = (video: Track) => {
    setSelectedVideo(video);
    onPlayTrack(video);
  };

  const handleExtractAudio = async (video: Track) => {
    if (!video.fileBlob) {
      setErrorMsg('ملف الفيديو غير متوفر للاستخراج');
      return;
    }

    setConverting(true);
    setConversionProgress(0);
    setConversionStage('جاري البدء...');
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const extractedTrack = await extractAudioFromVideo(
        video.fileBlob,
        video.title,
        (progress, stage) => {
          setConversionProgress(progress);
          setConversionStage(stage);
        }
      );

      await onAddTrack(extractedTrack);
      setSuccessMsg(`تم استخراج الصوت بنجاح: "${extractedTrack.title}" وأُضيف للمكتبة!`);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء فك تشفير الصوت من الفيديو. يرجى التأكد من صيغة الملف.');
    } finally {
      setConverting(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newVideo: Track = {
      id: `video-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'فيديو محلي',
      album: 'استوديو الفيديو',
      duration: 0,
      fileBlob: file,
      blobUrl: URL.createObjectURL(file),
      fileType: 'video',
      fileFormat: file.type.split('/')[1] || 'mp4',
      fileSize: file.size,
      dateAdded: Date.now(),
      playCount: 0,
      isFavorite: false,
    };

    await onAddTrack(newVideo);
    setSelectedVideo(newVideo);
    onPlayTrack(newVideo);
  };

  const togglePiP = async () => {
    try {
      if (videoElementRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoElementRef.current.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  const toggleFullscreen = () => {
    if (videoElementRef.current) {
      if (!document.fullscreenElement) {
        videoElementRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white shadow-lg flex items-center justify-center"
            style={{ backgroundColor: accentHex, boxShadow: `0 0 20px ${accentHex}44` }}
          >
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">{t.video.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t.video.subtitle}</p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-black transition-all shadow-lg hover:brightness-110 cursor-pointer self-start md:self-auto"
          style={{ backgroundColor: accentHex }}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>استيراد مقطع فيديو جديد</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/mkv"
          className="hidden"
          onChange={handleVideoUpload}
        />
      </div>

      {/* Main Video Player Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-800/90 shadow-2xl flex items-center justify-center group">
            {selectedVideo && selectedVideo.blobUrl ? (
              <video
                ref={videoElementRef}
                src={selectedVideo.blobUrl}
                className="w-full h-full object-contain"
                controls
                playsInline
                autoPlay={isPlaying}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <Video className="w-12 h-12 text-slate-600 animate-pulse" />
                <p className="text-sm font-semibold text-slate-300">لم يتم تحديد أي مقطع فيديو</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  اختر فيديو من القائمة الجانبية أو استورد مقطع MP4/WebM للتشغيل واستخراج الصوت.
                </p>
              </div>
            )}

            {/* Quick Action Overlay Buttons */}
            {selectedVideo && (
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <button
                  onClick={togglePiP}
                  title={t.video.pip}
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/90 border border-white/10 transition cursor-pointer"
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  title="شاشة كاملة"
                  className="p-2 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-black/90 border border-white/10 transition cursor-pointer"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Video Metadata & Extraction Strip */}
          {selectedVideo && (
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">{selectedVideo.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  الصيغة: {selectedVideo.fileFormat?.toUpperCase() || 'MP4'} · الحجم:{' '}
                  {(selectedVideo.fileSize / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>

              <button
                disabled={converting}
                onClick={() => handleExtractAudio(selectedVideo)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer ${
                  converting
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:brightness-110 shadow-cyan-500/20'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{converting ? t.actions.converting : t.video.extractButton}</span>
              </button>
            </div>
          )}

          {/* Conversion Progress Bar */}
          {converting && (
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-400 font-semibold">{conversionStage}</span>
                <span className="font-mono font-bold text-white">{conversionProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${conversionProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success / Error alerts */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Video Library Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>مقاطع الفيديو المتوفرة ({videoTracks.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {videoTracks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center space-y-2">
                <p className="text-xs text-slate-400">لا توجد مقاطع فيديو مخزنة حالياً</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
                >
                  استيراد فيديو من جهازك
                </button>
              </div>
            ) : (
              videoTracks.map((vid) => {
                const isCurrent = selectedVideo?.id === vid.id;
                return (
                  <div
                    key={vid.id}
                    onClick={() => handleSelectVideo(vid)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isCurrent
                        ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-900/20'
                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="relative w-16 h-10 rounded-lg bg-black overflow-hidden shrink-0 flex items-center justify-center">
                      {vid.coverArt ? (
                        <img src={vid.coverArt} alt={vid.title} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-5 h-5 text-slate-500" />
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{vid.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {Math.floor(vid.duration / 60)}:{(vid.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExtractAudio(vid);
                      }}
                      title="استخراج الصوت مباشرة"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 transition shrink-0 cursor-pointer"
                    >
                      <Music className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
