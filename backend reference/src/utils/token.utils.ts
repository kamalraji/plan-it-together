import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'email_verification',
    },
    JWT_SECRET,
    {
      expiresIn: '24h', // Email verification tokens expire in 24 hours
    }
  );
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      type: 'password_reset',
    },
    JWT_SECRET,
    {
      expiresIn: '1h', // Password reset tokens expire in 1 hour
    }
  );
}
