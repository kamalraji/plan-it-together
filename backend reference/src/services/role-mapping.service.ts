import { UserRole } from '@prisma/client';

/**
 * App-level roles used by the Lovable Cloud / database layer.
 *
 * These are intentionally coarse-grained and are mapped from the
 * more detailed Prisma UserRole enum used in the Node backend:
 *
 *  SUPER_ADMIN  -> 'admin'
 *  ORGANIZER    -> 'moderator'
 *  PARTICIPANT  -> 'user'
 *  VOLUNTEER    -> 'user'
 *  JUDGE        -> 'user'
 *  SPEAKER      -> 'user'
 */
export type AppRole =
  | 'admin'
  | 'organizer'
  | 'participant'
  | 'judge'
  | 'volunteer'
  | 'speaker';

/**
 * Map a Prisma UserRole (used in the Node backend + frontend) to the
 * app_role values used by the database / RLS policies.
 */
export function mapUserRoleToAppRole(userRole: UserRole): AppRole {
  switch (userRole) {
    case UserRole.SUPER_ADMIN:
      return 'admin';
    case UserRole.ORGANIZER:
      return 'organizer';
    case UserRole.PARTICIPANT:
      return 'participant';
    case UserRole.VOLUNTEER:
      return 'volunteer';
    case UserRole.JUDGE:
      return 'judge';
    case UserRole.SPEAKER:
      return 'speaker';
    default:
      return 'participant';
  }
}
