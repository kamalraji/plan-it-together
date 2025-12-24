import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserPlusIcon, 
  UserGroupIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Workspace, TeamMember, WorkspaceRole } from '../../types';
import { TeamInvitation } from './TeamInvitation';
import { TeamRosterManagement } from './TeamRosterManagement';
import api from '../../lib/api';

interface TeamManagementProps {
  workspace: Workspace;
}

export function TeamManagement({ workspace }: TeamManagementProps) {
  const [activeView, setActiveView] = useState<'roster' | 'invite' | 'bulk-invite'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const queryClient = useQueryClient();

  // Fetch team members with details
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['workspace-team-members', workspace.id],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspace.id}/team-members`);
      return response.data.teamMembers as TeamMember[];
    },
  });

  // Fetch pending invitations
  const { data: pendingInvitations } = useQuery({
    queryKey: ['workspace-invitations', workspace.id],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspace.id}/invitations`);
      return response.data.invitations as Array<{
        id: string;
        email: string;
        role: WorkspaceRole;
        status: string;
        invitedAt: string;
        invitedBy: { name: string };
      }>;
    },
  });

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/workspaces/${workspace.id}/team-members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspace.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.id] });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: WorkspaceRole }) => {
      await api.patch(`/workspaces/${workspace.id}/team-members/${memberId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspace.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.id] });
    },
  });

  const handleRemoveTeamMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member? They will lose access to the workspace immediately.')) {
      await removeTeamMemberMutation.mutateAsync(memberId);
    }
  };

  const handleUpdateRole = async (memberId: string, role: WorkspaceRole) => {
    await updateRoleMutation.mutateAsync({ memberId, role });
  };

  const filteredMembers = teamMembers?.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.status === 'ACTIVE') ||
                         (statusFilter === 'pending' && member.status === 'PENDING') ||
                         (statusFilter === 'inactive' && member.status === 'INACTIVE');
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    const roleColors = {
      [WorkspaceRole.WORKSPACE_OWNER]: 'bg-purple-100 text-purple-800',
      [WorkspaceRole.TEAM_LEAD]: 'bg-blue-100 text-blue-800',
      [WorkspaceRole.EVENT_COORDINATOR]: 'bg-indigo-100 text-indigo-800',
      [WorkspaceRole.VOLUNTEER_MANAGER]: 'bg-green-100 text-green-800',
      [WorkspaceRole.TECHNICAL_SPECIALIST]: 'bg-orange-100 text-orange-800',
      [WorkspaceRole.MARKETING_LEAD]: 'bg-pink-100 text-pink-800',
      [WorkspaceRole.GENERAL_VOLUNTEER]: 'bg-gray-100 text-gray-800',
    };

    const roleLabels = {
      [WorkspaceRole.WORKSPACE_OWNER]: 'Owner',
      [WorkspaceRole.TEAM_LEAD]: 'Team Lead',
      [WorkspaceRole.EVENT_COORDINATOR]: 'Coordinator',
      [WorkspaceRole.VOLUNTEER_MANAGER]: 'Vol. Manager',
      [WorkspaceRole.TECHNICAL_SPECIALIST]: 'Tech Specialist',
      [WorkspaceRole.MARKETING_LEAD]: 'Marketing Lead',
      [WorkspaceRole.GENERAL_VOLUNTEER]: 'Volunteer',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role]}`}>
        {roleLabels[role]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600 mt-1">
            Manage team members, roles, and access for {workspace.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('invite')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Invite Member
          </button>
          <button
            onClick={() => setActiveView('bulk-invite')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <UserGroupIcon className="w-4 h-4 mr-2" />
            Bulk Invite
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('roster')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'roster'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team Roster ({filteredMembers.length})
          </button>
          <button
            onClick={() => setActiveView('invite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'invite'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invite Members
          </button>
          <button
            onClick={() => setActiveView('bulk-invite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'bulk-invite'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bulk Invite
            {pendingInvitations && pendingInvitations.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingInvitations.length} pending
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeView === 'roster' && (
        <TeamRosterManagement
          teamMembers={filteredMembers}
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
          onRemoveMember={handleRemoveTeamMember}
          onUpdateRole={handleUpdateRole}
          getRoleBadge={getRoleBadge}
          getStatusBadge={getStatusBadge}
        />
      )}

      {(activeView === 'invite' || activeView === 'bulk-invite') && (
        <TeamInvitation
          workspace={workspace}
          mode={activeView === 'bulk-invite' ? 'bulk' : 'single'}
          pendingInvitations={pendingInvitations || []}
          onInvitationSent={() => {
            queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspace.id] });
            queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspace.id] });
          }}
        />
      )}
    </div>
  );
}