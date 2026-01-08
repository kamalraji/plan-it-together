import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserMinusIcon,
  PencilIcon,
  EyeIcon,
  CalendarIcon,
  EnvelopeIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { TeamMember, WorkspaceRole } from '../../types';

interface TeamRosterManagementProps {
  teamMembers: TeamMember[];
  searchTerm: string;
  roleFilter: WorkspaceRole | 'all';
  statusFilter: 'all' | 'active' | 'pending' | 'inactive';
  onSearchChange: (term: string) => void;
  onRoleFilterChange: (role: WorkspaceRole | 'all') => void;
  onStatusFilterChange: (status: 'all' | 'active' | 'pending' | 'inactive') => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateRole: (memberId: string, role: WorkspaceRole) => void;
  getRoleBadge: (role: WorkspaceRole) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

interface MemberActivityData {
  tasksAssigned: number;
  tasksCompleted: number;
  lastActivity: string;
  contributionScore: number;
}

export function TeamRosterManagement({
  teamMembers,
  searchTerm,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onRemoveMember,
  onUpdateRole,
  getRoleBadge,
  getStatusBadge
}: TeamRosterManagementProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'joinedAt' | 'activity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Mock activity data - in real implementation, this would come from API
  const getMemberActivity = (_memberId: string): MemberActivityData => {
    return {
      tasksAssigned: Math.floor(Math.random() * 10) + 1,
      tasksCompleted: Math.floor(Math.random() * 8),
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      contributionScore: Math.floor(Math.random() * 100)
    };
  };

  // Count owners in the workspace
  const ownerCount = teamMembers.filter(m => m.role === WorkspaceRole.WORKSPACE_OWNER).length;


  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    // Level 1 - Owner
    { value: WorkspaceRole.WORKSPACE_OWNER, label: 'Workspace Owner' },
    // Level 2 - Managers
    { value: WorkspaceRole.OPERATIONS_MANAGER, label: 'Operations Manager' },
    { value: WorkspaceRole.GROWTH_MANAGER, label: 'Growth Manager' },
    { value: WorkspaceRole.CONTENT_MANAGER, label: 'Content Manager' },
    { value: WorkspaceRole.TECH_FINANCE_MANAGER, label: 'Tech & Finance Manager' },
    { value: WorkspaceRole.VOLUNTEERS_MANAGER, label: 'Volunteers Manager' },
    // Level 3 - Leads
    { value: WorkspaceRole.EVENT_LEAD, label: 'Event Lead' },
    { value: WorkspaceRole.CATERING_LEAD, label: 'Catering Lead' },
    { value: WorkspaceRole.LOGISTICS_LEAD, label: 'Logistics Lead' },
    { value: WorkspaceRole.FACILITY_LEAD, label: 'Facility Lead' },
    { value: WorkspaceRole.MARKETING_LEAD, label: 'Marketing Lead' },
    { value: WorkspaceRole.COMMUNICATION_LEAD, label: 'Communication Lead' },
    { value: WorkspaceRole.SPONSORSHIP_LEAD, label: 'Sponsorship Lead' },
    { value: WorkspaceRole.SOCIAL_MEDIA_LEAD, label: 'Social Media Lead' },
    { value: WorkspaceRole.CONTENT_LEAD, label: 'Content Lead' },
    { value: WorkspaceRole.SPEAKER_LIAISON_LEAD, label: 'Speaker Liaison Lead' },
    { value: WorkspaceRole.JUDGE_LEAD, label: 'Judge Lead' },
    { value: WorkspaceRole.MEDIA_LEAD, label: 'Media Lead' },
    { value: WorkspaceRole.FINANCE_LEAD, label: 'Finance Lead' },
    { value: WorkspaceRole.REGISTRATION_LEAD, label: 'Registration Lead' },
    { value: WorkspaceRole.TECHNICAL_LEAD, label: 'Technical Lead' },
    { value: WorkspaceRole.IT_LEAD, label: 'IT Lead' },
    { value: WorkspaceRole.VOLUNTEERS_LEAD, label: 'Volunteers Lead' },
    // Level 4 - Coordinators
    { value: WorkspaceRole.EVENT_COORDINATOR, label: 'Event Coordinator' },
    { value: WorkspaceRole.CATERING_COORDINATOR, label: 'Catering Coordinator' },
    { value: WorkspaceRole.LOGISTICS_COORDINATOR, label: 'Logistics Coordinator' },
    { value: WorkspaceRole.FACILITY_COORDINATOR, label: 'Facility Coordinator' },
    { value: WorkspaceRole.MARKETING_COORDINATOR, label: 'Marketing Coordinator' },
    { value: WorkspaceRole.COMMUNICATION_COORDINATOR, label: 'Communication Coordinator' },
    { value: WorkspaceRole.SPONSORSHIP_COORDINATOR, label: 'Sponsorship Coordinator' },
    { value: WorkspaceRole.SOCIAL_MEDIA_COORDINATOR, label: 'Social Media Coordinator' },
    { value: WorkspaceRole.CONTENT_COORDINATOR, label: 'Content Coordinator' },
    { value: WorkspaceRole.SPEAKER_LIAISON_COORDINATOR, label: 'Speaker Liaison Coordinator' },
    { value: WorkspaceRole.JUDGE_COORDINATOR, label: 'Judge Coordinator' },
    { value: WorkspaceRole.MEDIA_COORDINATOR, label: 'Media Coordinator' },
    { value: WorkspaceRole.FINANCE_COORDINATOR, label: 'Finance Coordinator' },
    { value: WorkspaceRole.REGISTRATION_COORDINATOR, label: 'Registration Coordinator' },
    { value: WorkspaceRole.TECHNICAL_COORDINATOR, label: 'Technical Coordinator' },
    { value: WorkspaceRole.IT_COORDINATOR, label: 'IT Coordinator' },
    { value: WorkspaceRole.VOLUNTEER_COORDINATOR, label: 'Volunteer Coordinator' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const sortedMembers = [...teamMembers].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.user.name.toLowerCase();
        bValue = b.user.name.toLowerCase();
        break;
      case 'role':
        aValue = a.role;
        bValue = b.role;
        break;
      case 'joinedAt':
        aValue = new Date(a.joinedAt);
        bValue = new Date(b.joinedAt);
        break;
      case 'activity':
        aValue = getMemberActivity(a.id).contributionScore;
        bValue = getMemberActivity(b.id).contributionScore;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleRoleUpdate = (memberId: string, newRole: WorkspaceRole) => {
    onUpdateRole(memberId, newRole);
    setEditingRole(null);
  };

  const canEditMember = (member: TeamMember) => {
    // If member is an owner and they're the only owner, prevent editing their role
    if (member.role === WorkspaceRole.WORKSPACE_OWNER && ownerCount <= 1) {
      return false;
    }
    // Allow editing owners if there are multiple owners
    return true;
  };

  const canRemoveMember = (member: TeamMember) => {
    // Cannot remove the last owner
    if (member.role === WorkspaceRole.WORKSPACE_OWNER && ownerCount <= 1) {
      return false;
    }
    return true;
  };

  const getPermissionPreview = (role: WorkspaceRole) => {
    const permissions: Record<string, string[]> = {
      // Level 1 - Owner
      [WorkspaceRole.WORKSPACE_OWNER]: ['Full workspace access', 'Manage all team members', 'Delete workspace'],
      // Level 2 - Managers (department-specific)
      [WorkspaceRole.OPERATIONS_MANAGER]: ['Manage Operations department', 'Oversee leads', 'View all department data', 'Create sub-workspaces'],
      [WorkspaceRole.GROWTH_MANAGER]: ['Manage Growth department', 'Oversee leads', 'View all department data', 'Create sub-workspaces'],
      [WorkspaceRole.CONTENT_MANAGER]: ['Manage Content department', 'Oversee leads', 'View all department data', 'Create sub-workspaces'],
      [WorkspaceRole.TECH_FINANCE_MANAGER]: ['Manage Tech & Finance department', 'Oversee leads', 'View all department data', 'Create sub-workspaces'],
      [WorkspaceRole.VOLUNTEERS_MANAGER]: ['Manage Volunteers department', 'Oversee leads', 'View all department data', 'Create sub-workspaces'],
      // Level 3 - Leads
      [WorkspaceRole.EVENT_LEAD]: ['Manage event planning', 'Coordinate with vendors', 'Access participant data'],
      [WorkspaceRole.CATERING_LEAD]: ['Manage catering operations', 'Coordinate vendors', 'Track catering budget'],
      [WorkspaceRole.LOGISTICS_LEAD]: ['Manage logistics', 'Coordinate transport', 'Track logistics timeline'],
      [WorkspaceRole.FACILITY_LEAD]: ['Manage facility operations', 'Coordinate venues', 'Track setup requirements'],
      [WorkspaceRole.MARKETING_LEAD]: ['Manage marketing campaigns', 'Create promotional content', 'Access marketing tools'],
      [WorkspaceRole.COMMUNICATION_LEAD]: ['Manage communications', 'Coordinate announcements', 'Track messaging'],
      [WorkspaceRole.SPONSORSHIP_LEAD]: ['Manage sponsorships', 'Coordinate sponsors', 'Track sponsorship deliverables'],
      [WorkspaceRole.SOCIAL_MEDIA_LEAD]: ['Manage social media', 'Create content', 'Track engagement'],
      [WorkspaceRole.CONTENT_LEAD]: ['Manage content creation', 'Coordinate creators', 'Track content pipeline'],
      [WorkspaceRole.SPEAKER_LIAISON_LEAD]: ['Manage speaker relations', 'Coordinate sessions', 'Track speaker needs'],
      [WorkspaceRole.JUDGE_LEAD]: ['Manage judging process', 'Coordinate judges', 'Track scoring'],
      [WorkspaceRole.MEDIA_LEAD]: ['Manage media coverage', 'Coordinate photographers', 'Track media assets'],
      [WorkspaceRole.FINANCE_LEAD]: ['Manage finances', 'Track budgets', 'Approve expenses'],
      [WorkspaceRole.REGISTRATION_LEAD]: ['Manage registrations', 'Coordinate check-in', 'Track attendance'],
      [WorkspaceRole.TECHNICAL_LEAD]: ['Manage technical setup', 'Coordinate tech support', 'Track technical requirements'],
      [WorkspaceRole.IT_LEAD]: ['Manage IT infrastructure', 'Coordinate systems', 'Track IT issues'],
      [WorkspaceRole.VOLUNTEERS_LEAD]: ['Manage volunteer program', 'Coordinate assignments', 'Track volunteer hours'],
      // Level 4 - Coordinators (default permissions)
      [WorkspaceRole.EVENT_COORDINATOR]: ['Manage event details', 'Coordinate with vendors', 'Access participant data'],
    };

    // Return permissions for the role, or default coordinator permissions
    return permissions[role] || ['View assigned tasks', 'Update task progress', 'Participate in discussions'];
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? (
                <ChevronUpIcon className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 ml-2" />
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => onRoleFilterChange(e.target.value as WorkspaceRole | 'all')}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'pending' | 'inactive')}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Team Members ({sortedMembers.length})
          </h3>
        </div>

        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Member</span>
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('role')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Role</span>
                {sortBy === 'role' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort('joinedAt')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Joined</span>
                {sortBy === 'joinedAt' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="col-span-1">
              <button
                onClick={() => handleSort('activity')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Activity</span>
                {sortBy === 'activity' && (
                  sortOrder === 'asc' ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Team Members */}
        <div className="divide-y divide-gray-200">
          {sortedMembers.map((member) => {
            const activity = getMemberActivity(member.id);
            return (
              <div key={member.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Member Info */}
                  <div className="col-span-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2">
                    {editingRole === member.id ? (
                      <div>
                        <label className="sr-only" htmlFor={`member-role-${member.id}`}>
                          Role for {member.user.name}
                        </label>
                        <select
                          id={`member-role-${member.id}`}
                          value={member.role}
                          onChange={(e) => handleRoleUpdate(member.id, e.target.value as WorkspaceRole)}
                          onBlur={() => setEditingRole(null)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          autoFocus
                        >
                          {roleOptions.slice(1).map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Permissions: {getPermissionPreview(member.role).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(member.role)}
                        {canEditMember(member) && (
                          <button
                            type="button"
                            onClick={() => setEditingRole(member.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            aria-label={`Edit role for ${member.user.name}`}
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    {getStatusBadge(member.status)}
                  </div>

                  {/* Joined Date */}
                  <div className="col-span-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Activity Score */}
                  <div className="col-span-1">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${activity.contributionScore}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-500">{activity.contributionScore}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowMemberProfile(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View Profile"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {canRemoveMember(member) && (
                        <button
                          onClick={() => onRemoveMember(member.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Remove Member"
                          aria-label={`Remove ${member.user.name} from workspace`}
                        >
                          <UserMinusIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedMembers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {teamMembers.length === 0 
                ? "No team members have been added to this workspace yet."
                : "No team members match your current search and filter criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Member Profile Modal */}
      {showMemberProfile && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-5 border shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Member Profile</h3>
                <button
                  onClick={() => setShowMemberProfile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{selectedMember.user.name}</h4>
                    <p className="text-sm text-gray-500">{selectedMember.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1">{getRoleBadge(selectedMember.role)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedMember.status)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedMember.joinedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {selectedMember.invitedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Invited By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMember.invitedBy.name}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Activity Summary</label>
                  <div className="mt-2 space-y-2">
                    {(() => {
                      const activity = getMemberActivity(selectedMember.id);
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tasks Assigned:</span>
                            <span className="text-gray-900">{activity.tasksAssigned}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tasks Completed:</span>
                            <span className="text-gray-900">{activity.tasksCompleted}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Last Activity:</span>
                            <span className="text-gray-900">
                              {new Date(activity.lastActivity).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Contribution Score:</span>
                            <span className="text-gray-900">{activity.contributionScore}%</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Permissions</label>
                  <div className="mt-2">
                    <ul className="text-sm text-gray-600 space-y-1">
                      {getPermissionPreview(selectedMember.role).map((permission: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowMemberProfile(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                <a
                  href={`mailto:${selectedMember.user.email}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  Send Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}