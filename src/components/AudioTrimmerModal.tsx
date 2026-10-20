import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types/player';
import { encodeWAV } from '../utils/audioSynthesizer';
import { Scissors, Play, Pause, Save, X, Sparkles } from 'lucide-react';

interface AudioTrimmerModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTrimmed: (trimmedTrack: Track) => Promise<void>;
}

export const AudioTrimmerModal: React.FC<AudioTrimmerModalProps> = ({
  track,
  isOpen,
  onClose,
  onSaveTrimmed,
}) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (track) {
      setStartTime(0);
      setEndTime(Math.min(30, track.duration || 30));
    }
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.currentTime >= endTime) {
        audio.pause();
        audio.currentTime = startTime;
        setPreviewPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [startTime, endTime]);

  if (!isOpen || !track) return null;

  const duration = Math.max(1, track.duration || 30);

  const handleTogglePreview = () => {
    if (!audioRef.current) return;

    if (previewPlaying) {
      audioRef.current.pause();
      setPreviewPlaying(false);
    } else {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
      setPreviewPlaying(true);
    }
  };

  const handleSaveTrim = async () => {
    if (!track.fileBlob) return;
    setIsTrimming(true);

    try {
      const arrayBuffer = await track.fileBlob.arrayBuffer();
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);

      const sampleRate = decoded.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.min(decoded.length, Math.floor(endTime * sampleRate));
      const trimmedLength = endSample - startSample;

      const left = decoded.getChannelData(0);
      const right = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : left;

      const trimmedSamples = new Float32Array(trimmedLength);
      for (let i = 0; i < trimmedLength; i++) {
        trimmedSamples[i] = (left[startSample + i] + right[startSample + i]) * 0.5;
      }

      const wavBlob = encodeWAV(trimmedSamples, sampleRate);
      await audioCtx.close();

      const newTrack: Track = {
        id: `trimmed-${Date.now()}`,
        title: `${track.title} (مقطع مقصوص)`,
        artist: track.artist,
        album: 'نغمات ومقاطع',
        genre: track.genre,
        duration: Math.round(endTime - startTime),
        fileBlob: wavBlob,
        blobUrl: URL.createObjectURL(wavBlob),
        fileType: 'audio',
        fileFormat: 'wav',
        fileSize: wavBlob.size,
        dateAdded: Date.now(),
        playCount: 0,
        isFavorite: false,
        coverArt: track.coverArt,
      };

      await onSaveTrimmed(newTrack);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-100">
        <audio ref={audioRef} src={track.blobUrl} />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">قص الصوت وصانع النغمات</h3>
              <p className="text-xs text-slate-400">{track.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Timeline Bar */}
        <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">البداية: {startTime.toFixed(1)} ثانية</span>
            <span className="text-cyan-400 font-bold">المدة المحددة: {(endTime - startTime).toFixed(1)} ث</span>
            <span className="text-slate-400">النهاية: {endTime.toFixed(1)} ث</span>
          </div>

          {/* Start Slider */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">نقطة بداية المقطع:</span>
            <input
              type="range"
              min="0"
              max={duration - 1}
              step="0.5"
              value={startTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setStartTime(Math.min(val, endTime - 1));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* End Slider */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">نقطة نهاية المقطع:</span>
            <input
              type="range"
              min="1"
              max={duration}
              step="0.5"
              value={endTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setEndTime(Math.max(val, startTime + 1));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleTogglePreview}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            {previewPlaying ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-cyan-400" />}
            <span>{previewPlaying ? 'إيقاف المعاينة' : 'معاينة المقطع'}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              disabled={isTrimming}
              onClick={handleSaveTrim}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isTrimming ? 'جارٍ القص...' : 'حفظ كنغمة جديدة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
