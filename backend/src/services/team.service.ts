import { PrismaClient, WorkspaceRole, MemberStatus } from '@prisma/client';
import { generateEmailVerificationToken } from '../utils/token.utils';
import { TeamInvitationDTO, TeamMemberResponse, InvitationResponse, BulkInvitationDTO } from '../types';

const prisma = new PrismaClient();

export class TeamService {
  /**
   * Invite a team member to workspace
   */
  async inviteTeamMember(
    workspaceId: string,
    inviterId: string,
    invitation: TeamInvitationDTO
  ): Promise<InvitationResponse> {
    // Verify inviter has permission to invite members
    await this.verifyInvitePermission(workspaceId, inviterId);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    // If user doesn't exist, create a pending user record
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          name: invitation.name || invitation.email.split('@')[0],
          passwordHash: '', // Will be set when user completes registration
          role: 'PARTICIPANT', // Default role for invited users
          status: 'PENDING',
          emailVerified: false,
        },
      });
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }

    // Create team member record
    const teamMember = await prisma.teamMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: invitation.role,
        invitedBy: inviterId,
        status: MemberStatus.INVITED,
        permissions: this.getDefaultPermissions(invitation.role),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
      },
    });

    // Generate invitation token
    const invitationToken = this.generateInvitationToken(teamMember.id, workspaceId);

    // In a real implementation, send invitation email here
    // await this.sendInvitationEmail(user.email, teamMember, invitationToken);

    return {
      id: teamMember.id,
      workspaceId,
      email: user.email,
      role: invitation.role,
      status: 'INVITED',
      invitationToken,
      workspace: {
        id: teamMember.workspace.id,
        name: teamMember.workspace.name,
        event: teamMember.workspace.event,
      },
      invitedAt: teamMember.joinedAt,
    };
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(invitationToken: string, userId?: string): Promise<TeamMemberResponse> {
    // Verify invitation token
    const { teamMemberId, workspaceId } = this.verifyInvitationToken(invitationToken);

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
      include: {
        user: true,
        workspace: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!teamMember) {
      throw new Error('Invalid invitation');
    }

    if (teamMember.status !== MemberStatus.INVITED) {
      throw new Error('Invitation has already been processed');
    }

    // If userId is provided, verify it matches the invited user
    if (userId && teamMember.userId !== userId) {
      throw new Error('Invitation is for a different user');
    }

    // Update team member status to active
    const updatedMember = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: { status: MemberStatus.ACTIVE },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Notify existing team members about new member
    await this.notifyTeamMembersOfNewJoiner(workspaceId, updatedMember);

    return this.mapTeamMemberToResponse(updatedMember);
  }

  /**
   * Bulk invite team members
   */
  async bulkInviteTeamMembers(
    workspaceId: string,
    inviterId: string,
    bulkInvitation: BulkInvitationDTO
  ): Promise<InvitationResponse[]> {
    // Verify inviter has permission to invite members
    await this.verifyInvitePermission(workspaceId, inviterId);

    const results: InvitationResponse[] = [];
    const errors: Array<{ email: string; error: string }> = [];

    for (const invitation of bulkInvitation.invitations) {
      try {
        const result = await this.inviteTeamMember(workspaceId, inviterId, invitation);
        results.push(result);
      } catch (error) {
        errors.push({
          email: invitation.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // If there were errors, include them in the response
    if (errors.length > 0) {
      console.warn('Bulk invitation errors:', errors);
    }

    return results;
  }

  /**
   * Get team members for workspace
   */
  async getTeamMembers(workspaceId: string, userId: string): Promise<TeamMemberResponse[]> {
    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(workspaceId, userId);

    const teamMembers = await prisma.teamMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return teamMembers.map(member => this.mapTeamMemberToResponse(member));
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    workspaceId: string,
    teamMemberId: string,
    newRole: WorkspaceRole,
    updaterId: string
  ): Promise<TeamMemberResponse> {
    // Verify updater has permission to manage team
    await this.verifyManageTeamPermission(workspaceId, updaterId);

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!teamMember || teamMember.workspaceId !== workspaceId) {
      throw new Error('Team member not found');
    }

    // Prevent removing the last workspace owner
    if (teamMember.role === WorkspaceRole.WORKSPACE_OWNER) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.WORKSPACE_OWNER,
          status: MemberStatus.ACTIVE,
        },
      });

      if (ownerCount <= 1 && newRole !== WorkspaceRole.WORKSPACE_OWNER) {
        throw new Error('Cannot remove the last workspace owner');
      }
    }

    // Update role and permissions
    const updatedMember = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: {
        role: newRole,
        permissions: this.getDefaultPermissions(newRole),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.mapTeamMemberToResponse(updatedMember);
  }

  /**
   * Remove team member from workspace
   */
  async removeTeamMember(
    workspaceId: string,
    teamMemberId: string,
    removerId: string
  ): Promise<void> {
    // Verify remover has permission to manage team
    await this.verifyManageTeamPermission(workspaceId, removerId);

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!teamMember || teamMember.workspaceId !== workspaceId) {
      throw new Error('Team member not found');
    }

    // Prevent removing the last workspace owner
    if (teamMember.role === WorkspaceRole.WORKSPACE_OWNER) {
      const ownerCount = await prisma.teamMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.WORKSPACE_OWNER,
          status: MemberStatus.ACTIVE,
        },
      });

      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last workspace owner');
      }
    }

    // Reassign tasks assigned to this member
    await prisma.workspaceTask.updateMany({
      where: {
        workspaceId,
        assigneeId: teamMemberId,
        status: { notIn: ['COMPLETED'] },
      },
      data: { assigneeId: null },
    });

    // Update member status to inactive
    await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: {
        status: MemberStatus.INACTIVE,
        leftAt: new Date(),
      },
    });
  }

  /**
   * Get team member by user ID
   */
  async getTeamMemberByUserId(workspaceId: string, userId: string): Promise<TeamMemberResponse | null> {
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!teamMember) {
      return null;
    }

    return this.mapTeamMemberToResponse(teamMember);
  }

  /**
   * Verify user has permission to invite members
   */
  private async verifyInvitePermission(workspaceId: string, userId: string): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: MemberStatus.ACTIVE,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }

    const permissions = (teamMember.permissions as string[]) || this.getDefaultPermissions(teamMember.role);
    
    if (!permissions.includes('INVITE_MEMBERS') && !permissions.includes('MANAGE_TEAM')) {
      throw new Error('Access denied: User does not have permission to invite members');
    }
  }

  /**
   * Verify user has permission to manage team
   */
  private async verifyManageTeamPermission(workspaceId: string, userId: string): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: MemberStatus.ACTIVE,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }

    const permissions = (teamMember.permissions as string[]) || this.getDefaultPermissions(teamMember.role);
    
    if (!permissions.includes('MANAGE_TEAM')) {
      throw new Error('Access denied: User does not have permission to manage team');
    }
  }

  /**
   * Verify user has access to workspace
   */
  private async verifyWorkspaceAccess(workspaceId: string, userId: string): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }
  }

  /**
   * Get default permissions for a role
   */
  private getDefaultPermissions(role: WorkspaceRole): string[] {
    const permissions: Record<WorkspaceRole, string[]> = {
      WORKSPACE_OWNER: [
        'MANAGE_WORKSPACE',
        'MANAGE_TEAM',
        'MANAGE_TASKS',
        'MANAGE_CHANNELS',
        'VIEW_ANALYTICS',
        'MANAGE_PERMISSIONS',
        'INVITE_MEMBERS',
      ],
      TEAM_LEAD: [
        'MANAGE_TASKS',
        'MANAGE_CHANNELS',
        'VIEW_ANALYTICS',
        'INVITE_MEMBERS',
        'CREATE_TASKS',
      ],
      EVENT_COORDINATOR: [
        'MANAGE_TASKS',
        'VIEW_ANALYTICS',
        'CREATE_TASKS',
      ],
      VOLUNTEER_MANAGER: [
        'MANAGE_TASKS',
        'CREATE_TASKS',
        'INVITE_MEMBERS',
      ],
      TECHNICAL_SPECIALIST: [
        'CREATE_TASKS',
        'MANAGE_TASKS',
      ],
      MARKETING_LEAD: [
        'CREATE_TASKS',
        'MANAGE_TASKS',
        'MANAGE_CHANNELS',
      ],
      GENERAL_VOLUNTEER: [
        'VIEW_TASKS',
        'UPDATE_TASK_PROGRESS',
      ],
    };

    return permissions[role] || [];
  }

  /**
   * Generate invitation token
   */
  private generateInvitationToken(teamMemberId: string, workspaceId: string): string {
    // In a real implementation, this would use JWT or similar
    // For now, using a simple token format
    return generateEmailVerificationToken(`${teamMemberId}:${workspaceId}`);
  }

  /**
   * Verify invitation token
   */
  private verifyInvitationToken(token: string): { teamMemberId: string; workspaceId: string } {
    try {
      // In a real implementation, this would verify JWT
      // For now, using simple token format
      const decoded = Buffer.from(token, 'base64').toString();
      const [teamMemberId, workspaceId] = decoded.split(':');
      
      if (!teamMemberId || !workspaceId) {
        throw new Error('Invalid token format');
      }

      return { teamMemberId, workspaceId };
    } catch (error) {
      throw new Error('Invalid invitation token');
    }
  }

  /**
   * Notify team members of new joiner
   */
  private async notifyTeamMembersOfNewJoiner(workspaceId: string, newMember: any): Promise<void> {
    // In a real implementation, this would send notifications
    // For now, just log the event
    console.log(`New team member ${newMember.user.name} joined workspace ${workspaceId}`);
  }

  /**
   * Map team member to response format
   */
  private mapTeamMemberToResponse(member: any): TeamMemberResponse {
    return {
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      role: member.role,
      permissions: member.permissions as string[],
      status: member.status,
      joinedAt: member.joinedAt,
      leftAt: member.leftAt,
      user: member.user,
      invitedBy: member.inviter ? {
        id: member.inviter.id,
        name: member.inviter.name,
      } : undefined,
    };
  }
}

export const teamService = new TeamService();