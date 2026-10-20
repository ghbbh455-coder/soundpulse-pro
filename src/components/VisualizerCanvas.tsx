import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { ThemeConfig, Track } from '../types/player';

interface VisualizerCanvasProps {
  isPlaying: boolean;
  theme: ThemeConfig;
  accentHex: string;
  activeTrack: Track | null;
  className?: string;
  showCover?: boolean;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  isPlaying,
  theme,
  accentHex,
  activeTrack,
  className = '',
  showCover = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const peaksRef = useRef<number[]>([]);
  const rotationRef = useRef<number>(0);
  const sparksRef = useRef<SparkParticle[]>([]);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let binCount = audioEngine.getFrequencyBinCount();
    if (binCount <= 0) binCount = 256;
    const freqData = new Uint8Array(binCount);
    const timeData = new Uint8Array(binCount);

    if (peaksRef.current.length !== binCount) {
      peaksRef.current = new Array(binCount).fill(0);
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      timeRef.current += 0.02;

      if (isPlaying) {
        audioEngine.getFrequencyData(freqData);
        audioEngine.getTimeDomainData(timeData);
        rotationRef.current = (rotationRef.current + 0.015) % (Math.PI * 2);
      } else {
        for (let i = 0; i < binCount; i++) {
          freqData[i] = Math.max(0, freqData[i] - 5);
          timeData[i] = 128;
        }
      }

      // Calculate Sub-Bass intensity (low bins 0..6)
      let subBass = 0;
      for (let i = 0; i < 6; i++) {
        subBass += freqData[i] || 0;
      }
      subBass = subBass / (6 * 255); // 0.0 to 1.0

      const style = theme.visualizerStyle;

      if (style === 'nebula') {
        renderNebula(ctx, width, height, freqData, subBass, accentHex, timeRef.current);
      } else if (style === 'liquid') {
        renderLiquidWaves(ctx, width, height, freqData, timeData, accentHex, timeRef.current);
      } else if (style === 'energy_core') {
        renderEnergyCore(ctx, width, height, freqData, subBass, accentHex, rotationRef.current);
      } else if (style === 'vinyl') {
        renderVinyl(ctx, width, height, freqData, rotationRef.current, accentHex, activeTrack);
      } else if (style === 'circle') {
        renderCircle(ctx, width, height, freqData, rotationRef.current, accentHex);
      } else if (style === 'wave') {
        renderWave(ctx, width, height, timeData, accentHex);
      } else {
        renderBars(ctx, width, height, freqData, peaksRef.current, accentHex, theme.visualizerBars);
      }

      // Render interactive touch sparks
      sparksRef.current.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha *= 0.94;
        s.radius *= 0.97;

        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(0.5, s.radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
      sparksRef.current = sparksRef.current.filter((s) => s.alpha > 0.05);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, theme.visualizerStyle, theme.visualizerBars, accentHex, activeTrack]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
    const py = ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;

    // Spawn 16 holographic spark particles
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 2 + Math.random() * 4;
      sparksRef.current.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 3,
        alpha: 0.9,
        color: i % 2 === 0 ? accentHex : '#ffffff',
      });
    }
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-3xl ${className}`}>
      <canvas
        ref={canvasRef}
        width={760}
        height={360}
        onPointerDown={handlePointerDown}
        className="w-full h-full object-contain cursor-pointer select-none"
      />
    </div>
  );
};

// 1. Nebula Space Particles Visualizer
function renderNebula(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  subBass: number,
  accentHex: string,
  time: number
) {
  const centerX = width / 2;
  const centerY = height / 2;

  // Pulsing central aura
  const auraRadius = 60 + subBass * 80;
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, auraRadius);
  grad.addColorStop(0, `${accentHex}99`);
  grad.addColorStop(0.5, `${accentHex}33`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  // Swirling galaxy arms
  const particleCount = 80;
  for (let i = 0; i < particleCount; i++) {
    const freqVal = (freqData[i % freqData.length] || 0) / 255;
    const angle = i * 0.25 + time * (0.4 + freqVal * 0.4);
    const dist = 30 + (i / particleCount) * (Math.min(width, height) * 0.42) + freqVal * 40;

    const px = centerX + Math.cos(angle) * dist;
    const py = centerY + Math.sin(angle) * dist * 0.7; // slight perspective tilt
    const size = 1.5 + freqVal * 4;

    ctx.fillStyle = i % 3 === 0 ? accentHex : i % 3 === 1 ? '#00f2fe' : '#ffffff';
    ctx.globalAlpha = 0.4 + freqVal * 0.6;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

// 2. Multi-layer Liquid Glass Waves
function renderLiquidWaves(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  timeData: Uint8Array,
  accentHex: string,
  time: number
) {
  const layers = 3;
  for (let layer = 0; layer < layers; layer++) {
    ctx.beginPath();
    const alpha = layer === 0 ? '55' : layer === 1 ? '99' : 'ee';
    ctx.fillStyle = `${accentHex}${alpha}`;

    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 15) {
      const idx = Math.floor((x / width) * (freqData.length / 3));
      const freq = (freqData[idx] || 0) / 255;
      const wave = Math.sin(x * 0.015 + time * (1.2 + layer * 0.5) + layer) * (20 + freq * 40);
      const y = height * 0.6 + layer * 25 + wave - freq * 60;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }
}

// 3. Sub-Bass Holographic Energy Core
function renderEnergyCore(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  subBass: number,
  accentHex: string,
  rot: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const baseR = 50 + subBass * 45;

  ctx.save();
  ctx.translate(cx, cy);

  // Outer reactive spikes
  const points = 48;
  ctx.beginPath();
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = accentHex;
  ctx.shadowBlur = 20;

  for (let i = 0; i <= points; i++) {
    const angle = (Math.PI * 2 * i) / points + rot;
    const freq = (freqData[i * 2] || 0) / 255;
    const r = baseR + freq * 50;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Inner wireframe sphere
  ctx.shadowBlur = 0;
  for (let j = 0; j < 3; j++) {
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1;
    ctx.ellipse(0, 0, baseR * 0.8, baseR * 0.4 + subBass * 15, rot + (j * Math.PI) / 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Center bright core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 10 + subBass * 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 4. Spectrum Frequency Bars
function renderBars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  peaks: number[],
  accentHex: string,
  barCount: number = 48
) {
  const bars = Math.max(16, Math.min(64, barCount));
  const barWidth = (width / bars) * 0.7;
  const gap = (width / bars) * 0.3;

  for (let i = 0; i < bars; i++) {
    const dataIndex = Math.floor((i / bars) * (freqData.length * 0.65));
    const value = freqData[dataIndex] || 0;
    const barHeight = Math.max(4, (value / 255) * (height - 30));

    if (barHeight > (peaks[i] || 0)) {
      peaks[i] = barHeight;
    } else {
      peaks[i] = Math.max(0, (peaks[i] || 0) - 1.8);
    }

    const x = i * (barWidth + gap) + gap / 2;
    const y = height - barHeight;

    const grad = ctx.createLinearGradient(0, height, 0, y);
    grad.addColorStop(0, `${accentHex}40`);
    grad.addColorStop(0.7, accentHex);
    grad.addColorStop(1, '#ffffff');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
    ctx.fill();

    const peakY = height - (peaks[i] || 0) - 3;
    ctx.fillStyle = '#00f2fe';
    ctx.fillRect(x, Math.max(0, peakY), barWidth, 2);
  }
}

// 5. Classic Oscilloscope Wave
function renderWave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeData: Uint8Array,
  accentHex: string
) {
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = accentHex;
  ctx.shadowColor = accentHex;
  ctx.shadowBlur = 15;

  const sliceWidth = width / timeData.length;
  let x = 0;

  for (let i = 0; i < timeData.length; i++) {
    const v = timeData[i] / 128.0;
    const y = (v * height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
}

// 6. Circular Spectrum
function renderCircle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  rotation: number,
  accentHex: string
) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) * 0.45;
  const numBars = 64;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  for (let i = 0; i < numBars; i++) {
    const rad = (Math.PI * 2 * i) / numBars;
    const val = (freqData[i * 2] || 0) / 255;
    const barLen = val * 55;

    const x1 = Math.cos(rad) * radius;
    const y1 = Math.sin(rad) * radius;
    const x2 = Math.cos(rad) * (radius + barLen);
    const y2 = Math.sin(rad) * (radius + barLen);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = i % 2 === 0 ? accentHex : '#00f2fe';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  ctx.restore();
}

// 7. Vinyl Disc Visualizer
function renderVinyl(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  rotation: number,
  accentHex: string,
  activeTrack: Track | null
) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) * 0.75;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Outer black vinyl body
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0d14';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1e293b';
  ctx.stroke();

  // Vinyl grooves
  for (let r = radius * 0.4; r < radius * 0.9; r += 10) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#141c2e';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Center label
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = accentHex;
  ctx.fill();

  // Center spindle hole
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#030712';
  ctx.fill();

  ctx.restore();
}
