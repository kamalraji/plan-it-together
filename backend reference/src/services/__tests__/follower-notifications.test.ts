// Mock Prisma first
const mockPrisma = {
  follow: {
    findMany: jest.fn(),
  },
  event: {
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock the communication service
jest.mock('../communication.service', () => ({
  communicationService: {
    sendEmail: jest.fn(),
  },
}));

import { discoveryService } from '../discovery.service';
import { communicationService } from '../communication.service';

const mockCommunicationService = communicationService as jest.Mocked<typeof communicationService>;

describe('Follower Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyFollowers', () => {
    it('should send notifications to all followers when event is published', async () => {
      // Mock followers data
      const mockFollowers = [
        {
          id: 'follow1',
          userId: 'user1',
          organizationId: 'org1',
          followedAt: new Date(),
          user: {
            id: 'user1',
            email: 'user1@example.com',
            name: 'User One',
          },
        },
        {
          id: 'follow2',
          userId: 'user2',
          organizationId: 'org1',
          followedAt: new Date(),
          user: {
            id: 'user2',
            email: 'user2@example.com',
            name: 'User Two',
          },
        },
      ];

      // Mock event data
      const mockEvent = {
        id: 'event1',
        name: 'Test Event',
        description: 'This is a test event',
        startDate: new Date('2024-12-25'),
        mode: 'OFFLINE',
        landingPageUrl: 'test-event',
        organization: {
          id: 'org1',
          name: 'Test Organization',
        },
      };

      // Setup mocks
      mockPrisma.follow.findMany.mockResolvedValue(mockFollowers);
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockCommunicationService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'msg123',
      });

      // Test the notification
      await discoveryService.notifyFollowers('org1', 'event1');

      // Verify followers were queried
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Verify event was queried
      expect(mockPrisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event1' },
        include: {
          organization: true,
        },
      });

      // Verify emails were sent to all followers
      expect(mockCommunicationService.sendEmail).toHaveBeenCalledTimes(2);
      
      // Check first email
      expect(mockCommunicationService.sendEmail).toHaveBeenNthCalledWith(1, {
        to: ['user1@example.com'],
        subject: 'New event from Test Organization: Test Event',
        body: expect.stringContaining('Hello User One'),
      });

      // Check second email
      expect(mockCommunicationService.sendEmail).toHaveBeenNthCalledWith(2, {
        to: ['user2@example.com'],
        subject: 'New event from Test Organization: Test Event',
        body: expect.stringContaining('Hello User Two'),
      });
    });

    it('should handle case when no followers exist', async () => {
      // Mock empty followers
      mockPrisma.follow.findMany.mockResolvedValue([]);
      
      const mockEvent = {
        id: 'event1',
        name: 'Test Event',
        description: 'This is a test event',
        startDate: new Date('2024-12-25'),
        mode: 'OFFLINE',
        landingPageUrl: 'test-event',
        organization: {
          id: 'org1',
          name: 'Test Organization',
        },
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

      // Test the notification
      await discoveryService.notifyFollowers('org1', 'event1');

      // Verify no emails were sent
      expect(mockCommunicationService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending failures gracefully', async () => {
      const mockFollowers = [
        {
          id: 'follow1',
          userId: 'user1',
          organizationId: 'org1',
          followedAt: new Date(),
          user: {
            id: 'user1',
            email: 'user1@example.com',
            name: 'User One',
          },
        },
      ];

      const mockEvent = {
        id: 'event1',
        name: 'Test Event',
        description: 'This is a test event',
        startDate: new Date('2024-12-25'),
        mode: 'OFFLINE',
        landingPageUrl: 'test-event',
        organization: {
          id: 'org1',
          name: 'Test Organization',
        },
      };

      mockPrisma.follow.findMany.mockResolvedValue(mockFollowers);
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      
      // Mock email failure
      mockCommunicationService.sendEmail.mockResolvedValue({
        success: false,
        error: 'Email service unavailable',
      });

      // Should not throw error
      await expect(discoveryService.notifyFollowers('org1', 'event1')).resolves.not.toThrow();

      // Verify email was attempted
      expect(mockCommunicationService.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('should throw error when event is not found', async () => {
      mockPrisma.follow.findMany.mockResolvedValue([]);
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(discoveryService.notifyFollowers('org1', 'event1')).rejects.toThrow(
        'Event or organization not found'
      );
    });

    it('should throw error when organization is not found', async () => {
      const mockEvent = {
        id: 'event1',
        name: 'Test Event',
        description: 'This is a test event',
        startDate: new Date('2024-12-25'),
        mode: 'OFFLINE',
        landingPageUrl: 'test-event',
        organization: null,
      };

      mockPrisma.follow.findMany.mockResolvedValue([]);
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);

      await expect(discoveryService.notifyFollowers('org1', 'event1')).rejects.toThrow(
        'Event or organization not found'
      );
    });
  });
});