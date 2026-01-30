/**
 * Workspace Announcements/Briefs Hook
 * Industrial-grade implementation for team communications
 * Uses workspace_announcements table with real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/query-config';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// Types
// ============================================

export interface WorkspaceAnnouncement {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'leads' | 'morning' | 'afternoon' | 'evening' | string;
  announcement_type: 'brief' | 'reminder' | 'update' | 'alert';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  channels: {
    email?: boolean;
    in_app?: boolean;
    sms?: boolean;
  } | null;
  sent_by: string | null;
  sent_at: string | null;
  scheduled_for: string | null;
  recipients_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  target_audience: string;
  announcement_type?: string;
  scheduled_for?: string | null;
  channels?: {
    email?: boolean;
    in_app?: boolean;
  };
}

// ============================================
// Query Keys
// ============================================

const announcementKeys = {
  all: ['workspace-announcements'] as const,
  list: (workspaceId: string) => [...announcementKeys.all, 'list', workspaceId] as const,
  detail: (id: string) => [...announcementKeys.all, 'detail', id] as const,
  stats: (workspaceId: string) => [...announcementKeys.all, 'stats', workspaceId] as const,
};

// ============================================
// Main Hook
// ============================================

export function useWorkspaceAnnouncements(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all announcements for workspace
  const announcementsQuery = useQuery({
    queryKey: announcementKeys.list(workspaceId || ''),
    queryFn: async (): Promise<WorkspaceAnnouncement[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_announcements')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []) as WorkspaceAnnouncement[];
    },
    enabled: !!workspaceId,
    ...queryPresets.standard,
  });

  // Create announcement (draft or send immediately)
  const createAnnouncement = useMutation({
    mutationFn: async (data: CreateAnnouncementData & { sendNow?: boolean }) => {
      const { sendNow, ...announcementData } = data;

      const { data: result, error } = await supabase
        .from('workspace_announcements')
        .insert({
          workspace_id: workspaceId!,
          title: announcementData.title,
          content: announcementData.content,
          target_audience: announcementData.target_audience,
          announcement_type: announcementData.announcement_type || 'brief',
          status: sendNow ? 'sent' : (announcementData.scheduled_for ? 'scheduled' : 'draft'),
          channels: announcementData.channels || { in_app: true },
          scheduled_for: announcementData.scheduled_for || null,
          sent_by: sendNow ? user?.id || null : null,
          sent_at: sendNow ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      // If sending now with email enabled, trigger the edge function
      if (sendNow && announcementData.channels?.email) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-team-brief', {
            body: {
              announcementId: result.id,
              workspaceId,
              targetAudience: announcementData.target_audience,
            },
          });

          if (emailError) {
            // Update status to indicate email failed but in-app notification sent
            await supabase
              .from('workspace_announcements')
              .update({ 
                channels: { ...announcementData.channels, email_status: 'failed' } 
              })
              .eq('id', result.id);
          }
        } catch (_e) {
          // Email sending failed silently
        }
      }

      return result;
    },
    onMutate: async (newAnnouncement) => {
      await queryClient.cancelQueries({ queryKey: announcementKeys.list(workspaceId || '') });
      
      const previousAnnouncements = queryClient.getQueryData<WorkspaceAnnouncement[]>(
        announcementKeys.list(workspaceId || '')
      );

      // Optimistic update
      const optimisticAnnouncement: WorkspaceAnnouncement = {
        id: `temp-${Date.now()}`,
        workspace_id: workspaceId || '',
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        target_audience: newAnnouncement.target_audience,
        announcement_type: (newAnnouncement.announcement_type || 'brief') as WorkspaceAnnouncement['announcement_type'],
        status: newAnnouncement.sendNow ? 'sent' : 'draft',
        channels: newAnnouncement.channels || null,
        sent_by: newAnnouncement.sendNow ? user?.id || null : null,
        sent_at: newAnnouncement.sendNow ? new Date().toISOString() : null,
        scheduled_for: newAnnouncement.scheduled_for || null,
        recipients_count: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<WorkspaceAnnouncement[]>(
        announcementKeys.list(workspaceId || ''),
        (old) => [optimisticAnnouncement, ...(old || [])]
      );

      return { previousAnnouncements };
    },
    onError: (_err, _newAnnouncement, context) => {
      if (context?.previousAnnouncements) {
        queryClient.setQueryData(
          announcementKeys.list(workspaceId || ''),
          context.previousAnnouncements
        );
      }
      toast.error('Failed to create announcement');
    },
    onSuccess: (_, variables) => {
      if (variables.sendNow) {
        toast.success('Brief sent successfully');
      } else if (variables.scheduled_for) {
        toast.success('Brief scheduled');
      } else {
        toast.success('Draft saved');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.list(workspaceId || '') });
      queryClient.invalidateQueries({ queryKey: announcementKeys.stats(workspaceId || '') });
    },
  });

  // Update announcement
  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkspaceAnnouncement> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.list(workspaceId || '') });
      toast.success('Announcement updated');
    },
    onError: () => {
      toast.error('Failed to update announcement');
    },
  });

  // Delete announcement
  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: announcementKeys.list(workspaceId || '') });
      
      const previousAnnouncements = queryClient.getQueryData<WorkspaceAnnouncement[]>(
        announcementKeys.list(workspaceId || '')
      );

      queryClient.setQueryData<WorkspaceAnnouncement[]>(
        announcementKeys.list(workspaceId || ''),
        (old) => (old || []).filter(a => a.id !== id)
      );

      return { previousAnnouncements };
    },
    onError: (_err, _id, context) => {
      if (context?.previousAnnouncements) {
        queryClient.setQueryData(
          announcementKeys.list(workspaceId || ''),
          context.previousAnnouncements
        );
      }
      toast.error('Failed to delete announcement');
    },
    onSuccess: () => {
      toast.success('Announcement deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.list(workspaceId || '') });
    },
  });

  // Send existing draft
  const sendAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Trigger email if enabled
      const channels = data.channels as { email?: boolean } | null;
      if (channels?.email) {
        await supabase.functions.invoke('send-team-brief', {
          body: {
            announcementId: id,
            workspaceId,
            targetAudience: data.target_audience,
          },
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.list(workspaceId || '') });
      toast.success('Brief sent');
    },
    onError: () => {
      toast.error('Failed to send brief');
    },
  });

  return {
    announcements: announcementsQuery.data || [],
    isLoading: announcementsQuery.isLoading,
    error: announcementsQuery.error,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    sendAnnouncement,
  };
}

// ============================================
// Stats Hook
// ============================================

export function useAnnouncementStats(workspaceId: string | undefined) {
  const { announcements, isLoading } = useWorkspaceAnnouncements(workspaceId);

  const stats = {
    total: announcements.length,
    sent: announcements.filter(a => a.status === 'sent').length,
    scheduled: announcements.filter(a => a.status === 'scheduled').length,
    drafts: announcements.filter(a => a.status === 'draft').length,
  };

  return { stats, isLoading };
}

// ============================================
// Recipients Helper
// ============================================

export const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Volunteers' },
  { value: 'leads', label: 'Team Leads Only' },
  { value: 'morning', label: 'Morning Shift' },
  { value: 'afternoon', label: 'Afternoon Shift' },
  { value: 'evening', label: 'Evening Shift' },
] as const;

export function getAudienceLabel(value: string): string {
  return AUDIENCE_OPTIONS.find(opt => opt.value === value)?.label || value;
}
