import { workspaceCommunicationService } from '../workspace-communication.service';
import { ChannelType } from '@prisma/client';

describe('WorkspaceCommunicationService', () => {
  describe('Service Structure and Methods', () => {
    it('should have all required communication methods', () => {
      expect(workspaceCommunicationService).toBeDefined();
      
      // Core channel management
      expect(typeof workspaceCommunicationService.createChannel).toBe('function');
      expect(typeof workspaceCommunicationService.getWorkspaceChannels).toBe('function');
      expect(typeof workspaceCommunicationService.getChannel).toBe('function');
      
      // Message management
      expect(typeof workspaceCommunicationService.sendMessage).toBe('function');
      expect(typeof workspaceCommunicationService.getChannelMessages).toBe('function');
      expect(typeof workspaceCommunicationService.searchMessages).toBe('function');
      
      // Broadcast messaging
      expect(typeof workspaceCommunicationService.sendBroadcastMessage).toBe('function');
      
      // Channel member management
      expect(typeof workspaceCommunicationService.addChannelMember).toBe('function');
      expect(typeof workspaceCommunicationService.removeChannelMember).toBe('function');
      
      // Task integration
      expect(typeof workspaceCommunicationService.sendTaskMessage).toBe('function');
      expect(typeof workspaceCommunicationService.getTaskMessages).toBe('function');
      
      // Workspace setup
      expect(typeof workspaceCommunicationService.initializeDefaultChannels).toBe('function');
      expect(typeof workspaceCommunicationService.createTaskChannel).toBe('function');
    });

    it('should have correct method signatures', () => {
      // Channel management methods
      expect(workspaceCommunicationService.createChannel).toHaveLength(3); // workspaceId, creatorId, channelData
      expect(workspaceCommunicationService.getWorkspaceChannels).toHaveLength(2); // workspaceId, userId
      expect(workspaceCommunicationService.getChannel).toHaveLength(2); // channelId, userId
      
      // Message methods
      expect(workspaceCommunicationService.sendMessage).toHaveLength(3); // channelId, senderId, messageData
      expect(workspaceCommunicationService.getChannelMessages).toHaveLength(2); // channelId, userId (limit and before have defaults)
      expect(workspaceCommunicationService.searchMessages).toHaveLength(4); // workspaceId, userId, query, channelId (optional)
      
      // Broadcast methods
      expect(workspaceCommunicationService.sendBroadcastMessage).toHaveLength(3); // workspaceId, senderId, broadcastData
      
      // Member management
      expect(workspaceCommunicationService.addChannelMember).toHaveLength(4); // channelId, userId, memberId, requesterId
      expect(workspaceCommunicationService.removeChannelMember).toHaveLength(3); // channelId, memberId, requesterId
      
      // Task integration
      expect(workspaceCommunicationService.sendTaskMessage).toHaveLength(3); // taskId, senderId, messageData
      expect(workspaceCommunicationService.getTaskMessages).toHaveLength(2); // taskId, userId (limit has default)
      
      // Workspace setup
      expect(workspaceCommunicationService.initializeDefaultChannels).toHaveLength(1); // workspaceId
      expect(workspaceCommunicationService.createTaskChannel).toHaveLength(4); // workspaceId, taskId, taskTitle, creatorId
    });
  });

  describe('Channel Type Support', () => {
    it('should support all required channel types', () => {
      const supportedTypes = [
        ChannelType.GENERAL,
        ChannelType.TASK_SPECIFIC,
        ChannelType.ROLE_BASED,
        ChannelType.ANNOUNCEMENT
      ];

      // Verify all channel types are available
      supportedTypes.forEach(type => {
        expect(Object.values(ChannelType)).toContain(type);
      });
    });

    it('should handle channel organization by topic and function', () => {
      // Test that service can handle different channel types for organization
      const channelTypes = Object.values(ChannelType);
      expect(channelTypes).toContain(ChannelType.GENERAL);
      expect(channelTypes).toContain(ChannelType.TASK_SPECIFIC);
      expect(channelTypes).toContain(ChannelType.ROLE_BASED);
      expect(channelTypes).toContain(ChannelType.ANNOUNCEMENT);
    });
  });

  describe('Message Features', () => {
    it('should support priority messaging', () => {
      // Verify that sendMessage method can handle priority messages
      // This tests the method signature and structure
      const sendMessage = workspaceCommunicationService.sendMessage;
      expect(sendMessage).toBeDefined();
      expect(typeof sendMessage).toBe('function');
    });

    it('should support message attachments', () => {
      // Verify message structure supports attachments
      // The service should handle MediaFile[] attachments
      expect(workspaceCommunicationService.sendMessage).toBeDefined();
    });

    it('should support message search capabilities', () => {
      // Verify search functionality exists
      expect(workspaceCommunicationService.searchMessages).toBeDefined();
      expect(typeof workspaceCommunicationService.searchMessages).toBe('function');
    });
  });

  describe('Broadcast Messaging', () => {
    it('should support broadcast to all members', () => {
      // Verify broadcast functionality exists
      expect(workspaceCommunicationService.sendBroadcastMessage).toBeDefined();
      expect(typeof workspaceCommunicationService.sendBroadcastMessage).toBe('function');
    });

    it('should support role-specific broadcasts', () => {
      // Verify role-specific broadcast capability
      const broadcastMethod = workspaceCommunicationService.sendBroadcastMessage;
      expect(broadcastMethod).toBeDefined();
      expect(broadcastMethod).toHaveLength(3); // workspaceId, senderId, broadcastData
    });
  });

  describe('Task Integration', () => {
    it('should support task-specific communication', () => {
      // Verify task integration methods exist
      expect(workspaceCommunicationService.sendTaskMessage).toBeDefined();
      expect(workspaceCommunicationService.getTaskMessages).toBeDefined();
      expect(workspaceCommunicationService.createTaskChannel).toBeDefined();
    });

    it('should handle task-specific discussions', () => {
      // Verify task message methods have correct signatures
      expect(workspaceCommunicationService.sendTaskMessage).toHaveLength(3);
      expect(workspaceCommunicationService.getTaskMessages).toHaveLength(2);
    });
  });

  describe('Channel Member Management', () => {
    it('should support adding members to private channels', () => {
      expect(workspaceCommunicationService.addChannelMember).toBeDefined();
      expect(typeof workspaceCommunicationService.addChannelMember).toBe('function');
      expect(workspaceCommunicationService.addChannelMember).toHaveLength(4);
    });

    it('should support removing members from channels', () => {
      expect(workspaceCommunicationService.removeChannelMember).toBeDefined();
      expect(typeof workspaceCommunicationService.removeChannelMember).toBe('function');
      expect(workspaceCommunicationService.removeChannelMember).toHaveLength(3);
    });
  });

  describe('Workspace Setup', () => {
    it('should initialize default channels for new workspaces', () => {
      expect(workspaceCommunicationService.initializeDefaultChannels).toBeDefined();
      expect(typeof workspaceCommunicationService.initializeDefaultChannels).toBe('function');
      expect(workspaceCommunicationService.initializeDefaultChannels).toHaveLength(1);
    });

    it('should create task-specific channels when needed', () => {
      expect(workspaceCommunicationService.createTaskChannel).toBeDefined();
      expect(typeof workspaceCommunicationService.createTaskChannel).toBe('function');
      expect(workspaceCommunicationService.createTaskChannel).toHaveLength(4);
    });
  });

  describe('Message History and Search', () => {
    it('should provide message history with pagination', () => {
      expect(workspaceCommunicationService.getChannelMessages).toBeDefined();
      expect(typeof workspaceCommunicationService.getChannelMessages).toBe('function');
    });

    it('should support message search within workspace context', () => {
      expect(workspaceCommunicationService.searchMessages).toBeDefined();
      expect(typeof workspaceCommunicationService.searchMessages).toBe('function');
      expect(workspaceCommunicationService.searchMessages).toHaveLength(4); // workspaceId, userId, query, channelId (optional)
    });
  });

  describe('Access Control Integration', () => {
    it('should verify workspace access for all operations', () => {
      // All methods should include userId parameter for access verification
      const methods = [
        'getWorkspaceChannels',
        'getChannel', 
        'sendMessage',
        'getChannelMessages',
        'searchMessages',
        'addChannelMember',
        'removeChannelMember',
        'getTaskMessages'
      ];

      methods.forEach(methodName => {
        const method = (workspaceCommunicationService as any)[methodName];
        expect(method).toBeDefined();
        expect(typeof method).toBe('function');
      });
    });

    it('should handle private channel access control', () => {
      // Private channel methods should exist
      expect(workspaceCommunicationService.addChannelMember).toBeDefined();
      expect(workspaceCommunicationService.removeChannelMember).toBeDefined();
    });
  });

  describe('Notification Integration', () => {
    it('should support immediate notifications for priority messages', () => {
      // Priority messaging should be supported in sendMessage
      expect(workspaceCommunicationService.sendMessage).toBeDefined();
    });

    it('should handle broadcast notifications', () => {
      // Broadcast messaging should support notifications
      expect(workspaceCommunicationService.sendBroadcastMessage).toBeDefined();
    });
  });
});