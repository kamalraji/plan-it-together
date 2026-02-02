import { TaskPriority, TaskCategory, WorkspaceRoleScope } from '@/types';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DailyConfig {
  interval: number; // Every X days
}

export interface WeeklyConfig {
  interval: number; // Every X weeks
  daysOfWeek: number[]; // 0-6 (Sun-Sat)
}

export interface MonthlyConfig {
  interval: number; // Every X months
  dayOfMonth?: number; // 1-31
  weekOfMonth?: number; // 1-4 or -1 for last
  dayOfWeek?: number; // 0-6 if using weekOfMonth
}

export interface CustomConfig {
  cronExpression: string;
}

export interface RecurrenceConfig {
  daily?: DailyConfig;
  weekly?: WeeklyConfig;
  monthly?: MonthlyConfig;
  custom?: CustomConfig;
}

export interface TaskTemplateData {
  subtasks?: Array<{ title: string; assignedTo?: string }>;
  tags?: string[];
  estimatedHours?: number;
  dependencies?: string[];
}

export interface RecurringTask {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  category?: TaskCategory;
  roleScope?: WorkspaceRoleScope;
  assignedTo?: string;
  recurrenceType: RecurrenceType;
  recurrenceConfig: RecurrenceConfig;
  templateData: TaskTemplateData;
  nextOccurrence: string;
  lastCreatedAt?: string;
  endDate?: string;
  occurrenceCount: number;
  maxOccurrences?: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTaskDTO {
  workspaceId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  category?: TaskCategory;
  roleScope?: WorkspaceRoleScope;
  assignedTo?: string;
  recurrenceType: RecurrenceType;
  recurrenceConfig: RecurrenceConfig;
  templateData?: TaskTemplateData;
  startDate: string; // When to start the recurrence
  endDate?: string;
  maxOccurrences?: number;
}

// Preset configurations for common patterns
export const RECURRENCE_PRESETS = {
  DAILY: {
    label: 'Every Day',
    type: 'daily' as RecurrenceType,
    config: { daily: { interval: 1 } },
  },
  WEEKDAYS: {
    label: 'Weekdays Only',
    type: 'weekly' as RecurrenceType,
    config: { weekly: { interval: 1, daysOfWeek: [1, 2, 3, 4, 5] } },
  },
  WEEKLY: {
    label: 'Every Week',
    type: 'weekly' as RecurrenceType,
    config: { weekly: { interval: 1, daysOfWeek: [1] } }, // Monday
  },
  BIWEEKLY: {
    label: 'Every 2 Weeks',
    type: 'weekly' as RecurrenceType,
    config: { weekly: { interval: 2, daysOfWeek: [1] } },
  },
  MONTHLY: {
    label: 'Every Month',
    type: 'monthly' as RecurrenceType,
    config: { monthly: { interval: 1, dayOfMonth: 1 } },
  },
  QUARTERLY: {
    label: 'Every Quarter',
    type: 'monthly' as RecurrenceType,
    config: { monthly: { interval: 3, dayOfMonth: 1 } },
  },
};

// Calculate next occurrence date
export function calculateNextOccurrence(
  currentDate: Date,
  recurrenceType: RecurrenceType,
  config: RecurrenceConfig
): Date {
  const next = new Date(currentDate);
  
  switch (recurrenceType) {
    case 'daily': {
      const dailyConfig = config.daily || { interval: 1 };
      next.setDate(next.getDate() + dailyConfig.interval);
      break;
    }
    case 'weekly': {
      const weeklyConfig = config.weekly || { interval: 1, daysOfWeek: [1] };
      const currentDay = next.getDay();
      const sortedDays = [...weeklyConfig.daysOfWeek].sort((a, b) => a - b);
      
      // Find next valid day in current week
      const nextDayInWeek = sortedDays.find(d => d > currentDay);
      
      if (nextDayInWeek !== undefined) {
        next.setDate(next.getDate() + (nextDayInWeek - currentDay));
      } else {
        // Move to next week's first valid day
        const daysUntilNextWeek = 7 - currentDay + sortedDays[0];
        next.setDate(next.getDate() + daysUntilNextWeek + (weeklyConfig.interval - 1) * 7);
      }
      break;
    }
    case 'monthly': {
      const monthlyConfig = config.monthly || { interval: 1, dayOfMonth: 1 };
      
      if (monthlyConfig.dayOfMonth) {
        next.setMonth(next.getMonth() + monthlyConfig.interval);
        next.setDate(Math.min(monthlyConfig.dayOfMonth, getDaysInMonth(next)));
      } else if (monthlyConfig.weekOfMonth !== undefined && monthlyConfig.dayOfWeek !== undefined) {
        next.setMonth(next.getMonth() + monthlyConfig.interval);
        next.setDate(1);
        
        // Find nth occurrence of day in month
        const targetDay = monthlyConfig.dayOfWeek;
        const targetWeek = monthlyConfig.weekOfMonth;
        
        if (targetWeek === -1) {
          // Last occurrence
          next.setMonth(next.getMonth() + 1);
          next.setDate(0); // Last day of previous month
          while (next.getDay() !== targetDay) {
            next.setDate(next.getDate() - 1);
          }
        } else {
          // Nth occurrence
          let count = 0;
          while (count < targetWeek) {
            if (next.getDay() === targetDay) count++;
            if (count < targetWeek) next.setDate(next.getDate() + 1);
          }
        }
      }
      break;
    }
    case 'custom': {
      // For custom cron, just add 1 day as fallback
      // Actual cron parsing would need a library
      next.setDate(next.getDate() + 1);
      break;
    }
  }
  
  return next;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Get next N occurrences for preview
export function getNextOccurrences(
  startDate: Date,
  recurrenceType: RecurrenceType,
  config: RecurrenceConfig,
  count: number = 5,
  endDate?: Date
): Date[] {
  const occurrences: Date[] = [];
  let current = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    if (i > 0) {
      current = calculateNextOccurrence(current, recurrenceType, config);
    }
    
    if (endDate && current > endDate) break;
    
    occurrences.push(new Date(current));
  }
  
  return occurrences;
}

// Format recurrence for display
export function formatRecurrence(
  recurrenceType: RecurrenceType,
  config: RecurrenceConfig
): string {
  switch (recurrenceType) {
    case 'daily': {
      const interval = config.daily?.interval || 1;
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
    }
    case 'weekly': {
      const weeklyConfig = config.weekly;
      if (!weeklyConfig) return 'Weekly';
      
      const days = weeklyConfig.daysOfWeek.map(d => 
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
      ).join(', ');
      
      const interval = weeklyConfig.interval;
      return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
    }
    case 'monthly': {
      const monthlyConfig = config.monthly;
      if (!monthlyConfig) return 'Monthly';
      
      const interval = monthlyConfig.interval;
      const prefix = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      
      if (monthlyConfig.dayOfMonth) {
        return `${prefix} on day ${monthlyConfig.dayOfMonth}`;
      }
      
      return prefix;
    }
    case 'custom': {
      return `Custom: ${config.custom?.cronExpression || 'N/A'}`;
    }
  }
}

// Day of week names
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];
