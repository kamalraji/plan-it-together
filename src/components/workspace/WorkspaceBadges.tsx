import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { WorkspaceRole } from '../../types';

// Legacy role values that may exist in database
// These are fallback mappings - the database migration handles context-aware mapping
const LEGACY_ROLE_MAP: Record<string, WorkspaceRole> = {
  'OWNER': WorkspaceRole.WORKSPACE_OWNER,
  'LEAD': WorkspaceRole.EVENT_LEAD,           // Generic lead fallback
  'COORDINATOR': WorkspaceRole.EVENT_COORDINATOR, // Generic coordinator fallback
  'member': WorkspaceRole.EVENT_COORDINATOR,      // Generic member fallback
};

interface WorkspaceRoleBadgeProps {
  role: WorkspaceRole;
}

export function WorkspaceRoleBadge({ role }: WorkspaceRoleBadgeProps) {
  const roleLabels: Record<WorkspaceRole, string> = {
    // Level 1
    [WorkspaceRole.WORKSPACE_OWNER]: 'Owner',
    // Level 2 - Department Managers
    [WorkspaceRole.OPERATIONS_MANAGER]: 'Ops Manager',
    [WorkspaceRole.GROWTH_MANAGER]: 'Growth Manager',
    [WorkspaceRole.CONTENT_MANAGER]: 'Content Manager',
    [WorkspaceRole.TECH_FINANCE_MANAGER]: 'Tech/Finance Mgr',
    [WorkspaceRole.VOLUNTEERS_MANAGER]: 'Vol Manager',
    // Level 3 - Leads
    [WorkspaceRole.EVENT_LEAD]: 'Event Lead',
    [WorkspaceRole.CATERING_LEAD]: 'Catering Lead',
    [WorkspaceRole.LOGISTICS_LEAD]: 'Logistics Lead',
    [WorkspaceRole.FACILITY_LEAD]: 'Facility Lead',
    [WorkspaceRole.MARKETING_LEAD]: 'Marketing Lead',
    [WorkspaceRole.COMMUNICATION_LEAD]: 'Comm Lead',
    [WorkspaceRole.SPONSORSHIP_LEAD]: 'Sponsor Lead',
    [WorkspaceRole.SOCIAL_MEDIA_LEAD]: 'Social Lead',
    [WorkspaceRole.CONTENT_LEAD]: 'Content Lead',
    [WorkspaceRole.SPEAKER_LIAISON_LEAD]: 'Speaker Lead',
    [WorkspaceRole.JUDGE_LEAD]: 'Judge Lead',
    [WorkspaceRole.MEDIA_LEAD]: 'Media Lead',
    [WorkspaceRole.FINANCE_LEAD]: 'Finance Lead',
    [WorkspaceRole.REGISTRATION_LEAD]: 'Reg Lead',
    [WorkspaceRole.TECHNICAL_LEAD]: 'Tech Lead',
    [WorkspaceRole.IT_LEAD]: 'IT Lead',
    [WorkspaceRole.VOLUNTEERS_LEAD]: 'Vol Lead',
    // Level 4 - Coordinators
    [WorkspaceRole.EVENT_COORDINATOR]: 'Event Coord',
    [WorkspaceRole.CATERING_COORDINATOR]: 'Catering Coord',
    [WorkspaceRole.LOGISTICS_COORDINATOR]: 'Logistics Coord',
    [WorkspaceRole.FACILITY_COORDINATOR]: 'Facility Coord',
    [WorkspaceRole.MARKETING_COORDINATOR]: 'Marketing Coord',
    [WorkspaceRole.COMMUNICATION_COORDINATOR]: 'Comm Coord',
    [WorkspaceRole.SPONSORSHIP_COORDINATOR]: 'Sponsor Coord',
    [WorkspaceRole.SOCIAL_MEDIA_COORDINATOR]: 'Social Coord',
    [WorkspaceRole.CONTENT_COORDINATOR]: 'Content Coord',
    [WorkspaceRole.SPEAKER_LIAISON_COORDINATOR]: 'Speaker Coord',
    [WorkspaceRole.JUDGE_COORDINATOR]: 'Judge Coord',
    [WorkspaceRole.MEDIA_COORDINATOR]: 'Media Coord',
    [WorkspaceRole.FINANCE_COORDINATOR]: 'Finance Coord',
    [WorkspaceRole.REGISTRATION_COORDINATOR]: 'Reg Coord',
    [WorkspaceRole.TECHNICAL_COORDINATOR]: 'Tech Coord',
    [WorkspaceRole.IT_COORDINATOR]: 'IT Coord',
    [WorkspaceRole.VOLUNTEER_COORDINATOR]: 'Vol Coord',
  };

  // Tone based on hierarchy level
  const getRoleTone = (r: WorkspaceRole): 'default' | 'secondary' | 'outline' => {
    // Level 1 - Owner: primary/default
    if (r === WorkspaceRole.WORKSPACE_OWNER) return 'default';
    // Level 2 - Managers: default (distinct)
    if (r.endsWith('_MANAGER')) return 'default';
    // Level 3 - Leads: secondary
    if (r.endsWith('_LEAD')) {
      return 'secondary';
    }
    // Level 4 - Coordinators: outline
    return 'outline';
  };

  // Normalize legacy roles to current enum values
  const normalizedRole = LEGACY_ROLE_MAP[role as string] ?? role;
  const label = roleLabels[normalizedRole] ?? 'Member';
  const tone = getRoleTone(normalizedRole);

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
