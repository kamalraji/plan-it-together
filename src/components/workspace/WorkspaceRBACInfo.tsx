import { WorkspaceRole } from '@/types';
import { useWorkspaceRBAC, getRoleManagementCapabilities } from '@/hooks/useWorkspaceRBAC';
import { getWorkspaceRoleLabel, WorkspaceHierarchyLevel } from '@/lib/workspaceHierarchy';
import { ShieldCheckIcon, ShieldAlertIcon, UsersIcon, ArrowDownIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WorkspaceRBACInfoProps {
  userRole: WorkspaceRole | null;
  showAssignableRoles?: boolean;
}

/**
 * Component that displays the current user's RBAC capabilities
 * Shows what roles they can manage based on the 4-level hierarchy
 */
export function WorkspaceRBACInfo({ userRole, showAssignableRoles = true }: WorkspaceRBACInfoProps) {
  const rbac = useWorkspaceRBAC(userRole);

  if (!userRole) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlertIcon className="h-5 w-5 text-destructive" />
            <CardTitle className="text-sm">No Role Assigned</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You don't have a workspace role assigned. Contact your workspace administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getLevelColor = (level: WorkspaceHierarchyLevel): string => {
    switch (level) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case WorkspaceHierarchyLevel.LEAD:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getLevelLabel = (level: WorkspaceHierarchyLevel): string => {
    switch (level) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'Level 1 - Owner';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'Level 2 - Manager';
      case WorkspaceHierarchyLevel.LEAD:
        return 'Level 3 - Lead';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'Level 4 - Coordinator';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Your Permissions</CardTitle>
          </div>
          <Badge variant="outline" className={getLevelColor(rbac.userLevel)}>
            {getLevelLabel(rbac.userLevel)}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {getWorkspaceRoleLabel(userRole)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Summary */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-foreground">{rbac.permissionDescription}</p>
        </div>

        {/* Management Capabilities */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <UsersIcon className="h-3.5 w-3.5" />
            <span>Management Scope</span>
          </div>
          <p className="text-sm text-foreground">
            {getRoleManagementCapabilities(userRole)}
          </p>
        </div>

        {/* Assignable Roles */}
        {showAssignableRoles && rbac.assignableRoles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ArrowDownIcon className="h-3.5 w-3.5" />
              <span>Can Assign ({rbac.assignableRoles.length} roles)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rbac.assignableRoles.slice(0, 8).map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {getWorkspaceRoleLabel(role)}
                </Badge>
              ))}
              {rbac.assignableRoles.length > 8 && (
                <Badge variant="outline" className="text-xs">
                  +{rbac.assignableRoles.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* No Management Access */}
        {rbac.assignableRoles.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldAlertIcon className="h-4 w-4" />
            <span>You cannot assign roles to other team members</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
