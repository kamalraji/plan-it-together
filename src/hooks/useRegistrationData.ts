import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type RegistrationStatus = Database['public']['Enums']['registration_status'];

// Types for registration data
export interface RegistrationStats {
  totalRegistered: number;
  checkedIn: number;
  pending: number;
  waitlisted: number;
  cancelled: number;
  capacityLimit: number;
  registrationTrend: number;
  checkInRate: number;
  availableSpots: number;
}

export interface RegistrationAttendee {
  id: string;
  registrationId: string;
  fullName: string;
  email: string;
  phone: string | null;
  ticketTierId: string | null;
  ticketTierName: string | null;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'WAITLISTED';
  registeredAt: Date;
  checkInTime: Date | null;
  isCheckedIn: boolean;
}

export interface WaitlistEntryData {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  position: number;
  joinedAt: Date;
  priority: 'normal' | 'high' | 'vip';
}

// Query key factory for registrations
export const registrationKeys = {
  all: ['registrations'] as const,
  stats: (eventId: string) => [...registrationKeys.all, 'stats', eventId] as const,
  attendees: (eventId: string) => [...registrationKeys.all, 'attendees', eventId] as const,
  waitlist: (eventId: string) => [...registrationKeys.all, 'waitlist', eventId] as const,
  byWorkspace: (workspaceId: string) => [...registrationKeys.all, 'workspace', workspaceId] as const,
};

/**
 * Hook to fetch registration statistics for an event
 */
export function useRegistrationStats(eventId: string | null) {
  return useQuery({
    queryKey: eventId ? registrationKeys.stats(eventId) : ['registrations', 'stats', 'null'],
    queryFn: async (): Promise<RegistrationStats> => {
      if (!eventId) {
        return getEmptyStats();
      }

      // Fetch all registrations for stats calculation
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('id, status, created_at')
        .eq('event_id', eventId);

      if (error) throw error;

      const regs = registrations || [];
      
      // Get attendance records for check-in count
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('id, registration_id')
        .eq('event_id', eventId);
      
      if (attendanceError) throw attendanceError;
      
      const checkedInIds = new Set((attendance || []).map(a => a.registration_id));

      // Get event capacity from ticket tiers
      const { data: ticketTiers, error: tierError } = await supabase
        .from('ticket_tiers')
        .select('quantity')
        .eq('event_id', eventId);

      if (tierError) throw tierError;

      const capacityLimit = (ticketTiers || []).reduce((sum, tier) => sum + (tier.quantity || 9999), 0);

      // Calculate stats
      const totalRegistered = regs.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING').length;
      const confirmed = regs.filter(r => r.status === 'CONFIRMED').length;
      const pending = regs.filter(r => r.status === 'PENDING').length;
      const cancelled = regs.filter(r => r.status === 'CANCELLED').length;
      const checkedIn = regs.filter(r => checkedInIds.has(r.id)).length;

      // Get waitlist count from event_waitlist table
      const { count: waitlistedCount } = await supabase
        .from('event_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'waiting');

      // Calculate weekly trend
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const thisWeekRegs = regs.filter(r => new Date(r.created_at) >= oneWeekAgo).length;
      const lastWeekRegs = regs.filter(r => {
        const date = new Date(r.created_at);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      }).length;

      const registrationTrend = lastWeekRegs > 0 
        ? Math.round(((thisWeekRegs - lastWeekRegs) / lastWeekRegs) * 100) 
        : thisWeekRegs > 0 ? 100 : 0;

      const checkInRate = confirmed > 0 ? Math.round((checkedIn / confirmed) * 1000) / 10 : 0;

      return {
        totalRegistered,
        checkedIn,
        pending,
        waitlisted: waitlistedCount || 0,
        cancelled,
        capacityLimit: Math.min(capacityLimit, 99999),
        registrationTrend,
        checkInRate,
        availableSpots: Math.max(0, capacityLimit - totalRegistered),
      };
    },
    ...queryPresets.dynamic,
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch attendee list with filtering and pagination
 */
export function useRegistrationAttendees(eventId: string | null, options?: {
  search?: string;
  status?: string;
  ticketType?: string;
  limit?: number;
  offset?: number;
}) {
  const { search = '', status = 'All', ticketType = 'All', limit = 50, offset = 0 } = options || {};

  return useQuery({
    queryKey: eventId 
      ? [...registrationKeys.attendees(eventId), { search, status, ticketType, limit, offset }] 
      : ['registrations', 'attendees', 'null'],
    queryFn: async (): Promise<{ attendees: RegistrationAttendee[]; total: number }> => {
      if (!eventId) {
        return { attendees: [], total: 0 };
      }

      // Build query for registration_attendees with join
      let query = supabase
        .from('registration_attendees')
        .select(`
          id,
          registration_id,
          full_name,
          email,
          phone,
          ticket_tier_id,
          created_at,
          ticket_tiers (name),
          registrations!inner (
            id,
            event_id,
            status,
            created_at
          )
        `, { count: 'exact' })
        .eq('registrations.event_id', eventId);

      // Apply status filter
      if (status !== 'All') {
        if (status === 'checked_in') {
          // Need to check attendance_records separately
        } else {
          const statusMap: Record<string, RegistrationStatus> = {
            confirmed: 'CONFIRMED',
            pending: 'PENDING',
            cancelled: 'CANCELLED',
            waitlisted: 'WAITLISTED',
          };
          if (statusMap[status]) {
            query = query.eq('registrations.status', statusMap[status]);
          }
        }
      }

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Get check-in records
      const { data: checkIns } = await supabase
        .from('attendance_records')
        .select('registration_id, check_in_time')
        .eq('event_id', eventId);

      const checkInMap = new Map((checkIns || []).map(c => [c.registration_id, c.check_in_time]));

      const attendees: RegistrationAttendee[] = (data || []).map((row: any) => {
        const checkInTime = checkInMap.get(row.registration_id);
        const registration = row.registrations;
        
        return {
          id: row.id,
          registrationId: row.registration_id,
          fullName: row.full_name,
          email: row.email,
          phone: row.phone,
          ticketTierId: row.ticket_tier_id,
          ticketTierName: row.ticket_tiers?.name || null,
          status: registration?.status || 'PENDING',
          registeredAt: new Date(registration?.created_at || row.created_at),
          checkInTime: checkInTime ? new Date(checkInTime) : null,
          isCheckedIn: !!checkInTime,
        };
      });

      // Filter checked-in if that status was requested
      const filteredAttendees = status === 'checked_in' 
        ? attendees.filter(a => a.isCheckedIn)
        : attendees;

      return { 
        attendees: filteredAttendees, 
        total: count || 0 
      };
    },
    ...queryPresets.dynamic,
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch waitlist entries for an event
 */
export function useRegistrationWaitlist(eventId: string | null) {
  return useQuery({
    queryKey: eventId ? registrationKeys.waitlist(eventId) : ['registrations', 'waitlist', 'null'],
    queryFn: async (): Promise<{ entries: WaitlistEntryData[]; availableSpots: number }> => {
      if (!eventId) {
        return { entries: [], availableSpots: 0 };
      }

      // Fetch waitlist entries
      const { data, error } = await supabase
        .from('event_waitlist')
        .select(`
          id,
          full_name,
          email,
          ticket_tier_id,
          position,
          priority,
          created_at,
          ticket_tiers (name)
        `)
        .eq('event_id', eventId)
        .eq('status', 'waiting')
        .order('position', { ascending: true });

      if (error) throw error;

      // Get available spots
      const { data: tiers } = await supabase
        .from('ticket_tiers')
        .select('quantity, sold_count')
        .eq('event_id', eventId)
        .eq('is_active', true);

      const availableSpots = (tiers || []).reduce((sum, tier) => {
        const available = (tier.quantity || 9999) - (tier.sold_count || 0);
        return sum + Math.max(0, available);
      }, 0);

      const entries: WaitlistEntryData[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.full_name,
        email: row.email,
        ticketType: row.ticket_tiers?.name || 'General',
        position: row.position,
        joinedAt: new Date(row.created_at),
        priority: row.priority as 'normal' | 'high' | 'vip',
      }));

      return { entries, availableSpots };
    },
    ...queryPresets.dynamic,
    enabled: !!eventId,
  });
}

/**
 * Hook for waitlist mutations with optimistic updates
 */
export function useWaitlistMutations(eventId: string) {
  const queryClient = useQueryClient();
  const waitlistKey = registrationKeys.waitlist(eventId);

  const promoteEntry = useMutation({
    mutationFn: async ({ entryId }: { entryId: string; entry: WaitlistEntryData }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in');

      // Get the entry details
      const { data: entry, error: fetchError } = await supabase
        .from('event_waitlist')
        .select('*, ticket_tiers(name)')
        .eq('id', entryId)
        .single();

      if (fetchError) throw fetchError;

      // Create registration
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          ticket_tier_id: entry.ticket_tier_id,
          status: 'CONFIRMED' as RegistrationStatus,
          quantity: 1,
          form_responses: {
            promoted_from_waitlist: true,
            waitlist_entry_id: entryId,
          },
        })
        .select('id')
        .single();

      if (regError) throw regError;

      // Create attendee record
      await supabase.from('registration_attendees').insert({
        registration_id: registration.id,
        full_name: entry.full_name,
        email: entry.email,
        phone: entry.phone,
        ticket_tier_id: entry.ticket_tier_id,
        is_primary: true,
      });

      // Update waitlist entry
      const { error: updateError } = await supabase
        .from('event_waitlist')
        .update({
          status: 'promoted',
          promoted_at: new Date().toISOString(),
          registration_id: registration.id,
        })
        .eq('id', entryId);

      if (updateError) throw updateError;

      return entry;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: waitlistKey });
      const previousData = queryClient.getQueryData<{ entries: WaitlistEntryData[]; availableSpots: number }>(waitlistKey);
      
      if (previousData) {
        queryClient.setQueryData(waitlistKey, {
          ...previousData,
          entries: previousData.entries.filter(e => e.id !== variables.entryId),
        });
      }
      
      return { previousData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(waitlistKey, context.previousData);
      }
      toast.error('Failed to promote attendee', { description: error.message });
    },
    onSuccess: () => {
      toast.success('Attendee promoted successfully!');
      queryClient.invalidateQueries({ queryKey: registrationKeys.stats(eventId) });
      queryClient.invalidateQueries({ queryKey: registrationKeys.attendees(eventId) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: waitlistKey });
    },
  });

  const removeEntry = useMutation({
    mutationFn: async ({ entryId }: { entryId: string }) => {
      const { error } = await supabase
        .from('event_waitlist')
        .update({ status: 'removed' })
        .eq('id', entryId);

      if (error) throw error;
      return { id: entryId };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: waitlistKey });
      const previousData = queryClient.getQueryData<{ entries: WaitlistEntryData[]; availableSpots: number }>(waitlistKey);
      
      if (previousData) {
        queryClient.setQueryData(waitlistKey, {
          ...previousData,
          entries: previousData.entries.filter(e => e.id !== variables.entryId),
        });
      }
      
      return { previousData };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(waitlistKey, context.previousData);
      }
      toast.error('Failed to remove entry', { description: error.message });
    },
    onSuccess: () => {
      toast.success('Removed from waitlist');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: waitlistKey });
    },
  });

  const moveUp = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.rpc('reorder_waitlist_positions', {
        p_event_id: eventId,
        p_entry_id: entryId,
        p_new_position: -1, // -1 means move up one
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waitlistKey });
    },
    onError: () => {
      toast.error('Failed to reorder waitlist');
    },
  });

  const moveDown = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.rpc('reorder_waitlist_positions', {
        p_event_id: eventId,
        p_entry_id: entryId,
        p_new_position: 1, // 1 means move down one
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waitlistKey });
    },
    onError: () => {
      toast.error('Failed to reorder waitlist');
    },
  });

  return {
    promoteEntry,
    removeEntry,
    moveUp,
    moveDown,
  };
}

/**
 * Hook to check-in an attendee
 */
export function useCheckInMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in');

      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          event_id: eventId,
          registration_id: registrationId,
          user_id: user.id,
          check_in_method: 'manual',
          check_in_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Attendee checked in!');
      queryClient.invalidateQueries({ queryKey: registrationKeys.attendees(eventId) });
      queryClient.invalidateQueries({ queryKey: registrationKeys.stats(eventId) });
    },
    onError: (error: Error) => {
      toast.error('Check-in failed', { description: error.message });
    },
  });
}

// Helper function for empty stats
function getEmptyStats(): RegistrationStats {
  return {
    totalRegistered: 0,
    checkedIn: 0,
    pending: 0,
    waitlisted: 0,
    cancelled: 0,
    capacityLimit: 0,
    registrationTrend: 0,
    checkInRate: 0,
    availableSpots: 0,
  };
}

/**
 * Get eventId from workspaceId - helper hook
 */
export function useEventIdFromWorkspace(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceId ? ['workspace-event-id', workspaceId] : ['workspace-event-id', 'null'],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from('workspaces')
        .select('event_id')
        .eq('id', workspaceId)
        .single();

      if (error) return null;
      return data?.event_id || null;
    },
    ...queryPresets.static,
    enabled: !!workspaceId,
  });
}
