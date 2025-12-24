import { useQuery } from '@tanstack/react-query';
import { 
  UserGroupIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Workspace, TeamMember, WorkspaceRole } from '../../../types';
import api from '../../../lib/api';

interface MobileTeamOverviewProps {
  workspace: Workspace;
  onViewTeam: () => void;
}

export function MobileTeamOverview({ workspace, onViewTeam }: MobileTeamOverviewProps) {
  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['workspace-team-members', workspace.id],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspace.id}/team-members`);
      return response.data.teamMembers as TeamMember[];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const activeMembers = teamMembers?.filter(m => m.status === 'ACTIVE').length || 0;
  const pendingMembers = teamMembers?.filter(m => m.status === 'PENDING').length || 0;
  const totalMembers = teamMembers?.length || 0;

  const getRoleColor = (role: WorkspaceRole) => {
    const colors = {
      [WorkspaceRole.WORKSPACE_OWNER]: 'bg-purple-100 text-purple-800',
      [WorkspaceRole.TEAM_LEAD]: 'bg-blue-100 text-blue-800',
      [WorkspaceRole.EVENT_COORDINATOR]: 'bg-indigo-100 text-indigo-800',
      [WorkspaceRole.VOLUNTEER_MANAGER]: 'bg-green-100 text-green-800',
      [WorkspaceRole.TECHNICAL_SPECIALIST]: 'bg-orange-100 text-orange-800',
      [WorkspaceRole.MARKETING_LEAD]: 'bg-pink-100 text-pink-800',
      [WorkspaceRole.GENERAL_VOLUNTEER]: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: WorkspaceRole) => {
    const labels = {
      [WorkspaceRole.WORKSPACE_OWNER]: 'Owner',
      [WorkspaceRole.TEAM_LEAD]: 'Lead',
      [WorkspaceRole.EVENT_COORDINATOR]: 'Coordinator',
      [WorkspaceRole.VOLUNTEER_MANAGER]: 'Vol. Manager',
      [WorkspaceRole.TECHNICAL_SPECIALIST]: 'Tech',
      [WorkspaceRole.MARKETING_LEAD]: 'Marketing',
      [WorkspaceRole.GENERAL_VOLUNTEER]: 'Volunteer',
    };
    return labels[role] || role;
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
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Team</h3>
        </div>
        <button
          onClick={onViewTeam}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Manage
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Team Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalMembers}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingMembers}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
        </div>
      </div>

      {/* Team Members Preview */}
      <div className="p-4">
        {teamMembers && teamMembers.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Recent Members</h4>
            <div className="space-y-2">
              {teamMembers
                .slice(0, 4)
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium text-xs">
                        {getInitials(member.user.name)}
                      </span>
                    </div>
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.user.name}
                        </p>
                        {member.status === 'ACTIVE' ? (
                          <CheckCircleIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <ClockIcon className="w-3 h-3 text-yellow-500 flex-shrink-0" />
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
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2"
              >
                View all {teamMembers.length} members
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <UserPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">No team members yet</h4>
            <p className="text-xs text-gray-500 mb-4">Start building your team by inviting members</p>
            <button
              onClick={onViewTeam}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
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