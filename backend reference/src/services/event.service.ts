import { PrismaClient, EventMode, EventStatus } from '@prisma/client';
import {
  CreateEventDTO,
  UpdateEventDTO,
  EventResponse,
  LandingPageData,
  EventAnalytics,
  BrandingConfig,
  VenueConfig,
  VirtualConfig,
} from '../types';
import { generateUniqueSlug } from '../utils/slug';

const prisma = new PrismaClient();

export class EventService {
  /**
   * Create a new event
   */
  async createEvent(
    organizerId: string,
    eventData: CreateEventDTO
  ): Promise<EventResponse> {
    // Validate event mode requirements
    this.validateEventMode(eventData.mode, eventData.venue, eventData.virtualLinks);

    // Generate unique landing page URL
    const landingPageUrl = await this.generateUniqueLandingPageUrl(eventData.name);

    // Generate invite link for private events
    let inviteLink: string | undefined;
    if (eventData.visibility === 'PRIVATE') {
      inviteLink = await this.generateUniqueInviteLink();
    }

    const event = await prisma.event.create({
      data: {
        name: eventData.name,
        description: eventData.description,
        mode: eventData.mode as EventMode,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        capacity: eventData.capacity,
        registrationDeadline: eventData.registrationDeadline
          ? new Date(eventData.registrationDeadline)
          : undefined,
        organizerId,
        organizationId: eventData.organizationId,
        visibility: eventData.visibility as any || 'PUBLIC',
        branding: eventData.branding as any,
        venue: eventData.venue as any,
        virtualLinks: eventData.virtualLinks as any,
        landingPageUrl,
        inviteLink,
        status: EventStatus.DRAFT,
      },
    });

    // Automatically provision workspace for the event
    try {
      const { workspaceLifecycleService } = await import('./workspace-lifecycle.service');
      await workspaceLifecycleService.onEventCreated(event.id, organizerId);
    } catch (error) {
      console.error('Failed to auto-provision workspace:', error);
      // Don't throw error to avoid breaking event creation
    }

    // Notify followers if event is published and linked to organization
    if (event.organizationId && event.status === 'PUBLISHED') {
      try {
        const { discoveryService } = await import('./discovery.service');
        await discoveryService.notifyFollowers(event.organizationId, event.id);
      } catch (error) {
        console.error('Failed to notify followers:', error);
        // Don't throw error to avoid breaking event creation
      }
    }

    return this.mapEventToResponse(event);
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    updates: UpdateEventDTO
  ): Promise<EventResponse> {
    // Validate event mode requirements if mode is being updated
    if (updates.mode) {
      const currentEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!currentEvent) {
        throw new Error('Event not found');
      }

      const venue = updates.venue ?? (currentEvent.venue as unknown as VenueConfig);
      const virtualLinks = updates.virtualLinks ?? (currentEvent.virtualLinks as unknown as VirtualConfig);

      this.validateEventMode(updates.mode, venue, virtualLinks);
    }

    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.mode !== undefined) updateData.mode = updates.mode as EventMode;
    if (updates.startDate !== undefined) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined) updateData.endDate = new Date(updates.endDate);
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.registrationDeadline !== undefined) {
      updateData.registrationDeadline = new Date(updates.registrationDeadline);
    }
    if (updates.branding !== undefined) updateData.branding = updates.branding;
    if (updates.venue !== undefined) updateData.venue = updates.venue;
    if (updates.virtualLinks !== undefined) updateData.virtualLinks = updates.virtualLinks;
    if (updates.status !== undefined) updateData.status = updates.status as EventStatus;
    if (updates.leaderboardEnabled !== undefined) {
      updateData.leaderboardEnabled = updates.leaderboardEnabled;
    }

    // Get the current event to compare status changes
    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    // Handle workspace lifecycle changes if status changed
    if (updates.status && currentEvent && currentEvent.status !== updates.status) {
      try {
        const { workspaceLifecycleService } = await import('./workspace-lifecycle.service');
        await workspaceLifecycleService.onEventStatusChanged(
          eventId,
          updates.status as any,
          currentEvent.status as any
        );
      } catch (error) {
        console.error('Failed to handle workspace lifecycle change:', error);
        // Don't throw error to avoid breaking event update
      }
    }

    // Notify followers if event status changed to PUBLISHED and linked to organization
    if (updates.status === 'PUBLISHED' && event.organizationId) {
      try {
        const { discoveryService } = await import('./discovery.service');
        await discoveryService.notifyFollowers(event.organizationId, event.id);
      } catch (error) {
        console.error('Failed to notify followers:', error);
        // Don't throw error to avoid breaking event update
      }
    }

    return this.mapEventToResponse(event);
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<EventResponse> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return this.mapEventToResponse(event);
  }

  /**
   * Get event by landing page URL
   */
  async getEventByUrl(landingPageUrl: string): Promise<EventResponse> {
    const event = await prisma.event.findUnique({
      where: { landingPageUrl },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return this.mapEventToResponse(event);
  }

  /**
   * Generate landing page data for an event
   */
  async generateLandingPage(eventId: string): Promise<LandingPageData> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            branding: true,
            verificationStatus: true,
          },
        },
        registrations: {
          where: {
            status: 'CONFIRMED',
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const registrationOpen = this.isRegistrationOpen(event);
    const confirmedCount = event.registrations.length;
    const spotsRemaining = event.capacity ? event.capacity - confirmedCount : undefined;

    const landingPageData: LandingPageData = {
      event: this.mapEventToResponse(event),
      registrationOpen,
      spotsRemaining,
      organizerInfo: {
        name: event.organizer.name,
        email: event.organizer.email,
      },
    };

    // Include organization info if event is linked to an organization
    if (event.organization) {
      landingPageData.organizationInfo = {
        id: event.organization.id,
        name: event.organization.name,
        branding: event.organization.branding as any,
        verificationStatus: event.organization.verificationStatus,
      };
    }

    return landingPageData;
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId: string): Promise<EventAnalytics> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          include: {
            attendance: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Calculate registration stats
    const registrations = event.registrations;
    const registrationStats = {
      total: registrations.length,
      confirmed: registrations.filter((r) => r.status === 'CONFIRMED').length,
      waitlisted: registrations.filter((r) => r.status === 'WAITLISTED').length,
      cancelled: registrations.filter((r) => r.status === 'CANCELLED').length,
      overTime: this.calculateRegistrationsOverTime(registrations),
    };

    // Calculate attendance stats
    const attendanceRecords = registrations.flatMap((r) => r.attendance);
    const attendanceStats = {
      totalCheckedIn: attendanceRecords.length,
      checkInRate:
        registrationStats.confirmed > 0
          ? (attendanceRecords.length / registrationStats.confirmed) * 100
          : 0,
    };

    // Calculate capacity utilization
    const capacityUtilization = event.capacity
      ? (registrationStats.confirmed / event.capacity) * 100
      : undefined;

    return {
      eventId: event.id,
      registrationStats,
      attendanceStats,
      capacityUtilization,
    };
  }

  /**
   * Get events by organizer
   */
  async getEventsByOrganizer(organizerId: string): Promise<EventResponse[]> {
    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    return events.map((event) => this.mapEventToResponse(event));
  }

  /**
   * Get events by organization
   */
  async getEventsByOrganization(
    organizationId: string,
    visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED',
    userId?: string
  ): Promise<EventResponse[]> {
    const whereClause: any = { organizationId };

    // Filter by visibility if specified
    if (visibility) {
      whereClause.visibility = visibility;
    } else {
      // Default to public events unless user is an organization admin
      if (userId) {
        const isAdmin = await prisma.organizationAdmin.findUnique({
          where: {
            organizationId_userId: {
              organizationId,
              userId,
            },
          },
        });

        if (!isAdmin) {
          whereClause.visibility = 'PUBLIC';
        }
      } else {
        whereClause.visibility = 'PUBLIC';
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: [
        { startDate: 'asc' }, // Upcoming events first
        { createdAt: 'desc' },
      ],
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    return events.map((event) => this.mapEventToResponse(event));
  }

  /**
   * Validate event mode requirements
   */
  private validateEventMode(
    mode: string,
    venue?: VenueConfig,
    virtualLinks?: VirtualConfig
  ): void {
    if (mode === 'OFFLINE' && !venue) {
      throw new Error('Offline events require venue information');
    }

    if (mode === 'ONLINE' && !virtualLinks) {
      throw new Error('Online events require virtual meeting links');
    }

    if (mode === 'HYBRID' && (!venue || !virtualLinks)) {
      throw new Error('Hybrid events require both venue and virtual meeting links');
    }
  }

  /**
   * Generate unique landing page URL
   */
  private async generateUniqueLandingPageUrl(eventName: string): Promise<string> {
    const baseSlug = generateUniqueSlug(eventName);
    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (true) {
      const existing = await prisma.event.findUnique({
        where: { landingPageUrl: slug },
      });

      if (!existing) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Check if registration is open for an event
   */
  private isRegistrationOpen(event: any): boolean {
    const now = new Date();

    // Check if event is published
    if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
      return false;
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
      return false;
    }

    // Check if event has ended
    if (new Date(event.endDate) < now) {
      return false;
    }

    return true;
  }

  /**
   * Calculate registrations over time
   */
  private calculateRegistrationsOverTime(
    registrations: any[]
  ): Array<{ date: string; count: number }> {
    const dateMap = new Map<string, number>();

    registrations.forEach((reg) => {
      const date = new Date(reg.registeredAt).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate unique invite link for private events
   */
  private async generateUniqueInviteLink(): Promise<string> {
    const { randomBytes } = await import('crypto');
    let inviteLink: string;
    let isUnique = false;

    while (!isUnique) {
      // Generate a random 16-character hex string
      inviteLink = randomBytes(8).toString('hex');

      // Check if it's unique
      const existing = await prisma.event.findUnique({
        where: { inviteLink },
      });

      if (!existing) {
        isUnique = true;
        return inviteLink;
      }
    }

    throw new Error('Failed to generate unique invite link');
  }

  /**
   * Validate access to private event
   */
  async validatePrivateEventAccess(
    eventId: string,
    userId?: string,
    inviteLink?: string
  ): Promise<boolean> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Public events are accessible to everyone
    if (event.visibility === 'PUBLIC') {
      return true;
    }

    // Unlisted events are accessible via direct link
    if (event.visibility === 'UNLISTED') {
      return true;
    }

    // Private events require authorization
    if (event.visibility === 'PRIVATE') {
      // Check if user has valid invite link
      if (inviteLink && event.inviteLink === inviteLink) {
        return true;
      }

      // Check if user is an organization member
      if (userId && event.organizationId) {
        const isAdmin = await prisma.organizationAdmin.findUnique({
          where: {
            organizationId_userId: {
              organizationId: event.organizationId,
              userId,
            },
          },
        });

        if (isAdmin) {
          return true;
        }
      }

      return false;
    }

    return true;
  }

  /**
   * Log access attempt to private event
   */
  async logAccessAttempt(
    eventId: string,
    userId?: string,
    inviteLink?: string,
    success: boolean = false
  ): Promise<void> {
    // For now, we'll just log to console
    // In a production system, you'd want to store this in a database table
    console.log(`Access attempt to event ${eventId}:`, {
      userId,
      inviteLink: inviteLink ? '***' : undefined,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get event by invite link
   */
  async getEventByInviteLink(inviteLink: string): Promise<EventResponse | null> {
    const event = await prisma.event.findUnique({
      where: { inviteLink },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    if (!event) {
      return null;
    }

    return this.mapEventToResponse(event);
  }

  /**
   * Check if user is organization member
   */
  async isOrganizationMember(organizationId: string, userId: string): Promise<boolean> {
    const admin = await prisma.organizationAdmin.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    return !!admin;
  }

  /**
   * Get marketplace integration data for an event
   */
  async getEventMarketplaceData(eventId: string, organizerId: string): Promise<any> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only access marketplace data for your own events');
    }

    // Get marketplace integration service
    const { eventMarketplaceIntegrationService } = await import('./event-marketplace-integration.service');

    // Get recommendations and dashboard data
    const [recommendations, dashboard] = await Promise.all([
      eventMarketplaceIntegrationService.getServiceRecommendationsForEvent(eventId, organizerId, {
        limit: 5,
        verifiedOnly: true,
      }),
      eventMarketplaceIntegrationService.getEventMarketplaceDashboard(eventId, organizerId),
    ]);

    return {
      event: this.mapEventToResponse(event),
      recommendations,
      dashboard,
      marketplaceEnabled: true,
    };
  }

  /**
   * Add marketplace access shortcut to event dashboard
   */
  async getEventDashboardWithMarketplace(eventId: string, organizerId: string): Promise<any> {
    const event = await this.getEvent(eventId);
    
    if (event.organizerId !== organizerId) {
      throw new Error('You can only access dashboard for your own events');
    }

    // Get basic event analytics
    const analytics = await this.getEventAnalytics(eventId);

    // Get marketplace quick stats
    const bookingStats = await prisma.bookingRequest.aggregate({
      where: { eventId },
      _count: {
        id: true,
      },
    });

    const confirmedBookings = await prisma.bookingRequest.count({
      where: {
        eventId,
        status: 'CONFIRMED',
      },
    });

    const totalSpent = await prisma.bookingRequest.aggregate({
      where: {
        eventId,
        finalPrice: { not: null },
      },
      _sum: {
        finalPrice: true,
      },
    });

    return {
      event,
      analytics,
      marketplace: {
        totalBookings: bookingStats._count.id,
        confirmedBookings,
        totalSpent: totalSpent._sum.finalPrice || 0,
        quickActions: [
          {
            label: 'Browse Services',
            action: 'marketplace_browse',
            url: `/api/event-marketplace-integration/${eventId}/recommendations`,
          },
          {
            label: 'View Vendor Timeline',
            action: 'vendor_timeline',
            url: `/api/event-marketplace-integration/${eventId}/coordination`,
          },
          {
            label: 'Communicate with Vendors',
            action: 'vendor_communication',
            url: `/api/event-marketplace-integration/${eventId}/communicate`,
          },
        ],
      },
    };
  }

  /**
   * Integrate vendor bookings with event timeline
   */
  async integrateVendorBookingsWithTimeline(eventId: string, organizerId: string): Promise<any> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only integrate bookings for your own events');
    }

    // Get all confirmed bookings for the event
    const bookings = await prisma.bookingRequest.findMany({
      where: {
        eventId,
        status: 'CONFIRMED',
      },
      include: {
        serviceListing: {
          include: {
            vendor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        serviceAgreement: {
          select: {
            deliverables: true,
          },
        },
      },
    });

    // Create timeline integration
    const timelineIntegration = {
      eventId,
      totalVendors: bookings.length,
      upcomingServices: bookings
        .filter(b => new Date(b.serviceDate) > new Date())
        .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())
        .slice(0, 5)
        .map(booking => ({
          bookingId: booking.id,
          vendorName: booking.serviceListing.vendor.businessName,
          serviceName: booking.serviceListing.title,
          serviceDate: booking.serviceDate,
          category: booking.serviceListing.category,
          status: booking.status,
        })),
      upcomingDeadlines: bookings
        .flatMap(booking => {
          if (!booking.serviceAgreement?.deliverables) return [];
          const deliverables = booking.serviceAgreement.deliverables as any[];
          return deliverables
            .filter(d => d.status !== 'COMPLETED' && new Date(d.dueDate) > new Date())
            .map(d => ({
              bookingId: booking.id,
              vendorName: booking.serviceListing.vendor.businessName,
              deliverableTitle: d.title,
              dueDate: d.dueDate,
              status: d.status,
            }));
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 10),
      vendorContacts: bookings.map(booking => ({
        bookingId: booking.id,
        vendorId: booking.vendorId,
        vendorName: booking.serviceListing.vendor.businessName,
        contactEmail: (booking.serviceListing.vendor.contactInfo as any)?.email || '',
        contactPhone: (booking.serviceListing.vendor.contactInfo as any)?.phone || '',
        serviceCategory: booking.serviceListing.category,
        lastCommunication: null, // Will be populated by communication service
      })),
    };

    return timelineIntegration;
  }

  /**
   * Create unified vendor coordination interface
   */
  async createVendorCoordinationInterface(eventId: string, organizerId: string): Promise<any> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only create coordination interface for your own events');
    }

    // Get vendor coordination data from integration service
    const { eventMarketplaceIntegrationService } = await import('./event-marketplace-integration.service');
    const coordinationData = await eventMarketplaceIntegrationService.getVendorCoordinationData(eventId, organizerId);

    // Enhance with event-specific data
    const enhancedCoordination = {
      ...coordinationData,
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        endDate: event.endDate,
        mode: event.mode,
        venue: event.venue,
      },
      coordinationTools: {
        bulkCommunication: {
          enabled: true,
          url: `/api/event-marketplace-integration/${eventId}/communicate`,
          types: ['VENDOR_BROADCAST', 'CATEGORY_SPECIFIC', 'TIMELINE_UPDATE'],
        },
        timelineSync: {
          enabled: true,
          url: `/api/event-marketplace-integration/${eventId}/sync-timelines`,
          lastSync: null, // Will be populated from timeline items
        },
        vendorDirectory: {
          enabled: true,
          totalVendors: coordinationData.vendors?.length || 0,
          categories: [...new Set(coordinationData.vendors?.map((v: any) => v.booking.serviceListing.category) || [])],
        },
      },
    };

    return enhancedCoordination;
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
      branding: event.branding as BrandingConfig,
      venue: event.venue as VenueConfig,
      virtualLinks: event.virtualLinks as VirtualConfig,
      status: event.status,
      landingPageUrl: event.landingPageUrl,
      inviteLink: event.inviteLink,
      leaderboardEnabled: event.leaderboardEnabled,
      registrationCount: event.registrations ? event.registrations.length : undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}

export const eventService = new EventService();
