/**
 * CrossWorkspaceDrop - Enable dropping tasks into different workspaces
 */
import { useState, DragEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Folder, ChevronRight } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  icon?: ReactNode;
}

interface CrossWorkspaceDropProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onMoveTask: (taskId: string, targetWorkspaceId: string) => void;
  children: ReactNode;
  className?: string;
}

interface WorkspaceDropZoneProps {
  workspace: Workspace;
  isDropTarget: boolean;
  isCurrent: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
}

function WorkspaceDropZone({
  workspace,
  isDropTarget,
  isCurrent,
  onDragOver,
  onDragLeave,
  onDrop,
}: WorkspaceDropZoneProps) {
  if (isCurrent) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer border',
        isDropTarget
          ? 'bg-primary/10 border-primary scale-105'
          : 'bg-muted/30 border-transparent hover:bg-muted/50'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
        {workspace.icon || <Folder className="h-4 w-4 text-muted-foreground" />}
      </div>
      <span className="text-sm font-medium truncate">{workspace.name}</span>
      {isDropTarget && (
        <ChevronRight className="h-4 w-4 ml-auto text-primary animate-pulse" />
      )}
    </div>
  );
}

export function CrossWorkspaceDrop({
  workspaces,
  currentWorkspaceId,
  onMoveTask,
  children,
  className,
}: CrossWorkspaceDropProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [showDropZones, setShowDropZones] = useState(false);

  const handleDragOver = (workspaceId: string) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(workspaceId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (workspaceId: string) => (e: DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId && workspaceId !== currentWorkspaceId) {
      onMoveTask(taskId, workspaceId);
    }
    
    setDropTarget(null);
    setShowDropZones(false);
  };

  // Detect when dragging starts/ends in the children area
  const handleDragEnter = () => {
    setShowDropZones(true);
  };

  const handleDragEnd = () => {
    setShowDropZones(false);
    setDropTarget(null);
  };

  const otherWorkspaces = workspaces.filter(w => w.id !== currentWorkspaceId);

  if (otherWorkspaces.length === 0) {
    return <>{children}</>;
  }

  return (
    <div 
      className={cn('relative', className)}
      onDragEnter={handleDragEnter}
      onDragEnd={handleDragEnd}
    >
      {/* Workspace drop zones sidebar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-64 -ml-72 p-3 space-y-2 rounded-xl border border-border bg-card shadow-lg transition-all duration-300 z-50',
          showDropZones
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-4 pointer-events-none'
        )}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Move to workspace
        </p>
        {otherWorkspaces.map((workspace) => (
          <WorkspaceDropZone
            key={workspace.id}
            workspace={workspace}
            isDropTarget={dropTarget === workspace.id}
            isCurrent={workspace.id === currentWorkspaceId}
            onDragOver={handleDragOver(workspace.id)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(workspace.id)}
          />
        ))}
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}
