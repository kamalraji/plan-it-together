import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PageResponsibility {
  id: string;
  eventId: string;
  workspaceId: string;
  workspaceName: string;
  responsibilityType: string;
  assignedBy: string | null;
  assignedAt: string;
  status: string;
  notes: string | null;
}

/**
 * Fetch all page responsibilities for an event
 */
export function usePageBuildingResponsibilities(eventId?: string) {
  return useQuery({
    queryKey: ['page-responsibilities', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('workspace_page_responsibilities')
        .select(`
          id,
          event_id,
          workspace_id,
          responsibility_type,
          assigned_by,
          assigned_at,
          status,
          notes,
          workspaces:workspace_id (name)
        `)
        .eq('event_id', eventId)
        .eq('status', 'ACTIVE');

      if (error) throw error;

      return (data || []).map((item): PageResponsibility => ({
        id: item.id,
        eventId: item.event_id,
        workspaceId: item.workspace_id,
        workspaceName: (item.workspaces as any)?.name || 'Unknown',
        responsibilityType: item.responsibility_type,
        assignedBy: item.assigned_by,
        assignedAt: item.assigned_at || '',
        status: item.status || 'ACTIVE',
        notes: item.notes,
      }));
    },
    enabled: !!eventId,
  });
}

/**
 * Check if a specific workspace has page building responsibility
 */
export function useWorkspacePageResponsibility(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-page-responsibility', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_page_responsibilities')
        .select(`
          id,
          event_id,
          responsibility_type,
          status
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (error) throw error;

      return data ? {
        hasResponsibility: true,
        responsibilityType: data.responsibility_type,
        eventId: data.event_id,
        responsibilityId: data.id,
      } : {
        hasResponsibility: false,
        responsibilityType: null,
        eventId: null,
        responsibilityId: null,
      };
    },
    enabled: !!workspaceId,
  });
}

interface AssignResponsibilityParams {
  eventId: string;
  workspaceId: string;
  responsibilityType: string;
  notes?: string;
}

/**
 * Assign page building responsibility to a workspace
 */
export function useAssignPageResponsibility() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, workspaceId, responsibilityType, notes }: AssignResponsibilityParams) => {
      // First check if there's an existing assignment for this responsibility type
      const { data: existing } = await supabase
        .from('workspace_page_responsibilities')
        .select('id, workspace_id')
        .eq('event_id', eventId)
        .eq('responsibility_type', responsibilityType)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (existing) {
        // Revoke existing assignment
        await supabase
          .from('workspace_page_responsibilities')
          .update({ status: 'REVOKED' })
          .eq('id', existing.id);
      }

      // Create new assignment
      const { data, error } = await supabase
        .from('workspace_page_responsibilities')
        .insert({
          event_id: eventId,
          workspace_id: workspaceId,
          responsibility_type: responsibilityType,
          assigned_by: user?.id,
          notes,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['page-responsibilities', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-page-responsibility', variables.workspaceId] });
      toast.success('Page building responsibility assigned successfully');
    },
    onError: (error) => {
      console.error('Failed to assign responsibility:', error);
      toast.error('Failed to assign responsibility');
    },
  });
}

/**
 * Revoke page building responsibility from a workspace
 */
export function useRevokePageResponsibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (responsibilityId: string) => {
      const { error } = await supabase
        .from('workspace_page_responsibilities')
        .update({ status: 'REVOKED' })
        .eq('id', responsibilityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-responsibilities'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-page-responsibility'] });
      toast.success('Responsibility revoked');
    },
    onError: (error) => {
      console.error('Failed to revoke responsibility:', error);
      toast.error('Failed to revoke responsibility');
    },
  });
}
