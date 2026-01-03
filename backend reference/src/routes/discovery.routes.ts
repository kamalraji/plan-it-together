import { Router, Request, Response } from 'express';
import { discoveryService } from '../services/discovery.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Search organizations
 * GET /api/discovery/organizations
 */
router.get('/organizations', async (req: Request, res: Response) => {
  try {
    const query = {
      query: req.query.q as string,
      category: req.query.category as any,
      verifiedOnly: req.query.verifiedOnly === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    
    const organizations = await discoveryService.searchOrganizations(query);
    
    res.json({
      success: true,
      data: organizations,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get events for an organization
 * GET /api/discovery/organizations/:id/events
 */
router.get('/organizations/:id/events', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const visibility = req.query.visibility as any;
    
    const events = await discoveryService.getOrganizationEvents(
      req.params.id,
      userId,
      visibility
    );
    
    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_EVENTS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Follow an organization
 * POST /api/discovery/organizations/:id/follow
 */
router.post('/:id/follow', authenticate, async (req: Request, res: Response) => {
  try {
    const follow = await discoveryService.followOrganization(
      (req as any).user.id,
      req.params.id
    );
    
    res.status(201).json({
      success: true,
      data: follow,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'FOLLOW_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Unfollow an organization
 * DELETE /api/discovery/organizations/:id/follow
 */
router.delete('/:id/follow', authenticate, async (req: Request, res: Response) => {
  try {
    await discoveryService.unfollowOrganization(
      (req as any).user.id,
      req.params.id
    );
    
    res.json({
      success: true,
      data: { message: 'Unfollowed successfully' },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UNFOLLOW_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get followed organizations for current user
 * GET /api/discovery/following
 */
router.get('/following', authenticate, async (req: Request, res: Response) => {
  try {
    const organizations = await discoveryService.getFollowedOrganizations(
      (req as any).user.id
    );
    
    res.json({
      success: true,
      data: organizations,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_FOLLOWING_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Check if user is following an organization
 * GET /api/discovery/organizations/:id/following-status
 */
router.get('/:id/following-status', authenticate, async (req: Request, res: Response) => {
  try {
    const isFollowing = await discoveryService.isFollowing(
      (req as any).user.id,
      req.params.id
    );
    
    res.json({
      success: true,
      data: { isFollowing },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CHECK_FOLLOWING_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Notify followers about a new event (Admin/Testing endpoint)
 * POST /api/discovery/organizations/:id/notify-followers
 */
router.post('/:id/notify-followers', authenticate, async (req: Request, res: Response) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Event ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    await discoveryService.notifyFollowers(req.params.id, eventId);
    
    return res.json({
      success: true,
      data: { message: 'Followers notified successfully' },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NOTIFY_FOLLOWERS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
