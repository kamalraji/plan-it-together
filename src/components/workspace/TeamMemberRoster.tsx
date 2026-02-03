import { Workspace, WorkspaceRole } from '../../types';
import { WorkspaceRoleBadge } from './WorkspaceBadges';
import { SkeletonTeamRoster } from '@/components/ui/skeleton-patterns';
import { Plus, MoreVertical, UserPlus, Users } from 'lucide-react';

interface TeamMemberRosterProps {
  workspace: Workspace;
  showActions?: boolean;
  maxMembers?: number;
  onViewAllMembers?: () => void;
  onInviteMember?: () => void;
  isLoading?: boolean;
}

export function TeamMemberRoster({ 
  workspace, 
  showActions = true, 
  maxMembers,
  onViewAllMembers,
  onInviteMember,
  isLoading = false
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
    return (
      <div 
        className="w-3 h-3 bg-green-400 rounded-full border-2 border-background"
        aria-label="Online"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-card overflow-hidden shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
        </div>
        <SkeletonTeamRoster count={maxMembers || 4} />
      </div>
    );
  }

  return (
    <div className="bg-card overflow-hidden shadow rounded-lg" role="region" aria-label="Team members">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Team Members
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
            </span>
            {showActions && onInviteMember && (
              <button
                onClick={onInviteMember}
                className="inline-flex items-center px-3 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                aria-label="Invite new team member"
              >
                <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            )}
          </div>
        </div>

        {/* Team Members List */}
        {displayMembers.length > 0 ? (
          <ul className="space-y-3 sm:space-y-4" role="list">
            {displayMembers.map((member) => (
              <li 
                key={member.id} 
                className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors -mx-2 sm:-mx-3"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="text-sm sm:text-base font-medium text-foreground">
                      {getInitials(member.user.name)}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1">
                    {getStatusIndicator()}
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                    <p className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-none">
                      {member.user.name}
                    </p>
                    <WorkspaceRoleBadge role={member.role} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate hidden sm:block">
                    {member.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="flex-shrink-0">
                    <button 
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                      aria-label={`More options for ${member.user.name}`}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </li>
            ))}

            {/* Show More Button */}
            {hasMoreMembers && onViewAllMembers && (
              <li className="pt-3 sm:pt-4 border-t border-border">
                <button
                  onClick={onViewAllMembers}
                  className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium py-2 min-h-[44px] rounded-md hover:bg-primary/5 transition-colors"
                  aria-label={`View all ${teamMembers.length} team members`}
                >
                  View all {teamMembers.length} members →
                </button>
              </li>
            )}
          </ul>
        ) : (
          /* Empty State */
          <div className="text-center py-8 sm:py-12">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-medium text-foreground">No team members yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
              Get started by inviting team members to collaborate.
            </p>
            {showActions && onInviteMember && (
              <div className="mt-6">
                <button
                  onClick={onInviteMember}
                  className="inline-flex items-center px-4 py-2 min-h-[44px] border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  aria-label="Invite first team member"
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Invite Team Members
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role Distribution Summary */}
        {teamMembers.length > 0 && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Role Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.values(WorkspaceRole).map((role) => {
                const count = teamMembers.filter(member => member.role === role).length;
                if (count === 0) return null;
                
                return (
                  <span
                    key={role}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                    aria-label={`${getRoleDisplayName(role)}: ${count} members`}
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