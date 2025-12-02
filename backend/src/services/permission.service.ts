import { UserRole } from '@prisma/client';
import prisma from '../config/database';

/**
 * Permission types for sub-roles
 */
export enum Permission {
  // Event management
  CREATE_EVENT = 'CREATE_EVENT',
  UPDATE_EVENT = 'UPDATE_EVENT',
  DELETE_EVENT = 'DELETE_EVENT',
  VIEW_EVENT = 'VIEW_EVENT',

  // Registration management
  MANAGE_REGISTRATIONS = 'MANAGE_REGISTRATIONS',
  VIEW_REGISTRATIONS = 'VIEW_REGISTRATIONS',

  // Attendance
  CHECK_IN_PARTICIPANTS = 'CHECK_IN_PARTICIPANTS',
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',

  // Judging
  SUBMIT_SCORES = 'SUBMIT_SCORES',
  VIEW_SCORES = 'VIEW_SCORES',
  MANAGE_RUBRICS = 'MANAGE_RUBRICS',

  // Communication
  SEND_COMMUNICATIONS = 'SEND_COMMUNICATIONS',
  VIEW_COMMUNICATIONS = 'VIEW_COMMUNICATIONS',

  // Certificates
  GENERATE_CERTIFICATES = 'GENERATE_CERTIFICATES',
  VIEW_CERTIFICATES = 'VIEW_CERTIFICATES',

  // Analytics
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',

  // User management
  MANAGE_USERS = 'MANAGE_USERS',
  APPROVE_ORGANIZERS = 'APPROVE_ORGANIZERS',
}

/**
 * Role-based permission mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Super admin has all permissions
    ...Object.values(Permission),
  ],
  [UserRole.ORGANIZER]: [
    Permission.CREATE_EVENT,
    Permission.UPDATE_EVENT,
    Permission.DELETE_EVENT,
    Permission.VIEW_EVENT,
    Permission.MANAGE_REGISTRATIONS,
    Permission.VIEW_REGISTRATIONS,
    Permission.VIEW_ATTENDANCE,
    Permission.MANAGE_RUBRICS,
    Permission.VIEW_SCORES,
    Permission.SEND_COMMUNICATIONS,
    Permission.VIEW_COMMUNICATIONS,
    Permission.GENERATE_CERTIFICATES,
    Permission.VIEW_CERTIFICATES,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.PARTICIPANT]: [
    Permission.VIEW_EVENT,
  ],
  [UserRole.VOLUNTEER]: [
    Permission.VIEW_EVENT,
    Permission.CHECK_IN_PARTICIPANTS,
    Permission.VIEW_ATTENDANCE,
  ],
  [UserRole.JUDGE]: [
    Permission.VIEW_EVENT,
    Permission.SUBMIT_SCORES,
    Permission.VIEW_SCORES,
  ],
  [UserRole.SPEAKER]: [
    Permission.VIEW_EVENT,
    Permission.VIEW_ATTENDANCE,
  ],
};

class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.some((permission) => rolePermissions.includes(permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.every((permission) => rolePermissions.includes(permission));
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    return ROLE_PERMISSIONS[user.role] || [];
  }

  /**
   * Get all permissions for a role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Validate permission for a user
   * Throws error if user doesn't have permission
   */
  async validatePermission(userId: string, permission: Permission): Promise<void> {
    const hasPermission = await this.hasPermission(userId, permission);

    if (!hasPermission) {
      throw new Error(`User does not have permission: ${permission}`);
    }
  }
}

export default new PermissionService();
