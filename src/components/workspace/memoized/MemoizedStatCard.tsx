import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  onClick?: () => void;
  className?: string;
}

function StatCardComponent({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  trend,
  onClick,
  className,
}: StatCardProps) {
  const trendColor = trend?.direction === 'up' 
    ? 'text-green-500' 
    : trend?.direction === 'down' 
    ? 'text-red-500' 
    : 'text-muted-foreground';

  return (
    <Card
      className={cn(
        'border-border/50 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/30',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {(subtext || trend) && (
              <div className="flex items-center gap-2 mt-0.5">
                {subtext && (
                  <span className="text-xs text-muted-foreground">{subtext}</span>
                )}
                {trend && (
                  <span className={cn('text-xs font-medium', trendColor)}>
                    {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                    {Math.abs(trend.value)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Memoized StatCard component for dashboard grids
 * Only re-renders when props change
 */
export const MemoizedStatCard = memo(StatCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.subtext === nextProps.subtext &&
    prevProps.icon === nextProps.icon &&
    prevProps.trend?.value === nextProps.trend?.value &&
    prevProps.trend?.direction === nextProps.trend?.direction
  );
});

MemoizedStatCard.displayName = 'MemoizedStatCard';

export default MemoizedStatCard;
