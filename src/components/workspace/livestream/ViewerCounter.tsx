import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewerCounterProps {
  count: number;
  previousCount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'card' | 'minimal' | 'premium';
  showTrend?: boolean;
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * Real-time viewer counter with animated transitions
 */
export function ViewerCounter({
  count,
  previousCount,
  size = 'md',
  variant = 'default',
  showTrend = false,
  showLabel = true,
  className,
  animate = true,
}: ViewerCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);

  // Animate count changes
  useEffect(() => {
    if (!animate) {
      setDisplayCount(count);
      return;
    }

    const diff = count - displayCount;
    if (diff === 0) return;

    setIsIncreasing(diff > 0);
    
    const steps = Math.min(Math.abs(diff), 20);
    const increment = diff / steps;
    let current = displayCount;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplayCount(count);
        clearInterval(interval);
      } else {
        current += increment;
        setDisplayCount(Math.round(current));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [count, animate]);

  // Track trend from previous count
  const trend = previousCount !== undefined 
    ? count > previousCount ? 'up' : count < previousCount ? 'down' : null
    : isIncreasing !== null 
      ? isIncreasing ? 'up' : 'down' 
      : null;

  const sizeConfig = {
    sm: { icon: 'h-3 w-3', text: 'text-sm', label: 'text-xs' },
    md: { icon: 'h-4 w-4', text: 'text-lg', label: 'text-xs' },
    lg: { icon: 'h-5 w-5', text: 'text-2xl', label: 'text-sm' },
    xl: { icon: 'h-6 w-6', text: 'text-4xl', label: 'text-base' },
  };

  const config = sizeConfig[size];

  const formattedCount = displayCount >= 1000 
    ? `${(displayCount / 1000).toFixed(displayCount >= 10000 ? 0 : 1)}K`
    : displayCount.toLocaleString();

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Eye className={cn(config.icon, "text-red-500")} />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayCount}
            initial={animate ? { y: -10, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className={cn(config.text, "font-bold tabular-nums")}
          >
            {formattedCount}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex flex-col items-center p-4 rounded-2xl",
        "bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent",
        "border border-red-500/20",
        className
      )}>
        <div className="flex items-center gap-2 text-red-500 mb-1">
          <Eye className={config.icon} />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={displayCount}
              initial={animate ? { scale: 1.2, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(config.text, "font-bold tabular-nums")}
            >
              {formattedCount}
            </motion.span>
          </AnimatePresence>
        </div>
        {showLabel && (
          <p className={cn(config.label, "text-muted-foreground")}>
            watching now
          </p>
        )}
        {showTrend && trend && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center gap-1 mt-2",
              config.label,
              trend === 'up' ? 'text-green-500' : 'text-red-400'
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{trend === 'up' ? 'Growing' : 'Declining'}</span>
          </motion.div>
        )}
      </div>
    );
  }

  if (variant === 'premium') {
    return (
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          "bg-gradient-to-br from-red-500/15 via-orange-500/10 to-yellow-500/5",
          "border border-red-500/30 shadow-xl shadow-red-500/10",
          className
        )}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Users className="h-5 w-5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                Live Viewers
              </span>
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={displayCount}
                initial={animate ? { y: 20, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-bold tabular-nums bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
              >
                {formattedCount}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {showTrend && trend && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                trend === 'up' 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-red-400/20 text-red-400'
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{trend === 'up' ? '+' : '-'}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
      "bg-red-500/10 border border-red-500/20",
      className
    )}>
      <Eye className={cn(config.icon, "text-red-500")} />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={displayCount}
          initial={animate ? { y: -5, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          className={cn(config.text, "font-bold tabular-nums text-foreground")}
        >
          {formattedCount}
        </motion.span>
      </AnimatePresence>
      {showLabel && (
        <span className={cn(config.label, "text-muted-foreground hidden sm:inline")}>
          watching
        </span>
      )}
    </div>
  );
}
