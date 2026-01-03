import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { syncUserAppRole } from '../services/app-role-sync.service';

const router = Router();

const updateAppRoleSchema = z.object({
  appRole: z.enum(['admin', 'moderator', 'user']),
});

type AppRole = z.infer<typeof updateAppRoleSchema>['appRole'];

const APP_ROLE_TO_USER_ROLE: Record<AppRole, UserRole> = {
  admin: UserRole.SUPER_ADMIN,
  moderator: UserRole.ORGANIZER,
  user: UserRole.PARTICIPANT,
};

/**
 * GET /api/admin/users
 * List all users for Super Admins to manage high-level roles.
 */
router.get(
  '/users',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ADMIN_USERS_FETCH_FAILED',
          message: error.message || 'Failed to fetch users',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * PATCH /api/admin/users/:userId/app-role
 * Update a user's high-level app_role (admin/moderator/user).
 */
router.patch(
  '/users/:userId/app-role',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const validatedBody = updateAppRoleSchema.parse(req.body);

      const newUserRole = APP_ROLE_TO_USER_ROLE[validatedBody.appRole];

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: newUserRole },
      });

      await syncUserAppRole(userId, newUserRole);

      res.json({
        success: true,
        data: {
          user: updatedUser,
          appRole: validatedBody.appRole,
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

      res.status(500).json({
        success: false,
        error: {
          code: 'APP_ROLE_UPDATE_FAILED',
          message: error.message || 'Failed to update app role',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;
