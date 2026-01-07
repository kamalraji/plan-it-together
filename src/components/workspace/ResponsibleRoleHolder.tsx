import { Shield, UserPlus, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TeamMember, WorkspaceRole } from '@/types';
import { getWorkspaceRoleLabel, getWorkspaceRoleLevel, WorkspaceHierarchyLevel } from '@/lib/workspaceHierarchy';
import { cn } from '@/lib/utils';

interface ResponsibleRoleHolderProps {
  role: WorkspaceRole;
  holder?: TeamMember;
  compact?: boolean;
  showDelegateButton?: boolean;
  onDelegateClick?: () => void;
}

export function ResponsibleRoleHolder({
  role,
  holder,
  compact = false,
  showDelegateButton = false,
  onDelegateClick,
}: ResponsibleRoleHolderProps) {
  const level = getWorkspaceRoleLevel(role);

  const getLevelColor = (lvl: WorkspaceHierarchyLevel): string => {
    switch (lvl) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'text-amber-600 dark:text-amber-400';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'text-violet-600 dark:text-violet-400';
      case WorkspaceHierarchyLevel.LEAD:
        return 'text-blue-600 dark:text-blue-400';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'text-emerald-600 dark:text-emerald-400';
    }
  };

  const getLevelBgColor = (lvl: WorkspaceHierarchyLevel): string => {
    switch (lvl) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'bg-amber-500/10';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'bg-violet-500/10';
      case WorkspaceHierarchyLevel.LEAD:
        return 'bg-blue-500/10';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'bg-emerald-500/10';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
              getLevelBgColor(level)
            )}>
              {holder ? (
                <>
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className={cn('text-[8px]', getLevelColor(level))}>
                      {holder.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn('font-medium truncate max-w-[80px]', getLevelColor(level))}>
                    {holder.user.name?.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <User className={cn('h-3 w-3', getLevelColor(level))} />
                  <span className={cn('font-medium', getLevelColor(level))}>Vacant</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Shield className={cn('h-3.5 w-3.5', getLevelColor(level))} />
                <span className="font-medium">{getWorkspaceRoleLabel(role)}</span>
              </div>
              {holder ? (
                <p className="text-xs text-muted-foreground">
                  Held by: {holder.user.name} ({holder.user.email})
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No one assigned yet</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full',
        getLevelBgColor(level)
      )}>
        <Shield className={cn('h-5 w-5', getLevelColor(level))} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', getLevelColor(level))}>
          {getWorkspaceRoleLabel(role)}
        </p>
        {holder ? (
          <div className="flex items-center gap-2 mt-0.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-muted">
                {holder.user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground truncate">{holder.user.name}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Position vacant</p>
        )}
      </div>

      {showDelegateButton && onDelegateClick && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onDelegateClick}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          {holder ? 'Delegate' : 'Assign'}
        </Button>
      )}
    </div>
  );
}
