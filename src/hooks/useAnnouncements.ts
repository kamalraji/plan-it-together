/**
 * Announcements Hook - Database-backed announcement management
 * Replaces mock data in AnnouncementManager and MassAnnouncementTab
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AnnouncementAudience = 'all' | 'team' | 'volunteers' | 'attendees' | 'sponsors' | 'custom';

export interface Announcement {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  publishedAt: string | null;
  scheduledFor: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  readCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  workspaceId: string;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  audience?: AnnouncementAudience;
  scheduledFor?: string;
  expiresAt?: string;
  isPinned?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  audience?: AnnouncementAudience;
  scheduledFor?: string;
  expiresAt?: string;
  isPinned?: boolean;
}

// ============================================
// Helper Functions
// ============================================

function mapAnnouncementFromDb(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    title: row.title as string,
    content: row.content as string,
    status: (row.status as AnnouncementStatus) || 'draft',
    priority: (row.priority as AnnouncementPriority) || 'medium',
    audience: (row.audience as AnnouncementAudience) || 'all',
    publishedAt: row.published_at as string | null,
    scheduledFor: row.scheduled_for as string | null,
    expiresAt: row.expires_at as string | null,
    createdBy: row.created_by as string | null,
    createdByName: row.created_by_name as string | null,
    readCount: Number(row.read_count) || 0,
    isPinned: Boolean(row.is_pinned),
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
 * Hook for fetching announcements for a workspace
 */
export function useAnnouncements(workspaceId: string | undefined, filters?: { status?: AnnouncementStatus; audience?: AnnouncementAudience }) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.announcements(workspaceId || ''), filters],
    queryFn: async (): Promise<Announcement[]> => {
      if (!workspaceId) return [];

      let query = supabase
        .from('workspace_announcements')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.audience) {
        query = query.eq('audience', filters.audience);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(mapAnnouncementFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for fetching published announcements (for display to users)
 */
export function usePublishedAnnouncements(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.workspaces.announcements(workspaceId || ''), 'published'],
    queryFn: async (): Promise<Announcement[]> => {
      if (!workspaceId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('workspace_announcements')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'published')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapAnnouncementFromDb);
    },
    enabled: !!workspaceId,
    ...queryPresets.dynamic,
  });
}

/**
 * Hook for announcement CRUD operations
 */
export function useAnnouncementMutations(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.workspaces.announcements(workspaceId || '');

  const createAnnouncement = useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Get user name for display
      let createdByName = 'Unknown';
      if (userId) {
        createdByName = await getUserDisplayName(userId);
      }

      const { data, error } = await supabase
        .from('workspace_announcements')
        .insert({
          workspace_id: input.workspaceId,
          title: input.title,
          content: input.content,
          priority: input.priority || 'medium',
          audience: input.audience || 'all',
          scheduled_for: input.scheduledFor,
          expires_at: input.expiresAt,
          is_pinned: input.isPinned || false,
          status: input.scheduledFor ? 'scheduled' : 'draft',
          created_by: userId,
          created_by_name: createdByName,
        })
        .select()
        .single();

      if (error) throw error;
      return mapAnnouncementFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Announcement created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create announcement: ${error.message}`);
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...input }: UpdateAnnouncementInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.audience !== undefined) updateData.audience = input.audience;
      if (input.scheduledFor !== undefined) updateData.scheduled_for = input.scheduledFor;
      if (input.expiresAt !== undefined) updateData.expires_at = input.expiresAt;
      if (input.isPinned !== undefined) updateData.is_pinned = input.isPinned;

      const { data, error } = await supabase
        .from('workspace_announcements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapAnnouncementFromDb(data);
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Announcement[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Announcement[] | undefined) =>
        old?.map((a) => (a.id === id ? { ...a, ...input } : a))
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to update announcement: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Announcement updated');
    },
  });

  const publishAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapAnnouncementFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Announcement published');
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish announcement: ${error.message}`);
    },
  });

  const archiveAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapAnnouncementFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Announcement archived');
    },
    onError: (error: Error) => {
      toast.error(`Failed to archive announcement: ${error.message}`);
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Announcement[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Announcement[] | undefined) =>
        old?.filter((a) => a.id !== id)
      );

      return { previous };
    },
    onError: (error: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(`Failed to delete announcement: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: () => {
      toast.success('Announcement deleted');
    },
  });

  return {
    createAnnouncement,
    updateAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    deleteAnnouncement,
  };
}

/**
 * Hook for announcement statistics
 */
export function useAnnouncementStats(workspaceId: string | undefined) {
  const { data: announcements = [], isLoading } = useAnnouncements(workspaceId);

  const stats = {
    total: announcements.length,
    draft: announcements.filter((a) => a.status === 'draft').length,
    scheduled: announcements.filter((a) => a.status === 'scheduled').length,
    published: announcements.filter((a) => a.status === 'published').length,
    archived: announcements.filter((a) => a.status === 'archived').length,
    pinned: announcements.filter((a) => a.isPinned).length,
    totalReads: announcements.reduce((sum, a) => sum + a.readCount, 0),
    byPriority: {
      urgent: announcements.filter((a) => a.priority === 'urgent').length,
      high: announcements.filter((a) => a.priority === 'high').length,
      medium: announcements.filter((a) => a.priority === 'medium').length,
      low: announcements.filter((a) => a.priority === 'low').length,
    },
  };

  return { stats, isLoading };
}