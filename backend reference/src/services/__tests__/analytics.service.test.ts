import { analyticsService } from '../analytics.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    registration: {
      findMany: jest.fn(),
    },
    submission: {
      findMany: jest.fn(),
    },
    rubric: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRegistrationsOverTime', () => {
    it('should calculate registration counts grouped by date', async () => {
      const mockRegistrations = [
        { registeredAt: new Date('2024-01-01T10:00:00Z') },
        { registeredAt: new Date('2024-01-01T14:00:00Z') },
        { registeredAt: new Date('2024-01-02T10:00:00Z') },
        { registeredAt: new Date('2024-01-03T10:00:00Z') },
        { registeredAt: new Date('2024-01-03T15:00:00Z') },
        { registeredAt: new Date('2024-01-03T18:00:00Z') },
      ];

      (prisma.registration.findMany as jest.Mock).mockResolvedValue(mockRegistrations);

      const result = await analyticsService.calculateRegistrationsOverTime('event-1');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        count: 2,
        cumulativeCount: 2,
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        count: 1,
        cumulativeCount: 3,
      });
      expect(result[2]).toEqual({
        date: '2024-01-03',
        count: 3,
        cumulativeCount: 6,
      });
    });

    it('should return empty array when no registrations exist', async () => {
      (prisma.registration.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.calculateRegistrationsOverTime('event-1');

      expect(result).toEqual([]);
    });
  });

  describe('calculateCheckInRatesBySession', () => {
    it('should calculate check-in rates for overall event and sessions', async () => {
      const mockRegistrations = [
        {
          id: 'reg-1',
          status: 'CONFIRMED',
          attendance: [{ sessionId: null }, { sessionId: 'session-1' }],
        },
        {
          id: 'reg-2',
          status: 'CONFIRMED',
          attendance: [{ sessionId: 'session-1' }],
        },
        {
          id: 'reg-3',
          status: 'CONFIRMED',
          attendance: [],
        },
      ];

      (prisma.registration.findMany as jest.Mock).mockResolvedValue(mockRegistrations);

      const result = await analyticsService.calculateCheckInRatesBySession('event-1');

      expect(result.length).toBeGreaterThan(0);
      
      // Check overall event check-in rate
      const overallRate = result.find((r) => r.sessionId === null);
      expect(overallRate).toBeDefined();
      expect(overallRate?.totalRegistrations).toBe(3);
      expect(overallRate?.checkedIn).toBe(2); // reg-1 and reg-2 have attendance
      expect(overallRate?.checkInRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('calculateScoreDistributions', () => {
    it('should return empty array when no rubric exists', async () => {
      (prisma.rubric.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await analyticsService.calculateScoreDistributions('event-1');

      expect(result).toEqual([]);
    });

    it('should calculate score distribution buckets', async () => {
      const mockRubric = {
        criteria: [
          { id: 'c1', name: 'Criterion 1', weight: 50, maxScore: 10 },
          { id: 'c2', name: 'Criterion 2', weight: 50, maxScore: 10 },
        ],
      };

      const mockSubmissions = [
        {
          scores: [
            { scores: { c1: 8, c2: 9 } }, // Score: 85
          ],
        },
        {
          scores: [
            { scores: { c1: 5, c2: 6 } }, // Score: 55
          ],
        },
        {
          scores: [
            { scores: { c1: 3, c2: 2 } }, // Score: 25
          ],
        },
      ];

      (prisma.rubric.findUnique as jest.Mock).mockResolvedValue(mockRubric);
      (prisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);

      const result = await analyticsService.calculateScoreDistributions('event-1');

      expect(result).toHaveLength(5);
      expect(result.find((r) => r.range === '20-40')?.count).toBe(1);
      expect(result.find((r) => r.range === '40-60')?.count).toBe(1);
      expect(result.find((r) => r.range === '80-100')?.count).toBe(1);
    });
  });

  describe('aggregateJudgeParticipation', () => {
    it('should aggregate judge participation data', async () => {
      const mockSubmissions = [
        {
          id: 'sub-1',
          scores: [
            { judgeId: 'judge-1', judge: { id: 'judge-1', name: 'Judge One' } },
            { judgeId: 'judge-2', judge: { id: 'judge-2', name: 'Judge Two' } },
          ],
        },
        {
          id: 'sub-2',
          scores: [
            { judgeId: 'judge-1', judge: { id: 'judge-1', name: 'Judge One' } },
          ],
        },
        {
          id: 'sub-3',
          scores: [],
        },
      ];

      (prisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);

      const result = await analyticsService.aggregateJudgeParticipation('event-1');

      expect(result).toHaveLength(2);
      
      const judge1 = result.find((j) => j.judgeId === 'judge-1');
      expect(judge1).toBeDefined();
      expect(judge1?.judgeName).toBe('Judge One');
      expect(judge1?.scoredSubmissions).toBe(2);
      expect(judge1?.assignedSubmissions).toBe(3);
      expect(judge1?.completionRate).toBeCloseTo(66.67, 1);

      const judge2 = result.find((j) => j.judgeId === 'judge-2');
      expect(judge2).toBeDefined();
      expect(judge2?.scoredSubmissions).toBe(1);
      expect(judge2?.completionRate).toBeCloseTo(33.33, 1);
    });
  });
});
