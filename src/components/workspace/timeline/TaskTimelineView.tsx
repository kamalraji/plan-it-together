import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineTask {
  id: string;
  title: string;
  start_date?: string | null;
  due_date?: string | null;
  status: string;
  priority?: string;
  assignee_id?: string;
  color?: string;
}

interface TaskTimelineViewProps {
  tasks: TimelineTask[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick?: (taskId: string) => void;
}

const statusColors: Record<string, string> = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  done: 'bg-emerald-500',
  blocked: 'bg-red-500',
};

const priorityBorders: Record<string, string> = {
  urgent: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-amber-500',
  medium: 'border-l-4 border-l-blue-500',
  low: 'border-l-4 border-l-gray-400',
};

export function TaskTimelineView({
  tasks,
  currentDate,
  onDateChange,
  onTaskClick,
}: TaskTimelineViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group tasks by their date range
  const taskRows = useMemo(() => {
    const sortedTasks = [...tasks]
      .filter((t) => t.start_date || t.due_date)
      .sort((a, b) => {
        const aStart = a.start_date || a.due_date || '';
        const bStart = b.start_date || b.due_date || '';
        return aStart.localeCompare(bStart);
      });

    return sortedTasks;
  }, [tasks]);

  const getTaskPosition = (task: TimelineTask) => {
    const start = task.start_date ? new Date(task.start_date) : task.due_date ? new Date(task.due_date) : null;
    const end = task.due_date ? new Date(task.due_date) : start;
    
    if (!start) return null;

    const startDay = days.findIndex((d) => isSameDay(d, start) || d > start);
    const endDay = end ? days.findIndex((d) => isSameDay(d, end) || d > end) : startDay;

    const actualStart = Math.max(0, startDay === -1 ? 0 : startDay);
    const actualEnd = Math.min(days.length - 1, endDay === -1 ? days.length - 1 : endDay);

    return {
      left: (actualStart / days.length) * 100,
      width: Math.max(((actualEnd - actualStart + 1) / days.length) * 100, 3),
    };
  };

  const today = new Date();

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Grid */}
      <ScrollArea className="flex-1">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="flex border-b sticky top-0 bg-muted/50 backdrop-blur z-10">
            <div className="w-48 shrink-0 p-2 border-r font-medium text-sm">
              Task
            </div>
            <div className="flex-1 flex">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex-1 min-w-[30px] text-center text-xs p-1 border-r',
                    isSameDay(day, today) && 'bg-primary/10 font-bold',
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/50' : ''
                  )}
                >
                  <div>{format(day, 'd')}</div>
                  <div className="text-muted-foreground">{format(day, 'EEE')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div>
            {taskRows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No tasks with dates this month</p>
              </div>
            ) : (
              taskRows.map((task) => {
                const position = getTaskPosition(task);
                return (
                  <div
                    key={task.id}
                    className="flex border-b hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-48 shrink-0 p-2 border-r">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs px-1 py-0',
                            statusColors[task.status]?.replace('bg-', 'border-')
                          )}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 relative h-14">
                      {/* Today indicator */}
                      {days.some((d) => isSameDay(d, today)) && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                          style={{
                            left: `${((days.findIndex((d) => isSameDay(d, today)) + 0.5) / days.length) * 100}%`,
                          }}
                        />
                      )}
                      {/* Task Bar */}
                      {position && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-2 h-8 rounded cursor-pointer transition-all hover:opacity-80',
                                statusColors[task.status] || 'bg-primary',
                                priorityBorders[task.priority || '']
                              )}
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                              }}
                              onClick={() => onTaskClick?.(task.id)}
                            >
                              <span className="px-2 text-xs text-white font-medium truncate block leading-8">
                                {task.title}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.start_date && format(new Date(task.start_date), 'MMM d')}
                              {task.start_date && task.due_date && ' → '}
                              {task.due_date && format(new Date(task.due_date), 'MMM d')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
