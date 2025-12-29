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
    // Navigate to the event-specific workspace tab on the Event detail page.
    const baseEventPath = orgSlug
      ? `/${orgSlug}/eventmanagement`
      : '/dashboard/eventmanagement';
    const eventId = (workspace as any).eventId;

    if (eventId) {
      navigate(`${baseEventPath}/${eventId}/workspace`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {organization?.name ?? 'Organization workspaces'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Use workspaces to organize collaboration around your events. Open an event to access its
          dedicated workspace with tasks, team, communication, and reports.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Workspace list */}
        <aside className="rounded-2xl border border-border/70 bg-card/70 p-3 sm:p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
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
            <a
              href={`${baseWorkspacePath}/create`}
              className="inline-flex items-center rounded-full border border-border/70 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              New
            </a>
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
          ) : !workspaces || workspaces.length === 0 ? (
            <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border/80 bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
              <span>No workspaces have been created for this organization yet.</span>
              <span>
                Use the <span className="font-medium text-foreground">New</span> button above or create a
                workspace from an event detail page.
              </span>
            </div>
          ) : (
            <ul className="space-y-1">
              {workspaces.map((workspace) => (
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
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        Updated {new Date(workspace.updatedAt ?? workspace.createdAt).toLocaleDateString()}
                      </span>
                      {workspace.event && (
                        <span className="truncate">
                          Event: <span className="font-medium text-foreground">{workspace.event.name}</span>
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
            team members, communication, and reports for a single event. To work inside a specific
            workspace, open the event in Event Management and switch to the <span className="font-medium">Workspace</span>{' '}
            tab.
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

