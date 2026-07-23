import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useSpring, useTransform, SpringOptions } from 'framer-motion';
import { cn } from './Button'; // Assuming cn exists in Button.tsx or similar utility

export interface MagneticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  strength?: number;
  radius?: number;
  springConfig?: SpringOptions;
}

export const MagneticCard = forwardRef<HTMLDivElement, MagneticCardProps>(
  (
    {
      title,
      subtitle,
      children,
      className,
      strength = 40,
      radius = 0, // Not strictly used for clamping here unless clamping logic is added, but keeping for API completeness
      springConfig = { stiffness: 150, damping: 15, mass: 0.1 },
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const [isHovered, setIsHovered] = useState(false);

    // Motion values for the cursor position relative to the center of the card
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Apply spring physics for smooth, non-snapping return and movement
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    // Parallax effect for the dot (moves slightly more than the text)
    const dotX = useTransform(springX, (val) => val * 1.5);
    const dotY = useTransform(springY, (val) => val * 1.5);

    // Cursor position for radial glow
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Cursor position for glow (relative to top-left of container)
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);

      // Distance from center of the card
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      // Calculate translation based on strength, clamping if radius is provided
      let moveX = (deltaX / rect.width) * strength;
      let moveY = (deltaY / rect.height) * strength;

      if (radius > 0) {
        const distance = Math.sqrt(moveX * moveX + moveY * moveY);
        if (distance > radius) {
          moveX = (moveX / distance) * radius;
          moveY = (moveY / distance) * radius;
        }
      }

      x.set(moveX);
      y.set(moveY);
    };

    const handlePointerEnter = () => {
      setIsHovered(true);
    };

    const handlePointerLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    };

    // Prevent hydration mismatch for SSR by ensuring we only render client-side glow if needed, 
    // or just rely on CSS which is SSR safe.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className={cn(
          "relative w-full max-w-sm aspect-square bg-cyber-dark/80 overflow-hidden flex items-center justify-center group",
          className
        )}
        {...props}
      >
        {/* Soft Radial Glow under the cursor */}
        {mounted && isHovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: useTransform(
                [mouseX, mouseY],
                ([mx, my]) =>
                  `radial-gradient(circle 120px at ${mx}px ${my}px, rgba(0,255,136,0.1), transparent 100%)`
              ),
            }}
          />
        )}

        {/* Fixed Outer Frame */}
        <div className="absolute inset-4 border border-dashed border-cyber-cyan/20 pointer-events-none" />

        {/* L-shaped corner brackets */}
        <div className="absolute inset-4 pointer-events-none">
          {/* Top Left */}
          <div className="absolute top-[-1px] left-[-1px] w-3 h-3 border-t border-l border-cyber-cyan" />
          {/* Top Right */}
          <div className="absolute top-[-1px] right-[-1px] w-3 h-3 border-t border-r border-cyber-cyan" />
          {/* Bottom Left */}
          <div className="absolute bottom-[-1px] left-[-1px] w-3 h-3 border-b border-l border-cyber-cyan" />
          {/* Bottom Right */}
          <div className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-b border-r border-cyber-cyan" />
        </div>

        {/* Magnetic Content Layer */}
        <motion.div
          style={{ x: springX, y: springY }}
          className="relative z-10 flex flex-col items-center justify-center text-center p-6 pointer-events-none"
        >
          {title && (
            <h3 className="text-xl font-bold tracking-widest uppercase text-white mb-1">
              {title}
            </h3>
          )}
          
          {subtitle && (
            <p className="text-xs text-cyber-gray font-mono uppercase tracking-widest mb-4">
              {subtitle}
            </p>
          )}

          {children}

          {/* Center Dot (Parallax) */}
          <motion.div
            style={{ x: dotX, y: dotY }}
            className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-[0_0_8px_rgba(0,255,136,0.8)] mt-4"
          />
        </motion.div>
      </div>
    );
  }
);

MagneticCard.displayName = 'MagneticCard';
