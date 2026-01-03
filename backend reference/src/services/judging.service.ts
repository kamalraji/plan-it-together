import { PrismaClient } from '@prisma/client';
import {
  CreateRubricDTO,
  RubricResponse,
  CreateSubmissionDTO,
  SubmissionResponse,
  SubmitScoreDTO,
  ScoreResponse,
  FinalScore,
  LeaderboardEntry,
  RubricCriterion,
} from '../types';

const prisma = new PrismaClient();

export class JudgingService {
  /**
   * Create a rubric for an event
   * Validates that criterion weights sum to 100
   */
  async createRubric(data: CreateRubricDTO): Promise<RubricResponse> {
    // Validate weights sum to 100
    const totalWeight = data.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(
        `Rubric criteria weights must sum to 100, got ${totalWeight}`
      );
    }

    // Validate all criteria have positive max scores
    const invalidCriteria = data.criteria.filter((c) => c.maxScore <= 0);
    if (invalidCriteria.length > 0) {
      throw new Error('All rubric criteria must have positive maximum scores');
    }

    // Generate IDs for criteria
    const criteriaWithIds: RubricCriterion[] = data.criteria.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
    }));

    const rubric = await prisma.rubric.create({
      data: {
        eventId: data.eventId,
        criteria: criteriaWithIds,
      },
    });

    return {
      id: rubric.id,
      eventId: rubric.eventId,
      criteria: criteriaWithIds,
      createdAt: rubric.createdAt,
    };
  }

  /**
   * Get rubric for an event
   */
  async getRubric(eventId: string): Promise<RubricResponse | null> {
    const rubric = await prisma.rubric.findUnique({
      where: { eventId },
    });

    if (!rubric) {
      return null;
    }

    return {
      id: rubric.id,
      eventId: rubric.eventId,
      criteria: rubric.criteria as RubricCriterion[],
      createdAt: rubric.createdAt,
    };
  }

  /**
   * Create a submission for judging
   */
  async createSubmission(
    data: CreateSubmissionDTO
  ): Promise<SubmissionResponse> {
    const submission = await prisma.submission.create({
      data: {
        eventId: data.eventId,
        rubricId: data.rubricId,
        teamName: data.teamName,
        description: data.description,
        metadata: data.metadata || {},
      },
    });

    return {
      id: submission.id,
      eventId: submission.eventId,
      rubricId: submission.rubricId,
      teamName: submission.teamName,
      description: submission.description || undefined,
      metadata: (submission.metadata as Record<string, any>) || undefined,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  /**
   * Get submissions assigned to a specific judge
   */
  async getJudgeSubmissions(
    judgeId: string,
    eventId: string
  ): Promise<SubmissionResponse[]> {
    // Get submissions where this judge has been assigned
    // For now, we'll return all submissions for the event
    // In a real implementation, you'd have a JudgeAssignment table
    const submissions = await prisma.submission.findMany({
      where: { eventId },
    });

    return submissions.map((s) => ({
      id: s.id,
      eventId: s.eventId,
      rubricId: s.rubricId,
      teamName: s.teamName,
      description: s.description || undefined,
      metadata: (s.metadata as Record<string, any>) || undefined,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  /**
   * Submit scores for a submission
   * Validates that all rubric criteria are scored
   */
  async submitScore(data: SubmitScoreDTO): Promise<ScoreResponse> {
    // Get the rubric to validate scores
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: { rubric: true },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    const criteria = submission.rubric.criteria as RubricCriterion[];
    const criteriaIds = criteria.map((c) => c.id);

    // Validate all criteria are scored
    const scoredCriteriaIds = Object.keys(data.scores);
    const missingCriteria = criteriaIds.filter(
      (id) => !scoredCriteriaIds.includes(id)
    );

    if (missingCriteria.length > 0) {
      throw new Error(
        `Missing scores for criteria: ${missingCriteria.join(', ')}`
      );
    }

    // Validate scores are within bounds
    for (const criterion of criteria) {
      const score = data.scores[criterion.id];
      if (score < 0 || score > criterion.maxScore) {
        throw new Error(
          `Score for ${criterion.name} must be between 0 and ${criterion.maxScore}`
        );
      }
    }

    // Check if judge already scored this submission
    const existingScore = await prisma.score.findFirst({
      where: {
        submissionId: data.submissionId,
        judgeId: data.judgeId,
      },
    });

    let score;
    if (existingScore) {
      // Update existing score
      score = await prisma.score.update({
        where: { id: existingScore.id },
        data: {
          scores: data.scores,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create new score
      score = await prisma.score.create({
        data: {
          submissionId: data.submissionId,
          judgeId: data.judgeId,
          rubricId: submission.rubricId,
          scores: data.scores,
        },
      });
    }

    return {
      id: score.id,
      submissionId: score.submissionId,
      judgeId: score.judgeId,
      rubricId: score.rubricId,
      scores: score.scores as Record<string, number>,
      submittedAt: score.submittedAt,
    };
  }

  /**
   * Calculate final scores for all submissions in an event
   * Uses weighted average based on rubric criteria
   */
  async calculateFinalScores(eventId: string): Promise<FinalScore[]> {
    // Get rubric
    const rubric = await prisma.rubric.findUnique({
      where: { eventId },
    });

    if (!rubric) {
      throw new Error('No rubric found for this event');
    }

    const criteria = rubric.criteria as RubricCriterion[];

    // Get all submissions and their scores
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

    // Calculate final scores
    const finalScores: FinalScore[] = submissions.map((submission) => {
      const judgeScores = submission.scores.map((score) => {
        const scores = score.scores as Record<string, number>;

        // Calculate weighted total for this judge
        let totalScore = 0;
        for (const criterion of criteria) {
          const rawScore = scores[criterion.id] || 0;
          const normalizedScore = rawScore / criterion.maxScore; // 0-1
          const weightedScore = normalizedScore * criterion.weight; // 0-weight
          totalScore += weightedScore;
        }

        return {
          judgeId: score.judge.id,
          judgeName: score.judge.name,
          scores,
          totalScore,
        };
      });

      // Average across all judges
      const finalScore =
        judgeScores.length > 0
          ? judgeScores.reduce((sum, js) => sum + js.totalScore, 0) /
            judgeScores.length
          : 0;

      return {
        submissionId: submission.id,
        teamName: submission.teamName,
        finalScore,
        rank: 0, // Will be set after sorting
        judgeScores,
      };
    });

    // Sort by final score descending and assign ranks
    finalScores.sort((a, b) => b.finalScore - a.finalScore);
    finalScores.forEach((fs, index) => {
      fs.rank = index + 1;
    });

    return finalScores;
  }

  /**
   * Get leaderboard for an event
   */
  async getLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
    const finalScores = await this.calculateFinalScores(eventId);

    return finalScores.map((fs) => ({
      rank: fs.rank,
      submissionId: fs.submissionId,
      teamName: fs.teamName,
      finalScore: fs.finalScore,
    }));
  }

  /**
   * Get detailed scores for a submission
   */
  async getSubmissionScores(submissionId: string): Promise<ScoreResponse[]> {
    const scores = await prisma.score.findMany({
      where: { submissionId },
    });

    return scores.map((s) => ({
      id: s.id,
      submissionId: s.submissionId,
      judgeId: s.judgeId,
      rubricId: s.rubricId,
      scores: s.scores as Record<string, number>,
      submittedAt: s.submittedAt,
    }));
  }
}

export const judgingService = new JudgingService();
