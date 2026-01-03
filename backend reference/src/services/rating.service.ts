import { PrismaClient, ServiceCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface RatingWeights {
  recency: number;        // Weight for recent reviews (0-1)
  reviewerCredibility: number; // Weight for reviewer credibility (0-1)
  categoryBenchmark: number;   // Weight for category-specific benchmarks (0-1)
  volumeBonus: number;    // Bonus for high review volume (0-1)
}

export interface VendorRankingFactors {
  rating: number;         // Overall rating (0-5)
  reviewCount: number;    // Number of reviews
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  completionRate: number; // Percentage of completed bookings
  responseTime: number;   // Average response time in hours
  categoryRank: number;   // Rank within service category
}

export interface CategoryBenchmarks {
  averageRating: number;
  averageReviewCount: number;
  averageCompletionRate: number;
  averageResponseTime: number;
}

export class RatingService {
  private readonly DEFAULT_WEIGHTS: RatingWeights = {
    recency: 0.3,
    reviewerCredibility: 0.2,
    categoryBenchmark: 0.3,
    volumeBonus: 0.2,
  };

  /**
   * Calculate weighted rating for a vendor using advanced algorithms
   */
  async calculateWeightedRating(
    vendorId: string,
    weights: RatingWeights = this.DEFAULT_WEIGHTS
  ): Promise<{
    weightedRating: number;
    baseRating: number;
    adjustments: {
      recencyAdjustment: number;
      credibilityAdjustment: number;
      categoryAdjustment: number;
      volumeBonus: number;
    };
    confidence: number;
  }> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        reviews: {
          include: {
            organizer: {
              include: {
                organizedEvents: true,
                registrations: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor || vendor.reviews.length === 0) {
      return {
        weightedRating: 0,
        baseRating: 0,
        adjustments: {
          recencyAdjustment: 0,
          credibilityAdjustment: 0,
          categoryAdjustment: 0,
          volumeBonus: 0,
        },
        confidence: 0,
      };
    }

    // Calculate base rating (simple average)
    const baseRating = vendor.reviews.reduce((sum, review) => sum + review.rating, 0) / vendor.reviews.length;

    // Calculate recency adjustment
    const recencyAdjustment = this.calculateRecencyAdjustment(vendor.reviews);

    // Calculate reviewer credibility adjustment
    const credibilityAdjustment = this.calculateCredibilityAdjustment(vendor.reviews);

    // Calculate category benchmark adjustment
    const categoryAdjustment = await this.calculateCategoryAdjustment(vendorId, vendor.serviceCategories, baseRating);

    // Calculate volume bonus
    const volumeBonus = this.calculateVolumeBonus(vendor.reviews.length);

    // Apply weights and calculate final rating
    const weightedRating = Math.min(5, Math.max(1, 
      baseRating + 
      (recencyAdjustment * weights.recency) +
      (credibilityAdjustment * weights.reviewerCredibility) +
      (categoryAdjustment * weights.categoryBenchmark) +
      (volumeBonus * weights.volumeBonus)
    ));

    // Calculate confidence score based on review count and distribution
    const confidence = this.calculateConfidenceScore(vendor.reviews);

    return {
      weightedRating: Math.round(weightedRating * 10) / 10,
      baseRating: Math.round(baseRating * 10) / 10,
      adjustments: {
        recencyAdjustment: Math.round(recencyAdjustment * 100) / 100,
        credibilityAdjustment: Math.round(credibilityAdjustment * 100) / 100,
        categoryAdjustment: Math.round(categoryAdjustment * 100) / 100,
        volumeBonus: Math.round(volumeBonus * 100) / 100,
      },
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Get category benchmarks for comparison
   */
  async getCategoryBenchmarks(category: ServiceCategory): Promise<CategoryBenchmarks> {
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        serviceCategories: {
          has: category,
        },
        verificationStatus: 'VERIFIED',
        reviewCount: {
          gt: 0,
        },
      },
      select: {
        rating: true,
        reviewCount: true,
        completionRate: true,
        responseTime: true,
      },
    });

    if (vendors.length === 0) {
      return {
        averageRating: 4.0,
        averageReviewCount: 10,
        averageCompletionRate: 95,
        averageResponseTime: 24,
      };
    }

    return {
      averageRating: vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length,
      averageReviewCount: vendors.reduce((sum, v) => sum + v.reviewCount, 0) / vendors.length,
      averageCompletionRate: vendors.reduce((sum, v) => sum + v.completionRate, 0) / vendors.length,
      averageResponseTime: vendors.reduce((sum, v) => sum + v.responseTime, 0) / vendors.length,
    };
  }

  /**
   * Rank vendors based on multiple factors
   */
  async rankVendors(
    category?: ServiceCategory,
    location?: string,
    limit: number = 50
  ): Promise<Array<{
    vendorId: string;
    businessName: string;
    overallScore: number;
    ranking: number;
    factors: VendorRankingFactors;
  }>> {
    const whereClause: any = {
      verificationStatus: 'VERIFIED',
    };

    if (category) {
      whereClause.serviceCategories = {
        has: category,
      };
    }

    if (location) {
      whereClause.businessAddress = {
        path: ['city'],
        equals: location,
      };
    }

    const vendors = await prisma.vendorProfile.findMany({
      where: whereClause,
      include: {
        reviews: true,
        bookingRequests: {
          select: {
            status: true,
          },
        },
      },
      take: limit * 2, // Get more to allow for filtering
    });

    // Calculate scores for each vendor
    const vendorScores = await Promise.all(
      vendors.map(async (vendor) => {
        const weightedRating = await this.calculateWeightedRating(vendor.id);
        const categoryRank = await this.getCategoryRank(vendor.id, vendor.serviceCategories[0]);
        
        const factors: VendorRankingFactors = {
          rating: weightedRating.weightedRating,
          reviewCount: vendor.reviewCount,
          verificationStatus: vendor.verificationStatus as 'VERIFIED' | 'PENDING' | 'REJECTED',
          completionRate: vendor.completionRate,
          responseTime: vendor.responseTime,
          categoryRank,
        };

        const overallScore = this.calculateOverallScore(factors);

        return {
          vendorId: vendor.id,
          businessName: vendor.businessName,
          overallScore,
          ranking: 0, // Will be set after sorting
          factors,
        };
      })
    );

    // Sort by overall score and assign rankings
    vendorScores.sort((a, b) => b.overallScore - a.overallScore);
    vendorScores.forEach((vendor, index) => {
      vendor.ranking = index + 1;
    });

    return vendorScores.slice(0, limit);
  }

  /**
   * Update all vendor ratings using the weighted algorithm
   */
  async updateAllVendorRatings(): Promise<{
    updated: number;
    errors: number;
    details: Array<{ vendorId: string; oldRating: number; newRating: number; error?: string }>;
  }> {
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        reviewCount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        rating: true,
      },
    });

    const results = {
      updated: 0,
      errors: 0,
      details: [] as Array<{ vendorId: string; oldRating: number; newRating: number; error?: string }>,
    };

    for (const vendor of vendors) {
      try {
        const weightedRating = await this.calculateWeightedRating(vendor.id);
        
        await prisma.vendorProfile.update({
          where: { id: vendor.id },
          data: { rating: weightedRating.weightedRating },
        });

        results.updated++;
        results.details.push({
          vendorId: vendor.id,
          oldRating: vendor.rating,
          newRating: weightedRating.weightedRating,
        });
      } catch (error) {
        results.errors++;
        results.details.push({
          vendorId: vendor.id,
          oldRating: vendor.rating,
          newRating: vendor.rating,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Get trending vendors based on recent performance
   */
  async getTrendingVendors(
    category?: ServiceCategory,
    limit: number = 10
  ): Promise<Array<{
    vendorId: string;
    businessName: string;
    trendScore: number;
    recentRating: number;
    ratingTrend: 'up' | 'down' | 'stable';
    bookingTrend: 'up' | 'down' | 'stable';
  }>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause: any = {
      verificationStatus: 'VERIFIED',
      reviews: {
        some: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
    };

    if (category) {
      whereClause.serviceCategories = {
        has: category,
      };
    }

    const vendors = await prisma.vendorProfile.findMany({
      where: whereClause,
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
        bookingRequests: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    const trendingVendors = vendors.map((vendor) => {
      const recentReviews = vendor.reviews.filter(
        (review) => review.createdAt >= thirtyDaysAgo
      );
      const olderReviews = vendor.reviews.filter(
        (review) => review.createdAt < thirtyDaysAgo
      );

      const recentRating = recentReviews.length > 0 
        ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
        : vendor.rating;

      const olderRating = olderReviews.length > 0
        ? olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length
        : vendor.rating;

      const ratingTrend = this.getTrend(recentRating, olderRating);
      const bookingTrend = this.getTrend(vendor.bookingRequests.length, vendor.reviewCount - recentReviews.length);

      // Calculate trend score based on recent performance
      const trendScore = this.calculateTrendScore(
        recentRating,
        ratingTrend,
        bookingTrend,
        recentReviews.length
      );

      return {
        vendorId: vendor.id,
        businessName: vendor.businessName,
        trendScore,
        recentRating: Math.round(recentRating * 10) / 10,
        ratingTrend,
        bookingTrend,
      };
    });

    return trendingVendors
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  }

  /**
   * Calculate recency adjustment based on review dates
   */
  private calculateRecencyAdjustment(reviews: any[]): number {
    if (reviews.length === 0) return 0;

    const now = new Date();
    const weights = reviews.map((review) => {
      const daysSinceReview = (now.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      // More recent reviews get higher weight (exponential decay)
      return Math.exp(-daysSinceReview / 90); // 90-day half-life
    });

    const weightedSum = reviews.reduce((sum, review, index) => sum + (review.rating * weights[index]), 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const weightedAverage = weightedSum / totalWeight;

    const simpleAverage = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    // Return the difference (can be positive or negative)
    return weightedAverage - simpleAverage;
  }

  /**
   * Calculate credibility adjustment based on reviewer history
   */
  private calculateCredibilityAdjustment(reviews: any[]): number {
    if (reviews.length === 0) return 0;

    const credibilityScores = reviews.map((review) => {
      let credibility = 1.0; // Base credibility

      // Boost credibility for organizers with more events
      const eventCount = review.organizer?.organizedEvents?.length || 0;
      if (eventCount > 5) credibility += 0.2;
      if (eventCount > 10) credibility += 0.2;

      // Boost credibility for users with more registrations (active users)
      const registrationCount = review.organizer?.registrations?.length || 0;
      if (registrationCount > 10) credibility += 0.1;
      if (registrationCount > 25) credibility += 0.1;

      // Verified purchase always gets full credibility
      if (review.verifiedPurchase) credibility += 0.3;

      return Math.min(2.0, credibility); // Cap at 2.0
    });

    const weightedSum = reviews.reduce((sum, review, index) => sum + (review.rating * credibilityScores[index]), 0);
    const totalWeight = credibilityScores.reduce((sum, score) => sum + score, 0);
    const weightedAverage = weightedSum / totalWeight;

    const simpleAverage = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return weightedAverage - simpleAverage;
  }

  /**
   * Calculate category benchmark adjustment
   */
  private async calculateCategoryAdjustment(
    vendorId: string,
    categories: ServiceCategory[],
    vendorRating: number
  ): Promise<number> {
    if (categories.length === 0) return 0;

    const primaryCategory = categories[0];
    const benchmarks = await this.getCategoryBenchmarks(primaryCategory);

    // Adjust based on how vendor compares to category average
    const categoryDifference = vendorRating - benchmarks.averageRating;

    // Apply a dampening factor to prevent extreme adjustments
    return categoryDifference * 0.1; // 10% of the difference
  }

  /**
   * Calculate volume bonus based on review count
   */
  private calculateVolumeBonus(reviewCount: number): number {
    if (reviewCount < 5) return -0.2; // Penalty for very few reviews
    if (reviewCount < 10) return 0;   // Neutral
    if (reviewCount < 25) return 0.1; // Small bonus
    if (reviewCount < 50) return 0.2; // Medium bonus
    return 0.3; // Large bonus for high volume
  }

  /**
   * Calculate confidence score based on review distribution
   */
  private calculateConfidenceScore(reviews: any[]): number {
    if (reviews.length === 0) return 0;
    if (reviews.length < 3) return 0.3;

    // Calculate standard deviation
    const ratings = reviews.map(r => r.rating);
    const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / ratings.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    const distributionScore = Math.max(0, 1 - (stdDev / 2)); // Normalize to 0-1

    // More reviews = higher confidence (with diminishing returns)
    const volumeScore = Math.min(1, Math.log(reviews.length) / Math.log(50));

    return (distributionScore * 0.6) + (volumeScore * 0.4);
  }

  /**
   * Get vendor's rank within their category
   */
  private async getCategoryRank(vendorId: string, category: ServiceCategory): Promise<number> {
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        serviceCategories: {
          has: category,
        },
        verificationStatus: 'VERIFIED',
      },
      select: {
        id: true,
        rating: true,
        reviewCount: true,
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    });

    const rank = vendors.findIndex(v => v.id === vendorId) + 1;
    return rank || vendors.length + 1;
  }

  /**
   * Calculate overall score for vendor ranking
   */
  private calculateOverallScore(factors: VendorRankingFactors): number {
    let score = 0;

    // Rating component (40% weight)
    score += (factors.rating / 5) * 40;

    // Review count component (20% weight) - logarithmic scale
    const reviewScore = Math.min(20, Math.log(factors.reviewCount + 1) * 5);
    score += reviewScore;

    // Verification bonus (10% weight)
    if (factors.verificationStatus === 'VERIFIED') {
      score += 10;
    }

    // Completion rate component (15% weight)
    score += (factors.completionRate / 100) * 15;

    // Response time component (10% weight) - inverse relationship
    const responseScore = Math.max(0, 10 - (factors.responseTime / 24) * 10);
    score += responseScore;

    // Category rank component (5% weight) - inverse relationship
    const rankScore = Math.max(0, 5 - (factors.categoryRank / 10));
    score += rankScore;

    return Math.round(score * 10) / 10;
  }

  /**
   * Determine trend direction
   */
  private getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const threshold = 0.1; // 10% change threshold
    const change = (current - previous) / previous;

    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  /**
   * Calculate trend score for trending vendors
   */
  private calculateTrendScore(
    recentRating: number,
    ratingTrend: 'up' | 'down' | 'stable',
    bookingTrend: 'up' | 'down' | 'stable',
    recentReviewCount: number
  ): number {
    let score = recentRating * 20; // Base score from rating

    // Trend bonuses
    if (ratingTrend === 'up') score += 10;
    if (bookingTrend === 'up') score += 15;

    // Recent activity bonus
    score += Math.min(10, recentReviewCount * 2);

    return Math.round(score * 10) / 10;
  }
}

export const ratingService = new RatingService();