import { PrismaClient, ServiceCategory } from '@prisma/client';
import { marketplaceService } from './marketplace.service';
import { bookingService } from './booking.service';
import {
  ServiceRecommendationDTO,
  VendorTimelineSyncDTO,
  IntegratedCommunicationDTO,
  EventMarketplaceIntegrationResponse,
  ServiceListingResponse,
} from '../types';

const prisma = new PrismaClient();

export class EventMarketplaceIntegrationService {
  /**
   * Get service recommendations for an event based on event details and historical data
   */
  async getServiceRecommendationsForEvent(
    eventId: string,
    organizerId: string,
    options?: ServiceRecommendationDTO
  ): Promise<ServiceListingResponse[]> {
    // Verify event exists and organizer owns it
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only get recommendations for your own events');
    }

    // Get base recommendations from marketplace service
    let recommendations = await marketplaceService.getServiceRecommendations(eventId);

    // Apply additional filtering based on options
    if (options?.preferredCategories?.length) {
      recommendations = recommendations.filter(service => 
        options.preferredCategories!.includes(service.category as ServiceCategory)
      );
    }

    if (options?.budgetRange) {
      recommendations = recommendations.filter(service => {
        const pricing = service.pricing as any;
        if (pricing?.basePrice) {
          return pricing.basePrice >= options.budgetRange!.min && 
                 pricing.basePrice <= options.budgetRange!.max;
        }
        return true; // Include services with custom pricing
      });
    }

    if (options?.verifiedOnly) {
      recommendations = recommendations.filter(service => 
        service.vendor?.verificationStatus === 'VERIFIED'
      );
    }

    // Get historical booking data for this organizer to improve recommendations
    const historicalBookings = await prisma.bookingRequest.findMany({
      where: {
        organizerId,
        status: 'COMPLETED',
      },
      include: {
        serviceListing: true,
        review: true,
      },
      take: 50, // Last 50 completed bookings
      orderBy: { createdAt: 'desc' },
    });

    // Enhance recommendations with historical data
    const enhancedRecommendations = recommendations.map(service => {
      const historicalBooking = historicalBookings.find(booking => 
        booking.serviceListing.vendorId === service.vendorId
      );

      let recommendationScore = 0;
      let recommendationReason = 'Matches your event requirements';

      if (historicalBooking) {
        recommendationScore += 20; // Boost for previous successful booking
        recommendationReason = 'You\'ve worked with this vendor before';
        
        if (historicalBooking.review && historicalBooking.review.rating >= 4) {
          recommendationScore += 10; // Additional boost for good reviews
          recommendationReason += ' with excellent results';
        }
      }

      // Boost verified vendors
      if (service.vendor?.verificationStatus === 'VERIFIED') {
        recommendationScore += 15;
      }

      // Boost highly rated vendors
      if (service.vendor?.rating && service.vendor.rating >= 4.5) {
        recommendationScore += 10;
      }

      // Boost vendors with high completion rates
      if (service.vendor?.completionRate && service.vendor.completionRate >= 95) {
        recommendationScore += 5;
      }

      return {
        ...service,
        recommendationScore,
        recommendationReason,
      };
    });

    // Sort by recommendation score and return top results
    return enhancedRecommendations
      .sort((a, b) => (b as any).recommendationScore - (a as any).recommendationScore)
      .slice(0, options?.limit || 15);
  }

  /**
   * Synchronize vendor deliverables and timelines with event project management
   */
  async synchronizeVendorTimelines(
    eventId: string,
    organizerId: string,
    syncData: VendorTimelineSyncDTO
  ): Promise<EventMarketplaceIntegrationResponse> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only synchronize timelines for your own events');
    }

    // Get all confirmed bookings for the event
    const confirmedBookings = await prisma.bookingRequest.findMany({
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
        serviceAgreement: true,
      },
    });

    const synchronizedItems = [];

    for (const booking of confirmedBookings) {
      // Parse deliverables from service agreement if available
      if (booking.serviceAgreement?.deliverables) {
        const deliverables = booking.serviceAgreement.deliverables as any[];
        for (const deliverable of deliverables) {
          // For now, we'll create a simple timeline entry without the complex upsert
          // This can be enhanced later when the EventTimelineItem model is properly set up
          synchronizedItems.push({
            type: 'deliverable',
            bookingId: booking.id,
            vendorName: booking.serviceListing.vendor.businessName,
            serviceName: booking.serviceListing.title,
            deliverable: {
              id: deliverable.id,
              title: deliverable.title,
              dueDate: deliverable.dueDate,
              status: deliverable.status,
            },
            timelineItemId: `timeline-${booking.id}-${deliverable.id}`,
          });
        }
      }

      // Add service date as a timeline item
      synchronizedItems.push({
        type: 'service',
        bookingId: booking.id,
        vendorName: booking.serviceListing.vendor.businessName,
        serviceName: booking.serviceListing.title,
        serviceDate: booking.serviceDate,
        timelineItemId: `timeline-${booking.id}-service`,
      });
    }

    // Send reminders for upcoming deliverables if requested
    if (syncData.sendReminders) {
      await this.sendVendorReminders(eventId, confirmedBookings);
    }

    return {
      success: true,
      message: `Successfully synchronized ${synchronizedItems.length} timeline items`,
      data: {
        synchronizedItems,
        totalBookings: confirmedBookings.length,
        eventId,
      },
    };
  }

  /**
   * Create integrated communication tools for vendor coordination
   */
  async createIntegratedCommunication(
    eventId: string,
    organizerId: string,
    communicationData: IntegratedCommunicationDTO
  ): Promise<EventMarketplaceIntegrationResponse> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only create communications for your own events');
    }

    const results = [];

    switch (communicationData.type) {
      case 'VENDOR_BROADCAST':
        // Send message to all vendors for this event
        const eventBookings = await prisma.bookingRequest.findMany({
          where: {
            eventId,
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          },
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        });

        for (const booking of eventBookings) {
          const message = await bookingService.sendBookingMessage(
            booking.id,
            organizerId,
            {
              message: communicationData.message,
              attachments: communicationData.attachments,
            }
          );
          results.push({
            bookingId: booking.id,
            vendorName: booking.vendor.businessName,
            messageId: message.id,
          });
        }
        break;

      case 'CATEGORY_SPECIFIC':
        // Send message to vendors in specific categories
        if (!communicationData.targetCategories?.length) {
          throw new Error('Target categories are required for category-specific communication');
        }

        const categoryBookings = await prisma.bookingRequest.findMany({
          where: {
            eventId,
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
            serviceListing: {
              category: { in: communicationData.targetCategories as ServiceCategory[] },
            },
          },
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
            serviceListing: true,
          },
        });

        for (const booking of categoryBookings) {
          const message = await bookingService.sendBookingMessage(
            booking.id,
            organizerId,
            {
              message: communicationData.message,
              attachments: communicationData.attachments,
            }
          );
          results.push({
            bookingId: booking.id,
            vendorName: booking.vendor.businessName,
            category: booking.serviceListing.category,
            messageId: message.id,
          });
        }
        break;

      case 'INDIVIDUAL_VENDOR':
        // Send message to specific vendor
        if (!communicationData.targetBookingId) {
          throw new Error('Target booking ID is required for individual vendor communication');
        }

        const message = await bookingService.sendBookingMessage(
          communicationData.targetBookingId,
          organizerId,
          {
            message: communicationData.message,
            attachments: communicationData.attachments,
          }
        );

        results.push({
          bookingId: communicationData.targetBookingId,
          messageId: message.id,
        });
        break;

      case 'TIMELINE_UPDATE':
        // Send timeline updates to relevant vendors
        const timelineBookings = await prisma.bookingRequest.findMany({
          where: {
            eventId,
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          },
          include: {
            vendor: {
              include: {
                user: true,
              },
            },
          },
        });

        const timelineMessage = `Event Timeline Update: ${communicationData.message}`;
        
        for (const booking of timelineBookings) {
          const message = await bookingService.sendBookingMessage(
            booking.id,
            organizerId,
            {
              message: timelineMessage,
              attachments: communicationData.attachments,
            }
          );
          results.push({
            bookingId: booking.id,
            vendorName: booking.vendor.businessName,
            messageId: message.id,
          });
        }
        break;

      default:
        throw new Error('Invalid communication type');
    }

    // Log the communication for analytics
    await prisma.communicationLog.create({
      data: {
        eventId,
        senderId: organizerId,
        recipientCount: results.length,
        subject: `Vendor Communication: ${communicationData.type}`,
        sentAt: new Date(),
        status: 'SENT',
      },
    });

    return {
      success: true,
      message: `Successfully sent communication to ${results.length} vendors`,
      data: {
        communicationType: communicationData.type,
        recipientCount: results.length,
        results,
      },
    };
  }

  /**
   * Get integrated marketplace dashboard data for an event
   */
  async getEventMarketplaceDashboard(
    eventId: string,
    organizerId: string
  ): Promise<any> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only view dashboard for your own events');
    }

    // Get booking statistics
    const bookingStats = await bookingService.getBookingStatistics(undefined, eventId);

    // Get all bookings with details
    const bookings = await bookingService.getBookingsByEvent(eventId, organizerId);

    // Get service recommendations
    const recommendations = await this.getServiceRecommendationsForEvent(eventId, organizerId, {
      limit: 10,
      verifiedOnly: true,
    });

    // For now, create mock timeline items since EventTimelineItem model needs to be set up
    const timelineItems: any[] = [];

    // Calculate vendor performance metrics
    const vendorMetrics = await this.calculateVendorPerformanceMetrics(eventId);

    // Get recent communications
    const recentCommunications = await prisma.communicationLog.findMany({
      where: { eventId },
      orderBy: { sentAt: 'desc' },
      take: 10,
    });

    return {
      eventId,
      bookingStatistics: bookingStats,
      bookings: bookings.slice(0, 10), // Latest 10 bookings
      recommendations,
      timeline: timelineItems,
      vendorMetrics,
      recentCommunications,
      summary: {
        totalVendors: bookings.length,
        confirmedServices: bookings.filter(b => b.status === 'CONFIRMED').length,
        pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
        totalSpent: bookings
          .filter(b => b.finalPrice)
          .reduce((sum, b) => sum + (b.finalPrice || 0), 0),
        upcomingDeadlines: [],
      },
    };
  }

  /**
   * Send automated reminders to vendors for upcoming deliverables
   */
  private async sendVendorReminders(_eventId: string, bookings: any[]): Promise<void> {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    for (const booking of bookings) {
      if (booking.serviceAgreement?.deliverables) {
        for (const deliverable of booking.serviceAgreement.deliverables) {
          const dueDate = new Date(deliverable.dueDate);
          
          // Send reminder if deliverable is due within 7 days and not completed
          if (dueDate <= reminderThreshold && deliverable.status !== 'COMPLETED') {
            const reminderMessage = `Reminder: Your deliverable "${deliverable.title}" for ${booking.serviceListing.title} is due on ${dueDate.toLocaleDateString()}. Please ensure it's completed on time.`;
            
            await bookingService.sendBookingMessage(
              booking.id,
              booking.organizerId, // System message from organizer
              {
                message: reminderMessage,
              }
            );
          }
        }
      }

      // Send reminder for service date
      const serviceDate = new Date(booking.serviceDate);
      if (serviceDate <= reminderThreshold && serviceDate > now) {
        const serviceReminderMessage = `Reminder: Your service "${booking.serviceListing.title}" is scheduled for ${serviceDate.toLocaleDateString()}. Please confirm your availability and any final preparations.`;
        
        await bookingService.sendBookingMessage(
          booking.id,
          booking.organizerId,
          {
            message: serviceReminderMessage,
          }
        );
      }
    }
  }

  /**
   * Calculate vendor performance metrics for an event
   */
  private async calculateVendorPerformanceMetrics(eventId: string): Promise<any> {
    const bookings = await prisma.bookingRequest.findMany({
      where: { eventId },
      include: {
        vendor: true,
        serviceListing: true,
        review: true,
      },
    });

    const metrics = {
      totalVendors: bookings.length,
      averageRating: 0,
      onTimeDeliveryRate: 0,
      responseTimeAverage: 0,
      categoryBreakdown: {} as Record<string, number>,
      topPerformers: [] as any[],
    };

    if (bookings.length === 0) return metrics;

    // Calculate average rating
    const ratingsSum = bookings
      .filter(b => b.review)
      .reduce((sum, b) => sum + (b.review?.rating || 0), 0);
    const ratingsCount = bookings.filter(b => b.review).length;
    metrics.averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

    // Calculate on-time delivery rate
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const onTimeDeliveries = completedBookings.filter(b => {
      // Simplified: assume on-time if completed before service date + 1 day
      const serviceDate = new Date(b.serviceDate);
      const deadline = new Date(serviceDate.getTime() + 24 * 60 * 60 * 1000);
      return b.updatedAt <= deadline;
    });
    metrics.onTimeDeliveryRate = completedBookings.length > 0 
      ? (onTimeDeliveries.length / completedBookings.length) * 100 
      : 0;

    // Calculate average response time
    const responseTimeSum = bookings.reduce((sum, b) => sum + (b.vendor?.responseTime || 0), 0);
    metrics.responseTimeAverage = responseTimeSum / bookings.length;

    // Category breakdown
    bookings.forEach(booking => {
      const category = booking.serviceListing.category;
      metrics.categoryBreakdown[category] = (metrics.categoryBreakdown[category] || 0) + 1;
    });

    // Top performers (vendors with highest ratings and completion rates)
    const vendorPerformance = bookings
      .filter(b => b.review)
      .map(b => ({
        vendorId: b.vendorId,
        businessName: b.vendor?.businessName || 'Unknown Vendor',
        rating: b.review?.rating || 0,
        completionRate: b.vendor?.completionRate || 0,
        responseTime: b.vendor?.responseTime || 0,
      }))
      .sort((a, b) => {
        // Sort by rating first, then completion rate
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.completionRate - a.completionRate;
      })
      .slice(0, 5);

    metrics.topPerformers = vendorPerformance;

    return metrics;
  }

  /**
   * Get vendor coordination interface data
   */
  async getVendorCoordinationData(
    eventId: string,
    organizerId: string
  ): Promise<any> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new Error('You can only view coordination data for your own events');
    }

    // Get all bookings with communication history
    const bookings = await prisma.bookingRequest.findMany({
      where: { eventId },
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
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 5, // Latest 5 messages per booking
        },
        serviceAgreement: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // For now, use empty timeline items since EventTimelineItem model needs setup
    const timelineItems: any[] = [];

    // Group data by vendor for easier coordination
    const vendorCoordination = bookings.map(booking => ({
      booking: {
        id: booking.id,
        status: booking.status,
        serviceDate: booking.serviceDate,
        serviceListing: booking.serviceListing,
      },
      vendor: booking.serviceListing.vendor,
      recentMessages: booking.messages,
      deliverables: (booking.serviceAgreement?.deliverables as any[]) || [],
      timelineItems: timelineItems.filter((item: any) => item.booking?.vendorId === booking.vendorId),
      lastCommunication: booking.messages[0]?.sentAt || null,
      needsAttention: this.checkIfVendorNeedsAttention(booking, timelineItems),
    }));

    return {
      eventId,
      vendors: vendorCoordination,
      summary: {
        totalVendors: vendorCoordination.length,
        needingAttention: vendorCoordination.filter(v => v.needsAttention).length,
        upcomingDeadlines: [],
        recentActivity: bookings
          .flatMap(b => b.messages)
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
          .slice(0, 10),
      },
    };
  }

  /**
   * Check if a vendor needs attention based on various factors
   */
  private checkIfVendorNeedsAttention(booking: any, timelineItems: any[]): boolean {
    const now = new Date();
    
    // Check for overdue deliverables
    const vendorTimelineItems = timelineItems.filter(item => 
      item.booking?.vendorId === booking.vendorId
    );
    
    const overdueItems = vendorTimelineItems.filter(item => 
      new Date(item.dueDate) < now && item.status !== 'COMPLETED'
    );
    
    if (overdueItems.length > 0) return true;
    
    // Check for pending responses (no messages in last 48 hours for pending bookings)
    if (booking.status === 'PENDING' || booking.status === 'VENDOR_REVIEWING') {
      const lastMessage = booking.messages[0];
      if (!lastMessage || 
          (new Date().getTime() - new Date(lastMessage.sentAt).getTime()) > 48 * 60 * 60 * 1000) {
        return true;
      }
    }
    
    // Check for upcoming service date without confirmation
    const serviceDate = new Date(booking.serviceDate);
    const daysUntilService = (serviceDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    
    if (daysUntilService <= 7 && booking.status !== 'CONFIRMED') {
      return true;
    }
    
    return false;
  }
}

export const eventMarketplaceIntegrationService = new EventMarketplaceIntegrationService();