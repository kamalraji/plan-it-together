import React from 'react';

export type MembershipRole = 'OWNER' | 'ADMIN' | 'ORGANIZER' | 'VIEWER' | 'UNKNOWN';
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED' | 'UNKNOWN';

interface MembershipBadgeProps {
  role?: string | null;
  status?: string | null;
  className?: string;
}

/**
 * MembershipBadge renders a compact, reusable badge pair showing the
 * current user's role and membership status within an organization.
 */
export const MembershipBadge: React.FC<MembershipBadgeProps> = ({ role, status, className }) => {
  const normalizedRole = (role || 'UNKNOWN').toUpperCase() as MembershipRole;
  const normalizedStatus = (status || 'UNKNOWN').toUpperCase() as MembershipStatus;

  const roleLabelMap: Record<MembershipRole, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    ORGANIZER: 'Organizer',
    VIEWER: 'Viewer',
    UNKNOWN: 'Viewer',
  };

  const statusLabelMap: Record<MembershipStatus, string> = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    REMOVED: 'Removed',
    UNKNOWN: 'Unknown',
  };

  const roleClasses: Record<MembershipRole, string> = {
    OWNER: 'bg-primary/15 text-primary',
    ADMIN: 'bg-accent/40 text-accent-foreground',
    ORGANIZER: 'bg-muted text-foreground',
    VIEWER: 'bg-muted text-muted-foreground',
    UNKNOWN: 'bg-muted text-muted-foreground',
  };

  const statusClasses: Record<MembershipStatus, string> = {
    ACTIVE: 'bg-success/20 text-success',
    PENDING: 'bg-warning/20 text-warning',
    REJECTED: 'bg-destructive/10 text-destructive',
    REMOVED: 'bg-muted text-muted-foreground',
    UNKNOWN: 'bg-muted text-muted-foreground',
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      <span
        className={`inline-flex px-2 py-1 text-[11px] font-semibold rounded-full ${roleClasses[normalizedRole]}`}
      >
        {roleLabelMap[normalizedRole]}
      </span>
      {normalizedStatus !== 'UNKNOWN' && (
        <span
          className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-full ${statusClasses[normalizedStatus]}`}
        >
          {statusLabelMap[normalizedStatus]}
        </span>
      )}
    </div>
  );
};

export default MembershipBadge;
