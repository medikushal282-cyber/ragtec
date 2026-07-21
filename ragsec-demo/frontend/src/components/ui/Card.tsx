import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from './Button';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'red' | 'yellow' | 'none';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = 'none', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "cyber-panel p-6",
          {
            "glow-cyan border-cyber-cyan/80": glow === 'cyan',
            "glow-red border-cyber-pink/80": glow === 'red',
            "glow-yellow border-cyber-yellow/80": glow === 'yellow',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export { Card };
