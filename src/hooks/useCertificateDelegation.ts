import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CertificateDelegation {
  id: string;
  delegatedWorkspaceId: string;
  delegatedWorkspaceName: string;
  canDesignTemplates: boolean;
  canDefineCriteria: boolean;
  canGenerate: boolean;
  canDistribute: boolean;
  delegatedAt: string;
  notes?: string;
}

export interface DelegationPermissions {
  canDesignTemplates?: boolean;
  canDefineCriteria?: boolean;
  canGenerate?: boolean;
  canDistribute?: boolean;
}

export interface MyDelegation {
  id: string;
  rootWorkspaceId: string;
  rootWorkspaceName: string;
  eventId: string;
  canDesignTemplates: boolean;
  canDefineCriteria: boolean;
  canGenerate: boolean;
  canDistribute: boolean;
  delegatedAt: string;
  notes?: string;
}

export function useCertificateDelegation(rootWorkspaceId: string | undefined) {
  const queryClient = useQueryClient();

  // List all delegations from this ROOT workspace
  const delegationsQuery = useQuery({
    queryKey: ['certificate-delegations', rootWorkspaceId],
    queryFn: async () => {
      if (!rootWorkspaceId) return [];

      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'getDelegations', workspaceId: rootWorkspaceId },
      });

      if (error) throw error;
      return (data?.data ?? []) as CertificateDelegation[];
    },
    enabled: !!rootWorkspaceId,
  });

  // Create delegation mutation
  const createDelegationMutation = useMutation({
    mutationFn: async ({
      delegatedWorkspaceId,
      permissions,
      notes,
    }: {
      delegatedWorkspaceId: string;
      permissions: DelegationPermissions;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: {
          action: 'createDelegation',
          workspaceId: rootWorkspaceId,
          delegatedWorkspaceId,
          permissions,
          notes,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-delegations', rootWorkspaceId] });
    },
  });

  // Update delegation mutation
  const updateDelegationMutation = useMutation({
    mutationFn: async ({
      delegationId,
      permissions,
      notes,
    }: {
      delegationId: string;
      permissions: DelegationPermissions;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: {
          action: 'updateDelegation',
          workspaceId: rootWorkspaceId,
          delegationId,
          permissions,
          notes,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-delegations', rootWorkspaceId] });
    },
  });

  // Remove delegation mutation
  const removeDelegationMutation = useMutation({
    mutationFn: async (delegationId: string) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: {
          action: 'removeDelegation',
          workspaceId: rootWorkspaceId,
          delegationId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-delegations', rootWorkspaceId] });
    },
  });

  return {
    delegations: delegationsQuery.data ?? [],
    isLoading: delegationsQuery.isLoading,
    error: delegationsQuery.error,
    refetch: delegationsQuery.refetch,

    createDelegation: createDelegationMutation.mutate,
    isCreating: createDelegationMutation.isPending,

    updateDelegation: updateDelegationMutation.mutate,
    isUpdating: updateDelegationMutation.isPending,

    removeDelegation: removeDelegationMutation.mutate,
    isRemoving: removeDelegationMutation.isPending,
  };
}

// Hook for delegated workspaces to check their permissions
export function useMyDelegatedPermissions(workspaceId: string | undefined) {
  const query = useQuery({
    queryKey: ['my-certificate-delegation', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'getMyDelegation', workspaceId },
      });

      if (error) throw error;
      return data?.delegation as MyDelegation | null;
    },
    enabled: !!workspaceId,
  });

  const delegation = query.data;

  return {
    delegation,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Convenience permission flags
    hasDelegation: !!delegation,
    canDesign: delegation?.canDesignTemplates ?? false,
    canDefineCriteria: delegation?.canDefineCriteria ?? false,
    canGenerate: delegation?.canGenerate ?? false,
    canDistribute: delegation?.canDistribute ?? false,
    rootWorkspaceId: delegation?.rootWorkspaceId,
    eventId: delegation?.eventId,
  };
}
