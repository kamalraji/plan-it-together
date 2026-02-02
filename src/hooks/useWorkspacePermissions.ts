import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TeamMember, UserRole, WorkspaceRole } from '@/types';

interface UseWorkspacePermissionsProps {
  teamMembers: TeamMember[];
  eventId?: string;
  workspaceType?: string | null;
}

/**
 * Shared hook for workspace permission calculations
 * Used by both desktop and mobile workspace dashboards
 */
export function useWorkspacePermissions({ teamMembers, eventId, workspaceType }: UseWorkspacePermissionsProps) {
  const { user } = useAuth();

  return useMemo(() => {
    const isGlobalWorkspaceManager =
      !!user && (user.role === UserRole.ORGANIZER || user.role === UserRole.SUPER_ADMIN);

    const currentMember = teamMembers?.find((member) => member.userId === user?.id);
    
    // Normalize legacy 'OWNER' role to 'WORKSPACE_OWNER' for permission checks
    const effectiveRole = (currentMember?.role as string) === 'OWNER' 
      ? WorkspaceRole.WORKSPACE_OWNER 
      : currentMember?.role;

    const managerWorkspaceRoles: WorkspaceRole[] = [
      WorkspaceRole.WORKSPACE_OWNER,
      WorkspaceRole.OPERATIONS_MANAGER,
      WorkspaceRole.GROWTH_MANAGER,
      WorkspaceRole.CONTENT_MANAGER,
      WorkspaceRole.TECH_FINANCE_MANAGER,
      WorkspaceRole.VOLUNTEERS_MANAGER,
      WorkspaceRole.EVENT_COORDINATOR,
    ];

    const isWorkspaceRoleManager = effectiveRole
      ? managerWorkspaceRoles.includes(effectiveRole as WorkspaceRole)
      : false;

    const isRootWorkspace = workspaceType === 'ROOT';
    
    const canManageTasks = isGlobalWorkspaceManager || isWorkspaceRoleManager;
    const canPublishEvent = isGlobalWorkspaceManager && !!eventId;
    const canManageSettings = isGlobalWorkspaceManager;
    const canInviteMembers = isGlobalWorkspaceManager;
    const canCreateSubWorkspace = isGlobalWorkspaceManager && isRootWorkspace;

    return {
      user,
      currentMember,
      isGlobalWorkspaceManager,
      isWorkspaceRoleManager,
      canManageTasks,
      canPublishEvent,
      canManageSettings,
      canInviteMembers,
      canCreateSubWorkspace,
    };
  }, [user, teamMembers, eventId, workspaceType]);
}
