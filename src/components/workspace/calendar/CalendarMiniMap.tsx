import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';

interface CalendarMiniMapProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  highlightedDates?: Date[];
  taskCountByDate?: Map<string, number>;
}

export function CalendarMiniMap({
  selectedDate,
  onDateSelect,
  highlightedDates = [],
  taskCountByDate = new Map(),
}: CalendarMiniMapProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const highlightedSet = useMemo(() => {
    return new Set(highlightedDates.map(d => format(d, 'yyyy-MM-dd')));
  }, [highlightedDates]);

  const isHighlighted = (date: Date) => {
    return highlightedSet.has(format(date, 'yyyy-MM-dd'));
  };

  const getTaskCount = (date: Date) => {
    return taskCountByDate.get(format(date, 'yyyy-MM-dd')) || 0;
  };

  const isSelected = (date: Date) => {
    return selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4" />
            {format(currentMonth, 'MMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div
              key={`${day}-${i}`}
              className="text-center text-[10px] text-muted-foreground py-0.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Padding */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}

          {/* Days */}
          {daysInMonth.map(day => {
            const taskCount = getTaskCount(day);
            const highlighted = isHighlighted(day);
            const selected = isSelected(day);
            const today = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect?.(day)}
                className={`aspect-square flex items-center justify-center text-xs rounded-sm relative transition-colors
                  ${selected ? 'bg-primary text-primary-foreground' : ''}
                  ${today && !selected ? 'border border-primary' : ''}
                  ${highlighted && !selected ? 'bg-primary/20' : ''}
                  ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                  hover:bg-muted
                `}
              >
                {format(day, 'd')}
                {taskCount > 0 && !selected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Has tasks</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
