import { PrismaClient, BookingStatus } from '@prisma/client';
import {
  CreateReviewDTO,
  VendorReviewResponse,
  PaginatedResponse,
} from '../types';

const prisma = new PrismaClient();

export class ReviewService {
  /**
   * Submit a review for a completed booking
   */
  async submitReview(
    bookingId: string,
    organizerId: string,
    reviewData: CreateReviewDTO
  ): Promise<VendorReviewResponse> {
    // Validate booking exists and is completed
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        vendor: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.organizerId !== organizerId) {
      throw new Error('Unauthorized: You can only review your own bookings');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new Error('Can only review completed bookings');
    }

    // Check if review already exists
    const existingReview = await prisma.vendorReview.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      throw new Error('Review already exists for this booking');
    }

    // Validate review data
    this.validateReviewData(reviewData);

    // Create the review
    const review = await prisma.vendorReview.create({
      data: {
        vendorId: booking.vendorId,
        bookingId,
        organizerId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        serviceQuality: reviewData.serviceQuality,
        communication: reviewData.communication,
        timeliness: reviewData.timeliness,
        value: reviewData.value,
        wouldRecommend: reviewData.wouldRecommend,
        verifiedPurchase: true, // Always true for completed bookings
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update vendor's overall rating and review count
    await this.updateVendorRating(booking.vendorId);

    return this.mapReviewToResponse(review);
  }

  /**
   * Get reviews for a vendor with pagination
   */
  async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' = 'newest'
  ): Promise<PaginatedResponse<VendorReviewResponse>> {
    const offset = (page - 1) * limit;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }; // Default: newest first
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
    }

    const [reviews, total] = await Promise.all([
      prisma.vendorReview.findMany({
        where: { vendorId },
        take: limit,
        skip: offset,
        orderBy,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.vendorReview.count({
        where: { vendorId },
      }),
    ]);

    const mappedReviews = reviews.map((review) => this.mapReviewToResponse(review));

    return {
      data: mappedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a specific review by ID
   */
  async getReview(reviewId: string): Promise<VendorReviewResponse> {
    const review = await prisma.vendorReview.findUnique({
      where: { id: reviewId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return this.mapReviewToResponse(review);
  }

  /**
   * Get review by booking ID
   */
  async getReviewByBooking(bookingId: string): Promise<VendorReviewResponse | null> {
    const review = await prisma.vendorReview.findUnique({
      where: { bookingId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return review ? this.mapReviewToResponse(review) : null;
  }

  /**
   * Vendor responds to a review
   */
  async respondToReview(
    reviewId: string,
    vendorId: string,
    response: string
  ): Promise<VendorReviewResponse> {
    // Validate review exists and belongs to vendor
    const review = await prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.vendorId !== vendorId) {
      throw new Error('Unauthorized: You can only respond to reviews for your services');
    }

    if (review.vendorResponse) {
      throw new Error('You have already responded to this review');
    }

    if (!response.trim()) {
      throw new Error('Response cannot be empty');
    }

    if (response.length > 1000) {
      throw new Error('Response cannot exceed 1000 characters');
    }

    // Update review with vendor response
    const updatedReview = await prisma.vendorReview.update({
      where: { id: reviewId },
      data: {
        vendorResponse: response.trim(),
        vendorResponseAt: new Date(),
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapReviewToResponse(updatedReview);
  }

  /**
   * Mark a review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<VendorReviewResponse> {
    const review = await prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    const updatedReview = await prisma.vendorReview.update({
      where: { id: reviewId },
      data: {
        helpful: review.helpful + 1,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapReviewToResponse(updatedReview);
  }

  /**
   * Get review statistics for a vendor
   */
  async getVendorReviewStats(vendorId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    averageScores: {
      serviceQuality: number;
      communication: number;
      timeliness: number;
      value: number;
    };
    recommendationRate: number;
    recentReviews: VendorReviewResponse[];
  }> {
    const reviews = await prisma.vendorReview.findMany({
      where: { vendorId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageScores: {
          serviceQuality: 0,
          communication: 0,
          timeliness: 0,
          value: 0,
        },
        recommendationRate: 0,
        recentReviews: [],
      };
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    // Average scores for different aspects
    const averageScores = {
      serviceQuality: reviews.reduce((sum, r) => sum + r.serviceQuality, 0) / totalReviews,
      communication: reviews.reduce((sum, r) => sum + r.communication, 0) / totalReviews,
      timeliness: reviews.reduce((sum, r) => sum + r.timeliness, 0) / totalReviews,
      value: reviews.reduce((sum, r) => sum + r.value, 0) / totalReviews,
    };

    // Recommendation rate
    const recommendationCount = reviews.filter((r) => r.wouldRecommend).length;
    const recommendationRate = (recommendationCount / totalReviews) * 100;

    // Recent reviews (last 5)
    const recentReviews = reviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((review) => this.mapReviewToResponse(review));

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution,
      averageScores: {
        serviceQuality: Math.round(averageScores.serviceQuality * 10) / 10,
        communication: Math.round(averageScores.communication * 10) / 10,
        timeliness: Math.round(averageScores.timeliness * 10) / 10,
        value: Math.round(averageScores.value * 10) / 10,
      },
      recommendationRate: Math.round(recommendationRate * 10) / 10,
      recentReviews,
    };
  }

  /**
   * Get reviews that need vendor response
   */
  async getReviewsNeedingResponse(
    vendorId: string,
    limit: number = 10
  ): Promise<VendorReviewResponse[]> {
    const reviews = await prisma.vendorReview.findMany({
      where: {
        vendorId,
        vendorResponse: null,
      },
      take: limit,
      orderBy: { createdAt: 'asc' }, // Oldest first
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return reviews.map((review) => this.mapReviewToResponse(review));
  }

  /**
   * Validate review authenticity (check for verified purchase)
   */
  async validateReviewAuthenticity(reviewId: string): Promise<{
    isAuthentic: boolean;
    verifiedPurchase: boolean;
    bookingCompleted: boolean;
    reason?: string;
  }> {
    const review = await prisma.vendorReview.findUnique({
      where: { id: reviewId },
      include: {
        booking: true,
      },
    });

    if (!review) {
      return {
        isAuthentic: false,
        verifiedPurchase: false,
        bookingCompleted: false,
        reason: 'Review not found',
      };
    }

    const bookingCompleted = review.booking.status === BookingStatus.COMPLETED;
    const verifiedPurchase = review.verifiedPurchase;

    return {
      isAuthentic: bookingCompleted && verifiedPurchase,
      verifiedPurchase,
      bookingCompleted,
    };
  }

  /**
   * Flag a review for moderation
   */
  async flagReview(
    reviewId: string,
    flaggedBy: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const review = await prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // In a real implementation, this would create a moderation record
    // For now, we'll just log the flag
    console.log(`Review flagged:`, {
      reviewId,
      flaggedBy,
      reason,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Review has been flagged for moderation review',
    };
  }

  /**
   * Update vendor's overall rating based on all reviews
   */
  private async updateVendorRating(vendorId: string): Promise<void> {
    const reviews = await prisma.vendorReview.findMany({
      where: { vendorId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return;
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
      },
    });
  }

  /**
   * Validate review data
   */
  private validateReviewData(reviewData: CreateReviewDTO): void {
    // Validate rating
    if (!Number.isInteger(reviewData.rating) || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    // Validate individual scores
    const scores = [
      reviewData.serviceQuality,
      reviewData.communication,
      reviewData.timeliness,
      reviewData.value,
    ];

    for (const score of scores) {
      if (!Number.isInteger(score) || score < 1 || score > 5) {
        throw new Error('All individual scores must be integers between 1 and 5');
      }
    }

    // Validate title
    if (!reviewData.title.trim()) {
      throw new Error('Review title is required');
    }

    if (reviewData.title.length > 100) {
      throw new Error('Review title cannot exceed 100 characters');
    }

    // Validate comment
    if (!reviewData.comment.trim()) {
      throw new Error('Review comment is required');
    }

    if (reviewData.comment.length > 2000) {
      throw new Error('Review comment cannot exceed 2000 characters');
    }

    // Check for inappropriate content (basic implementation)
    const inappropriateWords = ['spam', 'fake', 'scam']; // In real app, use a proper content filter
    const content = `${reviewData.title} ${reviewData.comment}`.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (content.includes(word)) {
        throw new Error('Review contains inappropriate content and cannot be submitted');
      }
    }
  }

  /**
   * Map database review to response format
   */
  private mapReviewToResponse(review: any): VendorReviewResponse {
    return {
      id: review.id,
      vendorId: review.vendorId,
      bookingId: review.bookingId,
      organizerId: review.organizerId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      serviceQuality: review.serviceQuality,
      communication: review.communication,
      timeliness: review.timeliness,
      value: review.value,
      wouldRecommend: review.wouldRecommend,
      vendorResponse: review.vendorResponse,
      vendorResponseAt: review.vendorResponseAt,
      verifiedPurchase: review.verifiedPurchase,
      helpful: review.helpful,
      organizer: review.organizer ? {
        id: review.organizer.id,
        name: review.organizer.name,
      } : undefined,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

export const reviewService = new ReviewService();