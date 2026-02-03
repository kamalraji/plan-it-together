import { WorkspaceTemplateService } from '../workspace-template.service';
import { WorkspaceRole, TaskCategory, TaskPriority } from '@prisma/client';

// Mock the prisma import
const mockPrisma = {
  teamMember: {
    findFirst: jest.fn(),
  },
  workspace: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  event: {
    findUnique: jest.fn(),
  },
  workspaceChannel: {
    create: jest.fn(),
  },
  workspaceTask: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
  organizationAdmin: {
    findFirst: jest.fn(),
  },
} as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  WorkspaceRole: {
    WORKSPACE_OWNER: 'WORKSPACE_OWNER',
    TEAM_LEAD: 'TEAM_LEAD',
    EVENT_COORDINATOR: 'EVENT_COORDINATOR',
    VOLUNTEER_MANAGER: 'VOLUNTEER_MANAGER',
    TECHNICAL_SPECIALIST: 'TECHNICAL_SPECIALIST',
    MARKETING_LEAD: 'MARKETING_LEAD',
    GENERAL_VOLUNTEER: 'GENERAL_VOLUNTEER',
  },
  TaskCategory: {
    SETUP: 'SETUP',
    MARKETING: 'MARKETING',
    LOGISTICS: 'LOGISTICS',
    TECHNICAL: 'TECHNICAL',
    REGISTRATION: 'REGISTRATION',
    POST_EVENT: 'POST_EVENT',
  },
  TaskPriority: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
  },
}));

describe('WorkspaceTemplateService', () => {
  let service: WorkspaceTemplateService;

  beforeEach(() => {
    service = new WorkspaceTemplateService();
    jest.clearAllMocks();
  });

  describe('createTemplateFromWorkspace', () => {
    it('should create template from successful workspace', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';
      const templateData = {
        name: 'Conference Template',
        description: 'Template for conference events',
        category: 'CONFERENCE',
        complexity: 'MODERATE' as const,
        isPublic: true,
        tags: ['conference', 'networking'],
      };

      // Mock permission verification
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
        role: WorkspaceRole.WORKSPACE_OWNER,
        status: 'ACTIVE',
        permissions: ['MANAGE_WORKSPACE'],
      });

      // Mock workspace data
      const mockWorkspace = {
        id: workspaceId,
        event: {
          id: 'event-1',
          name: 'Test Conference',
          organizationId: 'org-1',
          capacity: 200,
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-02'),
        },
        teamMembers: [
          {
            id: 'member-1',
            role: WorkspaceRole.WORKSPACE_OWNER,
            status: 'ACTIVE',
            user: { name: 'John Doe' },
          },
          {
            id: 'member-2',
            role: WorkspaceRole.TEAM_LEAD,
            status: 'ACTIVE',
            user: { name: 'Jane Smith' },
          },
        ],
        tasks: [
          {
            id: 'task-1',
            title: 'Setup venue',
            description: 'Arrange venue logistics',
            category: TaskCategory.LOGISTICS,
            priority: TaskPriority.HIGH,
            createdAt: new Date('2024-02-01'),
            completedAt: new Date('2024-02-28'),
            dependencies: [],
            assigneeId: 'member-1',
          },
          {
            id: 'task-2',
            title: 'Marketing campaign',
            description: 'Launch marketing activities',
            category: TaskCategory.MARKETING,
            priority: TaskPriority.MEDIUM,
            createdAt: new Date('2024-01-15'),
            completedAt: new Date('2024-02-15'),
            dependencies: [],
            assigneeId: 'member-2',
          },
        ],
        channels: [
          {
            id: 'channel-1',
            name: 'general',
            type: 'GENERAL',
            description: 'General discussions',
            isPrivate: false,
          },
          {
            id: 'channel-2',
            name: 'announcements',
            type: 'ANNOUNCEMENT',
            description: 'Important announcements',
            isPrivate: false,
          },
        ],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.createTemplateFromWorkspace(workspaceId, userId, templateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(result.description).toBe(templateData.description);
      expect(result.category).toBe(templateData.category);
      expect(result.complexity).toBe(templateData.complexity);
      expect(result.structure).toBeDefined();
      expect(result.structure.roles).toHaveLength(2);
      expect(result.structure.taskCategories).toBeDefined();
      expect(result.structure.channels).toHaveLength(2);
    });

    it('should throw error for unauthorized user', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';
      const templateData = {
        name: 'Test Template',
        description: 'Test description',
        category: 'GENERAL',
        complexity: 'SIMPLE' as const,
        isPublic: false,
        tags: [],
      };

      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await expect(service.createTemplateFromWorkspace(workspaceId, userId, templateData))
        .rejects.toThrow('Access denied: User is not a member of this workspace');
    });

    it('should throw error for non-existent workspace', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';
      const templateData = {
        name: 'Test Template',
        description: 'Test description',
        category: 'GENERAL',
        complexity: 'SIMPLE' as const,
        isPublic: false,
        tags: [],
      };

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
        role: WorkspaceRole.WORKSPACE_OWNER,
        status: 'ACTIVE',
        permissions: ['MANAGE_WORKSPACE'],
      });

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.createTemplateFromWorkspace(workspaceId, userId, templateData))
        .rejects.toThrow('Workspace not found');
    });
  });

  describe('getTemplateRecommendations', () => {
    it('should return template recommendations for event', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';

      const mockEvent = {
        id: eventId,
        name: 'Test Conference',
        capacity: 150,
        organizationId: 'org-1',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-02'),
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

      // Mock the private methods
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Conference Template',
          category: 'CONFERENCE',
          eventSizeRange: { min: 100, max: 300 },
          complexity: 'MODERATE',
          effectiveness: { completionRate: 85 },
          metadata: { organizationId: 'org-1', isPublic: true },
        },
        {
          id: 'template-2',
          name: 'General Template',
          category: 'GENERAL',
          eventSizeRange: { min: 50, max: 500 },
          complexity: 'SIMPLE',
          effectiveness: { completionRate: 70 },
          metadata: { organizationId: null, isPublic: true },
        },
      ];

      // Mock private method calls
      jest.spyOn(service as any, 'getAvailableTemplates').mockResolvedValue(mockTemplates);
      jest.spyOn(service as any, 'calculateTemplateMatch').mockImplementation((_event: any, template: any) => ({
        template,
        matchScore: template.id === 'template-1' ? 85 : 60,
        matchReasons: ['Good match'],
        customizationSuggestions: [],
      }));

      const result = await service.getTemplateRecommendations(eventId, userId);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1]?.matchScore || 0);
    });

    it('should throw error for non-existent event', async () => {
      const eventId = 'event-1';
      const userId = 'user-1';

      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.getTemplateRecommendations(eventId, userId))
        .rejects.toThrow('Event not found');
    });
  });

  describe('applyTemplateToWorkspace', () => {
    it('should apply template to workspace successfully', async () => {
      const workspaceId = 'workspace-1';
      const templateId = 'template-1';
      const userId = 'user-1';

      // Mock permission verification
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
        role: WorkspaceRole.WORKSPACE_OWNER,
        status: 'ACTIVE',
        permissions: ['MANAGE_WORKSPACE'],
      });

      // Mock workspace
      const mockWorkspace = {
        id: workspaceId,
        event: {
          id: 'event-1',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-02'),
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      // Mock template
      const mockTemplate = {
        id: templateId,
        name: 'Test Template',
        structure: {
          channels: [
            {
              name: 'general',
              type: 'GENERAL',
              description: 'General discussions',
              isPrivate: false,
            },
          ],
          taskCategories: [
            {
              category: TaskCategory.SETUP,
              tasks: [
                {
                  title: 'Initial setup',
                  description: 'Setup workspace',
                  priority: TaskPriority.HIGH,
                  daysBeforeEvent: 14,
                  dependencies: [],
                },
              ],
            },
          ],
        },
      };

      jest.spyOn(service as any, 'getTemplate').mockResolvedValue(mockTemplate);
      jest.spyOn(service as any, 'trackTemplateUsage').mockResolvedValue(undefined);

      mockPrisma.workspaceChannel.create.mockResolvedValue({});
      mockPrisma.workspaceTask.create.mockResolvedValue({});
      mockPrisma.workspace.update.mockResolvedValue({});

      await service.applyTemplateToWorkspace(workspaceId, templateId, userId);

      expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
        where: { id: workspaceId },
        data: { templateId },
      });
    });

    it('should apply template with customizations', async () => {
      const workspaceId = 'workspace-1';
      const templateId = 'template-1';
      const userId = 'user-1';
      const customizations = {
        templateId,
        eventSpecificChanges: {
          addTasks: [
            {
              title: 'Custom task',
              description: 'Custom task description',
              category: TaskCategory.TECHNICAL,
              priority: TaskPriority.MEDIUM,
              dueDate: new Date('2024-02-15'),
            },
          ],
          addChannels: [
            {
              name: 'custom-channel',
              type: 'TASK_SPECIFIC' as const,
              description: 'Custom channel',
            },
          ],
        },
      };

      // Mock permission verification
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
        role: WorkspaceRole.WORKSPACE_OWNER,
        status: 'ACTIVE',
        permissions: ['MANAGE_WORKSPACE'],
      });

      // Mock workspace
      const mockWorkspace = {
        id: workspaceId,
        event: {
          id: 'event-1',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-02'),
        },
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      // Mock template
      const mockTemplate = {
        id: templateId,
        name: 'Test Template',
        structure: {
          channels: [],
          taskCategories: [],
        },
      };

      jest.spyOn(service as any, 'getTemplate').mockResolvedValue(mockTemplate);
      jest.spyOn(service as any, 'trackTemplateUsage').mockResolvedValue(undefined);

      mockPrisma.workspaceChannel.create.mockResolvedValue({});
      mockPrisma.workspaceTask.create.mockResolvedValue({});
      mockPrisma.workspace.update.mockResolvedValue({});

      await service.applyTemplateToWorkspace(workspaceId, templateId, userId, customizations);

      // Verify custom tasks and channels were created
      expect(mockPrisma.workspaceTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId,
          title: 'Custom task',
          description: 'Custom task description',
          category: TaskCategory.TECHNICAL,
          priority: TaskPriority.MEDIUM,
          dueDate: new Date('2024-02-15'),
          tags: ['custom-added'],
          metadata: { customization: true },
        }),
      });

      expect(mockPrisma.workspaceChannel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId,
          name: 'custom-channel',
          type: 'TASK_SPECIFIC',
          description: 'Custom channel',
        }),
      });
    });
  });

  describe('trackTemplateEffectiveness', () => {
    it('should calculate template effectiveness metrics', async () => {
      const templateId = 'template-1';

      const mockWorkspaces = [
        {
          id: 'workspace-1',
          templateId,
          createdAt: new Date('2024-01-01'),
          dissolvedAt: new Date('2024-03-01'),
          status: 'DISSOLVED',
          event: { status: 'COMPLETED' },
          tasks: [
            { id: 'task-1', status: 'COMPLETED' },
            { id: 'task-2', status: 'COMPLETED' },
            { id: 'task-3', status: 'IN_PROGRESS' },
          ],
          teamMembers: [
            { id: 'member-1', status: 'ACTIVE' },
            { id: 'member-2', status: 'ACTIVE' },
          ],
        },
        {
          id: 'workspace-2',
          templateId,
          createdAt: new Date('2024-02-01'),
          dissolvedAt: null,
          status: 'ACTIVE',
          event: { status: 'ONGOING' },
          tasks: [
            { id: 'task-4', status: 'COMPLETED' },
            { id: 'task-5', status: 'IN_PROGRESS' },
          ],
          teamMembers: [
            { id: 'member-3', status: 'ACTIVE' },
          ],
        },
      ];

      mockPrisma.workspace.findMany.mockResolvedValue(mockWorkspaces);

      // Mock private method
      jest.spyOn(service as any, 'identifyCommonBottlenecks').mockResolvedValue([
        {
          issue: 'High rate of overdue tasks',
          frequency: 25,
          impact: 'MEDIUM',
        },
      ]);

      const result = await service.trackTemplateEffectiveness(templateId);

      expect(result).toBeDefined();
      expect(result.templateId).toBe(templateId);
      expect(result.usageStats.totalUsages).toBe(2);
      expect(result.usageStats.successfulCompletions).toBe(1);
      expect(result.usageStats.completionRate).toBe(50);
      expect(result.performanceMetrics.averageTaskCompletionRate).toBeGreaterThan(0);
      expect(result.improvementSuggestions).toBeDefined();
    });

    it('should throw error for template with no usage data', async () => {
      const templateId = 'template-1';

      mockPrisma.workspace.findMany.mockResolvedValue([]);

      await expect(service.trackTemplateEffectiveness(templateId))
        .rejects.toThrow('No usage data available for this template');
    });
  });

  describe('shareTemplateWithOrganization', () => {
    it('should share template with organization successfully', async () => {
      const templateId = 'template-1';
      const organizationId = 'org-1';
      const userId = 'user-1';

      mockPrisma.organizationAdmin.findFirst.mockResolvedValue({
        id: 'admin-1',
        organizationId,
        userId,
        role: 'ADMIN',
      });

      // Mock console.log to verify the sharing action
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.shareTemplateWithOrganization(templateId, organizationId, userId);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Template ${templateId} shared with organization ${organizationId}`)
      );

      consoleSpy.mockRestore();
    });

    it('should throw error for non-admin user', async () => {
      const templateId = 'template-1';
      const organizationId = 'org-1';
      const userId = 'user-1';

      mockPrisma.organizationAdmin.findFirst.mockResolvedValue(null);

      await expect(service.shareTemplateWithOrganization(templateId, organizationId, userId))
        .rejects.toThrow('Access denied: User is not an admin of this organization');
    });
  });

  describe('template matching', () => {
    it('should calculate high match score for similar events', () => {
      const mockEvent = {
        capacity: 150,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-02'),
        organizationId: 'org-1',
      };

      const mockTemplate = {
        id: 'template-1',
        category: 'CONFERENCE',
        eventSizeRange: { min: 100, max: 200 },
        complexity: 'MODERATE',
        effectiveness: { completionRate: 85 },
        metadata: { organizationId: 'org-1', isPublic: true },
      };

      // Access private method
      const result = (service as any).calculateTemplateMatch(mockEvent, mockTemplate);

      expect(result.matchScore).toBeGreaterThan(70);
      expect(result.matchReasons).toContain('Event size matches template range');
      expect(result.matchReasons).toContain('Template from same organization');
    });

    it('should calculate lower match score for different event sizes', () => {
      const mockEvent = {
        capacity: 50, // Much smaller than template range
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-02'),
        organizationId: 'org-2', // Different organization
      };

      const mockTemplate = {
        id: 'template-1',
        category: 'CONFERENCE',
        eventSizeRange: { min: 200, max: 500 },
        complexity: 'COMPLEX',
        effectiveness: { completionRate: 60 },
        metadata: { organizationId: 'org-1', isPublic: true },
      };

      // Access private method
      const result = (service as any).calculateTemplateMatch(mockEvent, mockTemplate);

      expect(result.matchScore).toBeLessThan(50);
      expect(result.customizationSuggestions).toContain('Consider reducing team size and task complexity');
    });
  });
});