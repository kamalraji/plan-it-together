import { PrismaClient, ServiceCategory } from '@prisma/client';
import {
  SearchServicesDTO,
  SearchServicesResponse,
  ServiceListingResponse,
} from '../types';

const prisma = new PrismaClient();

export class MarketplaceService {
  /**
   * Search for services with filters
   */
  async searchServices(query: SearchServicesDTO): Promise<SearchServicesResponse> {
    const {
      query: searchQuery,
      category,
      location,
      // dateRange, // TODO: Implement date range filtering
      budgetRange,
      verifiedOnly = false,
      limit = 20,
      offset = 0,
    } = query;

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
    };

    // Text search
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category as ServiceCategory;
    }

    // Location filter
    if (location) {
      where.serviceArea = {
        has: location,
      };
    }

    // Budget filter (check pricing.basePrice if available)
    if (budgetRange) {
      where.pricing = {
        path: ['basePrice'],
        gte: budgetRange.min,
        lte: budgetRange.max,
      };
    }

    // Verified vendors only
    if (verifiedOnly) {
      where.vendor = {
        verificationStatus: 'VERIFIED',
      };
    }

    // Get total count for pagination
    const total = await prisma.serviceListing.count({ where });

    // Get services with vendor information
    const services = await prisma.serviceListing.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [
        { featured: 'desc' },
        { vendor: { verificationStatus: 'desc' } },
        { vendor: { rating: 'desc' } },
        { bookingCount: 'desc' },
      ],
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
    });

    // Get filter aggregations
    const categoryAggregation = await prisma.serviceListing.groupBy({
      by: ['category'],
      where: { ...where, category: undefined },
      _count: { category: true },
    });

    const categories = categoryAggregation.map((item) => ({
      category: item.category,
      count: item._count.category,
    }));

    return {
      services: services.map((service) => this.mapServiceToResponse(service)),
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categories,
        priceRanges: [], // TODO: Implement price range aggregation
        locations: [], // TODO: Implement location aggregation
      },
    };
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category: ServiceCategory): Promise<ServiceListingResponse[]> {
    const services = await prisma.serviceListing.findMany({
      where: {
        category,
        status: 'ACTIVE',
      },
      orderBy: [
        { featured: 'desc' },
        { vendor: { verificationStatus: 'desc' } },
        { vendor: { rating: 'desc' } },
      ],
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
    });

    return services.map((service) => this.mapServiceToResponse(service));
  }

  /**
   * Get featured services
   */
  async getFeaturedServices(
    _eventType?: string, // TODO: Use eventType for filtering
    location?: string
  ): Promise<ServiceListingResponse[]> {
    const where: any = {
      featured: true,
      status: 'ACTIVE',
    };

    if (location) {
      where.serviceArea = {
        has: location,
      };
    }

    const services = await prisma.serviceListing.findMany({
      where,
      take: 10,
      orderBy: [
        { vendor: { verificationStatus: 'desc' } },
        { vendor: { rating: 'desc' } },
        { bookingCount: 'desc' },
      ],
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
    });

    return services.map((service) => this.mapServiceToResponse(service));
  }

  /**
   * Get service recommendations for an event
   */
  async getServiceRecommendations(eventId: string): Promise<ServiceListingResponse[]> {
    // Get event details to determine recommendations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        mode: true,
        capacity: true,
        venue: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Determine recommended categories based on event type and mode
    const recommendedCategories: ServiceCategory[] = [];

    // Always recommend these for any event
    recommendedCategories.push(
      ServiceCategory.CATERING,
      ServiceCategory.PHOTOGRAPHY,
      ServiceCategory.AUDIO_VISUAL
    );

    // Add mode-specific recommendations
    if (event.mode === 'OFFLINE' || event.mode === 'HYBRID') {
      recommendedCategories.push(
        ServiceCategory.VENUE,
        ServiceCategory.DECORATION,
        ServiceCategory.SECURITY
      );
    }

    // Add capacity-based recommendations
    if (event.capacity && event.capacity > 100) {
      recommendedCategories.push(
        ServiceCategory.TRANSPORTATION,
        ServiceCategory.CLEANING
      );
    }

    const where: any = {
      category: { in: recommendedCategories },
      status: 'ACTIVE',
    };

    // Filter by location if venue is specified
    if (event.venue && typeof event.venue === 'object' && 'city' in event.venue) {
      const venueData = event.venue as any;
      where.serviceArea = {
        has: venueData.city,
      };
    }

    const services = await prisma.serviceListing.findMany({
      where,
      take: 15,
      orderBy: [
        { featured: 'desc' },
        { vendor: { verificationStatus: 'desc' } },
        { vendor: { rating: 'desc' } },
      ],
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
    });

    return services.map((service) => this.mapServiceToResponse(service));
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string): Promise<ServiceListingResponse> {
    const service = await prisma.serviceListing.findUnique({
      where: { id: serviceId },
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
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Increment view count
    await prisma.serviceListing.update({
      where: { id: serviceId },
      data: { viewCount: { increment: 1 } },
    });

    return this.mapServiceToResponse(service);
  }

  /**
   * Map database service to response format
   */
  private mapServiceToResponse(service: any): ServiceListingResponse {
    // Get verification badge information for the vendor
    const getVerificationBadge = (verificationStatus: string) => {
      switch (verificationStatus) {
        case 'VERIFIED':
          return {
            isVerified: true,
            badgeText: 'Verified',
            badgeColor: 'green',
            description: 'This vendor has been verified by our team and meets our quality standards.',
          };
        case 'PENDING':
          return {
            isVerified: false,
            badgeText: 'Verification Pending',
            badgeColor: 'yellow',
            description: 'This vendor\'s verification is currently under review.',
          };
        case 'REJECTED':
          return {
            isVerified: false,
            badgeText: 'Not Verified',
            badgeColor: 'red',
            description: 'This vendor has not completed our verification process.',
          };
        default:
          return {
            isVerified: false,
            badgeText: 'Not Verified',
            badgeColor: 'gray',
            description: 'This vendor has not completed our verification process.',
          };
      }
    };

    return {
      id: service.id,
      vendorId: service.vendorId,
      title: service.title,
      description: service.description,
      category: service.category,
      pricing: service.pricing as any,
      availability: service.availability as any,
      serviceArea: service.serviceArea,
      requirements: service.requirements,
      inclusions: service.inclusions,
      exclusions: service.exclusions,
      media: service.media as any,
      featured: service.featured,
      status: service.status,
      viewCount: service.viewCount,
      inquiryCount: service.inquiryCount,
      bookingCount: service.bookingCount,
      vendor: service.vendor ? {
        id: service.vendor.id,
        userId: service.vendor.userId,
        businessName: service.vendor.businessName,
        description: service.vendor.description,
        contactInfo: service.vendor.contactInfo as any,
        serviceCategories: service.vendor.serviceCategories,
        businessAddress: service.vendor.businessAddress as any,
        verificationStatus: service.vendor.verificationStatus,
        verificationDocuments: service.vendor.verificationDocuments as any,
        rating: service.vendor.rating,
        reviewCount: service.vendor.reviewCount,
        portfolio: service.vendor.portfolio as any,
        businessHours: service.vendor.businessHours as any,
        responseTime: service.vendor.responseTime,
        completionRate: service.vendor.completionRate,
        rejectionReason: service.vendor.rejectionReason,
        verificationBadge: getVerificationBadge(service.vendor.verificationStatus),
        createdAt: service.vendor.createdAt,
        updatedAt: service.vendor.updatedAt,
      } : undefined,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

export const marketplaceService = new MarketplaceService();