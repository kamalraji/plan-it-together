import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'badge' | 'minimal';
  className?: string;
  showText?: boolean;
}

/**
 * Animated LIVE indicator component with pulsing animation
 */
export function LiveIndicator({ 
  size = 'md', 
  variant = 'default',
  className,
  showText = true 
}: LiveIndicatorProps) {
  const sizeConfig = {
    sm: { dot: 'h-1.5 w-1.5', text: 'text-xs', padding: 'px-1.5 py-0.5', gap: 'gap-1' },
    md: { dot: 'h-2 w-2', text: 'text-sm', padding: 'px-2.5 py-1', gap: 'gap-1.5' },
    lg: { dot: 'h-2.5 w-2.5', text: 'text-base', padding: 'px-3 py-1.5', gap: 'gap-2' },
  };

  const config = sizeConfig[size];

  if (variant === 'minimal') {
    return (
      <span className={cn("relative flex", config.dot, className)}>
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-red-400"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative inline-flex rounded-full h-full w-full bg-red-500" />
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "inline-flex items-center rounded-full font-bold",
          "bg-red-500 text-white shadow-lg shadow-red-500/30",
          config.padding,
          config.gap,
          className
        )}
      >
        <span className={cn("relative flex", config.dot)}>
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-white"
            animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative inline-flex rounded-full h-full w-full bg-white" />
        </span>
        {showText && <span className={config.text}>LIVE</span>}
      </motion.div>
    );
  }

  // Default variant with glassmorphism
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center rounded-full font-bold",
        "bg-gradient-to-r from-red-500 to-red-600 text-white",
        "shadow-xl shadow-red-500/40 ring-2 ring-red-500/20",
        "backdrop-blur-sm",
        config.padding,
        config.gap,
        className
      )}
    >
      <span className={cn("relative flex", config.dot)}>
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-white/80"
          animate={{ 
            scale: [1, 2, 1], 
            opacity: [0.8, 0, 0.8] 
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            ease: "easeOut" 
          }}
        />
        <span className="relative inline-flex rounded-full h-full w-full bg-white" />
      </span>
      {showText && (
        <motion.span 
          className={cn(config.text, "tracking-wider")}
          animate={{ opacity: [1, 0.85, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          LIVE
        </motion.span>
      )}
    </motion.div>
  );
}
