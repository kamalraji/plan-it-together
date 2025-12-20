// Mock the prisma import - must be at the top before any imports
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
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
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
  TaskCategory: {
    SETUP: 'SETUP',
    MARKETING: 'MARKETING',
    LOGISTICS: 'LOGISTICS',
    TECHNICAL: 'TECHNICAL',
    REGISTRATION: 'REGISTRATION',
    POST_EVENT: 'POST_EVENT',
  },
  EventStatus: {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

import { WorkspaceEventSyncService } from '../workspace-event-sync.service';

describe('WorkspaceEventSyncService', () => {
  let service: WorkspaceEventSyncService;

  beforeEach(() => {
    service = new WorkspaceEventSyncService();
    jest.clearAllMocks();
  });

  describe('Service Structure', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof service.handleEventUpdate).toBe('function');
      expect(typeof service.escalateCriticalDeadlines).toBe('function');
    });
  });

  describe('Event Update Handling', () => {
    it('should handle event updates', async () => {
      const mockWorkspaces = [{
        id: 'workspace-1',
        eventId: 'event-1',
        tasks: []
      }];

      mockPrisma.workspace.findMany.mockResolvedValue(mockWorkspaces);

      await service.handleEventUpdate('event-1', {
        title: 'Updated Event Title',
        description: 'Updated description'
      });

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        include: expect.any(Object)
      });
    });
  });

  describe('Critical Deadline Escalation', () => {
    it('should escalate critical deadlines', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        eventId: 'event-1',
        tasks: []
      };

      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceTask.findMany.mockResolvedValue([]);

      await service.escalateCriticalDeadlines('workspace-1');

      expect(mockPrisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
        include: expect.any(Object)
      });
    });
  });
});