import { WorkspaceTask } from '@/types';

export type GanttViewMode = 'day' | 'week' | 'month' | 'quarter';

export interface TimelineRange {
  start: Date;
  end: Date;
}

export interface TaskPosition {
  left: number;
  width: number;
}

export interface DependencyLine {
  fromTaskId: string;
  toTaskId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish';
}

// Get the width of a day based on view mode
export function getDayWidth(viewMode: GanttViewMode): number {
  switch (viewMode) {
    case 'day': return 40;
    case 'week': return 20;
    case 'month': return 8;
    case 'quarter': return 3;
  }
}

// Calculate the number of days between two dates
export function calculateDaysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

// Get timeline range based on tasks and current date
export function getTimelineRange(tasks: WorkspaceTask[], _viewMode: GanttViewMode): TimelineRange {
  const now = new Date();
  let minDate = new Date(now);
  let maxDate = new Date(now);
  
  // Add buffer based on view mode
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 30);
  
  tasks.forEach(task => {
    const startDate = task.metadata?.startDate 
      ? new Date(task.metadata.startDate as string) 
      : (task.dueDate ? new Date(task.dueDate) : null);
    const endDate = task.metadata?.endDate 
      ? new Date(task.metadata.endDate as string)
      : (task.dueDate ? new Date(task.dueDate) : null);
    
    if (startDate && startDate < minDate) {
      minDate = new Date(startDate);
    }
    if (endDate && endDate > maxDate) {
      maxDate = new Date(endDate);
    }
  });
  
  // Add padding
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 14);
  
  return { start: minDate, end: maxDate };
}

// Get the position and width of a task bar
export function getTaskPosition(
  task: WorkspaceTask, 
  timelineStart: Date, 
  dayWidth: number
): TaskPosition | null {
  const startDate = task.metadata?.startDate 
    ? new Date(task.metadata.startDate as string) 
    : (task.dueDate ? new Date(task.dueDate) : null);
  const endDate = task.metadata?.endDate 
    ? new Date(task.metadata.endDate as string)
    : (task.dueDate ? new Date(task.dueDate) : null);
  
  if (!startDate) return null;
  
  const left = calculateDaysBetween(timelineStart, startDate) * dayWidth;
  const duration = endDate 
    ? Math.max(1, calculateDaysBetween(startDate, endDate))
    : 1;
  const width = Math.max(duration * dayWidth, dayWidth);
  
  return { left, width };
}

// Snap a date to grid based on view mode
export function snapToGrid(date: Date, viewMode: GanttViewMode): Date {
  const snapped = new Date(date);
  
  switch (viewMode) {
    case 'day':
      snapped.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const day = snapped.getDay();
      snapped.setDate(snapped.getDate() - day);
      snapped.setHours(0, 0, 0, 0);
      break;
    case 'month':
      snapped.setDate(1);
      snapped.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      const month = snapped.getMonth();
      snapped.setMonth(Math.floor(month / 3) * 3);
      snapped.setDate(1);
      snapped.setHours(0, 0, 0, 0);
      break;
  }
  
  return snapped;
}

// Calculate dependency line points
export function getDependencyLinePoints(
  fromTask: WorkspaceTask,
  toTask: WorkspaceTask,
  timelineStart: Date,
  dayWidth: number,
  rowHeight: number,
  taskRowMap: Map<string, number>
): DependencyLine | null {
  const fromPos = getTaskPosition(fromTask, timelineStart, dayWidth);
  const toPos = getTaskPosition(toTask, timelineStart, dayWidth);
  
  if (!fromPos || !toPos) return null;
  
  const fromRow = taskRowMap.get(fromTask.id) ?? 0;
  const toRow = taskRowMap.get(toTask.id) ?? 0;
  
  const x1 = fromPos.left + fromPos.width;
  const y1 = fromRow * rowHeight + rowHeight / 2;
  const x2 = toPos.left;
  const y2 = toRow * rowHeight + rowHeight / 2;
  
  return {
    fromTaskId: fromTask.id,
    toTaskId: toTask.id,
    x1,
    y1,
    x2,
    y2,
    type: 'finish-to-start',
  };
}

// Check if two tasks overlap
export function isTaskOverlapping(task1: WorkspaceTask, task2: WorkspaceTask): boolean {
  const start1 = task1.metadata?.startDate ? new Date(task1.metadata.startDate as string) : null;
  const end1 = task1.metadata?.endDate ? new Date(task1.metadata.endDate as string) : null;
  const start2 = task2.metadata?.startDate ? new Date(task2.metadata.startDate as string) : null;
  const end2 = task2.metadata?.endDate ? new Date(task2.metadata.endDate as string) : null;
  
  if (!start1 || !end1 || !start2 || !end2) return false;
  
  return start1 < end2 && start2 < end1;
}

// Group tasks by category
export function groupTasksByCategory(tasks: WorkspaceTask[]): Map<string, WorkspaceTask[]> {
  const groups = new Map<string, WorkspaceTask[]>();
  
  tasks.forEach(task => {
    const category = task.category || 'GENERAL';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(task);
  });
  
  return groups;
}

// Generate timeline headers based on view mode
export function generateTimelineHeaders(range: TimelineRange, viewMode: GanttViewMode): { label: string; date: Date; width: number }[] {
  const headers: { label: string; date: Date; width: number }[] = [];
  const current = new Date(range.start);
  const dayWidth = getDayWidth(viewMode);
  
  while (current <= range.end) {
    let label = '';
    let width = dayWidth;
    const date = new Date(current);
    
    switch (viewMode) {
      case 'day':
        label = current.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        label = `Week ${getWeekNumber(current)}`;
        width = dayWidth * 7;
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        label = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
        width = dayWidth * daysInMonth;
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarter':
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        label = `Q${quarter} ${current.getFullYear()}`;
        const monthsInQuarter = 3;
        let daysInQuarter = 0;
        for (let i = 0; i < monthsInQuarter; i++) {
          const m = Math.floor(current.getMonth() / 3) * 3 + i;
          daysInQuarter += new Date(current.getFullYear(), m + 1, 0).getDate();
        }
        width = dayWidth * daysInQuarter;
        current.setMonth(current.getMonth() + 3);
        break;
    }
    
    headers.push({ label, date, width });
  }
  
  return headers;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Calculate days from timeline start
export function getDaysFromStart(date: Date, timelineStart: Date): number {
  return calculateDaysBetween(timelineStart, date);
}

// Priority colors for Gantt bars
export const GANTT_PRIORITY_COLORS = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-green-500',
};

// Status colors for Gantt bars
export const GANTT_STATUS_COLORS = {
  NOT_STARTED: 'bg-slate-400',
  IN_PROGRESS: 'bg-blue-500',
  REVIEW_REQUIRED: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  BLOCKED: 'bg-red-500',
};
