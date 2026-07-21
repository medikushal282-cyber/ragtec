import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'glow';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-background hover:bg-primary/90": variant === 'default',
            "border border-primary/50 text-primary hover:bg-primary/10": variant === 'outline',
            "hover:bg-surface text-gray-300 hover:text-white": variant === 'ghost',
            "bg-primary text-background glow-cyan hover:bg-primary/90": variant === 'glow',
            "h-9 px-4 py-2": size === 'default',
            "h-8 rounded-md px-3 text-xs": size === 'sm',
            "h-10 rounded-md px-8": size === 'lg',
            "h-9 w-9": size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
