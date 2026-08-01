import React, { useEffect, useRef } from 'react';

export interface DitherShaderProps {
  src?: string;
  gridSize?: number;
  ditherMode?: 'bayer' | 'halftone' | 'noise' | 'crosshatch';
  colorMode?: 'original' | 'grayscale' | 'duotone' | 'custom';
  invert?: boolean;
  animated?: boolean;
  animationSpeed?: number;
  primaryColor?: string;
  secondaryColor?: string;
  threshold?: number;
  className?: string;
  markers?: Array<{ xPct: number; yPct: number; color?: string; isShimmering?: boolean }>;
}

const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
];

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const DitherShader: React.FC<DitherShaderProps> = ({
  src = '/world.svg',
  gridSize = 2,
  ditherMode = 'bayer',
  colorMode = 'duotone',
  invert = false,
  animated = true,
  animationSpeed = 0.02,
  primaryColor = '#040914',
  secondaryColor = '#00f0ff',
  threshold = 0.35,
  className = '',
  markers = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const targetSrc = src || '/world.svg';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = targetSrc;
    img.onload = () => {
      imgRef.current = img;
    };
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animFrame: number;
    let animTime = 0;

    const render = () => {
      const displayWidth = canvas.clientWidth || 800;
      const displayHeight = canvas.clientHeight || 450;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Deep Ocean Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // 1. Draw World Map SVG
      if (imgRef.current) {
        ctx.drawImage(imgRef.current, 0, 0, displayWidth, displayHeight);
      }

      // 2. Draw Retro Vibrant Light Circles DIRECTLY onto canvas BEFORE dither loop
      markers.forEach((m) => {
        const cx = Math.floor((m.xPct / 100) * displayWidth);
        const cy = Math.floor((m.yPct / 100) * displayHeight);
        const r = m.isShimmering ? 6 : 4; // Sharp Retro Vibrant Light Circle Radius

        ctx.fillStyle = '#ffffff'; // Bright white base so dither loop processes retro luminance

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Run Dither Shader Matrix over Map & Retro Light Circles
      const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight);
      const data = imageData.data;

      const pRgb = hexToRgb(primaryColor);
      const sRgb = hexToRgb(secondaryColor);

      const step = Math.max(1, Math.floor(gridSize));

      for (let y = 0; y < displayHeight; y += step) {
        for (let x = 0; x < displayWidth; x += step) {
          const i = (y * displayWidth + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Luminance
          let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (invert) lum = 1.0 - lum;

          // Dither Thresholding
          let ditherThreshold = threshold;
          const timeOffset = animated ? Math.sin(animTime * 2 + x * 0.03 + y * 0.03) * 0.15 : 0;

          if (ditherMode === 'bayer') {
            const bx = Math.floor(x / step) % 4;
            const by = Math.floor(y / step) % 4;
            ditherThreshold = BAYER_4X4[by][bx] + timeOffset;
          } else if (ditherMode === 'halftone') {
            const cx = (x % (step * 4)) - step * 2;
            const cy = (y % (step * 4)) - step * 2;
            const dist = Math.sqrt(cx * cx + cy * cy) / (step * 2);
            ditherThreshold = dist + timeOffset;
          } else if (ditherMode === 'noise') {
            const n = Math.sin(x * 12.9898 + y * 78.233 + animTime) * 43758.5453;
            ditherThreshold = n - Math.floor(n) + timeOffset;
          } else if (ditherMode === 'crosshatch') {
            const line = ((x + y) % (step * 3)) / (step * 3);
            ditherThreshold = line + timeOffset;
          }

          const isBright = lum >= ditherThreshold;

          // Color Mapping
          let fr = r,
            fg = g,
            fb = b;

          if (colorMode === 'grayscale') {
            const val = isBright ? 255 : 0;
            fr = fg = fb = val;
          } else if (colorMode === 'duotone' || colorMode === 'custom') {
            const targetColor = isBright ? sRgb : pRgb;
            fr = targetColor[0];
            fg = targetColor[1];
            fb = targetColor[2];
          } else if (colorMode === 'original') {
            const factor = isBright ? 1.4 : 0.2;
            fr = Math.min(255, r * factor);
            fg = Math.min(255, g * factor);
            fb = Math.min(255, b * factor);
          }

          // Write back pixel blocks
          for (let dy = 0; dy < step && y + dy < displayHeight; dy++) {
            for (let dx = 0; dx < step && x + dx < displayWidth; dx++) {
              const idx = ((y + dy) * displayWidth + (x + dx)) * 4;
              data[idx] = fr;
              data[idx + 1] = fg;
              data[idx + 2] = fb;
              data[idx + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      if (animated) {
        animTime += animationSpeed;
        animFrame = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [
    gridSize,
    ditherMode,
    colorMode,
    invert,
    animated,
    animationSpeed,
    primaryColor,
    secondaryColor,
    threshold,
    src,
    markers,
  ]);

  return <canvas ref={canvasRef} className={`w-full h-full block ${className}`} />;
};
