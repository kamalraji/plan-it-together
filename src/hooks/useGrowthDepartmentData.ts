import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types
export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  channel: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  target_audience: Record<string, any>;
  utm_params: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  workspace_id: string;
  name: string;
  company_name: string | null;
  tier: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contract_value: number;
  amount_paid: number;
  payment_status: string;
  deliverables: any[];
  deliverables_status: Record<string, any>;
  proposal_sent_at: string | null;
  contract_signed_at: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  workspace_id: string;
  name: string;
  company_name: string | null;
  partner_type: string;
  contact_name: string | null;
  contact_email: string | null;
  social_handles: Record<string, any>;
  reach: number;
  engagement_rate: number;
  partnership_value: number;
  commission_percentage: number;
  deliverables: any[];
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  announcement_type: string;
  target_audience: string;
  channels: string[];
  scheduled_for: string | null;
  sent_at: string | null;
  status: string;
  sent_by: string | null;
  recipients_count: number;
  created_at: string;
  updated_at: string;
}

export interface PRContact {
  id: string;
  workspace_id: string;
  name: string;
  outlet_name: string | null;
  contact_type: string;
  email: string | null;
  phone: string | null;
  social_handles: Record<string, any>;
  beat: string | null;
  last_contacted_at: string | null;
  response_rate: number;
  notes: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  workspace_id: string;
  title: string;
  category: string;
  current_value: number;
  target_value: number;
  unit: string;
  due_date: string | null;
  trend: string;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Campaigns
export function useCampaigns(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-campaigns', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateCampaign(workspaceId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      const { data, error } = await supabase
        .from('workspace_campaigns')
        .insert({
          workspace_id: workspaceId,
          name: campaign.name || 'New Campaign',
          description: campaign.description,
          channel: campaign.channel || 'multi-channel',
          status: campaign.status || 'draft',
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: campaign.budget || 0,
          target_audience: campaign.target_audience || {},
          utm_params: campaign.utm_params || {},
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-campaigns', workspaceId] });
      toast.success('Campaign created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + error.message);
    },
  });
}

export function useUpdateCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-campaigns', workspaceId] });
      toast.success('Campaign updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update campaign: ' + error.message);
    },
  });
}

export function useDeleteCampaign(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-campaigns', workspaceId] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete campaign: ' + error.message);
    },
  });
}

// Sponsors
export function useSponsors(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-sponsors', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_sponsors')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Sponsor[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateSponsor(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sponsor: Partial<Sponsor>) => {
      const { data, error } = await supabase
        .from('workspace_sponsors')
        .insert({
          workspace_id: workspaceId,
          name: sponsor.name || 'New Sponsor',
          company_name: sponsor.company_name,
          tier: sponsor.tier || 'bronze',
          contact_name: sponsor.contact_name,
          contact_email: sponsor.contact_email,
          contact_phone: sponsor.contact_phone,
          contract_value: sponsor.contract_value || 0,
          deliverables: sponsor.deliverables || [],
          notes: sponsor.notes,
          status: sponsor.status || 'prospect',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sponsors', workspaceId] });
      toast.success('Sponsor added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add sponsor: ' + error.message);
    },
  });
}

export function useUpdateSponsor(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Sponsor> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_sponsors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sponsors', workspaceId] });
      toast.success('Sponsor updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update sponsor: ' + error.message);
    },
  });
}

export function useDeleteSponsor(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_sponsors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-sponsors', workspaceId] });
      toast.success('Sponsor deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete sponsor: ' + error.message);
    },
  });
}

// Partners
export function usePartners(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-partners', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_partners')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Partner[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreatePartner(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partner: Partial<Partner>) => {
      const { data, error } = await supabase
        .from('workspace_partners')
        .insert({
          workspace_id: workspaceId,
          name: partner.name || 'New Partner',
          company_name: partner.company_name,
          partner_type: partner.partner_type || 'strategic',
          contact_name: partner.contact_name,
          contact_email: partner.contact_email,
          social_handles: partner.social_handles || {},
          reach: partner.reach || 0,
          engagement_rate: partner.engagement_rate || 0,
          partnership_value: partner.partnership_value || 0,
          commission_percentage: partner.commission_percentage || 0,
          deliverables: partner.deliverables || [],
          notes: partner.notes,
          status: partner.status || 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-partners', workspaceId] });
      toast.success('Partner added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add partner: ' + error.message);
    },
  });
}

export function useUpdatePartner(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-partners', workspaceId] });
      toast.success('Partner updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update partner: ' + error.message);
    },
  });
}

export function useDeletePartner(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_partners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-partners', workspaceId] });
      toast.success('Partner deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete partner: ' + error.message);
    },
  });
}

// Announcements
export function useAnnouncements(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-announcements', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateAnnouncement(workspaceId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (announcement: Partial<Announcement>) => {
      const { data, error } = await supabase
        .from('workspace_announcements')
        .insert({
          workspace_id: workspaceId,
          title: announcement.title || 'New Announcement',
          content: announcement.content || '',
          announcement_type: announcement.announcement_type || 'general',
          target_audience: announcement.target_audience || 'all',
          channels: announcement.channels || ['in-app'],
          scheduled_for: announcement.scheduled_for,
          status: announcement.status || 'draft',
          sent_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-announcements', workspaceId] });
      toast.success('Announcement created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create announcement: ' + error.message);
    },
  });
}

export function useSendAnnouncement(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('workspace_announcements')
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
      queryClient.invalidateQueries({ queryKey: ['workspace-announcements', workspaceId] });
      toast.success('Announcement sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send announcement: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['workspace-announcements', workspaceId] });
      toast.success('Announcement deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete announcement: ' + error.message);
    },
  });
}

// PR Contacts
export function usePRContacts(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-pr-contacts', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_pr_contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PRContact[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreatePRContact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Partial<PRContact>) => {
      const { data, error } = await supabase
        .from('workspace_pr_contacts')
        .insert({
          workspace_id: workspaceId,
          name: contact.name || 'New Contact',
          outlet_name: contact.outlet_name,
          contact_type: contact.contact_type || 'journalist',
          email: contact.email,
          phone: contact.phone,
          social_handles: contact.social_handles || {},
          beat: contact.beat,
          notes: contact.notes,
          priority: contact.priority || 'medium',
          status: contact.status || 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-pr-contacts', workspaceId] });
      toast.success('PR contact added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add PR contact: ' + error.message);
    },
  });
}

export function useUpdatePRContact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PRContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_pr_contacts')
        .update({
          ...updates,
          last_contacted_at: updates.last_contacted_at || new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-pr-contacts', workspaceId] });
      toast.success('PR contact updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update PR contact: ' + error.message);
    },
  });
}

export function useDeletePRContact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_pr_contacts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-pr-contacts', workspaceId] });
      toast.success('PR contact deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete PR contact: ' + error.message);
    },
  });
}

// Goals
export function useGoals(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-goals', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Map database fields to Goal interface
      return (data || []).map(g => ({
        ...g,
        current_value: g.current_value ?? 0,
        target_value: g.target_value ?? 0,
        unit: g.unit ?? 'count',
        trend: 'stable',
        notes: g.description,
        created_by: null,
      })) as Goal[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateGoal(workspaceId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (goal: Partial<Goal>) => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .insert({
          workspace_id: workspaceId,
          title: goal.title || 'New Goal',
          category: goal.category || 'reach',
          current_value: goal.current_value || 0,
          target_value: goal.target_value || 100,
          unit: goal.unit || 'count',
          due_date: goal.due_date,
          trend: goal.trend || 'stable',
          status: goal.status || 'active',
          notes: goal.notes,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
      toast.success('Goal created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create goal: ' + error.message);
    },
  });
}

export function useUpdateGoal(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
      toast.success('Goal updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update goal: ' + error.message);
    },
  });
}

export function useDeleteGoal(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspace_goals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-goals', workspaceId] });
      toast.success('Goal deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete goal: ' + error.message);
    },
  });
}

// Analytics Aggregation
export function useGrowthAnalytics(workspaceId: string) {
  const { data: campaigns } = useCampaigns(workspaceId);
  const { data: sponsors } = useSponsors(workspaceId);
  const { data: partners } = usePartners(workspaceId);
  const { data: goals } = useGoals(workspaceId);

  const analytics = {
    totalCampaigns: campaigns?.length || 0,
    activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
    totalImpressions: campaigns?.reduce((sum, c) => sum + c.impressions, 0) || 0,
    totalClicks: campaigns?.reduce((sum, c) => sum + c.clicks, 0) || 0,
    totalConversions: campaigns?.reduce((sum, c) => sum + c.conversions, 0) || 0,
    totalBudget: campaigns?.reduce((sum, c) => sum + c.budget, 0) || 0,
    totalSpent: campaigns?.reduce((sum, c) => sum + c.spent, 0) || 0,
    ctr: campaigns?.length 
      ? ((campaigns.reduce((sum, c) => sum + c.clicks, 0) / Math.max(campaigns.reduce((sum, c) => sum + c.impressions, 0), 1)) * 100).toFixed(2)
      : '0.00',
    totalSponsors: sponsors?.length || 0,
    confirmedSponsors: sponsors?.filter(s => s.status === 'confirmed').length || 0,
    sponsorRevenue: sponsors?.filter(s => s.status === 'confirmed').reduce((sum, s) => sum + s.contract_value, 0) || 0,
    totalPartners: partners?.length || 0,
    activePartners: partners?.filter(p => p.status === 'active').length || 0,
    totalGoals: goals?.length || 0,
    achievedGoals: goals?.filter(g => g.status === 'achieved').length || 0,
  };

  return analytics;
}
