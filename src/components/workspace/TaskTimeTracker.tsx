import { useState, useEffect, useCallback } from 'react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { WorkspaceTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Square, Plus, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskTimeTrackerProps {
  workspaceId: string;
  userId: string;
  tasks: WorkspaceTask[];
  currentTaskId?: string;
  onTaskChange?: (taskId: string) => void;
}

interface ActiveTimer {
  taskId: string | null;
  startTime: Date;
  elapsed: number;
  description: string;
}

export function TaskTimeTracker({
  workspaceId,
  userId,
  tasks,
  currentTaskId,
  onTaskChange,
}: TaskTimeTrackerProps) {
  const { entries, createEntry, isCreating } = useTimeTracking(workspaceId, userId);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [displayTime, setDisplayTime] = useState(0);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualTaskId, setManualTaskId] = useState<string>(currentTaskId || '');

  // Check for running timer in entries
  useEffect(() => {
    const runningEntry = entries.find((e: any) => e.is_running);
    if (runningEntry && !activeTimer) {
      const startTime = new Date((runningEntry as any).start_time);
      setActiveTimer({
        taskId: runningEntry.task_id,
        startTime,
        elapsed: Math.floor((Date.now() - startTime.getTime()) / 1000),
        description: runningEntry.description || '',
      });
    }
  }, [entries, activeTimer]);

  // Update display time every second
  useEffect(() => {
    if (!activeTimer) {
      setDisplayTime(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000);
      setDisplayTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback((taskId: string | null) => {
    // Stop existing timer if any
    if (activeTimer) {
      stopTimer();
    }

    setActiveTimer({
      taskId,
      startTime: new Date(),
      elapsed: 0,
      description: '',
    });
  }, [activeTimer]);

  const stopTimer = useCallback(() => {
    if (!activeTimer) return;

    const hours = displayTime / 3600;
    if (hours >= 0.01) { // At least ~30 seconds
      createEntry({
        workspace_id: workspaceId,
        user_id: userId,
        task_id: activeTimer.taskId,
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: Math.round(hours * 100) / 100,
        description: activeTimer.description || 'Timer entry',
        status: 'draft',
      });
    }

    setActiveTimer(null);
    setDisplayTime(0);
  }, [activeTimer, displayTime, workspaceId, userId, createEntry]);

  const handleManualSubmit = () => {
    const hours = parseFloat(manualHours);
    if (isNaN(hours) || hours <= 0) return;

    createEntry({
      workspace_id: workspaceId,
      user_id: userId,
      task_id: manualTaskId || null,
      date: format(new Date(), 'yyyy-MM-dd'),
      hours,
      description: manualDescription || 'Manual entry',
      status: 'draft',
    });

    setShowManualEntry(false);
    setManualHours('');
    setManualDescription('');
  };

  const currentTask = activeTimer?.taskId 
    ? tasks.find(t => t.id === activeTimer.taskId) 
    : null;

  return (
    <>
      <Card className={cn(
        'transition-all',
        activeTimer && 'ring-2 ring-primary shadow-lg'
      )}>
        <CardContent className="p-4">
          {/* Timer Display */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                activeTimer ? 'bg-primary/10 animate-pulse' : 'bg-muted'
              )}>
                <Timer className={cn(
                  'h-5 w-5',
                  activeTimer ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <div className="text-2xl font-mono font-bold tabular-nums">
                  {formatTime(displayTime)}
                </div>
                {currentTask && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {currentTask.title}
                  </p>
                )}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              {!activeTimer ? (
                <Button
                  size="icon"
                  onClick={() => startTimer(currentTaskId || null)}
                  className="h-10 w-10 rounded-full"
                >
                  <Play className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={stopTimer}
                  className="h-10 w-10 rounded-full"
                >
                  <Square className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Task Selector */}
          <div className="space-y-3">
            <Select
              value={activeTimer?.taskId || currentTaskId || ''}
              onValueChange={(value) => {
                if (activeTimer) {
                  setActiveTimer({ ...activeTimer, taskId: value || null });
                }
                onTaskChange?.(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific task</SelectItem>
                {tasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTimer && (
              <Textarea
                placeholder="What are you working on?"
                value={activeTimer.description}
                onChange={(e) => setActiveTimer({ ...activeTimer, description: e.target.value })}
                rows={2}
                className="text-sm"
              />
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowManualEntry(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Manual Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task (optional)</Label>
              <Select value={manualTaskId} onValueChange={setManualTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific task</SelectItem>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hours *</Label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                placeholder="e.g., 1.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="What did you work on?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualEntry(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualSubmit}
              disabled={!manualHours || isCreating}
            >
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
