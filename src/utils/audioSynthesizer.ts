/**
 * Generates synthetic playable WAV audio Blobs client-side
 * for instant offline preview and testing.
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function encodeWAV(samples: Float32Array, sampleRate: number = 44100): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (1 for mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples (16-bit)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Creates a melodic Synthwave track (15 seconds, 120 BPM)
 */
export function generateDemoTrack1(): { blob: Blob; duration: number } {
  const sampleRate = 44100;
  const duration = 18; // seconds
  const totalSamples = sampleRate * duration;
  const samples = new Float32Array(totalSamples);
  const bpm = 124;
  const beatDuration = 60 / bpm;

  // Notes in Hz: C4, D4, E4, G4, A4, C5, B4, G4
  const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 493.88, 392.00];
  const bassNotes = [130.81, 110.00, 146.83, 98.00]; // C3, A2, D3, G2

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const currentBeat = Math.floor(t / beatDuration);
    const beatPhase = (t % beatDuration) / beatDuration;

    // Melody lead
    const noteIdx = Math.floor(t / (beatDuration / 2)) % scale.length;
    const freq = scale[noteIdx];
    const melodyEnv = Math.exp(-beatPhase * 4);
    const melody = Math.sin(2 * Math.PI * freq * t) * 0.22 * melodyEnv;

    // Sub Bass
    const bassIdx = Math.floor(t / (beatDuration * 2)) % bassNotes.length;
    const bassFreq = bassNotes[bassIdx];
    const bass = (Math.sin(2 * Math.PI * bassFreq * t) + 0.3 * Math.sin(4 * Math.PI * bassFreq * t)) * 0.35;

    // Kick drum on every beat
    const kickEnv = Math.exp(-beatPhase * 18);
    const kickFreq = 120 * (1 - beatPhase * 0.85);
    const kick = Math.sin(2 * Math.PI * kickFreq * beatPhase * beatDuration) * kickEnv * 0.45;

    // Hi-hat on half beats
    const hatPhase = ((t + beatDuration / 2) % beatDuration) / beatDuration;
    const hatEnv = Math.exp(-hatPhase * 35);
    const noise = (Math.random() * 2 - 1) * hatEnv * 0.12;

    // Smooth fade in / out
    let masterEnv = 1;
    if (t < 0.5) masterEnv = t / 0.5;
    if (t > duration - 1) masterEnv = (duration - t);

    samples[i] = (melody + bass + kick + noise) * masterEnv * 0.7;
  }

  return {
    blob: encodeWAV(samples, sampleRate),
    duration: duration,
  };
}

/**
 * Creates an Ambient Chillhop groove track (16 seconds)
 */
export function generateDemoTrack2(): { blob: Blob; duration: number } {
  const sampleRate = 44100;
  const duration = 16;
  const totalSamples = sampleRate * duration;
  const samples = new Float32Array(totalSamples);
  const bpm = 90;
  const beatDuration = 60 / bpm;

  const chords = [
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 349.23], // G7
    [130.81, 164.81, 196.00, 246.94], // Cmaj7
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / (beatDuration * 4)) % chords.length;
    const chord = chords[chordIdx];

    // Electric Piano pad
    let pad = 0;
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      pad += Math.sin(2 * Math.PI * f * t) * 0.08;
      // Vibrato / chorus
      pad += Math.sin(2 * Math.PI * (f + 0.8) * t) * 0.04;
    }

    // Gentle kick on beat 1 and 3
    const barPhase = (t % (beatDuration * 2)) / (beatDuration * 2);
    const kickEnv = Math.exp(-barPhase * 12);
    const kick = Math.sin(2 * Math.PI * 90 * (1 - barPhase) * t) * kickEnv * 0.3;

    // Vinyl crackle effect
    const crackle = Math.random() > 0.994 ? (Math.random() * 2 - 1) * 0.15 : 0;

    let masterEnv = 1;
    if (t < 0.5) masterEnv = t / 0.5;
    if (t > duration - 1) masterEnv = (duration - t);

    samples[i] = (pad + kick + crackle) * masterEnv * 0.8;
  }

  return {
    blob: encodeWAV(samples, sampleRate),
    duration: duration,
  };
}

/**
 * Creates a synthetic demo video with audio using HTML5 Canvas & MediaRecorder
 * so the user can immediately test video playback and video-to-audio extraction!
 */
export async function generateDemoVideoBlob(): Promise<{ blob: Blob; duration: number }> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      // Melody arpeggio
      const times = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0];
      const freqs = [220, 277.18, 329.63, 440, 329.63, 277.18, 220, 164.81, 220, 329.63, 440];
      times.forEach((tm, idx) => {
        osc.frequency.setValueAtTime(freqs[idx % freqs.length], audioCtx.currentTime + tm);
      });
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 5);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
        resolve({ blob: videoBlob, duration: 5 });
      };

      recorder.start();

      let startTime = performance.now();
      const durationMs = 5000;

      function renderFrame() {
        const now = performance.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        // Cyber neon animated background
        const grad = ctx!.createLinearGradient(0, 0, 640, 360);
        grad.addColorStop(0, '#090a14');
        grad.addColorStop(0.5, '#161936');
        grad.addColorStop(1, '#05070e');
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, 640, 360);

        // Animated neon circles
        for (let r = 0; r < 5; r++) {
          const radius = (r * 35 + (elapsed * 0.05)) % 180;
          ctx!.beginPath();
          ctx!.arc(320, 180, radius, 0, Math.PI * 2);
          ctx!.strokeStyle = `hsla(${260 + r * 20}, 100%, 70%, ${1 - radius / 180})`;
          ctx!.lineWidth = 3;
          ctx!.stroke();
        }

        // Title and badge
        ctx!.fillStyle = '#00f2fe';
        ctx!.font = 'bold 26px sans-serif';
        ctx!.textAlign = 'center';
        ctx!.fillText('SoundPulse Pro Demo Video', 320, 160);

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '16px sans-serif';
        ctx!.fillText('Test Video Playback & Audio Extraction', 320, 200);

        ctx!.fillStyle = '#a855f7';
        ctx!.font = '13px sans-serif';
        ctx!.fillText('by Abdallah Mahmoud', 320, 240);

        if (progress < 1) {
          requestAnimationFrame(renderFrame);
        } else {
          recorder.stop();
        }
      }

      renderFrame();
    } catch {
      // Fallback empty blob if media recorder is not supported
      resolve({ blob: new Blob([], { type: 'video/webm' }), duration: 0 });
    }
  });
}
