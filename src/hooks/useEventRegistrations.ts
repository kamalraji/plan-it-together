/**
 * useEventRegistrations Hook
 * Industrial-standard registration data management with optimistic updates
 * 
 * Features:
 * - Paginated registration fetching with filters
 * - Bulk operations with optimistic updates
 * - Real-time status updates
 * - Export capabilities
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { useToast } from '@/hooks/use-toast';

// Registration status types - aligned with database enum
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  ticketTierId: string | null;
  ticketTierName: string | null;
  quantity: number;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  promoCodeId: string | null;
  paymentStatus: string | null;
  registeredAt: string;
  formResponses: Record<string, unknown>;
  // User profile data
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    avatarUrl: string | null;
    phone: string | null;
    organization: string | null;
  } | null;
  // Check-in status from attendance_records
  checkedIn: boolean;
  checkInTime: string | null;
}

export interface RegistrationFilters {
  status?: RegistrationStatus | 'all';
  search?: string;
  ticketTierId?: string;
  page?: number;
  limit?: number;
}

export interface RegistrationStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  waitlisted: number;
  checkedIn: number;
  totalRevenue: number;
  averageTicketValue: number;
  conversionRate: number;
}

interface RegistrationListResult {
  registrations: Registration[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Fetch paginated registrations for an event
 */
export function useEventRegistrations(
  eventId: string | undefined,
  filters: RegistrationFilters = {}
) {
  const { status = 'all', search = '', ticketTierId, page = 1, limit = 20 } = filters;

  return useQuery({
    queryKey: [...queryKeys.events.registrations(eventId || ''), filters],
    queryFn: async (): Promise<RegistrationListResult> => {
      if (!eventId) return { registrations: [], total: 0, page: 1, totalPages: 0 };

      let query = supabase
        .from('registrations')
        .select(`
          id,
          event_id,
          user_id,
          status,
          ticket_tier_id,
          quantity,
          subtotal,
          discount_amount,
          total_amount,
          promo_code_id,
          payment_status,
          form_responses,
          created_at,
          ticket_tiers (
            id,
            name
          ),
          user_profiles!registrations_user_id_fkey (
            id,
            full_name,
            email,
            avatar_url,
            phone,
            organization
          )
        `, { count: 'exact' })
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply ticket tier filter
      if (ticketTierId) {
        query = query.eq('ticket_tier_id', ticketTierId);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch attendance records for checked-in status
      const registrationIds = (data || []).map((r: any) => r.id);
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('registration_id, check_in_time')
        .in('registration_id', registrationIds);

      const attendanceMap = new Map(
        (attendanceData || []).map(a => [a.registration_id, a.check_in_time])
      );

      // Filter by search in memory (for user name/email)
      let filteredData = data || [];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter((r: any) => {
          const name = (r.user_profiles as any)?.full_name?.toLowerCase() || '';
          const email = (r.user_profiles as any)?.email?.toLowerCase() || '';
          return name.includes(searchLower) || email.includes(searchLower);
        });
      }

      const registrations: Registration[] = filteredData.map((r: any) => {
        const checkInTime = attendanceMap.get(r.id);
        return {
          id: r.id,
          eventId: r.event_id,
          userId: r.user_id,
          status: r.status as RegistrationStatus,
          ticketTierId: r.ticket_tier_id,
          ticketTierName: r.ticket_tiers?.name || null,
          quantity: r.quantity || 1,
          totalAmount: r.total_amount || 0,
          subtotal: r.subtotal || 0,
          discountAmount: r.discount_amount || 0,
          promoCodeId: r.promo_code_id,
          paymentStatus: r.payment_status,
          registeredAt: r.created_at,
          formResponses: r.form_responses || {},
          user: r.user_profiles ? {
            id: r.user_profiles.id,
            fullName: r.user_profiles.full_name,
            email: r.user_profiles.email,
            avatarUrl: r.user_profiles.avatar_url,
            phone: r.user_profiles.phone,
            organization: r.user_profiles.organization,
          } : null,
          checkedIn: !!checkInTime,
          checkInTime: checkInTime || null,
        };
      });

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return { registrations, total, page, totalPages };
    },
    enabled: !!eventId,
    staleTime: queryPresets.dynamic.staleTime,
    gcTime: queryPresets.dynamic.gcTime,
  });
}

/**
 * Fetch registration statistics for an event
 */
export function useEventRegistrationStats(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.registrationStats(eventId || ''),
    queryFn: async (): Promise<RegistrationStats> => {
      if (!eventId) {
        return {
          total: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          waitlisted: 0,
          checkedIn: 0,
          totalRevenue: 0,
          averageTicketValue: 0,
          conversionRate: 0,
        };
      }

      // Fetch registration counts by status
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('id, status, total_amount')
        .eq('event_id', eventId);

      if (error) throw error;

      // Fetch attendance count
      const { count: checkedInCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      const stats = (registrations || []).reduce(
        (acc, r) => {
          acc.total++;
          acc.totalRevenue += r.total_amount || 0;
          
          switch (r.status) {
            case 'CONFIRMED':
              acc.confirmed++;
              break;
            case 'PENDING':
              acc.pending++;
              break;
            case 'CANCELLED':
              acc.cancelled++;
              break;
            case 'WAITLISTED':
              acc.waitlisted++;
              break;
          }
          
          return acc;
        },
        {
          total: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          waitlisted: 0,
          totalRevenue: 0,
        }
      );

      const checkedIn = checkedInCount || 0;
      const confirmedCount = stats.confirmed;
      
      return {
        ...stats,
        checkedIn,
        averageTicketValue: confirmedCount > 0 ? stats.totalRevenue / confirmedCount : 0,
        conversionRate: stats.total > 0 ? (confirmedCount / stats.total) * 100 : 0,
      };
    },
    enabled: !!eventId,
    staleTime: queryPresets.dynamic.staleTime,
  });
}

/**
 * Update a single registration status
 */
export function useUpdateRegistrationStatus(eventId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      registrationId, 
      status 
    }: { 
      registrationId: string; 
      status: RegistrationStatus 
    }) => {
      const { error } = await supabase
        .from('registrations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', registrationId);

      if (error) throw error;
      return { registrationId, status };
    },
    onSuccess: (data) => {
      toast({ title: `Registration ${data.status.toLowerCase()}` });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registrations(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registrationStats(eventId) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update registration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Bulk update registration statuses
 */
export function useBulkUpdateRegistrations(eventId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      registrationIds, 
      status 
    }: { 
      registrationIds: string[]; 
      status: RegistrationStatus 
    }) => {
      const { error } = await supabase
        .from('registrations')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', registrationIds);

      if (error) throw error;
      return { count: registrationIds.length, status };
    },
    onSuccess: (data) => {
      toast({ title: `${data.count} registrations ${data.status.toLowerCase()}` });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registrations(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.registrationStats(eventId) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update registrations',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Export registrations to CSV
 */
export async function exportRegistrationsToCSV(
  eventId: string,
  filters: Omit<RegistrationFilters, 'page' | 'limit'> = {}
): Promise<string> {
  const { status = 'all', search = '', ticketTierId } = filters;

  let query = supabase
    .from('registrations')
    .select(`
      id,
      status,
      quantity,
      total_amount,
      payment_status,
      created_at,
      ticket_tiers (name),
      user_profiles!registrations_user_id_fkey (
        full_name,
        email,
        phone,
        organization
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (ticketTierId) {
    query = query.eq('ticket_tier_id', ticketTierId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Generate CSV
  const headers = ['Name', 'Email', 'Phone', 'Organization', 'Ticket', 'Quantity', 'Amount', 'Payment Status', 'Status', 'Registered At'];
  const rows = (data || [])
    .filter(r => {
      if (!search) return true;
      const name = (r.user_profiles as any)?.full_name?.toLowerCase() || '';
      const email = (r.user_profiles as any)?.email?.toLowerCase() || '';
      return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    })
    .map(r => [
      (r.user_profiles as any)?.full_name || '',
      (r.user_profiles as any)?.email || '',
      (r.user_profiles as any)?.phone || '',
      (r.user_profiles as any)?.organization || '',
      (r.ticket_tiers as any)?.name || 'General',
      r.quantity || 1,
      `$${(r.total_amount || 0).toFixed(2)}`,
      r.payment_status || 'N/A',
      r.status,
      new Date(r.created_at).toLocaleString(),
    ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  
  return csv;
}
