import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceStatus, UserRole } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { WorkspaceDashboard } from '@/components/workspace/WorkspaceDashboard';
import { useAuth } from '@/hooks/useAuth';
import { PlusIcon } from '@heroicons/react/24/outline';

/**
 * OrgWorkspacePage
 *
 * Organization-scoped workspace portal for the route `/:orgSlug/workspaces`.
 * Shows workspace list and full workspace dashboard when one is selected.
 * Supports filtering by eventId via query param.
 */
export const OrgWorkspacePage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const eventIdFilter = searchParams.get('eventId') || undefined;
  const selectedWorkspaceId = searchParams.get('workspaceId') || undefined;

  const baseWorkspacePath = `/${orgSlug}/workspaces`;

  // Load workspaces the current user can access
  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['org-workspaces', organization?.id, eventIdFilter],
    queryFn: async () => {
      if (!organization?.id) return [] as Workspace[];

      let query = supabase
        .from('workspaces')
        .select(
          'id, name, status, created_at, updated_at, event_id, events!inner(id, name, organization_id)'
        )
        .eq('events.organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (eventIdFilter) {
        query = query.eq('event_id', eventIdFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return ((data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        name: row.name,
        status: row.status as WorkspaceStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        description: undefined,
        event: row.events
          ? {
            id: row.events.id,
            name: row.events.name,
          }
          : undefined,
        teamMembers: [],
        taskSummary: undefined,
        channels: [],
      })) as unknown) as Workspace[];
    },
    enabled: !!organization?.id,
  });

  // Get event name if filtering by event
  const { data: filteredEvent } = useQuery({
    queryKey: ['event-name', eventIdFilter],
    queryFn: async () => {
      if (!eventIdFilter) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', eventIdFilter)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventIdFilter,
  });

  const [statusFilter, setStatusFilter] = React.useState<'ALL' | WorkspaceStatus>('ALL');
  const [sortOrder, setSortOrder] = React.useState<'recent' | 'oldest'>('recent');

  // Auto-select first workspace if none selected and workspaces exist
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces && workspaces.length > 0) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', workspaces[0].id);
        return next;
      }, { replace: true });
    }
  }, [selectedWorkspaceId, workspaces, setSearchParams]);

  const filteredWorkspaces = (workspaces || [])
    .filter((ws) => (statusFilter === 'ALL' ? true : ws.status === statusFilter))
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
      return sortOrder === 'recent' ? bTime - aTime : aTime - bTime;
    });

  const canManageWorkspaces =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  const createWorkspaceMutation = useMutation({
    mutationFn: async (workspaceLabel: string) => {
      if (!user || !eventIdFilter) {
        throw new Error('You must select an event to create a workspace');
      }

      const { data: eventData } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventIdFilter)
        .single();

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          event_id: eventIdFilter,
          name: `${eventData?.name || 'Event'} – ${workspaceLabel}`,
          organizer_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['org-workspaces', organization?.id] });
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', data.id);
        return next;
      });
    },
  });

  const getStatusBadgeClass = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
      case WorkspaceStatus.DISSOLVED:
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('workspaceId', workspace.id);
      return next;
    });
  };

  const handleClearEventFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('eventId');
      next.delete('workspaceId');
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-2">
        <OrganizationBreadcrumbs
          items={[
            {
              label: organization?.name ?? 'Organization',
              href: orgSlug ? `/${orgSlug}` : undefined,
            },
            {
              label: 'Workspaces',
              isCurrent: !eventIdFilter,
              href: eventIdFilter ? baseWorkspacePath : undefined,
            },
            ...(eventIdFilter && filteredEvent
              ? [{ label: filteredEvent.name, isCurrent: true }]
              : []),
          ]}
          className="text-xs"
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {eventIdFilter && filteredEvent
                ? `${filteredEvent.name} Workspaces`
                : 'Organization Workspaces'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {eventIdFilter
                ? 'Manage workspaces for this event with tasks, team, and communication.'
                : 'Use workspaces to organize collaboration around your events.'}
            </p>
          </div>
          {eventIdFilter && (
            <button
              type="button"
              onClick={handleClearEventFilter}
              className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              View all workspaces
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Workspace list */}
        <aside className="rounded-2xl border border-border/70 bg-card/70 p-3 sm:p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                {eventIdFilter ? 'Event workspaces' : 'All workspaces'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Loading workspaces…'
                  : workspaces && workspaces.length > 0
                    ? `${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'}`
                    : 'No workspaces found'}
              </p>
            </div>
            <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 justify-between sm:justify-end">
              <div className="flex items-center gap-1">
                <label className="sr-only" htmlFor="workspace-status-filter">
                  Filter by status
                </label>
                <select
                  id="workspace-status-filter"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value === 'ALL' ? 'ALL' : (e.target.value as WorkspaceStatus))
                  }
                  className="h-8 rounded-full border border-border/70 bg-card px-2 text-xs text-foreground"
                >
                  <option value="ALL">All statuses</option>
                  <option value={WorkspaceStatus.ACTIVE}>Active</option>
                  <option value={WorkspaceStatus.PROVISIONING}>Provisioning</option>
                  <option value={WorkspaceStatus.WINDING_DOWN}>Winding down</option>
                  <option value={WorkspaceStatus.DISSOLVED}>Dissolved</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent')}
                className="inline-flex items-center rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/60"
              >
                Sort: {sortOrder === 'recent' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-10 rounded-xl bg-muted/70 animate-pulse"
                />
              ))}
            </div>
          ) : !filteredWorkspaces || filteredWorkspaces.length === 0 ? (
            <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border/80 bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
              <span>No workspaces match the current filters.</span>
              {eventIdFilter && canManageWorkspaces && (
                <span>Create a new workspace to get started.</span>
              )}
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredWorkspaces.map((workspace) => (
                <li key={workspace.id}>
                  <button
                    type="button"
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className={`group flex w-full flex-col rounded-xl border px-3 py-2 text-left transition-colors ${
                      workspace.id === selectedWorkspaceId
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted/40 hover:border-border/70 hover:bg-muted/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm font-medium ${
                        workspace.id === selectedWorkspaceId ? 'text-primary' : 'text-foreground'
                      }`}>
                        {workspace.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(
                          workspace.status,
                        )}`}
                      >
                        {workspace.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        Updated {new Date(workspace.updatedAt ?? workspace.createdAt).toLocaleDateString()}
                      </span>
                      {!eventIdFilter && workspace.event && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {workspace.event.name}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Create workspace buttons when filtering by event */}
          {eventIdFilter && canManageWorkspaces && (
            <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Create workspace</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => createWorkspaceMutation.mutate('Operations')}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  disabled={createWorkspaceMutation.isPending}
                >
                  <PlusIcon className="h-3 w-3" />
                  Operations
                </button>
                <button
                  type="button"
                  onClick={() => createWorkspaceMutation.mutate('Judging')}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-60"
                  disabled={createWorkspaceMutation.isPending}
                >
                  <PlusIcon className="h-3 w-3" />
                  Judging
                </button>
                <button
                  type="button"
                  onClick={() => createWorkspaceMutation.mutate('Volunteers')}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
                  disabled={createWorkspaceMutation.isPending}
                >
                  <PlusIcon className="h-3 w-3" />
                  Volunteers
                </button>
                <button
                  type="button"
                  onClick={() => createWorkspaceMutation.mutate('Sponsors')}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-muted text-foreground hover:bg-muted/80 disabled:opacity-60"
                  disabled={createWorkspaceMutation.isPending}
                >
                  <PlusIcon className="h-3 w-3" />
                  Sponsors
                </button>
              </div>
              {createWorkspaceMutation.error && (
                <p className="mt-1 text-xs text-destructive">
                  {(createWorkspaceMutation.error as Error).message}
                </p>
              )}
            </div>
          )}
        </aside>

        {/* Workspace dashboard */}
        <main className="min-h-[400px]">
          {selectedWorkspaceId ? (
            <WorkspaceDashboard workspaceId={selectedWorkspaceId} orgSlug={orgSlug} />
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <h2 className="text-base font-semibold text-foreground mb-2">Select a workspace</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Choose a workspace from the list to view tasks, team members, and communication.
                {canManageWorkspaces && eventIdFilter && ' Or create a new one to get started.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OrgWorkspacePage;
