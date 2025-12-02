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
    eventData: CreateEventDTO & { organizationId?: string; visibility?: string }
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

    // Notify followers if event is published and linked to organization
    if (event.organizationId && event.status === 'PUBLISHED') {
      // TODO: Notify followers
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

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

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

    return {
      event: this.mapEventToResponse(event),
      registrationOpen,
      spotsRemaining,
      organizerInfo: {
        name: event.organizer.name,
        email: event.organizer.email,
      },
    };
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
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}

export const eventService = new EventService();
