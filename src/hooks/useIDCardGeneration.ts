import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AttendeeForCard {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  organization?: string;
  ticket_type: string;
  ticket_tier_id?: string;
  registration_id: string;
  photo_url?: string;
  status: string;
  checked_in: boolean;
  custom_fields?: Record<string, unknown>;
}

export interface PrintJob {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  template_id: string;
  template_name?: string;
  total_cards: number;
  generated_cards: number;
  pdf_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface GenerateParams {
  templateId: string;
  templateName: string;
  attendeeIds?: string[];
  filter?: {
    status?: 'confirmed' | 'checked_in' | 'not_checked_in' | 'all';
    ticketTierId?: string;
  };
  options: {
    cardsPerPage: 1 | 2 | 4 | 8 | 9;
    pageSize: 'a4' | 'letter';
    includeCutMarks: boolean;
  };
}

export interface GenerationProgress {
  current: number;
  total: number;
  status: 'idle' | 'preparing' | 'generating' | 'composing' | 'complete' | 'error';
  message?: string;
}

export interface AttendeeStats {
  total: number;
  confirmed: number;
  checkedIn: number;
  notCheckedIn: number;
  byTicketType: Record<string, number>;
}

export function useIDCardGeneration(workspaceId: string | undefined, eventId: string | undefined) {
  const queryClient = useQueryClient();
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    status: 'idle',
  });

  // Fetch attendees for card generation
  const attendeesQuery = useQuery({
    queryKey: ['id-card-attendees', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      // Fetch registrations with attendee info
      const { data: registrations, error: regError } = await supabase
        .from('registrations')
        .select(`
          id,
          status,
          ticket_tier_id,
          ticket_tiers (id, name),
          registration_attendees (
            id,
            full_name,
            email,
            phone,
            custom_fields,
            is_primary
          )
        `)
        .eq('event_id', eventId);

      if (regError) throw regError;

      // Fetch attendance records to determine check-in status
      const { data: attendanceRecords, error: attError } = await supabase
        .from('attendance_records')
        .select('registration_id')
        .eq('event_id', eventId);

      if (attError) throw attError;

      const checkedInRegIds = new Set(attendanceRecords?.map(r => r.registration_id) || []);

      // Transform to AttendeeForCard format
      const attendees: AttendeeForCard[] = [];
      
      for (const reg of registrations || []) {
        const regAttendees = reg.registration_attendees as Array<{
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          custom_fields: Record<string, unknown> | null;
          is_primary: boolean;
        }> | null;
        
        if (!regAttendees) continue;
        
        for (const att of regAttendees) {
          const ticketTier = reg.ticket_tiers as { id: string; name: string } | null;
          attendees.push({
            id: att.id,
            full_name: att.full_name || 'Unknown',
            email: att.email || '',
            phone: att.phone || undefined,
            organization: (att.custom_fields?.organization as string) || undefined,
            ticket_type: ticketTier?.name || 'General',
            ticket_tier_id: reg.ticket_tier_id || undefined,
            registration_id: reg.id,
            photo_url: (att.custom_fields?.photo_url as string) || undefined,
            status: reg.status,
            checked_in: checkedInRegIds.has(reg.id),
            custom_fields: att.custom_fields || undefined,
          });
        }
      }

      return attendees;
    },
    enabled: !!eventId,
  });

  // Fetch print job history
  const printJobsQuery = useQuery({
    queryKey: ['id-card-print-jobs', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('id_card_print_jobs')
        .select(`
          *,
          id_card_templates (name)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((job) => ({
        id: job.id,
        name: job.name,
        status: job.status as PrintJob['status'],
        template_id: job.template_id,
        template_name: (job.id_card_templates as { name: string } | null)?.name,
        total_cards: job.total_cards || 0,
        generated_cards: job.generated_cards || 0,
        pdf_url: job.pdf_url || undefined,
        error_message: job.error_message || undefined,
        created_at: job.created_at || '',
        completed_at: job.completed_at || undefined,
      })) as PrintJob[];
    },
    enabled: !!workspaceId,
  });

  // Calculate attendee stats
  const stats: AttendeeStats = {
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    byTicketType: {},
  };

  if (attendeesQuery.data) {
    const attendees = attendeesQuery.data;
    stats.total = attendees.length;
    stats.confirmed = attendees.filter(a => a.status === 'confirmed').length;
    stats.checkedIn = attendees.filter(a => a.checked_in).length;
    stats.notCheckedIn = attendees.filter(a => !a.checked_in).length;
    
    for (const att of attendees) {
      const ticketType = att.ticket_type || 'General';
      stats.byTicketType[ticketType] = (stats.byTicketType[ticketType] || 0) + 1;
    }
  }

  // Filter attendees based on criteria
  const filterAttendees = useCallback((
    attendees: AttendeeForCard[],
    filter?: GenerateParams['filter']
  ): AttendeeForCard[] => {
    if (!filter) return attendees;

    let filtered = attendees;

    if (filter.status && filter.status !== 'all') {
      switch (filter.status) {
        case 'confirmed':
          filtered = filtered.filter(a => a.status === 'confirmed');
          break;
        case 'checked_in':
          filtered = filtered.filter(a => a.checked_in);
          break;
        case 'not_checked_in':
          filtered = filtered.filter(a => !a.checked_in);
          break;
      }
    }

    if (filter.ticketTierId) {
      filtered = filtered.filter(a => a.ticket_tier_id === filter.ticketTierId);
    }

    return filtered;
  }, []);

  // Create print job mutation
  const createPrintJobMutation = useMutation({
    mutationFn: async (params: {
      name: string;
      templateId: string;
      totalCards: number;
      attendeeFilter?: GenerateParams['filter'];
      attendeeIds?: string[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!workspaceId || !eventId) throw new Error('Missing workspace or event ID');
      
      const { data, error } = await supabase
        .from('id_card_print_jobs')
        .insert([{
          workspace_id: workspaceId,
          event_id: eventId,
          template_id: params.templateId,
          name: params.name,
          status: 'processing',
          total_cards: params.totalCards,
          attendee_filter: params.attendeeFilter || null,
          attendee_ids: params.attendeeIds || null,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['id-card-print-jobs', workspaceId] });
    },
  });

  // Update print job mutation
  const updatePrintJobMutation = useMutation({
    mutationFn: async (params: {
      jobId: string;
      status: PrintJob['status'];
      generatedCards?: number;
      pdfUrl?: string;
      errorMessage?: string;
    }) => {
      const updateData: Record<string, unknown> = { status: params.status };
      
      if (params.generatedCards !== undefined) {
        updateData.generated_cards = params.generatedCards;
      }
      if (params.pdfUrl) {
        updateData.pdf_url = params.pdfUrl;
      }
      if (params.errorMessage) {
        updateData.error_message = params.errorMessage;
      }
      if (params.status === 'completed' || params.status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('id_card_print_jobs')
        .update(updateData)
        .eq('id', params.jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['id-card-print-jobs', workspaceId] });
    },
  });

  // Delete print job mutation
  const deletePrintJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('id_card_print_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['id-card-print-jobs', workspaceId] });
      toast.success('Print job deleted');
    },
    onError: () => {
      toast.error('Failed to delete print job');
    },
  });

  return {
    // Data
    attendees: attendeesQuery.data ?? [],
    printJobs: printJobsQuery.data ?? [],
    stats,
    
    // Loading states
    isLoadingAttendees: attendeesQuery.isLoading,
    isLoadingJobs: printJobsQuery.isLoading,
    
    // Generation state
    generationProgress,
    setGenerationProgress,
    isGenerating: generationProgress.status !== 'idle' && generationProgress.status !== 'complete' && generationProgress.status !== 'error',
    
    // Utilities
    filterAttendees,
    
    // Mutations
    createPrintJob: createPrintJobMutation.mutateAsync,
    updatePrintJob: updatePrintJobMutation.mutateAsync,
    deletePrintJob: deletePrintJobMutation.mutate,
    
    // Refetch
    refetchAttendees: attendeesQuery.refetch,
    refetchJobs: printJobsQuery.refetch,
  };
}
