import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckSquare,
  AlertTriangle,
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
  isPast,
} from 'date-fns';

export interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority?: string;
  assignedTo?: string;
}

interface TaskCalendarViewProps {
  tasks: CalendarTask[];
  onTaskClick?: (task: CalendarTask) => void;
  onDateClick?: (date: Date) => void;
  onTaskDrop?: (taskId: string, newDate: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TaskCalendarView({
  tasks,
  onTaskClick,
  onDateClick,
  onTaskDrop,
}: TaskCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning to start on Sunday
  const startPadding = getDay(monthStart);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>();
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    return map;
  }, [tasks]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (date: Date) => {
    if (draggedTaskId && onTaskDrop) {
      onTaskDrop(draggedTaskId, date);
    }
    setDraggedTaskId(null);
  };

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-destructive';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-warning';
      default:
        return 'bg-info';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Task Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for days before month starts */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="h-24 bg-muted/20 rounded-md" />
          ))}

          {/* Days of the month */}
          {daysInMonth.map(day => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            const hasOverdue = dayTasks.some(
              t => t.status !== 'DONE' && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
            );

            return (
              <div
                key={day.toISOString()}
                className={`h-24 p-1 rounded-md border transition-colors cursor-pointer ${
                  isDayToday
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-border'
                } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                onClick={() => onDateClick?.(day)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isDayToday
                        ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                        : ''
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasOverdue && (
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                  )}
                </div>

                <ScrollArea className="h-14">
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${getPriorityColor(task.priority)} text-primary-foreground`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(task);
                        }}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <CalendarDayPopover
                        date={day}
                        tasks={dayTasks}
                        onTaskClick={onTaskClick}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-info" />
            <span>Low</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarDayPopover({
  date,
  tasks,
  onTaskClick,
}: {
  date: Date;
  tasks: CalendarTask[];
  onTaskClick?: (task: CalendarTask) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-[10px] text-primary hover:underline">
          +{tasks.length - 3} more
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <p className="font-medium">{format(date, 'EEEE, MMMM d')}</p>
          <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
        </div>
        <ScrollArea className="max-h-[200px]">
          <div className="p-2 space-y-1">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => onTaskClick?.(task)}
              >
                <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{task.status?.replace('_', ' ')}</span>
                    {task.priority && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
