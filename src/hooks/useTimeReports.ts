import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns';

export interface TimeReportEntry {
  id: string;
  userId: string;
  userName: string;
  taskId: string | null;
  taskTitle: string | null;
  date: string;
  hours: number;
  description: string | null;
  status: string;
  isBillable: boolean;
}

export interface TimeReportByTask {
  taskId: string;
  taskTitle: string;
  hours: number;
  entries: number;
}

export interface TimeReportByUser {
  userId: string;
  userName: string;
  hours: number;
  entries: number;
}

export interface TimeReportByCategory {
  category: string;
  hours: number;
}

export interface TimeReportByDay {
  date: string;
  hours: number;
  billableHours: number;
}

export interface TimeReportData {
  totalHours: number;
  billableHours: number;
  entriesCount: number;
  byTask: TimeReportByTask[];
  byUser: TimeReportByUser[];
  byCategory: TimeReportByCategory[];
  byDay: TimeReportByDay[];
  entries: TimeReportEntry[];
}

export function useTimeReports(
  workspaceId: string | undefined,
  dateRange: { start: Date; end: Date }
) {
  return useQuery({
    queryKey: ['time-reports', workspaceId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async (): Promise<TimeReportData> => {
      if (!workspaceId) {
        return {
          totalHours: 0,
          billableHours: 0,
          entriesCount: 0,
          byTask: [],
          byUser: [],
          byCategory: [],
          byDay: [],
          entries: [],
        };
      }

      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');

      const { data: entries, error } = await supabase
        .from('workspace_time_entries')
        .select(`
          *,
          user_profiles:user_id (full_name),
          workspace_tasks:task_id (title, category)
        `)
        .eq('workspace_id', workspaceId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      const mappedEntries: TimeReportEntry[] = (entries || []).map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        userName: e.user_profiles?.full_name || 'Unknown',
        taskId: e.task_id,
        taskTitle: e.workspace_tasks?.title || null,
        date: e.date,
        hours: Number(e.hours),
        description: e.description,
        status: e.status,
        isBillable: e.is_billable ?? false,
      }));

      // Calculate totals
      const totalHours = mappedEntries.reduce((sum, e) => sum + e.hours, 0);
      const billableHours = mappedEntries.filter(e => e.isBillable).reduce((sum, e) => sum + e.hours, 0);

      // By task aggregation
      const taskMap = new Map<string, { taskTitle: string; hours: number; entries: number }>();
      mappedEntries.forEach(e => {
        if (e.taskId) {
          const existing = taskMap.get(e.taskId) || { taskTitle: e.taskTitle || 'Untitled', hours: 0, entries: 0 };
          existing.hours += e.hours;
          existing.entries += 1;
          taskMap.set(e.taskId, existing);
        }
      });
      const byTask: TimeReportByTask[] = Array.from(taskMap.entries())
        .map(([taskId, data]) => ({ taskId, ...data }))
        .sort((a, b) => b.hours - a.hours);

      // By user aggregation
      const userMap = new Map<string, { userName: string; hours: number; entries: number }>();
      mappedEntries.forEach(e => {
        const existing = userMap.get(e.userId) || { userName: e.userName, hours: 0, entries: 0 };
        existing.hours += e.hours;
        existing.entries += 1;
        userMap.set(e.userId, existing);
      });
      const byUser: TimeReportByUser[] = Array.from(userMap.entries())
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.hours - a.hours);

      // By category aggregation (from task)
      const categoryMap = new Map<string, number>();
      (entries || []).forEach((e: any) => {
        const category = e.workspace_tasks?.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(e.hours));
      });
      const byCategory: TimeReportByCategory[] = Array.from(categoryMap.entries())
        .map(([category, hours]) => ({ category, hours }))
        .sort((a, b) => b.hours - a.hours);

      // By day aggregation
      const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      const byDay: TimeReportByDay[] = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayEntries = mappedEntries.filter(e => e.date === dateStr);
        return {
          date: dateStr,
          hours: dayEntries.reduce((sum, e) => sum + e.hours, 0),
          billableHours: dayEntries.filter(e => e.isBillable).reduce((sum, e) => sum + e.hours, 0),
        };
      });

      return {
        totalHours,
        billableHours,
        entriesCount: mappedEntries.length,
        byTask,
        byUser,
        byCategory,
        byDay,
        entries: mappedEntries,
      };
    },
    enabled: !!workspaceId,
  });
}

export function useWeeklyTimeReport(workspaceId: string | undefined, weekDate: Date = new Date()) {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
  
  return useTimeReports(workspaceId, { start: weekStart, end: weekEnd });
}
