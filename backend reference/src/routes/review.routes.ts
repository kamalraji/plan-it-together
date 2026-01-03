import { Router, Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { ratingService } from '../services/rating.service';
import { reviewManagementService } from '../services/review-management.service';
import { authenticate } from '../middleware/auth.middleware';
import { CreateReviewDTO, ApiResponse } from '../types';
import { ServiceCategory } from '@prisma/client';

const router = Router();

/**
 * Submit a review for a completed booking
 * POST /api/reviews/bookings/:bookingId
 */
router.post('/bookings/:bookingId', authenticate, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const organizerId = req.user?.userId;
    const reviewData: CreateReviewDTO = req.body;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const review = await reviewService.submitReview(bookingId, organizerId, reviewData);

    res.status(201).json({
      success: true,
      data: review,
    } as ApiResponse);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'REVIEW_SUBMISSION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to submit review',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get reviews for a vendor
 * GET /api/reviews/vendors/:vendorId
 */
router.get('/vendors/:vendorId', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'newest';

    if (!['newest', 'oldest', 'rating_high', 'rating_low'].includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SORT_PARAMETER',
          message: 'Invalid sort parameter. Must be one of: newest, oldest, rating_high, rating_low',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const reviews = await reviewService.getVendorReviews(
      vendorId,
      page,
      limit,
      sortBy as 'newest' | 'oldest' | 'rating_high' | 'rating_low'
    );

    res.json({
      success: true,
      data: reviews,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_REVIEWS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch reviews',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get a specific review by ID
 * GET /api/reviews/:reviewId
 */
router.get('/:reviewId', async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewService.getReview(reviewId);

    res.json({
      success: true,
      data: review,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching review:', error);
    const statusCode = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'REVIEW_NOT_FOUND' : 'FETCH_REVIEW_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch review',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get review by booking ID
 * GET /api/reviews/bookings/:bookingId/review
 */
router.get('/bookings/:bookingId/review', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const review = await reviewService.getReviewByBooking(bookingId);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'No review found for this booking',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: review,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching booking review:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_REVIEW_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch review',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Vendor responds to a review
 * POST /api/reviews/:reviewId/respond
 */
router.post('/:reviewId/respond', authenticate, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!response || typeof response !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Response is required and must be a string',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    // Get vendor profile to verify ownership
    const { vendorService } = await import('../services/vendor.service');
    const vendorProfile = await vendorService.getVendorProfileByUserId(userId);

    const updatedReview = await reviewService.respondToReview(
      reviewId,
      vendorProfile.id,
      response
    );

    res.json({
      success: true,
      data: updatedReview,
    } as ApiResponse);
  } catch (error) {
    console.error('Error responding to review:', error);
    const statusCode = error instanceof Error && 
      (error.message.includes('not found') || error.message.includes('Unauthorized')) ? 404 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'REVIEW_RESPONSE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to respond to review',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Mark a review as helpful
 * POST /api/reviews/:reviewId/helpful
 */
router.post('/:reviewId/helpful', async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const updatedReview = await reviewService.markReviewHelpful(reviewId);

    res.json({
      success: true,
      data: updatedReview,
    } as ApiResponse);
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    const statusCode = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'REVIEW_NOT_FOUND' : 'MARK_HELPFUL_FAILED',
        message: error instanceof Error ? error.message : 'Failed to mark review as helpful',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get review statistics for a vendor
 * GET /api/reviews/vendors/:vendorId/stats
 */
router.get('/vendors/:vendorId/stats', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const stats = await reviewService.getVendorReviewStats(vendorId);

    res.json({
      success: true,
      data: stats,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_STATS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch review statistics',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get reviews that need vendor response
 * GET /api/reviews/vendors/:vendorId/pending-response
 */
router.get('/vendors/:vendorId/pending-response', authenticate, async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    // Verify vendor ownership
    const { vendorService } = await import('../services/vendor.service');
    const vendorProfile = await vendorService.getVendorProfileByUserId(userId);

    if (vendorProfile.id !== vendorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access reviews for your own vendor profile',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const reviews = await reviewService.getReviewsNeedingResponse(vendorId, limit);

    res.json({
      success: true,
      data: reviews,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PENDING_REVIEWS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch pending reviews',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Validate review authenticity
 * GET /api/reviews/:reviewId/authenticity
 */
router.get('/:reviewId/authenticity', async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const authenticity = await reviewService.validateReviewAuthenticity(reviewId);

    res.json({
      success: true,
      data: authenticity,
    } as ApiResponse);
  } catch (error) {
    console.error('Error validating review authenticity:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICITY_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Failed to validate review authenticity',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Flag a review for moderation
 * POST /api/reviews/:reviewId/flag
 */
router.post('/:reviewId/flag', authenticate, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REASON',
          message: 'Reason is required and must be a string',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const result = await reviewService.flagReview(reviewId, userId, reason);

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('Error flagging review:', error);
    const statusCode = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'REVIEW_NOT_FOUND' : 'FLAG_REVIEW_FAILED',
        message: error instanceof Error ? error.message : 'Failed to flag review',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

// Rating calculation endpoints

/**
 * Get weighted rating for a vendor
 * GET /api/reviews/vendors/:vendorId/weighted-rating
 */
router.get('/vendors/:vendorId/weighted-rating', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const weightedRating = await ratingService.calculateWeightedRating(vendorId);

    res.json({
      success: true,
      data: weightedRating,
    } as ApiResponse);
  } catch (error) {
    console.error('Error calculating weighted rating:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEIGHTED_RATING_FAILED',
        message: error instanceof Error ? error.message : 'Failed to calculate weighted rating',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get category benchmarks
 * GET /api/reviews/categories/:category/benchmarks
 */
router.get('/categories/:category/benchmarks', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    if (!Object.values(ServiceCategory).includes(category as ServiceCategory)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Invalid service category',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const benchmarks = await ratingService.getCategoryBenchmarks(category as ServiceCategory);

    res.json({
      success: true,
      data: benchmarks,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching category benchmarks:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BENCHMARKS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch category benchmarks',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get vendor rankings
 * GET /api/reviews/rankings
 */
router.get('/rankings', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as ServiceCategory | undefined;
    const location = req.query.location as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    if (category && !Object.values(ServiceCategory).includes(category)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Invalid service category',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const rankings = await ratingService.rankVendors(category, location, limit);

    res.json({
      success: true,
      data: rankings,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching vendor rankings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RANKINGS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch vendor rankings',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get trending vendors
 * GET /api/reviews/trending
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as ServiceCategory | undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    if (category && !Object.values(ServiceCategory).includes(category)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: 'Invalid service category',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const trending = await ratingService.getTrendingVendors(category, limit);

    res.json({
      success: true,
      data: trending,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching trending vendors:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRENDING_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch trending vendors',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Update all vendor ratings (admin only)
 * POST /api/reviews/update-ratings
 */
router.post('/update-ratings', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    // Check if user is admin (you might want to implement proper admin middleware)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const result = await ratingService.updateAllVendorRatings();

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating vendor ratings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_RATINGS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update vendor ratings',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

// Review management endpoints

/**
 * Create a dispute for a review
 * POST /api/reviews/:reviewId/dispute
 */
router.post('/:reviewId/dispute', authenticate, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { disputeReason, disputeDetails } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!disputeReason || !disputeDetails) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Dispute reason and details are required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const dispute = await reviewManagementService.createDispute(
      reviewId,
      userId,
      disputeReason,
      disputeDetails
    );

    res.status(201).json({
      success: true,
      data: dispute,
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating dispute:', error);
    const statusCode = error instanceof Error && 
      (error.message.includes('not found') || error.message.includes('already exists')) ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'DISPUTE_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create dispute',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get reviews for moderation (admin only)
 * GET /api/reviews/moderation
 */
router.get('/moderation', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    // Check if user is admin
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filterBy = req.query.filterBy as 'FLAGGED' | 'DISPUTED' | 'HIGH_PRIORITY' | undefined;

    const reviews = await reviewManagementService.getReviewsForModeration(page, limit, filterBy);

    res.json({
      success: true,
      data: reviews,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching reviews for moderation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MODERATION_FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch reviews for moderation',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Apply moderation action to a review (admin only)
 * POST /api/reviews/:reviewId/moderate
 */
router.post('/:reviewId/moderate', authenticate, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { actionType, reason, newContent } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    // Check if user is admin
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!actionType || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Action type and reason are required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const validActions = ['HIDE', 'SHOW', 'EDIT', 'DELETE', 'FLAG'];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Invalid moderation action type',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const action = await reviewManagementService.applyModerationAction(
      reviewId,
      actionType,
      reason,
      userId,
      newContent
    );

    res.json({
      success: true,
      data: action,
    } as ApiResponse);
  } catch (error) {
    console.error('Error applying moderation action:', error);
    const statusCode = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'REVIEW_NOT_FOUND' : 'MODERATION_ACTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to apply moderation action',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get review quality metrics for a vendor
 * GET /api/reviews/vendors/:vendorId/quality
 */
router.get('/vendors/:vendorId/quality', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const quality = await reviewManagementService.getVendorReviewQuality(vendorId);

    res.json({
      success: true,
      data: quality,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching review quality metrics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'QUALITY_METRICS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch review quality metrics',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get moderation statistics (admin only)
 * GET /api/reviews/moderation/stats
 */
router.get('/moderation/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    // Check if user is admin
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const stats = await reviewManagementService.getModerationStats();

    res.json({
      success: true,
      data: stats,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MODERATION_STATS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch moderation statistics',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Bulk moderate reviews (admin only)
 * POST /api/reviews/moderation/bulk
 */
router.post('/moderation/bulk', authenticate, async (req: Request, res: Response) => {
  try {
    const { reviewIds, action, reason } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    // Check if user is admin
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REVIEW_IDS',
          message: 'Review IDs must be a non-empty array',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    if (!action || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Action and reason are required',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const validActions = ['HIDE', 'SHOW', 'DELETE', 'FLAG'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Invalid bulk moderation action type',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const result = await reviewManagementService.bulkModerateReviews(
      reviewIds,
      action,
      reason,
      userId
    );

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error) {
    console.error('Error bulk moderating reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_MODERATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to bulk moderate reviews',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

export default router;