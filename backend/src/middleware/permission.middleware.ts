import { Request, Response, NextFunction } from 'express';
import permissionService, { Permission } from '../services/permission.service';

/**
 * Permission middleware factory
 * Checks if authenticated user has required permission(s)
 */
export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    try {
      // Check if user has all required permissions
      const hasPermission = await permissionService.hasAllPermissions(
        req.user.userId,
        permissions
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Permission check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    try {
      // Check if user has any of the required permissions
      const hasPermission = await permissionService.hasAnyPermission(
        req.user.userId,
        permissions
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Permission check failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}
