import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeadlineExtension {
  id: string;
  checklist_id: string;
  requested_by: string;
  requested_at: string;
  current_due_date: string | null;
  requested_due_date: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  checklist_title?: string;
  workspace_name?: string;
  requester_name?: string;
}

export interface CreateExtensionParams {
  checklistId: string;
  currentDueDate: string | null;
  requestedDueDate: Date;
  justification: string;
}

export interface ReviewExtensionParams {
  extensionId: string;
  status: 'approved' | 'rejected';
  reviewNotes?: string;
}

export function useDeadlineExtensions(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch extension requests for checklists in this workspace (incoming)
  const incomingExtensionsQuery = useQuery({
    queryKey: ['deadline-extensions-incoming', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      // Get extension requests for checklists delegated FROM this workspace
      const { data, error } = await supabase
        .from('checklist_deadline_extensions')
        .select(`
          *,
          workspace_checklists!inner (
            id,
            title,
            delegated_from_workspace_id,
            workspace_id,
            workspaces!workspace_checklists_workspace_id_fkey (
              name
            )
          )
        `)
        .eq('workspace_checklists.delegated_from_workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((ext: any) => ({
        ...ext,
        checklist_title: ext.workspace_checklists?.title,
        workspace_name: ext.workspace_checklists?.workspaces?.name,
      })) as DeadlineExtension[];
    },
    enabled: !!workspaceId,
  });

  // Fetch extension requests for checklists in this workspace (outgoing - requests we made)
  const outgoingExtensionsQuery = useQuery({
    queryKey: ['deadline-extensions-outgoing', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('checklist_deadline_extensions')
        .select(`
          *,
          workspace_checklists!inner (
            id,
            title,
            delegated_from_workspace_id,
            workspace_id
          )
        `)
        .eq('workspace_checklists.workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((ext: any) => ({
        ...ext,
        checklist_title: ext.workspace_checklists?.title,
      })) as DeadlineExtension[];
    },
    enabled: !!workspaceId,
  });

  // Create an extension request
  const createExtensionMutation = useMutation({
    mutationFn: async (params: CreateExtensionParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('checklist_deadline_extensions')
        .insert({
          checklist_id: params.checklistId,
          requested_by: user.id,
          current_due_date: params.currentDueDate,
          requested_due_date: params.requestedDueDate.toISOString(),
          justification: params.justification,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadline-extensions-outgoing', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deadline-extensions-incoming'] });
      toast({
        title: 'Extension Requested',
        description: 'Your deadline extension request has been submitted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Review an extension request (approve/reject)
  const reviewExtensionMutation = useMutation({
    mutationFn: async (params: ReviewExtensionParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('checklist_deadline_extensions')
        .update({
          status: params.status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: params.reviewNotes || null,
        })
        .eq('id', params.extensionId)
        .select()
        .single();

      if (error) throw error;

      // If approved, update the checklist's due date
      if (params.status === 'approved' && data) {
        await supabase
          .from('workspace_checklists')
          .update({ due_date: data.requested_due_date })
          .eq('id', data.checklist_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deadline-extensions-incoming', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deadline-extensions-outgoing'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-checklists'] });
      toast({
        title: variables.status === 'approved' ? 'Extension Approved' : 'Extension Rejected',
        description: variables.status === 'approved' 
          ? 'The deadline has been updated.' 
          : 'The extension request has been rejected.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Review Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    incomingExtensions: incomingExtensionsQuery.data ?? [],
    outgoingExtensions: outgoingExtensionsQuery.data ?? [],
    isLoadingIncoming: incomingExtensionsQuery.isLoading,
    isLoadingOutgoing: outgoingExtensionsQuery.isLoading,
    createExtension: createExtensionMutation.mutate,
    isCreating: createExtensionMutation.isPending,
    reviewExtension: reviewExtensionMutation.mutate,
    isReviewing: reviewExtensionMutation.isPending,
  };
}
