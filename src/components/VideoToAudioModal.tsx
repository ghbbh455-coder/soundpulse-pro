import React, { useState, useRef } from 'react';
import { Track, ThemeConfig } from '../types/player';
import { extractAudioFromVideo } from '../services/videoExtractor';
import { translations } from '../utils/translations';
import {
  Video,
  Music,
  ArrowDownToLine,
  Play,
  Pause,
  Sparkles,
  Check,
  AlertCircle,
  X,
  Upload,
} from 'lucide-react';

interface VideoToAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  theme: ThemeConfig;
  accentHex: string;
  onAddTrack: (newTrack: Track) => Promise<void>;
  onPlayTrack: (track: Track) => void;
}

export const VideoToAudioModal: React.FC<VideoToAudioModalProps> = ({
  isOpen,
  onClose,
  tracks,
  theme,
  accentHex,
  onAddTrack,
  onPlayTrack,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionStage, setConversionStage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!isOpen) return null;

  const t = translations[theme.language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleStartExtraction = async () => {
    if (!selectedFile) return;

    setConverting(true);
    setConversionProgress(0);
    setConversionStage('جاري تجهيز فك تشفير الفيديو...');
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const extractedTrack = await extractAudioFromVideo(
        selectedFile,
        selectedFile.name,
        (progress, stage) => {
          setConversionProgress(progress);
          setConversionStage(stage);
        }
      );

      await onAddTrack(extractedTrack);
      setSuccessMsg(`تم استخراج مسار الصوت بنجاح: "${extractedTrack.title}" وإضافته للمكتبة!`);
      // Offer immediate play
      onPlayTrack(extractedTrack);
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء فك تشفير الصوت من الفيديو. يرجى التأكد من صيغة الملف.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-2xl text-black shadow-lg"
              style={{ backgroundColor: accentHex }}
            >
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">استوديو تحويل الفيديو إلى صوت</h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  مجاني 100%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                استخرج مسار الصوت النقي WAV من أي فيديو MP4 أو WebM أو MOV في المتصفح بدون إنترنت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Upload Dropzone or Video Preview */}
        {!videoPreviewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-10 rounded-3xl border-2 border-dashed border-slate-700 hover:border-cyan-400 bg-slate-950/40 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
          >
            <div className="p-4 rounded-2xl bg-slate-800 text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-white">اختر مقطع فيديو من جهازك</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              يدعم مقاطع MP4 و WebM و MKV و MOV. يتم التحويل داخل جهازك مباشرة بسرعة فائقة وبدون رفع لأي سيرفر.
            </p>
            <span
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md cursor-pointer"
              style={{ backgroundColor: accentHex }}
            >
              تصفح ملفات الفيديو
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-800 shadow-xl">
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold truncate max-w-[280px]">
                الملف: {selectedFile?.name}
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-cyan-400 hover:underline font-bold cursor-pointer"
              >
                تغيير الفيديو
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Conversion Progress Bar */}
        {converting && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/40 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400 font-semibold">{conversionStage}</span>
              <span className="font-mono font-bold text-white">{conversionProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success or Error messages */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
          >
            إغلاق
          </button>
          {selectedFile && (
            <button
              disabled={converting}
              onClick={handleStartExtraction}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-black transition shadow-lg cursor-pointer flex items-center gap-2 ${
                converting ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
              }`}
              style={{ backgroundColor: accentHex }}
            >
              <Sparkles className="w-4 h-4" />
              <span>{converting ? 'جارٍ فك التشفير والتحويل...' : 'تحويل واستخراج الصوت للمكتبة'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
