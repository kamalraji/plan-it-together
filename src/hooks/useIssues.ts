import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueCategory = 'equipment' | 'network' | 'power' | 'av' | 'software' | 'general';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Issue {
  id: string;
  workspace_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  priority: IssuePriority;
  category: IssueCategory;
  status: IssueStatus;
  reporter_id: string | null;
  reporter_name: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  resolved_at: string | null;
  resolved_by_id: string | null;
  resolved_by_name: string | null;
  resolution_notes: string | null;
  escalated_to_incident: boolean;
  incident_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  location?: string;
  priority?: IssuePriority;
  category?: IssueCategory;
  reporter_name?: string;
}

export interface IssueStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  total: number;
}

export function useIssues(workspaceId: string, eventId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['workspace-issues', workspaceId];

  // Fetch issues
  const { data: issues = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_issues')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Issue[];
    },
    enabled: !!workspaceId,
  });

  // Calculate stats
  const stats: IssueStats = {
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    closed: issues.filter(i => i.status === 'closed').length,
    critical: issues.filter(i => i.priority === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length,
    total: issues.length,
  };

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`workspace-issues-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_issues',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  // Create issue mutation
  const createIssue = useMutation({
    mutationFn: async (input: CreateIssueInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('workspace_issues')
        .insert({
          workspace_id: workspaceId,
          event_id: eventId || null,
          title: input.title,
          description: input.description || null,
          location: input.location || null,
          priority: input.priority || 'medium',
          category: input.category || 'general',
          reporter_id: userData.user?.id || null,
          reporter_name: input.reporter_name || userData.user?.email || 'Unknown',
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Issue Reported',
        description: 'The issue has been logged successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update issue mutation
  const updateIssue = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Issue> & { id: string }) => {
      const { data, error } = await supabase
        .from('workspace_issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Assign issue
  const assignIssue = async (issueId: string, assigneeId: string, assigneeName: string) => {
    await updateIssue.mutateAsync({
      id: issueId,
      assignee_id: assigneeId,
      assignee_name: assigneeName,
    });
    toast({
      title: 'Issue Assigned',
      description: `Assigned to ${assigneeName}`,
    });
  };

  // Start working on issue
  const startWorking = async (issueId: string) => {
    await updateIssue.mutateAsync({
      id: issueId,
      status: 'in_progress',
    });
    toast({
      title: 'Status Updated',
      description: 'Issue marked as In Progress',
    });
  };

  // Resolve issue
  const resolveIssue = async (issueId: string, resolutionNotes?: string) => {
    const { data: userData } = await supabase.auth.getUser();
    
    await updateIssue.mutateAsync({
      id: issueId,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by_id: userData.user?.id || null,
      resolved_by_name: userData.user?.email || 'Unknown',
      resolution_notes: resolutionNotes || null,
    });
    toast({
      title: 'Issue Resolved',
      description: 'The issue has been marked as resolved.',
    });
  };

  // Close issue
  const closeIssue = async (issueId: string) => {
    await updateIssue.mutateAsync({
      id: issueId,
      status: 'closed',
    });
    toast({
      title: 'Issue Closed',
      description: 'The issue has been closed.',
    });
  };

  // Reopen issue
  const reopenIssue = async (issueId: string) => {
    await updateIssue.mutateAsync({
      id: issueId,
      status: 'open',
      resolved_at: null,
      resolved_by_id: null,
      resolved_by_name: null,
      resolution_notes: null,
    });
    toast({
      title: 'Issue Reopened',
      description: 'The issue has been reopened.',
    });
  };

  // Escalate to incident
  const escalateToIncident = async (issue: Issue) => {
    const { data: userData } = await supabase.auth.getUser();
    
    // Create incident from issue
    const { data: incident, error: incidentError } = await supabase
      .from('workspace_incidents')
      .insert({
        workspace_id: workspaceId,
        event_id: eventId || null,
        title: `[Escalated] ${issue.title}`,
        description: issue.description,
        incident_type: issue.category === 'equipment' ? 'equipment_failure' 
          : issue.category === 'power' ? 'power_outage'
          : issue.category === 'network' ? 'network_issue'
          : 'other',
        severity: issue.priority === 'critical' ? 'critical'
          : issue.priority === 'high' ? 'major'
          : 'minor',
        status: 'investigating',
        reported_by: userData.user?.id || null,
        reported_by_name: issue.reporter_name || 'Unknown',
        affected_area: issue.location,
      })
      .select()
      .single();

    if (incidentError) throw incidentError;

    // Update issue with incident reference
    await updateIssue.mutateAsync({
      id: issue.id,
      escalated_to_incident: true,
      incident_id: incident.id,
      status: 'closed',
    });

    toast({
      title: 'Escalated to Incident',
      description: 'A formal incident has been created from this issue.',
    });

    return incident;
  };

  // Delete issue mutation
  const deleteIssue = useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase
        .from('workspace_issues')
        .delete()
        .eq('id', issueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Issue Deleted',
        description: 'The issue has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    issues,
    stats,
    isLoading,
    error,
    createIssue,
    updateIssue,
    assignIssue,
    startWorking,
    resolveIssue,
    closeIssue,
    reopenIssue,
    escalateToIncident,
    deleteIssue,
    isSaving: createIssue.isPending || updateIssue.isPending,
  };
}
