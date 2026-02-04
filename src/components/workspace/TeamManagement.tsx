import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Workspace, TeamMember, WorkspaceRole, WorkspaceRoleScope } from '../../types';
import { TeamInvitation } from './TeamInvitation';
import { TeamRosterManagement } from './TeamRosterManagement';
import { WorkspaceRoleBadge, WorkspaceStatusBadge } from './WorkspaceBadges';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { TeamListSkeleton } from '@/components/ui/page-skeletons';

interface TeamManagementProps {
  workspace: Workspace;
  roleScope?: WorkspaceRoleScope;
}

export function TeamManagement({ workspace, roleScope }: TeamManagementProps) {
  const [activeView, setActiveView] = useState<'roster' | 'invite' | 'bulk-invite'>('roster');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<WorkspaceRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch team members from Supabase
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['workspace-team-members', workspace.id],
    queryFn: async () => {
      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_team_members')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      if (!membersData || membersData.length === 0) {
        return [] as TeamMember[];
      }

      // Get unique user IDs
      const userIds = [...new Set(membersData.map(m => m.user_id))];

      // Fetch user profiles for all members
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id -> profile data
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, { name: p.full_name || 'Unknown', email: '' }])
      );

      return membersData.map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role as WorkspaceRole,
        status: row.status,
        joinedAt: row.joined_at,
        leftAt: row.left_at || undefined,
        user: {
          id: row.user_id,
          name: profilesMap.get(row.user_id)?.name || 'Unknown Member',
          email: profilesMap.get(row.user_id)?.email || '',
        },
      })) as TeamMember[];
    },
  });

  // Pending invitations not yet backed by Supabase; show none for now
  const pendingInvitations: any[] = [];

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('workspace_team_members')
        .delete()
        .eq('id', memberId)
        .eq('workspace_id', workspace.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspace.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.id] });
      toast({
        title: 'Team member removed',
        description: 'The member has been removed from this workspace.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to remove member',
        description: 'Please try again or check your permissions.',
        variant: 'destructive',
      });
    },
  });

  // Update role mutation with optimistic UI and audit logging
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role, previousRole }: { memberId: string; role: WorkspaceRole; previousRole?: WorkspaceRole }) => {
      const member = teamMembers?.find(m => m.id === memberId);
      
      const { error } = await supabase
        .from('workspace_team_members')
        .update({ role })
        .eq('id', memberId)
        .eq('workspace_id', workspace.id);

      if (error) throw error;

      // Log activity
      await supabase.from('workspace_activities').insert({
        workspace_id: workspace.id,
        type: 'team',
        title: 'Role updated for team member',
        description: `Member role changed to ${role}`,
        metadata: { memberId, role },
      });

      // Log audit event for role change
      if (user?.id) {
        await supabase.from('workspace_audit_logs').insert([{
          workspace_id: workspace.id,
          actor_id: user.id,
          action: 'ROLE_CHANGED',
          target_user_id: member?.userId,
          previous_value: { role: previousRole },
          new_value: { role },
          metadata: {
            member_name: member?.user?.name,
            workspace_name: workspace.name,
          },
        }]);
      }
    },
    onMutate: async ({ memberId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['workspace-team-members', workspace.id] });

      const previousMembers = queryClient.getQueryData<TeamMember[]>([
        'workspace-team-members',
        workspace.id,
      ]);

      if (previousMembers) {
        const nextMembers = previousMembers.map((member) =>
          member.id === memberId ? { ...member, role } : member,
        );
        queryClient.setQueryData(['workspace-team-members', workspace.id], nextMembers);
      }

      return { previousMembers };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ['workspace-team-members', workspace.id],
          context.previousMembers,
        );
      }
      toast({
        title: 'Failed to update role',
        description: 'Please try again or check your permissions.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Role updated',
        description: 'The team member role has been updated successfully.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspace.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspace.id] });
    },
  });

  const handleRemoveTeamMember = (memberId: string) => {
    setMemberToRemove(memberId);
  };

  const confirmRemoveMember = async () => {
    if (memberToRemove) {
      await removeTeamMemberMutation.mutateAsync(memberToRemove);
      setMemberToRemove(null);
    }
  };

  const handleUpdateRole = async (memberId: string, role: WorkspaceRole) => {
    const member = teamMembers?.find(m => m.id === memberId);
    await updateRoleMutation.mutateAsync({ memberId, role, previousRole: member?.role });
  };

  const filteredMembers =
    teamMembers?.filter((member) => {
      if (roleScope && roleScope !== 'ALL' && member.role !== roleScope) {
        return false;
      }

      const matchesSearch =
        member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && member.status === 'ACTIVE') ||
        (statusFilter === 'pending' && member.status === 'PENDING') ||
        (statusFilter === 'inactive' && member.status === 'INACTIVE');

      return matchesSearch && matchesRole && matchesStatus;
    }) || [];

  const getStatusBadge = (status: string) => {
    return <WorkspaceStatusBadge status={status} />;
  };

  const getRoleBadge = (role: WorkspaceRole) => {
    return <WorkspaceRoleBadge role={role} />;
  };

  if (isLoading) {
    return <TeamListSkeleton itemCount={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage team members, roles, and access for {workspace.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('invite')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Invite Member
          </button>
          <button
            onClick={() => setActiveView('bulk-invite')}
            className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted"
          >
            <UserGroupIcon className="w-4 h-4 mr-2" />
            Bulk Invite
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('roster')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeView === 'roster'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Team Roster ({filteredMembers.length})
          </button>
          <button
            onClick={() => setActiveView('invite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeView === 'invite'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Invite Members
          </button>
          <button
            onClick={() => setActiveView('bulk-invite')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeView === 'bulk-invite'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            Bulk Invite
            {pendingInvitations && pendingInvitations.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
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
          currentUserRole={teamMembers?.find(m => m.userId === user?.id)?.role as WorkspaceRole | null}
        />
      )}

      <ConfirmationDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Remove team member"
        description="Are you sure you want to remove this team member? They will lose access to the workspace immediately."
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemoveMember}
        isLoading={removeTeamMemberMutation.isPending}
      />
    </div>
  );
}
