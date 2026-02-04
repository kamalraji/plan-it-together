import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  generateCSV, 
  generateExcel, 
  generatePDF, 
  generateJSON, 
  downloadBlob,
  type ExportRow,
  type ExportField 
} from '@/lib/export-utils';

interface ExportHistory {
  id: string;
  filename: string;
  format: string;
  record_count: number;
  created_at: string;
  status: 'completed' | 'processing' | 'failed';
  filters: Record<string, string>;
  fields: string[];
}

interface TicketTier {
  id: string;
  name: string;
}

interface RegistrationStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  waitlisted: number;
  checkedIn: number;
}

interface UseExportListOptions {
  eventId: string;
  workspaceId?: string;
}

export function useExportList({ eventId, workspaceId }: UseExportListOptions) {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Fetch registration statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['registration-stats', eventId],
    queryFn: async (): Promise<RegistrationStats> => {
      const { data, error } = await supabase
        .from('registrations')
        .select('status')
        .eq('event_id', eventId);

      if (error) throw error;

      const stats: RegistrationStats = {
        total: data?.length || 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        waitlisted: 0,
        checkedIn: 0,
      };

      data?.forEach(reg => {
        const status = reg.status?.toLowerCase();
        if (status === 'confirmed') stats.confirmed++;
        else if (status === 'pending') stats.pending++;
        else if (status === 'cancelled') stats.cancelled++;
        else if (status === 'waitlisted') stats.waitlisted++;
      });

      // Get check-in count
      const { count: checkedInCount } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      stats.checkedIn = checkedInCount || 0;

      return stats;
    },
    enabled: !!eventId,
  });

  // Fetch ticket tiers for filter dropdown
  const { data: ticketTiers = [] } = useQuery({
    queryKey: ['ticket-tiers', eventId],
    queryFn: async (): Promise<TicketTier[]> => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id, name')
        .eq('event_id', eventId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Fetch export history
  const { data: exportHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['export-history', eventId],
    queryFn: async (): Promise<ExportHistory[]> => {
      const { data, error } = await supabase
        .from('export_history')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        filters: (row.filters as Record<string, string>) || {},
        fields: row.fields || [],
        status: row.status as 'completed' | 'processing' | 'failed',
      }));
    },
    enabled: !!eventId,
  });

  // Fetch export data with filters
  const fetchExportData = useCallback(async (
    statusFilter: string,
    ticketFilter: string
  ): Promise<ExportRow[]> => {
    // Fetch attendees with registration data
    let query = supabase
      .from('registration_attendees')
      .select(`
        id,
        full_name,
        email,
        phone,
        custom_fields,
        is_primary,
        created_at,
        registration:registrations!inner(
          id,
          status,
          created_at,
          quantity,
          total_amount,
          ticket_tier:ticket_tiers(id, name)
        )
      `)
      .eq('registration.event_id', eventId);

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'checked_in') {
        // Special handling for checked-in filter
        const { data: checkedInIds } = await supabase
          .from('attendance_records')
          .select('registration_id')
          .eq('event_id', eventId);
        
        const registrationIds = checkedInIds?.map(r => r.registration_id) || [];
        if (registrationIds.length > 0) {
          query = query.in('registration_id', registrationIds);
        } else {
          return []; // No checked-in attendees
        }
      } else {
        query = query.eq('registration.status', statusFilter.toUpperCase());
      }
    }

    const { data: attendees, error } = await query;
    if (error) throw error;

    // Fetch check-in times
    const { data: checkIns } = await supabase
      .from('attendance_records')
      .select('registration_id, check_in_time')
      .eq('event_id', eventId);

    const checkInMap = new Map(
      checkIns?.map(c => [c.registration_id, c.check_in_time]) || []
    );

    // Transform data
    let exportData: ExportRow[] = (attendees || []).map(attendee => {
      const reg = attendee.registration as {
        id: string;
        status: string;
        created_at: string;
        quantity: number;
        total_amount: number;
        ticket_tier: { id: string; name: string } | null;
      };
      
      return {
        full_name: attendee.full_name || '',
        email: attendee.email || '',
        phone: attendee.phone || undefined,
        ticket_type: reg?.ticket_tier?.name || 'General',
        registration_date: reg?.created_at 
          ? format(new Date(reg.created_at), 'yyyy-MM-dd HH:mm')
          : '',
        status: reg?.status || 'PENDING',
        check_in_time: checkInMap.get(reg?.id) 
          ? format(new Date(checkInMap.get(reg?.id)!), 'yyyy-MM-dd HH:mm')
          : undefined,
        custom_fields: attendee.custom_fields as Record<string, unknown> || undefined,
        quantity: reg?.quantity,
        total_amount: reg?.total_amount,
      };
    });

    // Apply ticket filter (client-side for now as it's a join)
    if (ticketFilter && ticketFilter !== 'all') {
      const tier = ticketTiers.find(t => t.id === ticketFilter);
      if (tier) {
        exportData = exportData.filter(row => row.ticket_type === tier.name);
      }
    }

    return exportData;
  }, [eventId, ticketTiers]);

  // Save export to history
  const saveExportMutation = useMutation({
    mutationFn: async (exportData: {
      filename: string;
      format: string;
      record_count: number;
      filters: Record<string, string>;
      fields: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('export_history')
        .insert({
          event_id: eventId,
          workspace_id: workspaceId || null,
          user_id: userData.user.id,
          filename: exportData.filename,
          format: exportData.format,
          record_count: exportData.record_count,
          filters: exportData.filters,
          fields: exportData.fields,
          status: 'completed',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history', eventId] });
    },
  });

  // Main export function
  const exportData = useCallback(async (
    selectedFormat: string,
    selectedFields: ExportField[],
    statusFilter: string,
    ticketFilter: string,
    eventName: string
  ) => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      // Fetch data
      setExportProgress(30);
      const data = await fetchExportData(statusFilter, ticketFilter);
      
      if (data.length === 0) {
        toast.warning('No records found', {
          description: 'No data matches the selected filters',
        });
        setIsExporting(false);
        setExportProgress(0);
        return;
      }

      setExportProgress(60);

      // Generate file
      let blob: Blob;
      switch (selectedFormat) {
        case 'csv':
          blob = generateCSV(data, selectedFields);
          break;
        case 'xlsx':
          blob = generateExcel(data, selectedFields);
          break;
        case 'pdf':
          blob = generatePDF(data, selectedFields, eventName);
          break;
        case 'json':
          blob = generateJSON(data, selectedFields);
          break;
        default:
          blob = generateCSV(data, selectedFields);
      }

      setExportProgress(80);

      // Generate filename
      const datePart = format(new Date(), 'yyyy-MM-dd');
      let filename = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
      if (statusFilter !== 'all') filename += `_${statusFilter}`;
      if (ticketFilter !== 'all') {
        const tier = ticketTiers.find(t => t.id === ticketFilter);
        if (tier) filename += `_${tier.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      }
      filename += `_${datePart}.${selectedFormat}`;

      // Download
      downloadBlob(blob, filename);

      setExportProgress(90);

      // Save to history
      await saveExportMutation.mutateAsync({
        filename,
        format: selectedFormat,
        record_count: data.length,
        filters: { status: statusFilter, ticket: ticketFilter },
        fields: selectedFields,
      });

      setExportProgress(100);

      toast.success('Export completed!', {
        description: `${filename} (${data.length} records)`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [fetchExportData, ticketTiers, saveExportMutation]);

  return {
    stats: stats || { total: 0, confirmed: 0, pending: 0, cancelled: 0, waitlisted: 0, checkedIn: 0 },
    ticketTiers,
    exportHistory,
    isLoadingStats,
    isLoadingHistory,
    isExporting,
    exportProgress,
    exportData,
  };
}
