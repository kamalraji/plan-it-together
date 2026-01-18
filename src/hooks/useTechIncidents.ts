import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface TechIncident {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  incidentType: string;
  affectedSystems: string[];
  rootCause: string | null;
  impactAssessment: string | null;
  timeToResolveMinutes: number | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  postEventNotes: string | null;
  lessonsLearned: string | null;
  preventiveActions: string | null;
  isRecurring: boolean;
  relatedIncidentId: string | null;
  reportedBy: string | null;
  reportedByName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseTechIncidentsOptions {
  workspaceId: string;
}

export function useTechIncidents({ workspaceId }: UseTechIncidentsOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['tech-incidents', workspaceId];

  const { data: incidents = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_incidents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToTechIncident);
    },
    enabled: !!workspaceId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`tech-incidents-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_incidents',
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

  const createIncident = useMutation({
    mutationFn: async (data: Partial<TechIncident>) => {
      const { error } = await supabase.from('workspace_incidents').insert([{
        workspace_id: workspaceId,
        title: data.title || 'Untitled Incident',
        description: data.description,
        severity: data.severity || 'medium',
        status: 'open',
        incident_type: data.incidentType || 'technical',
        affected_systems: data.affectedSystems || [],
        reported_by: data.reportedBy,
        reported_by_name: data.reportedByName,
        assigned_to: data.assignedTo,
        assigned_to_name: data.assignedToName,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Incident reported');
    },
    onError: () => toast.error('Failed to create incident'),
  });

  const updateIncident = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<TechIncident>) => {
      const { error } = await supabase
        .from('workspace_incidents')
        .update({
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: data.status,
          incident_type: data.incidentType,
          affected_systems: data.affectedSystems,
          assigned_to: data.assignedTo,
          assigned_to_name: data.assignedToName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Incident updated');
    },
    onError: () => toast.error('Failed to update incident'),
  });

  const resolveIncident = useMutation({
    mutationFn: async ({ id, resolution, timeToResolve }: { id: string; resolution: string; timeToResolve?: number }) => {
      const { error } = await supabase
        .from('workspace_incidents')
        .update({
          status: 'resolved',
          resolution,
          resolved_at: new Date().toISOString(),
          time_to_resolve_minutes: timeToResolve,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Incident resolved');
    },
    onError: () => toast.error('Failed to resolve incident'),
  });

  const addRootCause = useMutation({
    mutationFn: async ({ id, rootCause, impactAssessment, preventiveActions }: { 
      id: string; 
      rootCause: string; 
      impactAssessment?: string;
      preventiveActions?: string;
    }) => {
      const { error } = await supabase
        .from('workspace_incidents')
        .update({
          root_cause: rootCause,
          impact_assessment: impactAssessment,
          preventive_actions: preventiveActions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Root cause analysis added');
    },
    onError: () => toast.error('Failed to add root cause'),
  });

  const markReviewed = useMutation({
    mutationFn: async ({ id, reviewerId, postEventNotes, lessonsLearned }: { 
      id: string; 
      reviewerId: string;
      postEventNotes?: string;
      lessonsLearned?: string;
    }) => {
      const { error } = await supabase
        .from('workspace_incidents')
        .update({
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          post_event_notes: postEventNotes,
          lessons_learned: lessonsLearned,
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Incident reviewed and closed');
    },
    onError: () => toast.error('Failed to mark as reviewed'),
  });

  const markRecurring = useMutation({
    mutationFn: async ({ id, relatedIncidentId }: { id: string; relatedIncidentId?: string }) => {
      const { error } = await supabase
        .from('workspace_incidents')
        .update({
          is_recurring: true,
          related_incident_id: relatedIncidentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Marked as recurring incident');
    },
    onError: () => toast.error('Failed to update'),
  });

  // Stats
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
  const needsRCA = incidents.filter(i => (i.status === 'resolved' || i.status === 'closed') && !i.rootCause);
  const pendingReview = incidents.filter(i => i.status === 'resolved' && !i.reviewedAt);
  const recurringIncidents = incidents.filter(i => i.isRecurring);

  const avgResolutionTime = resolvedIncidents.length > 0
    ? resolvedIncidents.reduce((acc, i) => acc + (i.timeToResolveMinutes || 0), 0) / resolvedIncidents.filter(i => i.timeToResolveMinutes).length
    : 0;

  return {
    incidents,
    isLoading,
    stats: {
      open: openIncidents.length,
      critical: criticalIncidents.length,
      needsRCA: needsRCA.length,
      pendingReview: pendingReview.length,
      recurring: recurringIncidents.length,
      avgResolutionTime: Math.round(avgResolutionTime),
    },
    createIncident: createIncident.mutateAsync,
    updateIncident: updateIncident.mutateAsync,
    resolveIncident: resolveIncident.mutateAsync,
    addRootCause: addRootCause.mutateAsync,
    markReviewed: markReviewed.mutateAsync,
    markRecurring: markRecurring.mutateAsync,
  };
}

function mapToTechIncident(row: any): TechIncident {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    incidentType: row.incident_type || 'general',
    affectedSystems: row.affected_systems || [],
    rootCause: row.root_cause,
    impactAssessment: row.impact_assessment,
    timeToResolveMinutes: row.time_to_resolve_minutes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    postEventNotes: row.post_event_notes,
    lessonsLearned: row.lessons_learned,
    preventiveActions: row.preventive_actions,
    isRecurring: row.is_recurring || false,
    relatedIncidentId: row.related_incident_id,
    reportedBy: row.reported_by,
    reportedByName: row.reported_by_name,
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name,
    resolvedAt: row.resolved_at,
    resolution: row.resolution,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
