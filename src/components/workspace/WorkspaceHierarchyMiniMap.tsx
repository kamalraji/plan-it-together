import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Building2, Users, Briefcase, UsersRound, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface WorkspaceHierarchyMiniMapProps {
  workspaceId: string;
  eventId?: string;
  orgSlug?: string;
  className?: string;
  /** Orientation of the mini-map */
  orientation?: 'horizontal' | 'vertical';
  /** Show labels for each level */
  showLabels?: boolean;
}

interface MiniMapWorkspace {
  id: string;
  name: string;
  parentWorkspaceId: string | null;
  workspaceType: string | null;
}

const LEVEL_CONFIG = {
  ROOT: {
    icon: Building2,
    label: 'Root',
    shortLabel: 'R',
    bgColor: 'bg-primary/10',
    activeColor: 'bg-primary',
    textColor: 'text-primary',
    ringColor: 'ring-primary/30',
  },
  DEPARTMENT: {
    icon: Briefcase,
    label: 'Department',
    shortLabel: 'D',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    activeColor: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    ringColor: 'ring-blue-500/30',
  },
  COMMITTEE: {
    icon: Users,
    label: 'Committee',
    shortLabel: 'C',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    activeColor: 'bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    ringColor: 'ring-amber-500/30',
  },
  TEAM: {
    icon: UsersRound,
    label: 'Team',
    shortLabel: 'T',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    activeColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    ringColor: 'ring-emerald-500/30',
  },
} as const;

export function WorkspaceHierarchyMiniMap({
  workspaceId,
  eventId,
  orgSlug: propOrgSlug,
  className,
  orientation = 'horizontal',
  showLabels = true,
}: WorkspaceHierarchyMiniMapProps) {
  const params = useParams<{ orgSlug?: string; eventId?: string }>();
  const orgSlug = propOrgSlug || params.orgSlug;
  const resolvedEventId = eventId || params.eventId;

  const { data: workspaces } = useQuery({
    queryKey: ['workspace-minimap', resolvedEventId, workspaceId],
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
      })) as MiniMapWorkspace[];
    },
    enabled: !!workspaceId,
  });

  const breadcrumbPath = useMemo(() => {
    if (!workspaces) return [];

    const workspaceMap = new Map<string, MiniMapWorkspace>();
    workspaces.forEach((ws) => workspaceMap.set(ws.id, ws));

    const path: MiniMapWorkspace[] = [];
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

  const getWorkspaceLink = (wsId: string) => {
    if (orgSlug && resolvedEventId) {
      return `/${orgSlug}/workspaces/${resolvedEventId}/${wsId}`;
    }
    return `/workspaces/${wsId}`;
  };

  const getLevelConfig = (wsType: string | null, index: number) => {
    if (wsType && wsType in LEVEL_CONFIG) {
      return LEVEL_CONFIG[wsType as keyof typeof LEVEL_CONFIG];
    }
    const fallbackTypes = ['ROOT', 'DEPARTMENT', 'COMMITTEE', 'TEAM'] as const;
    return LEVEL_CONFIG[fallbackTypes[Math.min(index, 3)]];
  };

  // Get the current level position (0-3)
  const currentLevelIndex = breadcrumbPath.length - 1;

  if (!breadcrumbPath.length) {
    return null;
  }

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        'p-3 rounded-xl bg-card border border-border shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Hierarchy
        </p>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          Level {currentLevelIndex + 1} of 4
        </span>
      </div>

      {/* Mini-map visualization */}
      <div
        className={cn(
          'flex items-center',
          isVertical ? 'flex-col gap-1' : 'flex-row gap-0'
        )}
      >
        {/* All 4 levels */}
        {(['ROOT', 'DEPARTMENT', 'COMMITTEE', 'TEAM'] as const).map((levelType, index) => {
          const config = LEVEL_CONFIG[levelType];
          const Icon = config.icon;
          const isActive = index <= currentLevelIndex;
          const isCurrent = index === currentLevelIndex;
          const workspaceAtLevel = breadcrumbPath[index];
          const isClickable = isActive && workspaceAtLevel && !isCurrent;

          const NodeContent = (
            <div
              className={cn(
                'relative flex items-center gap-2',
                isVertical && 'w-full'
              )}
            >
              {/* Node circle */}
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-all duration-300',
                  isCurrent
                    ? 'h-10 w-10 ring-4 ring-offset-2 ring-offset-background'
                    : 'h-8 w-8',
                  isCurrent && config.ringColor,
                  isActive ? config.bgColor : 'bg-muted',
                  isClickable && 'hover:scale-110 cursor-pointer'
                )}
              >
                <Icon
                  className={cn(
                    'transition-colors',
                    isCurrent ? 'h-5 w-5' : 'h-4 w-4',
                    isActive ? config.textColor : 'text-muted-foreground'
                  )}
                />
                
                {/* Current indicator pulse */}
                {isCurrent && (
                  <span
                    className={cn(
                      'absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full animate-pulse',
                      config.activeColor
                    )}
                  />
                )}
              </div>

              {/* Label and workspace name */}
              {showLabels && (
                <div className={cn('flex-1 min-w-0', !isVertical && 'hidden sm:block')}>
                  <p
                    className={cn(
                      'text-xs font-medium truncate',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {workspaceAtLevel?.name || config.label}
                  </p>
                  {workspaceAtLevel && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {config.label}
                    </p>
                  )}
                </div>
              )}

              {/* Connector line - for horizontal layout */}
              {!isVertical && index < 3 && (
                <div
                  className={cn(
                    'h-0.5 w-6 sm:w-8 transition-colors duration-300',
                    index < currentLevelIndex ? config.activeColor : 'bg-border'
                  )}
                />
              )}
            </div>
          );

          // Vertical connector
          const VerticalConnector = isVertical && index < 3 && (
            <div
              className={cn(
                'w-0.5 h-4 ml-4 transition-colors duration-300',
                index < currentLevelIndex
                  ? LEVEL_CONFIG[(['ROOT', 'DEPARTMENT', 'COMMITTEE', 'TEAM'] as const)[index]].activeColor
                  : 'bg-border'
              )}
            />
          );

          return (
            <div
              key={levelType}
              className={cn(isVertical && 'w-full')}
            >
              {isClickable ? (
                <Link
                  to={getWorkspaceLink(workspaceAtLevel.id)}
                  className="block"
                >
                  {NodeContent}
                </Link>
              ) : (
                NodeContent
              )}
              {VerticalConnector}
            </div>
          );
        })}
      </div>

      {/* Current workspace info */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-6 w-6 rounded-md flex items-center justify-center',
              getLevelConfig(breadcrumbPath[currentLevelIndex]?.workspaceType, currentLevelIndex).bgColor
            )}
          >
            {(() => {
              const config = getLevelConfig(
                breadcrumbPath[currentLevelIndex]?.workspaceType,
                currentLevelIndex
              );
              const Icon = config.icon;
              return <Icon className={cn('h-3.5 w-3.5', config.textColor)} />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {breadcrumbPath[currentLevelIndex]?.name}
            </p>
          </div>
          {currentLevelIndex < 3 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              Can add {LEVEL_CONFIG[(['ROOT', 'DEPARTMENT', 'COMMITTEE', 'TEAM'] as const)[currentLevelIndex + 1]].label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
