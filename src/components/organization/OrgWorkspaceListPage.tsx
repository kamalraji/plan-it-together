import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkspaceStatus, UserRole } from '@/types';
import { useCurrentOrganization } from './OrganizationContext';
import { OrganizationBreadcrumbs } from '@/components/organization/OrganizationBreadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlusIcon, 
  Squares2X2Icon, 
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  CalendarIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface WorkspaceItem {
  id: string;
  eventId: string;
  name: string;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
  organizerId: string;
  parentWorkspaceId: string | null;
  isOwner: boolean;
  isMember: boolean;
  event?: {
    id: string;
    name: string;
  };
  subWorkspaces?: WorkspaceItem[];
}

interface WorkspaceGroupProps {
  title: string;
  icon: React.ReactNode;
  workspaces: WorkspaceItem[];
  emptyMessage: string;
  defaultExpanded?: boolean;
  orgSlug?: string;
  accentColor?: string;
}

const WorkspaceGroup: React.FC<WorkspaceGroupProps> = ({
  title,
  icon,
  workspaces,
  emptyMessage,
  defaultExpanded = true,
  orgSlug,
  accentColor = 'primary',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  const getStatusStyles = (status: WorkspaceStatus) => {
    switch (status) {
      case WorkspaceStatus.ACTIVE:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case WorkspaceStatus.PROVISIONING:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case WorkspaceStatus.WINDING_DOWN:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case WorkspaceStatus.ARCHIVED:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleWorkspaceClick = (workspace: WorkspaceItem) => {
    if (workspace.eventId && orgSlug) {
      navigate(`/${orgSlug}/workspaces/${workspace.eventId}?workspaceId=${workspace.id}`);
    }
  };

  const renderWorkspaceCard = (workspace: WorkspaceItem, depth = 0) => (
    <div key={workspace.id} style={{ marginLeft: depth * 16 }}>
      <button
        onClick={() => handleWorkspaceClick(workspace)}
        className={cn(
          "w-full group relative p-4 rounded-xl border border-border/60",
          "bg-card/50 backdrop-blur-sm",
          "hover:border-primary/40 hover:bg-card/80 hover:shadow-md",
          "transition-all duration-200 text-left",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 p-2 rounded-lg",
            `bg-${accentColor}/10`
          )}>
            {workspace.subWorkspaces && workspace.subWorkspaces.length > 0 ? (
              <FolderOpenIcon className={cn("h-5 w-5", `text-${accentColor}`)} />
            ) : (
              <Squares2X2Icon className={cn("h-5 w-5", `text-${accentColor}`)} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {workspace.name}
              </h3>
              {workspace.isOwner && (
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-md font-medium">
                  Owner
                </span>
              )}
              {workspace.isMember && !workspace.isOwner && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md font-medium">
                  Member
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              {workspace.event && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {workspace.event.name}
                </span>
              )}
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
                getStatusStyles(workspace.status)
              )}>
                {workspace.status}
              </span>
              <span className="text-muted-foreground/60">
                Updated {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>
      {workspace.subWorkspaces && workspace.subWorkspaces.length > 0 && (
        <div className="mt-2 space-y-2">
          {workspace.subWorkspaces.map((sub) => renderWorkspaceCard(sub, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-1 py-2 group"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {workspaces.length}
          </span>
        </div>
        {expanded ? (
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {expanded && (
        <div className="space-y-2">
          {workspaces.length === 0 ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 mb-3">
                <FolderIcon className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            workspaces.map((workspace) => renderWorkspaceCard(workspace))
          )}
        </div>
      )}
    </div>
  );
};

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
      if (!organization?.id || !user?.id) return { myWorkspaces: [], orgWorkspaces: [], invitedWorkspaces: [] };

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
          memberRole: memberRecord?.role,
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <header className="space-y-4">
          <OrganizationBreadcrumbs
            items={[
              {
                label: organization?.name ?? 'Organization',
                href: orgSlug ? `/${orgSlug}` : undefined,
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Workspaces
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {workspacesData?.totalCount ?? 0} workspaces across all events
              </p>
            </div>
            {canManageWorkspaces && (
              <Link to={`/${orgSlug}/workspaces/create`}>
                <Button size="sm" className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">New Workspace</span>
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-6 w-40 bg-muted rounded" />
                <div className="h-20 bg-muted/60 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Workspace groups */}
        {!isLoading && (
          <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="space-y-8 pb-8">
              {/* My Workspaces */}
              <WorkspaceGroup
                title="My Workspaces"
                icon={<UserIcon className="h-5 w-5 text-primary" />}
                workspaces={workspacesData?.myWorkspaces || []}
                emptyMessage="You haven't created any workspaces yet"
                defaultExpanded={true}
                orgSlug={orgSlug}
                accentColor="primary"
              />

              {/* Invited Workspaces */}
              <WorkspaceGroup
                title="Invited Workspaces"
                icon={<EnvelopeIcon className="h-5 w-5 text-blue-500" />}
                workspaces={workspacesData?.invitedWorkspaces || []}
                emptyMessage="No workspace invitations"
                defaultExpanded={true}
                orgSlug={orgSlug}
                accentColor="blue-500"
              />

              {/* Organization Workspaces */}
              <WorkspaceGroup
                title="Organization Workspaces"
                icon={<BuildingOfficeIcon className="h-5 w-5 text-muted-foreground" />}
                workspaces={workspacesData?.orgWorkspaces || []}
                emptyMessage="No other workspaces in this organization"
                defaultExpanded={true}
                orgSlug={orgSlug}
                accentColor="muted-foreground"
              />
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default OrgWorkspaceListPage;
