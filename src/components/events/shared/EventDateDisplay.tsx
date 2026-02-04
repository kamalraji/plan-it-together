import { format, isToday, isTomorrow, isThisWeek, isThisYear } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventDateDisplayProps {
  startDate: string;
  endDate?: string;
  showTime?: boolean;
  showIcon?: boolean;
  className?: string;
  compact?: boolean;
}

export function EventDateDisplay({ 
  startDate, 
  endDate, 
  showTime = true,
  showIcon = true,
  className,
  compact = false
}: EventDateDisplayProps) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  // Smart date formatting based on proximity
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE'); // Day name
    if (isThisYear(date)) return format(date, 'MMM d'); // "Jan 15"
    return format(date, 'MMM d, yyyy'); // "Jan 15, 2026"
  };
  
  const dateLabel = getDateLabel(start);
  const timeLabel = format(start, 'h:mm a');
  const endTimeLabel = end ? format(end, 'h:mm a') : null;
  
  if (compact) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        {dateLabel} {showTime && `at ${timeLabel}`}
      </span>
    );
  }
  
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2 text-sm">
        {showIcon && <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        <span className="font-medium">{dateLabel}</span>
        {end && !showTime && (
          <span className="text-muted-foreground">
            – {getDateLabel(end)}
          </span>
        )}
      </div>
      {showTime && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {showIcon && <Clock className="h-4 w-4" aria-hidden="true" />}
          <time dateTime={startDate}>
            {timeLabel}
            {endTimeLabel && ` – ${endTimeLabel}`}
          </time>
        </div>
      )}
    </div>
  );
}
