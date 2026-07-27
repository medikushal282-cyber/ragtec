import { cn } from "../lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  delay = 0,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white/5 border border-white/10 flex flex-col justify-between space-y-4 hover:border-primary-fixed/50 hover:bg-white/10 backdrop-blur-md relative overflow-hidden",
        className
      )}
    >
      {/* Glossy gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200 z-10 relative">
        <div className="text-primary-fixed mb-2 mt-2">{icon}</div>
        <div className="font-sans font-bold text-white mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-white/50 text-xs">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
