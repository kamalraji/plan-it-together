import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Workspace, UserRole, WorkspaceRole, TeamMember } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  FunnelIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  DocumentArrowDownIcon,
  CogIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { DataAnalytics } from '@/components/illustrations';

interface WorkspaceAuditLogProps {
  workspace: Workspace;
  teamMembers?: TeamMember[];
}

type AuditEventType = 'communication' | 'task' | 'team' | 'template' | 'all';

interface AuditEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
  metadata: any;
}

const EVENT_ICONS: Record<string, React.ComponentType<any>> = {
  communication: ChatBubbleLeftIcon,
  task: ClipboardDocumentListIcon,
  team: UsersIcon,
  report_export: DocumentArrowDownIcon,
  settings_change: CogIcon,
};

const EVENT_COLORS: Record<string, string> = {
  communication: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 ring-blue-600/20',
  task: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20',
  team: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 ring-amber-600/20',
  report_export: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 ring-purple-600/20',
  settings_change: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 ring-red-600/20',
};

export function WorkspaceAuditLog({ workspace, teamMembers }: WorkspaceAuditLogProps) {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<AuditEventType>('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const isGlobalManager =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const currentMember = teamMembers?.find((member) => member.userId === user?.id);
  const managerWorkspaceRoles: WorkspaceRole[] = [
    WorkspaceRole.WORKSPACE_OWNER,
    WorkspaceRole.OPERATIONS_MANAGER,
    WorkspaceRole.GROWTH_MANAGER,
    WorkspaceRole.CONTENT_MANAGER,
    WorkspaceRole.TECH_FINANCE_MANAGER,
    WorkspaceRole.VOLUNTEERS_MANAGER,
    WorkspaceRole.EVENT_COORDINATOR,
  ];
  const isWorkspaceManager = currentMember
    ? managerWorkspaceRoles.includes(currentMember.role as WorkspaceRole)
    : false;

  const canViewAuditLog = isGlobalManager || isWorkspaceManager;

  const { data: auditEvents, isLoading } = useQuery({
    queryKey: ['workspace-audit-log', workspace.id, filterType, page],
    queryFn: async () => {
      let query = supabase
        .from('workspace_activities')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as AuditEvent[];
    },
    enabled: canViewAuditLog,
  });

  if (!canViewAuditLog) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Restricted Access</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Audit logs are only available to workspace managers (Owner, Team Lead, Event Coordinator) and event
              organizers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return timestamp;
    }
  };

  const getEventIcon = (type: string) => {
    const Icon = EVENT_ICONS[type] || ClipboardDocumentListIcon;
    return Icon;
  };

  const getEventColor = (type: string): string => {
    return EVENT_COLORS[type] || 'bg-muted text-foreground ring-border';
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-4 bg-muted/40 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Audit Log</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Track all important workspace actions including messages, reports, settings, and role changes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as AuditEventType);
                setPage(0);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="all">All Events</option>
              <option value="communication">Communication</option>
              <option value="task">Tasks</option>
              <option value="team">Team Changes</option>
              <option value="template">Templates</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 sm:px-6 py-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !auditEvents || auditEvents.length === 0 ? (
          <div className="px-4 sm:px-6 py-8 text-center flex flex-col items-center">
            <DataAnalytics size="xs" showBackground={false} />
            <p className="mt-3 text-sm text-muted-foreground">No audit events found</p>
          </div>
        ) : (
          auditEvents.map((event) => {
            const Icon = getEventIcon(event.type);
            const colorClass = getEventColor(event.type);

            return (
              <div key={event.id} className="px-4 sm:px-6 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 rounded-full p-2 ring-1 ring-inset ${colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        {event.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{event.actor_name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatTimestamp(event.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colorClass}`}
                      >
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {auditEvents && auditEvents.length >= pageSize && (
        <div className="px-4 sm:px-6 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-background text-foreground border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">Page {page + 1}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!auditEvents || auditEvents.length < pageSize}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-background text-foreground border border-border hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
