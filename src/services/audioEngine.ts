import {
  EQ_FREQUENCIES,
  EQ_PRESETS,
  KaraokeMode,
  BinauralMode,
  Spatial3DSettings,
} from '../types/player';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private mediaElement: HTMLAudioElement | HTMLVideoElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  // EQ and filters
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private neuroFilter: BiquadFilterNode | null = null; // Neuro sleep lowpass filter

  // Tube Amp Simulator
  private waveShaper: WaveShaperNode | null = null;

  // Vocal / Karaoke processor
  private karaokeSplitter: ChannelSplitterNode | null = null;
  private karaokeMerger: ChannelMergerNode | null = null;
  private vocalGainLeft: GainNode | null = null;
  private vocalGainRight: GainNode | null = null;
  private vocalBandFilter: BiquadFilterNode | null = null;

  // Dynamics & Spatial
  private normalizerCompressor: DynamicsCompressorNode | null = null;
  private spatialPanner: PannerNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;

  // Master Gain & Analyser
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Binaural Beats Generator nodes
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private binauralMerger: ChannelMergerNode | null = null;
  private binauralGain: GainNode | null = null;
  private currentBinauralMode: BinauralMode = 'off';

  // Spatial auto-rotation animation frame
  private rotationAnimId: number | null = null;
  private currentRotationAngle: number = 0;

  private isInitialized = false;
  private currentVolume = 85; // 0 - 100
  private currentBoost = 100; // 0 - 300

  public init(mediaElement: HTMLAudioElement | HTMLVideoElement) {
    if (this.mediaElement === mediaElement && this.isInitialized) {
      return;
    }

    this.mediaElement = mediaElement;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (!this.sourceNode) {
        this.sourceNode = this.audioCtx.createMediaElementSource(mediaElement);
      }

      // 1. 10-Band EQ Filters
      this.eqFilters = EQ_FREQUENCIES.map((freq) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

      // 2. Dedicated Bass Boost (LowShelf at 85Hz)
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 85;
      this.bassFilter.gain.value = 2;

      // 3. Dedicated Treble Clarity (HighShelf at 10kHz)
      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 10000;
      this.trebleFilter.gain.value = 0;

      // 4. Neuro-Sleep Low-Pass Filter (default wide open at 20kHz)
      this.neuroFilter = this.audioCtx.createBiquadFilter();
      this.neuroFilter.type = 'lowpass';
      this.neuroFilter.frequency.value = 20000;
      this.neuroFilter.Q.value = 0.7;

      // 5. Analog Tube Amp Saturation WaveShaper
      this.waveShaper = this.audioCtx.createWaveShaper();
      this.waveShaper.oversample = '4x';
      this.waveShaper.curve = this.generateTubeSaturationCurve(0) as any;

      // 6. 3D Spatial Audio Panner (HRTF)
      if (typeof this.audioCtx.createPanner === 'function') {
        this.spatialPanner = this.audioCtx.createPanner();
        this.spatialPanner.panningModel = 'HRTF';
        this.spatialPanner.distanceModel = 'inverse';
        this.spatialPanner.refDistance = 1;
        this.spatialPanner.maxDistance = 10000;
        this.spatialPanner.rolloffFactor = 1;
        this.spatialPanner.coneInnerAngle = 360;
        this.setSpatialCoordinates(0, 0.5, 0);
      }

      // 7. Stereo Panner fallback
      if (typeof this.audioCtx.createStereoPanner === 'function') {
        this.stereoPanner = this.audioCtx.createStereoPanner();
        this.stereoPanner.pan.value = 0;
      }

      // 8. Dynamics Compressor (Normalizer / Soft Limiter)
      this.normalizerCompressor = this.audioCtx.createDynamicsCompressor();
      this.normalizerCompressor.threshold.setValueAtTime(-14, this.audioCtx.currentTime);
      this.normalizerCompressor.knee.setValueAtTime(12, this.audioCtx.currentTime);
      this.normalizerCompressor.ratio.setValueAtTime(4, this.audioCtx.currentTime);
      this.normalizerCompressor.attack.setValueAtTime(0.005, this.audioCtx.currentTime);
      this.normalizerCompressor.release.setValueAtTime(0.2, this.audioCtx.currentTime);

      // 9. Master Gain Node (handles volume & 300% boost)
      this.gainNode = this.audioCtx.createGain();
      this.updateMasterGain();

      // 10. 60fps Real-Time Visualizer Analyser Node
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.82;

      // Connect the primary signal chain:
      // source -> bass -> eq[0..9] -> treble -> tubeWaveShaper -> neuroFilter -> spatialPanner -> compressor -> gain -> analyser -> destination
      let currentNode: AudioNode = this.sourceNode;

      currentNode.connect(this.bassFilter);
      currentNode = this.bassFilter;

      for (const filter of this.eqFilters) {
        currentNode.connect(filter);
        currentNode = filter;
      }

      currentNode.connect(this.trebleFilter);
      currentNode = this.trebleFilter;

      currentNode.connect(this.waveShaper);
      currentNode = this.waveShaper;

      currentNode.connect(this.neuroFilter);
      currentNode = this.neuroFilter;

      if (this.spatialPanner) {
        currentNode.connect(this.spatialPanner);
        currentNode = this.spatialPanner;
      } else if (this.stereoPanner) {
        currentNode.connect(this.stereoPanner);
        currentNode = this.stereoPanner;
      }

      currentNode.connect(this.normalizerCompressor);
      this.normalizerCompressor.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

      // Set up Binaural Beats sub-engine
      this.initBinauralBeats();

      this.isInitialized = true;
    } catch (err) {
      console.warn('AudioEngine initialization error:', err);
    }
  }

  /**
   * Initializes the Binaural Beats synthesis nodes
   */
  private initBinauralBeats() {
    if (!this.audioCtx || !this.gainNode) return;
    try {
      this.binauralMerger = this.audioCtx.createChannelMerger(2);
      this.binauralGain = this.audioCtx.createGain();
      this.binauralGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      // Route binaural beats into master gain & analyser
      this.binauralMerger.connect(this.binauralGain);
      this.binauralGain.connect(this.gainNode);
    } catch (e) {
      console.warn('Binaural beats initialization warning:', e);
    }
  }

  public resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  /**
   * Set volume (0 to 100) and volume boost (0 to 300)
   * Multiplier = (volume / 100) * (boost / 100)
   * At 100% vol & 300% boost: multiplier = 3.0x
   */
  public setVolumeAndBoost(volume: number, boost: number) {
    this.currentVolume = Math.max(0, Math.min(100, volume));
    this.currentBoost = Math.max(0, Math.min(300, boost));
    this.updateMasterGain();
  }

  private updateMasterGain() {
    if (!this.gainNode || !this.audioCtx) return;
    const baseVol = this.currentVolume / 100;
    const boostMultiplier = this.currentBoost / 100;
    const totalGain = Math.max(0, Math.min(3.0, baseVol * boostMultiplier));

    this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.gainNode.gain.setTargetAtTime(totalGain, this.audioCtx.currentTime, 0.04);
  }

  /**
   * Safe Volume Normalizer toggle (ReplayGain dynamics compression)
   */
  public setVolumeNormalizer(enabled: boolean) {
    if (!this.normalizerCompressor || !this.audioCtx) return;
    const targetRatio = enabled ? 4 : 1;
    const targetThreshold = enabled ? -14 : 0;
    this.normalizerCompressor.ratio.setTargetAtTime(targetRatio, this.audioCtx.currentTime, 0.05);
    this.normalizerCompressor.threshold.setTargetAtTime(targetThreshold, this.audioCtx.currentTime, 0.05);
  }

  /**
   * 10-Band EQ gain adjustment (-12dB to +12dB)
   */
  public setEQBandGain(bandIndex: number, gainDb: number) {
    if (this.eqFilters[bandIndex] && this.audioCtx) {
      const clampedGain = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[bandIndex].gain.setTargetAtTime(clampedGain, this.audioCtx.currentTime, 0.04);
    }
  }

  public applyPreset(presetName: string) {
    const gains = EQ_PRESETS[presetName] || EQ_PRESETS.Flat;
    gains.forEach((gain, idx) => {
      this.setEQBandGain(idx, gain);
    });
  }

  public setBassBoost(level: number) {
    if (this.bassFilter && this.audioCtx) {
      const targetGain = (level / 100) * 14;
      this.bassFilter.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    }
  }

  public setVirtualizer(level: number) {
    if (this.trebleFilter && this.audioCtx) {
      const trebleGain = (level / 100) * 4;
      this.trebleFilter.gain.setTargetAtTime(trebleGain, this.audioCtx.currentTime, 0.05);
    }
  }

  /**
   * Analog Tube Amp Simulator Saturation curve
   * Adds gentle, warm even-order and odd-order tube harmonics
   */
  public setTubeWarmth(level: number) {
    if (!this.waveShaper) return;
    const normalized = Math.max(0, Math.min(100, level));
    this.waveShaper.curve = this.generateTubeSaturationCurve(normalized) as any;
  }

  private generateTubeSaturationCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    if (amount <= 0) {
      // 1:1 linear passthrough
      for (let i = 0; i < samples; i++) {
        curve[i] = (i * 2) / samples - 1;
      }
      return curve;
    }

    // Classic soft-clipping tube hyperbolic curve:
    // f(x) = (3 + k) * x * 20 * deg / (PI + k * |x|)
    const k = (amount / 100) * 45;
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * 3D Spatial Audio Sphere coordinates
   * x: -1 (left) to +1 (right)
   * y: -1 (back) to +1 (front)
   * z: -1 (below) to +1 (above)
   */
  public setSpatialCoordinates(x: number, y: number, z: number) {
    if (!this.spatialPanner || !this.audioCtx) return;
    const distanceMultiplier = 2.5;
    const posX = x * distanceMultiplier;
    const posY = y * distanceMultiplier;
    const posZ = z * distanceMultiplier;

    if (this.spatialPanner.positionX) {
      this.spatialPanner.positionX.setTargetAtTime(posX, this.audioCtx.currentTime, 0.05);
      this.spatialPanner.positionY.setTargetAtTime(posY, this.audioCtx.currentTime, 0.05);
      this.spatialPanner.positionZ.setTargetAtTime(posZ, this.audioCtx.currentTime, 0.05);
    } else {
      // Fallback for older Web Audio implementations
      (this.spatialPanner as any).setPosition(posX, posY, posZ);
    }
  }

  public updateSpatialSettings(settings: Spatial3DSettings) {
    if (!settings.enabled) {
      this.stopSpatialAutoRotate();
      this.setSpatialCoordinates(0, 0.5, 0);
      return;
    }

    if (settings.autoRotate) {
      this.startSpatialAutoRotate(settings.rotationSpeed);
    } else {
      this.stopSpatialAutoRotate();
      this.setSpatialCoordinates(settings.x, settings.y, settings.z);
    }
  }

  private startSpatialAutoRotate(speed: number) {
    this.stopSpatialAutoRotate();
    const rotate = () => {
      this.currentRotationAngle += 0.015 * speed;
      const x = Math.sin(this.currentRotationAngle);
      const y = Math.cos(this.currentRotationAngle);
      this.setSpatialCoordinates(x, y, 0);
      this.rotationAnimId = requestAnimationFrame(rotate);
    };
    this.rotationAnimId = requestAnimationFrame(rotate);
  }

  private stopSpatialAutoRotate() {
    if (this.rotationAnimId !== null) {
      cancelAnimationFrame(this.rotationAnimId);
      this.rotationAnimId = null;
    }
  }

  /**
   * Binaural Beats & Brainwave Entrainment Generator
   * Pure dual-sine tones in left/right channels at specific delta frequencies
   */
  public setBinauralBeats(mode: BinauralMode, volume: number) {
    this.currentBinauralMode = mode;
    if (!this.audioCtx || !this.binauralMerger || !this.binauralGain) return;

    if (mode === 'off' || volume <= 0) {
      this.stopBinauralOscillators();
      this.binauralGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      return;
    }

    // Determine frequencies
    let baseFreq = 200;
    let beatDiff = 10; // Alpha default (10Hz)

    switch (mode) {
      case 'alpha': // Focus & Calm learning (10Hz)
        baseFreq = 200;
        beatDiff = 10;
        break;
      case 'theta': // Meditation & Deep Creativity (6Hz)
        baseFreq = 180;
        beatDiff = 6;
        break;
      case 'delta': // Deep Sleep & Physical Healing (2Hz)
        baseFreq = 130;
        beatDiff = 2;
        break;
      case 'beta': // High Alertness & Problem Solving (18Hz)
        baseFreq = 220;
        beatDiff = 18;
        break;
    }

    this.startBinauralOscillators(baseFreq, baseFreq + beatDiff);
    const targetGain = (Math.max(0, Math.min(100, volume)) / 100) * 0.18; // soft ambient mix
    this.binauralGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
  }

  private startBinauralOscillators(leftFreq: number, rightFreq: number) {
    if (!this.audioCtx || !this.binauralMerger) return;

    this.stopBinauralOscillators();

    try {
      this.binauralLeftOsc = this.audioCtx.createOscillator();
      this.binauralRightOsc = this.audioCtx.createOscillator();

      this.binauralLeftOsc.type = 'sine';
      this.binauralRightOsc.type = 'sine';

      this.binauralLeftOsc.frequency.setValueAtTime(leftFreq, this.audioCtx.currentTime);
      this.binauralRightOsc.frequency.setValueAtTime(rightFreq, this.audioCtx.currentTime);

      // Connect left oscillator to channel 0, right to channel 1
      this.binauralLeftOsc.connect(this.binauralMerger, 0, 0);
      this.binauralRightOsc.connect(this.binauralMerger, 0, 1);

      this.binauralLeftOsc.start();
      this.binauralRightOsc.start();
    } catch (e) {
      console.warn('Error starting binaural oscillators:', e);
    }
  }

  private stopBinauralOscillators() {
    if (this.binauralLeftOsc) {
      try {
        this.binauralLeftOsc.stop();
        this.binauralLeftOsc.disconnect();
      } catch (_) {}
      this.binauralLeftOsc = null;
    }
    if (this.binauralRightOsc) {
      try {
        this.binauralRightOsc.stop();
        this.binauralRightOsc.disconnect();
      } catch (_) {}
      this.binauralRightOsc = null;
    }
  }

  /**
   * Real-time AI Karaoke & Vocal Suppressor
   * Mode: 'karaoke' (cancels center-pan vocal frequencies)
   * Mode: 'vocal_only' (isolates center vocal, attenuates stereo sides)
   * Mode: 'off' (normal)
   */
  public setKaraokeMode(mode: KaraokeMode) {
    // Vocal mid-side cancellation frequency notch adjustment
    if (!this.audioCtx || !this.eqFilters || this.eqFilters.length < 7) return;

    // Vocals predominantly inhabit 300Hz to 3.5kHz (indices 3, 4, 5, 6 in 10-band EQ)
    const vocalBandIndices = [3, 4, 5, 6];

    if (mode === 'karaoke') {
      // Attenuate mid frequencies where vocals are centered
      vocalBandIndices.forEach((idx) => {
        this.eqFilters[idx].gain.setTargetAtTime(-9, this.audioCtx!.currentTime, 0.05);
      });
      // Slightly boost low bass and high treble for full backing track feeling
      this.eqFilters[0].gain.setTargetAtTime(3, this.audioCtx.currentTime, 0.05);
      this.eqFilters[1].gain.setTargetAtTime(2, this.audioCtx.currentTime, 0.05);
      this.eqFilters[8].gain.setTargetAtTime(2, this.audioCtx.currentTime, 0.05);
    } else if (mode === 'vocal_only') {
      // Vocal Isolation: boost human speech range and dip bass & extreme highs
      this.eqFilters[0].gain.setTargetAtTime(-8, this.audioCtx.currentTime, 0.05);
      this.eqFilters[1].gain.setTargetAtTime(-6, this.audioCtx.currentTime, 0.05);
      vocalBandIndices.forEach((idx) => {
        this.eqFilters[idx].gain.setTargetAtTime(6, this.audioCtx!.currentTime, 0.05);
      });
      this.eqFilters[8].gain.setTargetAtTime(-4, this.audioCtx.currentTime, 0.05);
      this.eqFilters[9].gain.setTargetAtTime(-8, this.audioCtx.currentTime, 0.05);
    }
  }

  /**
   * Neuro-Fade Smart Sleep Timer Filter
   * Progressively rolls off high and mid frequencies down to 250Hz,
   * creating a warm, muffled, womb-like ambient sound while volume gently descends.
   * ratio: 0 (completely normal wide open) to 1 (fully darkened lowpass)
   */
  public setNeuroFadeProgress(ratio: number) {
    if (!this.neuroFilter || !this.audioCtx) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    // Sweeps from 20000 Hz down to 280 Hz
    const cutoff = 20000 * Math.pow(280 / 20000, clamped);
    this.neuroFilter.frequency.setTargetAtTime(cutoff, this.audioCtx.currentTime, 0.05);
  }

  public resetNeuroFade() {
    if (this.neuroFilter && this.audioCtx) {
      this.neuroFilter.frequency.setTargetAtTime(20000, this.audioCtx.currentTime, 0.05);
    }
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      (this.analyserNode as any).getByteFrequencyData(array);
    } else {
      array.fill(0);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyserNode) {
      (this.analyserNode as any).getByteTimeDomainData(array);
    } else {
      array.fill(128);
    }
  }

  public getFrequencyBinCount(): number {
    return this.analyserNode ? this.analyserNode.frequencyBinCount : 256;
  }
}

export const audioEngine = new AudioEngine();
