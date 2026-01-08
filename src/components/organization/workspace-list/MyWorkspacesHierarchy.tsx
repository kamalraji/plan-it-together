import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRightIcon,
  FolderIcon,
  Squares2X2Icon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { WorkspaceStatus } from '@/types';
import { WorkspaceItem } from './WorkspaceCard';
import { buildHierarchyChain, buildWorkspaceUrl, slugify } from '@/lib/workspaceNavigation';

interface MyWorkspacesHierarchyProps {
  workspaces: WorkspaceItem[];
  allWorkspaces?: WorkspaceItem[];
  orgSlug?: string;
}

interface TreeNodeProps {
  workspace: WorkspaceItem;
  allWorkspaces: WorkspaceItem[];
  orgSlug?: string;
  depth?: number;
  index?: number;
}

const getStatusColor = (status: WorkspaceStatus) => {
  switch (status) {
    case WorkspaceStatus.ACTIVE:
      return 'bg-emerald-500';
    case WorkspaceStatus.PROVISIONING:
      return 'bg-amber-500';
    case WorkspaceStatus.WINDING_DOWN:
      return 'bg-rose-500';
    default:
      return 'bg-muted-foreground/40';
  }
};

const TreeNode: React.FC<TreeNodeProps> = ({
  workspace,
  allWorkspaces,
  orgSlug,
  depth = 0,
  index = 0,
}) => {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const hasChildren = workspace.subWorkspaces && workspace.subWorkspaces.length > 0;

  const workspaceDataForHierarchy = useMemo(() => {
    return allWorkspaces.map(ws => ({
      id: ws.id,
      slug: ws.slug || slugify(ws.name),
      name: ws.name,
      workspaceType: ws.workspaceType || null,
      parentWorkspaceId: ws.parentWorkspaceId,
    }));
  }, [allWorkspaces]);

  const handleClick = () => {
    if (workspace.eventId && orgSlug) {
      const hierarchy = buildHierarchyChain(workspace.id, workspaceDataForHierarchy);
      const eventSlug = workspace.event?.slug || slugify(workspace.event?.name || '');
      const url = buildWorkspaceUrl({
        orgSlug,
        eventSlug,
        eventId: workspace.eventId,
        hierarchy,
      });
      navigate(url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      {/* Tree line connector */}
      <div className="flex items-stretch">
        {/* Vertical line and branch for children */}
        {depth > 0 && (
          <div className="flex items-center mr-2">
            {Array.from({ length: depth }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-full border-l border-border/40",
                  i === depth - 1 && "border-b rounded-bl"
                )}
              />
            ))}
          </div>
        )}

        {/* Node content */}
        <div className="flex-1">
          <motion.div
            whileHover={{ x: 2 }}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-xl cursor-pointer",
              "bg-gradient-to-r from-card/80 to-card/40",
              "border border-border/40 hover:border-primary/30",
              "hover:shadow-lg hover:shadow-primary/5",
              "transition-all duration-300"
            )}
            onClick={handleClick}
          >
            {/* Expand/Collapse toggle */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className={cn(
                  "p-1 rounded-md",
                  "hover:bg-primary/10 transition-colors"
                )}
              >
                <motion.div
                  animate={{ rotate: expanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>
            ) : (
              <div className="w-6" />
            )}

            {/* Icon with gradient background */}
            <div className={cn(
              "relative p-2 rounded-lg",
              "bg-gradient-to-br from-primary/20 to-primary/5",
              "border border-primary/20",
              "group-hover:from-primary/30 group-hover:to-primary/10",
              "transition-all duration-300"
            )}>
              {hasChildren ? (
                <FolderIcon className="h-4 w-4 text-primary" />
              ) : (
                <Squares2X2Icon className="h-4 w-4 text-primary" />
              )}
              {/* Status indicator */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full",
                "border-2 border-card",
                getStatusColor(workspace.status)
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {workspace.name}
                </h4>
                {workspace.isOwner && (
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                    "bg-gradient-to-r from-primary/20 to-primary/10",
                    "text-primary border border-primary/20"
                  )}>
                    Owner
                  </span>
                )}
                {hasChildren && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {workspace.subWorkspaces!.length} sub
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {workspace.event && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{workspace.event.name}</span>
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/50">
                  {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </motion.div>

          {/* Children */}
          <AnimatePresence initial={false}>
            {expanded && hasChildren && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 mt-2 space-y-2 border-l-2 border-border/30 pl-4"
              >
                {workspace.subWorkspaces!.map((child, childIndex) => (
                  <TreeNode
                    key={child.id}
                    workspace={child}
                    allWorkspaces={allWorkspaces}
                    orgSlug={orgSlug}
                    depth={depth + 1}
                    index={childIndex}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export const MyWorkspacesHierarchy: React.FC<MyWorkspacesHierarchyProps> = ({
  workspaces,
  allWorkspaces,
  orgSlug,
}) => {
  const flatList = allWorkspaces || workspaces;
  const totalCount = workspaces.reduce((acc, ws) => 
    acc + 1 + (ws.subWorkspaces?.length || 0), 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-card via-card to-muted/20",
        "border border-border/50",
        "shadow-xl shadow-black/5"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-3 border-b border-border/30",
        "bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              "bg-gradient-to-br from-primary/20 to-primary/10",
              "border border-primary/20"
            )}>
              <SparklesIcon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">My Workspaces</h3>
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            "bg-primary/10 text-primary border border-primary/20"
          )}>
            {totalCount} total
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {workspaces.length === 0 ? (
          <div className="py-8 text-center">
            <FolderIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No workspaces yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create your first workspace to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map((workspace, index) => (
              <TreeNode
                key={workspace.id}
                workspace={workspace}
                allWorkspaces={flatList}
                orgSlug={orgSlug}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
