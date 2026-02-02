import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CertificateCriteria {
  type: 'MERIT' | 'COMPLETION' | 'APPRECIATION';
  conditions: {
    minScore?: number;
    maxRank?: number;
    requiresAttendance?: boolean;
    requiresRole?: string[];
  };
}

export interface Certificate {
  id: string;
  certificateId: string;
  recipientId: string;
  eventId: string;
  type: 'MERIT' | 'COMPLETION' | 'APPRECIATION';
  pdfUrl: string;
  qrCodeUrl: string;
  issuedAt: string;
  distributedAt?: string;
  recipient: {
    name: string;
    email: string;
  };
}

export interface CertificateStats {
  total: number;
  distributed: number;
  pending: number;
  byType: {
    COMPLETION: number;
    MERIT: number;
    APPRECIATION: number;
  };
}

export function useWorkspaceCertificates(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch certificate criteria for workspace
  const criteriaQuery = useQuery({
    queryKey: ['workspace-certificate-criteria', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'getCriteria', workspaceId },
      });
      
      if (error) throw error;
      return (data?.data || []) as CertificateCriteria[];
    },
    enabled: !!workspaceId,
  });

  // Fetch generated certificates for workspace
  const certificatesQuery = useQuery({
    queryKey: ['workspace-certificates', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'listWorkspaceCertificates', workspaceId },
      });
      
      if (error) throw error;
      return (data?.data || []) as Certificate[];
    },
    enabled: !!workspaceId,
  });

  // Fetch certificate statistics
  const statsQuery = useQuery({
    queryKey: ['workspace-certificate-stats', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'getStats', workspaceId },
      });
      
      if (error) throw error;
      return data as CertificateStats;
    },
    enabled: !!workspaceId,
  });

  // Save criteria mutation
  const saveCriteriaMutation = useMutation({
    mutationFn: async (criteria: CertificateCriteria[]) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'saveCriteria', workspaceId, criteria },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-certificate-criteria', workspaceId] });
    },
  });

  // Batch generate mutation
  const batchGenerateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'batchGenerate', workspaceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-certificates', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-certificate-stats', workspaceId] });
    },
  });

  // Distribute certificates mutation
  const distributeMutation = useMutation({
    mutationFn: async (certificateIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('certificates', {
        body: { action: 'distribute', workspaceId, certificateIds },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-certificates', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-certificate-stats', workspaceId] });
    },
  });

  return {
    // Data
    criteria: criteriaQuery.data ?? [],
    certificates: certificatesQuery.data ?? [],
    stats: statsQuery.data,

    // Loading states
    isLoadingCriteria: criteriaQuery.isLoading,
    isLoadingCertificates: certificatesQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,

    // Mutations
    saveCriteria: saveCriteriaMutation.mutate,
    batchGenerate: batchGenerateMutation.mutate,
    distribute: distributeMutation.mutate,

    // Mutation states
    isSavingCriteria: saveCriteriaMutation.isPending,
    isGenerating: batchGenerateMutation.isPending,
    isDistributing: distributeMutation.isPending,

    // Refetch functions
    refetchCriteria: criteriaQuery.refetch,
    refetchCertificates: certificatesQuery.refetch,
    refetchStats: statsQuery.refetch,
  };
}
