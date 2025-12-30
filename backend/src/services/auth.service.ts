import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/database';
import { generateEmailVerificationToken } from '../utils/token.utils';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  eventCode?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterDTO): Promise<{ user: UserProfile; verificationToken: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Determine initial status based on role
    // Organizers start as PENDING (need admin approval)
    // Participants start as PENDING (need email verification)
    const status = UserStatus.PENDING;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
        status,
        emailVerified: false,
      },
    });

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(user.id);

    return {
      user: this.toUserProfile(user),
      verificationToken,
    };
  }

  /**
   * Login user and generate tokens
   */
  async login(credentials: LoginDTO): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new Error('Account is suspended');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserProfile(user),
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };

      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      // Update user email verification status
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { emailVerified: true },
      });

      // For Participants, activate account after email verification
      if (user.role === UserRole.PARTICIPANT && user.status === UserStatus.PENDING) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.ACTIVE },
        });
      }

      return true;
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === UserStatus.SUSPENDED) {
        throw new Error('Account is suspended');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = this.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: this.toUserProfile(user),
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    }) as string;
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    }) as string;
  }

  /**
   * Convert User to UserProfile
   */
  private toUserProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Verify JWT token and return payload
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export default new AuthService();
