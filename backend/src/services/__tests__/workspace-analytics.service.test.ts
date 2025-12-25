import { TaskStatus, TaskPriority, WorkspaceRole } from '@prisma/client';

// Mock the prisma import
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    teamMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
    },
    workspaceTask: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
  })),
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
  WorkspaceRole: {
    WORKSPACE_OWNER: 'WORKSPACE_OWNER',
    TEAM_LEAD: 'TEAM_LEAD',
    EVENT_COORDINATOR: 'EVENT_COORDINATOR',
    VOLUNTEER_MANAGER: 'VOLUNTEER_MANAGER',
    TECHNICAL_SPECIALIST: 'TECHNICAL_SPECIALIST',
    MARKETING_LEAD: 'MARKETING_LEAD',
    GENERAL_VOLUNTEER: 'GENERAL_VOLUNTEER',
  },
}));

import { WorkspaceAnalyticsService, setPrismaInstance } from '../workspace-analytics.service';

// Get the mocked prisma instance
const mockPrisma = require('@prisma/client').PrismaClient();

describe('WorkspaceAnalyticsService', () => {
  let service: WorkspaceAnalyticsService;

  beforeEach(() => {
    service = new WorkspaceAnalyticsService();
    setPrismaInstance(mockPrisma);
    jest.clearAllMocks();
  });

  describe('calculateTaskStats', () => {
    it('should calculate task statistics correctly', async () => {
      const workspaceId = 'workspace-1';
      const mockTasks = [
        { id: '1', status: TaskStatus.COMPLETED, dueDate: null },
        { id: '2', status: TaskStatus.IN_PROGRESS, dueDate: null },
        { id: '3', status: TaskStatus.NOT_STARTED, dueDate: null },
        { id: '4', status: TaskStatus.REVIEW_REQUIRED, dueDate: null },
        { id: '5', status: TaskStatus.BLOCKED, dueDate: null },
        { 
          id: '6', 
          status: TaskStatus.IN_PROGRESS, 
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday (overdue)
        },
      ];

      mockPrisma.workspaceTask.findMany.mockResolvedValue(mockTasks);

      const result = await service.calculateTaskStats(workspaceId);

      expect(result).toEqual({
        total: 6,
        completed: 1,
        inProgress: 2,
        notStarted: 1,
        reviewRequired: 1,
        blocked: 1,
        overdue: 1,
        completionRate: (1 / 6) * 100,
      });

      expect(mockPrisma.workspaceTask.findMany).toHaveBeenCalledWith({
        where: { workspaceId },
      });
    });

    it('should handle empty task list', async () => {
      const workspaceId = 'workspace-1';
      mockPrisma.workspaceTask.findMany.mockResolvedValue([]);

      const result = await service.calculateTaskStats(workspaceId);

      expect(result).toEqual({
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        reviewRequired: 0,
        blocked: 0,
        overdue: 0,
        completionRate: 0,
      });
    });
  });

  describe('calculateTeamActivity', () => {
    it('should calculate team activity metrics correctly', async () => {
      const workspaceId = 'workspace-1';
      const mockTeamMembers = [
        {
          id: 'member-1',
          role: WorkspaceRole.WORKSPACE_OWNER,
          status: 'ACTIVE',
          user: { id: 'user-1', name: 'John Doe' },
        },
        {
          id: 'member-2',
          role: WorkspaceRole.TEAM_LEAD,
          status: 'ACTIVE',
          user: { id: 'user-2', name: 'Jane Smith' },
        },
        {
          id: 'member-3',
          role: WorkspaceRole.GENERAL_VOLUNTEER,
          status: 'ACTIVE',
          user: { id: 'user-3', name: 'Bob Wilson' },
        },
      ];

      const mockTasks = [
        { id: '1', assigneeId: 'member-1', status: TaskStatus.COMPLETED },
        { id: '2', assigneeId: 'member-1', status: TaskStatus.IN_PROGRESS },
        { id: '3', assigneeId: 'member-2', status: TaskStatus.COMPLETED },
        { 
          id: '4', 
          assigneeId: 'member-2', 
          status: TaskStatus.IN_PROGRESS,
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Overdue
        },
      ];

      mockPrisma.teamMember.findMany.mockResolvedValue(mockTeamMembers);
      mockPrisma.workspaceTask.findMany
        .mockResolvedValueOnce(mockTasks.filter(t => t.assigneeId === 'member-1'))
        .mockResolvedValueOnce(mockTasks.filter(t => t.assigneeId === 'member-2'))
        .mockResolvedValueOnce([])
        .mockResolvedValue([]);

      const result = await service.calculateTeamActivity(workspaceId);

      expect(result.totalMembers).toBe(3);
      expect(result.membersByRole).toEqual({
        WORKSPACE_OWNER: 1,
        TEAM_LEAD: 1,
        GENERAL_VOLUNTEER: 1,
      });
      expect(result.taskAssignmentDistribution).toHaveLength(3);
      expect(result.taskAssignmentDistribution[0]).toEqual({
        memberId: 'member-1',
        memberName: 'John Doe',
        role: WorkspaceRole.WORKSPACE_OWNER,
        assignedTasks: 2,
        completedTasks: 1,
        overdueTasks: 0,
        completionRate: 50,
      });
    });
  });

  describe('calculateHealthIndicators', () => {
    it('should calculate workspace health indicators', async () => {
      const workspaceId = 'workspace-1';
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const mockTasks = [
        { 
          id: '1', 
          status: TaskStatus.IN_PROGRESS, 
          dueDate: yesterday, // Overdue
          priority: TaskPriority.MEDIUM,
          assigneeId: 'member-1',
          assignee: { user: { name: 'John Doe' } }
        },
        { 
          id: '2', 
          status: TaskStatus.BLOCKED, 
          dueDate: tomorrow,
          priority: TaskPriority.MEDIUM,
          assigneeId: 'member-1',
          assignee: { user: { name: 'John Doe' } }
        },
        { 
          id: '3', 
          status: TaskStatus.NOT_STARTED, 
          dueDate: null,
          priority: TaskPriority.LOW,
          assigneeId: null // Unassigned
        },
        { 
          id: '4', 
          status: TaskStatus.IN_PROGRESS, 
          dueDate: tomorrow, // Critical deadline
          priority: TaskPriority.HIGH,
          assigneeId: 'member-1',
          assignee: { user: { name: 'John Doe' } }
        },
      ];

      mockPrisma.workspaceTask.findMany.mockResolvedValue(mockTasks);

      const result = await service.calculateHealthIndicators(workspaceId);

      expect(result.overdueTasks).toBe(1);
      expect(result.blockedTasks).toBe(1);
      expect(result.unassignedTasks).toBe(1);
      expect(result.criticalDeadlines).toBe(2); // Both tasks with tomorrow's date
      expect(result.healthScore).toBeLessThan(100);
      expect(result.bottlenecks).toBeDefined();
    });

    it('should return perfect health score for empty workspace', async () => {
      const workspaceId = 'workspace-1';
      mockPrisma.workspaceTask.findMany.mockResolvedValue([]);

      const result = await service.calculateHealthIndicators(workspaceId);

      expect(result.overdueTasks).toBe(0);
      expect(result.blockedTasks).toBe(0);
      expect(result.unassignedTasks).toBe(0);
      expect(result.criticalDeadlines).toBe(0);
      expect(result.healthScore).toBe(100);
    });
  });

  describe('calculateWorkloadDistribution', () => {
    it('should calculate workload distribution correctly', async () => {
      const workspaceId = 'workspace-1';
      const mockTeamMembers = [
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
      ];

      const mockTasks = [
        { id: '1', assigneeId: 'member-1', status: TaskStatus.COMPLETED, category: 'SETUP', priority: TaskPriority.HIGH },
        { id: '2', assigneeId: 'member-1', status: TaskStatus.IN_PROGRESS, category: 'SETUP', priority: TaskPriority.HIGH },
        { id: '3', assigneeId: 'member-2', status: TaskStatus.COMPLETED, category: 'MARKETING', priority: TaskPriority.MEDIUM },
      ];

      mockPrisma.teamMember.findMany.mockResolvedValue(mockTeamMembers);
      mockPrisma.workspaceTask.findMany.mockResolvedValue(mockTasks);

      const result = await service.calculateWorkloadDistribution(workspaceId);

      expect(result.byMember).toHaveLength(2);
      expect(result.byMember[0]).toEqual({
        memberId: 'member-1',
        memberName: 'John Doe',
        role: WorkspaceRole.WORKSPACE_OWNER,
        totalTasks: 2,
        activeTasks: 1,
        workloadPercentage: 20, // 2 tasks / 10 max * 100
        capacityStatus: 'UNDERUTILIZED',
      });

      expect(result.byCategory).toBeDefined();
      expect(result.byPriority).toBeDefined();
    });
  });

  describe('getWorkspaceAnalytics', () => {
    it('should return comprehensive analytics report', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';

      // Mock workspace access verification
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        id: 'member-1',
        workspaceId,
        userId,
      });

      // Mock workspace details
      mockPrisma.workspace.findUnique.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
        createdAt: new Date('2024-01-01'),
        event: {
          name: 'Test Event',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-02'),
        },
      });

      // Mock empty data for simplicity
      mockPrisma.workspaceTask.findMany.mockResolvedValue([]);
      mockPrisma.teamMember.findMany.mockResolvedValue([]);

      const result = await service.getWorkspaceAnalytics(workspaceId, userId);

      expect(result).toBeDefined();
      expect(result.workspaceId).toBe(workspaceId);
      expect(result.workspaceName).toBe('Test Workspace');
      expect(result.eventName).toBe('Test Event');
      expect(result.taskStats).toBeDefined();
      expect(result.teamActivity).toBeDefined();
      expect(result.healthIndicators).toBeDefined();
      expect(result.workloadDistribution).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should throw error for unauthorized access', async () => {
      const workspaceId = 'workspace-1';
      const userId = 'user-1';

      mockPrisma.teamMember.findFirst.mockResolvedValue(null);

      await expect(service.getWorkspaceAnalytics(workspaceId, userId))
        .rejects.toThrow('Access denied: User is not a member of this workspace');
    });
  });
});