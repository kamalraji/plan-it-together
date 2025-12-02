import { PrismaClient, OrganizationCategory, VerificationStatus } from '@prisma/client';
import {
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
  OrganizationResponse,
  OrganizationAnalytics,
} from '../types';
import { randomBytes } from 'crypto';

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

    // TODO: Send notification to organization admins

    return this.mapOrganizationToResponse(updated);
  }

  /**
   * Add an admin to an organization
   */
  async addAdmin(orgId: string, userId: string, role: 'OWNER' | 'ADMIN' = 'ADMIN'): Promise<any> {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
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
   * Get organization analytics
   */
  async getOrganizationAnalytics(orgId: string): Promise<OrganizationAnalytics> {
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        events: {
          include: {
            registrations: true,
            _count: {
              select: {
                registrations: true,
              },
            },
          },
        },
        follows: {
          orderBy: {
            followedAt: 'asc',
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Calculate total registrations across all events
    const totalRegistrations = organization.events.reduce(
      (sum, event) => sum + event.registrations.length,
      0
    );

    // Calculate follower growth (simplified - by month)
    const followerGrowth = this.calculateFollowerGrowth(organization.follows);

    // Calculate event performance
    const eventPerformance = organization.events.map((event) => ({
      eventId: event.id,
      eventName: event.name,
      registrationCount: event.registrations.length,
      // Attendance rate would require attendance data
    }));

    return {
      totalEvents: organization.events.length,
      totalFollowers: organization.followerCount,
      totalRegistrations,
      followerGrowth,
      eventPerformance,
      pageViews: 0, // Would need to implement page view tracking
    };
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
   * Calculate follower growth over time
   */
  private calculateFollowerGrowth(follows: any[]): Record<string, number> {
    const growth: Record<string, number> = {};

    follows.forEach((follow) => {
      const monthKey = follow.followedAt.toISOString().substring(0, 7); // YYYY-MM
      growth[monthKey] = (growth[monthKey] || 0) + 1;
    });

    return growth;
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
