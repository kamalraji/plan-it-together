import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ResourceType = 'equipment' | 'personnel' | 'venue' | 'digital';
export type ResourceStatus = 'available' | 'reserved' | 'in_use' | 'depleted';

export interface WorkspaceResource {
  id: string;
  workspace_id: string;
  name: string;
  type: ResourceType;
  quantity: number;
  available: number;
  status: ResourceStatus;
  assigned_to_workspace_id: string | null;
  assigned_to_name: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useWorkspaceResources(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resourcesQuery = useQuery({
    queryKey: ['workspace-resources', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('type', { ascending: true });
      if (error) throw error;
      return data as WorkspaceResource[];
    },
    enabled: !!workspaceId,
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resource: Omit<WorkspaceResource, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .insert(resource)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-resources', workspaceId] });
      toast({ title: 'Resource added successfully' });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkspaceResource> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-resources', workspaceId] });
      toast({ title: 'Resource updated' });
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-resources', workspaceId] });
      toast({ title: 'Resource removed' });
    },
  });

  const assignResourceMutation = useMutation({
    mutationFn: async ({
      resourceId,
      targetWorkspaceId,
      targetWorkspaceName,
      quantity,
    }: {
      resourceId: string;
      targetWorkspaceId: string;
      targetWorkspaceName: string;
      quantity: number;
    }) => {
      const resource = resourcesQuery.data?.find(r => r.id === resourceId);
      if (!resource) throw new Error('Resource not found');

      const newAvailable = resource.available - quantity;
      if (newAvailable < 0) throw new Error('Not enough resources available');

      const { data, error } = await supabase
        .from('workspace_resources')
        .update({
          available: newAvailable,
          status: newAvailable === 0 ? 'reserved' : resource.status,
          assigned_to_workspace_id: targetWorkspaceId,
          assigned_to_name: targetWorkspaceName,
        })
        .eq('id', resourceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-resources', workspaceId] });
      toast({ title: 'Resource assigned' });
    },
  });

  return {
    resources: resourcesQuery.data ?? [],
    isLoading: resourcesQuery.isLoading,
    createResource: createResourceMutation.mutate,
    updateResource: updateResourceMutation.mutate,
    deleteResource: deleteResourceMutation.mutate,
    assignResource: assignResourceMutation.mutate,
    isCreating: createResourceMutation.isPending,
  };
}
