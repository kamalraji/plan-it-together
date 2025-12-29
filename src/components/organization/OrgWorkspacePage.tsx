import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceStatus } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';

/**
 * OrgWorkspacePage
 *
 * Organization-scoped workspace portal for the route `/:orgSlug/workspaces`.
 * This page now focuses on the general "workspace service" overview for an
 * organization, and links out to event-specific workspaces instead of
 * embedding the full WorkspaceDashboard inline.
 *
 * On mobile, the workspace list is optimized for small screens with filters
 * and pill-style badges.
 */
export const OrgWorkspacePage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();

  const baseWorkspacePath = `/${orgSlug}/workspaces`;

  // Load workspaces the current user can access. RLS on `workspaces` ensures
  // we only see rows where the current user is allowed to manage them.
  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['org-workspaces', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [] as Workspace[];

      const { data, error } = await supabase
        .from('workspaces')
        .select(
          'id, name, status, created_at, updated_at, event_id, events!inner(id, name, organization_id)'
        )
        .eq('events.organization_id', organization.id)
        .order('created_at', { ascending: false });

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

  const [statusFilter, setStatusFilter] = React.useState<'ALL' | WorkspaceStatus>('ALL');
  const [sortOrder, setSortOrder] = React.useState<'recent' | 'oldest'>('recent');

  const filteredWorkspaces = (workspaces || [])
    .filter((ws) => (statusFilter === 'ALL' ? true : ws.status === statusFilter))
    .sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
      return sortOrder === 'recent' ? bTime - aTime : aTime - bTime;
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

  const handleOpenWorkspace = (workspace: Workspace) => {
    // Navigate directly to the dedicated workspace console detail page.
    navigate(`${baseWorkspacePath}/${workspace.id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {organization?.name ?? 'Organization workspaces'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Use workspaces to organize collaboration around your events. Select a workspace from the list
          to open its dedicated console with tasks, team, communication, and reports.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Workspace list */}
        <aside className="rounded-2xl border border-border/70 bg-card/70 p-3 sm:p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Event workspaces</h2>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Loading workspaces…'
                  : workspaces && workspaces.length > 0
                    ? `${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'} linked to events`
                    : 'No event workspaces have been created yet'}
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
              <a
                href={`${baseWorkspacePath}/create`}
                className="inline-flex items-center rounded-full border border-border/70 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Create workspace
              </a>
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
              <span>
                Try adjusting the status filter or create a workspace from an event detail page.
              </span>
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredWorkspaces.map((workspace) => (
                <li key={workspace.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenWorkspace(workspace)}
                    className="group flex w-full flex-col rounded-xl border border-transparent bg-muted/40 px-3 py-2 text-left transition-colors hover:border-border/70 hover:bg-muted/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
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
                      {workspace.event && (
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
        </aside>

        {/* General workspace overview */}
        <main className="min-h-[260px] rounded-2xl border border-border/70 bg-card/80 p-4 lg:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-2">Workspace service overview</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
            Workspaces are collaboration hubs tied to your events. Each workspace centralizes tasks,
            team members, communication, and reports for a single event.
          </p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Create a workspace directly from an event detail page.</li>
            <li>Track preparation progress with tasks and health metrics.</li>
            <li>Coordinate your organizing team and volunteers in one place.</li>
          </ul>
        </main>
      </div>
    </div>
  );
};

export default OrgWorkspacePage;
