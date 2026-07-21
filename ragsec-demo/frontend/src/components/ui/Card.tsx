import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from './Button';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'red' | 'none';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = 'none', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel rounded-xl p-6",
          {
            "glow-cyan border-primary/50": glow === 'cyan',
            "glow-red border-critical/50": glow === 'red',
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
