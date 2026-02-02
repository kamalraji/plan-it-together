import { ReactNode } from 'react';
import { WorkspaceRole } from '@/types';
import { useWorkspaceRBAC } from '@/hooks/useWorkspaceRBAC';
import { ShieldXIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkspacePermissionGuardProps {
  /** The user's current workspace role */
  userRole: WorkspaceRole | null;
  /** The target role being managed */
  targetRole?: WorkspaceRole;
  /** Required permission check */
  requiredPermission: 'manage' | 'assign' | 'edit' | 'remove' | 'createTask';
  /** Content to render if permission is granted */
  children: ReactNode;
  /** Fallback content if permission is denied (optional) */
  fallback?: ReactNode;
  /** Show a disabled version instead of hiding (optional) */
  showDisabled?: boolean;
  /** Custom tooltip message for disabled state */
  disabledTooltip?: string;
}

/**
 * Component that conditionally renders children based on workspace RBAC permissions.
 * Enforces the 4-level hierarchy where:
 * - Managers can only manage Leads
 * - Leads can only manage Coordinators
 */
export function WorkspacePermissionGuard({
  userRole,
  targetRole,
  requiredPermission,
  children,
  fallback = null,
  showDisabled = false,
  disabledTooltip,
}: WorkspacePermissionGuardProps) {
  const rbac = useWorkspaceRBAC(userRole);

  const hasPermission = (): boolean => {
    if (!targetRole && requiredPermission !== 'createTask') {
      // If no target role specified, check if user has any management capability
      return rbac.isLeadOrAbove;
    }

    switch (requiredPermission) {
      case 'manage':
        return targetRole ? rbac.canManage(targetRole) : rbac.isLeadOrAbove;
      case 'assign':
        return targetRole ? rbac.canAssign(targetRole) : rbac.assignableRoles.length > 0;
      case 'edit':
        return targetRole ? rbac.canEditMember(targetRole) : rbac.isLeadOrAbove;
      case 'remove':
        return targetRole ? rbac.canRemoveMember(targetRole) : rbac.isLeadOrAbove;
      case 'createTask':
        return targetRole ? rbac.canCreateTaskForRole(targetRole) : true;
      default:
        return false;
    }
  };

  const permitted = hasPermission();

  if (permitted) {
    return <>{children}</>;
  }

  if (showDisabled) {
    const tooltip = disabledTooltip || getDefaultDisabledMessage(requiredPermission, rbac.permissionDescription);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="opacity-50 cursor-not-allowed pointer-events-none">
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="flex items-center gap-2">
              <ShieldXIcon className="h-4 w-4 text-destructive" />
              <span>{tooltip}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
}

function getDefaultDisabledMessage(permission: string, userDescription: string): string {
  const messages: Record<string, string> = {
    manage: 'You cannot manage this role based on your hierarchy level',
    assign: 'You cannot assign this role based on your hierarchy level',
    edit: 'You cannot edit members with this role',
    remove: 'You cannot remove members with this role',
    createTask: 'You cannot create tasks for this role scope',
  };
  
  return messages[permission] || userDescription;
}

/**
 * Badge component showing permission status
 */
interface PermissionBadgeProps {
  userRole: WorkspaceRole | null;
  targetRole: WorkspaceRole;
  action: 'manage' | 'assign';
}

export function PermissionBadge({ userRole, targetRole, action }: PermissionBadgeProps) {
  const rbac = useWorkspaceRBAC(userRole);
  
  const canPerform = action === 'manage' 
    ? rbac.canManage(targetRole) 
    : rbac.canAssign(targetRole);

  if (canPerform) {
    return (
      <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-500/20">
        Can {action}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
      Cannot {action}
    </span>
  );
}
