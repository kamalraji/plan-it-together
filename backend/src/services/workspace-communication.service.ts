import { PrismaClient, ChannelType, WorkspaceRole } from '@prisma/client';
import { 
  CreateChannelDTO, 
  ChannelResponse, 
  SendMessageDTO, 
  MessageResponse, 
  BroadcastMessageDTO,
  ChannelMessageHistory,
  MediaFile
} from '../types';

const prisma = new PrismaClient();

export class WorkspaceCommunicationService {
  /**
   * Create a new communication channel organized by topic/function
   */
  async createChannel(
    workspaceId: string,
    creatorId: string,
    channelData: CreateChannelDTO
  ): Promise<ChannelResponse> {
    // Verify creator has permission to manage channels
    await this.verifyChannelPermission(workspaceId, creatorId, 'MANAGE_CHANNELS');

    // Check if channel name already exists in workspace
    const existingChannel = await prisma.workspaceChannel.findFirst({
      where: {
        workspaceId,
        name: channelData.name.toLowerCase(),
      },
    });

    if (existingChannel) {
      throw new Error('Channel with this name already exists');
    }

    // Auto-populate members for role-based channels
    let channelMembers = channelData.members || [];
    if (channelData.type === ChannelType.ROLE_BASED && channelData.name.includes('-team')) {
      const roleFromName = this.extractRoleFromChannelName(channelData.name);
      if (roleFromName) {
        const roleMembers = await this.getRoleMemberIds(workspaceId, roleFromName);
        channelMembers = [...new Set([...channelMembers, ...roleMembers])];
      }
    }

    const channel = await prisma.workspaceChannel.create({
      data: {
        workspaceId,
        name: channelData.name.toLowerCase(),
        type: channelData.type,
        description: channelData.description,
        members: channelMembers,
        isPrivate: channelData.isPrivate || false,
      },
    });

    return this.mapChannelToResponse(channel);
  }

  /**
   * Get channels for workspace
   */
  async getWorkspaceChannels(workspaceId: string, userId: string): Promise<ChannelResponse[]> {
    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(workspaceId, userId);

    const channels = await prisma.workspaceChannel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          { 
            isPrivate: true,
            members: {
              has: userId,
            },
          },
        ],
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return channels.map(channel => this.mapChannelToResponse(channel));
  }

  /**
   * Get channel by ID
   */
  async getChannel(channelId: string, userId: string): Promise<ChannelResponse> {
    const channel = await prisma.workspaceChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(channel.workspaceId, userId);

    // Check if user has access to private channel
    if (channel.isPrivate && !channel.members.includes(userId)) {
      throw new Error('Access denied: User is not a member of this private channel');
    }

    return this.mapChannelToResponse(channel);
  }

  /**
   * Send message to channel with priority messaging support
   */
  async sendMessage(
    channelId: string,
    senderId: string,
    messageData: SendMessageDTO & { isPriority?: boolean }
  ): Promise<MessageResponse> {
    const channel = await prisma.workspaceChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Verify sender has access to workspace
    await this.verifyWorkspaceAccess(channel.workspaceId, senderId);

    // Check if sender has access to private channel
    if (channel.isPrivate && !channel.members.includes(senderId)) {
      throw new Error('Access denied: User is not a member of this private channel');
    }

    // Create message in database
    const message = await prisma.workspaceMessage.create({
      data: {
        channelId,
        senderId,
        content: messageData.content,
        attachments: (messageData.attachments || []) as any,
        isPriority: messageData.isPriority || false,
      },
    });

    const messageResponse: MessageResponse = {
      id: message.id,
      channelId: message.channelId,
      senderId: message.senderId,
      content: message.content,
      attachments: (message.attachments as any as MediaFile[]) || [],
      sentAt: message.sentAt,
      editedAt: message.editedAt || undefined,
    };

    // Send notifications to channel members with priority handling
    await this.notifyChannelMembers(channel, messageResponse, senderId, messageData.isPriority);

    return messageResponse;
  }

  /**
   * Send broadcast message to all team members or specific role groups
   */
  async sendBroadcastMessage(
    workspaceId: string,
    senderId: string,
    broadcastData: BroadcastMessageDTO & { isPriority?: boolean }
  ): Promise<MessageResponse[]> {
    // Verify sender has permission to send broadcasts
    await this.verifyChannelPermission(workspaceId, senderId, 'SEND_BROADCASTS');

    const results: MessageResponse[] = [];

    if (broadcastData.targetType === 'ALL_MEMBERS') {
      // Send to general announcement channel
      const announcementChannel = await this.getOrCreateAnnouncementChannel(workspaceId);
      const message = await this.sendMessage(announcementChannel.id, senderId, {
        content: broadcastData.content,
        attachments: broadcastData.attachments,
        isPriority: broadcastData.isPriority,
      });
      results.push(message);
    } else if (broadcastData.targetType === 'ROLE_SPECIFIC' && broadcastData.targetRoles) {
      // Send to each specified role's channel
      for (const role of broadcastData.targetRoles) {
        const roleChannel = await this.getOrCreateRoleChannel(workspaceId, role);
        const message = await this.sendMessage(roleChannel.id, senderId, {
          content: broadcastData.content,
          attachments: broadcastData.attachments,
          isPriority: broadcastData.isPriority,
        });
        results.push(message);
      }
    }

    return results;
  }

  /**
   * Get message history and search capabilities within workspace context
   */
  async getChannelMessages(
    channelId: string,
    userId: string,
    limit: number = 50,
    before?: Date
  ): Promise<ChannelMessageHistory> {
    const channel = await prisma.workspaceChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Verify user has access to workspace and channel
    await this.verifyWorkspaceAccess(channel.workspaceId, userId);

    if (channel.isPrivate && !channel.members.includes(userId)) {
      throw new Error('Access denied: User is not a member of this private channel');
    }

    // Query messages from database
    const whereClause: any = {
      channelId,
      deletedAt: null,
    };

    if (before) {
      whereClause.sentAt = { lt: before };
    }

    const messages = await prisma.workspaceMessage.findMany({
      where: whereClause,
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const messageResponses: MessageResponse[] = messages.map((msg: any) => ({
      id: msg.id,
      channelId: msg.channelId,
      senderId: msg.senderId,
      content: msg.content,
      attachments: (msg.attachments as any as MediaFile[]) || [],
      sentAt: msg.sentAt,
      editedAt: msg.editedAt || undefined,
    }));

    return {
      channelId,
      messages: messageResponses.reverse(), // Return in chronological order
      hasMore: messages.length === limit,
    };
  }

  /**
   * Add member to private channel
   */
  async addChannelMember(
    channelId: string,
    _userId: string,
    memberId: string,
    requesterId: string
  ): Promise<void> {
    const channel = await prisma.workspaceChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Verify requester has permission to manage channels
    await this.verifyChannelPermission(channel.workspaceId, requesterId, 'MANAGE_CHANNELS');

    // Verify member is part of workspace
    await this.verifyWorkspaceAccess(channel.workspaceId, memberId);

    // Add member to channel
    const updatedMembers = [...new Set([...channel.members, memberId])];
    
    await prisma.workspaceChannel.update({
      where: { id: channelId },
      data: { members: updatedMembers },
    });
  }

  /**
   * Remove member from private channel
   */
  async removeChannelMember(
    channelId: string,
    memberId: string,
    requesterId: string
  ): Promise<void> {
    const channel = await prisma.workspaceChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Channel not found');
    }

    // Verify requester has permission to manage channels
    await this.verifyChannelPermission(channel.workspaceId, requesterId, 'MANAGE_CHANNELS');

    // Remove member from channel
    const updatedMembers = channel.members.filter(id => id !== memberId);
    
    await prisma.workspaceChannel.update({
      where: { id: channelId },
      data: { members: updatedMembers },
    });
  }

  /**
   * Search messages in workspace with full-text search capabilities
   */
  async searchMessages(
    workspaceId: string,
    userId: string,
    query: string,
    channelId?: string
  ): Promise<MessageResponse[]> {
    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(workspaceId, userId);

    // Get user's accessible channels
    const accessibleChannels = await this.getUserAccessibleChannels(workspaceId, userId);
    const channelIds = accessibleChannels.map(ch => ch.id);

    // Build search query
    const whereClause: any = {
      channel: {
        workspaceId,
        id: { in: channelIds },
      },
      deletedAt: null,
      content: {
        contains: query,
        mode: 'insensitive',
      },
    };

    // Filter by specific channel if provided
    if (channelId && channelIds.includes(channelId)) {
      whereClause.channelId = channelId;
    }

    const messages = await prisma.workspaceMessage.findMany({
      where: whereClause,
      orderBy: { sentAt: 'desc' },
      take: 100, // Limit search results
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      channelId: msg.channelId,
      senderId: msg.senderId,
      content: msg.content,
      attachments: (msg.attachments as any as MediaFile[]) || [],
      sentAt: msg.sentAt,
      editedAt: msg.editedAt || undefined,
    }));
  }

  /**
   * Verify user has channel permission
   */
  private async verifyChannelPermission(
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
   * Get user's accessible channels in workspace
   */
  private async getUserAccessibleChannels(workspaceId: string, userId: string): Promise<any[]> {
    return await prisma.workspaceChannel.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          { 
            isPrivate: true,
            members: {
              has: userId,
            },
          },
        ],
      },
    });
  }

  /**
   * Extract role from channel name (e.g., "marketing-team" -> "MARKETING_LEAD")
   */
  private extractRoleFromChannelName(channelName: string): WorkspaceRole | null {
    const roleMap: Record<string, WorkspaceRole> = {
      'marketing-team': WorkspaceRole.MARKETING_LEAD,
      'technical-team': WorkspaceRole.TECHNICAL_SPECIALIST,
      'volunteer-team': WorkspaceRole.VOLUNTEER_MANAGER,
      'coordinator-team': WorkspaceRole.EVENT_COORDINATOR,
      'lead-team': WorkspaceRole.TEAM_LEAD,
    };

    return roleMap[channelName] || null;
  }

  /**
   * Get member IDs for a specific role
   */
  private async getRoleMemberIds(workspaceId: string, role: WorkspaceRole): Promise<string[]> {
    const members = await prisma.teamMember.findMany({
      where: {
        workspaceId,
        role,
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    return members.map(member => member.userId);
  }

  /**
   * Get or create announcement channel
   */
  private async getOrCreateAnnouncementChannel(workspaceId: string): Promise<ChannelResponse> {
    let channel = await prisma.workspaceChannel.findFirst({
      where: {
        workspaceId,
        type: ChannelType.ANNOUNCEMENT,
        name: 'announcements',
      },
    });

    if (!channel) {
      channel = await prisma.workspaceChannel.create({
        data: {
          workspaceId,
          name: 'announcements',
          type: ChannelType.ANNOUNCEMENT,
          description: 'Important announcements and updates',
          isPrivate: false,
        },
      });
    }

    return this.mapChannelToResponse(channel);
  }

  /**
   * Get or create role-based channel with automatic member population
   */
  private async getOrCreateRoleChannel(workspaceId: string, role: string): Promise<ChannelResponse> {
    const channelName = `${role.toLowerCase().replace('_', '-')}-team`;
    
    let channel = await prisma.workspaceChannel.findFirst({
      where: {
        workspaceId,
        name: channelName,
      },
    });

    if (!channel) {
      // Get members with this role
      const roleMembers = await this.getRoleMemberIds(workspaceId, role as WorkspaceRole);
      
      channel = await prisma.workspaceChannel.create({
        data: {
          workspaceId,
          name: channelName,
          type: ChannelType.ROLE_BASED,
          description: `Communication channel for ${role} team members`,
          isPrivate: true,
          members: roleMembers,
        },
      });
    }

    return this.mapChannelToResponse(channel);
  }

  /**
   * Create task-specific communication channel
   */
  async createTaskChannel(
    workspaceId: string,
    taskId: string,
    taskTitle: string,
    _creatorId: string
  ): Promise<ChannelResponse> {
    const channelName = `task-${taskId.slice(-8)}`;
    
    const channel = await prisma.workspaceChannel.create({
      data: {
        workspaceId,
        name: channelName,
        type: ChannelType.TASK_SPECIFIC,
        description: `Discussion channel for task: ${taskTitle}`,
        isPrivate: false,
        members: [],
      },
    });

    return this.mapChannelToResponse(channel);
  }

  /**
   * Initialize default workspace channels
   */
  async initializeDefaultChannels(workspaceId: string): Promise<ChannelResponse[]> {
    const defaultChannels = [
      {
        name: 'general',
        type: ChannelType.GENERAL,
        description: 'General workspace discussions',
        isPrivate: false,
      },
      {
        name: 'announcements',
        type: ChannelType.ANNOUNCEMENT,
        description: 'Important announcements and updates',
        isPrivate: false,
      },
    ];

    const createdChannels: ChannelResponse[] = [];

    for (const channelData of defaultChannels) {
      const existingChannel = await prisma.workspaceChannel.findFirst({
        where: {
          workspaceId,
          name: channelData.name,
        },
      });

      if (!existingChannel) {
        const channel = await prisma.workspaceChannel.create({
          data: {
            workspaceId,
            ...channelData,
          },
        });
        createdChannels.push(this.mapChannelToResponse(channel));
      }
    }

    return createdChannels;
  }

  /**
   * Send task-related message with automatic task integration
   */
  async sendTaskMessage(
    taskId: string,
    senderId: string,
    messageData: SendMessageDTO & { taskUpdate?: boolean }
  ): Promise<MessageResponse> {
    // Get task details
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
      include: {
        workspace: true,
        assignee: {
          include: { user: true },
        },
        creator: {
          include: { user: true },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Get or create task-specific channel
    const channelName = `task-${taskId.slice(-8)}`;
    let channel = await prisma.workspaceChannel.findFirst({
      where: {
        workspaceId: task.workspaceId,
        name: channelName,
      },
    });

    if (!channel) {
      const newChannel = await this.createTaskChannel(
        task.workspaceId,
        taskId,
        task.title,
        senderId
      );
      
      // Get the actual channel record for further operations
      channel = await prisma.workspaceChannel.findUnique({
        where: { id: newChannel.id },
      });
      
      if (!channel) {
        throw new Error('Failed to create task channel');
      }
    }

    // Add task participants to channel if not already members
    const taskParticipants = [task.creatorId, task.assigneeId].filter((id): id is string => id !== null);
    const updatedMembers = [...new Set([...channel.members, ...taskParticipants])];
    
    if (updatedMembers.length > channel.members.length) {
      await prisma.workspaceChannel.update({
        where: { id: channel.id },
        data: { members: updatedMembers },
      });
    }

    // Send message with task context
    const enhancedContent = messageData.taskUpdate 
      ? `**Task Update**: ${messageData.content}`
      : messageData.content;

    return await this.sendMessage(channel.id, senderId, {
      ...messageData,
      content: enhancedContent,
    });
  }

  /**
   * Get task-related messages
   */
  async getTaskMessages(
    taskId: string,
    userId: string,
    limit: number = 50
  ): Promise<ChannelMessageHistory> {
    const task = await prisma.workspaceTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(task.workspaceId, userId);

    const channelName = `task-${taskId.slice(-8)}`;
    const channel = await prisma.workspaceChannel.findFirst({
      where: {
        workspaceId: task.workspaceId,
        name: channelName,
      },
    });

    if (!channel) {
      return {
        channelId: '',
        messages: [],
        hasMore: false,
      };
    }

    return await this.getChannelMessages(channel.id, userId, limit);
  }

  /**
   * Notify channel members of new message with priority handling
   */
  private async notifyChannelMembers(
    channel: any,
    message: MessageResponse,
    senderId: string,
    isPriority: boolean = false
  ): Promise<void> {
    // Get all channel members (excluding sender)
    let notificationTargets: string[] = [];

    if (channel.isPrivate) {
      notificationTargets = channel.members.filter((memberId: string) => memberId !== senderId);
    } else {
      // For public channels, notify all workspace members
      const workspaceMembers = await prisma.teamMember.findMany({
        where: {
          workspaceId: channel.workspaceId,
          status: 'ACTIVE',
        },
        select: { userId: true },
      });
      notificationTargets = workspaceMembers
        .map(member => member.userId)
        .filter(userId => userId !== senderId);
    }

    // In a real implementation, this would integrate with notification service
    // For now, we'll log the notification details
    const notificationType = isPriority ? 'PRIORITY_MESSAGE' : 'CHANNEL_MESSAGE';
    console.log(`${notificationType} in channel ${channel.name}: ${message.content}`);
    console.log(`Notifying ${notificationTargets.length} members:`, notificationTargets);

    // TODO: Integrate with actual notification service
    // - Send push notifications for mobile users
    // - Send email notifications based on user preferences
    // - Send immediate notifications for priority messages
    // - Queue regular notifications for batch processing
  }

  /**
   * Get default permissions for a role
   */
  private getDefaultPermissions(role: any): string[] {
    const permissions: Record<string, string[]> = {
      WORKSPACE_OWNER: [
        'MANAGE_CHANNELS',
        'SEND_BROADCASTS',
        'MANAGE_MESSAGES',
      ],
      TEAM_LEAD: [
        'MANAGE_CHANNELS',
        'SEND_BROADCASTS',
      ],
      EVENT_COORDINATOR: [
        'SEND_BROADCASTS',
      ],
      VOLUNTEER_MANAGER: [
        'SEND_BROADCASTS',
      ],
      TECHNICAL_SPECIALIST: [],
      MARKETING_LEAD: [
        'MANAGE_CHANNELS',
      ],
      GENERAL_VOLUNTEER: [],
    };

    return permissions[role] || [];
  }

  /**
   * Map channel to response format
   */
  private mapChannelToResponse(channel: any): ChannelResponse {
    return {
      id: channel.id,
      workspaceId: channel.workspaceId,
      name: channel.name,
      type: channel.type,
      description: channel.description,
      members: channel.members,
      isPrivate: channel.isPrivate,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}

export const workspaceCommunicationService = new WorkspaceCommunicationService();