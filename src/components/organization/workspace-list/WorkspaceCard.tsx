import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRightIcon,
  CalendarIcon,
  Squares2X2Icon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { WorkspaceStatus } from '@/types';

export interface WorkspaceItem {
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

interface WorkspaceCardProps {
  workspace: WorkspaceItem;
  depth?: number;
  index?: number;
  onClick: (workspace: WorkspaceItem) => void;
}

const getStatusStyles = (status: WorkspaceStatus) => {
  switch (status) {
    case WorkspaceStatus.ACTIVE:
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case WorkspaceStatus.PROVISIONING:
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case WorkspaceStatus.WINDING_DOWN:
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case WorkspaceStatus.ARCHIVED:
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  depth = 0,
  index = 0,
  onClick,
}) => {
  const hasSubWorkspaces = workspace.subWorkspaces && workspace.subWorkspaces.length > 0;

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onClick={() => onClick(workspace)}
        className={cn(
          "w-full group relative p-3 rounded-lg border border-border/50",
          "bg-card/60 backdrop-blur-sm",
          "hover:border-primary/40 hover:bg-card/80",
          "transition-all duration-200 text-left",
          "focus:outline-none focus:ring-1 focus:ring-primary/30"
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 p-1.5 rounded-md",
            "bg-primary/10 border border-primary/10"
          )}>
            {hasSubWorkspaces ? (
              <FolderOpenIcon className="h-4 w-4 text-primary" />
            ) : (
              <Squares2X2Icon className="h-4 w-4 text-primary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-sm">
                {workspace.name}
              </h3>
              {workspace.isOwner && (
                <span className="text-[9px] px-1.5 py-0.5 bg-primary/15 text-primary rounded font-medium">
                  Owner
                </span>
              )}
              {workspace.isMember && !workspace.isOwner && (
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded font-medium">
                  Member
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {workspace.event && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{workspace.event.name}</span>
                </span>
              )}
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-medium border",
                getStatusStyles(workspace.status)
              )}>
                {workspace.status}
              </span>
              <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
                {formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </motion.button>

      {/* Sub-workspaces */}
      {hasSubWorkspaces && (
        <div className="mt-2 space-y-2">
          {workspace.subWorkspaces!.map((sub, subIndex) => (
            <WorkspaceCard
              key={sub.id}
              workspace={sub}
              depth={depth + 1}
              index={subIndex}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
