import { PrismaClient, WorkspaceStatus, WorkspaceRole, EventStatus } from '@prisma/client';
import { WorkspaceSettings, UpdateWorkspaceDTO, WorkspaceResponse } from '../types';

const prisma = new PrismaClient();

export class WorkspaceService {
  /**
   * Provision a new workspace for an event
   */
  async provisionWorkspace(eventId: string, organizerId: string): Promise<WorkspaceResponse> {
    // Verify event exists and organizer owns it
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('Only event organizers can provision workspaces');
    }

    // Check if workspace already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { eventId },
    });

    if (existingWorkspace) {
      throw new Error('Workspace already exists for this event');
    }

    // Create workspace with default settings
    const defaultSettings: WorkspaceSettings = {
      autoInviteOrganizer: true,
      defaultChannels: ['general', 'announcements', 'tasks'],
      taskCategories: ['SETUP', 'MARKETING', 'LOGISTICS', 'TECHNICAL', 'REGISTRATION', 'POST_EVENT'],
      retentionPeriodDays: 30,
      allowExternalMembers: false,
    };

    const workspace = await prisma.workspace.create({
      data: {
        eventId,
        name: `${event.name} Workspace`,
        description: `Collaborative workspace for ${event.name}`,
        status: WorkspaceStatus.PROVISIONING,
        settings: defaultSettings as any,
      },
    });

    // Auto-assign organizer as workspace owner
    await prisma.teamMember.create({
      data: {
        workspaceId: workspace.id,
        userId: organizerId,
        role: WorkspaceRole.WORKSPACE_OWNER,
        invitedBy: organizerId,
        permissions: this.getDefaultPermissions(WorkspaceRole.WORKSPACE_OWNER),
      },
    });

    // Create default channels
    await this.createDefaultChannels(workspace.id);

    // Update workspace status to active
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: { status: WorkspaceStatus.ACTIVE },
      include: {
        event: true,
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return this.mapWorkspaceToResponse(updatedWorkspace);
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string, userId: string): Promise<WorkspaceResponse> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        event: true,
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        channels: true,
      },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Verify user has access to workspace
    const teamMember = workspace.teamMembers.find(member => member.userId === userId);
    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }

    return this.mapWorkspaceToResponse(workspace);
  }

  /**
   * Get workspace by event ID
   */
  async getWorkspaceByEventId(eventId: string, userId: string): Promise<WorkspaceResponse | null> {
    const workspace = await prisma.workspace.findUnique({
      where: { eventId },
      include: {
        event: true,
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        channels: true,
      },
    });

    if (!workspace) {
      return null;
    }

    // Verify user has access to workspace
    const teamMember = workspace.teamMembers.find(member => member.userId === userId);
    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }

    return this.mapWorkspaceToResponse(workspace);
  }

  /**
   * Update workspace settings
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    updates: UpdateWorkspaceDTO
  ): Promise<WorkspaceResponse> {
    // Verify user has permission to update workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.settings !== undefined) updateData.settings = updates.settings;

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      include: {
        event: true,
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        channels: true,
      },
    });

    return this.mapWorkspaceToResponse(workspace);
  }

  /**
   * Dissolve workspace (after event completion)
   */
  async dissolveWorkspace(workspaceId: string, userId: string): Promise<void> {
    // Verify user has permission to dissolve workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { event: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Check if event is completed
    const now = new Date();
    if (workspace.event.endDate > now && workspace.event.status !== 'COMPLETED') {
      throw new Error('Cannot dissolve workspace before event completion');
    }

    // Update workspace status to winding down
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: WorkspaceStatus.WINDING_DOWN,
      },
    });

    // Schedule dissolution after retention period
    const settings = workspace.settings as any as WorkspaceSettings;
    const retentionPeriod = settings?.retentionPeriodDays || 30;
    const dissolutionDate = new Date();
    dissolutionDate.setDate(dissolutionDate.getDate() + retentionPeriod);

    // For now, immediately dissolve (in production, this would be scheduled)
    await this.performDissolution(workspaceId);
  }

  /**
   * Initiate workspace wind-down process
   */
  async initiateWindDown(workspaceId: string, userId: string): Promise<void> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { event: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (workspace.status !== WorkspaceStatus.ACTIVE) {
      throw new Error('Can only initiate wind-down for active workspaces');
    }

    // Update workspace status to winding down
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: WorkspaceStatus.WINDING_DOWN,
      },
    });

    // Notify team members about wind-down
    await this.notifyTeamMembersOfWindDown(workspaceId);
  }

  /**
   * Check and process workspaces for automatic dissolution
   */
  async processAutomaticDissolution(): Promise<void> {
    // Find workspaces that should be dissolved
    const workspacesToDissolve = await prisma.workspace.findMany({
      where: {
        status: WorkspaceStatus.WINDING_DOWN,
        event: {
          OR: [
            { status: EventStatus.COMPLETED },
            { endDate: { lt: new Date() } }
          ]
        }
      },
      include: { event: true },
    });

    for (const workspace of workspacesToDissolve) {
      const settings = workspace.settings as any as WorkspaceSettings;
      const retentionPeriod = settings?.retentionPeriodDays || 30;
      
      // Calculate dissolution date based on event end date
      const dissolutionDate = new Date(workspace.event.endDate);
      dissolutionDate.setDate(dissolutionDate.getDate() + retentionPeriod);

      // Check if retention period has passed
      if (new Date() >= dissolutionDate) {
        await this.performDissolution(workspace.id);
      }
    }
  }

  /**
   * Emergency revoke access for security incidents
   */
  async emergencyRevokeAccess(workspaceId: string, userId: string, reason: string): Promise<void> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    // Immediately revoke all team member access
    await prisma.teamMember.updateMany({
      where: { workspaceId },
      data: { status: 'INACTIVE', leftAt: new Date() },
    });

    // Log the emergency revocation
    console.log(`Emergency access revocation for workspace ${workspaceId}:`, {
      revokedBy: userId,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Update workspace status
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: WorkspaceStatus.DISSOLVED,
        dissolvedAt: new Date(),
      },
    });
  }

  /**
   * Handle team member early departure
   */
  async handleEarlyDeparture(workspaceId: string, departingUserId: string, managerId: string): Promise<void> {
    // Verify manager has permission
    await this.verifyWorkspacePermission(workspaceId, managerId, 'MANAGE_TEAM');

    // Find the departing team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId: departingUserId,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('Team member not found or already inactive');
    }

    // Revoke access
    await prisma.teamMember.update({
      where: { id: teamMember.id },
      data: {
        status: 'INACTIVE',
        leftAt: new Date(),
      },
    });

    // Reassign their pending tasks
    await this.reassignPendingTasks(workspaceId, departingUserId, managerId);
  }

  /**
   * Apply workspace template
   */
  async applyTemplate(workspaceId: string, templateId: string, userId: string): Promise<void> {
    // Verify user has permission to manage workspace
    await this.verifyWorkspacePermission(workspaceId, userId, 'MANAGE_WORKSPACE');

    // For now, this is a placeholder - template system will be implemented later
    // In a full implementation, this would:
    // 1. Load template configuration
    // 2. Create predefined roles and permissions
    // 3. Create template tasks and categories
    // 4. Set up template channels and communication structure

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { templateId },
    });
  }

  /**
   * Get comprehensive workspace analytics
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
   */
  async getWorkspaceAnalytics(workspaceId: string, userId: string): Promise<any> {
    // Import analytics service dynamically to avoid circular dependencies
    const { workspaceAnalyticsService } = await import('./workspace-analytics.service');
    return workspaceAnalyticsService.getWorkspaceAnalytics(workspaceId, userId);
  }

  /**
   * Get workspace progress indicators for event integration
   * Requirements: 9.5
   */
  async getWorkspaceProgressIndicators(workspaceId: string, userId: string): Promise<any> {
    // Import event sync service dynamically to avoid circular dependencies
    const { workspaceEventSyncService } = await import('./workspace-event-sync.service');
    return workspaceEventSyncService.getWorkspaceProgressIndicators(workspaceId, userId);
  }

  /**
   * Synchronize workspace with event milestones
   * Requirements: 9.1, 9.2
   */
  async synchronizeWithEvent(workspaceId: string, userId: string, config?: any): Promise<void> {
    // Import event sync service dynamically to avoid circular dependencies
    const { workspaceEventSyncService } = await import('./workspace-event-sync.service');
    return workspaceEventSyncService.synchronizeWithEventMilestones(workspaceId, userId, config);
  }

  /**
   * Get template recommendations for workspace
   * Requirements: 11.2
   */
  async getTemplateRecommendations(eventId: string, userId: string): Promise<any[]> {
    // Import template service dynamically to avoid circular dependencies
    const { workspaceTemplateService } = await import('./workspace-template.service');
    return workspaceTemplateService.getTemplateRecommendations(eventId, userId);
  }

  /**
   * Create template from successful workspace
   * Requirements: 11.1
   */
  async createTemplateFromWorkspace(
    workspaceId: string,
    userId: string,
    templateData: any
  ): Promise<any> {
    // Import template service dynamically to avoid circular dependencies
    const { workspaceTemplateService } = await import('./workspace-template.service');
    return workspaceTemplateService.createTemplateFromWorkspace(workspaceId, userId, templateData);
  }

  /**
   * Create default channels for a workspace
   */
  private async createDefaultChannels(workspaceId: string): Promise<void> {
    const defaultChannels = [
      {
        name: 'general',
        type: 'GENERAL' as const,
        description: 'General team discussions',
      },
      {
        name: 'announcements',
        type: 'ANNOUNCEMENT' as const,
        description: 'Important announcements and updates',
      },
      {
        name: 'tasks',
        type: 'TASK_SPECIFIC' as const,
        description: 'Task-related discussions',
      },
    ];

    for (const channel of defaultChannels) {
      await prisma.workspaceChannel.create({
        data: {
          workspaceId,
          ...channel,
        },
      });
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
      ],
      TEAM_LEAD: [
        'MANAGE_TASKS',
        'MANAGE_CHANNELS',
        'VIEW_ANALYTICS',
        'INVITE_MEMBERS',
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
   * Verify user has specific permission in workspace
   */
  private async verifyWorkspacePermission(
    workspaceId: string,
    userId: string,
    permission: string
  ): Promise<void> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!teamMember) {
      throw new Error('Access denied: User is not a member of this workspace');
    }

    const permissions = (teamMember.permissions as string[]) || this.getDefaultPermissions(teamMember.role);
    
    if (!permissions.includes(permission)) {
      throw new Error(`Access denied: User does not have ${permission} permission`);
    }
  }

  /**
   * Perform actual workspace dissolution
   */
  private async performDissolution(workspaceId: string): Promise<void> {
    // Revoke all team member access
    await prisma.teamMember.updateMany({
      where: { workspaceId },
      data: { status: 'INACTIVE', leftAt: new Date() },
    });

    // Mark workspace as dissolved
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: WorkspaceStatus.DISSOLVED,
        dissolvedAt: new Date(),
      },
    });

    // Log dissolution for audit purposes
    console.log(`Workspace ${workspaceId} dissolved at ${new Date().toISOString()}`);
  }

  /**
   * Notify team members about workspace wind-down
   */
  private async notifyTeamMembersOfWindDown(workspaceId: string): Promise<void> {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        workspaceId,
        status: 'ACTIVE',
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
          include: {
            event: {
              select: {
                name: true,
                endDate: true,
              },
            },
          },
        },
      },
    });

    // In a production system, this would send actual notifications
    // For now, we'll log the notification intent
    for (const member of teamMembers) {
      console.log(`Wind-down notification for ${member.user.email}:`, {
        workspaceId,
        eventName: member.workspace.event.name,
        eventEndDate: member.workspace.event.endDate,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Reassign pending tasks when a team member leaves early
   */
  private async reassignPendingTasks(workspaceId: string, departingUserId: string, managerId: string): Promise<void> {
    // Find the departing member's team member record
    const departingMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId: departingUserId,
      },
    });

    if (!departingMember) {
      return;
    }

    // Find their pending tasks
    const pendingTasks = await prisma.workspaceTask.findMany({
      where: {
        workspaceId,
        assigneeId: departingMember.id,
        status: {
          notIn: ['COMPLETED'],
        },
      },
    });

    // Find the manager's team member record for reassignment
    const managerMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId: managerId,
        status: 'ACTIVE',
      },
    });

    if (!managerMember) {
      throw new Error('Manager not found in workspace');
    }

    // Reassign tasks to the manager
    for (const task of pendingTasks) {
      await prisma.workspaceTask.update({
        where: { id: task.id },
        data: {
          assigneeId: managerMember.id,
          // Add a note about the reassignment
          description: `${task.description}\n\n[REASSIGNED: Originally assigned to departing team member, reassigned to ${managerId}]`,
        },
      });
    }

    console.log(`Reassigned ${pendingTasks.length} tasks from departing member ${departingUserId} to manager ${managerId}`);
  }

  /**
   * Map database workspace to response format
   */
  private mapWorkspaceToResponse(workspace: any): WorkspaceResponse {
    return {
      id: workspace.id,
      eventId: workspace.eventId,
      name: workspace.name,
      description: workspace.description,
      status: workspace.status,
      settings: workspace.settings as WorkspaceSettings,
      templateId: workspace.templateId,
      event: workspace.event ? {
        id: workspace.event.id,
        name: workspace.event.name,
        startDate: workspace.event.startDate,
        endDate: workspace.event.endDate,
        status: workspace.event.status,
      } : undefined,
      teamMembers: workspace.teamMembers?.map((member: any) => ({
        id: member.id,
        userId: member.userId,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        user: member.user,
      })) || [],
      taskSummary: workspace.tasks ? {
        total: workspace.tasks.length,
        completed: workspace.tasks.filter((t: any) => t.status === 'COMPLETED').length,
        inProgress: workspace.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        overdue: workspace.tasks.filter((t: any) => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
        ).length,
      } : undefined,
      channels: workspace.channels?.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        description: channel.description,
        isPrivate: channel.isPrivate,
      })) || [],
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      dissolvedAt: workspace.dissolvedAt,
    };
  }
}

export const workspaceService = new WorkspaceService();