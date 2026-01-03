import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Workspace, WorkspaceStatus, UserRole } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { WorkspaceDashboard } from '@/components/workspace/WorkspaceDashboard';
import { useAuth } from '@/hooks/useAuth';

/**
 * OrgWorkspacePage
 *
 * Organization-scoped workspace portal for the route `/:orgSlug/workspaces/:eventId`.
 * Shows workspace list and full workspace dashboard when one is selected.
 * The eventId is now a required URL parameter, not a query param.
 */
export const OrgWorkspacePage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { orgSlug, eventId } = useParams<{ orgSlug: string; eventId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const selectedWorkspaceId = searchParams.get('workspaceId') || undefined;


  // Load workspaces for this specific event
  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ['org-workspaces', organization?.id, eventId],
    queryFn: async () => {
      if (!organization?.id || !eventId) return [] as Workspace[];

      const { data, error } = await supabase
        .from('workspaces')
        .select(
          'id, name, status, created_at, updated_at, event_id, events!inner(id, name, organization_id)'
        )
        .eq('events.organization_id', organization.id)
        .eq('event_id', eventId)
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
    enabled: !!organization?.id && !!eventId,
  });

  // Get event details
  const { data: event } = useQuery({
    queryKey: ['event-name', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', eventId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

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

  const canManageWorkspaces =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

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
              label: 'Events',
              href: `/${orgSlug}/eventmanagement`,
            },
            {
              label: event?.name ?? 'Event',
              href: `/${orgSlug}/eventmanagement/${eventId}`,
            },
            {
              label: 'Workspaces',
              isCurrent: true,
            },
          ]}
          className="text-xs"
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {event?.name ? `${event.name} Workspaces` : 'Event Workspaces'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage workspaces for this event with tasks, team, and communication.
            </p>
          </div>
        </div>
      </header>

      {/* Workspace dashboard */}
      <main className="min-h-[400px]">
        {selectedWorkspaceId ? (
          <WorkspaceDashboard workspaceId={selectedWorkspaceId} orgSlug={orgSlug} />
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-base font-semibold text-foreground mb-2">Select a workspace</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Choose a workspace from the list to view tasks, team members, and communication.
              {canManageWorkspaces && ' Or create a new one to get started.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrgWorkspacePage;
