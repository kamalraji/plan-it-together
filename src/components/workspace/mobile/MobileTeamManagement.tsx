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
import { Workspace, WorkspaceRole } from '../../../types';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { TeamListSkeleton } from '@/components/ui/page-skeletons';
import { TeamCollaboration } from '@/components/illustrations';

interface MobileTeamManagementProps {
  workspace: Workspace;
  onInviteMember: () => void;
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

export function MobileTeamManagement({ workspace, onInviteMember }: MobileTeamManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithProfile | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('workspace_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Log workspace activity for mobile member removals
      await supabase.from('workspace_activities').insert({
        workspace_id: workspace.id,
        type: 'team',
        title: 'Team member removed (mobile)',
        description: 'A team member was removed from the workspace via mobile.',
        metadata: { memberId, source: 'mobile', action: 'remove_member' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspace.id] });
      setSelectedMember(null);
    },
  });

  const filteredMembers = teamMembers?.filter(member => {
    const name = member.user_profiles?.name?.toLowerCase() || '';
    const email = member.user_profiles?.email?.toLowerCase() || '';
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
                         email.includes(searchTerm.toLowerCase());
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      [WorkspaceRole.WORKSPACE_OWNER]: 'bg-purple-100 text-purple-800',
      [WorkspaceRole.OPERATIONS_MANAGER]: 'bg-violet-100 text-violet-800',
      [WorkspaceRole.GROWTH_MANAGER]: 'bg-violet-100 text-violet-800',
      [WorkspaceRole.CONTENT_MANAGER]: 'bg-violet-100 text-violet-800',
      [WorkspaceRole.TECH_FINANCE_MANAGER]: 'bg-violet-100 text-violet-800',
      [WorkspaceRole.VOLUNTEERS_MANAGER]: 'bg-violet-100 text-violet-800',
      [WorkspaceRole.EVENT_COORDINATOR]: 'bg-indigo-100 text-indigo-800',
      [WorkspaceRole.MARKETING_LEAD]: 'bg-pink-100 text-pink-800',
    };

    const roleLabels: Record<string, string> = {
      [WorkspaceRole.WORKSPACE_OWNER]: 'Owner',
      [WorkspaceRole.OPERATIONS_MANAGER]: 'Ops Manager',
      [WorkspaceRole.GROWTH_MANAGER]: 'Growth Mgr',
      [WorkspaceRole.CONTENT_MANAGER]: 'Content Mgr',
      [WorkspaceRole.TECH_FINANCE_MANAGER]: 'Tech/Finance',
      [WorkspaceRole.VOLUNTEERS_MANAGER]: 'Vol Manager',
      [WorkspaceRole.EVENT_COORDINATOR]: 'Coordinator',
      [WorkspaceRole.MARKETING_LEAD]: 'Marketing Lead',
    };

    const getLabel = (r: string): string => {
      if (roleLabels[r]) return roleLabels[r];
      if (r.endsWith('_MANAGER')) return r.replace(/_MANAGER$/, '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') + ' Mgr';
      if (r.endsWith('_LEAD')) return r.replace(/_LEAD$/, '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') + ' Lead';
      if (r.endsWith('_COORDINATOR')) return r.replace(/_COORDINATOR$/, '').split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') + ' Coord';
      return r.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
    };

    const getColor = (r: string): string => {
      if (roleColors[r]) return roleColors[r];
      if (r.endsWith('_MANAGER')) return 'bg-violet-100 text-violet-800';
      if (r.endsWith('_LEAD')) return 'bg-blue-100 text-blue-800';
      if (r.endsWith('_COORDINATOR')) return 'bg-indigo-100 text-indigo-800';
      return 'bg-muted text-foreground';
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getColor(role)}`}>
        {getLabel(role)}
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

  const handleRemoveMember = (memberId: string) => {
    setMemberToRemove(memberId);
  };

  const confirmRemoveMember = async () => {
    if (memberToRemove) {
      await removeTeamMemberMutation.mutateAsync(memberToRemove);
      setMemberToRemove(null);
    }
  };

  if (isLoading) {
    return <TeamListSkeleton itemCount={5} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">{filteredMembers.length} members</p>
        </div>
        <button
          onClick={onInviteMember}
          className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 min-h-[48px]"
        >
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Invite
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-input rounded-md focus-visible:ring-ring focus-visible:border-primary min-h-[48px]"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground min-h-[48px] px-2"
        >
          <FunnelIcon className="w-4 h-4 mr-2" />
          Filters
        </button>

        {/* Filter Options */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as WorkspaceRole | 'all')}
                className="w-full text-sm border border-input rounded-md focus-visible:ring-ring focus-visible:border-primary min-h-[48px]"
              >
                <option value="all">All Roles</option>
                <option value={WorkspaceRole.WORKSPACE_OWNER}>Owner</option>
                <option value={WorkspaceRole.OPERATIONS_MANAGER}>Ops Manager</option>
                <option value={WorkspaceRole.GROWTH_MANAGER}>Growth Mgr</option>
                <option value={WorkspaceRole.EVENT_LEAD}>Event Lead</option>
                <option value={WorkspaceRole.EVENT_COORDINATOR}>Coordinator</option>
                <option value={WorkspaceRole.MARKETING_LEAD}>Marketing Lead</option>
                <option value={WorkspaceRole.VOLUNTEER_COORDINATOR}>Vol. Coordinator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-sm border border-input rounded-md focus-visible:ring-ring focus-visible:border-primary min-h-[48px]"
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
          <div className="bg-card rounded-lg shadow-sm">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? (
              <SearchEmptyState
                searchTerm={searchTerm}
                onClear={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
              />
            ) : (
              <EmptyState
                illustration={<TeamCollaboration size="sm" />}
                title="No team members yet"
                description="Start building your team by inviting members"
                action={{
                  label: 'Invite Members',
                  onClick: onInviteMember,
                }}
              />
            )}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-card rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-medium text-sm">
                    {getInitials(member.user_profiles?.name || 'Unknown')}
                  </span>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {member.user_profiles?.name || 'Unknown User'}
                    </h3>
                    <button
                      onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                      className="p-2 rounded-md hover:bg-muted transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">{member.user_profiles?.email || ''}</p>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              </div>

              {/* Member Actions */}
              {selectedMember?.id === member.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="flex items-center justify-center px-3 py-3 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50 min-h-[48px]"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Role
                    </button>
                    <button
                      className="flex items-center justify-center px-3 py-3 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted/50 min-h-[48px]"
                    >
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Message
                    </button>
                  </div>
                  
                  {member.role !== WorkspaceRole.WORKSPACE_OWNER && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="w-full flex items-center justify-center px-3 py-3 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 min-h-[48px]"
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

      <ConfirmationDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove team member"
        description="Are you sure you want to remove this team member? They will lose access to the workspace."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemoveMember}
        isLoading={removeTeamMemberMutation.isPending}
      />
    </div>
  );
}
