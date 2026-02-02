/**
 * Press Releases Hook - Database-backed press release management
 * Replaces mock data in PressReleaseTracker component
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type PressReleaseStatus = 'draft' | 'review' | 'approved' | 'distributed';
export type PressReleaseType = 'press-release' | 'media-kit' | 'fact-sheet' | 'statement';

export interface PressRelease {
  id: string;
  workspaceId: string;
  title: string;
  type: PressReleaseType;
  status: PressReleaseStatus;
  content: string | null;
  summary: string | null;
  author: string | null;
  authorName: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  distributedAt: string | null;
  distributionChannels: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePressReleaseInput {
  workspaceId: string;
  title: string;
  type: PressReleaseType;
  content?: string;
  summary?: string;
}

export interface UpdatePressReleaseInput {
  title?: string;
  type?: PressReleaseType;
  status?: PressReleaseStatus;
  content?: string;
  summary?: string;
  distributionChannels?: string[];
  attachments?: string[];
}

// ============================================
// Helper Functions
// ============================================

function mapPressReleaseFromDb(row: Record<string, unknown>): PressRelease {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    title: row.title as string,
    type: (row.release_type as PressReleaseType) || 'press-release',
    status: (row.status as PressReleaseStatus) || 'draft',
    content: row.content as string | null,
    summary: row.summary as string | null,
    author: row.author as string | null,
    authorName: row.author_name as string | null,
    reviewedBy: row.reviewed_by as string | null,
    approvedBy: row.approved_by as string | null,
    distributedAt: row.distributed_at as string | null,
    distributionChannels: (row.distribution_channels as string[]) || [],
    attachments: (row.attachments as string[]) || [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    return data?.full_name || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching press releases for a workspace
 */
export function usePressReleases(workspaceId: string | undefined, filters?: { status?: PressReleaseStatus; type?: PressReleaseType }) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.pressReleases(workspaceId || ''), filters],
    queryFn: async (): Promise<PressRelease[]> => {
      if (!workspaceId) return [];

      let query = supabase
        .from('workspace_press_releases')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('release_type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapPressReleaseFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });
}

/**
 * Hook for press release CRUD operations
 */
export function usePressReleaseMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.pressReleases(workspaceId || '');

  const createPressRelease = useMutation({
    mutationFn: async (input: CreatePressReleaseInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Get user name
      let authorName = 'Unknown';
      if (userId) {
        authorName = await getUserDisplayName(userId);
      }

      const { data, error } = await supabase
        .from('workspace_press_releases')
        .insert({
          workspace_id: input.workspaceId,
          title: input.title,
          release_type: input.type,
          content: input.content,
          summary: input.summary,
          status: 'draft',
          author: userId,
          author_name: authorName,
        })
        .select()
        .single();

      if (error) throw error;
      return mapPressReleaseFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Press release created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create press release: ${error.message}`);
    },
  });

  const updatePressRelease = useMutation({
    mutationFn: async ({ id, ...input }: UpdatePressReleaseInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.type !== undefined) updateData.release_type = input.type;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.summary !== undefined) updateData.summary = input.summary;
      if (input.distributionChannels !== undefined) updateData.distribution_channels = input.distributionChannels;
      if (input.attachments !== undefined) updateData.attachments = input.attachments;

      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPressReleaseFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PressRelease[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: PressRelease[] | undefined) =>
        old?.map((p) => (p.id === id ? { ...p, ...input } : p))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to update press release: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Press release updated');
    },
  });

  const submitForReview = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update({ status: 'review' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPressReleaseFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Submitted for review');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit for review: ${error.message}`);
    },
  });

  const approvePressRelease = useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update({
          status: 'approved',
          approved_by: userData?.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPressReleaseFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Press release approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve press release: ${error.message}`);
    },
  });

  const distributePressRelease = useMutation({
    mutationFn: async ({ id, channels }: { id: string; channels: string[] }) => {
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update({
          status: 'distributed',
          distributed_at: new Date().toISOString(),
          distribution_channels: channels,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapPressReleaseFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Press release distributed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to distribute press release: ${error.message}`);
    },
  });

  const deletePressRelease = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_press_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PressRelease[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: PressRelease[] | undefined) =>
        old?.filter((p) => p.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete press release: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Press release deleted');
    },
  });

  return {
    createPressRelease,
    updatePressRelease,
    submitForReview,
    approvePressRelease,
    distributePressRelease,
    deletePressRelease,
  };
}

/**
 * Hook for press release statistics
 */
export function usePressReleaseStats(workspaceId: string | undefined) {
  const { data: releases = [], isLoading } = usePressReleases(workspaceId);

  const stats = {
    total: releases.length,
    draft: releases.filter((r) => r.status === 'draft').length,
    inReview: releases.filter((r) => r.status === 'review').length,
    approved: releases.filter((r) => r.status === 'approved').length,
    distributed: releases.filter((r) => r.status === 'distributed').length,
    byType: {
      pressRelease: releases.filter((r) => r.type === 'press-release').length,
      mediaKit: releases.filter((r) => r.type === 'media-kit').length,
      factSheet: releases.filter((r) => r.type === 'fact-sheet').length,
      statement: releases.filter((r) => r.type === 'statement').length,
    },
  };

  return { stats, isLoading };
}