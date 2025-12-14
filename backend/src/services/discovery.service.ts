import { PrismaClient, EventVisibility } from '@prisma/client';
import {
  SearchOrganizationsDTO,
  OrganizationResponse,
  EventResponse,
  FollowResponse,
} from '../types';

const prisma = new PrismaClient();

export class DiscoveryService {
  /**
   * Search organizations with filters
   */
  async searchOrganizations(
    query: SearchOrganizationsDTO
  ): Promise<OrganizationResponse[]> {
    const where: any = {};

    // Text search on name and description
    if (query.query) {
      where.OR = [
        { name: { contains: query.query, mode: 'insensitive' } },
        { description: { contains: query.query, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (query.category) {
      where.category = query.category;
    }

    // Filter by verification status
    if (query.verifiedOnly) {
      where.verificationStatus = 'VERIFIED';
    }

    const organizations = await prisma.organization.findMany({
      where,
      take: query.limit || 20,
      skip: query.offset || 0,
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
   * Get events for an organization
   */
  async getOrganizationEvents(
    orgId: string,
    userId?: string,
    visibility?: EventVisibility
  ): Promise<EventResponse[]> {
    const where: any = { organizationId: orgId };

    // If visibility is specified, filter by it
    if (visibility) {
      where.visibility = visibility;
    } else {
      // Default: show public events
      // If user is an org member, also show private events
      if (userId) {
        const isAdmin = await this.isOrganizationMember(orgId, userId);
        if (isAdmin) {
          where.visibility = {
            in: [EventVisibility.PUBLIC, EventVisibility.PRIVATE],
          };
        } else {
          where.visibility = EventVisibility.PUBLIC;
        }
      } else {
        where.visibility = EventVisibility.PUBLIC;
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: [
        { startDate: 'asc' },
      ],
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            pageUrl: true,
            branding: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Separate upcoming and past events
    const now = new Date();
    const upcomingEvents = events.filter((e) => e.startDate >= now);
    const pastEvents = events.filter((e) => e.startDate < now);

    // Return upcoming first, then past
    return [...upcomingEvents, ...pastEvents].map((event) =>
      this.mapEventToResponse(event)
    );
  }

  /**
   * Follow an organization
   */
  async followOrganization(userId: string, orgId: string): Promise<FollowResponse> {
    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (existingFollow) {
      throw new Error('Already following this organization');
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        userId,
        organizationId: orgId,
      },
    });

    // Increment follower count
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        followerCount: {
          increment: 1,
        },
      },
    });

    return {
      id: follow.id,
      userId: follow.userId,
      organizationId: follow.organizationId,
      followedAt: follow.followedAt,
    };
  }

  /**
   * Unfollow an organization
   */
  async unfollowOrganization(userId: string, orgId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    if (!follow) {
      throw new Error('Not following this organization');
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    // Decrement follower count
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        followerCount: {
          decrement: 1,
        },
      },
    });

    return true;
  }

  /**
   * Get organizations followed by a user
   */
  async getFollowedOrganizations(userId: string): Promise<OrganizationResponse[]> {
    const follows = await prisma.follow.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                events: true,
                follows: true,
              },
            },
            events: {
              where: {
                visibility: EventVisibility.PUBLIC,
                startDate: {
                  gte: new Date(),
                },
              },
              take: 3,
              orderBy: {
                startDate: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        followedAt: 'desc',
      },
    });

    return follows.map((follow) => ({
      ...this.mapOrganizationToResponse(follow.organization),
      latestEvents: follow.organization.events.map((e) => this.mapEventToResponse(e)),
    }));
  }

  /**
   * Check if user is following an organization
   */
  async isFollowing(userId: string, orgId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Notify followers about a new event
   */
  async notifyFollowers(orgId: string, eventId: string): Promise<void> {
    const followers = await prisma.follow.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: true,
      },
    });

    if (!event || !event.organization) {
      throw new Error('Event or organization not found');
    }

    if (followers.length === 0) {
      console.log('No followers to notify');
      return;
    }

    // Import communication service dynamically to avoid circular dependency
    const { communicationService } = await import('./communication.service');

    // Prepare email content
    const subject = `New event from ${event.organization.name}: ${event.name}`;
    const body = `Hello {{userName}},

${event.organization.name} has published a new event that you might be interested in!

Event: ${event.name}
Date: ${event.startDate.toLocaleDateString()}
Mode: ${event.mode}

${event.description}

You can view more details and register for this event at: ${event.landingPageUrl}

Best regards,
Thittam1Hub Team

---
You are receiving this email because you follow ${event.organization.name}. You can unfollow them at any time from their organization page.`;

    // Send notifications to all followers
    let successCount = 0;
    let failureCount = 0;

    for (const follower of followers) {
      try {
        const result = await communicationService.sendEmail({
          to: [follower.user.email],
          subject,
          body: body.replace('{{userName}}', follower.user.name),
        });

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          console.error(`Failed to send notification to ${follower.user.email}:`, result.error);
        }
      } catch (error) {
        failureCount++;
        console.error(`Error sending notification to ${follower.user.email}:`, error);
      }
    }

    // Log the notification delivery
    console.log(`Follower notifications sent: ${successCount} successful, ${failureCount} failed out of ${followers.length} total followers`);

    // Store notification delivery tracking (optional - could be added to database)
    try {
      await this.trackNotificationDelivery(orgId, eventId, followers.length, successCount, failureCount);
    } catch (error) {
      console.error('Failed to track notification delivery:', error);
    }
  }

  /**
   * Track notification delivery for analytics
   */
  private async trackNotificationDelivery(
    orgId: string,
    eventId: string,
    totalFollowers: number,
    successCount: number,
    failureCount: number
  ): Promise<void> {
    // This could be stored in a separate notifications table for analytics
    // For now, we'll just log it
    console.log(`Notification tracking for org ${orgId}, event ${eventId}:`, {
      totalFollowers,
      successCount,
      failureCount,
      deliveryRate: totalFollowers > 0 ? (successCount / totalFollowers) * 100 : 0,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if user is an organization member (admin)
   */
  private async isOrganizationMember(orgId: string, userId: string): Promise<boolean> {
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

  /**
   * Map database event to response format
   */
  private mapEventToResponse(event: any): EventResponse {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      mode: event.mode,
      startDate: event.startDate,
      endDate: event.endDate,
      capacity: event.capacity,
      registrationDeadline: event.registrationDeadline,
      organizerId: event.organizerId,
      organizationId: event.organizationId,
      visibility: event.visibility,
      branding: event.branding as any,
      venue: event.venue as any,
      virtualLinks: event.virtualLinks as any,
      status: event.status,
      landingPageUrl: event.landingPageUrl,
      inviteLink: event.inviteLink,
      leaderboardEnabled: event.leaderboardEnabled,
      registrationCount: event._count?.registrations || 0,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}

export const discoveryService = new DiscoveryService();
