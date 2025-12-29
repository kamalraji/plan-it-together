import { workspaceService } from '../workspace.service';
import { teamService } from '../team.service';
import { taskService } from '../task.service';
import { workspaceCommunicationService } from '../workspace-communication.service';

describe('Workspace Services', () => {
  describe('Service Imports and Structure', () => {
    it('should import WorkspaceService correctly', () => {
      expect(workspaceService).toBeDefined();
      expect(typeof workspaceService.provisionWorkspace).toBe('function');
      expect(typeof workspaceService.getWorkspace).toBe('function');
      expect(typeof workspaceService.getWorkspaceByEventId).toBe('function');
      expect(typeof workspaceService.updateWorkspace).toBe('function');
      expect(typeof workspaceService.dissolveWorkspace).toBe('function');
      expect(typeof workspaceService.getWorkspaceAnalytics).toBe('function');
    });

    it('should import TeamService correctly', () => {
      expect(teamService).toBeDefined();
      expect(typeof teamService.inviteTeamMember).toBe('function');
      expect(typeof teamService.acceptInvitation).toBe('function');
      expect(typeof teamService.bulkInviteTeamMembers).toBe('function');
      expect(typeof teamService.getTeamMembers).toBe('function');
      expect(typeof teamService.updateTeamMemberRole).toBe('function');
      expect(typeof teamService.removeTeamMember).toBe('function');
      expect(typeof teamService.getTeamMemberByUserId).toBe('function');
    });

    it('should import TaskService correctly', () => {
      expect(taskService).toBeDefined();
      expect(typeof taskService.createTask).toBe('function');
      expect(typeof taskService.getTask).toBe('function');
      expect(typeof taskService.getWorkspaceTasks).toBe('function');
      expect(typeof taskService.updateTask).toBe('function');
      expect(typeof taskService.assignTask).toBe('function');
      expect(typeof taskService.updateTaskProgress).toBe('function');
      expect(typeof taskService.deleteTask).toBe('function');
      expect(typeof taskService.getTaskDependencies).toBe('function');
    });

    it('should import WorkspaceCommunicationService correctly', () => {
      expect(workspaceCommunicationService).toBeDefined();
      expect(typeof workspaceCommunicationService.createChannel).toBe('function');
      expect(typeof workspaceCommunicationService.getWorkspaceChannels).toBe('function');
      expect(typeof workspaceCommunicationService.getChannel).toBe('function');
      expect(typeof workspaceCommunicationService.sendMessage).toBe('function');
      expect(typeof workspaceCommunicationService.sendBroadcastMessage).toBe('function');
      expect(typeof workspaceCommunicationService.getChannelMessages).toBe('function');
      expect(typeof workspaceCommunicationService.addChannelMember).toBe('function');
      expect(typeof workspaceCommunicationService.removeChannelMember).toBe('function');
      expect(typeof workspaceCommunicationService.searchMessages).toBe('function');
    });
  });

  describe('Service Method Signatures', () => {
    it('should have correct method signatures for WorkspaceService', () => {
      // Test that methods exist and can be called (without database)
      expect(() => {
        // These should not throw errors for method signature validation
        const service = workspaceService;
        expect(service.provisionWorkspace).toHaveLength(2); // eventId, organizerId
        expect(service.getWorkspace).toHaveLength(2); // workspaceId, userId
        expect(service.updateWorkspace).toHaveLength(3); // workspaceId, userId, updates
      }).not.toThrow();
    });

    it('should have correct method signatures for TeamService', () => {
      expect(() => {
        const service = teamService;
        expect(service.inviteTeamMember).toHaveLength(3); // workspaceId, inviterId, invitation
        expect(service.getTeamMembers).toHaveLength(2); // workspaceId, userId
        expect(service.updateTeamMemberRole).toHaveLength(4); // workspaceId, teamMemberId, newRole, updaterId
      }).not.toThrow();
    });

    it('should have correct method signatures for TaskService', () => {
      expect(() => {
        const service = taskService;
        expect(service.createTask).toHaveLength(3); // workspaceId, creatorId, taskData
        expect(service.getTask).toHaveLength(2); // taskId, userId
        expect(service.updateTask).toHaveLength(3); // taskId, userId, updates
      }).not.toThrow();
    });

    it('should have correct method signatures for WorkspaceCommunicationService', () => {
      expect(() => {
        const service = workspaceCommunicationService;
        expect(service.createChannel).toHaveLength(3); // workspaceId, creatorId, channelData
        expect(service.sendMessage).toHaveLength(3); // channelId, senderId, messageData
        expect(service.getChannelMessages).toHaveLength(2); // channelId, userId (limit and before have defaults)
      }).not.toThrow();
    });
  });
});