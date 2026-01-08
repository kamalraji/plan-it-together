import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, Building2, Users, Briefcase, UsersRound, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { slugify, buildWorkspaceUrl, WorkspaceLevel, WorkspacePathSegment } from '@/lib/workspaceNavigation';
import {
  SimpleDropdown,
  SimpleDropdownTrigger,
  SimpleDropdownContent,
  SimpleDropdownItem,
} from '@/components/ui/simple-dropdown';

interface WorkspaceBreadcrumbsMobileProps {
  workspaceId: string;
  eventId?: string;
  orgSlug?: string;
  className?: string;
}

interface BreadcrumbWorkspace {
  id: string;
  name: string;
  slug: string | null;
  parentWorkspaceId: string | null;
  workspaceType: string | null;
}

interface EventData {
  id: string;
  slug: string | null;
  name: string;
}

const DB_TYPE_TO_LEVEL: Record<string, WorkspaceLevel> = {
  'ROOT': 'root',
  'DEPARTMENT': 'department',
  'COMMITTEE': 'committee',
  'TEAM': 'team',
};

const LEVEL_CONFIG = {
  ROOT: {
    icon: Building2,
    label: 'Root',
    colors: 'bg-primary/10 text-primary',
    dotColor: 'bg-primary',
  },
  DEPARTMENT: {
    icon: Briefcase,
    label: 'Dept',
    colors: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    dotColor: 'bg-blue-500',
  },
  COMMITTEE: {
    icon: Users,
    label: 'Committee',
    colors: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  TEAM: {
    icon: UsersRound,
    label: 'Team',
    colors: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
} as const;

export function WorkspaceBreadcrumbsMobile({
  workspaceId,
  eventId,
  orgSlug: propOrgSlug,
  className,
}: WorkspaceBreadcrumbsMobileProps) {
  const params = useParams<{ orgSlug?: string; eventId?: string }>();
  const [searchParams] = useSearchParams();
  const orgSlug = propOrgSlug || params.orgSlug;
  const resolvedEventId = eventId || params.eventId || searchParams.get('eventId') || undefined;

  // Fetch event data for slug
  const { data: event } = useQuery({
    queryKey: ['workspace-breadcrumbs-mobile-event', resolvedEventId],
    queryFn: async () => {
      if (!resolvedEventId) return null;
      const { data, error } = await supabase
        .from('events')
        .select('id, slug, name')
        .eq('id', resolvedEventId)
        .single();
      if (error) return null;
      return data as EventData;
    },
    enabled: !!resolvedEventId,
  });

  const { data: workspaces } = useQuery({
    queryKey: ['workspace-breadcrumbs-mobile', resolvedEventId, workspaceId],
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
        .select('id, name, slug, parent_workspace_id, workspace_type')
        .eq('event_id', targetEventId);

      if (error) throw error;
      return (data || []).map((ws) => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        parentWorkspaceId: ws.parent_workspace_id,
        workspaceType: ws.workspace_type,
      })) as BreadcrumbWorkspace[];
    },
    enabled: !!workspaceId,
  });

  const breadcrumbPath = useMemo(() => {
    if (!workspaces) return [];

    const workspaceMap = new Map<string, BreadcrumbWorkspace>();
    workspaces.forEach((ws) => workspaceMap.set(ws.id, ws));

    const path: BreadcrumbWorkspace[] = [];
    let currentId: string | null = workspaceId;

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

  // Build hierarchical URL for a workspace at a given index in the path
  const getWorkspaceLink = (targetIndex: number) => {
    if (!orgSlug || !event || !breadcrumbPath.length) {
      return `/workspaces/${breadcrumbPath[targetIndex]?.id || ''}`;
    }

    const eventSlug = event.slug || slugify(event.name);
    
    // Build hierarchy up to and including the target index
    const hierarchy: WorkspacePathSegment[] = breadcrumbPath
      .slice(0, targetIndex + 1)
      .map((ws) => ({
        level: DB_TYPE_TO_LEVEL[ws.workspaceType || 'ROOT'] || 'root',
        slug: ws.slug || slugify(ws.name),
        workspaceId: ws.id,
      }));

    return buildWorkspaceUrl({
      orgSlug,
      eventSlug,
      eventId: event.id,
      hierarchy,
    });
  };

  const getWorkspacesListLink = () => {
    if (orgSlug && event) {
      const eventSlug = event.slug || slugify(event.name);
      return `/${orgSlug}/workspaces/${eventSlug}?eventId=${event.id}`;
    }
    return '/dashboard';
  };

  const getLevelConfig = (wsType: string | null, index: number) => {
    if (wsType && wsType in LEVEL_CONFIG) {
      return LEVEL_CONFIG[wsType as keyof typeof LEVEL_CONFIG];
    }
    const fallbackTypes = ['ROOT', 'DEPARTMENT', 'COMMITTEE', 'TEAM'] as const;
    return LEVEL_CONFIG[fallbackTypes[Math.min(index, 3)]];
  };

  if (!breadcrumbPath.length) {
    return null;
  }

  const currentWorkspace = breadcrumbPath[breadcrumbPath.length - 1];
  const currentConfig = getLevelConfig(currentWorkspace.workspaceType, breadcrumbPath.length - 1);
  const CurrentIcon = currentConfig.icon;
  const parentWorkspaces = breadcrumbPath.slice(0, -1);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SimpleDropdown>
        <SimpleDropdownTrigger
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-muted/50 hover:bg-muted border border-border/50',
            'transition-all duration-200 max-w-[200px] sm:max-w-[280px]'
          )}
        >
          <CurrentIcon className="h-4 w-4 flex-shrink-0 text-primary" />
          <span className="truncate text-sm font-medium text-foreground">
            {currentWorkspace.name}
          </span>
          <span
            className={cn(
              'text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide flex-shrink-0',
              currentConfig.colors
            )}
          >
            {currentConfig.label}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </SimpleDropdownTrigger>

        <SimpleDropdownContent align="start" className="w-64 p-2">
          {/* Workspaces List Link */}
          <Link to={getWorkspacesListLink()}>
            <SimpleDropdownItem className="flex items-center gap-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Home className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">All Workspaces</p>
                <p className="text-xs text-muted-foreground">Back to list</p>
              </div>
            </SimpleDropdownItem>
          </Link>

          {parentWorkspaces.length > 0 && (
            <>
              <div className="h-px bg-border my-2" />
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                Parent Workspaces
              </p>
            </>
          )}

          {/* Parent workspaces */}
          {parentWorkspaces.map((ws, index) => {
            const config = getLevelConfig(ws.workspaceType, index);
            const Icon = config.icon;

            return (
              <Link key={ws.id} to={getWorkspaceLink(index)}>
                <SimpleDropdownItem className="flex items-center gap-3 py-2.5">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center',
                      config.colors
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ws.name}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </SimpleDropdownItem>
              </Link>
            );
          })}

          {/* Current workspace indicator */}
          <div className="h-px bg-border my-2" />
          <div className="flex items-center gap-3 py-2.5 px-2 bg-primary/5 rounded-md">
            <div
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center',
                currentConfig.colors
              )}
            >
              <CurrentIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {currentWorkspace.name}
              </p>
              <p className="text-xs text-primary font-medium">Current</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </SimpleDropdownContent>
      </SimpleDropdown>
    </div>
  );
}
