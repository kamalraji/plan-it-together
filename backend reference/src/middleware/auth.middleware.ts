import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import authService from '../services/auth.service';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Helper to read a cookie from the incoming request without relying on external middleware.
 */
function getCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  const parts = header.split(';');
  for (const part of parts) {
    const [rawKey, rawValue] = part.split('=');
    if (!rawKey) continue;
    if (rawKey.trim() === name) {
      return decodeURIComponent(rawValue ?? '');
    }
  }
  return null;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Prefer httpOnly cookie-based authentication for access tokens
    const cookieToken = getCookie(req, 'accessToken');

    // For backward compatibility, fall back to Authorization: Bearer header if no cookie is present
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;

    const token = cookieToken || bearerToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Verify token
    const payload = authService.verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message || 'Invalid token',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Authorization middleware factory
 * Checks if user has required role(s)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    if (!allowedRoles.includes(req.user.role)) {
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
  };
}

/**
 * Check if user is an organizer or super admin
 */
export function isOrganizerOrAdmin(req: Request, res: Response, next: NextFunction): void {
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

  if (req.user.role !== UserRole.ORGANIZER && req.user.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Organizer or admin access required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  next();
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't require it
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Prefer cookie-based token when available
    const cookieToken = getCookie(req, 'accessToken');

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : undefined;

    const token = cookieToken || bearerToken;

    if (token) {
      const payload = authService.verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
}
