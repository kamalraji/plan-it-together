import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserMinusIcon,
  PencilIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Workspace, TeamMember, WorkspaceRole } from '../../../types';
import api from '../../../lib/api';

interface MobileTeamManagementProps {
  workspace: Workspace;
  onInviteMember: () => void;
}

export function MobileTeamManagement({ workspace, onInviteMember }: MobileTeamManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['workspace-team-members', workspace.id],
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspace.id}/team-members`);
      return response.data.teamMembers as TeamMember[];
    },
  });

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/workspaces/${workspace.id}/team-members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspace.id] });
      setSelectedMember(null);
    },
  });

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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[role]}`}>
        {roleLabels[role]}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      await removeTeamMemberMutation.mutateAsync(memberId);
    }
  };

  // Role update function available for future use
  // const handleUpdateRole = async (memberId: string, role: WorkspaceRole) => {
  //   await updateRoleMutation.mutateAsync({ memberId, role });
  // };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-600">{filteredMembers.length} members</p>
        </div>
        <button
          onClick={onInviteMember}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Invite
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          Filters
        </button>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as WorkspaceRole | 'all')}
                className="w-full text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value={WorkspaceRole.WORKSPACE_OWNER}>Owner</option>
                <option value={WorkspaceRole.TEAM_LEAD}>Team Lead</option>
                <option value={WorkspaceRole.EVENT_COORDINATOR}>Coordinator</option>
                <option value={WorkspaceRole.VOLUNTEER_MANAGER}>Vol. Manager</option>
                <option value={WorkspaceRole.TECHNICAL_SPECIALIST}>Tech Specialist</option>
                <option value={WorkspaceRole.MARKETING_LEAD}>Marketing Lead</option>
                <option value={WorkspaceRole.GENERAL_VOLUNTEER}>Volunteer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <UserPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No members found</h3>
            <p className="text-xs text-gray-500 mb-4">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start building your team by inviting members'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={onInviteMember}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Invite Members
              </button>
            )}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-medium text-sm">
                    {getInitials(member.user.name)}
                  </span>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {member.user.name}
                    </h3>
                    <button
                      onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                      className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              </div>

              {/* Member Actions */}
              {selectedMember?.id === member.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        // Handle edit role
                        console.log('Edit role for', member.id);
                      }}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Role
                    </button>
                    <button
                      onClick={() => {
                        // Handle send message
                        console.log('Send message to', member.id);
                      }}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Message
                    </button>
                  </div>
                  
                  {member.role !== WorkspaceRole.WORKSPACE_OWNER && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="w-full flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <UserMinusIcon className="w-4 h-4 mr-2" />
                      Remove Member
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}