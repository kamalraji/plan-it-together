import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MAX_WORKSPACE_DEPTH } from '@/lib/workspaceHierarchy';

interface WorkspaceNode {
  id: string;
  name: string;
  parentWorkspaceId: string | null;
  status: string;
  children: WorkspaceNode[];
  depth: number;
}

interface WorkspaceHierarchyTreeProps {
  eventId: string;
  currentWorkspaceId?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
}

export function WorkspaceHierarchyTree({
  eventId,
  currentWorkspaceId,
  onWorkspaceSelect,
}: WorkspaceHierarchyTreeProps) {
  const navigate = useNavigate();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspace-hierarchy', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, parent_workspace_id, status')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Build tree structure from flat list
  const tree = useMemo(() => {
    if (!workspaces) return [];

    const nodeMap = new Map<string, WorkspaceNode>();
    const roots: WorkspaceNode[] = [];

    // First pass: create all nodes
    workspaces.forEach((ws) => {
      nodeMap.set(ws.id, {
        id: ws.id,
        name: ws.name,
        parentWorkspaceId: ws.parent_workspace_id,
        status: ws.status,
        children: [],
        depth: 1,
      });
    });

    // Second pass: build tree structure
    workspaces.forEach((ws) => {
      const node = nodeMap.get(ws.id);
      if (!node) return;

      if (ws.parent_workspace_id) {
        const parent = nodeMap.get(ws.parent_workspace_id);
        if (parent) {
          node.depth = parent.depth + 1;
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Auto-expand path to current workspace
    if (currentWorkspaceId) {
      const expandPath = (nodeId: string) => {
        const node = nodeMap.get(nodeId);
        if (node?.parentWorkspaceId) {
          setExpandedNodes((prev) => new Set([...prev, node.parentWorkspaceId!]));
          expandPath(node.parentWorkspaceId);
        }
      };
      expandPath(currentWorkspaceId);
    }

    return roots;
  }, [workspaces, currentWorkspaceId]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleSelect = (workspaceId: string) => {
    if (onWorkspaceSelect) {
      onWorkspaceSelect(workspaceId);
    } else {
      navigate(`/workspaces/${workspaceId}`);
    }
  };

  const getLevelLabel = (depth: number): string => {
    switch (depth) {
      case 1:
        return 'Root';
      case 2:
        return 'Department';
      case 3:
        return 'Committee';
      case 4:
        return 'Team';
      default:
        return 'Workspace';
    }
  };

  const getLevelColor = (depth: number): string => {
    switch (depth) {
      case 1:
        return 'text-primary';
      case 2:
        return 'text-blue-600 dark:text-blue-400';
      case 3:
        return 'text-amber-600 dark:text-amber-400';
      case 4:
        return 'text-emerald-600 dark:text-emerald-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const renderNode = (node: WorkspaceNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isCurrent = node.id === currentWorkspaceId;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
            isCurrent
              ? 'bg-primary/10 border border-primary/20'
              : 'hover:bg-muted',
          )}
          style={{ paddingLeft: `${(node.depth - 1) * 16 + 8}px` }}
          onClick={() => handleSelect(node.id)}
        >
          {/* Expand/Collapse Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
            className={cn(
              'p-0.5 rounded hover:bg-muted-foreground/10',
              !hasChildren && 'invisible',
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Folder Icon */}
          {isExpanded && hasChildren ? (
            <FolderOpen className={cn('h-4 w-4', getLevelColor(node.depth))} />
          ) : (
            <Folder className={cn('h-4 w-4', getLevelColor(node.depth))} />
          )}

          {/* Name and Level Badge */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'text-sm truncate',
                isCurrent ? 'font-semibold text-foreground' : 'text-foreground/80',
              )}
            >
              {node.name}
            </span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide',
                node.depth === 1 && 'bg-primary/10 text-primary',
                node.depth === 2 && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                node.depth === 3 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                node.depth === 4 && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
              )}
            >
              {getLevelLabel(node.depth)}
            </span>
          </div>

          {/* Children count */}
          {hasChildren && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {node.children.length}
            </span>
          )}
        </div>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute left-0 top-0 bottom-0 border-l border-border"
              style={{ marginLeft: `${(node.depth - 1) * 16 + 20}px` }}
            />
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tree.length) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No workspaces found for this event.
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Legend */}
      <div className="px-3 pb-2 mb-2 border-b border-border flex flex-wrap gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">L1 Root</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">L2 Department</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">L3 Committee</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">L4 Team</span>
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-0.5">{tree.map(renderNode)}</div>

      {/* Depth info */}
      <div className="px-3 pt-3 mt-2 border-t border-border text-[10px] text-muted-foreground">
        Max hierarchy depth: {MAX_WORKSPACE_DEPTH} levels
      </div>
    </div>
  );
}
