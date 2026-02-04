import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Shift {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredVolunteers: number;
  assignedVolunteers: number;
  location: string;
  description?: string;
}

export interface ShiftFormData {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredVolunteers: number;
  location?: string;
  description?: string;
}

export interface VolunteerAssignment {
  id: string;
  shiftId: string;
  userId: string;
  userName: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  hoursLogged?: number;
}

export function useVolunteerShifts(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch all shifts with assignment counts
  const shiftsQuery = useQuery({
    queryKey: ['volunteer-shifts', workspaceId],
    queryFn: async (): Promise<Shift[]> => {
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('volunteer_shifts')
        .select('id, name, date, start_time, end_time, location, required_volunteers, description')
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (shiftsError) throw shiftsError;
      if (!shiftsData?.length) return [];

      const shiftIds = shiftsData.map(s => s.id);
      const { data: assignmentsData } = await supabase
        .from('volunteer_assignments')
        .select('shift_id')
        .in('shift_id', shiftIds)
        .neq('status', 'CANCELLED');

      const assignmentCounts = (assignmentsData || []).reduce((acc, a) => {
        acc[a.shift_id] = (acc[a.shift_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return shiftsData.map(shift => ({
        id: shift.id,
        name: shift.name,
        date: shift.date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        location: shift.location || '',
        description: shift.description || '',
        requiredVolunteers: shift.required_volunteers,
        assignedVolunteers: assignmentCounts[shift.id] || 0,
      }));
    },
    enabled: !!workspaceId,
  });

  // Create shift
  const createShift = useMutation({
    mutationFn: async (data: ShiftFormData) => {
      const { error } = await supabase
        .from('volunteer_shifts')
        .insert({
          workspace_id: workspaceId,
          name: data.name,
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          required_volunteers: data.requiredVolunteers,
          location: data.location || null,
          description: data.description || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shift created successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to create shift');
    },
  });

  // Update shift
  const updateShift = useMutation({
    mutationFn: async ({ shiftId, data }: { shiftId: string; data: ShiftFormData }) => {
      const { error } = await supabase
        .from('volunteer_shifts')
        .update({
          name: data.name,
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          required_volunteers: data.requiredVolunteers,
          location: data.location || null,
          description: data.description || null,
        })
        .eq('id', shiftId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shift updated successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to update shift');
    },
  });

  // Delete shift
  const deleteShift = useMutation({
    mutationFn: async (shiftId: string) => {
      // First delete all assignments
      await supabase
        .from('volunteer_assignments')
        .delete()
        .eq('shift_id', shiftId);

      const { error } = await supabase
        .from('volunteer_shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shift deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to delete shift');
    },
  });

  // Assign volunteers to shift
  const assignVolunteers = useMutation({
    mutationFn: async ({ shiftId, userIds }: { shiftId: string; userIds: string[] }) => {
      const assignments = userIds.map(userId => ({
        shift_id: shiftId,
        user_id: userId,
        status: 'CONFIRMED',
      }));

      const { error } = await supabase
        .from('volunteer_assignments')
        .upsert(assignments, { onConflict: 'shift_id,user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Volunteers assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-roster', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to assign volunteers');
    },
  });

  // Unassign volunteer from shift
  const unassignVolunteer = useMutation({
    mutationFn: async ({ shiftId, userId }: { shiftId: string; userId: string }) => {
      const { error } = await supabase
        .from('volunteer_assignments')
        .update({ status: 'CANCELLED' })
        .eq('shift_id', shiftId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Volunteer unassigned');
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-roster', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to unassign volunteer');
    },
  });

  // Check in volunteer
  const checkInVolunteer = useMutation({
    mutationFn: async ({ shiftId, userId }: { shiftId: string; userId: string }) => {
      const { error } = await supabase
        .from('volunteer_assignments')
        .update({ 
          status: 'CHECKED_IN',
          check_in_time: new Date().toISOString(),
        })
        .eq('shift_id', shiftId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Checked in successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to check in');
    },
  });

  // Check out volunteer
  const checkOutVolunteer = useMutation({
    mutationFn: async ({ shiftId, userId }: { shiftId: string; userId: string }) => {
      const { error } = await supabase
        .from('volunteer_assignments')
        .update({ 
          status: 'COMPLETED',
          check_out_time: new Date().toISOString(),
        })
        .eq('shift_id', shiftId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Checked out successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteer-shifts', workspaceId] });
    },
    onError: (_error) => {
      toast.error('Failed to check out');
    },
  });

  // Fetch shift assignments
  const getShiftAssignments = async (shiftId: string): Promise<VolunteerAssignment[]> => {
    const { data: assignments, error } = await supabase
      .from('volunteer_assignments')
      .select('id, shift_id, user_id, status, check_in_time, check_out_time, hours_logged')
      .eq('shift_id', shiftId)
      .neq('status', 'CANCELLED');

    if (error) throw error;
    if (!assignments?.length) return [];

    const userIds = assignments.map(a => a.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

    return assignments.map(a => ({
      id: a.id,
      shiftId: a.shift_id,
      userId: a.user_id,
      userName: profileMap.get(a.user_id) || 'Unknown',
      status: a.status,
      checkInTime: a.check_in_time || undefined,
      checkOutTime: a.check_out_time || undefined,
      hoursLogged: a.hours_logged || undefined,
    }));
  };

  return {
    shifts: shiftsQuery.data || [],
    isLoading: shiftsQuery.isLoading,
    createShift,
    updateShift,
    deleteShift,
    assignVolunteers,
    unassignVolunteer,
    checkInVolunteer,
    checkOutVolunteer,
    getShiftAssignments,
  };
}
