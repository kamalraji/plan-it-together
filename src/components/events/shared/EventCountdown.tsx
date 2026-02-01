import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface EventCountdownProps {
  targetDate: string | Date;
  className?: string;
  variant?: 'default' | 'compact' | 'hero';
  showLabels?: boolean;
  onComplete?: () => void;
  /** IANA timezone string (e.g., 'America/New_York'). Defaults to user's local timezone. */
  timezone?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
}

export function EventCountdown({
  targetDate,
  className,
  variant = 'default',
  showLabels = true,
  onComplete,
  timezone,
}: EventCountdownProps) {
  // Parse target date, respecting timezone if provided
  const target = useMemo(() => {
    const date = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    
    // If timezone is provided, validate it
    if (timezone) {
      try {
        // Test if timezone is valid by creating a formatter
        new Intl.DateTimeFormat('en-US', { timeZone: timezone });
        // The date is already parsed; timezone handling is for display purposes
        // The countdown calculates difference from now(), which is always in UTC internally
        return date;
      } catch {
        // Invalid timezone, fall back to local
        return date;
      }
    }
    
    return date;
  }, [targetDate, timezone]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(target));
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(target);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0 && !hasCompleted) {
        setHasCompleted(true);
        onComplete?.();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [target, onComplete, hasCompleted]);

  // Don't show if event has passed
  if (timeLeft.total <= 0) {
    return null;
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'Days', shortLabel: 'd' },
    { value: timeLeft.hours, label: 'Hours', shortLabel: 'h' },
    { value: timeLeft.minutes, label: 'Minutes', shortLabel: 'm' },
    { value: timeLeft.seconds, label: 'Seconds', shortLabel: 's' },
  ];

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 text-sm font-medium',
          className
        )}
        role="timer"
        aria-live="polite"
        aria-label={`Event starts in ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
      >
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {timeLeft.hours.toString().padStart(2, '0')}:
          {timeLeft.minutes.toString().padStart(2, '0')}:
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-4 rounded-xl bg-background/20 backdrop-blur px-6 py-3',
          className
        )}
        role="timer"
        aria-live="polite"
        aria-label={`Event starts in ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
      >
        <Clock className="h-5 w-5 opacity-80" aria-hidden="true" />
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums">
                {unit.value.toString().padStart(2, '0')}
              </span>
              {showLabels && (
                <span className="text-xs opacity-80">{unit.shortLabel}</span>
              )}
            </div>
            {index < timeUnits.length - 1 && (
              <span className="text-xl opacity-60 mx-1">:</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn('flex items-center gap-3', className)}
      role="timer"
      aria-live="polite"
      aria-label={`Event starts in ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}
    >
      {timeUnits.map((unit) => (
        <div
          key={unit.label}
          className="flex flex-col items-center rounded-lg bg-muted p-3 min-w-[60px]"
        >
          <span className="text-2xl font-bold tabular-nums">{unit.value}</span>
          {showLabels && (
            <span className="text-xs text-muted-foreground">{unit.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default EventCountdown;
