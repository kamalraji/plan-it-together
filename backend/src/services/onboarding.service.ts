import { UserRole, UserStatus } from '@prisma/client';
import prisma from '../config/database';

export interface ProfileData {
  name?: string;
  bio?: string;
  organization?: string;
  phone?: string;
  [key: string]: any;
}

class OnboardingService {
  /**
   * Approve an Organizer account (Super Admin only)
   */
  async approveOrganizer(userId: string, approvedBy: string): Promise<void> {
    // Verify approver is Super Admin
    const approver = await prisma.user.findUnique({
      where: { id: approvedBy },
    });

    if (!approver || approver.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only Super Admins can approve Organizers');
    }

    // Get the user to approve
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== UserRole.ORGANIZER) {
      throw new Error('User is not an Organizer');
    }

    if (!user.emailVerified) {
      throw new Error('User email must be verified before approval');
    }

    // Update user status to ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
      },
    });
  }

  /**
   * Complete user profile
   */
  async completeProfile(userId: string, profileData: ProfileData): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user with profile data
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: profileData.name || user.name,
        // Additional profile fields would be stored in a separate Profile table
        // For now, we're just updating the name
      },
    });
  }

  /**
   * Check if user needs to complete profile
   */
  async needsProfileCompletion(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // For Organizers, check if they're active and have completed basic info
    if (user.role === UserRole.ORGANIZER) {
      return user.status === UserStatus.ACTIVE && (!user.name || user.name.length < 2);
    }

    // For Participants, check if they have completed basic info
    if (user.role === UserRole.PARTICIPANT) {
      return !user.name || user.name.length < 2;
    }

    return false;
  }

  /**
   * Get onboarding status for a user
   */
  async getOnboardingStatus(userId: string): Promise<{
    emailVerified: boolean;
    profileCompleted: boolean;
    accountActive: boolean;
    needsApproval: boolean;
    canAccessDashboard: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const profileCompleted = !!(user.name && user.name.length >= 2);
    const needsApproval = user.role === UserRole.ORGANIZER && user.status === UserStatus.PENDING;
    const accountActive = user.status === UserStatus.ACTIVE;

    // Participants can access dashboard after email verification
    // Organizers can access dashboard after approval and profile completion
    let canAccessDashboard = false;
    if (user.role === UserRole.PARTICIPANT) {
      canAccessDashboard = user.emailVerified && accountActive;
    } else if (user.role === UserRole.ORGANIZER) {
      canAccessDashboard = user.emailVerified && accountActive && profileCompleted;
    }

    return {
      emailVerified: user.emailVerified,
      profileCompleted,
      accountActive,
      needsApproval,
      canAccessDashboard,
    };
  }

  /**
   * Get pending Organizer approvals (Super Admin only)
   */
  async getPendingOrganizers(requesterId: string): Promise<any[]> {
    // Verify requester is Super Admin
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester || requester.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Only Super Admins can view pending Organizers');
    }

    // Get all pending Organizers with verified emails
    const pendingOrganizers = await prisma.user.findMany({
      where: {
        role: UserRole.ORGANIZER,
        status: UserStatus.PENDING,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return pendingOrganizers;
  }

  /**
   * Assign sub-role to a user
   */
  async assignSubRole(userId: string, subRole: UserRole, assignedBy: string): Promise<void> {
    // Verify assigner is Organizer or Super Admin
    const assigner = await prisma.user.findUnique({
      where: { id: assignedBy },
    });

    if (
      !assigner ||
      (assigner.role !== UserRole.ORGANIZER && assigner.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new Error('Only Organizers and Super Admins can assign sub-roles');
    }

    // Verify sub-role is valid
    const validSubRoles: UserRole[] = [UserRole.VOLUNTEER, UserRole.JUDGE, UserRole.SPEAKER];
    if (!validSubRoles.includes(subRole)) {
      throw new Error('Invalid sub-role');
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: subRole,
      },
    });
  }
}

export default new OnboardingService();
