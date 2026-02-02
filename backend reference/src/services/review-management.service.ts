import { PrismaClient } from '@prisma/client';
import { VendorReviewResponse, PaginatedResponse } from '../types';

const prisma = new PrismaClient();

export interface ReviewDispute {
  id: string;
  reviewId: string;
  disputedBy: string;
  disputeReason: string;
  disputeDetails: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewModerationAction {
  id: string;
  reviewId: string;
  actionType: 'HIDE' | 'SHOW' | 'EDIT' | 'DELETE' | 'FLAG';
  reason: string;
  moderatorId: string;
  previousState?: any;
  newState?: any;
  createdAt: Date;
}

export interface ReviewQualityMetrics {
  totalReviews: number;
  flaggedReviews: number;
  disputedReviews: number;
  averageHelpfulScore: number;
  responseRate: number;
  averageResponseTime: number; // in hours
  qualityScore: number; // 0-100
}

export class ReviewManagementService {
  /**
   * Create a dispute for a review
   */
  async createDispute(
    reviewId: string,
    disputedBy: string,
    disputeReason: string,
    disputeDetails: string
  ): Promise<ReviewDispute> {
    // Validate review exists
    const review = await prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Check if dispute already exists
    const existingDispute = await this.getDisputeByReview(reviewId);
    if (existingDispute) {
      throw new Error('A dispute already exists for this review');
    }

    // Validate dispute reason
    const validReasons = [
      'FAKE_REVIEW',
      'INAPPROPRIATE_CONTENT',
      'FACTUAL_INACCURACY',
      'PERSONAL_ATTACK',
      'SPAM',
      'COMPETITOR_SABOTAGE',
      'OTHER'
    ];

    if (!validReasons.includes(disputeReason)) {
      throw new Error('Invalid dispute reason');
    }

    if (!disputeDetails.trim() || disputeDetails.length < 20) {
      throw new Error('Dispute details must be at least 20 characters long');
    }

    // Create dispute record (in a real app, this would be a separate table)
    const dispute: ReviewDispute = {
      id: `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reviewId,
      disputedBy,
      disputeReason,
      disputeDetails: disputeDetails.trim(),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real implementation, store in database
    console.log('Dispute created:', dispute);

    // Notify moderators about new dispute
    await this.notifyModeratorsOfDispute(dispute);

    return dispute;
  }

  /**
   * Get dispute by review ID
   */
  async getDisputeByReview(reviewId: string): Promise<ReviewDispute | null> {
    // In a real implementation, query from database
    // For now, return null (no existing disputes)
    return null;
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    resolvedBy: string,
    action?: 'HIDE_REVIEW' | 'EDIT_REVIEW' | 'NO_ACTION'
  ): Promise<ReviewDispute> {
    // In a real implementation, fetch dispute from database
    const dispute = await this.getDispute(disputeId);
    
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    if (dispute.status !== 'PENDING' && dispute.status !== 'UNDER_REVIEW') {
      throw new Error('Dispute has already been resolved');
    }

    if (!resolution.trim()) {
      throw new Error('Resolution is required');
    }

    // Update dispute
    dispute.status = 'RESOLVED';
    dispute.resolution = resolution.trim();
    dispute.resolvedBy = resolvedBy;
    dispute.resolvedAt = new Date();
    dispute.updatedAt = new Date();

    // Apply moderation action if specified
    if (action) {
      let moderationAction: 'HIDE' | 'SHOW' | 'EDIT' | 'DELETE' | 'FLAG';
      switch (action) {
        case 'HIDE_REVIEW':
          moderationAction = 'HIDE';
          break;
        case 'EDIT_REVIEW':
          moderationAction = 'EDIT';
          break;
        case 'NO_ACTION':
        default:
          moderationAction = 'FLAG'; // Default to flagging if no specific action
          break;
      }
      await this.applyModerationAction(dispute.reviewId, moderationAction, resolution, resolvedBy);
    }

    // Notify disputing party of resolution
    await this.notifyDisputeResolution(dispute);

    return dispute;
  }

  /**
   * Get dispute by ID
   */
  async getDispute(disputeId: string): Promise<ReviewDispute | null> {
    // In a real implementation, query from database
    // For now, return a mock dispute for testing
    return null;
  }

  /**
   * Apply moderation action to a review
   */
  async applyModerationAction(
    reviewId: string,
    actionType: 'HIDE' | 'SHOW' | 'EDIT' | 'DELETE' | 'FLAG',
    reason: string,
    moderatorId: string,
    newContent?: { title?: string; comment?: string }
  ): Promise<ReviewModerationAction> {
    const review = await prisma.vendorReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    const previousState = {
      title: review.title,
      comment: review.comment,
      // Add other relevant fields
    };

    let newState = previousState;

    // Apply the action
    switch (actionType) {
      case 'HIDE':
        // In a real implementation, add a 'hidden' field to the review
        console.log(`Hiding review ${reviewId}`);
        break;

      case 'SHOW':
        // In a real implementation, remove 'hidden' flag
        console.log(`Showing review ${reviewId}`);
        break;

      case 'EDIT':
        if (newContent) {
          const updateData: any = {};
          if (newContent.title) {
            updateData.title = newContent.title;
            newState.title = newContent.title;
          }
          if (newContent.comment) {
            updateData.comment = newContent.comment;
            newState.comment = newContent.comment;
          }

          await prisma.vendorReview.update({
            where: { id: reviewId },
            data: updateData,
          });
        }
        break;

      case 'DELETE':
        await prisma.vendorReview.delete({
          where: { id: reviewId },
        });
        break;

      case 'FLAG':
        // In a real implementation, add a 'flagged' field
        console.log(`Flagging review ${reviewId}`);
        break;
    }

    // Create moderation action record
    const action: ReviewModerationAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reviewId,
      actionType,
      reason,
      moderatorId,
      previousState,
      newState,
      createdAt: new Date(),
    };

    // In a real implementation, store in database
    console.log('Moderation action applied:', action);

    return action;
  }

  /**
   * Get reviews requiring moderation
   */
  async getReviewsForModeration(
    page: number = 1,
    limit: number = 20,
    filterBy?: 'FLAGGED' | 'DISPUTED' | 'HIGH_PRIORITY'
  ): Promise<PaginatedResponse<VendorReviewResponse & { 
    flagCount?: number; 
    disputeStatus?: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  }>> {
    const offset = (page - 1) * limit;

    // Build where clause based on filter
    let whereClause: any = {};

    // In a real implementation, you would filter based on flags, disputes, etc.
    // For now, we'll get all reviews and simulate the filtering

    const [reviews, total] = await Promise.all([
      prisma.vendorReview.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
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
        where: whereClause,
      }),
    ]);

    // Simulate additional moderation data
    const moderationReviews = reviews.map((review) => ({
      ...this.mapReviewToResponse(review),
      flagCount: Math.floor(Math.random() * 3), // Simulate flag count
      disputeStatus: Math.random() > 0.8 ? 'PENDING' : undefined,
      priority: this.calculateModerationPriority(review) as 'HIGH' | 'MEDIUM' | 'LOW',
    }));

    return {
      data: moderationReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get review quality metrics for a vendor
   */
  async getVendorReviewQuality(vendorId: string): Promise<ReviewQualityMetrics> {
    const reviews = await prisma.vendorReview.findMany({
      where: { vendorId },
      include: {
        vendor: true,
      },
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        flaggedReviews: 0,
        disputedReviews: 0,
        averageHelpfulScore: 0,
        responseRate: 0,
        averageResponseTime: 0,
        qualityScore: 0,
      };
    }

    // Calculate metrics
    const totalReviews = reviews.length;
    const flaggedReviews = 0; // In real implementation, count flagged reviews
    const disputedReviews = 0; // In real implementation, count disputed reviews
    
    const averageHelpfulScore = reviews.reduce((sum, r) => sum + r.helpful, 0) / totalReviews;
    
    const reviewsWithResponse = reviews.filter(r => r.vendorResponse);
    const responseRate = (reviewsWithResponse.length / totalReviews) * 100;
    
    // Calculate average response time
    const responseTimes = reviewsWithResponse
      .filter(r => r.vendorResponseAt)
      .map(r => {
        const responseTime = r.vendorResponseAt!.getTime() - r.createdAt.getTime();
        return responseTime / (1000 * 60 * 60); // Convert to hours
      });
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    // Calculate quality score (0-100)
    const qualityScore = this.calculateQualityScore({
      totalReviews,
      flaggedReviews,
      disputedReviews,
      averageHelpfulScore,
      responseRate,
      averageResponseTime,
    });

    return {
      totalReviews,
      flaggedReviews,
      disputedReviews,
      averageHelpfulScore: Math.round(averageHelpfulScore * 10) / 10,
      responseRate: Math.round(responseRate * 10) / 10,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
      qualityScore,
    };
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<{
    pendingDisputes: number;
    flaggedReviews: number;
    totalModerationActions: number;
    averageResolutionTime: number; // in hours
    topDisputeReasons: Array<{ reason: string; count: number }>;
  }> {
    // In a real implementation, query from moderation tables
    return {
      pendingDisputes: 0,
      flaggedReviews: 0,
      totalModerationActions: 0,
      averageResolutionTime: 0,
      topDisputeReasons: [],
    };
  }

  /**
   * Bulk moderate reviews
   */
  async bulkModerateReviews(
    reviewIds: string[],
    action: 'HIDE' | 'SHOW' | 'DELETE' | 'FLAG',
    reason: string,
    moderatorId: string
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ reviewId: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ reviewId: string; error: string }>,
    };

    for (const reviewId of reviewIds) {
      try {
        await this.applyModerationAction(reviewId, action, reason, moderatorId);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          reviewId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Calculate moderation priority for a review
   */
  private calculateModerationPriority(review: any): string {
    let score = 0;

    // Low rating reviews get higher priority
    if (review.rating <= 2) score += 3;
    else if (review.rating <= 3) score += 1;

    // Recent reviews get higher priority
    const daysSinceReview = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReview <= 1) score += 2;
    else if (daysSinceReview <= 7) score += 1;

    // Long comments might need more attention
    if (review.comment.length > 500) score += 1;

    // Simulate flag count (in real implementation, get from database)
    const flagCount = Math.floor(Math.random() * 3);
    score += flagCount;

    if (score >= 4) return 'HIGH';
    if (score >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate quality score for vendor reviews
   */
  private calculateQualityScore(metrics: {
    totalReviews: number;
    flaggedReviews: number;
    disputedReviews: number;
    averageHelpfulScore: number;
    responseRate: number;
    averageResponseTime: number;
  }): number {
    let score = 100; // Start with perfect score

    // Penalize for flagged reviews
    if (metrics.totalReviews > 0) {
      const flaggedRate = (metrics.flaggedReviews / metrics.totalReviews) * 100;
      score -= flaggedRate * 2; // 2 points per percent of flagged reviews
    }

    // Penalize for disputed reviews
    if (metrics.totalReviews > 0) {
      const disputedRate = (metrics.disputedReviews / metrics.totalReviews) * 100;
      score -= disputedRate * 3; // 3 points per percent of disputed reviews
    }

    // Bonus for high helpful scores
    if (metrics.averageHelpfulScore > 2) {
      score += (metrics.averageHelpfulScore - 2) * 2;
    }

    // Bonus for high response rate
    if (metrics.responseRate > 50) {
      score += (metrics.responseRate - 50) * 0.2;
    }

    // Penalize for slow response times
    if (metrics.averageResponseTime > 48) {
      score -= (metrics.averageResponseTime - 48) * 0.1;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Notify moderators of new dispute
   */
  private async notifyModeratorsOfDispute(dispute: ReviewDispute): Promise<void> {
    // In a real implementation, send notifications to moderators
    console.log(`Notifying moderators of new dispute: ${dispute.id}`);
  }

  /**
   * Notify disputing party of resolution
   */
  private async notifyDisputeResolution(dispute: ReviewDispute): Promise<void> {
    // In a real implementation, send notification to the user who created the dispute
    console.log(`Notifying user of dispute resolution: ${dispute.id}`);
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

export const reviewManagementService = new ReviewManagementService();