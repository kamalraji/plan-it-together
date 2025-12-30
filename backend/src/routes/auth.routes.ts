import { Router, Request, Response } from 'express';
import { z } from 'zod';
import authService from '../services/auth.service';
import { UserRole } from '@prisma/client';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
  eventCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Kept for backward compatibility during migration; new flows use httpOnly cookie
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const result = await authService.register(validatedData);

    // In a real application, send verification email here
    // For now, return the token in response (for development)
    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        verificationToken: result.verificationToken,
        message: 'Registration successful. Please verify your email.',
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
        code: 'REGISTRATION_FAILED',
        message: error.message || 'Registration failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await authService.login(validatedData);

    const isProd = process.env.NODE_ENV === 'production';

    // Set httpOnly cookies for access and refresh tokens
    res
      .cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      })
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        success: true,
        data: {
          user: result.user,
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

    res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error.message || 'Login failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify user email
 */
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validatedData = verifyEmailSchema.parse(req.body);

    // Verify email
    await authService.verifyEmail(validatedData.token);

    res.json({
      success: true,
      data: {
        message: 'Email verified successfully',
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
        code: 'VERIFICATION_FAILED',
        message: error.message || 'Email verification failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */
router.post('/refresh-token', async (req: Request, res: Response): Promise<void> => {
  try {
    // Prefer httpOnly cookie; fall back to body for backward compatibility
    const cookieHeader = req.headers.cookie;
    let cookieRefreshToken: string | null = null;

    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const [rawKey, rawValue] = part.split('=');
        if (rawKey && rawKey.trim() === 'refreshToken') {
          cookieRefreshToken = decodeURIComponent(rawValue ?? '');
          break;
        }
      }
    }

    const bodyToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined;
    const refreshToken = cookieRefreshToken || bodyToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'No refresh token provided',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Refresh token
    const result = await authService.refreshToken(refreshToken);

    const isProd = process.env.NODE_ENV === 'production';

    res
      .cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        data: {
          user: result.user,
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

    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_REFRESH_FAILED',
        message: error.message || 'Token refresh failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
