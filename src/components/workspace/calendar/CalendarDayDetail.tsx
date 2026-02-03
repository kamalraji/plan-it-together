import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  User,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { CalendarTask } from './TaskCalendarView';

interface CalendarDayDetailProps {
  date: Date;
  tasks: CalendarTask[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskClick?: (task: CalendarTask) => void;
  onAddTask?: (date: Date) => void;
}

export function CalendarDayDetail({
  date,
  tasks,
  open,
  onOpenChange,
  onTaskClick,
  onAddTask,
}: CalendarDayDetailProps) {
  const completedTasks = tasks.filter(t => t.status === 'DONE');
  const pendingTasks = tasks.filter(t => t.status !== 'DONE');
  const overdueTasks = pendingTasks.filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));

  const getPriorityBadge = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Low</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DONE':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'BLOCKED':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(date, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled for this day
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${overdueTasks.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {overdueTasks.length}
              </p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="py-8 text-center">
                <CheckSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No tasks for this day</p>
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onTaskClick?.(task)}
                >
                  <CheckSquare className={`h-5 w-5 mt-0.5 shrink-0 ${
                    task.status === 'DONE' ? 'text-green-600' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {task.assignedTo && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Add Task Button */}
        {onAddTask && (
          <Button className="w-full" onClick={() => onAddTask(date)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task for This Day
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
