/**
 * Workspace API Hooks
 * 
 * Hooks for interacting with workspace-related edge functions.
 * These hooks provide a clean interface for workspace analytics, channels, reports, and presence.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SUPABASE_URL = "https://ltsniuflqfahdcirrmjh.supabase.co";

// Helper to get auth token
async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token 
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

// ============ WORKSPACE ANALYTICS ============

export interface WorkspaceAnalytics {
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    overdue: number;
    completionRate: number;
    avgCompletionTimeHours: number | null;
  };
  team: {
    totalMembers: number;
    activeMembers: number;
    tasksPerMember: number;
    topPerformers: Array<{ userId: string; name: string; completedTasks: number }>;
  };
  budget: {
    totalAllocated: number;
    totalSpent: number;
    pendingRequests: number;
    utilizationRate: number;
  };
  health: {
    score: number;
    indicators: {
      taskVelocity: 'good' | 'warning' | 'critical';
      teamEngagement: 'good' | 'warning' | 'critical';
      budgetHealth: 'good' | 'warning' | 'critical';
      overdueRisk: 'good' | 'warning' | 'critical';
    };
  };
  trends: {
    tasksCompletedLastWeek: number;
    tasksCompletedThisWeek: number;
    weekOverWeekChange: number;
  };
}

export function useWorkspaceAnalytics(workspaceId: string, includeChildren = false) {
  return useQuery({
    queryKey: ['workspace-analytics', workspaceId, includeChildren],
    queryFn: async (): Promise<WorkspaceAnalytics> => {
      const headers = await getAuthHeader();
      const url = `${SUPABASE_URL}/functions/v1/workspace-analytics?workspaceId=${workspaceId}&includeChildren=${includeChildren}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analytics');
      }

      return response.json();
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// ============ WORKSPACE CHANNELS ============

export interface WorkspaceChannel {
  id: string;
  name: string;
  description: string | null;
  channel_type: 'general' | 'announcements' | 'tasks' | 'social' | 'private';
  is_private: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  hasUnread?: boolean;
  memberCount?: number;
}

export function useWorkspaceChannelsList(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-channels', workspaceId],
    queryFn: async (): Promise<WorkspaceChannel[]> => {
      const headers = await getAuthHeader();
      const url = `${SUPABASE_URL}/functions/v1/workspace-channels?workspaceId=${workspaceId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch channels');
      }

      const data = await response.json();
      return data.channels || [];
    },
    enabled: !!workspaceId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      name: string;
      description?: string;
      channelType?: 'general' | 'announcements' | 'tasks' | 'social' | 'private';
      isPrivate?: boolean;
      members?: string[];
    }) => {
      const headers = await getAuthHeader();
      const url = `${SUPABASE_URL}/functions/v1/workspace-channels?workspaceId=${params.workspaceId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          workspaceId: params.workspaceId,
          name: params.name,
          description: params.description,
          channelType: params.channelType,
          isPrivate: params.isPrivate,
          members: params.members,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create channel');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-channels', variables.workspaceId] });
      toast({
        title: 'Channel created',
        description: `Channel "${variables.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ CHANNEL MESSAGES ============

export interface ChannelMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  attachments: unknown[] | null;
  message_type: string;
  is_edited: boolean;
  created_at: string;
  edited_at: string | null;
}

export function useChannelMessages(channelId: string, limit = 50) {
  return useQuery({
    queryKey: ['channel-messages', channelId],
    queryFn: async (): Promise<{ messages: ChannelMessage[]; hasMore: boolean; nextCursor: string | null }> => {
      const headers = await getAuthHeader();
      const url = `${SUPABASE_URL}/functions/v1/channel-messages?channelId=${channelId}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch messages');
      }

      return response.json();
    },
    enabled: !!channelId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      channelId: string;
      content: string;
      attachments?: Array<{ type: string; url: string; name: string; size?: number }>;
      replyToId?: string;
    }) => {
      const headers = await getAuthHeader();
      const url = `${SUPABASE_URL}/functions/v1/channel-messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel-messages', variables.channelId] });
    },
    onError: (error) => {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ WORKSPACE REPORTS ============

export type ReportType = 'tasks' | 'budget' | 'team' | 'activity' | 'comprehensive';
export type ReportFormat = 'csv' | 'json';

export function useGenerateReport() {
  return useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      reportType: ReportType;
      format: ReportFormat;
      dateRange?: { start: string; end: string };
      includeChildren?: boolean;
    }) => {
      const headers = await getAuthHeader();
      const url = `${SUPABASE_URL}/functions/v1/workspace-reports`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      // Handle CSV download
      if (params.format === 'csv') {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${params.reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        return { success: true };
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Report generated',
        description: `Your ${variables.reportType} report has been generated.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error generating report',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ WORKSPACE PRESENCE ============

export function useWorkspacePresence(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-presence', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_presence')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 mins

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useUpdatePresence() {
  return useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      status: 'online' | 'away' | 'busy' | 'offline';
      currentActivity?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('workspace_presence')
        .upsert({
          user_id: user.id,
          workspace_id: params.workspaceId,
          status: params.status,
          current_activity: params.currentActivity,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,workspace_id',
        });

      if (error) throw error;
      return { success: true };
    },
  });
}

// ============ ESCALATION HISTORY ============

export function useEscalationHistory(workspaceId: string) {
  return useQuery({
    queryKey: ['escalation-history', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalation_history')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

// ============ SCHEDULED REPORTS ============

export function useScheduledReports(workspaceId: string) {
  return useQuery({
    queryKey: ['scheduled-reports', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      reportType: ReportType;
      format: ReportFormat;
      frequency: 'daily' | 'weekly' | 'monthly';
      includeChildren?: boolean;
      recipients?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          workspace_id: params.workspaceId,
          created_by: user.id,
          report_type: params.reportType,
          format: params.format,
          frequency: params.frequency,
          include_children: params.includeChildren || false,
          recipients: params.recipients || [],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', variables.workspaceId] });
      toast({
        title: 'Report scheduled',
        description: `Your ${variables.frequency} ${variables.reportType} report has been scheduled.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error scheduling report',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
