import { Button } from '@/components/ui/button';
import { 
  WorkspaceRole, 
  WorkspaceType, 
  Workspace 
} from '@/types';
import { useWorkspaceRBAC } from '@/hooks/useWorkspaceRBAC';
import { 
  WorkspaceHierarchyLevel, 
  getWorkspaceRoleLevel 
} from '@/lib/workspaceHierarchy';
import {
  Send,
  FileText,
  Wallet,
  Package,
  UserPlus,
  ArrowRightLeft,
  Settings,
  BarChart3,
  ClipboardList,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleBasedActionsProps {
  workspace: Workspace;
  userRole: WorkspaceRole | null;
  onDelegateRole?: () => void;
  onInviteMember?: () => void;
  onSubmitForApproval?: () => void;
  onLogHours?: () => void;
  onViewReport?: () => void;
  onManageSettings?: () => void;
  onCreateTask?: () => void;
  onRequestBudget?: () => void;
  onRequestResource?: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  minLevel: WorkspaceHierarchyLevel;
  workspaceTypes?: WorkspaceType[];
  description?: string;
}

export function RoleBasedActions({
  workspace,
  userRole,
  onDelegateRole,
  onInviteMember,
  onSubmitForApproval,
  onLogHours,
  onViewReport,
  onManageSettings,
  onCreateTask,
  onRequestBudget,
  onRequestResource,
  className,
  variant = 'full',
}: RoleBasedActionsProps) {
  const rbac = useWorkspaceRBAC(userRole);
  const userLevel = userRole ? getWorkspaceRoleLevel(userRole) : WorkspaceHierarchyLevel.COORDINATOR;

  // Define all possible actions with their permission requirements
  const allActions: ActionButton[] = [
    // Owner Level Actions (L1)
    {
      id: 'delegate-role',
      label: 'Delegate Role',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      onClick: onDelegateRole,
      variant: 'default',
      minLevel: WorkspaceHierarchyLevel.OWNER,
      workspaceTypes: [WorkspaceType.ROOT],
      description: 'Transfer responsibility to another member',
    },
    {
      id: 'manage-settings',
      label: 'Manage Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: onManageSettings,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.OWNER,
      workspaceTypes: [WorkspaceType.ROOT],
      description: 'Configure workspace settings',
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: onViewReport,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.OWNER,
      workspaceTypes: [WorkspaceType.ROOT],
      description: 'View event-wide analytics',
    },
    // Manager Level Actions (L2)
    {
      id: 'delegate-dept',
      label: 'Delegate Responsibility',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      onClick: onDelegateRole,
      variant: 'default',
      minLevel: WorkspaceHierarchyLevel.MANAGER,
      workspaceTypes: [WorkspaceType.DEPARTMENT],
      description: 'Transfer department responsibility',
    },
    {
      id: 'invite-lead',
      label: 'Invite Lead',
      icon: <UserPlus className="h-4 w-4" />,
      onClick: onInviteMember,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.MANAGER,
      workspaceTypes: [WorkspaceType.DEPARTMENT],
      description: 'Add committee leads',
    },
    {
      id: 'view-dept-report',
      label: 'Department Report',
      icon: <FileText className="h-4 w-4" />,
      onClick: onViewReport,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.MANAGER,
      workspaceTypes: [WorkspaceType.DEPARTMENT],
      description: 'View department performance',
    },
    // Lead Level Actions (L3)
    {
      id: 'submit-budget',
      label: 'Request Budget',
      icon: <Wallet className="h-4 w-4" />,
      onClick: onRequestBudget,
      variant: 'default',
      minLevel: WorkspaceHierarchyLevel.LEAD,
      workspaceTypes: [WorkspaceType.COMMITTEE],
      description: 'Request additional budget from department',
    },
    {
      id: 'submit-resource',
      label: 'Request Resources',
      icon: <Package className="h-4 w-4" />,
      onClick: onRequestResource,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.LEAD,
      workspaceTypes: [WorkspaceType.COMMITTEE],
      description: 'Request equipment or personnel',
    },
    {
      id: 'invite-coordinator',
      label: 'Invite Coordinator',
      icon: <UserPlus className="h-4 w-4" />,
      onClick: onInviteMember,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.LEAD,
      workspaceTypes: [WorkspaceType.COMMITTEE],
      description: 'Add team coordinators',
    },
    {
      id: 'delegate-committee',
      label: 'Delegate Lead',
      icon: <ArrowRightLeft className="h-4 w-4" />,
      onClick: onDelegateRole,
      variant: 'secondary',
      minLevel: WorkspaceHierarchyLevel.LEAD,
      workspaceTypes: [WorkspaceType.COMMITTEE],
      description: 'Transfer committee lead responsibility',
    },
    // Coordinator Level Actions (L4)
    {
      id: 'log-hours',
      label: 'Log Hours',
      icon: <Timer className="h-4 w-4" />,
      onClick: onLogHours,
      variant: 'default',
      minLevel: WorkspaceHierarchyLevel.COORDINATOR,
      workspaceTypes: [WorkspaceType.TEAM],
      description: 'Log your work hours',
    },
    {
      id: 'submit-timesheet',
      label: 'Submit Timesheet',
      icon: <Send className="h-4 w-4" />,
      onClick: onSubmitForApproval,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.COORDINATOR,
      workspaceTypes: [WorkspaceType.TEAM],
      description: 'Submit timesheet for approval',
    },
    {
      id: 'view-tasks',
      label: 'My Tasks',
      icon: <ClipboardList className="h-4 w-4" />,
      onClick: onCreateTask,
      variant: 'outline',
      minLevel: WorkspaceHierarchyLevel.COORDINATOR,
      workspaceTypes: [WorkspaceType.TEAM],
      description: 'View assigned tasks',
    },
  ];

  // Filter actions based on user level and workspace type
  const availableActions = allActions.filter((action) => {
    // Check minimum level requirement (lower number = higher rank)
    if (userLevel > action.minLevel) return false;
    
    // Check workspace type if specified
    if (action.workspaceTypes && workspace.workspaceType) {
      if (!action.workspaceTypes.includes(workspace.workspaceType)) return false;
    }
    
    // Check if handler exists
    if (!action.onClick) return false;
    
    return true;
  });

  if (availableActions.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {availableActions.slice(0, 3).map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            className="gap-1.5"
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-xl border border-border p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
        <span className="text-xs text-muted-foreground">
          {rbac.permissionDescription}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {availableActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            className="justify-start gap-2 h-auto py-2.5 px-3"
          >
            <div className="flex-shrink-0">{action.icon}</div>
            <div className="flex flex-col items-start text-left min-w-0">
              <span className="text-sm font-medium truncate">{action.label}</span>
              {action.description && (
                <span className="text-xs text-muted-foreground truncate max-w-full">
                  {action.description}
                </span>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Minimal role indicator for headers
 */
export function RoleBadge({ 
  userRole, 
  className 
}: { 
  userRole: WorkspaceRole | null; 
  className?: string;
}) {
  if (!userRole) return null;
  
  const level = getWorkspaceRoleLevel(userRole);
  
  const levelStyles: Record<WorkspaceHierarchyLevel, string> = {
    [WorkspaceHierarchyLevel.OWNER]: 'bg-primary/20 text-primary border-primary/30',
    [WorkspaceHierarchyLevel.MANAGER]: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    [WorkspaceHierarchyLevel.LEAD]: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    [WorkspaceHierarchyLevel.COORDINATOR]: 'bg-muted text-muted-foreground border-border',
  };
  
  const levelLabels: Record<WorkspaceHierarchyLevel, string> = {
    [WorkspaceHierarchyLevel.OWNER]: 'Owner',
    [WorkspaceHierarchyLevel.MANAGER]: 'Manager',
    [WorkspaceHierarchyLevel.LEAD]: 'Lead',
    [WorkspaceHierarchyLevel.COORDINATOR]: 'Coordinator',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-medium rounded-full border',
      levelStyles[level],
      className
    )}>
      {levelLabels[level]}
    </span>
  );
}
