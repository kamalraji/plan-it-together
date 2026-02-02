/**
 * Volunteer Applications Hook - Database-backed application management
 * Replaces mock data in RecruitmentTab component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted';

export interface VolunteerApplication {
  id: string;
  workspaceId: string;
  eventId: string | null;
  applicantId: string | null;
  applicantName: string;
  email: string;
  phone: string | null;
  roleApplied: string | null;
  experience: string | null;
  availability: Record<string, unknown> | null;
  status: ApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  workspaceId: string;
  eventId?: string;
  applicantName: string;
  email: string;
  phone?: string;
  roleApplied?: string;
  experience?: string;
  availability?: Record<string, unknown>;
}

export interface ReviewApplicationInput {
  id: string;
  status: ApplicationStatus;
  notes?: string;
}

// ============================================
// Helper Functions
// ============================================

function mapApplicationFromDb(row: Record<string, unknown>): VolunteerApplication {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    eventId: row.event_id as string | null,
    applicantId: row.applicant_id as string | null,
    applicantName: row.applicant_name as string,
    email: row.applicant_email as string,
    phone: row.applicant_phone as string | null,
    roleApplied: row.role_applied as string | null,
    experience: row.experience as string | null,
    availability: row.availability as Record<string, unknown> | null,
    status: (row.status as ApplicationStatus) || 'pending',
    reviewedBy: row.reviewed_by as string | null,
    reviewedAt: row.reviewed_at as string | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching volunteer applications for a workspace
 */
export function useVolunteerApplications(
  workspaceId: string | undefined,
  filters?: { status?: ApplicationStatus }
) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.volunteerApplications(workspaceId || ''), filters],
    queryFn: async (): Promise<VolunteerApplication[]> => {
      if (!workspaceId) return [];

      let query = supabase
        .from('volunteer_applications')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('applied_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapApplicationFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for application mutations
 */
export function useApplicationMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.volunteerApplications(workspaceId || '');

  const submitApplication = useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const insertData = {
        workspace_id: input.workspaceId,
        event_id: input.eventId || null,
        applicant_name: input.applicantName,
        applicant_email: input.email,
        applicant_phone: input.phone || null,
        role_applied: input.roleApplied || null,
        experience: input.experience || null,
        availability: (input.availability || null) as unknown,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('volunteer_applications')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return mapApplicationFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Application submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit application: ${error.message}`);
    },
  });

  const reviewApplication = useMutation({
    mutationFn: async (input: ReviewApplicationInput) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('volunteer_applications')
        .update({
          status: input.status,
          notes: input.notes,
          reviewed_by: userData?.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return mapApplicationFromDb(data);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<VolunteerApplication[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: VolunteerApplication[] | undefined) =>
        old?.map((a) => (a.id === input.id ? { ...a, status: input.status } : a))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to review application: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (_, input) => {
      const action = input.status === 'approved' ? 'approved' : 
                     input.status === 'rejected' ? 'rejected' : 
                     input.status === 'waitlisted' ? 'waitlisted' : 'updated';
      toast.success(`Application ${action}${input.status === 'approved' ? '! Welcome email sent.' : ''}`);
    },
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('volunteer_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<VolunteerApplication[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: VolunteerApplication[] | undefined) =>
        old?.filter((a) => a.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete application: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Application deleted');
    },
  });

  return {
    submitApplication,
    reviewApplication,
    deleteApplication,
  };
}

/**
 * Hook for application statistics
 */
export function useApplicationStats(workspaceId: string | undefined) {
  const { data: applications = [], isLoading } = useVolunteerApplications(workspaceId);

  const pending = applications.filter((a) => a.status === 'pending').length;
  const approved = applications.filter((a) => a.status === 'approved').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;
  const waitlisted = applications.filter((a) => a.status === 'waitlisted').length;

  const stats = {
    total: applications.length,
    pending,
    approved,
    rejected,
    waitlisted,
    acceptanceRate: applications.length > 0
      ? Math.round((approved / applications.length) * 100)
      : 0,
    thisWeek: applications.filter((a) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.createdAt) >= weekAgo;
    }).length,
  };

  return { stats, isLoading };
}
