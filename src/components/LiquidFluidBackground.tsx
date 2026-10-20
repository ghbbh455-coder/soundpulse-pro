import React, { useEffect, useRef } from 'react';
import { ThemeConfig } from '../types/player';

interface LiquidFluidBackgroundProps {
  accentHex: string;
  theme: ThemeConfig;
  isPlaying: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const LiquidFluidBackground: React.FC<LiquidFluidBackgroundProps> = ({
  accentHex,
  theme,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const touchRipplesRef = useRef<TouchPoint[]>([]);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Dynamic fluid blobs with organic movement
    const blobs = [
      { x: width * 0.25, y: height * 0.25, vx: 0.4, vy: 0.3, r: 240, color: accentHex },
      { x: width * 0.75, y: height * 0.35, vx: -0.3, vy: 0.4, r: 280, color: '#7928ca' },
      { x: width * 0.5, y: height * 0.75, vx: 0.35, vy: -0.35, r: 300, color: '#00f2fe' },
      { x: width * 0.15, y: height * 0.85, vx: 0.25, vy: 0.2, r: 220, color: '#ff0080' },
    ];

    const render = () => {
      timeRef.current += isPlaying ? 0.015 : 0.006;
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Deep dark fluid base
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (theme.mode === 'cyberpunk') {
        bgGrad.addColorStop(0, '#090814');
        bgGrad.addColorStop(0.5, '#050711');
        bgGrad.addColorStop(1, '#020307');
      } else if (theme.mode === 'amoled') {
        bgGrad.addColorStop(0, '#000000');
        bgGrad.addColorStop(1, '#030303');
      } else {
        bgGrad.addColorStop(0, '#0b0f19');
        bgGrad.addColorStop(0.5, '#070b14');
        bgGrad.addColorStop(1, '#030408');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render glowing fluid metaballs with compositing
      ctx.globalCompositeOperation = 'screen';

      blobs.forEach((blob, idx) => {
        // Floating organic harmonic motion
        const oscX = Math.sin(t + idx * 1.5) * 60;
        const oscY = Math.cos(t * 0.8 + idx * 1.2) * 50;
        const curX = blob.x + oscX;
        const curY = blob.y + oscY;
        const curR = blob.r + Math.sin(t * 1.2 + idx) * 30;

        const radial = ctx.createRadialGradient(curX, curY, 0, curX, curY, curR);
        const col = idx === 0 ? accentHex : blob.color;
        radial.addColorStop(0, `${col}55`); // 33% opacity
        radial.addColorStop(0.5, `${col}20`); // 12% opacity
        radial.addColorStop(1, 'transparent');

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(curX, curY, curR, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render interactive touch ripples
      touchRipplesRef.current.forEach((ripple, i) => {
        ripple.radius += 3.5;
        ripple.alpha *= 0.96;

        ctx.strokeStyle = ripple.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = ripple.alpha;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 1.0;
      });

      // Filter out dead ripples
      touchRipplesRef.current = touchRipplesRef.current.filter((r) => r.alpha > 0.02);

      ctx.globalCompositeOperation = 'source-over';

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [accentHex, theme.mode, isPlaying]);

  // Touch and pointer ripple listener
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    touchRipplesRef.current.push({
      x: e.clientX,
      y: e.clientY,
      radius: 10,
      maxRadius: 180,
      alpha: 0.7,
      color: accentHex,
    });
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      className="fixed inset-0 pointer-events-auto z-0 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block filter blur-[60px] opacity-80 transition-opacity duration-700"
      />
      {/* Specular Liquid Frost Overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/60 pointer-events-none" />
    </div>
  );
};
