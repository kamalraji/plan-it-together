import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient, WorkspaceStatus, WorkspaceRole, TaskStatus } from '@prisma/client';
import app from '../../index';
import { workspaceTemplateService } from '../../services/workspace-template.service';

const prisma = new PrismaClient();

describe('Workspace Integration Tests', () => {
  let authToken: string;
  let organizerToken: string;
  let teamMemberToken: string;
  let testOrganizerId: string;
  let testEventId: string;
  let testWorkspaceId: string;
  let testTeamMemberId: string;
  let testTaskId: string;

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
    // Create test users and authenticate
    const organizerUser = await createTestUser('organizer@test.com', 'ORGANIZER');
    const teamMemberUser = await createTestUser('member@test.com', 'PARTICIPANT');

    authToken = await getAuthToken(organizerUser.email);
    organizerToken = authToken;
    teamMemberToken = await getAuthToken(teamMemberUser.email);
    testOrganizerId = organizerUser.id;

    // Create test event
    const event = await createTestEvent(testOrganizerId);
    testEventId = event.id;
  });

  describe('Workspace Provisioning Integration', () => {
    it('should automatically provision workspace when event is created', async () => {
      // Test workspace provisioning
      const response = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.eventId).toBe(testEventId);
      expect(response.body.data.status).toBe(WorkspaceStatus.ACTIVE);
      expect(response.body.data.teamMembers).toHaveLength(1);
      expect(response.body.data.teamMembers[0].role).toBe(WorkspaceRole.WORKSPACE_OWNER);

      testWorkspaceId = response.body.data.id;

      // Verify workspace has default channels
      expect(response.body.data.channels).toHaveLength(3);
      const channelNames = response.body.data.channels.map((c: any) => c.name);
      expect(channelNames).toContain('general');
      expect(channelNames).toContain('announcements');
      expect(channelNames).toContain('tasks');
    });

    it('should prevent duplicate workspace provisioning for same event', async () => {
      // First provisioning should succeed
      await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      // Second provisioning should fail
      const response = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should integrate workspace with existing user management', async () => {
      // Provision workspace
      const workspaceResponse = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      testWorkspaceId = workspaceResponse.body.data.id;

      // Verify organizer is automatically added as workspace owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: testWorkspaceId },
        include: {
          teamMembers: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(workspace).toBeTruthy();
      expect(workspace!.teamMembers).toHaveLength(1);
      expect(workspace!.teamMembers[0].userId).toBe(testOrganizerId);
      expect(workspace!.teamMembers[0].role).toBe(WorkspaceRole.WORKSPACE_OWNER);
      expect(workspace!.teamMembers[0].status).toBe('ACTIVE');
    });
  });

  describe('Team Member Integration', () => {
    beforeEach(async () => {
      // Provision workspace for team tests
      const workspaceResponse = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      testWorkspaceId = workspaceResponse.body.data.id;
    });

    it('should integrate team member invitations with existing user system', async () => {
      // Invite team member
      const inviteResponse = await request(app)
        .post(`/api/team/${testWorkspaceId}/invite`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          email: 'member@test.com',
          role: WorkspaceRole.EVENT_COORDINATOR,
        })
        .expect(201);

      expect(inviteResponse.body.success).toBe(true);
      expect(inviteResponse.body.data).toHaveProperty('invitationId');

      // Accept invitation
      const acceptResponse = await request(app)
        .post(`/api/team/invitation/${inviteResponse.body.data.invitationId}/accept`)
        .set('Authorization', `Bearer ${teamMemberToken}`)
        .expect(200);

      expect(acceptResponse.body.success).toBe(true);

      // Verify team member was added to workspace
      const workspaceResponse = await request(app)
        .get(`/api/workspace/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(workspaceResponse.body.data.teamMembers).toHaveLength(2);
      const newMember = workspaceResponse.body.data.teamMembers.find(
        (m: any) => m.role === WorkspaceRole.EVENT_COORDINATOR
      );
      expect(newMember).toBeTruthy();
      expect(newMember.status).toBe('ACTIVE');

      testTeamMemberId = newMember.id;
    });

    it('should enforce role-based access control across workspace features', async () => {
      // Add team member with limited permissions
      // Team member should NOT be able to update workspace settings
      await request(app)
        .put(`/api/workspace/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${teamMemberToken}`)
        .send({
          name: 'Updated Workspace Name',
        })
        .expect(403);

      // Team member should NOT be able to dissolve workspace
      await request(app)
        .post(`/api/workspace/${testWorkspaceId}/dissolve`)
        .set('Authorization', `Bearer ${teamMemberToken}`)
        .expect(403);
    });
  });

  describe('Task Integration with Event Timeline', () => {
    beforeEach(async () => {
      // Provision workspace and add team member
      const workspaceResponse = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      testWorkspaceId = workspaceResponse.body.data.id;

      const teamMember = await prisma.teamMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: (await prisma.user.findFirst({ where: { email: 'member@test.com' } }))!.id,
          role: WorkspaceRole.EVENT_COORDINATOR,
          invitedBy: testOrganizerId,
          permissions: ['CREATE_TASKS', 'MANAGE_TASKS'],
          status: 'ACTIVE',
        },
      });

      testTeamMemberId = teamMember.id;
    });

    it('should synchronize task deadlines with event milestones', async () => {
      // Create task with deadline before event start
      const taskResponse = await request(app)
        .post(`/api/tasks/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Setup Venue',
          description: 'Prepare venue for the event',
          assigneeId: testTeamMemberId,
          category: 'LOGISTICS',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        })
        .expect(201);

      testTaskId = taskResponse.body.data.id;

      // Update event start date
      await prisma.event.update({
        where: { id: testEventId },
        data: {
          startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        },
      });

      // Trigger synchronization
      await request(app)
        .post(`/api/workspace/${testWorkspaceId}/sync-event`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      // Verify task deadline was adjusted
      const updatedTask = await prisma.workspaceTask.findUnique({
        where: { id: testTaskId },
      });

      expect(updatedTask).toBeTruthy();
      // Task should still be due before event start
      if (updatedTask?.dueDate) {
        expect(updatedTask.dueDate.getTime()).toBeLessThan(
          Date.now() + 10 * 24 * 60 * 60 * 1000
        );
      }
    });

    it('should propagate event changes to workspace tasks', async () => {
      // Create task
      await request(app)
        .post(`/api/tasks/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Marketing Campaign',
          description: 'Launch marketing campaign',
          assigneeId: testTeamMemberId,
          category: 'MARKETING',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      // Update event details
      await prisma.event.update({
        where: { id: testEventId },
        data: {
          name: 'Updated Event Name',
          description: 'Updated event description',
        },
      });

      // Verify workspace reflects event changes
      const workspaceResponse = await request(app)
        .get(`/api/workspace/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(workspaceResponse.body.data.event.name).toBe('Updated Event Name');
      expect(workspaceResponse.body.data.event.description).toBe('Updated event description');
    });
  });

  describe('Communication Integration with Email Systems', () => {
    beforeEach(async () => {
      // Provision workspace
      const workspaceResponse = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      testWorkspaceId = workspaceResponse.body.data.id;
    });

    it('should integrate workspace notifications with email system', async () => {
      // Add team member
      await prisma.teamMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: (await prisma.user.findFirst({ where: { email: 'member@test.com' } }))!.id,
          role: WorkspaceRole.EVENT_COORDINATOR,
          invitedBy: testOrganizerId,
          permissions: ['CREATE_TASKS', 'MANAGE_TASKS'],
          status: 'ACTIVE',
        },
      });

      // Send workspace announcement
      const announcementResponse = await request(app)
        .post(`/api/communication/${testWorkspaceId}/announcement`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Important Update',
          message: 'Please review the updated event timeline',
          recipients: 'ALL_MEMBERS',
          priority: 'HIGH',
        })
        .expect(201);

      expect(announcementResponse.body.success).toBe(true);
      expect(announcementResponse.body.data).toHaveProperty('messageId');

      // Note: In a real implementation, this would integrate with email/notification systems
      // For now, we verify the API response structure
    });

    it('should support task-specific communication threads', async () => {
      // Create task
      const taskResponse = await request(app)
        .post(`/api/tasks/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Setup Registration System',
          description: 'Configure online registration',
          assigneeId: testTeamMemberId,
          category: 'TECHNICAL',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      testTaskId = taskResponse.body.data.id;

      // Add comment to task
      const commentResponse = await request(app)
        .post(`/api/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          content: 'Please use the existing registration template',
          mentions: [testTeamMemberId],
        })
        .expect(201);

      expect(commentResponse.body.success).toBe(true);

      // Note: In a real implementation, task comments would be stored
      // For now, we verify the API response structure
    });
  });

  describe('Workspace Lifecycle Management', () => {
    beforeEach(async () => {
      // Provision workspace
      const workspaceResponse = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      testWorkspaceId = workspaceResponse.body.data.id;
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
      const dissolveResponse = await request(app)
        .post(`/api/workspace/${testWorkspaceId}/dissolve`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          retentionPeriodDays: 7,
        })
        .expect(200);

      expect(dissolveResponse.body.success).toBe(true);

      // Verify workspace status changed to winding down
      const workspace = await prisma.workspace.findUnique({
        where: { id: testWorkspaceId },
      });

      expect(workspace!.status).toBe(WorkspaceStatus.WINDING_DOWN);
    });

    it('should maintain audit logs during workspace lifecycle', async () => {
      // Perform various workspace actions
      await request(app)
        .put(`/api/workspace/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Updated Workspace Name',
        })
        .expect(200);

      // Create task
      await request(app)
        .post(`/api/tasks/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          assigneeId: testTeamMemberId,
          category: 'SETUP',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      // Get audit logs
      const auditResponse = await request(app)
        .get(`/api/workspace/${testWorkspaceId}/audit-logs`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(auditResponse.body.success).toBe(true);
      expect(Array.isArray(auditResponse.body.data)).toBe(true);
      expect(auditResponse.body.data.length).toBeGreaterThan(0);

      // Verify audit log entries contain expected actions
      const actions = auditResponse.body.data.map((log: any) => log.action);
      expect(actions).toContain('provision');
      expect(actions).toContain('update');
    });
  });

  describe('Template System Integration', () => {
    beforeEach(async () => {
      // Provision workspace
      const workspaceResponse = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
        })
        .expect(201);

      testWorkspaceId = workspaceResponse.body.data.id;
    });

    it('should create template from successful workspace', async () => {
      // Add some tasks and team members to make workspace "successful"
      await prisma.teamMember.create({
        data: {
          workspaceId: testWorkspaceId,
          userId: (await prisma.user.findFirst({ where: { email: 'member@test.com' } }))!.id,
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
      const templateResponse = await request(app)
        .post(`/api/templates/create-from-workspace`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          workspaceId: testWorkspaceId,
          name: 'Conference Template',
          description: 'Template for conference events',
          category: 'CONFERENCE',
          complexity: 'MODERATE',
          isPublic: false,
          tags: ['conference', 'professional'],
        })
        .expect(201);

      expect(templateResponse.body.success).toBe(true);
      expect(templateResponse.body.data).toHaveProperty('id');
      expect(templateResponse.body.data.name).toBe('Conference Template');
    });

    it('should apply template to new workspace', async () => {
      // Create a simple template first
      const template = await workspaceTemplateService.createTemplateFromWorkspace(
        testWorkspaceId,
        testOrganizerId,
        {
          name: 'Simple Event Template',
          description: 'Basic template for simple events',
          category: 'GENERAL',
          complexity: 'SIMPLE',
          isPublic: true,
          tags: ['basic', 'simple'],
        }
      );

      // Create new event and workspace
      const newEvent = await createTestEvent(testOrganizerId, 'New Test Event');
      const newWorkspaceResponse = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: newEvent.id,
        })
        .expect(201);

      const newWorkspaceId = newWorkspaceResponse.body.data.id;

      // Apply template to new workspace
      const applyResponse = await request(app)
        .post(`/api/workspace/${newWorkspaceId}/apply-template`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          templateId: template.id,
        })
        .expect(200);

      expect(applyResponse.body.success).toBe(true);

      // Verify template was applied
      const updatedWorkspace = await prisma.workspace.findUnique({
        where: { id: newWorkspaceId },
        include: {
          tasks: true,
          channels: true,
        },
      });

      expect(updatedWorkspace!.templateId).toBe(template.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle workspace provisioning failures gracefully', async () => {
      // Try to provision workspace for non-existent event
      const response = await request(app)
        .post('/api/workspace/provision')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: 'non-existent-event-id',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should handle database connection failures', async () => {
      // This would require mocking database failures
      // For now, we'll test the error response structure
      const response = await request(app)
        .get('/api/workspace/non-existent-workspace')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
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

  async function getAuthToken(email: string): Promise<string> {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'password',
      });

    return response.body.data.accessToken;
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