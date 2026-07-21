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
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          {
            "bg-primary/20 text-primary border border-primary/30": variant === 'default',
            "bg-critical/20 text-critical border border-critical/50 glow-red": variant === 'critical',
            "bg-orange-500/20 text-orange-400 border border-orange-500/30": variant === 'high',
            "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30": variant === 'medium',
            "bg-accent/20 text-accent border border-accent/30": variant === 'low',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
