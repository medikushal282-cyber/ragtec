import { ArrowRight } from "lucide-react";
import clsx from "clsx";

interface MotionButtonProps {
  label: string;
  href?: string;
  className?: string;
  background?: string;
  foreground?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export default function MotionButton({
  label,
  href,
  className,
  background = "#FFCC00",
  foreground = "#151515",
  onClick,
  icon
}: MotionButtonProps) {
  const content = (
    <>
      {/* Normal */}
      <span className="absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-full">
        <span>{label}</span>
        {icon ? icon : <ArrowRight size={15} strokeWidth={2.2} />}
      </span>

      {/* Hover */}
      <span className="absolute inset-0 flex items-center justify-center gap-2 translate-y-full transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0">
        <span>{label}</span>
        {icon ? icon : <ArrowRight size={15} strokeWidth={2.2} className="translate-x-1" />}
      </span>
    </>
  );

  const style = {
    background: background.startsWith('var(') ? background : background,
    color: foreground,
  };

  if (href)
    return (
      <a
        href={href}
        style={style as any}
        className={clsx(
          "group relative inline-flex h-11 overflow-hidden rounded-full px-6",
          "items-center justify-center font-bold tracking-[-0.02em]",
          "shadow-lg transition-all duration-300",
          "hover:scale-[1.03] active:scale-95 cursor-pointer",
          className
        )}
      >
        {content}
      </a>
    );

  return (
    <button
      onClick={onClick}
      style={style as any}
      className={clsx(
        "group relative inline-flex h-11 overflow-hidden rounded-full px-6",
        "items-center justify-center font-bold tracking-[-0.02em]",
        "shadow-lg transition-all duration-300",
        "hover:scale-[1.03] active:scale-95 cursor-pointer",
        className
      )}
    >
      {content}
    </button>
  );
}
