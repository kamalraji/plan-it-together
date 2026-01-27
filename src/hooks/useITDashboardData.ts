import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ITTicket {
  id: string;
  title: string;
  requester: string;
  category: 'software' | 'hardware' | 'access' | 'network' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'resolved';
  assignedTo?: string;
  createdAt: string;
}

export interface ITAccessRequest {
  id: string;
  user: string;
  requestType: 'new_access' | 'permission_change' | 'revoke';
  resource: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
}

export interface ITSystemStatus {
  id: string;
  name: string;
  type: 'server' | 'database' | 'cloud' | 'network' | 'application';
  status: 'online' | 'offline' | 'degraded';
  load: number;
  uptime: string;
}

export interface ITSecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
}

// Map task priority to IT priority
const mapPriority = (priority: string): ITTicket['priority'] => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
    case 'critical':
      return 'urgent';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
};

// Map task status to IT ticket status
const mapTicketStatus = (status: string): ITTicket['status'] => {
  switch (status?.toUpperCase()) {
    case 'DONE':
    case 'COMPLETED':
      return 'resolved';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'TODO':
      return 'new';
    default:
      return 'assigned';
  }
};

// Map access request status
const mapAccessStatus = (status: string): ITAccessRequest['status'] => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'approved';
    case 'denied':
    case 'rejected':
      return 'denied';
    default:
      return 'pending';
  }
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch {
    return 'Recently';
  }
};

export function useITDashboardData(workspaceId: string) {
  // Fetch helpdesk tickets (from workspace_tasks)
  const ticketsQuery = useQuery({
    queryKey: ['it-tickets', workspaceId],
    queryFn: async (): Promise<ITTicket[]> => {
      const { data, error } = await supabase
        .from('workspace_tasks')
        .select('id, title, description, priority, status, created_at, assigned_to, role_scope')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching IT tickets:', error);
        return [];
      }

      return (data || []).map((task, index) => ({
        id: `HD-${100 + index}`,
        title: task.title || 'Untitled ticket',
        requester: 'Team Member',
        category: mapCategory(task.role_scope),
        priority: mapPriority(task.priority),
        status: mapTicketStatus(task.status),
        assignedTo: task.assigned_to ? 'Assigned' : undefined,
        createdAt: formatRelativeTime(task.created_at),
      }));
    },
    enabled: !!workspaceId,
  });

  // Fetch access requests
  const accessRequestsQuery = useQuery({
    queryKey: ['it-access-requests', workspaceId],
    queryFn: async (): Promise<ITAccessRequest[]> => {
      const { data, error } = await supabase
        .from('workspace_access_requests')
        .select('id, user_id, requested_role, status, message, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching access requests:', error);
        return [];
      }

      return (data || []).map((request) => ({
        id: request.id,
        user: 'User',
        requestType: 'new_access' as const,
        resource: request.requested_role || 'Workspace Access',
        status: mapAccessStatus(request.status || 'pending'),
        requestedAt: formatRelativeTime(request.created_at),
      }));
    },
    enabled: !!workspaceId,
  });

  // Fetch workspace resources for system health
  const systemHealthQuery = useQuery({
    queryKey: ['it-system-health', workspaceId],
    queryFn: async (): Promise<ITSystemStatus[]> => {
      const { data, error } = await supabase
        .from('workspace_resources')
        .select('id, name, type, status, quantity, available')
        .eq('workspace_id', workspaceId)
        .limit(6);

      if (error) {
        console.error('Error fetching system health:', error);
        return getDefaultSystems();
      }

      if (!data || data.length === 0) {
        return getDefaultSystems();
      }

      return data.map((resource) => ({
        id: resource.id,
        name: resource.name,
        type: mapResourceType(resource.type),
        status: mapResourceStatus(resource.status),
        load: resource.quantity > 0 ? Math.round((1 - (resource.available || 0) / resource.quantity) * 100) : 0,
        uptime: '99.9%',
      }));
    },
    enabled: !!workspaceId,
  });

  // Fetch workspace activities for security alerts
  const securityAlertsQuery = useQuery({
    queryKey: ['it-security-alerts', workspaceId],
    queryFn: async (): Promise<ITSecurityAlert[]> => {
      const { data, error } = await supabase
        .from('workspace_activities')
        .select('id, title, description, type, created_at, metadata')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching security alerts:', error);
        return [];
      }

      return (data || []).map((activity) => ({
        id: activity.id,
        title: activity.title || 'Activity',
        description: activity.description || '',
        severity: mapActivityToSeverity(activity.type),
        timestamp: formatRelativeTime(activity.created_at),
        status: 'active' as const,
      }));
    },
    enabled: !!workspaceId,
  });

  // Compute stats with safe defaults
  const stats = {
    systemsOnline: systemHealthQuery.data?.filter(s => s.status === 'online').length ?? 0,
    totalSystems: systemHealthQuery.data?.length ?? 0,
    openTickets: ticketsQuery.data?.filter(t => t.status !== 'resolved').length ?? 0,
    pendingTickets: ticketsQuery.data?.filter(t => t.status === 'new').length ?? 0,
    activeAlerts: securityAlertsQuery.data?.filter(a => a.status === 'active').length ?? 0,
    pendingAccessRequests: accessRequestsQuery.data?.filter(r => r.status === 'pending').length ?? 0,
  };

  return {
    tickets: ticketsQuery.data ?? [],
    accessRequests: accessRequestsQuery.data ?? [],
    systems: systemHealthQuery.data ?? getDefaultSystems(),
    securityAlerts: securityAlertsQuery.data ?? [],
    stats,
    isLoading: ticketsQuery.isLoading || accessRequestsQuery.isLoading || systemHealthQuery.isLoading || securityAlertsQuery.isLoading,
  };
}

// Helper functions
function getDefaultSystems(): ITSystemStatus[] {
  return [
    { id: '1', name: 'Registration Server', type: 'server', status: 'online', load: 45, uptime: '99.9%' },
    { id: '2', name: 'Event Database', type: 'database', status: 'online', load: 32, uptime: '99.99%' },
    { id: '3', name: 'Cloud Storage', type: 'cloud', status: 'online', load: 67, uptime: '100%' },
    { id: '4', name: 'Network Gateway', type: 'network', status: 'online', load: 28, uptime: '99.95%' },
  ];
}

function mapCategory(roleScope: string | null): ITTicket['category'] {
  if (!roleScope) return 'other';
  const scope = roleScope.toLowerCase();
  if (scope.includes('software') || scope.includes('app')) return 'software';
  if (scope.includes('hardware') || scope.includes('device')) return 'hardware';
  if (scope.includes('access') || scope.includes('permission')) return 'access';
  if (scope.includes('network') || scope.includes('wifi')) return 'network';
  return 'other';
}

function mapResourceType(type: string): ITSystemStatus['type'] {
  const typeMap: Record<string, ITSystemStatus['type']> = {
    equipment: 'server',
    software: 'application',
    storage: 'cloud',
    network: 'network',
    database: 'database',
  };
  return typeMap[type?.toLowerCase()] || 'server';
}

function mapResourceStatus(status: string): ITSystemStatus['status'] {
  if (status === 'available') return 'online';
  if (status === 'in_use') return 'degraded';
  return 'offline';
}

function mapActivityToSeverity(type: string): ITSecurityAlert['severity'] {
  const severityMap: Record<string, ITSecurityAlert['severity']> = {
    member_join: 'info',
    member_leave: 'low',
    task_created: 'info',
    task_completed: 'info',
    resource_allocated: 'low',
    budget_updated: 'medium',
    settings_changed: 'medium',
    role_changed: 'high',
  };
  return severityMap[type] || 'info';
}
