import { Workspace, WorkspaceRole } from '../../types';
import { WorkspaceRoleBadge } from './WorkspaceBadges';

interface TeamMemberRosterProps {
  workspace: Workspace;
  showActions?: boolean;
  maxMembers?: number;
  onViewAllMembers?: () => void;
  onInviteMember?: () => void;
}

export function TeamMemberRoster({ 
  workspace, 
  showActions = true, 
  maxMembers,
  onViewAllMembers,
  onInviteMember 
}: TeamMemberRosterProps) {
  const teamMembers = workspace.teamMembers || [];
  const displayMembers = maxMembers ? teamMembers.slice(0, maxMembers) : teamMembers;
  const hasMoreMembers = maxMembers && teamMembers.length > maxMembers;

  const getRoleColor = (role: WorkspaceRole) => {
    switch (role) {
      case WorkspaceRole.WORKSPACE_OWNER:
        return 'bg-primary/10 text-primary';
      case WorkspaceRole.OPERATIONS_MANAGER:
      case WorkspaceRole.GROWTH_MANAGER:
      case WorkspaceRole.CONTENT_MANAGER:
      case WorkspaceRole.TECH_FINANCE_MANAGER:
      case WorkspaceRole.VOLUNTEERS_MANAGER:
        return 'bg-secondary/10 text-secondary-foreground';
      case WorkspaceRole.EVENT_COORDINATOR:
        return 'bg-accent/10 text-accent-foreground';
      case WorkspaceRole.MARKETING_LEAD:
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getRoleDisplayName = (role: WorkspaceRole) => {
    if (!role) return 'Member';
    const roleString = String(role).replace(/_/g, ' ').toLowerCase();
    return roleString.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIndicator = () => {
    // For now, assume all members are active
    // This could be enhanced with actual status tracking
    return (
      <div className="w-3 h-3 bg-green-400 rounded-full border-2 border-background"></div>
    );
  };

  return (
    <div className="bg-card overflow-hidden shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-foreground">Team Members</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
            </span>
            {showActions && onInviteMember && (
              <button
                onClick={onInviteMember}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Invite
              </button>
            )}
          </div>
        </div>

        {/* Team Members List */}
        {displayMembers.length > 0 ? (
          <div className="space-y-4">
            {displayMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-foreground">
                      {getInitials(member.user.name)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIndicator()}
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.user.name}
                    </p>
                    <WorkspaceRoleBadge role={member.role} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex-shrink-0">
                    <button className="text-muted-foreground hover:text-muted-foreground">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Show More Button */}
            {hasMoreMembers && onViewAllMembers && (
              <div className="pt-4 border-t border-border">
                <button
                  onClick={onViewAllMembers}
                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View all {teamMembers.length} members →
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.196M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">No team members yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by inviting team members to collaborate.
            </p>
            {showActions && onInviteMember && (
              <div className="mt-6">
                <button
                  onClick={onInviteMember}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-ring"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Invite Team Members
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role Distribution Summary */}
        {teamMembers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Role Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.values(WorkspaceRole).map((role) => {
                const count = teamMembers.filter(member => member.role === role).length;
                if (count === 0) return null;
                
                return (
                  <span
                    key={role}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                  >
                    {getRoleDisplayName(role)}: {count}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}