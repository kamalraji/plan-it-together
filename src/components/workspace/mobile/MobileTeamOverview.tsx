import { useQuery } from '@tanstack/react-query';
import { 
  UserGroupIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Workspace, WorkspaceRole } from '../../../types';
import { supabase } from '@/integrations/supabase/client';

interface MobileTeamOverviewProps {
  workspace: Workspace;
  onViewTeam: () => void;
}

interface TeamMemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  status: string;
  user_profiles: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function MobileTeamOverview({ workspace, onViewTeam }: MobileTeamOverviewProps) {
  // Fetch team members from Supabase
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['workspace-team-members', workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, role, status')
        .eq('workspace_id', workspace.id);
      
      if (error) throw error;
      return (data || []).map(m => ({
        ...m,
        user_profiles: { id: m.user_id, name: 'Team Member', email: '' }
      })) as TeamMemberWithProfile[];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const activeMembers = teamMembers?.filter(m => m.status === 'ACTIVE').length || 0;
  const pendingMembers = teamMembers?.filter(m => m.status === 'PENDING').length || 0;
  const totalMembers = teamMembers?.length || 0;

  const getRoleColor = (role: string) => {
    if (role === WorkspaceRole.WORKSPACE_OWNER) return 'bg-purple-100 text-purple-800';
    if (role.endsWith('_MANAGER')) return 'bg-violet-100 text-violet-800';
    if (role.endsWith('_LEAD')) return 'bg-info/20 text-blue-800';
    if (role.endsWith('_COORDINATOR')) return 'bg-primary/20 text-indigo-800';
    return 'bg-muted text-foreground';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      [WorkspaceRole.WORKSPACE_OWNER]: 'Owner',
      [WorkspaceRole.OPERATIONS_MANAGER]: 'Ops Mgr',
      [WorkspaceRole.GROWTH_MANAGER]: 'Growth Mgr',
      [WorkspaceRole.CONTENT_MANAGER]: 'Content Mgr',
      [WorkspaceRole.TECH_FINANCE_MANAGER]: 'Tech/Finance',
      [WorkspaceRole.VOLUNTEERS_MANAGER]: 'Vol Mgr',
      [WorkspaceRole.EVENT_COORDINATOR]: 'Coordinator',
      [WorkspaceRole.MARKETING_LEAD]: 'Marketing',
    };
    if (labels[role]) return labels[role];
    if (role.endsWith('_MANAGER')) return role.replace(/_MANAGER$/, '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    if (role.endsWith('_LEAD')) return role.replace(/_LEAD$/, '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    if (role.endsWith('_COORDINATOR')) return role.replace(/_COORDINATOR$/, '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    return role.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-card rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Team</h3>
        </div>
        <button
          onClick={onViewTeam}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium min-h-[48px] px-2"
        >
          Manage
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Team Stats */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalMembers}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{activeMembers}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{pendingMembers}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>

      {/* Team Members Preview */}
      <div className="p-4">
        {teamMembers && teamMembers.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Recent Members</h4>
            <div className="space-y-2">
              {teamMembers
                .slice(0, 4)
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md min-h-[56px]"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-medium text-xs">
                        {getInitials(member.user_profiles?.name || 'Unknown')}
                      </span>
                    </div>
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.user_profiles?.name || 'Unknown User'}
                        </p>
                        {member.status === 'ACTIVE' ? (
                          <CheckCircleIcon className="w-3 h-3 text-success flex-shrink-0" />
                        ) : (
                          <ClockIcon className="w-3 h-3 text-warning flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {teamMembers.length > 4 && (
              <button
                onClick={onViewTeam}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-3 min-h-[48px]"
              >
                View all {teamMembers.length} members
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <UserPlusIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="text-sm font-medium text-foreground mb-1">No team members yet</h4>
            <p className="text-xs text-muted-foreground mb-4">Start building your team by inviting members</p>
            <button
              onClick={onViewTeam}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 min-h-[48px]"
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Invite Members
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
