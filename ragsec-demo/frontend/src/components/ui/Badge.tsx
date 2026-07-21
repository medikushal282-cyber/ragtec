import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from './Button';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-widest transition-colors",
          {
            "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50": variant === 'default',
            "bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/50 glow-red": variant === 'critical',
            "bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/50 glow-yellow": variant === 'high',
            "bg-orange-500/20 text-orange-400 border border-orange-500/50": variant === 'medium',
            "bg-accent/20 text-accent border border-accent/50": variant === 'low',
          },
          className
        )}
        style={{
          clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)'
        }}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
