import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { reportExportService } from '../services/report-export.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/analytics/events/:eventId/registrations-over-time
 * Get registration counts over time for an event
 * Requirements: 15.1
 */
router.get(
  '/events/:eventId/registrations-over-time',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const data = await analyticsService.calculateRegistrationsOverTime(eventId);

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: error.message || 'Failed to fetch registration analytics',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/analytics/events/:eventId/check-in-rates
 * Get check-in rates by session for an event
 * Requirements: 15.2
 */
router.get(
  '/events/:eventId/check-in-rates',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const data = await analyticsService.calculateCheckInRatesBySession(eventId);

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: error.message || 'Failed to fetch check-in analytics',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/analytics/events/:eventId/score-distributions
 * Get score distributions for an event
 * Requirements: 15.3
 */
router.get(
  '/events/:eventId/score-distributions',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const data = await analyticsService.calculateScoreDistributions(eventId);

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: error.message || 'Failed to fetch score analytics',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/analytics/events/:eventId/judge-participation
 * Get judge participation data for an event
 * Requirements: 15.3
 */
router.get(
  '/events/:eventId/judge-participation',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const data = await analyticsService.aggregateJudgeParticipation(eventId);

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: error.message || 'Failed to fetch judge participation analytics',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/analytics/events/:eventId/comprehensive
 * Get comprehensive analytics report for an event
 * Requirements: 15.1, 15.2, 15.3
 */
router.get(
  '/events/:eventId/comprehensive',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const report = await analyticsService.getComprehensiveReport(eventId);

      const response: ApiResponse = {
        success: true,
        data: report,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: error.message || 'Failed to fetch comprehensive analytics',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/analytics/events/:eventId/export
 * Export analytics report in CSV or PDF format
 * Requirements: 15.4
 * Query params: format (CSV or PDF)
 */
router.get(
  '/events/:eventId/export',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const format = (req.query.format as string)?.toUpperCase() || 'CSV';

      if (format !== 'CSV' && format !== 'PDF') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'Format must be either CSV or PDF',
            timestamp: new Date().toISOString(),
          },
        };
        return res.status(400).json(response);
      }

      const result = await reportExportService.exportReport(
        eventId,
        format as 'CSV' | 'PDF'
      );

      // Set appropriate headers for file download
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: error.message || 'Failed to export analytics report',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

export default router;
