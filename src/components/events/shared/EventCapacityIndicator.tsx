import { Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EventCapacityIndicatorProps {
  capacity?: number | null;
  registeredCount: number;
  showProgress?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function EventCapacityIndicator({ 
  capacity, 
  registeredCount, 
  showProgress = true,
  showIcon = true,
  className 
}: EventCapacityIndicatorProps) {
  if (!capacity) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        {showIcon && <Users className="h-4 w-4" aria-hidden="true" />}
        <span>{registeredCount} registered</span>
      </div>
    );
  }
  
  const percentage = Math.min(100, (registeredCount / capacity) * 100);
  const spotsLeft = Math.max(0, capacity - registeredCount);
  const isFull = spotsLeft === 0;
  const isAlmostFull = percentage >= 80;
  
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {showIcon && <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          <span className={cn(
            isFull && 'text-destructive font-medium',
            isAlmostFull && !isFull && 'text-amber-600 font-medium'
          )}>
            {isFull 
              ? 'Sold Out' 
              : isAlmostFull 
                ? `Only ${spotsLeft} spots left!` 
                : `${spotsLeft} spots available`}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">
          {registeredCount}/{capacity}
        </span>
      </div>
      {showProgress && (
        <Progress 
          value={percentage} 
          className={cn(
            'h-2',
            isFull && '[&>div]:bg-destructive',
            isAlmostFull && !isFull && '[&>div]:bg-amber-500'
          )}
          aria-label={`${Math.round(percentage)}% capacity filled`}
        />
      )}
    </div>
  );
}
