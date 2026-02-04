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
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FolderPlus,
  Megaphone,
  Target,
  TrendingUp,
  MessageSquare,
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
  onCreateSubWorkspace?: () => void;
  onViewAnalytics?: () => void;
  onManageTeam?: () => void;
  onScheduleMeeting?: () => void;
  onReportIssue?: () => void;
  onViewProgress?: () => void;
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
  priority?: number; // Lower = higher priority for ordering
}

// Level-specific action configurations
const L1_ROOT_ACTIONS: Omit<ActionButton, 'onClick'>[] = [
  {
    id: 'create-department',
    label: 'Create Department',
    icon: <FolderPlus className="h-4 w-4" />,
    variant: 'default',
    minLevel: WorkspaceHierarchyLevel.OWNER,
    workspaceTypes: [WorkspaceType.ROOT],
    description: 'Add a new department to the organization',
    priority: 1,
  },
  {
    id: 'delegate-role',
    label: 'Delegate Ownership',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.OWNER,
    workspaceTypes: [WorkspaceType.ROOT],
    description: 'Transfer root ownership to another member',
    priority: 2,
  },
  {
    id: 'invite-manager',
    label: 'Invite Manager',
    icon: <UserPlus className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.OWNER,
    workspaceTypes: [WorkspaceType.ROOT],
    description: 'Add department managers',
    priority: 3,
  },
  {
    id: 'view-analytics',
    label: 'Event Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.OWNER,
    workspaceTypes: [WorkspaceType.ROOT],
    description: 'View event-wide performance metrics',
    priority: 4,
  },
  {
    id: 'manage-settings',
    label: 'Event Settings',
    icon: <Settings className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.OWNER,
    workspaceTypes: [WorkspaceType.ROOT],
    description: 'Configure event and workspace settings',
    priority: 5,
  },
  {
    id: 'broadcast-message',
    label: 'Broadcast Message',
    icon: <Megaphone className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.OWNER,
    workspaceTypes: [WorkspaceType.ROOT],
    description: 'Send announcement to all teams',
    priority: 6,
  },
];

const L2_DEPARTMENT_ACTIONS: Omit<ActionButton, 'onClick'>[] = [
  {
    id: 'create-committee',
    label: 'Create Committee',
    icon: <FolderPlus className="h-4 w-4" />,
    variant: 'default',
    minLevel: WorkspaceHierarchyLevel.MANAGER,
    workspaceTypes: [WorkspaceType.DEPARTMENT],
    description: 'Add a new committee under this department',
    priority: 1,
  },
  {
    id: 'delegate-dept',
    label: 'Delegate Manager',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.MANAGER,
    workspaceTypes: [WorkspaceType.DEPARTMENT],
    description: 'Transfer department management',
    priority: 2,
  },
  {
    id: 'invite-lead',
    label: 'Invite Lead',
    icon: <UserPlus className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.MANAGER,
    workspaceTypes: [WorkspaceType.DEPARTMENT],
    description: 'Add committee leads to your department',
    priority: 3,
  },
  {
    id: 'view-dept-report',
    label: 'Department Report',
    icon: <FileText className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.MANAGER,
    workspaceTypes: [WorkspaceType.DEPARTMENT],
    description: 'View department performance summary',
    priority: 4,
  },
  {
    id: 'review-budgets',
    label: 'Review Budgets',
    icon: <Wallet className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.MANAGER,
    workspaceTypes: [WorkspaceType.DEPARTMENT],
    description: 'Approve or reject budget requests',
    priority: 5,
  },
  {
    id: 'set-dept-goals',
    label: 'Set Goals',
    icon: <Target className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.MANAGER,
    workspaceTypes: [WorkspaceType.DEPARTMENT],
    description: 'Define department objectives and KPIs',
    priority: 6,
  },
];

const L3_COMMITTEE_ACTIONS: Omit<ActionButton, 'onClick'>[] = [
  {
    id: 'create-team',
    label: 'Create Team',
    icon: <FolderPlus className="h-4 w-4" />,
    variant: 'default',
    minLevel: WorkspaceHierarchyLevel.LEAD,
    workspaceTypes: [WorkspaceType.COMMITTEE],
    description: 'Add a new team under this committee',
    priority: 1,
  },
  {
    id: 'submit-budget',
    label: 'Request Budget',
    icon: <Wallet className="h-4 w-4" />,
    variant: 'default',
    minLevel: WorkspaceHierarchyLevel.LEAD,
    workspaceTypes: [WorkspaceType.COMMITTEE],
    description: 'Submit budget request to department',
    priority: 2,
  },
  {
    id: 'submit-resource',
    label: 'Request Resources',
    icon: <Package className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.LEAD,
    workspaceTypes: [WorkspaceType.COMMITTEE],
    description: 'Request equipment or personnel',
    priority: 3,
  },
  {
    id: 'invite-coordinator',
    label: 'Invite Coordinator',
    icon: <UserPlus className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.LEAD,
    workspaceTypes: [WorkspaceType.COMMITTEE],
    description: 'Add team coordinators',
    priority: 4,
  },
  {
    id: 'delegate-committee',
    label: 'Delegate Lead',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    variant: 'secondary',
    minLevel: WorkspaceHierarchyLevel.LEAD,
    workspaceTypes: [WorkspaceType.COMMITTEE],
    description: 'Transfer committee lead responsibility',
    priority: 5,
  },
  {
    id: 'track-progress',
    label: 'Track Progress',
    icon: <TrendingUp className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.LEAD,
    workspaceTypes: [WorkspaceType.COMMITTEE],
    description: 'View committee task completion',
    priority: 6,
  },
  {
    id: 'schedule-meeting',
    label: 'Schedule Meeting',
    icon: <Calendar className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.LEAD,
    workspaceTypes: [WorkspaceType.COMMITTEE],
    description: 'Plan committee sync-up',
    priority: 7,
  },
];

const L4_TEAM_ACTIONS: Omit<ActionButton, 'onClick'>[] = [
  {
    id: 'log-hours',
    label: 'Log Hours',
    icon: <Timer className="h-4 w-4" />,
    variant: 'default',
    minLevel: WorkspaceHierarchyLevel.COORDINATOR,
    workspaceTypes: [WorkspaceType.TEAM],
    description: 'Record your work hours',
    priority: 1,
  },
  {
    id: 'submit-timesheet',
    label: 'Submit Timesheet',
    icon: <Send className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.COORDINATOR,
    workspaceTypes: [WorkspaceType.TEAM],
    description: 'Submit timesheet for approval',
    priority: 2,
  },
  {
    id: 'view-tasks',
    label: 'My Tasks',
    icon: <ClipboardList className="h-4 w-4" />,
    variant: 'outline',
    minLevel: WorkspaceHierarchyLevel.COORDINATOR,
    workspaceTypes: [WorkspaceType.TEAM],
    description: 'View and manage assigned tasks',
    priority: 3,
  },
  {
    id: 'report-issue',
    label: 'Report Issue',
    icon: <AlertTriangle className="h-4 w-4" />,
    variant: 'secondary',
    minLevel: WorkspaceHierarchyLevel.COORDINATOR,
    workspaceTypes: [WorkspaceType.TEAM],
    description: 'Report a problem or blocker',
    priority: 4,
  },
  {
    id: 'mark-complete',
    label: 'Mark Complete',
    icon: <CheckCircle2 className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.COORDINATOR,
    workspaceTypes: [WorkspaceType.TEAM],
    description: 'Mark current task as done',
    priority: 5,
  },
  {
    id: 'team-chat',
    label: 'Team Chat',
    icon: <MessageSquare className="h-4 w-4" />,
    variant: 'ghost',
    minLevel: WorkspaceHierarchyLevel.COORDINATOR,
    workspaceTypes: [WorkspaceType.TEAM],
    description: 'Quick message to team members',
    priority: 6,
  },
];

// Get actions based on workspace type
function getActionsForWorkspaceType(workspaceType?: WorkspaceType): Omit<ActionButton, 'onClick'>[] {
  switch (workspaceType) {
    case WorkspaceType.ROOT:
      return L1_ROOT_ACTIONS;
    case WorkspaceType.DEPARTMENT:
      return L2_DEPARTMENT_ACTIONS;
    case WorkspaceType.COMMITTEE:
      return L3_COMMITTEE_ACTIONS;
    case WorkspaceType.TEAM:
      return L4_TEAM_ACTIONS;
    default:
      return [];
  }
}

// Get workspace level label
function getWorkspaceLevelLabel(workspaceType?: WorkspaceType): string {
  switch (workspaceType) {
    case WorkspaceType.ROOT:
      return 'Root (L1)';
    case WorkspaceType.DEPARTMENT:
      return 'Department (L2)';
    case WorkspaceType.COMMITTEE:
      return 'Committee (L3)';
    case WorkspaceType.TEAM:
      return 'Team (L4)';
    default:
      return 'Workspace';
  }
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
  onCreateSubWorkspace,
  onViewAnalytics,
  onScheduleMeeting,
  onReportIssue,
  onViewProgress,
  className,
  variant = 'full',
}: RoleBasedActionsProps) {
  const rbac = useWorkspaceRBAC(userRole);
  const userLevel = userRole ? getWorkspaceRoleLevel(userRole) : WorkspaceHierarchyLevel.COORDINATOR;

  // Map action IDs to their handlers
  const actionHandlers: Record<string, (() => void) | undefined> = {
    // L1 Root actions
    'create-department': onCreateSubWorkspace,
    'delegate-role': onDelegateRole,
    'invite-manager': onInviteMember,
    'view-analytics': onViewAnalytics || onViewReport,
    'manage-settings': onManageSettings,
    'broadcast-message': undefined, // Placeholder for future implementation
    
    // L2 Department actions
    'create-committee': onCreateSubWorkspace,
    'delegate-dept': onDelegateRole,
    'invite-lead': onInviteMember,
    'view-dept-report': onViewReport,
    'review-budgets': undefined, // Placeholder
    'set-dept-goals': undefined, // Placeholder
    
    // L3 Committee actions
    'create-team': onCreateSubWorkspace,
    'submit-budget': onRequestBudget,
    'submit-resource': onRequestResource,
    'invite-coordinator': onInviteMember,
    'delegate-committee': onDelegateRole,
    'track-progress': onViewProgress || onViewReport,
    'schedule-meeting': onScheduleMeeting,
    
    // L4 Team actions
    'log-hours': onLogHours,
    'submit-timesheet': onSubmitForApproval,
    'view-tasks': onCreateTask,
    'report-issue': onReportIssue,
    'mark-complete': undefined, // Placeholder
    'team-chat': undefined, // Placeholder
  };

  // Get level-specific actions
  const levelActions = getActionsForWorkspaceType(workspace.workspaceType);
  
  // Bind handlers to actions and filter by user level
  const availableActions = levelActions
    .map((action) => ({
      ...action,
      onClick: actionHandlers[action.id],
    }))
    .filter((action) => {
      // Check minimum level requirement (lower number = higher rank)
      if (userLevel > action.minLevel) return false;
      
      // Check if handler exists
      if (!action.onClick) return false;
      
      return true;
    })
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {getWorkspaceLevelLabel(workspace.workspaceType)}
          </span>
        </div>
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
            className="justify-start gap-2.5 h-auto py-3 px-3 hover:shadow-sm transition-all"
          >
            <div className="flex-shrink-0 p-1 rounded-md bg-background/50">{action.icon}</div>
            <div className="flex flex-col items-start text-left min-w-0">
              <span className="text-sm font-medium truncate">{action.label}</span>
              {action.description && (
                <span className="text-[11px] text-muted-foreground truncate max-w-full leading-tight">
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
