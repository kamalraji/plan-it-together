import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDownIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { WorkspaceCard, WorkspaceItem } from './WorkspaceCard';
import { buildHierarchyChain, buildWorkspaceUrl, slugify } from '@/lib/workspaceNavigation';

interface WorkspaceGroupProps {
  title: string;
  icon: React.ReactNode;
  workspaces: WorkspaceItem[];
  allWorkspaces?: WorkspaceItem[]; // Flat list of all workspaces for hierarchy building
  emptyMessage: string;
  defaultExpanded?: boolean;
  orgSlug?: string;
}

export const WorkspaceGroup: React.FC<WorkspaceGroupProps> = ({
  title,
  icon,
  workspaces,
  allWorkspaces,
  emptyMessage,
  defaultExpanded = true,
  orgSlug,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  // Build workspace data for hierarchy chain building
  const workspaceDataForHierarchy = useMemo(() => {
    const source = allWorkspaces || workspaces;
    return source.map(ws => ({
      id: ws.id,
      slug: ws.slug || slugify(ws.name),
      name: ws.name,
      workspaceType: ws.workspaceType || null,
      parentWorkspaceId: ws.parentWorkspaceId,
    }));
  }, [allWorkspaces, workspaces]);

  const handleWorkspaceClick = (workspace: WorkspaceItem) => {
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm",
        "overflow-hidden"
      )}
    >
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5",
          "bg-muted/30 hover:bg-muted/50 transition-colors duration-150",
          "border-b border-border/30",
          "group"
        )}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xs font-semibold text-foreground">{title}</h2>
          <span className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            "bg-background/80 text-muted-foreground"
          )}>
            {workspaces.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </motion.div>
      </button>

      {/* Group Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {workspaces.length === 0 ? (
              <div className="py-4 px-3 text-center">
                <FolderIcon className="h-4 w-4 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="text-[11px] text-muted-foreground">{emptyMessage}</p>
              </div>
            ) : (
              <div className="p-1.5 space-y-1">
                {workspaces.map((workspace, index) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    index={index}
                    onClick={handleWorkspaceClick}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
