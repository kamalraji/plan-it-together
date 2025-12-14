import { PrismaClient, OrganizationCategory, VerificationStatus } from '@prisma/client';
import {
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  OrganizationResponse,
  OrganizationAnalytics,
} from '../types';
import { communicationService } from './communication.service';

const prisma = new PrismaClient();

export class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(
    orgData: CreateOrganizationDTO
  ): Promise<OrganizationResponse> {
    const { name, description, category, branding, socialLinks } = orgData;

    // Generate unique page URL
    const pageUrl = await this.generateUniquePageUrl(name);

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        description,
        category,
        branding: branding as any,
        socialLinks: socialLinks as any,
        pageUrl,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    return this.mapOrganizationToResponse(organization);
  }

  /**
   * Update organization details
   */
  async updateOrganization(
    orgId: string,
    updates: UpdateOrganizationDTO
  ): Promise<OrganizationResponse> {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.category && { category: updates.category }),
        ...(updates.branding && { branding: updates.branding as any }),
        ...(updates.socialLinks && { socialLinks: updates.socialLinks as any }),
      },
    });

    return this.mapOrganizationToResponse(updated);
  }

  /**
   * Get organization by ID
   */
  async getOrganization(orgId: string): Promise<OrganizationResponse> {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            events: true,
            follows: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return this.mapOrganizationToResponse(organization);
  }

  /**
   * Get organization by page URL
   */
  async getOrganizationByUrl(pageUrl: string): Promise<OrganizationResponse> {
    const organization = await prisma.organization.findUnique({
      where: { pageUrl },
      include: {
        _count: {
          select: {
            events: true,
            follows: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return this.mapOrganizationToResponse(organization);
  }

  /**
   * Verify or reject an organization
   */
  async verifyOrganization(
    orgId: string,
    approved: boolean,
    reason?: string
  ): Promise<OrganizationResponse> {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    if (organization.verificationStatus !== VerificationStatus.PENDING) {
      throw new Error('Organization has already been reviewed');
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        verificationStatus: approved
          ? VerificationStatus.VERIFIED
          : VerificationStatus.REJECTED,
        rejectionReason: !approved ? reason : null,
      },
    });

    // Send notification to organization admins
    await this.notifyOrganizationAdmins(orgId, approved, reason);

    return this.mapOrganizationToResponse(updated);
  }

  /**
   * Invite a user to be an admin of an organization
   */
  async inviteAdmin(
    orgId: string,
    inviterUserId: string,
    inviteeEmail: string,
    role: 'OWNER' | 'ADMIN' = 'ADMIN'
  ): Promise<{ success: boolean; message: string }> {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if inviter is an admin
    const isInviterAdmin = await this.isOrganizationAdmin(orgId, inviterUserId);
    if (!isInviterAdmin) {
      throw new Error('You do not have permission to invite admins to this organization');
    }

    // Check if user exists
    const inviteeUser = await prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    if (!inviteeUser) {
      throw new Error('User with this email does not exist');
    }

    // Check if user is already an admin
    const existingAdmin = await prisma.organizationAdmin.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: inviteeUser.id,
        },
      },
    });

    if (existingAdmin) {
      throw new Error('User is already an admin of this organization');
    }

    // Send invitation email
    const inviterUser = await prisma.user.findUnique({
      where: { id: inviterUserId },
      select: { name: true, email: true },
    });

    const subject = `Invitation to join "${organization.name}" as an admin`;
    const body = `Hello ${inviteeUser.name},

${inviterUser?.name || 'Someone'} has invited you to become an admin of "${organization.name}" on Thittam1Hub.

As an admin, you will be able to:
- Manage organization profile and branding
- Create and manage events under the organization
- View organization analytics
- Manage other team members

To accept this invitation, please log in to your Thittam1Hub account and you will see the organization in your admin panel.

Organization: ${organization.name}
Role: ${role}

Best regards,
Thittam1Hub Team`;

    try {
      await communicationService.sendEmail({
        to: [inviteeUser.email],
        subject,
        body,
      });

      // Automatically add the user as admin after sending invitation
      await this.addAdmin(orgId, inviteeUser.id, role);

      return {
        success: true,
        message: `Invitation sent to ${inviteeEmail} and admin access granted`,
      };
    } catch (error: any) {
      console.error('Failed to send invitation email:', error);
      // Still add the admin even if email fails
      await this.addAdmin(orgId, inviteeUser.id, role);
      
      return {
        success: true,
        message: `Admin access granted to ${inviteeEmail} (email notification failed)`,
      };
    }
  }

  /**
   * Add a user as an admin to an organization
   */
  async addAdmin(
    orgId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' = 'ADMIN'
  ): Promise<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    addedAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }> {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already an admin
    const existingAdmin = await prisma.organizationAdmin.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (existingAdmin) {
      throw new Error('User is already an admin of this organization');
    }

    const admin = await prisma.organizationAdmin.create({
      data: {
        organizationId: orgId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: admin.id,
      organizationId: admin.organizationId,
      userId: admin.userId,
      role: admin.role,
      addedAt: admin.addedAt,
      user: admin.user,
    };
  }

  /**
   * Remove an admin from an organization
   */
  async removeAdmin(orgId: string, userId: string): Promise<boolean> {
    const admin = await prisma.organizationAdmin.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    // Check if this is the only owner
    if (admin.role === 'OWNER') {
      const ownerCount = await prisma.organizationAdmin.count({
        where: {
          organizationId: orgId,
          role: 'OWNER',
        },
      });

      if (ownerCount === 1) {
        throw new Error('Cannot remove the only owner of the organization');
      }
    }

    await prisma.organizationAdmin.delete({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    return true;
  }

  /**
   * Get organization admins
   */
  async getOrganizationAdmins(orgId: string): Promise<any[]> {
    const admins = await prisma.organizationAdmin.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        addedAt: 'asc',
      },
    });

    return admins.map((admin) => ({
      id: admin.id,
      organizationId: admin.organizationId,
      userId: admin.userId,
      role: admin.role,
      addedAt: admin.addedAt,
      user: admin.user,
    }));
  }

  /**
   * Check if user is an admin of an organization
   */
  async isOrganizationAdmin(orgId: string, userId: string): Promise<boolean> {
    const admin = await prisma.organizationAdmin.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    return !!admin;
  }

  /**
   * Get organization analytics (delegated to analytics service)
   */
  async getOrganizationAnalytics(orgId: string): Promise<OrganizationAnalytics> {
    // Import here to avoid circular dependency
    const { organizationAnalyticsService } = await import('./organization-analytics.service');
    return organizationAnalyticsService.getOrganizationAnalytics(orgId);
  }

  /**
   * List all organizations with filters
   */
  async listOrganizations(filters?: {
    category?: OrganizationCategory;
    verificationStatus?: VerificationStatus;
    limit?: number;
    offset?: number;
  }): Promise<OrganizationResponse[]> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    const organizations = await prisma.organization.findMany({
      where,
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      orderBy: [
        { verificationStatus: 'desc' }, // Verified first
        { followerCount: 'desc' },
      ],
      include: {
        _count: {
          select: {
            events: true,
            follows: true,
          },
        },
      },
    });

    return organizations.map((org) => this.mapOrganizationToResponse(org));
  }

  /**
   * Generate unique page URL from organization name
   */
  private async generateUniquePageUrl(name: string): Promise<string> {
    // Create slug from name
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let pageUrl = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const existing = await prisma.organization.findUnique({
        where: { pageUrl },
      });

      if (!existing) {
        isUnique = true;
      } else {
        pageUrl = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return pageUrl;
  }



  /**
   * Send notification to organization admins about verification status change
   */
  private async notifyOrganizationAdmins(
    orgId: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    try {
      // Get organization details
      const organization = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
          admins: {
            include: {
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!organization || !organization.admins.length) {
        return;
      }

      // Prepare email content
      const subject = approved
        ? `Organization "${organization.name}" has been verified`
        : `Organization "${organization.name}" verification was rejected`;

      const body = approved
        ? `Hello,

Your organization "${organization.name}" has been successfully verified and is now live on Thittam1Hub!

You can now:
- Publish events under your organization
- Build your follower community
- Access organization analytics

Visit your organization page: ${organization.pageUrl}

Best regards,
Thittam1Hub Team`
        : `Hello,

Unfortunately, your organization "${organization.name}" verification was rejected.

Reason: ${reason || 'No specific reason provided'}

You can update your organization details and resubmit for verification.

Best regards,
Thittam1Hub Team`;

      // Send email to all admins
      const adminEmails = organization.admins.map((admin) => admin.user.email);
      
      await communicationService.sendEmail({
        to: adminEmails,
        subject,
        body,
      });
    } catch (error) {
      console.error('Failed to send verification notification:', error);
      // Don't throw error to avoid breaking the verification process
    }
  }

  /**
   * Map database organization to response format
   */
  private mapOrganizationToResponse(organization: any): OrganizationResponse {
    return {
      id: organization.id,
      name: organization.name,
      description: organization.description,
      category: organization.category,
      verificationStatus: organization.verificationStatus,
      branding: organization.branding as any,
      socialLinks: organization.socialLinks as any,
      pageUrl: organization.pageUrl,
      followerCount: organization.followerCount,
      eventCount: organization._count?.events || 0,
      rejectionReason: organization.rejectionReason,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}

export const organizationService = new OrganizationService();
