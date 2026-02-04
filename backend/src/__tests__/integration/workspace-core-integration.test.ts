import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, WorkspaceStatus, WorkspaceRole, TaskStatus } from '@prisma/client';
import { workspaceService } from '../../services/workspace.service';
import { workspaceTemplateService } from '../../services/workspace-template.service';

const prisma = new PrismaClient();

describe('Workspace Core Integration Tests', () => {
  let testOrganizerId: string;
  let testEventId: string;
  let testWorkspaceId: string;
  let testTeamMemberId: string;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.workspaceTask.deleteMany({});
    await prisma.workspaceChannel.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.workspace.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test users
    const organizerUser = await createTestUser('organizer@test.com', 'ORGANIZER');
    await createTestUser('member@test.com', 'PARTICIPANT');
    
    testOrganizerId = organizerUser.id;

    // Create test event
    const event = await createTestEvent(testOrganizerId);
    testEventId = event.id;
  });

  describe('Workspace Provisioning Integration', () => {
    it('should provision workspace when event is created', async () => {
      // Test workspace provisioning
      const workspace = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);

      expect(workspace).toBeTruthy();
      expect(workspace.eventId).toBe(testEventId);
      expect(workspace.status).toBe(WorkspaceStatus.ACTIVE);
      expect(workspace.teamMembers).toHaveLength(1);
      expect(workspace.teamMembers[0].role).toBe(WorkspaceRole.WORKSPACE_OWNER);
      expect(workspace.teamMembers[0].userId).toBe(testOrganizerId);

      testWorkspaceId = workspace.id;

      // Verify workspace has default channels
      expect(workspace.channels).toHaveLength(3);
      const channelNames = workspace.channels.map(c => c.name);
      expect(channelNames).toContain('general');
      expect(channelNames).toContain('announcements');
      expect(channelNames).toContain('tasks');
    });

    it('should prevent duplicate workspace provisioning for same event', async () => {
      // First provisioning should succeed
      const workspace1 = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);
      expect(workspace1).toBeTruthy();

      // Second provisioning should fail
      await expect(
        workspaceService.provisionWorkspace(testEventId, testOrganizerId)
      ).rejects.toThrow('already exists');
    });

    it('should integrate workspace with existing user management', async () => {
      // Provision workspace
      const workspace = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);
      testWorkspaceId = workspace.id;

      // Verify organizer is automatically added as workspace owner
      const dbWorkspace = await prisma.workspace.findUnique({
        where: { id: testWorkspaceId },
        include: {
          teamMembers: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(dbWorkspace).toBeTruthy();
      expect(dbWorkspace!.teamMembers).toHaveLength(1);
      expect(dbWorkspace!.teamMembers[0].userId).toBe(testOrganizerId);
      expect(dbWorkspace!.teamMembers[0].role).toBe(WorkspaceRole.WORKSPACE_OWNER);
      expect(dbWorkspace!.teamMembers[0].status).toBe('ACTIVE');
    });
  });

  describe('Team Member Integration', () => {
    beforeEach(async () => {
      // Provision workspace for team tests
      const workspace = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);
      testWorkspaceId = workspace.id;
    });

    it('should integrate team member management with user system', async () => {
      // Add team member directly to database (simulating invitation acceptance)
      const teamMemberUser = await prisma.user.findFirst({ 
        where: { email: 'member@test.com' } 
      });
      
      const teamMember = await prisma.teamMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: teamMemberUser!.id,
          role: WorkspaceRole.EVENT_COORDINATOR,
          invitedBy: testOrganizerId,
          permissions: ['CREATE_TASKS', 'MANAGE_TASKS'],
          status: 'ACTIVE',
        },
      });

      testTeamMemberId = teamMember.id;

      // Verify team member was added to workspace
      const workspace = await workspaceService.getWorkspace(testWorkspaceId, testOrganizerId);
      expect(workspace.teamMembers).toHaveLength(2);
      
      const newMember = workspace.teamMembers.find(
        m => m.role === WorkspaceRole.EVENT_COORDINATOR
      );
      expect(newMember).toBeTruthy();
      expect(newMember!.status).toBe('ACTIVE');
      expect(newMember!.userId).toBe(teamMemberUser!.id);
    });

    it('should enforce role-based access control', async () => {
      // Add team member with limited permissions
      const teamMemberUser = await prisma.user.findFirst({ 
        where: { email: 'member@test.com' } 
      });

      await prisma.teamMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: teamMemberUser!.id,
          role: WorkspaceRole.GENERAL_VOLUNTEER,
          invitedBy: testOrganizerId,
          permissions: ['VIEW_TASKS', 'UPDATE_TASK_PROGRESS'],
          status: 'ACTIVE',
        },
      });

      // Team member should be able to view workspace
      const workspace = await workspaceService.getWorkspace(testWorkspaceId, teamMemberUser!.id);
      expect(workspace).toBeTruthy();

      // Team member should NOT be able to update workspace settings (would throw error)
      await expect(
        workspaceService.updateWorkspace(testWorkspaceId, teamMemberUser!.id, {
          name: 'Updated Workspace Name',
        })
      ).rejects.toThrow('Access denied');
    });
  });

  describe('Task Integration with Event Timeline', () => {
    beforeEach(async () => {
      // Provision workspace and add team member
      const workspace = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);
      testWorkspaceId = workspace.id;

      const teamMemberUser = await prisma.user.findFirst({ 
        where: { email: 'member@test.com' } 
      });

      const teamMember = await prisma.teamMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: teamMemberUser!.id,
          role: WorkspaceRole.EVENT_COORDINATOR,
          invitedBy: testOrganizerId,
          permissions: ['CREATE_TASKS', 'MANAGE_TASKS'],
          status: 'ACTIVE',
        },
      });

      testTeamMemberId = teamMember.id;
    });

    it('should create tasks with proper workspace association', async () => {
      // Create task directly in database
      const task = await prisma.workspaceTask.create({
        data: {
          workspaceId: testWorkspaceId,
          title: 'Setup Venue',
          description: 'Prepare venue for the event',
          assigneeId: testTeamMemberId,
          category: 'LOGISTICS',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          creatorId: testOrganizerId,
        },
      });

      expect(task).toBeTruthy();
      expect(task.workspaceId).toBe(testWorkspaceId);
      expect(task.assigneeId).toBe(testTeamMemberId);

      // Verify task appears in workspace
      const workspace = await workspaceService.getWorkspace(testWorkspaceId, testOrganizerId);
      expect(workspace.taskSummary?.total).toBe(1);
      expect(workspace.taskSummary?.inProgress).toBe(0); // Task starts as NOT_STARTED
    });

    it('should handle event changes and workspace synchronization', async () => {
      // Create task
      await prisma.workspaceTask.create({
        data: {
          workspaceId: testWorkspaceId,
          title: 'Marketing Campaign',
          description: 'Launch marketing campaign',
          assigneeId: testTeamMemberId,
          category: 'MARKETING',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          creatorId: testOrganizerId,
        },
      });

      // Update event details
      await prisma.event.update({
        where: { id: testEventId },
        data: {
          name: 'Updated Event Name',
          description: 'Updated event description',
        },
      });

      // Verify workspace reflects event changes
      const workspace = await workspaceService.getWorkspace(testWorkspaceId, testOrganizerId);
      expect(workspace.event?.name).toBe('Updated Event Name');
      // Note: event description might not be included in workspace response
    });
  });

  describe('Workspace Lifecycle Management', () => {
    beforeEach(async () => {
      // Provision workspace
      const workspace = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);
      testWorkspaceId = workspace.id;
    });

    it('should handle workspace dissolution after event completion', async () => {
      // Mark event as completed
      await prisma.event.update({
        where: { id: testEventId },
        data: {
          status: 'COMPLETED',
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        },
      });

      // Initiate workspace dissolution
      await workspaceService.dissolveWorkspace(testWorkspaceId, testOrganizerId, 7);

      // Verify workspace status changed to winding down
      const workspace = await prisma.workspace.findUnique({
        where: { id: testWorkspaceId },
      });

      expect(workspace!.status).toBe(WorkspaceStatus.WINDING_DOWN);
    });

    it('should get comprehensive workspace status', async () => {
      const status = await workspaceService.getWorkspaceStatus(testWorkspaceId, testOrganizerId);

      expect(status).toBeTruthy();
      expect(status.workspace).toBeTruthy();
      expect(status.lifecycle).toBeTruthy();
      expect(status.lifecycle.status).toBe(WorkspaceStatus.ACTIVE);
      expect(status.lifecycle.canTransitionTo).toContain(WorkspaceStatus.WINDING_DOWN);
      expect(status.lifecycle.retentionPeriodDays).toBe(30); // Default retention
    });
  });

  describe('Template System Integration', () => {
    beforeEach(async () => {
      // Provision workspace
      const workspace = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);
      testWorkspaceId = workspace.id;
    });

    it('should create template from workspace structure', async () => {
      // Add some tasks and team members to make workspace "successful"
      const teamMemberUser = await prisma.user.findFirst({ 
        where: { email: 'member@test.com' } 
      });

      await prisma.teamMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: teamMemberUser!.id,
          role: WorkspaceRole.EVENT_COORDINATOR,
          invitedBy: testOrganizerId,
          permissions: ['CREATE_TASKS', 'MANAGE_TASKS'],
          status: 'ACTIVE',
        },
      });

      await prisma.workspaceTask.create({
        data: {
          workspaceId: testWorkspaceId,
          title: 'Setup Venue',
          description: 'Prepare venue for event',
          category: 'LOGISTICS',
          priority: 'HIGH',
          status: TaskStatus.COMPLETED,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          creatorId: testOrganizerId,
        },
      });

      // Create template from workspace
      const template = await workspaceTemplateService.createTemplateFromWorkspace(
        testWorkspaceId,
        testOrganizerId,
        {
          name: 'Conference Template',
          description: 'Template for conference events',
          category: 'CONFERENCE',
          complexity: 'MODERATE',
          isPublic: false,
          tags: ['conference', 'professional'],
        }
      );

      expect(template).toBeTruthy();
      expect(template.name).toBe('Conference Template');
      expect(template.category).toBe('CONFERENCE');
      expect(template.structure.roles).toHaveLength(2); // Owner + Coordinator
      expect(template.structure.taskCategories).toHaveLength(1); // LOGISTICS
    });

    it('should get template recommendations for events', async () => {
      // This test would require existing templates in the database
      // For now, we'll test that the method doesn't throw errors
      const recommendations = await workspaceTemplateService.getTemplateRecommendations(
        testEventId,
        testOrganizerId
      );

      expect(Array.isArray(recommendations)).toBe(true);
      // Empty array is expected since no templates exist yet
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle workspace provisioning failures gracefully', async () => {
      // Try to provision workspace for non-existent event
      await expect(
        workspaceService.provisionWorkspace('non-existent-event-id', testOrganizerId)
      ).rejects.toThrow('Event not found');
    });

    it('should handle unauthorized access attempts', async () => {
      // Provision workspace
      const workspace = await workspaceService.provisionWorkspace(testEventId, testOrganizerId);
      testWorkspaceId = workspace.id;

      // Try to access workspace with different user
      const otherUser = await createTestUser('other@test.com', 'PARTICIPANT');
      
      await expect(
        workspaceService.getWorkspace(testWorkspaceId, otherUser.id)
      ).rejects.toThrow('Access denied');
    });

    it('should handle workspace not found scenarios', async () => {
      await expect(
        workspaceService.getWorkspace('non-existent-workspace-id', testOrganizerId)
      ).rejects.toThrow('Workspace not found');
    });
  });

  // Helper functions
  async function createTestUser(email: string, role: string) {
    return await prisma.user.create({
      data: {
        email,
        passwordHash: 'hashed_password',
        name: 'Test User',
        role: role as any,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }

  async function createTestEvent(organizerId: string, name: string = 'Test Event') {
    return await prisma.event.create({
      data: {
        name,
        description: 'Test event description',
        mode: 'OFFLINE',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        organizerId,
        branding: {},
        landingPageUrl: `test-event-${Date.now()}`,
        status: 'PUBLISHED',
      },
    });
  }
});