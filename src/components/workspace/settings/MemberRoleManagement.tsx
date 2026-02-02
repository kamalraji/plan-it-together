import { useState } from 'react';
import { UserCog, ChevronDown, Shield, Crown, Briefcase, Users, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  SimpleDropdown,
  SimpleDropdownContent,
  SimpleDropdownItem,
  SimpleDropdownTrigger,
} from '@/components/ui/simple-dropdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TeamMember, WorkspaceRole } from '@/types';
import { useWorkspaceRBAC } from '@/hooks/useWorkspaceRBAC';
import { 
  getWorkspaceRoleLabel, 
  getWorkspaceRoleLevel,
  WorkspaceHierarchyLevel 
} from '@/lib/workspaceHierarchy';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MemberRoleManagementProps {
  teamMembers: TeamMember[];
  currentUserRole: WorkspaceRole | null;
  currentUserId?: string;
  workspaceId?: string;
  onMemberUpdated?: () => void;
}

export function MemberRoleManagement({
  teamMembers,
  currentUserRole,
  currentUserId,
  onMemberUpdated,
}: MemberRoleManagementProps) {
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const rbac = useWorkspaceRBAC(currentUserRole);

  // Count owners to protect the last owner
  const ownerCount = teamMembers.filter(m => m.role === WorkspaceRole.WORKSPACE_OWNER).length;

  // Check if member can be edited (includes last-owner protection)
  const checkCanEditMember = (member: TeamMember): boolean => {
    // Prevent editing the last owner's role
    if (member.role === WorkspaceRole.WORKSPACE_OWNER && ownerCount <= 1) {
      return false;
    }
    return rbac.canEditMember(member.role);
  };

  // Check if member can be removed (includes last-owner protection)
  const checkCanRemoveMember = (member: TeamMember): boolean => {
    // Prevent removing the last owner
    if (member.role === WorkspaceRole.WORKSPACE_OWNER && ownerCount <= 1) {
      return false;
    }
    return rbac.canRemoveMember(member.role);
  };

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    setUpdatingMemberId(memberId);
    try {
      const { error } = await supabase
        .from('workspace_team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Member role updated');
      onMemberUpdated?.();
    } catch {
      toast.error('Failed to update member role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    
    setIsRemoving(true);
    try {
      const { error } = await supabase
        .from('workspace_team_members')
        .delete()
        .eq('id', removingMember.id);

      if (error) throw error;
      toast.success(`${removingMember.user.name} removed from workspace`);
      onMemberUpdated?.();
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
      setRemovingMember(null);
    }
  };

  const getLevelIcon = (level: WorkspaceHierarchyLevel) => {
    switch (level) {
      case WorkspaceHierarchyLevel.OWNER:
        return <Crown className="h-3.5 w-3.5" />;
      case WorkspaceHierarchyLevel.MANAGER:
        return <Briefcase className="h-3.5 w-3.5" />;
      case WorkspaceHierarchyLevel.LEAD:
        return <Shield className="h-3.5 w-3.5" />;
      case WorkspaceHierarchyLevel.COORDINATOR:
        return <Users className="h-3.5 w-3.5" />;
    }
  };

  const getLevelBadgeVariant = (level: WorkspaceHierarchyLevel) => {
    switch (level) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case WorkspaceHierarchyLevel.LEAD:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  const getLevelLabel = (level: WorkspaceHierarchyLevel) => {
    switch (level) {
      case WorkspaceHierarchyLevel.OWNER:
        return 'Owner';
      case WorkspaceHierarchyLevel.MANAGER:
        return 'Manager';
      case WorkspaceHierarchyLevel.LEAD:
        return 'Lead';
      case WorkspaceHierarchyLevel.COORDINATOR:
        return 'Coordinator';
    }
  };

  // Group members by hierarchy level
  const membersByLevel = teamMembers.reduce((acc, member) => {
    const level = getWorkspaceRoleLevel(member.role);
    if (!acc[level]) acc[level] = [];
    acc[level].push(member);
    return acc;
  }, {} as Record<WorkspaceHierarchyLevel, TeamMember[]>);

  // Group assignable roles by level for the dropdown
  const getAssignableRolesByLevel = () => {
    const roles = rbac.assignableRoles;
    const grouped: Record<WorkspaceHierarchyLevel, WorkspaceRole[]> = {
      [WorkspaceHierarchyLevel.OWNER]: [],
      [WorkspaceHierarchyLevel.MANAGER]: [],
      [WorkspaceHierarchyLevel.LEAD]: [],
      [WorkspaceHierarchyLevel.COORDINATOR]: [],
    };

    roles.forEach(role => {
      const level = getWorkspaceRoleLevel(role);
      grouped[level].push(role);
    });

    return grouped;
  };

  const assignableByLevel = getAssignableRolesByLevel();

  const sortedLevels = [
    WorkspaceHierarchyLevel.OWNER,
    WorkspaceHierarchyLevel.MANAGER,
    WorkspaceHierarchyLevel.LEAD,
    WorkspaceHierarchyLevel.COORDINATOR,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <UserCog className="h-4 w-4" />
        <span>{rbac.permissionDescription}</span>
      </div>

      {sortedLevels.map(level => {
        const members = membersByLevel[level] || [];
        if (members.length === 0) return null;

        return (
          <div key={level} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn('gap-1.5', getLevelBadgeVariant(level))}
              >
                {getLevelIcon(level)}
                {getLevelLabel(level)}s ({members.length})
              </Badge>
            </div>

            <div className="space-y-2">
              {members.map(member => {
                const canEditThisMember = checkCanEditMember(member);
                const isUpdating = updatingMemberId === member.id;
                const memberLevel = getWorkspaceRoleLevel(member.role);

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {member.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {member.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEditThisMember ? (
                        <>
                        <SimpleDropdown>
                            <SimpleDropdownTrigger 
                              className="inline-flex items-center justify-center gap-1.5 text-xs h-8 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <span className="animate-pulse">Updating...</span>
                              ) : (
                                <>
                                  {getWorkspaceRoleLabel(member.role)}
                                  <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </SimpleDropdownTrigger>
                            <SimpleDropdownContent align="end" className="w-56">
                              {sortedLevels.map(roleLevel => {
                                const rolesInLevel = assignableByLevel[roleLevel];
                                if (rolesInLevel.length === 0) return null;

                                return (
                                  <div key={roleLevel}>
                                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                      {getLevelIcon(roleLevel)}
                                      {getLevelLabel(roleLevel)} Roles
                                    </div>
                                    {rolesInLevel.map(role => (
                                      <SimpleDropdownItem
                                        key={role}
                                        onClick={() => handleRoleChange(member.id, role)}
                                        className={cn(
                                          member.role === role && 'bg-accent'
                                        )}
                                      >
                                        {getWorkspaceRoleLabel(role)}
                                      </SimpleDropdownItem>
                                    ))}
                                    <div className="-mx-1 my-1 h-px bg-muted" />
                                  </div>
                                );
                              })}
                            </SimpleDropdownContent>
                          </SimpleDropdown>
                          
                          {/* Remove button - only show if not self */}
                          {member.userId !== currentUserId && checkCanRemoveMember(member) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setRemovingMember(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getLevelBadgeVariant(memberLevel))}
                        >
                          {getWorkspaceRoleLabel(member.role)}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {teamMembers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No team members yet</p>
        </div>
      )}

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removingMember?.user.name}</strong> from this workspace? 
              They will lose access to all workspace tasks and resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
