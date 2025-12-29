import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { WorkspaceRole } from '../../types';

interface WorkspaceRoleBadgeProps {
  role: WorkspaceRole;
}

export function WorkspaceRoleBadge({ role }: WorkspaceRoleBadgeProps) {
  const roleLabels: Record<WorkspaceRole, string> = {
    [WorkspaceRole.WORKSPACE_OWNER]: 'Owner',
    [WorkspaceRole.TEAM_LEAD]: 'Team Lead',
    [WorkspaceRole.EVENT_COORDINATOR]: 'Coordinator',
    [WorkspaceRole.VOLUNTEER_MANAGER]: 'Vol. Manager',
    [WorkspaceRole.TECHNICAL_SPECIALIST]: 'Tech Specialist',
    [WorkspaceRole.MARKETING_LEAD]: 'Marketing Lead',
    [WorkspaceRole.GENERAL_VOLUNTEER]: 'Volunteer',
  };

  const roleTone: Record<WorkspaceRole, 'default' | 'secondary' | 'outline'> = {
    [WorkspaceRole.WORKSPACE_OWNER]: 'default',
    [WorkspaceRole.TEAM_LEAD]: 'secondary',
    [WorkspaceRole.EVENT_COORDINATOR]: 'secondary',
    [WorkspaceRole.VOLUNTEER_MANAGER]: 'outline',
    [WorkspaceRole.TECHNICAL_SPECIALIST]: 'outline',
    [WorkspaceRole.MARKETING_LEAD]: 'default',
    [WorkspaceRole.GENERAL_VOLUNTEER]: 'outline',
  };

  const label = roleLabels[role] ?? 'Member';
  const tone = roleTone[role] ?? 'outline';

  return (
    <Badge
      variant={tone}
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      aria-label={`Workspace role: ${label}`}
    >
      {label}
    </Badge>
  );
}

export type WorkspaceMemberStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | string;

interface WorkspaceStatusBadgeProps {
  status: WorkspaceMemberStatus;
}

export function WorkspaceStatusBadge({ status }: WorkspaceStatusBadgeProps) {
  const normalized = status?.toUpperCase?.() ?? '';

  if (normalized === 'ACTIVE') {
    return (
      <Badge
        variant="secondary"
        className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary flex items-center gap-1"
      >
        <CheckCircleIcon className="w-3 h-3" aria-hidden="true" />
        <span>Active</span>
      </Badge>
    );
  }

  if (normalized === 'PENDING') {
    return (
      <Badge
        variant="outline"
        className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent/10 text-accent-foreground flex items-center gap-1"
      >
        <ClockIcon className="w-3 h-3" aria-hidden="true" />
        <span>Pending</span>
      </Badge>
    );
  }

  if (normalized === 'INACTIVE') {
    return (
      <Badge
        variant="outline"
        className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-foreground flex items-center gap-1"
      >
        <XCircleIcon className="w-3 h-3" aria-hidden="true" />
        <span>Inactive</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-foreground"
    >
      {status || 'Unknown'}
    </Badge>
  );
}

interface WorkspaceTemplateBadgeProps {
  label: string;
}

export function WorkspaceTemplateBadge({ label }: WorkspaceTemplateBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent/10 text-accent-foreground"
    >
      {label}
    </Badge>
  );
}
