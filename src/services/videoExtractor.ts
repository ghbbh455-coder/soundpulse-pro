import { Track } from '../types/player';
import { encodeWAV } from '../utils/audioSynthesizer';

/**
 * Extracts video thumbnail frame at 1.5s
 */
export async function captureVideoThumbnail(videoBlob: Blob): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      const url = URL.createObjectURL(videoBlob);
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.5, Math.max(0.2, (video.duration || 5) * 0.1));
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, 320, 180);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
            return;
          }
        } catch {
          // ignore canvas error
        }
        URL.revokeObjectURL(url);
        resolve('');
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };

      // Safety timeout
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve('');
      }, 3000);
    } catch {
      resolve('');
    }
  });
}

/**
 * Client-Side Video to Audio Extraction
 * Decodes the audio track using Web Audio API AudioContext and encodes to 16-bit PCM WAV
 */
export async function extractAudioFromVideo(
  videoFileOrBlob: File | Blob,
  fileName: string = 'Extracted Audio',
  onProgress?: (progress: number, stage: string) => void
): Promise<Track> {
  if (onProgress) onProgress(10, 'قراءة ملف الفيديو...');

  const arrayBuffer = await videoFileOrBlob.arrayBuffer();

  if (onProgress) onProgress(35, 'فك تشفير المسار الصوتي (AudioContext)...');

  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    if (onProgress) onProgress(65, 'معالجة قنوات الصوت وضغط الاستريو...');

    // Extract mono or stereo samples
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;

    // For simplicity & compatibility, mix down to mono or interleave
    let samples: Float32Array;
    if (numChannels === 1) {
      samples = audioBuffer.getChannelData(0);
    } else {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      samples = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        samples[i] = (left[i] + right[i]) * 0.5;
      }
    }

    if (onProgress) onProgress(85, 'إنشاء ملف صوتي نقي WAV...');

    const audioWavBlob = encodeWAV(samples, sampleRate);

    if (onProgress) onProgress(95, 'استخراج صورة الغلاف والمعلومات...');

    const thumbnail = await captureVideoThumbnail(videoFileOrBlob);

    // Clean title from file name
    const cleanTitle = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();

    const trackId = `extracted-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newTrack: Track = {
      id: trackId,
      title: cleanTitle || 'صوت مستخرج من فيديو',
      artist: 'صوت مستخرج',
      album: 'استوديو استخراج الصوت',
      genre: 'Soundtrack',
      duration: Math.round(audioBuffer.duration),
      fileBlob: audioWavBlob,
      blobUrl: URL.createObjectURL(audioWavBlob),
      fileType: 'audio',
      fileFormat: 'wav',
      fileSize: audioWavBlob.size,
      dateAdded: Date.now(),
      playCount: 0,
      isFavorite: false,
      extractedFromVideo: true,
      coverArt: thumbnail || undefined,
    };

    if (onProgress) onProgress(100, 'اكتمل الاستخراج بنجاح!');

    return newTrack;
  } finally {
    try {
      await audioCtx.close();
    } catch {
      // ignore
    }
  }
}
