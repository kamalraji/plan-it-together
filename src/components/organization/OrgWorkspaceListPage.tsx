import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceStatus, UserRole } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Refactored components
import { WorkspaceItem } from './workspace-list/WorkspaceCard';
import { WorkspaceGroup } from './workspace-list/WorkspaceGroup';
import { WorkspaceListHeader } from './workspace-list/WorkspaceListHeader';
import { WorkspaceListSkeleton } from './workspace-list/WorkspaceListSkeleton';

/**
 * OrgWorkspaceListPage
 *
 * Displays all workspaces for an organization, grouped by:
 * - My Workspaces (owned by or involving the user)
 * - Organization Workspaces (other org workspaces)
 * - Invited Workspaces (where user is invited as a member)
 */
export const OrgWorkspaceListPage: React.FC = () => {
  const organization = useCurrentOrganization();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();

  // Fetch all workspaces for this organization
  const { data: workspacesData, isLoading } = useQuery({
    queryKey: ['org-all-workspaces', organization?.id, user?.id],
    queryFn: async () => {
      if (!organization?.id || !user?.id) return { myWorkspaces: [], orgWorkspaces: [], invitedWorkspaces: [], totalCount: 0 };

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          id, name, status, created_at, updated_at, event_id, organizer_id, parent_workspace_id,
          events!inner(id, name, organization_id),
          workspace_team_members(user_id, role)
        `)
        .eq('events.organization_id', organization.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const allWorkspaces: WorkspaceItem[] = (data || []).map((row: any) => {
        const memberRecord = row.workspace_team_members?.find((m: any) => m.user_id === user?.id);
        return {
          id: row.id,
          eventId: row.event_id,
          name: row.name,
          status: row.status as WorkspaceStatus,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          organizerId: row.organizer_id,
          parentWorkspaceId: row.parent_workspace_id,
          isOwner: row.organizer_id === user?.id,
          isMember: !!memberRecord,
          event: row.events
            ? {
              id: row.events.id,
              name: row.events.name,
            }
            : undefined,
        };
      });

      // Build hierarchy for display
      const buildHierarchy = (workspaces: WorkspaceItem[]) => {
        const roots = workspaces.filter((w) => !w.parentWorkspaceId);
        const children = workspaces.filter((w) => w.parentWorkspaceId);
        
        return roots.map((root) => ({
          ...root,
          subWorkspaces: children.filter((c) => c.parentWorkspaceId === root.id),
        }));
      };

      // My Workspaces: created by user OR user is a member with owner role
      const myOwned = allWorkspaces.filter((w) => w.isOwner);
      
      // Invited Workspaces: user is a member but not owner
      const invitedWorkspaces = allWorkspaces.filter((w) => w.isMember && !w.isOwner);
      
      // Organization Workspaces: neither owner nor member
      const orgWorkspaces = allWorkspaces.filter((w) => !w.isOwner && !w.isMember);

      return {
        myWorkspaces: buildHierarchy(myOwned),
        invitedWorkspaces: buildHierarchy(invitedWorkspaces),
        orgWorkspaces: buildHierarchy(orgWorkspaces),
        totalCount: allWorkspaces.length,
      };
    },
    enabled: !!organization?.id && !!user?.id,
  });

  const canManageWorkspaces =
    !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

  return (
    <div className={cn(
      "min-h-[calc(100vh-4rem)]",
      "bg-gradient-to-br from-background via-background to-muted/20"
    )}>
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <WorkspaceListHeader
          organizationName={organization?.name}
          orgSlug={orgSlug}
          totalCount={workspacesData?.totalCount ?? 0}
          canManageWorkspaces={canManageWorkspaces}
        />

        {/* Loading state */}
        {isLoading && <WorkspaceListSkeleton />}

        {/* Workspace groups */}
        {!isLoading && (
          <ScrollArea className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-14rem)]">
            <div className="space-y-6 sm:space-y-8 pb-8 pr-2">
              {/* My Workspaces */}
              <WorkspaceGroup
                title="My Workspaces"
                icon={<UserIcon className="h-5 w-5 text-primary" />}
                workspaces={workspacesData?.myWorkspaces || []}
                emptyMessage="You haven't created any workspaces yet"
                defaultExpanded={true}
                orgSlug={orgSlug}
              />

              {/* Invited Workspaces */}
              <WorkspaceGroup
                title="Invited Workspaces"
                icon={<EnvelopeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                workspaces={workspacesData?.invitedWorkspaces || []}
                emptyMessage="No workspace invitations"
                defaultExpanded={true}
                orgSlug={orgSlug}
              />

              {/* Organization Workspaces */}
              <WorkspaceGroup
                title="Organization Workspaces"
                icon={<BuildingOfficeIcon className="h-5 w-5 text-muted-foreground" />}
                workspaces={workspacesData?.orgWorkspaces || []}
                emptyMessage="No other workspaces in this organization"
                defaultExpanded={true}
                orgSlug={orgSlug}
              />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default OrgWorkspaceListPage;
