import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Home, ChevronRight, Building2, Users, Briefcase, UsersRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

interface WorkspaceBreadcrumbsProps {
  workspaceId: string;
  eventId?: string;
  orgSlug?: string;
  className?: string;
  /** Show compact version without level labels */
  compact?: boolean;
}

interface BreadcrumbWorkspace {
  id: string;
  name: string;
  parentWorkspaceId: string | null;
  workspaceType: string | null;
}

const LEVEL_CONFIG = {
  ROOT: {
    icon: Building2,
    label: 'Root',
    colors: 'bg-primary/10 text-primary',
  },
  DEPARTMENT: {
    icon: Briefcase,
    label: 'Dept',
    colors: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  COMMITTEE: {
    icon: Users,
    label: 'Committee',
    colors: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  TEAM: {
    icon: UsersRound,
    label: 'Team',
    colors: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
} as const;

export function WorkspaceBreadcrumbs({
  workspaceId,
  eventId,
  orgSlug: propOrgSlug,
  className,
  compact = false,
}: WorkspaceBreadcrumbsProps) {
  const params = useParams<{ orgSlug?: string; eventId?: string }>();
  const orgSlug = propOrgSlug || params.orgSlug;
  const resolvedEventId = eventId || params.eventId;

  // Fetch all workspaces for the event to build the breadcrumb path
  const { data: workspaces } = useQuery({
    queryKey: ['workspace-breadcrumbs', resolvedEventId, workspaceId],
    queryFn: async () => {
      let targetEventId = resolvedEventId;

      if (!targetEventId) {
        const { data: currentWs } = await supabase
          .from('workspaces')
          .select('event_id')
          .eq('id', workspaceId)
          .single();
        
        targetEventId = currentWs?.event_id;
      }

      if (!targetEventId) return [];

      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, parent_workspace_id, workspace_type')
        .eq('event_id', targetEventId);

      if (error) throw error;
      return (data || []).map((ws) => ({
        id: ws.id,
        name: ws.name,
        parentWorkspaceId: ws.parent_workspace_id,
        workspaceType: ws.workspace_type,
      })) as BreadcrumbWorkspace[];
    },
    enabled: !!workspaceId,
  });

  // Build the breadcrumb path from current workspace to root
  const breadcrumbPath = useMemo(() => {
    if (!workspaces) return [];

    const workspaceMap = new Map<string, BreadcrumbWorkspace>();
    workspaces.forEach((ws) => workspaceMap.set(ws.id, ws));

    const path: BreadcrumbWorkspace[] = [];
    let currentId: string | null = workspaceId;

    // Walk up the parent chain
    while (currentId) {
      const workspace = workspaceMap.get(currentId);
      if (workspace) {
        path.unshift(workspace);
        currentId = workspace.parentWorkspaceId;
      } else {
        break;
      }
    }

    return path;
  }, [workspaces, workspaceId]);

  const getWorkspaceLink = (wsId: string) => {
    if (orgSlug && resolvedEventId) {
      return `/${orgSlug}/workspaces/${resolvedEventId}/${wsId}`;
    }
    return `/workspaces/${wsId}`;
  };

  const getWorkspacesListLink = () => {
    if (orgSlug && resolvedEventId) {
      return `/${orgSlug}/workspaces/${resolvedEventId}`;
    }
    return '/dashboard';
  };

  const getLevelConfig = (wsType: string | null, index: number) => {
    if (wsType && wsType in LEVEL_CONFIG) {
      return LEVEL_CONFIG[wsType as keyof typeof LEVEL_CONFIG];
    }
    // Fallback based on index
    const fallbackTypes = ['ROOT', 'DEPARTMENT', 'COMMITTEE', 'TEAM'] as const;
    return LEVEL_CONFIG[fallbackTypes[Math.min(index, 3)]];
  };

  if (!breadcrumbPath.length) {
    return null;
  }

  return (
    <Breadcrumb className={cn('', className)}>
      <BreadcrumbList className="flex-wrap gap-1">
        {/* Workspaces home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to={getWorkspacesListLink()}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:inline text-xs">Workspaces</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <ChevronRight className="h-3.5 w-3.5" />
        </BreadcrumbSeparator>

        {/* Workspace hierarchy */}
        {breadcrumbPath.map((ws, index) => {
          const isLast = index === breadcrumbPath.length - 1;
          const config = getLevelConfig(ws.workspaceType, index);
          const Icon = config.icon;

          return (
            <BreadcrumbItem key={ws.id} className="flex items-center">
              {!isLast ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link
                      to={getWorkspaceLink(ws.id)}
                      className="flex items-center gap-1.5 max-w-[100px] sm:max-w-[160px] group"
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="truncate text-xs sm:text-sm group-hover:text-foreground transition-colors">
                        {ws.name}
                      </span>
                      {!compact && (
                        <span
                          className={cn(
                            'hidden lg:inline-flex text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide',
                            config.colors
                          )}
                        >
                          {config.label}
                        </span>
                      )}
                    </Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </BreadcrumbSeparator>
                </>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5 max-w-[120px] sm:max-w-[180px]">
                  <Icon className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span className="truncate text-xs sm:text-sm font-medium text-foreground">
                    {ws.name}
                  </span>
                  {!compact && (
                    <span
                      className={cn(
                        'hidden lg:inline-flex text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide',
                        config.colors
                      )}
                    >
                      {config.label}
                    </span>
                  )}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
