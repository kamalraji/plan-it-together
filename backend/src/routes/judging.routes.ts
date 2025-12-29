import { Router, Request, Response } from 'express';
import { judgingService } from '../services/judging.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  CreateRubricDTO,
  CreateSubmissionDTO,
  SubmitScoreDTO,
} from '../types';

const router = Router();

/**
 * POST /api/judging/rubrics
 * Create a rubric for an event
 * Requires: ORGANIZER role
 */
router.post(
  '/rubrics',
  authenticate,
  authorize(['ORGANIZER']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data: CreateRubricDTO = req.body;

      // Validate required fields
      if (!data.eventId || !data.criteria || !Array.isArray(data.criteria)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'eventId and criteria array are required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate criteria structure
      for (const criterion of data.criteria) {
        if (
          !criterion.name ||
          typeof criterion.weight !== 'number' ||
          typeof criterion.maxScore !== 'number'
        ) {
          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message:
                'Each criterion must have name, weight, and maxScore fields',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      const rubric = await judgingService.createRubric(data);

      res.status(201).json({
        success: true,
        data: rubric,
      });
    } catch (error: any) {
      console.error('Error creating rubric:', error);
      res.status(400).json({
        error: {
          code: 'RUBRIC_CREATION_ERROR',
          message: error.message || 'Failed to create rubric',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/judging/rubrics/:eventId
 * Get rubric for an event
 * Requires: Authentication
 */
router.get(
  '/rubrics/:eventId',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;

      const rubric = await judgingService.getRubric(eventId);

      if (!rubric) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Rubric not found for this event',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.json({
        success: true,
        data: rubric,
      });
    } catch (error: any) {
      console.error('Error fetching rubric:', error);
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch rubric',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/judging/submissions
 * Create a submission for judging
 * Requires: ORGANIZER role
 */
router.post(
  '/submissions',
  authenticate,
  authorize(['ORGANIZER']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data: CreateSubmissionDTO = req.body;

      // Validate required fields
      if (!data.eventId || !data.rubricId || !data.teamName) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'eventId, rubricId, and teamName are required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const submission = await judgingService.createSubmission(data);

      res.status(201).json({
        success: true,
        data: submission,
      });
    } catch (error: any) {
      console.error('Error creating submission:', error);
      res.status(400).json({
        error: {
          code: 'SUBMISSION_CREATION_ERROR',
          message: error.message || 'Failed to create submission',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/judging/submissions/judge/:eventId
 * Get submissions assigned to the authenticated judge
 * Requires: JUDGE role
 */
router.get(
  '/submissions/judge/:eventId',
  authenticate,
  authorize(['JUDGE']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      const judgeId = (req as any).user.userId;

      const submissions = await judgingService.getJudgeSubmissions(
        judgeId,
        eventId
      );

      res.json({
        success: true,
        data: submissions,
      });
    } catch (error: any) {
      console.error('Error fetching judge submissions:', error);
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch submissions',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/judging/scores
 * Submit scores for a submission
 * Requires: JUDGE role
 */
router.post(
  '/scores',
  authenticate,
  authorize(['JUDGE']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data: SubmitScoreDTO = {
        ...req.body,
        judgeId: (req as any).user.userId,
      };

      // Validate required fields
      if (!data.submissionId || !data.scores) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'submissionId and scores are required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const score = await judgingService.submitScore(data);

      res.status(201).json({
        success: true,
        data: score,
      });
    } catch (error: any) {
      console.error('Error submitting score:', error);
      res.status(400).json({
        error: {
          code: 'SCORE_SUBMISSION_ERROR',
          message: error.message || 'Failed to submit score',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/judging/leaderboard/:eventId
 * Get leaderboard for an event
 * Public endpoint (no authentication required)
 */
router.get('/leaderboard/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    // Check if leaderboard is enabled for this event
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { leaderboardEnabled: true },
    });

    if (!event) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!event.leaderboardEnabled) {
      return res.status(403).json({
        error: {
          code: 'LEADERBOARD_DISABLED',
          message: 'Leaderboard is not enabled for this event',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const leaderboard = await judgingService.getLeaderboard(eventId);

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch leaderboard',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/judging/scores/:submissionId
 * Get all scores for a submission
 * Requires: ORGANIZER or JUDGE role
 */
router.get(
  '/scores/:submissionId',
  authenticate,
  requireRole(['ORGANIZER', 'JUDGE']),
  async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params;

      const scores = await judgingService.getSubmissionScores(submissionId);

      res.json({
        success: true,
        data: scores,
      });
    } catch (error: any) {
      console.error('Error fetching scores:', error);
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch scores',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/judging/final-scores/:eventId
 * Get final calculated scores for all submissions
 * Requires: ORGANIZER role
 */
router.get(
  '/final-scores/:eventId',
  authenticate,
  requireRole(['ORGANIZER']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const finalScores = await judgingService.calculateFinalScores(eventId);

      res.json({
        success: true,
        data: finalScores,
      });
    } catch (error: any) {
      console.error('Error calculating final scores:', error);
      res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'Failed to calculate final scores',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;
