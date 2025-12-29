import { UserRole, WorkspaceRole } from '@/types';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { LockClosedIcon } from '@heroicons/react/24/outline';

interface WorkspacePermissionsBannerProps {
  userRole?: UserRole;
  workspaceRole?: WorkspaceRole;
  hasGlobalAccess: boolean;
  hasWorkspaceManagerAccess: boolean;
}

export function WorkspacePermissionsBanner({
  userRole,
  workspaceRole,
  hasGlobalAccess,
  hasWorkspaceManagerAccess,
}: WorkspacePermissionsBannerProps) {
  const isReadOnly = !hasGlobalAccess && !hasWorkspaceManagerAccess;

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        isReadOnly
          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
          : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isReadOnly ? (
            <LockClosedIcon
              className="h-5 w-5 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
          ) : (
            <InformationCircleIcon
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-semibold ${
              isReadOnly
                ? 'text-amber-900 dark:text-amber-200'
                : 'text-blue-900 dark:text-blue-200'
            }`}
          >
            {hasGlobalAccess
              ? 'Full Access (Organizer/Admin)'
              : hasWorkspaceManagerAccess
              ? `Manager Access (${formatWorkspaceRole(workspaceRole)})`
              : 'Read-Only Access'}
          </h3>
          <div
            className={`mt-1 text-xs ${
              isReadOnly
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-blue-700 dark:text-blue-300'
            }`}
          >
            {hasGlobalAccess ? (
              <p>
                As an <strong>{userRole}</strong>, you have full control over all workspace features,
                including creating workspaces, managing settings, tasks, team members, and reports.
              </p>
            ) : hasWorkspaceManagerAccess ? (
              <p>
                Your workspace role <strong>{formatWorkspaceRole(workspaceRole)}</strong> allows you to
                manage tasks, post messages, broadcast to the team, and export reports. You cannot edit
                workspace settings or manage team roles.
              </p>
            ) : (
              <p>
                Your current role <strong>{formatWorkspaceRole(workspaceRole) || 'Team Member'}</strong>{' '}
                grants read-only access. You can view tasks, reports, and messages, but cannot create,
                edit, or delete content. Contact a workspace manager or event organizer to request elevated
                permissions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatWorkspaceRole(role?: WorkspaceRole): string {
  if (!role) return 'Team Member';
  return role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
