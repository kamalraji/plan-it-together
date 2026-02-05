/**
 * Active Now Badge
 * Small badge showing "X active now"
 * Used in dashboard headers
 */
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActiveNowBadgeProps {
  count: number;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'compact' | 'pill';
}

export function ActiveNowBadge({
  count,
  className,
  showIcon = true,
  variant = 'default',
}: ActiveNowBadgeProps) {
  if (count === 0) return null;

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span>{count}</span>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20",
        className
      )}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
        </span>
        {count} active
      </span>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-md",
      "bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium",
      className
    )}>
      {showIcon && <Users className="h-3 w-3" />}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <span>{count} active now</span>
    </div>
  );
}
