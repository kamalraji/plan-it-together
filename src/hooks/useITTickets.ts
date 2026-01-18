import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface ITTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  category: 'software' | 'hardware' | 'access' | 'network' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'new' | 'assigned' | 'in_progress' | 'pending_info' | 'escalated' | 'resolved' | 'closed';
  requesterId: string | null;
  requesterName: string;
  requesterEmail: string | null;
  requesterDepartment: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  escalatedToId: string | null;
  escalatedToName: string | null;
  escalationLevel: number;
  escalationReason: string | null;
  escalatedAt: string | null;
  slaResponseDeadline: string | null;
  slaResolutionDeadline: string | null;
  firstResponseAt: string | null;
  slaResponseBreached: boolean;
  slaResolutionBreached: boolean;
  resolutionNotes: string | null;
  resolutionCategory: string | null;
  resolvedAt: string | null;
  resolvedById: string | null;
  resolvedByName: string | null;
  relatedAssetId: string | null;
  relatedAssetName: string | null;
  relatedLicenseId: string | null;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  affectedUsersCount: number;
  internalNotes: string | null;
  satisfactionRating: number | null;
  satisfactionFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ITTicketStats {
  total: number;
  open: number;
  new: number;
  inProgress: number;
  escalated: number;
  resolved: number;
  slaBreached: number;
  avgResolutionTime: string;
  byPriority: Record<ITTicket['priority'], number>;
  byCategory: Record<ITTicket['category'], number>;
}

export interface CreateITTicketInput {
  workspaceId: string;
  eventId?: string;
  title: string;
  description?: string;
  category?: ITTicket['category'];
  priority?: ITTicket['priority'];
  requesterName: string;
  requesterEmail?: string;
  requesterDepartment?: string;
  impactLevel?: ITTicket['impactLevel'];
  affectedUsersCount?: number;
  relatedAssetName?: string;
  relatedLicenseId?: string;
}

export interface UpdateITTicketInput {
  id: string;
  title?: string;
  description?: string;
  category?: ITTicket['category'];
  priority?: ITTicket['priority'];
  status?: ITTicket['status'];
  assignedToId?: string;
  assignedToName?: string;
  escalatedToId?: string;
  escalatedToName?: string;
  escalationLevel?: number;
  escalationReason?: string;
  resolutionNotes?: string;
  resolutionCategory?: string;
  internalNotes?: string;
  impactLevel?: ITTicket['impactLevel'];
  affectedUsersCount?: number;
}

// Transform DB row to frontend type
function transformTicket(row: any): ITTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterDepartment: row.requester_department,
    assignedToId: row.assigned_to_id,
    assignedToName: row.assigned_to_name,
    escalatedToId: row.escalated_to_id,
    escalatedToName: row.escalated_to_name,
    escalationLevel: row.escalation_level || 0,
    escalationReason: row.escalation_reason,
    escalatedAt: row.escalated_at,
    slaResponseDeadline: row.sla_response_deadline,
    slaResolutionDeadline: row.sla_resolution_deadline,
    firstResponseAt: row.first_response_at,
    slaResponseBreached: row.sla_response_breached || false,
    slaResolutionBreached: row.sla_resolution_breached || false,
    resolutionNotes: row.resolution_notes,
    resolutionCategory: row.resolution_category,
    resolvedAt: row.resolved_at,
    resolvedById: row.resolved_by_id,
    resolvedByName: row.resolved_by_name,
    relatedAssetId: row.related_asset_id,
    relatedAssetName: row.related_asset_name,
    relatedLicenseId: row.related_license_id,
    impactLevel: row.impact_level || 'low',
    affectedUsersCount: row.affected_users_count || 1,
    internalNotes: row.internal_notes,
    satisfactionRating: row.satisfaction_rating,
    satisfactionFeedback: row.satisfaction_feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

// Calculate time until deadline
function getTimeUntilDeadline(deadline: string | null): { text: string; isOverdue: boolean; isUrgent: boolean } {
  if (!deadline) return { text: 'No SLA', isOverdue: false, isUrgent: false };
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  
  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueMins = Math.floor(overdueMs / 60000);
    const overdueHours = Math.floor(overdueMs / 3600000);
    if (overdueHours > 0) return { text: `${overdueHours}h overdue`, isOverdue: true, isUrgent: true };
    return { text: `${overdueMins}m overdue`, isOverdue: true, isUrgent: true };
  }
  
  const minsLeft = Math.floor(diffMs / 60000);
  const hoursLeft = Math.floor(diffMs / 3600000);
  
  if (hoursLeft > 24) return { text: `${Math.floor(hoursLeft / 24)}d left`, isOverdue: false, isUrgent: false };
  if (hoursLeft > 0) return { text: `${hoursLeft}h left`, isOverdue: false, isUrgent: hoursLeft < 2 };
  return { text: `${minsLeft}m left`, isOverdue: false, isUrgent: true };
}

export function useITTickets(workspaceId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['it-tickets', workspaceId];

  // Fetch tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<ITTicket[]> => {
      const { data, error } = await supabase
        .from('workspace_it_tickets')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching IT tickets:', error);
        throw error;
      }

      return (data || []).map(transformTicket);
    },
    enabled: !!workspaceId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`it-tickets-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_it_tickets',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey });
          
          if (payload.eventType === 'INSERT') {
            toast.info('New IT ticket created');
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status;
            if (newStatus === 'resolved') {
              toast.success('Ticket resolved');
            } else if (newStatus === 'escalated') {
              toast.warning('Ticket escalated');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (input: CreateITTicketInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('workspace_it_tickets')
        .insert([{
          workspace_id: input.workspaceId,
          event_id: input.eventId,
          ticket_number: 'TEMP', // Will be overwritten by trigger
          title: input.title,
          description: input.description,
          category: input.category || 'other',
          priority: input.priority || 'medium',
          requester_name: input.requesterName,
          requester_email: input.requesterEmail,
          requester_department: input.requesterDepartment,
          requester_id: userData?.user?.id,
          impact_level: input.impactLevel || 'low',
          affected_users_count: input.affectedUsersCount || 1,
          related_asset_name: input.relatedAssetName,
          related_license_id: input.relatedLicenseId,
          created_by_id: userData?.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return transformTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('IT ticket created successfully');
    },
    onError: (error) => {
      console.error('Error creating IT ticket:', error);
      toast.error('Failed to create IT ticket');
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (input: UpdateITTicketInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const updateData: Record<string, any> = {};
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.status !== undefined) {
        updateData.status = input.status;
        // Mark resolution details
        if (input.status === 'resolved' || input.status === 'closed') {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by_id = userData?.user?.id;
        }
      }
      if (input.assignedToId !== undefined) {
        updateData.assigned_to_id = input.assignedToId;
        updateData.assigned_to_name = input.assignedToName;
        // Mark first response if assigning
        updateData.first_response_at = new Date().toISOString();
      }
      if (input.escalatedToId !== undefined) {
        updateData.escalated_to_id = input.escalatedToId;
        updateData.escalated_to_name = input.escalatedToName;
        updateData.escalated_at = new Date().toISOString();
      }
      if (input.escalationLevel !== undefined) updateData.escalation_level = input.escalationLevel;
      if (input.escalationReason !== undefined) updateData.escalation_reason = input.escalationReason;
      if (input.resolutionNotes !== undefined) updateData.resolution_notes = input.resolutionNotes;
      if (input.resolutionCategory !== undefined) updateData.resolution_category = input.resolutionCategory;
      if (input.internalNotes !== undefined) updateData.internal_notes = input.internalNotes;
      if (input.impactLevel !== undefined) updateData.impact_level = input.impactLevel;
      if (input.affectedUsersCount !== undefined) updateData.affected_users_count = input.affectedUsersCount;

      const { data, error } = await supabase
        .from('workspace_it_tickets')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return transformTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Ticket updated successfully');
    },
    onError: (error) => {
      console.error('Error updating IT ticket:', error);
      toast.error('Failed to update ticket');
    },
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('workspace_it_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Ticket deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting IT ticket:', error);
      toast.error('Failed to delete ticket');
    },
  });

  // Escalate ticket mutation
  const escalateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, escalatedToName, reason }: { ticketId: string; escalatedToName: string; reason: string }) => {
      const ticket = tickets.find(t => t.id === ticketId);
      
      const { data, error } = await supabase
        .from('workspace_it_tickets')
        .update({
          status: 'escalated',
          escalated_to_name: escalatedToName,
          escalation_level: (ticket?.escalationLevel || 0) + 1,
          escalation_reason: reason,
          escalated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return transformTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.warning('Ticket escalated');
    },
    onError: (error) => {
      console.error('Error escalating ticket:', error);
      toast.error('Failed to escalate ticket');
    },
  });

  // Resolve ticket mutation
  const resolveTicketMutation = useMutation({
    mutationFn: async ({ ticketId, resolutionNotes, resolutionCategory }: { ticketId: string; resolutionNotes: string; resolutionCategory?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('workspace_it_tickets')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolution_category: resolutionCategory,
          resolved_at: new Date().toISOString(),
          resolved_by_id: userData?.user?.id,
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return transformTicket(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Ticket resolved');
    },
    onError: (error) => {
      console.error('Error resolving ticket:', error);
      toast.error('Failed to resolve ticket');
    },
  });

  // Calculate stats
  const stats: ITTicketStats = {
    total: tickets.length,
    open: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
    new: tickets.filter(t => t.status === 'new').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    escalated: tickets.filter(t => t.status === 'escalated').length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    slaBreached: tickets.filter(t => t.slaResponseBreached || t.slaResolutionBreached).length,
    avgResolutionTime: calculateAvgResolutionTime(tickets),
    byPriority: {
      low: tickets.filter(t => t.priority === 'low').length,
      medium: tickets.filter(t => t.priority === 'medium').length,
      high: tickets.filter(t => t.priority === 'high').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length,
      critical: tickets.filter(t => t.priority === 'critical').length,
    },
    byCategory: {
      software: tickets.filter(t => t.category === 'software').length,
      hardware: tickets.filter(t => t.category === 'hardware').length,
      access: tickets.filter(t => t.category === 'access').length,
      network: tickets.filter(t => t.category === 'network').length,
      security: tickets.filter(t => t.category === 'security').length,
      other: tickets.filter(t => t.category === 'other').length,
    },
  };

  return {
    tickets,
    stats,
    isLoading,
    error,
    createTicket: createTicketMutation.mutate,
    updateTicket: updateTicketMutation.mutate,
    deleteTicket: deleteTicketMutation.mutate,
    escalateTicket: escalateTicketMutation.mutate,
    resolveTicket: resolveTicketMutation.mutate,
    isCreating: createTicketMutation.isPending,
    isUpdating: updateTicketMutation.isPending,
    formatRelativeTime,
    getTimeUntilDeadline,
  };
}

function calculateAvgResolutionTime(tickets: ITTicket[]): string {
  const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt);
  if (resolvedTickets.length === 0) return 'N/A';
  
  const totalMs = resolvedTickets.reduce((sum, t) => {
    const created = new Date(t.createdAt).getTime();
    const resolved = new Date(t.resolvedAt!).getTime();
    return sum + (resolved - created);
  }, 0);
  
  const avgMs = totalMs / resolvedTickets.length;
  const avgHours = Math.floor(avgMs / 3600000);
  const avgMins = Math.floor((avgMs % 3600000) / 60000);
  
  if (avgHours > 24) return `${Math.floor(avgHours / 24)}d ${avgHours % 24}h`;
  if (avgHours > 0) return `${avgHours}h ${avgMins}m`;
  return `${avgMins}m`;
}
