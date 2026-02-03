import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RegistrationOverTime {
  date: string;
  count: number;
  cumulativeCount: number;
}

export interface SessionCheckInRate {
  sessionId: string | null;
  sessionName: string;
  totalRegistrations: number;
  checkedIn: number;
  checkInRate: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface JudgeParticipation {
  judgeId: string;
  judgeName: string;
  assignedSubmissions: number;
  scoredSubmissions: number;
  completionRate: number;
}

export interface AnalyticsReport {
  eventId: string;
  eventName: string;
  generatedAt: Date;
  registrationOverTime: RegistrationOverTime[];
  sessionCheckInRates: SessionCheckInRate[];
  scoreDistributions: ScoreDistribution[];
  judgeParticipation: JudgeParticipation[];
  summary: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    totalAttendance: number;
    overallCheckInRate: number;
    averageScore: number;
    totalSubmissions: number;
    totalJudges: number;
  };
}

export class AnalyticsService {
  /**
   * Calculate registration counts over time
   * Requirements: 15.1
   */
  async calculateRegistrationsOverTime(eventId: string): Promise<RegistrationOverTime[]> {
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      orderBy: { registeredAt: 'asc' },
      select: {
        registeredAt: true,
      },
    });

    // Group by date
    const dateMap = new Map<string, number>();
    registrations.forEach((reg) => {
      const date = new Date(reg.registeredAt).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Convert to array and calculate cumulative counts
    const sortedDates = Array.from(dateMap.keys()).sort();
    let cumulativeCount = 0;
    
    return sortedDates.map((date) => {
      const count = dateMap.get(date) || 0;
      cumulativeCount += count;
      return {
        date,
        count,
        cumulativeCount,
      };
    });
  }

  /**
   * Calculate check-in rates by session
   * Requirements: 15.2
   */
  async calculateCheckInRatesBySession(eventId: string): Promise<SessionCheckInRate[]> {
    // Get all registrations for the event
    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        status: 'CONFIRMED',
      },
      include: {
        attendance: true,
      },
    });

    const totalRegistrations = registrations.length;

    // Get unique sessions from attendance records
    const sessionMap = new Map<string | null, { checkedIn: Set<string> }>();
    
    registrations.forEach((reg) => {
      reg.attendance.forEach((att) => {
        const sessionId = att.sessionId;
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, { checkedIn: new Set() });
        }
        sessionMap.get(sessionId)!.checkedIn.add(reg.id);
      });
    });

    // Calculate rates for each session
    const sessionRates: SessionCheckInRate[] = [];

    // Overall event check-in (no specific session)
    const overallCheckedIn = new Set<string>();
    registrations.forEach((reg) => {
      if (reg.attendance.length > 0) {
        overallCheckedIn.add(reg.id);
      }
    });

    sessionRates.push({
      sessionId: null,
      sessionName: 'Overall Event',
      totalRegistrations,
      checkedIn: overallCheckedIn.size,
      checkInRate: totalRegistrations > 0 
        ? (overallCheckedIn.size / totalRegistrations) * 100 
        : 0,
    });

    // Individual sessions
    for (const [sessionId, data] of sessionMap.entries()) {
      if (sessionId !== null) {
        sessionRates.push({
          sessionId,
          sessionName: `Session ${sessionId}`,
          totalRegistrations,
          checkedIn: data.checkedIn.size,
          checkInRate: totalRegistrations > 0 
            ? (data.checkedIn.size / totalRegistrations) * 100 
            : 0,
        });
      }
    }

    return sessionRates;
  }

  /**
   * Calculate score distributions
   * Requirements: 15.3
   */
  async calculateScoreDistributions(eventId: string): Promise<ScoreDistribution[]> {
    // Get rubric for the event
    const rubric = await prisma.rubric.findUnique({
      where: { eventId },
    });

    if (!rubric) {
      return [];
    }

    // Get all submissions with scores
    const submissions = await prisma.submission.findMany({
      where: { eventId },
      include: {
        scores: true,
      },
    });

    // Calculate final scores for each submission
    const finalScores: number[] = [];
    const criteria = rubric.criteria as any[];

    submissions.forEach((submission) => {
      if (submission.scores.length === 0) {
        return;
      }

      // Calculate average score across all judges
      const judgeScores = submission.scores.map((score) => {
        const scores = score.scores as Record<string, number>;
        let totalScore = 0;

        for (const criterion of criteria) {
          const rawScore = scores[criterion.id] || 0;
          const normalizedScore = rawScore / criterion.maxScore;
          const weightedScore = normalizedScore * criterion.weight;
          totalScore += weightedScore;
        }

        return totalScore;
      });

      const avgScore = judgeScores.reduce((sum, s) => sum + s, 0) / judgeScores.length;
      finalScores.push(avgScore);
    });

    if (finalScores.length === 0) {
      return [];
    }

    // Create distribution buckets (0-20, 20-40, 40-60, 60-80, 80-100)
    const buckets = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '20-40', min: 20, max: 40, count: 0 },
      { range: '40-60', min: 40, max: 60, count: 0 },
      { range: '60-80', min: 60, max: 80, count: 0 },
      { range: '80-100', min: 80, max: 100, count: 0 },
    ];

    finalScores.forEach((score) => {
      for (const bucket of buckets) {
        if (score >= bucket.min && score < bucket.max) {
          bucket.count++;
          break;
        }
        // Handle edge case for score = 100
        if (score === 100 && bucket.max === 100) {
          bucket.count++;
          break;
        }
      }
    });

    const total = finalScores.length;
    return buckets.map((bucket) => ({
      range: bucket.range,
      count: bucket.count,
      percentage: total > 0 ? (bucket.count / total) * 100 : 0,
    }));
  }

  /**
   * Aggregate judge participation data
   * Requirements: 15.3
   */
  async aggregateJudgeParticipation(eventId: string): Promise<JudgeParticipation[]> {
    // Get all submissions for the event
    const submissions = await prisma.submission.findMany({
      where: { eventId },
      include: {
        scores: {
          include: {
            judge: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Get all judges who have scored at least one submission
    const judgeMap = new Map<string, {
      name: string;
      assignedSubmissions: Set<string>;
      scoredSubmissions: Set<string>;
    }>();

    const totalSubmissions = submissions.length;

    submissions.forEach((submission) => {
      submission.scores.forEach((score) => {
        if (!judgeMap.has(score.judgeId)) {
          judgeMap.set(score.judgeId, {
            name: score.judge.name,
            assignedSubmissions: new Set(),
            scoredSubmissions: new Set(),
          });
        }

        const judgeData = judgeMap.get(score.judgeId)!;
        judgeData.assignedSubmissions.add(submission.id);
        judgeData.scoredSubmissions.add(submission.id);
      });
    });

    // Convert to array
    const participation: JudgeParticipation[] = [];
    for (const [judgeId, data] of judgeMap.entries()) {
      // For simplicity, we assume all judges are assigned all submissions
      // In a real system, you'd have a JudgeAssignment table
      const assignedCount = totalSubmissions;
      const scoredCount = data.scoredSubmissions.size;

      participation.push({
        judgeId,
        judgeName: data.name,
        assignedSubmissions: assignedCount,
        scoredSubmissions: scoredCount,
        completionRate: assignedCount > 0 ? (scoredCount / assignedCount) * 100 : 0,
      });
    }

    return participation;
  }

  /**
   * Get comprehensive analytics report for an event
   * Combines all analytics data into a single report
   */
  async getComprehensiveReport(eventId: string): Promise<AnalyticsReport> {
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          include: {
            attendance: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Calculate all analytics
    const [
      registrationOverTime,
      sessionCheckInRates,
      scoreDistributions,
      judgeParticipation,
    ] = await Promise.all([
      this.calculateRegistrationsOverTime(eventId),
      this.calculateCheckInRatesBySession(eventId),
      this.calculateScoreDistributions(eventId),
      this.aggregateJudgeParticipation(eventId),
    ]);

    // Calculate summary statistics
    const totalRegistrations = event.registrations.length;
    const confirmedRegistrations = event.registrations.filter(
      (r) => r.status === 'CONFIRMED'
    ).length;
    const attendedRegistrations = event.registrations.filter(
      (r) => r.attendance.length > 0
    ).length;
    const overallCheckInRate = confirmedRegistrations > 0
      ? (attendedRegistrations / confirmedRegistrations) * 100
      : 0;

    // Get submissions and calculate average score
    const submissions = await prisma.submission.findMany({
      where: { eventId },
      include: {
        scores: true,
      },
    });

    let averageScore = 0;
    if (submissions.length > 0 && submissions.some((s) => s.scores.length > 0)) {
      const rubric = await prisma.rubric.findUnique({
        where: { eventId },
      });

      if (rubric) {
        const criteria = rubric.criteria as any[];
        const finalScores: number[] = [];

        submissions.forEach((submission) => {
          if (submission.scores.length === 0) return;

          const judgeScores = submission.scores.map((score) => {
            const scores = score.scores as Record<string, number>;
            let totalScore = 0;

            for (const criterion of criteria) {
              const rawScore = scores[criterion.id] || 0;
              const normalizedScore = rawScore / criterion.maxScore;
              const weightedScore = normalizedScore * criterion.weight;
              totalScore += weightedScore;
            }

            return totalScore;
          });

          const avgScore = judgeScores.reduce((sum, s) => sum + s, 0) / judgeScores.length;
          finalScores.push(avgScore);
        });

        if (finalScores.length > 0) {
          averageScore = finalScores.reduce((sum, s) => sum + s, 0) / finalScores.length;
        }
      }
    }

    const uniqueJudges = new Set(
      submissions.flatMap((s) => s.scores.map((score) => score.judgeId))
    );

    return {
      eventId: event.id,
      eventName: event.name,
      generatedAt: new Date(),
      registrationOverTime,
      sessionCheckInRates,
      scoreDistributions,
      judgeParticipation,
      summary: {
        totalRegistrations,
        confirmedRegistrations,
        totalAttendance: attendedRegistrations,
        overallCheckInRate,
        averageScore,
        totalSubmissions: submissions.length,
        totalJudges: uniqueJudges.size,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
