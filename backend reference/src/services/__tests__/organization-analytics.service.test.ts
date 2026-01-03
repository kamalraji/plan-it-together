// Mock Prisma before importing the service
const mockPrisma = {
  organization: {
    findUnique: jest.fn(),
  },
  event: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  follow: {
    findMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

import { organizationAnalyticsService } from '../organization-analytics.service';

describe('OrganizationAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTotalEventCount', () => {
    it('should return correct event count for organization', async () => {
      const organizationId = 'org-123';
      mockPrisma.event.count.mockResolvedValue(5);

      const result = await organizationAnalyticsService.calculateTotalEventCount(organizationId);

      expect(result).toBe(5);
      expect(mockPrisma.event.count).toHaveBeenCalledWith({
        where: { organizationId },
      });
    });

    it('should return 0 when organization has no events', async () => {
      const organizationId = 'org-123';
      mockPrisma.event.count.mockResolvedValue(0);

      const result = await organizationAnalyticsService.calculateTotalEventCount(organizationId);

      expect(result).toBe(0);
    });
  });

  describe('calculateFollowerGrowthOverTime', () => {
    it('should calculate follower growth correctly', async () => {
      const organizationId = 'org-123';
      const mockFollows = [
        { followedAt: new Date('2024-01-15') },
        { followedAt: new Date('2024-01-20') },
        { followedAt: new Date('2024-02-05') },
        { followedAt: new Date('2024-02-10') },
        { followedAt: new Date('2024-02-15') },
      ];

      mockPrisma.follow.findMany.mockResolvedValue(mockFollows);

      const result = await organizationAnalyticsService.calculateFollowerGrowthOverTime(organizationId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        month: '2024-01',
        count: 2,
        cumulativeCount: 2,
      });
      expect(result[1]).toEqual({
        month: '2024-02',
        count: 3,
        cumulativeCount: 5,
      });
    });

    it('should return empty array when organization has no followers', async () => {
      const organizationId = 'org-123';
      mockPrisma.follow.findMany.mockResolvedValue([]);

      const result = await organizationAnalyticsService.calculateFollowerGrowthOverTime(organizationId);

      expect(result).toEqual([]);
    });
  });

  describe('aggregateRegistrationAndAttendance', () => {
    it('should calculate total registrations and attendance correctly', async () => {
      const organizationId = 'org-123';
      const mockEvents = [
        {
          id: 'event-1',
          registrations: [
            { id: 'reg-1', attendance: [{ id: 'att-1' }] },
            { id: 'reg-2', attendance: [] },
            { id: 'reg-3', attendance: [{ id: 'att-2' }] },
          ],
        },
        {
          id: 'event-2',
          registrations: [
            { id: 'reg-4', attendance: [{ id: 'att-3' }] },
            { id: 'reg-5', attendance: [] },
          ],
        },
      ];

      mockPrisma.event.findMany.mockResolvedValue(mockEvents);

      const result = await organizationAnalyticsService.aggregateRegistrationAndAttendance(organizationId);

      expect(result.totalRegistrations).toBe(5);
      expect(result.totalAttendance).toBe(3);
    });

    it('should return zeros when organization has no events', async () => {
      const organizationId = 'org-123';
      mockPrisma.event.findMany.mockResolvedValue([]);

      const result = await organizationAnalyticsService.aggregateRegistrationAndAttendance(organizationId);

      expect(result.totalRegistrations).toBe(0);
      expect(result.totalAttendance).toBe(0);
    });
  });

  describe('calculateFollowerDemographics', () => {
    it('should calculate follower demographics correctly', async () => {
      const organizationId = 'org-123';
      const mockFollows = [
        {
          user: {
            role: 'PARTICIPANT',
            createdAt: new Date('2024-01-15'),
          },
        },
        {
          user: {
            role: 'PARTICIPANT',
            createdAt: new Date('2024-01-20'),
          },
        },
        {
          user: {
            role: 'ORGANIZER',
            createdAt: new Date('2024-02-05'),
          },
        },
      ];

      mockPrisma.follow.findMany.mockResolvedValue(mockFollows);

      const result = await organizationAnalyticsService.calculateFollowerDemographics(organizationId);

      expect(result.byRole).toEqual({
        PARTICIPANT: 2,
        ORGANIZER: 1,
      });
      expect(result.byRegistrationDate).toEqual({
        '2024-01': 2,
        '2024-02': 1,
      });
    });
  });

  describe('getOrganizationAnalytics', () => {
    it('should return comprehensive analytics for organization', async () => {
      const organizationId = 'org-123';
      const mockOrganization = {
        id: organizationId,
        name: 'Test Organization',
        followerCount: 10,
      };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);
      
      // Mock all the individual method calls
      mockPrisma.event.count.mockResolvedValue(3);
      mockPrisma.follow.findMany
        .mockResolvedValueOnce([
          { followedAt: new Date('2024-01-15') },
          { followedAt: new Date('2024-02-05') },
        ])
        .mockResolvedValueOnce([
          {
            user: {
              role: 'PARTICIPANT',
              createdAt: new Date('2024-01-15'),
            },
          },
        ]);
      
      mockPrisma.event.findMany
        .mockResolvedValueOnce([
          {
            id: 'event-1',
            registrations: [
              { id: 'reg-1', attendance: [{ id: 'att-1' }] },
            ],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'event-1',
            name: 'Test Event',
            registrations: [
              { id: 'reg-1', attendance: [{ id: 'att-1' }] },
            ],
          },
        ]);

      const result = await organizationAnalyticsService.getOrganizationAnalytics(organizationId);

      expect(result.totalEvents).toBe(3);
      expect(result.totalFollowers).toBe(10);
      expect(result.totalRegistrations).toBe(1);
      expect(result.totalAttendance).toBe(1);
      expect(result.followerGrowth).toEqual({
        '2024-01': 1,
        '2024-02': 1,
      });
      expect(result.eventPerformance).toHaveLength(1);
      expect(result.followerDemographics.byRole).toEqual({
        PARTICIPANT: 1,
      });
    });

    it('should throw error when organization not found', async () => {
      const organizationId = 'invalid-org';
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        organizationAnalyticsService.getOrganizationAnalytics(organizationId)
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('getOrganizationAnalyticsReport', () => {
    it('should return comprehensive analytics report', async () => {
      const organizationId = 'org-123';
      const mockOrganization = {
        id: organizationId,
        name: 'Test Organization',
        followerCount: 10,
      };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);
      
      // Mock all the analytics data
      mockPrisma.event.count.mockResolvedValue(2);
      mockPrisma.follow.findMany
        .mockResolvedValueOnce([
          { followedAt: new Date('2024-01-15') },
          { followedAt: new Date('2024-02-05') },
        ])
        .mockResolvedValueOnce([
          {
            user: {
              role: 'PARTICIPANT',
              createdAt: new Date('2024-01-15'),
            },
          },
        ]);
      
      mockPrisma.event.findMany
        .mockResolvedValueOnce([
          {
            id: 'event-1',
            registrations: [
              { id: 'reg-1', attendance: [{ id: 'att-1' }] },
              { id: 'reg-2', attendance: [] },
            ],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'event-1',
            name: 'Test Event',
            registrations: [
              { id: 'reg-1', attendance: [{ id: 'att-1' }] },
              { id: 'reg-2', attendance: [] },
            ],
          },
        ]);

      const result = await organizationAnalyticsService.getOrganizationAnalyticsReport(organizationId);

      expect(result.organizationId).toBe(organizationId);
      expect(result.organizationName).toBe('Test Organization');
      expect(result.analytics.totalEvents).toBe(2);
      expect(result.summary.totalEvents).toBe(2);
      expect(result.summary.totalFollowers).toBe(10);
      expect(result.summary.totalRegistrations).toBe(2);
      expect(result.summary.totalAttendance).toBe(1);
      expect(result.summary.averageAttendanceRate).toBe(50); // 1/2 * 100
      expect(result.summary.mostPopularEvent).toEqual({
        eventId: 'event-1',
        eventName: 'Test Event',
        registrationCount: 2,
      });
    });
  });
});