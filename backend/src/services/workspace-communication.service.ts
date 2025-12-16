import { PrismaClient, ChannelType } from '@prisma/client';
import { 
  CreateChannelDTO, 
  ChannelResponse, 
  SendMessageDTO, 
  MessageResponse, 
  BroadcastMessageDTO,
  ChannelMessageHistory 
} from '../types';

const prisma = new PrismaClient();

export class WorkspaceCommunicationService {
  /**
   * Create a new communication channel
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

    const channel = await prisma.workspaceChannel.create({
      data: {
        workspaceId,
        name: channelData.name.toLowerCase(),
        type: channelData.type,
        description: channelData.description,
        members: channelData.members || [],
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
   * Send message to channel
   */
  async sendMessage(
    channelId: string,
    senderId: string,
    messageData: SendMessageDTO
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

    // For now, we'll store messages in a simple format
    // In a full implementation, you'd have a separate Message table
    const message: MessageResponse = {
      id: this.generateMessageId(),
      channelId,
      senderId,
      content: messageData.content,
      attachments: messageData.attachments || [],
      sentAt: new Date(),
      editedAt: undefined,
    };

    // Store message (in a real implementation, this would be in a messages table)
    await this.storeMessage(message);

    // Send notifications to channel members
    await this.notifyChannelMembers(channel, message, senderId);

    return message;
  }

  /**
   * Send broadcast message to workspace
   */
  async sendBroadcastMessage(
    workspaceId: string,
    senderId: string,
    broadcastData: BroadcastMessageDTO
  ): Promise<MessageResponse[]> {
    // Verify sender has permission to send broadcasts
    await this.verifyChannelPermission(workspaceId, senderId, 'SEND_BROADCASTS');

    const results: MessageResponse[] = [];

    // Get target recipients based on broadcast type
    await this.getBroadcastRecipients(workspaceId, broadcastData);

    // Send message to appropriate channels or create direct messages
    if (broadcastData.targetType === 'ALL_MEMBERS') {
      // Send to general announcement channel
      const announcementChannel = await this.getOrCreateAnnouncementChannel(workspaceId);
      const message = await this.sendMessage(announcementChannel.id, senderId, {
        content: broadcastData.content,
        attachments: broadcastData.attachments,
      });
      results.push(message);
    } else if (broadcastData.targetType === 'ROLE_SPECIFIC') {
      // Send to role-based channel or create one
      const roleChannel = await this.getOrCreateRoleChannel(workspaceId, broadcastData.targetRoles![0]);
      const message = await this.sendMessage(roleChannel.id, senderId, {
        content: broadcastData.content,
        attachments: broadcastData.attachments,
      });
      results.push(message);
    }

    return results;
  }

  /**
   * Get message history for channel
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

    // In a real implementation, this would query a messages table
    // For now, return mock data structure
    const messages = await this.getStoredMessages(channelId, limit, before);

    return {
      channelId,
      messages,
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
   * Search messages in workspace
   */
  async searchMessages(
    workspaceId: string,
    userId: string,
    _query: string,
    _channelId?: string
  ): Promise<MessageResponse[]> {
    // Verify user has access to workspace
    await this.verifyWorkspaceAccess(workspaceId, userId);

    // In a real implementation, this would search a messages table with full-text search
    // For now, return empty array as placeholder
    return [];
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
   * Get broadcast recipients based on criteria
   */
  private async getBroadcastRecipients(
    workspaceId: string,
    broadcastData: BroadcastMessageDTO
  ): Promise<string[]> {
    let whereClause: any = { workspaceId, status: 'ACTIVE' };

    if (broadcastData.targetType === 'ROLE_SPECIFIC' && broadcastData.targetRoles) {
      whereClause.role = { in: broadcastData.targetRoles };
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: whereClause,
      select: { userId: true },
    });

    return teamMembers.map(member => member.userId);
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
   * Get or create role-based channel
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
      channel = await prisma.workspaceChannel.create({
        data: {
          workspaceId,
          name: channelName,
          type: ChannelType.ROLE_BASED,
          description: `Communication channel for ${role} team members`,
          isPrivate: true,
        },
      });
    }

    return this.mapChannelToResponse(channel);
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store message (placeholder implementation)
   */
  private async storeMessage(message: MessageResponse): Promise<void> {
    // In a real implementation, this would store in a messages table
    console.log(`Storing message: ${message.content}`);
  }

  /**
   * Get stored messages (placeholder implementation)
   */
  private async getStoredMessages(
    _channelId: string,
    _limit: number,
    _before?: Date
  ): Promise<MessageResponse[]> {
    // In a real implementation, this would query a messages table
    return [];
  }

  /**
   * Notify channel members of new message
   */
  private async notifyChannelMembers(
    channel: any,
    message: MessageResponse,
    _senderId: string
  ): Promise<void> {
    // In a real implementation, this would send push notifications, emails, etc.
    console.log(`New message in channel ${channel.name}: ${message.content}`);
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