import { PrismaClient, BookingStatus } from '@prisma/client';
import {
  CreateBookingDTO,
  UpdateBookingDTO,
  BookingRequestResponse,
  BookingMessageDTO,
  BookingMessageResponse,
} from '../types';
import { serviceAgreementService } from './service-agreement.service';

const prisma = new PrismaClient();

export class BookingService {
  /**
   * Create a booking request
   */
  async createBookingRequest(
    organizerId: string,
    bookingData: CreateBookingDTO
  ): Promise<BookingRequestResponse> {
    // Verify event exists and organizer owns it
    const event = await prisma.event.findUnique({
      where: { id: bookingData.eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only create bookings for your own events');
    }

    // Verify service listing exists and is available
    const serviceListing = await prisma.serviceListing.findUnique({
      where: { id: bookingData.serviceListingId },
      include: { vendor: true },
    });

    if (!serviceListing) {
      throw new Error('Service listing not found');
    }

    if (serviceListing.status !== 'ACTIVE') {
      throw new Error('Service listing is not available');
    }

    // Check if service date is available
    const availability = serviceListing.availability as any;
    if (!this.isDateAvailable(bookingData.serviceDate, availability)) {
      throw new Error('Service is not available on the requested date');
    }

    // Check for conflicting bookings on the same date
    const conflictingBooking = await prisma.bookingRequest.findFirst({
      where: {
        serviceListingId: bookingData.serviceListingId,
        serviceDate: bookingData.serviceDate,
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    if (conflictingBooking) {
      throw new Error('Service is already booked for the requested date');
    }

    // Create booking request with transaction to ensure consistency
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.bookingRequest.create({
        data: {
          eventId: bookingData.eventId,
          serviceListingId: bookingData.serviceListingId,
          organizerId,
          vendorId: serviceListing.vendorId,
          serviceDate: bookingData.serviceDate,
          requirements: bookingData.requirements,
          budgetRange: bookingData.budgetRange as any,
          additionalNotes: bookingData.additionalNotes,
          status: BookingStatus.PENDING,
        },
        include: {
          event: true,
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
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      });

      // Increment inquiry count for the service listing
      await tx.serviceListing.update({
        where: { id: bookingData.serviceListingId },
        data: { inquiryCount: { increment: 1 } },
      });

      return newBooking;
    });

    // TODO: Send notification to vendor about new booking request
    // TODO: Add to event timeline/calendar

    return this.mapBookingToResponse(booking);
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    userId: string,
    updates: UpdateBookingDTO
  ): Promise<BookingRequestResponse> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        vendor: { include: { user: true } },
        organizer: true,
        serviceListing: true,
      },
    });

    if (!booking) {
      throw new Error('Booking request not found');
    }

    // Check permissions
    const isOrganizer = booking.organizerId === userId;
    const isVendor = booking.vendor.userId === userId;

    if (!isOrganizer && !isVendor) {
      throw new Error('You do not have permission to update this booking');
    }

    // Validate status transitions
    if (updates.status) {
      this.validateStatusTransition(booking.status, updates.status as BookingStatus, isVendor);
    }

    // Additional validation for quote-related updates
    if (updates.quotedPrice !== undefined && !isVendor) {
      throw new Error('Only vendors can set quoted prices');
    }

    if (updates.finalPrice !== undefined && !isOrganizer) {
      throw new Error('Only organizers can set final prices');
    }

    // Use transaction for consistency
    const updated = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.bookingRequest.update({
        where: { id: bookingId },
        data: {
          ...(updates.status && { status: updates.status as BookingStatus }),
          ...(updates.quotedPrice !== undefined && { quotedPrice: updates.quotedPrice }),
          ...(updates.finalPrice !== undefined && { finalPrice: updates.finalPrice }),
          ...(updates.additionalNotes !== undefined && { additionalNotes: updates.additionalNotes }),
        },
        include: {
          event: true,
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
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      });

      // Update booking count if confirmed
      if (updates.status === 'CONFIRMED' && booking.status !== 'CONFIRMED') {
        await tx.serviceListing.update({
          where: { id: booking.serviceListingId },
          data: { bookingCount: { increment: 1 } },
        });
      }

      // Update vendor completion rate if completed
      if (updates.status === 'COMPLETED' && booking.status !== 'COMPLETED') {
        const vendorBookings = await tx.bookingRequest.count({
          where: { vendorId: booking.vendorId },
        });
        const completedBookings = await tx.bookingRequest.count({
          where: { 
            vendorId: booking.vendorId,
            status: 'COMPLETED',
          },
        });
        
        const completionRate = vendorBookings > 0 ? (completedBookings / vendorBookings) * 100 : 100;
        
        await tx.vendorProfile.update({
          where: { id: booking.vendorId },
          data: { completionRate },
        });
      }

      return updatedBooking;
    });

    // TODO: Send notification about status change
    // TODO: Update event timeline if status is significant

    return this.mapBookingToResponse(updated);
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string, userId: string): Promise<BookingRequestResponse> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
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
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });

    if (!booking) {
      throw new Error('Booking request not found');
    }

    // Check permissions
    const isOrganizer = booking.organizerId === userId;
    const isVendor = booking.vendor.userId === userId;

    if (!isOrganizer && !isVendor) {
      throw new Error('You do not have permission to view this booking');
    }

    return this.mapBookingToResponse(booking);
  }

  /**
   * Get bookings by event
   */
  async getBookingsByEvent(eventId: string, organizerId: string): Promise<BookingRequestResponse[]> {
    // Verify organizer owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only view bookings for your own events');
    }

    const bookings = await prisma.bookingRequest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: true,
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
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });

    return bookings.map((booking) => this.mapBookingToResponse(booking));
  }

  /**
   * Get bookings by vendor
   */
  async getBookingsByVendor(vendorId: string): Promise<BookingRequestResponse[]> {
    const bookings = await prisma.bookingRequest.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: true,
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
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    });

    return bookings.map((booking) => this.mapBookingToResponse(booking));
  }

  /**
   * Send booking message
   */
  async sendBookingMessage(
    bookingId: string,
    senderId: string,
    messageData: BookingMessageDTO
  ): Promise<BookingMessageResponse> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        vendor: { include: { user: true } },
        organizer: true,
      },
    });

    if (!booking) {
      throw new Error('Booking request not found');
    }

    // Check permissions and determine sender type
    const isOrganizer = booking.organizerId === senderId;
    const isVendor = booking.vendor.userId === senderId;

    if (!isOrganizer && !isVendor) {
      throw new Error('You do not have permission to send messages for this booking');
    }

    const senderType = isOrganizer ? 'ORGANIZER' : 'VENDOR';

    const message = await prisma.bookingMessage.create({
      data: {
        bookingId,
        senderId,
        senderType,
        message: messageData.message,
        attachments: messageData.attachments as any,
      },
    });

    // TODO: Send notification to the other party

    return {
      id: message.id,
      bookingId: message.bookingId,
      senderId: message.senderId,
      senderType: message.senderType as 'ORGANIZER' | 'VENDOR',
      message: message.message,
      attachments: message.attachments as any,
      sentAt: message.sentAt,
    };
  }

  /**
   * Get booking messages
   */
  async getBookingMessages(bookingId: string, userId: string): Promise<BookingMessageResponse[]> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        vendor: { include: { user: true } },
        organizer: true,
      },
    });

    if (!booking) {
      throw new Error('Booking request not found');
    }

    // Check permissions
    const isOrganizer = booking.organizerId === userId;
    const isVendor = booking.vendor.userId === userId;

    if (!isOrganizer && !isVendor) {
      throw new Error('You do not have permission to view messages for this booking');
    }

    const messages = await prisma.bookingMessage.findMany({
      where: { bookingId },
      orderBy: { sentAt: 'asc' },
    });

    return messages.map((message) => ({
      id: message.id,
      bookingId: message.bookingId,
      senderId: message.senderId,
      senderType: message.senderType as 'ORGANIZER' | 'VENDOR',
      message: message.message,
      attachments: message.attachments as any,
      sentAt: message.sentAt,
    }));
  }

  /**
   * Cancel booking request
   */
  async cancelBooking(
    bookingId: string,
    userId: string,
    reason?: string
  ): Promise<BookingRequestResponse> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        vendor: { include: { user: true } },
        organizer: true,
      },
    });

    if (!booking) {
      throw new Error('Booking request not found');
    }

    // Check permissions
    const isOrganizer = booking.organizerId === userId;
    const isVendor = booking.vendor.userId === userId;

    if (!isOrganizer && !isVendor) {
      throw new Error('You do not have permission to cancel this booking');
    }

    // Check if booking can be cancelled
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      throw new Error('Cannot cancel a booking that is already completed or cancelled');
    }

    const updated = await this.updateBookingStatus(bookingId, userId, {
      status: 'CANCELLED',
      additionalNotes: reason ? `Cancellation reason: ${reason}` : undefined,
    });

    // TODO: Handle refunds if payment was made
    // TODO: Send cancellation notifications

    return updated;
  }

  /**
   * Get booking timeline/history
   */
  async getBookingTimeline(bookingId: string, userId: string): Promise<any[]> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        vendor: { include: { user: true } },
        organizer: true,
        messages: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking request not found');
    }

    // Check permissions
    const isOrganizer = booking.organizerId === userId;
    const isVendor = booking.vendor.userId === userId;

    if (!isOrganizer && !isVendor) {
      throw new Error('You do not have permission to view this booking timeline');
    }

    // Build timeline from booking history and messages
    const timeline = [
      {
        type: 'status_change',
        status: 'PENDING',
        timestamp: booking.createdAt,
        description: 'Booking request created',
      },
    ];

    // Add messages to timeline
    booking.messages.forEach((message) => {
      timeline.push({
        type: 'message',
        status: 'SENT',
        timestamp: message.sentAt,
        description: `Message from ${message.senderType.toLowerCase()}: ${message.message}`,
      });
    });

    // Sort by timestamp
    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
    isVendor: boolean
  ): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.VENDOR_REVIEWING, BookingStatus.CANCELLED],
      [BookingStatus.VENDOR_REVIEWING]: [BookingStatus.QUOTE_SENT, BookingStatus.CANCELLED],
      [BookingStatus.QUOTE_SENT]: [BookingStatus.QUOTE_ACCEPTED, BookingStatus.CANCELLED],
      [BookingStatus.QUOTE_ACCEPTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.DISPUTED],
      [BookingStatus.COMPLETED]: [BookingStatus.DISPUTED],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.DISPUTED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Additional business rules
    if (newStatus === BookingStatus.VENDOR_REVIEWING && !isVendor) {
      throw new Error('Only vendors can move booking to reviewing status');
    }

    if (newStatus === BookingStatus.QUOTE_SENT && !isVendor) {
      throw new Error('Only vendors can send quotes');
    }

    if (newStatus === BookingStatus.QUOTE_ACCEPTED && isVendor) {
      throw new Error('Only organizers can accept quotes');
    }
  }

  /**
   * Check if a date is available based on availability calendar
   */
  private isDateAvailable(date: Date, availability: any): boolean {
    if (!availability) return true;

    const requestDate = new Date(date);
    const dayOfWeek = requestDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Check if date is in blocked dates
    if (availability.blockedDates) {
      const blockedDates = availability.blockedDates.map((d: string) => new Date(d));
      if (blockedDates.some((blocked: Date) => 
        blocked.toDateString() === requestDate.toDateString()
      )) {
        return false;
      }
    }

    // Check custom availability for specific date
    if (availability.customAvailability) {
      const customSlot = availability.customAvailability.find((slot: any) => 
        new Date(slot.date).toDateString() === requestDate.toDateString()
      );
      if (customSlot) {
        return customSlot.available;
      }
    }

    // Check recurring availability
    if (availability.recurringAvailability && availability.recurringAvailability[dayOfWeek]) {
      const daySlots = availability.recurringAvailability[dayOfWeek];
      return daySlots && daySlots.length > 0;
    }

    return true; // Default to available if no specific rules
  }

  /**
   * Generate service agreement for a booking
   */
  async generateServiceAgreement(
    bookingId: string,
    templateId?: string,
    customTerms?: string
  ): Promise<any> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        serviceListing: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'QUOTE_ACCEPTED') {
      throw new Error('Service agreement can only be generated for accepted quotes');
    }

    // Determine template based on service category if not provided
    let selectedTemplateId = templateId;
    if (!selectedTemplateId && booking.serviceListing) {
      const categoryTemplateMap: Record<string, string> = {
        'CATERING': 'catering-template',
        'PHOTOGRAPHY': 'photography-template',
        'VIDEOGRAPHY': 'photography-template', // Use photography template for videography
        'VENUE': 'venue-template',
      };
      selectedTemplateId = categoryTemplateMap[booking.serviceListing.category] || 'catering-template';
    }

    return await serviceAgreementService.generateServiceAgreement(bookingId, {
      bookingId,
      templateId: selectedTemplateId,
      customTerms,
      deliverables: [], // Will use template defaults
      paymentSchedule: [], // Will use template defaults
    });
  }

  /**
   * Get booking statistics for analytics
   */
  async getBookingStatistics(vendorId?: string, eventId?: string): Promise<any> {
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (eventId) where.eventId = eventId;

    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      prisma.bookingRequest.count({ where }),
      prisma.bookingRequest.count({ where: { ...where, status: 'PENDING' } }),
      prisma.bookingRequest.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.bookingRequest.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.bookingRequest.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      conversionRate: total > 0 ? (confirmed / total) * 100 : 0,
      completionRate: confirmed > 0 ? (completed / confirmed) * 100 : 0,
    };
  }

  /**
   * Map database booking to response format
   */
  private mapBookingToResponse(booking: any): BookingRequestResponse {
    return {
      id: booking.id,
      eventId: booking.eventId,
      serviceListingId: booking.serviceListingId,
      organizerId: booking.organizerId,
      vendorId: booking.vendorId,
      status: booking.status,
      serviceDate: booking.serviceDate,
      requirements: booking.requirements,
      budgetRange: booking.budgetRange as any,
      quotedPrice: booking.quotedPrice,
      finalPrice: booking.finalPrice,
      additionalNotes: booking.additionalNotes,
      event: booking.event ? {
        id: booking.event.id,
        name: booking.event.name,
        description: booking.event.description,
        mode: booking.event.mode,
        startDate: booking.event.startDate,
        endDate: booking.event.endDate,
        capacity: booking.event.capacity,
        registrationDeadline: booking.event.registrationDeadline,
        organizerId: booking.event.organizerId,
        organizationId: booking.event.organizationId,
        visibility: booking.event.visibility,
        inviteLink: booking.event.inviteLink,
        branding: booking.event.branding as any,
        venue: booking.event.venue as any,
        virtualLinks: booking.event.virtualLinks as any,
        status: booking.event.status,
        landingPageUrl: booking.event.landingPageUrl,
        leaderboardEnabled: booking.event.leaderboardEnabled,
        createdAt: booking.event.createdAt,
        updatedAt: booking.event.updatedAt,
      } : undefined,
      serviceListing: booking.serviceListing ? {
        id: booking.serviceListing.id,
        vendorId: booking.serviceListing.vendorId,
        title: booking.serviceListing.title,
        description: booking.serviceListing.description,
        category: booking.serviceListing.category,
        pricing: booking.serviceListing.pricing as any,
        availability: booking.serviceListing.availability as any,
        serviceArea: booking.serviceListing.serviceArea,
        requirements: booking.serviceListing.requirements,
        inclusions: booking.serviceListing.inclusions,
        exclusions: booking.serviceListing.exclusions,
        media: booking.serviceListing.media as any,
        featured: booking.serviceListing.featured,
        status: booking.serviceListing.status,
        viewCount: booking.serviceListing.viewCount,
        inquiryCount: booking.serviceListing.inquiryCount,
        bookingCount: booking.serviceListing.bookingCount,
        vendor: booking.serviceListing.vendor ? {
          id: booking.serviceListing.vendor.id,
          userId: booking.serviceListing.vendor.userId,
          businessName: booking.serviceListing.vendor.businessName,
          description: booking.serviceListing.vendor.description,
          contactInfo: booking.serviceListing.vendor.contactInfo as any,
          serviceCategories: booking.serviceListing.vendor.serviceCategories,
          businessAddress: booking.serviceListing.vendor.businessAddress as any,
          verificationStatus: booking.serviceListing.vendor.verificationStatus,
          verificationDocuments: booking.serviceListing.vendor.verificationDocuments as any,
          rating: booking.serviceListing.vendor.rating,
          reviewCount: booking.serviceListing.vendor.reviewCount,
          portfolio: booking.serviceListing.vendor.portfolio as any,
          businessHours: booking.serviceListing.vendor.businessHours as any,
          responseTime: booking.serviceListing.vendor.responseTime,
          completionRate: booking.serviceListing.vendor.completionRate,
          rejectionReason: booking.serviceListing.vendor.rejectionReason,
          createdAt: booking.serviceListing.vendor.createdAt,
          updatedAt: booking.serviceListing.vendor.updatedAt,
        } : undefined,
        createdAt: booking.serviceListing.createdAt,
        updatedAt: booking.serviceListing.updatedAt,
      } : undefined,
      organizer: booking.organizer,
      vendor: booking.vendor ? {
        id: booking.vendor.id,
        userId: booking.vendor.userId,
        businessName: booking.vendor.businessName,
        description: booking.vendor.description,
        contactInfo: booking.vendor.contactInfo as any,
        serviceCategories: booking.vendor.serviceCategories,
        businessAddress: booking.vendor.businessAddress as any,
        verificationStatus: booking.vendor.verificationStatus,
        verificationDocuments: booking.vendor.verificationDocuments as any,
        rating: booking.vendor.rating,
        reviewCount: booking.vendor.reviewCount,
        portfolio: booking.vendor.portfolio as any,
        businessHours: booking.vendor.businessHours as any,
        responseTime: booking.vendor.responseTime,
        completionRate: booking.vendor.completionRate,
        rejectionReason: booking.vendor.rejectionReason,
        createdAt: booking.vendor.createdAt,
        updatedAt: booking.vendor.updatedAt,
      } : undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}

export const bookingService = new BookingService();