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
          "inline-flex items-center justify-center font-bold tracking-widest uppercase transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
          {
            "bg-cyber-cyan text-cyber-black hover:bg-cyber-yellow hover:text-cyber-black": variant === 'default',
            "border-2 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-black": variant === 'outline',
            "hover:bg-cyber-dark text-cyber-gray hover:text-cyber-cyan": variant === 'ghost',
            "bg-cyber-cyan text-cyber-black glow-cyan hover:bg-cyber-yellow hover:glow-yellow": variant === 'glow',
            "h-10 px-6 py-2 text-sm": size === 'default',
            "h-8 px-4 text-xs": size === 'sm',
            "h-14 px-10 text-lg": size === 'lg',
            "h-10 w-10": size === 'icon',
          },
          // Adding angled corners via clip-path for that cyberpunk feel
          "clip-path-[polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]",
          className
        )}
        style={{
          clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
        }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
