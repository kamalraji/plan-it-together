import { Router, Request, Response } from 'express';
import { registrationService } from '../services/registration.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { RegistrationStatus, UserRole } from '@prisma/client';

const router = Router();

/**
 * Register for an event
 * POST /api/registrations
 */
router.post(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId, formResponses } = req.body;
      const userId = (req as any).user.userId;

      if (!eventId || !formResponses) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Event ID and form responses are required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const registration = await registrationService.registerParticipant({
        eventId,
        userId,
        formResponses,
      });

      res.status(201).json({
        success: true,
        data: registration,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get registration by ID
 * GET /api/registrations/:id
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const registration = await registrationService.getRegistration(id);

      res.json({
        success: true,
        data: registration,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Update registration status
 * PUT /api/registrations/:id/status
 */
router.put(
  '/:id/status',
  authenticate,
  authorize([UserRole.ORGANIZER, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(RegistrationStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid status is required',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const registration = await registrationService.updateRegistrationStatus(
        id,
        status as RegistrationStatus
      );

      res.json({
        success: true,
        data: registration,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get event registrations
 * GET /api/events/:eventId/registrations
 */
router.get(
  '/events/:eventId',
  authenticate,
  authorize([UserRole.ORGANIZER, UserRole.SUPER_ADMIN, UserRole.VOLUNTEER]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      const { status } = req.query;

      const registrations = await registrationService.getEventRegistrations(
        eventId,
        status as RegistrationStatus | undefined
      );

      res.json({
        success: true,
        data: registrations,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get waitlist for an event
 * GET /api/events/:eventId/waitlist
 */
router.get(
  '/events/:eventId/waitlist',
  authenticate,
  authorize([UserRole.ORGANIZER, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { eventId } = req.params;
      const waitlist = await registrationService.getWaitlist(eventId);

      res.json({
        success: true,
        data: waitlist,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Approve waitlist entry
 * POST /api/registrations/:id/approve
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize([UserRole.ORGANIZER, UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const registration = await registrationService.approveWaitlistEntry(id);

      res.json({
        success: true,
        data: registration,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'APPROVAL_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Cancel registration
 * DELETE /api/registrations/:id
 */
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const registration = await registrationService.cancelRegistration(id);

      res.json({
        success: true,
        data: registration,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * Get user's registrations
 * GET /api/registrations/user/me
 */
router.get(
  '/user/me',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const registrations = await registrationService.getUserRegistrations(userId);

      res.json({
        success: true,
        data: registrations,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;
