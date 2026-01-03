import { PrismaClient } from '@prisma/client';
import { VendorAnalytics } from '../types';

const prisma = new PrismaClient();

export interface VendorPerformanceMetrics {
  vendorId: string;
  listingViews: number;
  inquiryCount: number;
  bookingCount: number;
  conversionRate: number;
  inquiryToBookingRate: number;
  averageResponseTime: number;
  completionRate: number;
  repeatCustomerRate: number;
  averageRating: number;
  totalReviews: number;
  revenue: number;
  averageOrderValue: number;
}

export interface VendorTrendData {
  viewsOverTime: Array<{ date: string; views: number }>;
  bookingsOverTime: Array<{ date: string; bookings: number }>;
  revenueOverTime: Array<{ date: string; revenue: number }>;
  inquiriesOverTime: Array<{ date: string; inquiries: number }>;
}

export interface VendorInsights {
  seasonalDemandPatterns: Array<{
    month: string;
    demandScore: number;
    bookingCount: number;
  }>;
  competitivePositioning: {
    marketRank: number;
    totalCompetitors: number;
    pricePosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET';
    ratingPosition: 'BELOW_AVERAGE' | 'AVERAGE' | 'ABOVE_AVERAGE';
  };
  pricingRecommendations: Array<{
    serviceId: string;
    serviceName: string;
    currentPrice: number;
    recommendedPrice: number;
    reasoning: string;
  }>;
  improvementSuggestions: Array<{
    category: 'RESPONSE_TIME' | 'PRICING' | 'SERVICE_QUALITY' | 'PORTFOLIO';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestion: string;
    expectedImpact: string;
  }>;
}

export interface VendorMarketIntelligence {
  categoryDemandForecast: Array<{
    category: string;
    currentDemand: number;
    projectedDemand: number;
    growthRate: number;
  }>;
  pricingBenchmarks: Array<{
    category: string;
    averagePrice: number;
    medianPrice: number;
    priceRange: { min: number; max: number };
  }>;
  emergingTrends: Array<{
    trend: string;
    description: string;
    relevanceScore: number;
    actionable: boolean;
  }>;
}

export class VendorAnalyticsService {
  /**
   * Calculate comprehensive vendor performance metrics
   * Requirements: 31.1, 31.2
   */
  async calculateVendorPerformanceMetrics(vendorId: string): Promise<VendorPerformanceMetrics> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        serviceListings: true,
        bookingRequests: {
          include: {
            paymentRecords: true,
          },
        },
        reviews: true,
      },
    });

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    // Calculate basic metrics
    const totalViews = vendor.serviceListings.reduce(
      (sum, service) => sum + service.viewCount,
      0
    );
    
    const totalInquiries = vendor.serviceListings.reduce(
      (sum, service) => sum + service.inquiryCount,
      0
    );
    
    const totalBookings = vendor.bookingRequests.length;
    const completedBookings = vendor.bookingRequests.filter(
      (booking) => booking.status === 'COMPLETED'
    ).length;

    // Calculate conversion rates
    const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;
    const inquiryToBookingRate = totalInquiries > 0 ? (totalBookings / totalInquiries) * 100 : 0;

    // Calculate revenue metrics
    const totalRevenue = vendor.bookingRequests
      .filter((booking) => booking.status === 'COMPLETED')
      .reduce((sum, booking) => {
        const completedPayments = booking.paymentRecords.filter(
          (payment) => payment.status === 'COMPLETED'
        );
        return sum + completedPayments.reduce((paySum, payment) => paySum + payment.vendorPayout, 0);
      }, 0);

    const averageOrderValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    // Calculate repeat customer rate
    const uniqueCustomers = new Set(vendor.bookingRequests.map(b => b.organizerId));
    const repeatCustomers = vendor.bookingRequests.reduce((acc, booking) => {
      const customerBookings = vendor.bookingRequests.filter(b => b.organizerId === booking.organizerId);
      if (customerBookings.length > 1 && !acc.has(booking.organizerId)) {
        acc.add(booking.organizerId);
      }
      return acc;
    }, new Set());
    
    const repeatCustomerRate = uniqueCustomers.size > 0 ? 
      (repeatCustomers.size / uniqueCustomers.size) * 100 : 0;

    return {
      vendorId,
      listingViews: totalViews,
      inquiryCount: totalInquiries,
      bookingCount: totalBookings,
      conversionRate,
      inquiryToBookingRate,
      averageResponseTime: vendor.responseTime,
      completionRate: vendor.completionRate,
      repeatCustomerRate,
      averageRating: vendor.rating,
      totalReviews: vendor.reviewCount,
      revenue: totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Generate trend data for vendor performance over time
   * Requirements: 31.2
   */
  async generateVendorTrendData(vendorId: string, months: number = 12): Promise<VendorTrendData> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get bookings over time
    const bookings = await prisma.bookingRequest.findMany({
      where: {
        vendorId,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        paymentRecords: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group data by month
    const monthlyData = new Map<string, {
      bookings: number;
      revenue: number;
      inquiries: number;
    }>();

    // Initialize all months
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
      monthlyData.set(monthKey, { bookings: 0, revenue: 0, inquiries: 0 });
    }

    // Aggregate booking data
    bookings.forEach((booking) => {
      const monthKey = booking.createdAt.toISOString().substring(0, 7);
      const data = monthlyData.get(monthKey);
      if (data) {
        data.bookings += 1;
        if (booking.status === 'COMPLETED') {
          const revenue = booking.paymentRecords
            .filter(p => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + p.vendorPayout, 0);
          data.revenue += revenue;
        }
      }
    });

    // Get service listing view data (simulated - in real implementation, this would come from analytics tracking)
    const serviceListings = await prisma.serviceListing.findMany({
      where: { vendorId },
      select: { viewCount: true },
    });

    const totalViews = serviceListings.reduce((sum, s) => sum + s.viewCount, 0);
    const avgViewsPerMonth = Math.floor(totalViews / months);

    // Convert to arrays
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    
    return {
      viewsOverTime: sortedMonths.map((month) => ({
        date: month,
        views: avgViewsPerMonth + Math.floor(Math.random() * 20) - 10, // Simulated variation
      })),
      bookingsOverTime: sortedMonths.map((month) => ({
        date: month,
        bookings: monthlyData.get(month)?.bookings || 0,
      })),
      revenueOverTime: sortedMonths.map((month) => ({
        date: month,
        revenue: monthlyData.get(month)?.revenue || 0,
      })),
      inquiriesOverTime: sortedMonths.map((month) => ({
        date: month,
        inquiries: monthlyData.get(month)?.inquiries || 0,
      })),
    };
  }

  /**
   * Generate performance insights and recommendations
   * Requirements: 31.3
   */
  async generateVendorInsights(vendorId: string): Promise<VendorInsights> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        serviceListings: true,
        bookingRequests: {
          include: {
            paymentRecords: true,
          },
        },
        reviews: true,
      },
    });

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    // Calculate seasonal demand patterns
    const seasonalPatterns = await this.calculateSeasonalDemandPatterns(vendorId);

    // Calculate competitive positioning
    const competitivePositioning = await this.calculateCompetitivePositioning(vendor);

    // Generate pricing recommendations
    const pricingRecommendations = await this.generatePricingRecommendations(vendor);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(vendor);

    return {
      seasonalDemandPatterns: seasonalPatterns,
      competitivePositioning,
      pricingRecommendations,
      improvementSuggestions,
    };
  }

  /**
   * Calculate seasonal demand patterns
   */
  private async calculateSeasonalDemandPatterns(vendorId: string) {
    const bookings = await prisma.bookingRequest.findMany({
      where: { vendorId },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const monthlyBookings = new Map<string, number>();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Initialize all months
    months.forEach(month => monthlyBookings.set(month, 0));

    // Count bookings by month
    bookings.forEach(booking => {
      const month = months[booking.createdAt.getMonth()];
      monthlyBookings.set(month, (monthlyBookings.get(month) || 0) + 1);
    });

    const maxBookings = Math.max(...Array.from(monthlyBookings.values()));

    return months.map((month) => ({
      month,
      demandScore: maxBookings > 0 ? Math.round(((monthlyBookings.get(month) || 0) / maxBookings) * 100) : 0,
      bookingCount: monthlyBookings.get(month) || 0,
    }));
  }

  /**
   * Calculate competitive positioning
   */
  private async calculateCompetitivePositioning(vendor: any) {
    // Get competitors in the same categories
    const competitors = await prisma.vendorProfile.findMany({
      where: {
        serviceCategories: {
          hasSome: vendor.serviceCategories,
        },
        id: {
          not: vendor.id,
        },
        verificationStatus: 'VERIFIED',
      },
      include: {
        serviceListings: true,
      },
    });

    const totalCompetitors = competitors.length;
    
    // Calculate market rank based on rating and review count
    const allVendors = [...competitors, vendor].sort((a, b) => {
      const scoreA = a.rating * Math.log(a.reviewCount + 1);
      const scoreB = b.rating * Math.log(b.reviewCount + 1);
      return scoreB - scoreA;
    });

    const marketRank = allVendors.findIndex(v => v.id === vendor.id) + 1;

    // Calculate average pricing for comparison
    const allPrices = competitors.flatMap(c => 
      c.serviceListings.map(s => {
        const pricing = s.pricing as any;
        return pricing.basePrice || 0;
      }).filter(p => p > 0)
    );

    const vendorPrices = vendor.serviceListings.map((s: any) => {
      const pricing = s.pricing as any;
      return pricing.basePrice || 0;
    }).filter((p: number) => p > 0);

    const avgMarketPrice = allPrices.length > 0 ? 
      allPrices.reduce((sum: number, p: number) => sum + p, 0) / allPrices.length : 0;
    const avgVendorPrice = vendorPrices.length > 0 ? 
      vendorPrices.reduce((sum: number, p: number) => sum + p, 0) / vendorPrices.length : 0;

    let pricePosition: 'BELOW_MARKET' | 'AT_MARKET' | 'ABOVE_MARKET' = 'AT_MARKET';
    if (avgVendorPrice > 0 && avgMarketPrice > 0) {
      const priceDiff = (avgVendorPrice - avgMarketPrice) / avgMarketPrice;
      if (priceDiff > 0.1) pricePosition = 'ABOVE_MARKET';
      else if (priceDiff < -0.1) pricePosition = 'BELOW_MARKET';
    }

    // Calculate rating position
    const avgMarketRating = competitors.length > 0 ? 
      competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length : 0;
    
    let ratingPosition: 'BELOW_AVERAGE' | 'AVERAGE' | 'ABOVE_AVERAGE' = 'AVERAGE';
    if (avgMarketRating > 0) {
      const ratingDiff = vendor.rating - avgMarketRating;
      if (ratingDiff > 0.2) ratingPosition = 'ABOVE_AVERAGE';
      else if (ratingDiff < -0.2) ratingPosition = 'BELOW_AVERAGE';
    }

    return {
      marketRank,
      totalCompetitors,
      pricePosition,
      ratingPosition,
    };
  }

  /**
   * Generate pricing recommendations
   */
  private async generatePricingRecommendations(vendor: any) {
    const recommendations = [];

    for (const service of vendor.serviceListings) {
      const pricing = service.pricing as any;
      const currentPrice = pricing.basePrice || 0;

      if (currentPrice === 0) continue;

      // Get similar services for comparison
      const similarServices = await prisma.serviceListing.findMany({
        where: {
          category: service.category,
          id: { not: service.id },
          status: 'ACTIVE',
        },
        include: {
          vendor: true,
        },
      });

      if (similarServices.length === 0) continue;

      const similarPrices = similarServices
        .map(s => {
          const p = s.pricing as any;
          return p.basePrice || 0;
        })
        .filter(p => p > 0);

      if (similarPrices.length === 0) continue;

      const avgMarketPrice = similarPrices.reduce((sum: number, p: number) => sum + p, 0) / similarPrices.length;

      let recommendedPrice = currentPrice;
      let reasoning = 'Current pricing is appropriate';

      // Analyze performance metrics
      const conversionRate = service.inquiryCount > 0 ? 
        (service.bookingCount / service.inquiryCount) * 100 : 0;

      if (conversionRate < 10 && currentPrice > avgMarketPrice * 1.2) {
        recommendedPrice = Math.round(avgMarketPrice * 1.1);
        reasoning = 'Lower price to improve conversion rate - currently above market average';
      } else if (conversionRate > 30 && vendor.rating > 4.0) {
        recommendedPrice = Math.round(Math.min(currentPrice * 1.15, avgMarketPrice * 1.3));
        reasoning = 'Increase price due to high demand and excellent rating';
      } else if (currentPrice < avgMarketPrice * 0.8) {
        recommendedPrice = Math.round(avgMarketPrice * 0.9);
        reasoning = 'Increase price to match market standards and improve perceived value';
      }

      if (recommendedPrice !== currentPrice) {
        recommendations.push({
          serviceId: service.id,
          serviceName: service.title,
          currentPrice,
          recommendedPrice,
          reasoning,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(vendor: any) {
    const suggestions = [];

    // Response time suggestions
    if (vendor.responseTime > 24) {
      suggestions.push({
        category: 'RESPONSE_TIME' as const,
        priority: 'HIGH' as const,
        suggestion: 'Improve response time to under 24 hours to increase booking conversion',
        expectedImpact: 'Could increase bookings by 15-25%',
      });
    } else if (vendor.responseTime > 12) {
      suggestions.push({
        category: 'RESPONSE_TIME' as const,
        priority: 'MEDIUM' as const,
        suggestion: 'Aim for response time under 12 hours for competitive advantage',
        expectedImpact: 'Could increase bookings by 5-15%',
      });
    }

    // Rating suggestions
    if (vendor.rating < 4.0) {
      suggestions.push({
        category: 'SERVICE_QUALITY' as const,
        priority: 'HIGH' as const,
        suggestion: 'Focus on improving service quality to achieve 4+ star rating',
        expectedImpact: 'Higher ratings significantly improve booking rates',
      });
    }

    // Portfolio suggestions
    if (vendor.portfolio.length < 5) {
      suggestions.push({
        category: 'PORTFOLIO' as const,
        priority: 'MEDIUM' as const,
        suggestion: 'Add more portfolio samples to showcase your work quality',
        expectedImpact: 'Rich portfolios increase trust and booking likelihood',
      });
    }

    // Completion rate suggestions
    if (vendor.completionRate < 90) {
      suggestions.push({
        category: 'SERVICE_QUALITY' as const,
        priority: 'HIGH' as const,
        suggestion: 'Improve project completion rate to build trust with clients',
        expectedImpact: 'Higher completion rates lead to better reviews and repeat business',
      });
    }

    return suggestions;
  }

  /**
   * Get market intelligence data
   * Requirements: 31.4, 31.5
   */
  async getMarketIntelligence(): Promise<VendorMarketIntelligence> {
    // Calculate category demand forecast
    const categoryDemandForecast = await this.calculateCategoryDemandForecast();

    // Calculate pricing benchmarks
    const pricingBenchmarks = await this.calculatePricingBenchmarks();

    // Get emerging trends (simulated data - in real implementation, this would come from market analysis)
    const emergingTrends = [
      {
        trend: 'Sustainable Event Services',
        description: 'Growing demand for eco-friendly and sustainable event solutions',
        relevanceScore: 85,
        actionable: true,
      },
      {
        trend: 'Hybrid Event Technology',
        description: 'Increased need for services supporting both in-person and virtual attendees',
        relevanceScore: 90,
        actionable: true,
      },
      {
        trend: 'Personalized Event Experiences',
        description: 'Clients seeking more customized and personalized event services',
        relevanceScore: 75,
        actionable: true,
      },
      {
        trend: 'Health and Safety Protocols',
        description: 'Continued emphasis on health and safety measures in event planning',
        relevanceScore: 70,
        actionable: true,
      },
    ];

    return {
      categoryDemandForecast,
      pricingBenchmarks,
      emergingTrends,
    };
  }

  /**
   * Calculate category demand forecast
   */
  private async calculateCategoryDemandForecast() {
    const categories = [
      'VENUE', 'CATERING', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'ENTERTAINMENT',
      'DECORATION', 'AUDIO_VISUAL', 'TRANSPORTATION', 'SECURITY', 'CLEANING'
    ];

    const forecasts = [];

    for (const category of categories) {
      // Get current bookings for this category
      const currentBookings = await prisma.bookingRequest.count({
        where: {
          serviceListing: {
            category: category as any,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      // Get historical bookings for comparison
      const historicalBookings = await prisma.bookingRequest.count({
        where: {
          serviceListing: {
            category: category as any,
          },
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 30-60 days ago
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const growthRate = historicalBookings > 0 ? 
        ((currentBookings - historicalBookings) / historicalBookings) * 100 : 0;

      const projectedDemand = Math.round(currentBookings * (1 + growthRate / 100));

      forecasts.push({
        category,
        currentDemand: currentBookings,
        projectedDemand,
        growthRate,
      });
    }

    return forecasts;
  }

  /**
   * Calculate pricing benchmarks by category
   */
  private async calculatePricingBenchmarks() {
    const categories = [
      'VENUE', 'CATERING', 'PHOTOGRAPHY', 'VIDEOGRAPHY', 'ENTERTAINMENT',
      'DECORATION', 'AUDIO_VISUAL', 'TRANSPORTATION', 'SECURITY', 'CLEANING'
    ];

    const benchmarks = [];

    for (const category of categories) {
      const services = await prisma.serviceListing.findMany({
        where: {
          category: category as any,
          status: 'ACTIVE',
        },
        select: {
          pricing: true,
        },
      });

      const prices = services
        .map(s => {
          const pricing = s.pricing as any;
          return pricing.basePrice || 0;
        })
        .filter((p: number) => p > 0);

      if (prices.length === 0) continue;

      prices.sort((a: number, b: number) => a - b);
      const averagePrice = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
      const medianPrice = prices[Math.floor(prices.length / 2)];
      const minPrice = prices[0];
      const maxPrice = prices[prices.length - 1];

      benchmarks.push({
        category,
        averagePrice: Math.round(averagePrice),
        medianPrice: Math.round(medianPrice),
        priceRange: { min: minPrice, max: maxPrice },
      });
    }

    return benchmarks;
  }

  /**
   * Get enhanced vendor analytics (extends the basic analytics)
   * Requirements: 31.1, 31.2, 31.3
   */
  async getEnhancedVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
    // Get basic analytics from the existing vendor service
    const basicAnalytics = await this.getBasicVendorAnalytics(vendorId);

    // Get enhanced metrics
    const performanceMetrics = await this.calculateVendorPerformanceMetrics(vendorId);
    const trendData = await this.generateVendorTrendData(vendorId);

    // Merge the enhanced data into the basic analytics structure
    return {
      ...basicAnalytics,
      performanceMetrics: {
        responseTime: performanceMetrics.averageResponseTime,
        completionRate: performanceMetrics.completionRate,
        repeatCustomerRate: performanceMetrics.repeatCustomerRate,
      },
      trendData: {
        viewsOverTime: trendData.viewsOverTime,
        bookingsOverTime: trendData.bookingsOverTime,
        revenueOverTime: trendData.revenueOverTime,
      },
    };
  }

  /**
   * Get basic vendor analytics (compatibility with existing interface)
   */
  private async getBasicVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        serviceListings: true,
        bookingRequests: {
          include: {
            paymentRecords: true,
          },
        },
        reviews: true,
      },
    });

    if (!vendor) {
      throw new Error('Vendor profile not found');
    }

    // Calculate basic metrics (same as existing implementation)
    const totalViews = vendor.serviceListings.reduce(
      (sum, service) => sum + service.viewCount,
      0
    );
    const totalInquiries = vendor.serviceListings.reduce(
      (sum, service) => sum + service.inquiryCount,
      0
    );
    const totalBookings = vendor.bookingRequests.length;
    const conversionRate = totalInquiries > 0 ? (totalBookings / totalInquiries) * 100 : 0;

    const totalRevenue = vendor.bookingRequests
      .filter((booking) => booking.status === 'COMPLETED')
      .reduce((sum, booking) => {
        const completedPayments = booking.paymentRecords.filter(
          (payment) => payment.status === 'COMPLETED'
        );
        return sum + completedPayments.reduce((paySum, payment) => paySum + payment.vendorPayout, 0);
      }, 0);

    // Get top services
    const topServices = vendor.serviceListings
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5)
      .map((service) => ({
        serviceId: service.id,
        serviceName: service.title,
        bookingCount: service.bookingCount,
        revenue: 0, // TODO: Calculate per-service revenue
      }));

    return {
      vendorId,
      listingViews: totalViews,
      inquiryCount: totalInquiries,
      bookingCount: totalBookings,
      conversionRate,
      averageRating: vendor.rating,
      totalReviews: vendor.reviewCount,
      revenue: totalRevenue,
      performanceMetrics: {
        responseTime: vendor.responseTime,
        completionRate: vendor.completionRate,
        repeatCustomerRate: 0, // Will be calculated in enhanced metrics
      },
      trendData: {
        viewsOverTime: [], // Will be populated in enhanced metrics
        bookingsOverTime: [],
        revenueOverTime: [],
      },
      topServices,
    };
  }
}

export const vendorAnalyticsService = new VendorAnalyticsService();