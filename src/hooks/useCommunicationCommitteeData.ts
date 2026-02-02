import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  EMAIL_CAMPAIGN_COLUMNS, 
  PRESS_RELEASE_COLUMNS, 
  STAKEHOLDER_COLUMNS, 
  BROADCAST_MESSAGE_COLUMNS,
  WORKSPACE_ANNOUNCEMENT_COLUMNS 
} from '@/lib/supabase-columns';

// Types
export interface EmailCampaign {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  content: string | null;
  template_id: string | null;
  status: string;
  recipients_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  target_audience: string;
  recipient_list: unknown;
  scheduled_for: string | null;
  sent_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PressRelease {
  id: string;
  workspace_id: string;
  title: string;
  content: string | null;
  type: string;
  status: string;
  author_id: string | null;
  author_name: string | null;
  reviewer_id: string | null;
  reviewer_name: string | null;
  embargo_date: string | null;
  distribution_date: string | null;
  distribution_channels: string[] | null;
  media_contacts: string[] | null;
  attachments: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stakeholder {
  id: string;
  workspace_id: string;
  name: string;
  role: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  category: string;
  priority: string;
  notes: string | null;
  last_contacted_at: string | null;
  tags: string[] | null;
  metadata: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BroadcastMessage {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  message_type: string;
  channels: string[];
  target_audience: string;
  recipient_ids: string[] | null;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  sent_by: string | null;
  delivery_stats: unknown;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Email Campaigns
// =====================================================
export function useEmailCampaigns(workspaceId: string) {
  return useQuery({
    queryKey: ['email-campaigns', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .select(EMAIL_CAMPAIGN_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailCampaign[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateEmailCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: Partial<EmailCampaign>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .insert([{
          name: campaign.name || '',
          subject: campaign.subject || '',
          content: campaign.content,
          target_audience: campaign.target_audience,
          scheduled_for: campaign.scheduled_for,
          status: campaign.status || 'draft',
          workspace_id: workspaceId,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', workspaceId] });
      toast.success('Email campaign created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });
}

export function useUpdateEmailCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', workspaceId] });
      toast.success('Email campaign updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update campaign: ${error.message}`);
    },
  });
}

export function useDeleteEmailCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', workspaceId] });
      toast.success('Email campaign deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete campaign: ${error.message}`);
    },
  });
}

export function useSendEmailCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', workspaceId] });
      toast.success('Email campaign sent');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    },
  });
}

// =====================================================
// Press Releases
// =====================================================
export function usePressReleases(workspaceId: string) {
  return useQuery({
    queryKey: ['press-releases', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .select(PRESS_RELEASE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PressRelease[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreatePressRelease(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (release: Partial<PressRelease>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .insert([{
          title: release.title || '',
          content: release.content,
          type: release.type,
          author_name: release.author_name,
          embargo_date: release.embargo_date,
          distribution_channels: release.distribution_channels,
          notes: release.notes,
          workspace_id: workspaceId,
          author_id: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases', workspaceId] });
      toast.success('Press release created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create press release: ${error.message}`);
    },
  });
}

export function useUpdatePressRelease(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PressRelease> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases', workspaceId] });
      toast.success('Press release updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update press release: ${error.message}`);
    },
  });
}

export function useDeletePressRelease(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_press_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases', workspaceId] });
      toast.success('Press release deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete press release: ${error.message}`);
    },
  });
}

export function useSubmitPressReleaseForReview(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update({ status: 'review' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases', workspaceId] });
      toast.success('Press release submitted for review');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit for review: ${error.message}`);
    },
  });
}

export function useApprovePressRelease(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update({
          status: 'approved',
          reviewer_id: userData.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases', workspaceId] });
      toast.success('Press release approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });
}

export function useDistributePressRelease(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_press_releases')
        .update({
          status: 'distributed',
          distribution_date: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-releases', workspaceId] });
      toast.success('Press release distributed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to distribute: ${error.message}`);
    },
  });
}

// =====================================================
// Stakeholders
// =====================================================
export function useStakeholders(workspaceId: string) {
  return useQuery({
    queryKey: ['stakeholders', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_stakeholders')
        .select(STAKEHOLDER_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('priority', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Stakeholder[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateStakeholder(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stakeholder: Partial<Stakeholder>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_stakeholders')
        .insert([{
          name: stakeholder.name || '',
          role: stakeholder.role,
          organization: stakeholder.organization,
          email: stakeholder.email,
          phone: stakeholder.phone,
          category: stakeholder.category || 'other',
          priority: stakeholder.priority || 'medium',
          notes: stakeholder.notes,
          workspace_id: workspaceId,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders', workspaceId] });
      toast.success('Stakeholder added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add stakeholder: ${error.message}`);
    },
  });
}

export function useUpdateStakeholder(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Stakeholder> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_stakeholders')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders', workspaceId] });
      toast.success('Stakeholder updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update stakeholder: ${error.message}`);
    },
  });
}

export function useDeleteStakeholder(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_stakeholders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders', workspaceId] });
      toast.success('Stakeholder removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove stakeholder: ${error.message}`);
    },
  });
}

export function useLogStakeholderContact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_stakeholders')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakeholders', workspaceId] });
      toast.success('Contact logged');
    },
    onError: (error: Error) => {
      toast.error(`Failed to log contact: ${error.message}`);
    },
  });
}

// =====================================================
// Broadcast Messages
// =====================================================
export function useBroadcastMessages(workspaceId: string) {
  return useQuery({
    queryKey: ['broadcast-messages', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_broadcast_messages')
        .select(BROADCAST_MESSAGE_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BroadcastMessage[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateBroadcastMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: Partial<BroadcastMessage>) => {
      const { data, error } = await supabase
        .from('workspace_broadcast_messages')
        .insert([{
          title: message.title || '',
          content: message.content || '',
          message_type: message.message_type,
          channels: message.channels || ['in-app'],
          target_audience: message.target_audience,
          scheduled_for: message.scheduled_for,
          status: message.status || 'draft',
          workspace_id: workspaceId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-messages', workspaceId] });
      toast.success('Broadcast message created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create broadcast: ${error.message}`);
    },
  });
}

export function useUpdateBroadcastMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BroadcastMessage> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_broadcast_messages')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-messages', workspaceId] });
      toast.success('Broadcast message updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update broadcast: ${error.message}`);
    },
  });
}

export function useDeleteBroadcastMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_broadcast_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-messages', workspaceId] });
      toast.success('Broadcast message deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete broadcast: ${error.message}`);
    },
  });
}

export function useSendBroadcastMessage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_broadcast_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: userData.user?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-messages', workspaceId] });
      toast.success('Broadcast message sent');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send broadcast: ${error.message}`);
    },
  });
}

// =====================================================
// Announcements (using existing workspace_announcements)
// =====================================================
export function useAnnouncements(workspaceId: string) {
  return useQuery({
    queryKey: ['announcements', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .select(WORKSPACE_ANNOUNCEMENT_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateAnnouncement(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcement: Record<string, unknown>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('workspace_announcements')
        .insert([{
          title: announcement.title as string,
          content: announcement.content as string,
          channels: announcement.channels as string[] | undefined,
          target_audience: announcement.target_audience as string | undefined,
          priority: announcement.priority as string | undefined,
          scheduled_for: announcement.scheduled_for as string | undefined,
          status: (announcement.status as string) || 'draft',
          workspace_id: workspaceId,
          created_by: userData.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
      toast.success('Announcement created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create announcement: ${error.message}`);
    },
  });
}

export function useUpdateAnnouncement(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
      toast.success('Announcement updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update announcement: ${error.message}`);
    },
  });
}

export function useDeleteAnnouncement(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
      toast.success('Announcement deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete announcement: ${error.message}`);
    },
  });
}

export function usePublishAnnouncement(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', workspaceId] });
      toast.success('Announcement published');
    },
    onError: (error: Error) => {
      toast.error(`Failed to publish announcement: ${error.message}`);
    },
  });
}

// =====================================================
// Communication Stats
// =====================================================
export function useCommunicationStats(workspaceId: string) {
  return useQuery({
    queryKey: ['communication-stats', workspaceId],
    queryFn: async () => {
      const [
        { count: announcementsCount },
        { count: emailCampaignsCount },
        { count: pressReleasesCount },
        { count: stakeholdersCount },
        { count: broadcastsCount },
      ] = await Promise.all([
        supabase.from('workspace_announcements').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('workspace_email_campaigns').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('workspace_press_releases').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('workspace_stakeholders').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('workspace_broadcast_messages').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      ]);

      return {
        announcements: announcementsCount || 0,
        emailCampaigns: emailCampaignsCount || 0,
        pressReleases: pressReleasesCount || 0,
        stakeholders: stakeholdersCount || 0,
        broadcasts: broadcastsCount || 0,
      };
    },
    enabled: !!workspaceId,
  });
}
