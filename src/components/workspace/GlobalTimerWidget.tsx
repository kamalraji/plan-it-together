import { useState, useEffect } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { Button } from '@/components/ui/button';
import { Minimize2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalTimerWidgetProps {
  workspaceId: string;
  userId: string;
  taskTitle?: string;
}

export function GlobalTimerWidget({ workspaceId, userId, taskTitle }: GlobalTimerWidgetProps) {
  const { entries } = useTimeTracking(workspaceId, userId);
  const [isMinimized, setIsMinimized] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Check for running timer in entries
  useEffect(() => {
    const runningEntry = entries.find((e: any) => e.is_running);
    if (runningEntry) {
      const start = new Date((runningEntry as any).start_time);
      setStartTime(start);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      setStartTime(null);
    }
  }, [entries]);

  // Update display time every second
  useEffect(() => {
    if (!isRunning || !startTime) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setDisplayTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show widget if no timer is running
  if (!isRunning) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="icon"
          className={cn(
            'h-12 w-12 rounded-full shadow-lg',
            'animate-pulse bg-primary'
          )}
          onClick={() => setIsMinimized(false)}
        >
          <Timer className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={cn(
        'bg-card border rounded-lg shadow-xl p-4 min-w-[200px]',
        'animate-in slide-in-from-bottom-2'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Recording</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-2xl font-mono font-bold text-center mb-2">
          {formatTime(displayTime)}
        </div>

        {taskTitle && (
          <p className="text-xs text-muted-foreground text-center truncate mb-3">
            {taskTitle}
          </p>
        )}

        {/* Alert for long sessions */}
        {displayTime > 8 * 3600 && (
          <div className="text-xs text-amber-600 bg-amber-50 rounded p-2 text-center mb-2">
            Timer running for over 8 hours
          </div>
        )}
      </div>
    </div>
  );
}
