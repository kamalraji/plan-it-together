import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Home, Layers } from 'lucide-react';
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
  className?: string;
}

interface BreadcrumbWorkspace {
  id: string;
  name: string;
  parentWorkspaceId: string | null;
}

export function WorkspaceBreadcrumbs({
  workspaceId,
  eventId,
  className,
}: WorkspaceBreadcrumbsProps) {
  // Fetch all workspaces for the event to build the breadcrumb path
  const { data: workspaces } = useQuery({
    queryKey: ['workspace-breadcrumbs', eventId, workspaceId],
    queryFn: async () => {
      // If we don't have eventId, first get the current workspace to find it
      let targetEventId = eventId;

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
        .select('id, name, parent_workspace_id')
        .eq('event_id', targetEventId);

      if (error) throw error;
      return (data || []).map((ws) => ({
        id: ws.id,
        name: ws.name,
        parentWorkspaceId: ws.parent_workspace_id,
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

  const getLevelLabel = (index: number): string => {
    switch (index) {
      case 0:
        return 'Root';
      case 1:
        return 'Department';
      case 2:
        return 'Committee';
      case 3:
        return 'Team';
      default:
        return 'Workspace';
    }
  };

  if (!breadcrumbPath.length) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Workspaces home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link
              to="/dashboard"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:inline">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Workspace hierarchy */}
        {breadcrumbPath.map((ws, index) => {
          const isLast = index === breadcrumbPath.length - 1;
          const levelLabel = getLevelLabel(index);

          return (
            <BreadcrumbItem key={ws.id}>
              {!isLast ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link
                      to={`/workspaces/${ws.id}`}
                      className="flex items-center gap-1.5 max-w-[120px] sm:max-w-[180px]"
                    >
                      <Layers className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{ws.name}</span>
                      <span
                        className={cn(
                          'hidden sm:inline-flex text-[9px] px-1 py-0.5 rounded font-medium uppercase',
                          index === 0 && 'bg-primary/10 text-primary',
                          index === 1 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                          index === 2 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                          index === 3 && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                        )}
                      >
                        {levelLabel}
                      </span>
                    </Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[200px]">
                  <Layers className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="truncate font-medium">{ws.name}</span>
                  <span
                    className={cn(
                      'hidden sm:inline-flex text-[9px] px-1 py-0.5 rounded font-medium uppercase',
                      index === 0 && 'bg-primary/10 text-primary',
                      index === 1 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                      index === 2 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                      index === 3 && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                    )}
                  >
                    {levelLabel}
                  </span>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
