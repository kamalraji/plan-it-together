import { PrismaClient, ServiceCategory, VerificationStatus } from '@prisma/client';
import {
  CreateVendorDTO,
  UpdateVendorDTO,
  VendorProfileResponse,
  CreateServiceDTO,
  UpdateServiceDTO,
  ServiceListingResponse,
  VendorAnalytics,
  VerificationDocuments,
} from '../types';

const prisma = new PrismaClient();

export class VendorService {
  /**
   * Register a new vendor
   */
  async registerVendor(
    userId: string,
    vendorData: CreateVendorDTO
  ): Promise<VendorProfileResponse> {
    // Check if user already has a vendor profile
    const existingVendor = await prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      throw new Error('User already has a vendor profile');
    }

    // Create vendor profile
    const vendor = await prisma.vendorProfile.create({
      data: {
        userId,
        businessName: vendorData.businessName,
        description: vendorData.description,
        contactInfo: vendorData.contactInfo as any,
        serviceCategories: vendorData.serviceCategories as ServiceCategory[],
        businessAddress: vendorData.businessAddress as any,
        portfolio: vendorData.portfolio as any,
        businessHours: vendorData.businessHours as any,
        verificationDocuments: {
          businessLicense: vendorData.businessLicense,
          insuranceCertificate: vendorData.insuranceCertificate,
        } as any,
        verificationStatus: VerificationStatus.PENDING,
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

    return this.mapVendorToResponse(vendor);
  }

  /**
   * Update vendor profile
   */
  async updateVendorProfile(
    vendorId: string,
    updates: UpdateVendorDTO
  ): Promise<VendorProfileResponse> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        ...(updates.businessName && { businessName: updates.businessName }),
        ...(updates.description && { description: updates.description }),
        ...(updates.contactInfo && { contactInfo: updates.contactInfo as any }),
        ...(updates.serviceCategories && {
          serviceCategories: updates.serviceCategories as ServiceCategory[],
        }),
        ...(updates.businessAddress && {
          businessAddress: updates.businessAddress as any,
        }),
        ...(updates.portfolio && { portfolio: updates.portfolio as any }),
        ...(updates.businessHours && { businessHours: updates.businessHours as any }),
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

    return this.mapVendorToResponse(updated);
  }

  /**
   * Get vendor profile by ID
   */
  async getVendorProfile(vendorId: string): Promise<VendorProfileResponse> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
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

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    return this.mapVendorToResponse(vendor);
  }

  /**
   * Get vendor profile by user ID
   */
  async getVendorProfileByUserId(userId: string): Promise<VendorProfileResponse> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId },
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

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    return this.mapVendorToResponse(vendor);
  }

  /**
   * Submit verification documents
   */
  async submitVerificationDocuments(
    vendorId: string,
    documents: VerificationDocuments
  ): Promise<VendorProfileResponse> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
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

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    // Validate required documents based on service categories
    this.validateVerificationDocuments(vendor.serviceCategories, documents);

    const updated = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        verificationDocuments: documents as any,
        verificationStatus: VerificationStatus.PENDING,
        rejectionReason: null, // Clear any previous rejection reason
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

    // TODO: Send notification to admins about new verification request
    // await this.notifyAdminsOfVerificationRequest(vendorId);

    return this.mapVendorToResponse(updated);
  }

  /**
   * Verify or reject a vendor
   */
  async verifyVendor(
    vendorId: string,
    approved: boolean,
    reason?: string,
    reviewerId?: string
  ): Promise<VendorProfileResponse> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
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

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    if (vendor.verificationStatus !== VerificationStatus.PENDING) {
      throw new Error('Vendor has already been reviewed');
    }

    if (!approved && !reason) {
      throw new Error('Rejection reason is required when rejecting verification');
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        verificationStatus: approved
          ? VerificationStatus.VERIFIED
          : VerificationStatus.REJECTED,
        rejectionReason: !approved ? reason : null,
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

    // Log verification action
    await this.logVerificationAction(vendorId, approved, reason, reviewerId);

    // TODO: Send notification email to vendor
    // await this.notifyVendorVerificationStatus(vendorId, approved, reason);

    return this.mapVendorToResponse(updated);
  }

  /**
   * Create a service listing
   */
  async createServiceListing(
    vendorId: string,
    serviceData: CreateServiceDTO
  ): Promise<ServiceListingResponse> {
    // Verify vendor exists and is verified
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    if (vendor.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new Error('Vendor must be verified to create service listings');
    }

    const service = await prisma.serviceListing.create({
      data: {
        vendorId,
        title: serviceData.title,
        description: serviceData.description,
        category: serviceData.category as ServiceCategory,
        pricing: serviceData.pricing as any,
        availability: serviceData.availability as any,
        serviceArea: serviceData.serviceArea,
        requirements: serviceData.requirements,
        inclusions: serviceData.inclusions,
        exclusions: serviceData.exclusions || [],
        media: serviceData.media as any,
        status: 'ACTIVE',
      },
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

    return this.mapServiceToResponse(service);
  }

  /**
   * Update a service listing
   */
  async updateServiceListing(
    listingId: string,
    updates: UpdateServiceDTO
  ): Promise<ServiceListingResponse> {
    const service = await prisma.serviceListing.findUnique({
      where: { id: listingId },
    });

    if (!service) {
      throw new Error('Service listing not found');
    }

    const updated = await prisma.serviceListing.update({
      where: { id: listingId },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.category && { category: updates.category as ServiceCategory }),
        ...(updates.pricing && { pricing: updates.pricing as any }),
        ...(updates.availability && { availability: updates.availability as any }),
        ...(updates.serviceArea && { serviceArea: updates.serviceArea }),
        ...(updates.requirements !== undefined && { requirements: updates.requirements }),
        ...(updates.inclusions && { inclusions: updates.inclusions }),
        ...(updates.exclusions && { exclusions: updates.exclusions }),
        ...(updates.media && { media: updates.media as any }),
        ...(updates.status && { status: updates.status }),
      },
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

    return this.mapServiceToResponse(updated);
  }

  /**
   * Get vendor's service listings
   */
  async getVendorServiceListings(vendorId: string): Promise<ServiceListingResponse[]> {
    const services = await prisma.serviceListing.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
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
   * Delete a service listing
   */
  async deleteServiceListing(listingId: string): Promise<boolean> {
    const service = await prisma.serviceListing.findUnique({
      where: { id: listingId },
    });

    if (!service) {
      throw new Error('Service listing not found');
    }

    await prisma.serviceListing.delete({
      where: { id: listingId },
    });

    return true;
  }

  /**
   * Get vendor analytics (delegated to analytics service)
   */
  async getVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
    // Import here to avoid circular dependency
    const { vendorAnalyticsService } = await import('./vendor-analytics.service');
    return vendorAnalyticsService.getEnhancedVendorAnalytics(vendorId);
  }

  /**
   * Get vendor performance metrics
   */
  async getVendorPerformanceMetrics(vendorId: string) {
    const { vendorAnalyticsService } = await import('./vendor-analytics.service');
    return vendorAnalyticsService.calculateVendorPerformanceMetrics(vendorId);
  }

  /**
   * Get vendor insights and recommendations
   */
  async getVendorInsights(vendorId: string) {
    const { vendorAnalyticsService } = await import('./vendor-analytics.service');
    return vendorAnalyticsService.generateVendorInsights(vendorId);
  }

  /**
   * Get vendor trend data
   */
  async getVendorTrendData(vendorId: string, months?: number) {
    const { vendorAnalyticsService } = await import('./vendor-analytics.service');
    return vendorAnalyticsService.generateVendorTrendData(vendorId, months);
  }

  /**
   * Get market intelligence
   */
  async getMarketIntelligence() {
    const { vendorAnalyticsService } = await import('./vendor-analytics.service');
    return vendorAnalyticsService.getMarketIntelligence();
  }

  /**
   * List all vendors with filters
   */
  async listVendors(filters?: {
    category?: ServiceCategory;
    verificationStatus?: VerificationStatus;
    location?: string;
    limit?: number;
    offset?: number;
  }): Promise<VendorProfileResponse[]> {
    const where: any = {};

    if (filters?.category) {
      where.serviceCategories = {
        has: filters.category,
      };
    }

    if (filters?.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    if (filters?.location) {
      where.businessAddress = {
        path: ['city'],
        equals: filters.location,
      };
    }

    const vendors = await prisma.vendorProfile.findMany({
      where,
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      orderBy: [
        { verificationStatus: 'desc' }, // Verified vendors first
        { rating: 'desc' },
        { reviewCount: 'desc' },
        { createdAt: 'desc' },
      ],
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

    return vendors.map((vendor) => this.mapVendorToResponse(vendor));
  }

  /**
   * Get verification badge information for a vendor
   */
  getVerificationBadge(verificationStatus: VerificationStatus): {
    isVerified: boolean;
    badgeText: string;
    badgeColor: string;
    description: string;
  } {
    switch (verificationStatus) {
      case VerificationStatus.VERIFIED:
        return {
          isVerified: true,
          badgeText: 'Verified',
          badgeColor: 'green',
          description: 'This vendor has been verified by our team and meets our quality standards.',
        };
      case VerificationStatus.PENDING:
        return {
          isVerified: false,
          badgeText: 'Verification Pending',
          badgeColor: 'yellow',
          description: 'This vendor\'s verification is currently under review.',
        };
      case VerificationStatus.REJECTED:
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
  }

  /**
   * Get verified vendors count by category
   */
  async getVerifiedVendorsByCategory(): Promise<Record<string, number>> {
    const result = await prisma.vendorProfile.groupBy({
      by: ['serviceCategories'],
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
      },
      _count: {
        id: true,
      },
    });

    const categoryCount: Record<string, number> = {};
    
    result.forEach((item) => {
      item.serviceCategories.forEach((category) => {
        categoryCount[category] = (categoryCount[category] || 0) + item._count.id;
      });
    });

    return categoryCount;
  }

  /**
   * Get vendors pending verification
   */
  async getVendorsPendingVerification(
    limit?: number,
    offset?: number
  ): Promise<VendorProfileResponse[]> {
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        verificationStatus: VerificationStatus.PENDING,
      },
      take: limit || 50,
      skip: offset || 0,
      orderBy: { createdAt: 'asc' }, // Oldest first for FIFO processing
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

    return vendors.map((vendor) => this.mapVendorToResponse(vendor));
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  }> {
    const [pending, verified, rejected, total] = await Promise.all([
      prisma.vendorProfile.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      prisma.vendorProfile.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      prisma.vendorProfile.count({
        where: { verificationStatus: VerificationStatus.REJECTED },
      }),
      prisma.vendorProfile.count(),
    ]);

    return { pending, verified, rejected, total };
  }

  /**
   * Resubmit verification after rejection
   */
  async resubmitVerification(
    vendorId: string,
    documents: VerificationDocuments
  ): Promise<VendorProfileResponse> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
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

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    if (vendor.verificationStatus !== VerificationStatus.REJECTED) {
      throw new Error('Can only resubmit verification for rejected vendors');
    }

    // Validate required documents
    this.validateVerificationDocuments(vendor.serviceCategories, documents);

    const updated = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        verificationDocuments: documents as any,
        verificationStatus: VerificationStatus.PENDING,
        rejectionReason: null,
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

    return this.mapVendorToResponse(updated);
  }

  /**
   * Validate verification documents based on service categories
   */
  private validateVerificationDocuments(
    serviceCategories: ServiceCategory[],
    documents: VerificationDocuments
  ): void {
    // Basic required documents for all vendors
    if (!documents.businessLicense) {
      throw new Error('Business license is required for verification');
    }

    if (!documents.identityVerification) {
      throw new Error('Identity verification document is required');
    }

    // Category-specific requirements
    const requiresInsurance: ServiceCategory[] = [
      ServiceCategory.CATERING,
      ServiceCategory.TRANSPORTATION,
      ServiceCategory.EQUIPMENT_RENTAL,
      ServiceCategory.SECURITY,
      ServiceCategory.CLEANING,
    ];

    if (serviceCategories.some(cat => requiresInsurance.includes(cat))) {
      if (!documents.insuranceCertificate) {
        throw new Error('Insurance certificate is required for this service category');
      }
    }

    // Portfolio samples required for creative services
    const requiresPortfolio: ServiceCategory[] = [
      ServiceCategory.PHOTOGRAPHY,
      ServiceCategory.VIDEOGRAPHY,
      ServiceCategory.ENTERTAINMENT,
      ServiceCategory.DECORATION,
      ServiceCategory.MARKETING,
    ];

    if (serviceCategories.some(cat => requiresPortfolio.includes(cat))) {
      if (!documents.portfolioSamples || documents.portfolioSamples.length === 0) {
        throw new Error('Portfolio samples are required for this service category');
      }
    }
  }

  /**
   * Log verification action for audit trail
   */
  private async logVerificationAction(
    vendorId: string,
    approved: boolean,
    reason?: string,
    reviewerId?: string
  ): Promise<void> {
    // In a real implementation, this would log to an audit table
    // For now, we'll just log to console
    console.log(`Verification action logged:`, {
      vendorId,
      approved,
      reason,
      reviewerId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Map database vendor to response format
   */
  private mapVendorToResponse(vendor: any): VendorProfileResponse & { verificationBadge?: any } {
    const verificationBadge = this.getVerificationBadge(vendor.verificationStatus);
    
    return {
      id: vendor.id,
      userId: vendor.userId,
      businessName: vendor.businessName,
      description: vendor.description,
      contactInfo: vendor.contactInfo as any,
      serviceCategories: vendor.serviceCategories,
      businessAddress: vendor.businessAddress as any,
      verificationStatus: vendor.verificationStatus,
      verificationDocuments: vendor.verificationDocuments as any,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      portfolio: vendor.portfolio as any,
      businessHours: vendor.businessHours as any,
      responseTime: vendor.responseTime,
      completionRate: vendor.completionRate,
      rejectionReason: vendor.rejectionReason,
      verificationBadge,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }

  /**
   * Map database service to response format
   */
  private mapServiceToResponse(service: any): ServiceListingResponse {
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
      vendor: service.vendor ? this.mapVendorToResponse(service.vendor) : undefined,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

export const vendorService = new VendorService();