import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { SUPPORT_TICKET_COLUMNS, USER_PROFILE_COLUMNS } from '@/lib/supabase-columns';

type TicketPriority = Database['public']['Enums']['support_ticket_priority'];
type TicketStatus = Database['public']['Enums']['support_ticket_status'];
type TicketCategory = Database['public']['Enums']['support_ticket_category'];

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  location: string | null;
  affectedSystem: string | null;
  reporterId: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assignedAt: Date | null;
  slaResponseDeadline: Date | null;
  slaResolutionDeadline: Date | null;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
  resolvedByName: string | null;
  resolutionNotes: string | null;
  isEscalated: boolean;
  escalatedAt: Date | null;
  escalationReason: string | null;
  linkedIncidentId: string | null;
  tags: string[];
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  activityType: string;
  previousValue: string | null;
  newValue: string | null;
  comment: string | null;
  performedByName: string | null;
  createdAt: Date;
}

export interface TicketStats {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  pending: number;
  resolved: number;
  critical: number;
  breachedSla: number;
}

interface CreateTicketInput {
  title: string;
  description?: string;
  category: TicketCategory;
  priority: TicketPriority;
  location?: string;
  affectedSystem?: string;
  reporterName?: string;
  reporterEmail?: string;
  tags?: string[];
}

interface UpdateTicketInput {
  id: string;
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  location?: string;
  affectedSystem?: string;
  internalNotes?: string;
  resolutionNotes?: string;
  tags?: string[];
}

export function useSupportTickets(workspaceId: string, eventId?: string) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .maybeSingle();
        setUserName(profile?.full_name || data.user.email || 'Unknown');
      }
    });
  }, []);

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_support_tickets')
        .select(SUPPORT_TICKET_COLUMNS.detail)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names for assignees and resolvers
      const userIds = new Set<string>();
      data?.forEach(ticket => {
        if (ticket.assignee_id) userIds.add(ticket.assignee_id);
        if (ticket.resolved_by) userIds.add(ticket.resolved_by);
      });

      let userProfiles: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));
        
        profiles?.forEach(p => {
          userProfiles[p.id] = p.full_name || 'Unknown';
        });
      }

      return (data || []).map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        location: ticket.location,
        affectedSystem: ticket.affected_system,
        reporterId: ticket.reporter_id,
        reporterName: ticket.reporter_name,
        reporterEmail: ticket.reporter_email,
        assigneeId: ticket.assignee_id,
        assigneeName: ticket.assignee_id ? userProfiles[ticket.assignee_id] || null : null,
        assignedAt: ticket.assigned_at ? new Date(ticket.assigned_at) : null,
        slaResponseDeadline: ticket.sla_response_deadline ? new Date(ticket.sla_response_deadline) : null,
        slaResolutionDeadline: ticket.sla_resolution_deadline ? new Date(ticket.sla_resolution_deadline) : null,
        firstResponseAt: ticket.first_response_at ? new Date(ticket.first_response_at) : null,
        resolvedAt: ticket.resolved_at ? new Date(ticket.resolved_at) : null,
        resolvedByName: ticket.resolved_by ? userProfiles[ticket.resolved_by] || null : null,
        resolutionNotes: ticket.resolution_notes,
        isEscalated: ticket.is_escalated || false,
        escalatedAt: ticket.escalated_at ? new Date(ticket.escalated_at) : null,
        escalationReason: ticket.escalation_reason,
        linkedIncidentId: ticket.linked_incident_id,
        tags: ticket.tags || [],
        internalNotes: ticket.internal_notes,
        createdAt: new Date(ticket.created_at),
        updatedAt: new Date(ticket.updated_at),
      })) as SupportTicket[];
    },
    enabled: !!workspaceId,
  });

  // Calculate stats
  const stats: TicketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    assigned: tickets.filter(t => t.status === 'assigned').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    critical: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length,
    breachedSla: tickets.filter(t => {
      if (t.status === 'resolved' || t.status === 'closed') return false;
      const now = new Date();
      return (t.slaResolutionDeadline && now > t.slaResolutionDeadline);
    }).length,
  };

  // Real-time subscription
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`support-tickets-${workspaceId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'workspace_support_tickets', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  // Create ticket
  const createTicket = useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      const { data, error } = await supabase
        .from('workspace_support_tickets')
        .insert([{
          workspace_id: workspaceId,
          event_id: eventId || null,
          title: input.title,
          description: input.description || null,
          category: input.category,
          priority: input.priority,
          location: input.location || null,
          affected_system: input.affectedSystem || null,
          reporter_id: userId,
          reporter_name: input.reporterName || userName,
          reporter_email: input.reporterEmail || null,
          tags: input.tags || null,
          ticket_number: '', // Placeholder - overwritten by database trigger
        }])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('workspace_ticket_activities').insert({
        ticket_id: data.id,
        activity_type: 'created',
        new_value: input.priority,
        performed_by: userId,
        performed_by_name: userName,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
      toast.success('Ticket created');
    },
    onError: (error) => {
      toast.error('Failed to create ticket');
      console.error(error);
    },
  });

  // Update ticket
  const updateTicket = useMutation({
    mutationFn: async (input: UpdateTicketInput) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === 'resolved' || input.status === 'closed') {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = userId;
        }
      }
      if (input.location !== undefined) updateData.location = input.location;
      if (input.affectedSystem !== undefined) updateData.affected_system = input.affectedSystem;
      if (input.internalNotes !== undefined) updateData.internal_notes = input.internalNotes;
      if (input.resolutionNotes !== undefined) updateData.resolution_notes = input.resolutionNotes;
      if (input.tags !== undefined) updateData.tags = input.tags;

      const { error } = await supabase
        .from('workspace_support_tickets')
        .update(updateData)
        .eq('id', input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
    },
    onError: (error) => {
      toast.error('Failed to update ticket');
      console.error(error);
    },
  });

  // Assign ticket
  const assignTicket = async (ticketId: string, assigneeId: string | null) => {
    const ticket = tickets.find(t => t.id === ticketId);
    
    const { error } = await supabase
      .from('workspace_support_tickets')
      .update({
        assignee_id: assigneeId,
        assigned_at: assigneeId ? new Date().toISOString() : null,
        assigned_by: assigneeId ? userId : null,
        status: assigneeId ? 'assigned' : 'open',
        first_response_at: !ticket?.firstResponseAt && assigneeId ? new Date().toISOString() : undefined,
      })
      .eq('id', ticketId);

    if (error) {
      toast.error('Failed to assign ticket');
      console.error(error);
      return;
    }

    // Log activity
    await supabase.from('workspace_ticket_activities').insert({
      ticket_id: ticketId,
      activity_type: 'assigned',
      previous_value: ticket?.assigneeId || null,
      new_value: assigneeId,
      performed_by: userId,
      performed_by_name: userName,
    });

    queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
    toast.success(assigneeId ? 'Ticket assigned' : 'Assignment removed');
  };

  // Change status
  const changeStatus = async (ticketId: string, newStatus: TicketStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    
    const updateData: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === 'resolved' || newStatus === 'closed') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = userId;
    }

    const { error } = await supabase
      .from('workspace_support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) {
      toast.error('Failed to update status');
      console.error(error);
      return;
    }

    // Log activity
    await supabase.from('workspace_ticket_activities').insert({
      ticket_id: ticketId,
      activity_type: 'status_changed',
      previous_value: ticket?.status,
      new_value: newStatus,
      performed_by: userId,
      performed_by_name: userName,
    });

    queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
    toast.success('Status updated');
  };

  // Change priority
  const changePriority = async (ticketId: string, newPriority: TicketPriority) => {
    const ticket = tickets.find(t => t.id === ticketId);

    const { error } = await supabase
      .from('workspace_support_tickets')
      .update({ priority: newPriority })
      .eq('id', ticketId);

    if (error) {
      toast.error('Failed to update priority');
      console.error(error);
      return;
    }

    // Log activity
    await supabase.from('workspace_ticket_activities').insert({
      ticket_id: ticketId,
      activity_type: 'priority_changed',
      previous_value: ticket?.priority,
      new_value: newPriority,
      performed_by: userId,
      performed_by_name: userName,
    });

    queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
    toast.success('Priority updated');
  };

  // Escalate ticket
  const escalateTicket = async (ticketId: string, reason: string) => {
    const { error } = await supabase
      .from('workspace_support_tickets')
      .update({
        is_escalated: true,
        escalated_at: new Date().toISOString(),
        escalation_reason: reason,
        priority: 'critical',
      })
      .eq('id', ticketId);

    if (error) {
      toast.error('Failed to escalate ticket');
      console.error(error);
      return;
    }

    // Log activity
    await supabase.from('workspace_ticket_activities').insert({
      ticket_id: ticketId,
      activity_type: 'escalated',
      comment: reason,
      performed_by: userId,
      performed_by_name: userName,
    });

    queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
    toast.success('Ticket escalated');
  };

  // Add comment
  const addComment = async (ticketId: string, comment: string) => {
    const { error } = await supabase.from('workspace_ticket_activities').insert({
      ticket_id: ticketId,
      activity_type: 'commented',
      comment,
      performed_by: userId,
      performed_by_name: userName,
    });

    if (error) {
      toast.error('Failed to add comment');
      console.error(error);
      return;
    }

    toast.success('Comment added');
  };

  // Delete ticket
  const deleteTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from('workspace_support_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', workspaceId] });
      toast.success('Ticket deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete ticket');
      console.error(error);
    },
  });

  // Fetch ticket activities
  const fetchActivities = async (ticketId: string): Promise<TicketActivity[]> => {
    const { data, error } = await supabase
      .from('workspace_ticket_activities')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(a => ({
      id: a.id,
      ticketId: a.ticket_id,
      activityType: a.activity_type,
      previousValue: a.previous_value,
      newValue: a.new_value,
      comment: a.comment,
      performedByName: a.performed_by_name,
      createdAt: new Date(a.created_at),
    }));
  };

  return {
    tickets,
    stats,
    isLoading,
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    changeStatus,
    changePriority,
    escalateTicket,
    addComment,
    fetchActivities,
  };
}
