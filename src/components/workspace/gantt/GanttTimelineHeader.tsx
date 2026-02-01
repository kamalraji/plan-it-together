import { GanttViewMode, TimelineRange } from '@/lib/ganttUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, ZoomIn, ZoomOut } from 'lucide-react';
import { format } from 'date-fns';

interface GanttTimelineHeaderProps {
  viewMode: GanttViewMode;
  onViewModeChange: (mode: GanttViewMode) => void;
  onScrollToToday: () => void;
  timelineRange: TimelineRange;
}

const VIEW_MODES: { value: GanttViewMode; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

export function GanttTimelineHeader({
  viewMode,
  onViewModeChange,
  onScrollToToday,
  timelineRange,
}: GanttTimelineHeaderProps) {
  const handleZoomIn = () => {
    const currentIndex = VIEW_MODES.findIndex(m => m.value === viewMode);
    if (currentIndex > 0) {
      onViewModeChange(VIEW_MODES[currentIndex - 1].value);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = VIEW_MODES.findIndex(m => m.value === viewMode);
    if (currentIndex < VIEW_MODES.length - 1) {
      onViewModeChange(VIEW_MODES[currentIndex + 1].value);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
      {/* Left: Date Range */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          {format(timelineRange.start, 'MMM d, yyyy')} - {format(timelineRange.end, 'MMM d, yyyy')}
        </span>
      </div>

      {/* Center: View Mode Selector */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onViewModeChange(mode.value)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-md transition-all",
              viewMode === mode.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={onScrollToToday}
        >
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          Today
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            disabled={viewMode === 'day'}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            disabled={viewMode === 'quarter'}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
