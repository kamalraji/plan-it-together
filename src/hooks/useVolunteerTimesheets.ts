/**
 * Volunteer Timesheets Hook - Database-backed timesheet management
 * Replaces mock data in ApproveTimesheetsTab and HoursReportTab components
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type TimesheetStatus = 'pending' | 'approved' | 'rejected';

export interface VolunteerTimesheet {
  id: string;
  eventId: string;
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  shiftId: string | null;
  shiftName: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  hoursLogged: number;
  status: TimesheetStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ApproveTimesheetInput {
  timesheetId: string;
  approved: boolean;
  notes?: string;
}

// ============================================
// Helper Functions
// ============================================

function mapTimesheetFromDb(row: Record<string, unknown>): VolunteerTimesheet {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    volunteerId: row.volunteer_id as string,
    volunteerName: (row.volunteer_name as string) || 'Unknown Volunteer',
    volunteerEmail: (row.volunteer_email as string) || '',
    shiftId: row.shift_id as string | null,
    shiftName: (row.shift_name as string) || null,
    checkInTime: row.check_in_time as string,
    checkOutTime: row.check_out_time as string | null,
    hoursLogged: Number(row.hours_logged) || 0,
    status: (row.status as TimesheetStatus) || 'pending',
    approvedBy: row.approved_by as string | null,
    approvedAt: row.approved_at as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
  };
}

// ============================================
// Main Hook
// ============================================

/**
 * Hook for managing volunteer timesheets and approvals
 */
export function useVolunteerTimesheets(workspaceId: string, eventId?: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.volunteerTimeLogs(workspaceId);

  // Fetch timesheets with volunteer profile info
  const {
    data: timesheets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [...queryKey, eventId],
    queryFn: async (): Promise<VolunteerTimesheet[]> => {
      if (!workspaceId) return [];

      // Get the event_id from workspace if not provided
      let targetEventId = eventId;
      if (!targetEventId) {
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('event_id')
          .eq('id', workspaceId)
          .single();
        targetEventId = workspace?.event_id;
      }

      if (!targetEventId) return [];

      // Fetch time logs with volunteer profile data
      const { data, error } = await supabase
        .from('volunteer_time_logs')
        .select(`
          id,
          event_id,
          volunteer_id,
          shift_id,
          check_in_time,
          check_out_time,
          hours_logged,
          status,
          approved_by,
          approved_at,
          notes,
          created_at
        `)
        .eq('event_id', targetEventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get volunteer profile info
      const volunteerIds = [...new Set((data || []).map(d => d.volunteer_id))];
      
      let profileMap: Record<string, { name: string; email: string }> = {};
      if (volunteerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', volunteerIds);
        
        profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = {
            name: p.full_name || 'Volunteer',
            email: p.email || '',
          };
          return acc;
        }, {} as Record<string, { name: string; email: string }>);
      }

      // Get shift names if available
      const shiftIds = (data || []).map(d => d.shift_id).filter((id): id is string => id !== null);
      let shiftMap: Record<string, string> = {};
      if (shiftIds.length > 0) {
        const { data: tasks } = await supabase
          .from('workspace_tasks')
          .select('id, title')
          .in('id', shiftIds);
        
        shiftMap = (tasks || []).reduce((acc, t) => {
          acc[t.id] = t.title;
          return acc;
        }, {} as Record<string, string>);
      }

      return (data || []).map(row => ({
        ...mapTimesheetFromDb(row),
        volunteerName: profileMap[row.volunteer_id]?.name || 'Unknown Volunteer',
        volunteerEmail: profileMap[row.volunteer_id]?.email || '',
        shiftName: row.shift_id ? shiftMap[row.shift_id] || null : null,
      }));
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });

  // Approve/reject timesheet mutation
  const processTimesheet = useMutation({
    mutationFn: async ({ timesheetId, approved, notes }: ApproveTimesheetInput) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('volunteer_time_logs')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_by: userData?.user?.id,
          approved_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', timesheetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ timesheetId, approved }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<VolunteerTimesheet[]>(queryKey);

      queryClient.setQueryData(
        queryKey,
        previous?.map((t) =>
          t.id === timesheetId
            ? {
                ...t,
                status: approved ? ('approved' as const) : ('rejected' as const),
                approvedAt: new Date().toISOString(),
              }
            : t
        )
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to process timesheet: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? 'Timesheet approved' : 'Timesheet rejected');
    },
  });

  // Bulk approve timesheets
  const bulkApprove = useMutation({
    mutationFn: async (timesheetIds: string[]) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('volunteer_time_logs')
        .update({
          status: 'approved',
          approved_by: userData?.user?.id,
          approved_at: new Date().toISOString(),
        })
        .in('id', timesheetIds);

      if (error) throw error;
    },
    onMutate: async (timesheetIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<VolunteerTimesheet[]>(queryKey);

      queryClient.setQueryData(
        queryKey,
        previous?.map((t) =>
          timesheetIds.includes(t.id)
            ? {
                ...t,
                status: 'approved' as const,
                approvedAt: new Date().toISOString(),
              }
            : t
        )
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to approve timesheets: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.length} timesheet${ids.length > 1 ? 's' : ''} approved`);
    },
  });

  // Filter helpers
  const pendingTimesheets = timesheets.filter((t) => t.status === 'pending');
  const approvedTimesheets = timesheets.filter((t) => t.status === 'approved');
  const rejectedTimesheets = timesheets.filter((t) => t.status === 'rejected');

  // Calculate total hours
  const totalHours = timesheets.reduce((sum, t) => sum + t.hoursLogged, 0);
  const approvedHours = approvedTimesheets.reduce((sum, t) => sum + t.hoursLogged, 0);
  const pendingHours = pendingTimesheets.reduce((sum, t) => sum + t.hoursLogged, 0);

  return {
    timesheets,
    isLoading,
    error,
    processTimesheet,
    bulkApprove,
    // Filtered lists
    pendingTimesheets,
    approvedTimesheets,
    rejectedTimesheets,
    // Stats
    stats: {
      total: timesheets.length,
      pending: pendingTimesheets.length,
      approved: approvedTimesheets.length,
      rejected: rejectedTimesheets.length,
      totalHours,
      approvedHours,
      pendingHours,
    },
  };
}

/**
 * Hook for hours report with aggregated volunteer data
 */
export function useVolunteerHoursReport(workspaceId: string, dateRange?: { start: Date; end: Date }) {
  const { timesheets, isLoading } = useVolunteerTimesheets(workspaceId);

  // Filter by date range if provided
  const filteredTimesheets = dateRange
    ? timesheets.filter((t) => {
        const checkIn = new Date(t.checkInTime);
        return checkIn >= dateRange.start && checkIn <= dateRange.end;
      })
    : timesheets;

  // Group by volunteer
  const volunteerHoursMap = new Map<string, {
    id: string;
    name: string;
    totalHours: number;
    shiftsCompleted: number;
  }>();

  filteredTimesheets
    .filter((t) => t.status === 'approved')
    .forEach((t) => {
      const existing = volunteerHoursMap.get(t.volunteerId);
      if (existing) {
        existing.totalHours += t.hoursLogged;
        existing.shiftsCompleted += 1;
      } else {
        volunteerHoursMap.set(t.volunteerId, {
          id: t.volunteerId,
          name: t.volunteerName,
          totalHours: t.hoursLogged,
          shiftsCompleted: 1,
        });
      }
    });

  // Sort by total hours and assign ranks
  const volunteerHours = Array.from(volunteerHoursMap.values())
    .sort((a, b) => b.totalHours - a.totalHours)
    .map((v, index) => ({
      ...v,
      rank: index + 1,
      avgHoursPerShift: v.shiftsCompleted > 0 ? v.totalHours / v.shiftsCompleted : 0,
    }));

  // Calculate totals
  const totalHours = volunteerHours.reduce((sum, v) => sum + v.totalHours, 0);
  const totalShifts = volunteerHours.reduce((sum, v) => sum + v.shiftsCompleted, 0);
  const avgHoursPerVolunteer = volunteerHours.length > 0 ? totalHours / volunteerHours.length : 0;

  return {
    volunteerHours,
    isLoading,
    stats: {
      totalHours,
      totalShifts,
      avgHoursPerVolunteer,
      activeVolunteers: volunteerHours.length,
    },
  };
}
