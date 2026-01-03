import { Router, Request, Response } from 'express';
import { communicationService } from '../services/communication.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { Permission } from '../services/permission.service';

const router = Router();

/**
 * POST /api/communications/send-email
 * Send a single email
 */
router.post(
  '/send-email',
  authenticate,
  requirePermission(Permission.SEND_COMMUNICATIONS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { to, subject, body, templateId, variables } = req.body;

      if (!to || !Array.isArray(to) || to.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Recipients (to) must be a non-empty array',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (!subject || !body) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Subject and body are required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await communicationService.sendEmail({
        to,
        subject,
        body,
        templateId,
        variables,
      });

      if (result.success) {
        res.json({
          success: true,
          data: result,
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: result.error || 'Failed to send email',
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'EMAIL_SEND_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/communications/send-bulk-email
 * Send bulk email to segmented recipients
 */
router.post(
  '/send-bulk-email',
  authenticate,
  requirePermission(Permission.SEND_COMMUNICATIONS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId, subject, body, templateId, segmentCriteria } = req.body;

      if (!eventId || !subject || !body || !segmentCriteria) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'eventId, subject, body, and segmentCriteria are required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const result = await communicationService.sendBulkEmail({
        eventId,
        subject,
        body,
        templateId,
        segmentCriteria,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_EMAIL_SEND_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/communications/segment-recipients
 * Get segmented recipients without sending email
 */
router.post(
  '/segment-recipients',
  authenticate,
  requirePermission(Permission.VIEW_COMMUNICATIONS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId, segmentCriteria } = req.body;

      if (!eventId || !segmentCriteria) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'eventId and segmentCriteria are required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const recipients = await communicationService.segmentRecipients(
        eventId,
        segmentCriteria
      );

      res.json({
        success: true,
        data: {
          count: recipients.length,
          recipients,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SEGMENTATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/communications/templates
 * Get email templates
 */
router.get(
  '/templates',
  authenticate,
  requirePermission(Permission.VIEW_COMMUNICATIONS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.query;

      const templates = await communicationService.getEmailTemplates(
        eventId as string
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'TEMPLATE_FETCH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/communications/events/:eventId/logs
 * Get communication logs for an event
 */
router.get(
  '/events/:eventId/logs',
  authenticate,
  requirePermission(Permission.VIEW_COMMUNICATIONS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;

      const logs = await communicationService.getCommunicationLogs(eventId);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'LOG_FETCH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/communications/logs/:logId
 * Get a specific communication log
 */
router.get(
  '/logs/:logId',
  authenticate,
  requirePermission(Permission.VIEW_COMMUNICATIONS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { logId } = req.params;

      const log = await communicationService.getCommunicationLog(logId);

      if (!log) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LOG_NOT_FOUND',
            message: 'Communication log not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.json({
        success: true,
        data: log,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'LOG_FETCH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;
