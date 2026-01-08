import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRightIcon,
  FolderIcon,
  CalendarIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  UsersIcon,
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

// Level configuration
const LEVEL_CONFIG = {
  ROOT: {
    label: 'Root',
    shortLabel: 'L1',
    color: 'from-violet-500/20 to-violet-500/5',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10',
    icon: FolderIcon,
  },
  DEPARTMENT: {
    label: 'Department',
    shortLabel: 'L2',
    color: 'from-blue-500/20 to-blue-500/5',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: BuildingOffice2Icon,
  },
  COMMITTEE: {
    label: 'Committee',
    shortLabel: 'L3',
    color: 'from-emerald-500/20 to-emerald-500/5',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: UserGroupIcon,
  },
  TEAM: {
    label: 'Team',
    shortLabel: 'L4',
    color: 'from-amber-500/20 to-amber-500/5',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: UsersIcon,
  },
};

type WorkspaceLevel = keyof typeof LEVEL_CONFIG;

const getWorkspaceLevel = (workspace: WorkspaceItem, depth: number): WorkspaceLevel => {
  // Use workspaceType if available, otherwise infer from depth
  if (workspace.workspaceType) {
    const type = workspace.workspaceType.toUpperCase();
    if (type in LEVEL_CONFIG) return type as WorkspaceLevel;
  }
  
  // Infer from depth
  switch (depth) {
    case 0: return 'ROOT';
    case 1: return 'DEPARTMENT';
    case 2: return 'COMMITTEE';
    default: return 'TEAM';
  }
};

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

interface HierarchyNodeProps {
  workspace: WorkspaceItem;
  allWorkspaces: WorkspaceItem[];
  orgSlug?: string;
  depth?: number;
  index?: number;
}

const HierarchyNode: React.FC<HierarchyNodeProps> = ({
  workspace,
  allWorkspaces,
  orgSlug,
  depth = 0,
  index = 0,
}) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const navigate = useNavigate();
  const hasChildren = workspace.subWorkspaces && workspace.subWorkspaces.length > 0;
  
  const level = getWorkspaceLevel(workspace, depth);
  const config = LEVEL_CONFIG[level];
  const LevelIcon = config.icon;

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
      className={cn(depth > 0 && "ml-4 pl-4 border-l-2 border-border/30")}
    >
      {/* Node content */}
      <motion.div
        whileHover={{ x: 2 }}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2",
          "bg-gradient-to-r", config.color,
          "border", config.borderColor,
          "hover:shadow-lg hover:shadow-black/5",
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
              "hover:bg-background/50 transition-colors"
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

        {/* Level badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg",
          config.bgColor,
          "border", config.borderColor
        )}>
          <LevelIcon className={cn("h-4 w-4", config.textColor)} />
          <span className={cn("text-[10px] font-bold", config.textColor)}>
            {config.shortLabel}
          </span>
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
                "bg-primary/10 text-primary border border-primary/20"
              )}>
                Owner
              </span>
            )}
            {hasChildren && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                {workspace.subWorkspaces!.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {workspace.event && depth === 0 && (
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

        {/* Status indicator */}
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          getStatusColor(workspace.status)
        )} />

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
            className="space-y-1"
          >
            {workspace.subWorkspaces!.map((child, childIndex) => (
              <HierarchyNode
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
    </motion.div>
  );
};

interface RootWorkspaceCardProps {
  workspace: WorkspaceItem;
  allWorkspaces: WorkspaceItem[];
  orgSlug?: string;
  index: number;
}

const RootWorkspaceCard: React.FC<RootWorkspaceCardProps> = ({
  workspace,
  allWorkspaces,
  orgSlug,
  index,
}) => {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const hasChildren = workspace.subWorkspaces && workspace.subWorkspaces.length > 0;
  
  const config = LEVEL_CONFIG.ROOT;
  const LevelIcon = config.icon;

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

  // Count all descendants by level
  const levelCounts = useMemo(() => {
    const counts = { DEPARTMENT: 0, COMMITTEE: 0, TEAM: 0 };
    const countChildren = (children: WorkspaceItem[] | undefined, depth: number) => {
      if (!children) return;
      children.forEach(child => {
        const level = getWorkspaceLevel(child, depth);
        if (level !== 'ROOT') counts[level]++;
        countChildren(child.subWorkspaces, depth + 1);
      });
    };
    countChildren(workspace.subWorkspaces, 1);
    return counts;
  }, [workspace.subWorkspaces]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-card via-card to-muted/10",
        "border border-border/50",
        "shadow-lg shadow-black/5",
        "hover:shadow-xl hover:border-primary/20",
        "transition-all duration-300"
      )}
    >
      {/* Root workspace header */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 cursor-pointer",
          "bg-gradient-to-r", config.color,
          "border-b", config.borderColor,
          "hover:from-violet-500/15 hover:to-violet-500/5",
          "transition-all duration-300 group"
        )}
        onClick={handleClick}
      >
        {/* Expand/Collapse toggle */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className={cn(
              "p-1.5 rounded-lg",
              "hover:bg-background/50 transition-colors"
            )}
          >
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
        )}

        {/* Level badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl",
          config.bgColor,
          "border", config.borderColor
        )}>
          <LevelIcon className={cn("h-5 w-5", config.textColor)} />
          <span className={cn("text-xs font-bold", config.textColor)}>
            {config.shortLabel}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {workspace.name}
            </h3>
            {workspace.isOwner && (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium",
                "bg-primary/10 text-primary border border-primary/20"
              )}>
                Owner
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {workspace.event && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{workspace.event.name}</span>
              </span>
            )}
            {/* Level counts */}
            <div className="flex items-center gap-2">
              {levelCounts.DEPARTMENT > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  LEVEL_CONFIG.DEPARTMENT.bgColor,
                  LEVEL_CONFIG.DEPARTMENT.textColor
                )}>
                  {levelCounts.DEPARTMENT} Dept
                </span>
              )}
              {levelCounts.COMMITTEE > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  LEVEL_CONFIG.COMMITTEE.bgColor,
                  LEVEL_CONFIG.COMMITTEE.textColor
                )}>
                  {levelCounts.COMMITTEE} Comm
                </span>
              )}
              {levelCounts.TEAM > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  LEVEL_CONFIG.TEAM.bgColor,
                  LEVEL_CONFIG.TEAM.textColor
                )}>
                  {levelCounts.TEAM} Team
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground/50">
              {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className={cn(
          "w-3 h-3 rounded-full",
          getStatusColor(workspace.status)
        )} />

        {/* Arrow */}
        <ChevronRightIcon className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-1 bg-muted/5">
              {workspace.subWorkspaces!.map((child, childIndex) => (
                <HierarchyNode
                  key={child.id}
                  workspace={child}
                  allWorkspaces={allWorkspaces}
                  orgSlug={orgSlug}
                  depth={1}
                  index={childIndex}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="space-y-4">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            "bg-gradient-to-br from-primary/20 to-primary/10",
            "border border-primary/20"
          )}>
            <SparklesIcon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">My Workspaces</h3>
        </div>
        
        {/* Level legend */}
        <div className="flex items-center gap-2">
          {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
            <span
              key={key}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                cfg.bgColor, cfg.textColor
              )}
            >
              {cfg.shortLabel}
            </span>
          ))}
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full ml-2",
            "bg-primary/10 text-primary border border-primary/20"
          )}>
            {totalCount} total
          </span>
        </div>
      </motion.div>

      {/* Workspace Cards */}
      {workspaces.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-8 text-center",
            "bg-gradient-to-br from-card via-card to-muted/20",
            "border border-border/50"
          )}
        >
          <FolderIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No workspaces yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Create your first workspace to get started</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {workspaces.map((workspace, index) => (
            <RootWorkspaceCard
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
  );
};
