import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import onboardingService from '../services/onboarding.service';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const approveOrganizerSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

const completeProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().optional(),
  organization: z.string().optional(),
  phone: z.string().optional(),
});

const assignSubRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  subRole: z.nativeEnum(UserRole),
});

/**
 * POST /api/onboarding/approve-organizer
 * Approve an Organizer account (Super Admin only)
 */
router.post(
  '/approve-organizer',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = approveOrganizerSchema.parse(req.body);

      await onboardingService.approveOrganizer(validatedData.userId, req.user!.userId);

      res.json({
        success: true,
        data: {
          message: 'Organizer approved successfully',
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'APPROVAL_FAILED',
          message: error.message || 'Failed to approve organizer',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/onboarding/pending-organizers
 * Get list of pending Organizer approvals (Super Admin only)
 */
router.get(
  '/pending-organizers',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const pendingOrganizers = await onboardingService.getPendingOrganizers(req.user!.userId);

      res.json({
        success: true,
        data: pendingOrganizers,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error.message || 'Failed to fetch pending organizers',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/onboarding/complete-profile
 * Complete user profile
 */
router.post(
  '/complete-profile',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = completeProfileSchema.parse(req.body);

      await onboardingService.completeProfile(req.user!.userId, validatedData);

      res.json({
        success: true,
        data: {
          message: 'Profile completed successfully',
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: error.message || 'Failed to complete profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/onboarding/status
 * Get onboarding status for current user
 */
router.get(
  '/status',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const status = await onboardingService.getOnboardingStatus(req.user!.userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'STATUS_FETCH_FAILED',
          message: error.message || 'Failed to fetch onboarding status',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/onboarding/assign-sub-role
 * Assign sub-role to a user (Organizer or Super Admin only)
 */
router.post(
  '/assign-sub-role',
  authenticate,
  authorize(UserRole.ORGANIZER, UserRole.SUPER_ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = assignSubRoleSchema.parse(req.body);

      await onboardingService.assignSubRole(
        validatedData.userId,
        validatedData.subRole,
        req.user!.userId
      );

      res.json({
        success: true,
        data: {
          message: 'Sub-role assigned successfully',
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'ROLE_ASSIGNMENT_FAILED',
          message: error.message || 'Failed to assign sub-role',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;
