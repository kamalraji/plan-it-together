import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamMember, WorkspaceRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { toast } from 'sonner';
import { TeamCollaboration } from '@/components/illustrations';

interface WorkspaceRoleAssignmentProps {
  workspaceId: string;
  teamMembers: TeamMember[];
  currentUserRole?: WorkspaceRole;
  isGlobalManager: boolean;
}

const ROLE_DESCRIPTIONS: Partial<Record<WorkspaceRole, string>> = {
  // Level 1
  [WorkspaceRole.WORKSPACE_OWNER]: 'Full control over workspace settings, team, tasks, and permissions',
  // Level 2 - Department Managers
  [WorkspaceRole.OPERATIONS_MANAGER]: 'Manage Operations department strategy, oversee leads, and create sub-workspaces',
  [WorkspaceRole.GROWTH_MANAGER]: 'Manage Growth department strategy, oversee leads, and create sub-workspaces',
  [WorkspaceRole.CONTENT_MANAGER]: 'Manage Content department strategy, oversee leads, and create sub-workspaces',
  [WorkspaceRole.TECH_FINANCE_MANAGER]: 'Manage Tech & Finance department strategy, oversee leads, and create sub-workspaces',
  [WorkspaceRole.VOLUNTEERS_MANAGER]: 'Manage Volunteers department strategy, oversee leads, and create sub-workspaces',
  // Level 3 - Leads
  [WorkspaceRole.EVENT_LEAD]: 'Lead event planning, coordinate vendors, and manage event timeline',
  [WorkspaceRole.CATERING_LEAD]: 'Lead catering operations and vendor coordination',
  [WorkspaceRole.LOGISTICS_LEAD]: 'Lead logistics planning and transport coordination',
  [WorkspaceRole.FACILITY_LEAD]: 'Lead facility operations and venue management',
  [WorkspaceRole.MARKETING_LEAD]: 'Manage marketing tasks, post updates, view analytics',
  [WorkspaceRole.COMMUNICATION_LEAD]: 'Lead communications and announcement coordination',
  [WorkspaceRole.SPONSORSHIP_LEAD]: 'Lead sponsorship relations and deliverables tracking',
  [WorkspaceRole.SOCIAL_MEDIA_LEAD]: 'Lead social media strategy and content creation',
  [WorkspaceRole.CONTENT_LEAD]: 'Lead content creation and pipeline management',
  [WorkspaceRole.SPEAKER_LIAISON_LEAD]: 'Lead speaker relations and session coordination',
  [WorkspaceRole.JUDGE_LEAD]: 'Lead judging process and scoring coordination',
  [WorkspaceRole.MEDIA_LEAD]: 'Lead media coverage and asset management',
  [WorkspaceRole.FINANCE_LEAD]: 'Lead financial planning and budget tracking',
  [WorkspaceRole.REGISTRATION_LEAD]: 'Lead registration process and attendance tracking',
  [WorkspaceRole.TECHNICAL_LEAD]: 'Lead technical setup and support coordination',
  [WorkspaceRole.IT_LEAD]: 'Lead IT infrastructure and systems management',
  [WorkspaceRole.VOLUNTEERS_LEAD]: 'Lead volunteer program and assignment coordination',
  // Level 4 - Coordinators
  [WorkspaceRole.EVENT_COORDINATOR]: 'Manage tasks, coordinate activities, broadcast, and export reports',
  [WorkspaceRole.CATERING_COORDINATOR]: 'Coordinate catering tasks and vendor communications',
  [WorkspaceRole.LOGISTICS_COORDINATOR]: 'Coordinate logistics tasks and transport scheduling',
  [WorkspaceRole.FACILITY_COORDINATOR]: 'Coordinate facility setup and venue preparations',
  [WorkspaceRole.MARKETING_COORDINATOR]: 'Coordinate marketing tasks and content distribution',
  [WorkspaceRole.COMMUNICATION_COORDINATOR]: 'Coordinate communications and messaging tasks',
  [WorkspaceRole.SPONSORSHIP_COORDINATOR]: 'Coordinate sponsor communications and deliverables',
  [WorkspaceRole.SOCIAL_MEDIA_COORDINATOR]: 'Coordinate social media posts and engagement',
  [WorkspaceRole.CONTENT_COORDINATOR]: 'Coordinate content creation tasks',
  [WorkspaceRole.SPEAKER_LIAISON_COORDINATOR]: 'Coordinate speaker communications and logistics',
  [WorkspaceRole.JUDGE_COORDINATOR]: 'Coordinate judge assignments and scoring',
  [WorkspaceRole.MEDIA_COORDINATOR]: 'Coordinate media coverage and photography',
  [WorkspaceRole.FINANCE_COORDINATOR]: 'Coordinate financial tasks and expense tracking',
  [WorkspaceRole.REGISTRATION_COORDINATOR]: 'Coordinate registration and check-in operations',
  [WorkspaceRole.TECHNICAL_COORDINATOR]: 'Coordinate technical setup and issue resolution',
  [WorkspaceRole.IT_COORDINATOR]: 'Coordinate IT support and systems maintenance',
  [WorkspaceRole.VOLUNTEER_COORDINATOR]: 'Coordinate volunteer tasks and scheduling',
};

const getRoleDescription = (role: WorkspaceRole): string => {
  return ROLE_DESCRIPTIONS[role] || 'Perform assigned tasks and participate in team activities';
};

export function WorkspaceRoleAssignment({
  workspaceId,
  teamMembers,
  currentUserRole,
  isGlobalManager,
}: WorkspaceRoleAssignmentProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(null);

  const canManageRoles = isGlobalManager || currentUserRole === WorkspaceRole.WORKSPACE_OWNER;

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: WorkspaceRole }) => {
      const { error } = await supabase
        .from('workspace_team_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Log audit event
      await supabase.from('workspace_activities').insert({
        workspace_id: workspaceId,
        type: 'team',
        title: 'Role reassignment',
        description: `Changed team member role to ${formatRoleName(newRole)}`,
        actor_id: user?.id,
        actor_name: user?.name || user?.email || 'Unknown',
        metadata: { memberId, newRole, action: 'role_change' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-team-members', workspaceId] });
      toast.success('Role updated successfully');
      setEditingMemberId(null);
      setSelectedRole(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const handleStartEdit = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setSelectedRole(member.role as WorkspaceRole);
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setSelectedRole(null);
  };

  const handleSaveRole = (memberId: string) => {
    if (!selectedRole) return;
    updateRoleMutation.mutate({ memberId, newRole: selectedRole });
  };

  const formatRoleName = (role: WorkspaceRole): string => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!canManageRoles) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <XMarkIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Restricted Access</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Only workspace owners can manage team member roles. Contact the workspace owner to request role
              changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-4 bg-muted/40 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Team Role Management</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Assign or change workspace roles for team members to control their permissions
        </p>
      </div>

      <div className="divide-y divide-border">
        {teamMembers.length === 0 ? (
          <div className="px-4 sm:px-6 py-8 text-center flex flex-col items-center">
            <TeamCollaboration size="xs" showBackground={false} />
            <p className="mt-3 text-sm text-muted-foreground">No team members yet</p>
          </div>
        ) : (
          teamMembers.map((member) => {
            const isEditing = editingMemberId === member.id;
            const isCurrentUser = member.userId === user?.id;

            return (
              <div
                key={member.id}
                className="px-4 sm:px-6 py-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.user?.name || member.user?.email || 'Unknown User'}
                      </p>
                      {isCurrentUser && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          You
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <select
                          value={selectedRole || ''}
                          onChange={(e) => setSelectedRole(e.target.value as WorkspaceRole)}
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        >
                          {Object.values(WorkspaceRole).map((role) => (
                            <option key={role} value={role}>
                              {formatRoleName(role)}
                            </option>
                          ))}
                        </select>
                        {selectedRole && (
                          <p className="text-xs text-muted-foreground">
                            {getRoleDescription(selectedRole)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-border">
                          {formatRoleName(member.role as WorkspaceRole)}
                        </span>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getRoleDescription(member.role as WorkspaceRole)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveRole(member.id)}
                          disabled={updateRoleMutation.isPending}
                          className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={updateRoleMutation.isPending}
                          className="inline-flex items-center rounded-md bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm border border-border hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(member)}
                        disabled={isCurrentUser}
                        className="inline-flex items-center rounded-md bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm border border-border hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Change Role
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
