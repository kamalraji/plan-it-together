import { WorkspaceEventSyncService } from '../workspace-event-sync.service';
import { TaskStatus, TaskPriority } from '@prisma/client';

// Mock the prisma import
const mockPrisma = {
  teamMember: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  workspace: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  workspaceTask: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
} as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  TaskStatus: {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW_REQUIRED: 'REVIEW_REQUIRED',
    COMPLETED: 'COMPLETED',
    BLOCKED: 'BLOCKED',
  },
  TaskPriority: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
  },
  EventStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

describe('WorkspaceEventSyncService', () => {
  let service: WorkspaceEventSyncService;

  beforeEach(() => {
    service = new WorkspaceEventSyncService();
    jest.clearAllMocks();
  });

  describe('synchronizeWithEventMilestones', () => {
    it('should synchronize workspace tasks with event milestones', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';

      // Mock permission verification
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
        role: 'WORKSPACE_OWNER',
        status: 'ACTIVE',
        permissions: ['MANAGE_WORKSPACE'],
      });

      // Mock workspace data
      const mockWorkspace = {
        id: workspaceId,
        event: {
          id: 'event-1',
          name: 'Test Event',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-02'),
          registrationDeadline: new Date('2024-02-25'),
          createdAt: new Date('2024-01-01'),
        },
        tasks: [
          {
            id: 'task-1',
            title: 'Setup venue',
            category: 'LOGISTICS',
            dueDate: new Date('2024-02-28'),
            metadata: {},
          },
        ],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await service.synchronizeWithEventMilestones(workspaceId, userId);

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
        include: {
          event: true,
          tasks: true,
        },
      });
    });

    it('should throw error for unauthorized user', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';

      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await expect(service.synchronizeWithEventMilestones(workspaceId, userId))
        .rejects.toThrow('Access denied: User is not a member of this workspace');
    });

    it('should throw error for non-existent workspace', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';

      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
        role: 'WORKSPACE_OWNER',
        status: 'ACTIVE',
        permissions: ['MANAGE_WORKSPACE'],
      });

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.synchronizeWithEventMilestones(workspaceId, userId))
        .rejects.toThrow('Workspace not found');
    });
  });

  describe('handleEventUpdate', () => {
    it('should propagate event changes to all related workspaces', async () => {
      const eventId = 'event-1';
      const changes = {
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-16'),
      };

      const mockWorkspaces = [
        {
          id: 'workspace-1',
          eventId,
          tasks: [
            {
              id: 'task-1',
              metadata: { alignedMilestone: 'final-preparations' },
              dueDate: new Date('2024-02-28'),
            },
          ],
          teamMembers: [
            {
              id: 'member-1',
              status: 'ACTIVE',
              user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
            },
          ],
          event: {
            id: eventId,
            name: 'Test Event',
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-03-02'),
          },
        },
      ];

      mockPrisma.workspace.findMany.mockResolvedValue(mockWorkspaces);
      mockPrisma.workspaceTask.update.mockResolvedValue({});

      await service.handleEventUpdate(eventId, changes);

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith({
        where: { eventId },
        include: {
          tasks: true,
          teamMembers: {
            where: { status: 'ACTIVE' },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
    });
  });

  describe('getWorkspaceProgressIndicators', () => {
    it('should return comprehensive progress indicators', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';

      // Mock access verification
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
      });

      // Mock workspace data
      const mockWorkspace = {
        id: workspaceId,
        eventId: 'event-1',
        event: {
          id: 'event-1',
          name: 'Test Event',
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-02'),
          registrationDeadline: new Date('2024-02-25'),
          createdAt: new Date('2024-01-01'),
        },
        tasks: [
          {
            id: 'task-1',
            title: 'Setup venue',
            category: 'LOGISTICS',
            status: TaskStatus.COMPLETED,
            progress: 100,
            dueDate: new Date('2024-02-28'),
            dependencies: [],
            assignee: {
              user: { name: 'John Doe' },
            },
          },
          {
            id: 'task-2',
            title: 'Marketing campaign',
            category: 'MARKETING',
            status: TaskStatus.IN_PROGRESS,
            progress: 50,
            dueDate: new Date('2024-02-20'),
            dependencies: [],
            assignee: {
              user: { name: 'Jane Smith' },
            },
          },
        ],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      const result = await service.getWorkspaceProgressIndicators(workspaceId, userId);

      expect(result).toBeDefined();
      expect(result.workspaceId).toBe(workspaceId);
      expect(result.eventId).toBe('event-1');
      expect(result.overallProgress).toBe(50); // 1 completed out of 2 tasks
      expect(result.milestoneProgress).toBeDefined();
      expect(result.criticalPath).toBeDefined();
      expect(result.riskFactors).toBeDefined();
    });

    it('should throw error for unauthorized access', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';

      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await expect(service.getWorkspaceProgressIndicators(workspaceId, userId))
        .rejects.toThrow('Access denied: User is not a member of this workspace');
    });
  });

  describe('escalateCriticalDeadlines', () => {
    it('should escalate tasks approaching critical deadlines', async () => {
      const workspaceId = 'workspace-1';
      const now = new Date();
      const criticalDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

      const mockWorkspace = {
        id: workspaceId,
        tasks: [
          {
            id: 'task-1',
            title: 'Critical task',
            dueDate: criticalDeadline,
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            assignee: {
              user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
            },
          },
          {
            id: 'task-2',
            title: 'Normal task',
            dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours from now
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.MEDIUM,
            assignee: {
              user: { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
            },
          },
        ],
        teamMembers: [
          {
            id: 'member-1',
            status: 'ACTIVE',
            user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
          },
        ],
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceTask.update.mockResolvedValue({});

      await service.escalateCriticalDeadlines(workspaceId);

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: workspaceId },
        include: {
          tasks: {
            include: {
              assignee: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
          teamMembers: {
            where: { status: 'ACTIVE' },
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
    });

    it('should handle workspace not found', async () => {
      const workspaceId = 'workspace-1';

      mockPrisma.workspace.findUnique.mockResolvedValue(null);

      await expect(service.escalateCriticalDeadlines(workspaceId))
        .rejects.toThrow('Workspace not found');
    });
  });

  describe('milestone generation', () => {
    it('should generate appropriate milestones for event timeline', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Test Conference',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-02'),
        registrationDeadline: new Date('2024-02-25'),
        createdAt: new Date('2024-01-01'),
      };

      // Access private method through service instance
      const milestones = (service as any).generateEventMilestones(mockEvent);

      expect(milestones).toBeDefined();
      expect(milestones.length).toBeGreaterThan(0);
      
      // Check for key milestones
      const milestoneTypes = milestones.map((m: any) => m.type);
      expect(milestoneTypes).toContain('REGISTRATION_OPEN');
      expect(milestoneTypes).toContain('REGISTRATION_CLOSE');
      expect(milestoneTypes).toContain('EVENT_START');
      expect(milestoneTypes).toContain('EVENT_END');
      expect(milestoneTypes).toContain('MARKETING_LAUNCH');
      expect(milestoneTypes).toContain('FINAL_PREPARATIONS');
    });
  });

  describe('risk factor identification', () => {
    it('should identify overdue tasks as risk factors', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
        },
        {
          id: 'task-2',
          dueDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          status: TaskStatus.NOT_STARTED,
          priority: TaskPriority.URGENT,
        },
      ];

      const mockMilestones = [
        {
          id: 'milestone-1',
          name: 'Test Milestone',
          dueDate: new Date('2024-03-01'),
          type: 'EVENT_START',
          priority: 'CRITICAL',
        },
      ];

      // Access private method
      const risks = (service as any).identifyRiskFactors(mockTasks, mockMilestones);

      expect(risks).toBeDefined();
      expect(risks.length).toBeGreaterThan(0);
      
      const overdueRisk = risks.find((r: any) => r.type === 'OVERDUE_TASKS');
      expect(overdueRisk).toBeDefined();
      expect(overdueRisk.severity).toBe('HIGH'); // Has critical overdue tasks
    });

    it('should identify blocked critical tasks as risk factors', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          status: TaskStatus.BLOCKED,
          priority: TaskPriority.HIGH,
        },
        {
          id: 'task-2',
          status: TaskStatus.BLOCKED,
          priority: TaskPriority.URGENT,
        },
      ];

      const mockMilestones: any[] = [];

      // Access private method
      const risks = (service as any).identifyRiskFactors(mockTasks, mockMilestones);

      expect(risks).toBeDefined();
      
      const blockedRisk = risks.find((r: any) => r.type === 'BLOCKED_CRITICAL');
      expect(blockedRisk).toBeDefined();
      expect(blockedRisk.severity).toBe('CRITICAL');
    });
  });
});