import { Router, Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { CreateEventDTO, UpdateEventDTO, ApiResponse } from '../types';

const router = Router();

/**
 * POST /api/events
 * Create a new event (Organizer only)
 */
router.post(
  '/',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const organizerId = req.user!.userId;
      const eventData: CreateEventDTO = req.body;

      // If organizationId is provided, verify user is an admin of that organization
      if (eventData.organizationId) {
        const isAdmin = await eventService.isOrganizationMember(
          eventData.organizationId,
          organizerId
        );

        if (!isAdmin) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'UNAUTHORIZED_ORGANIZATION_ACCESS',
              message: 'You are not authorized to create events for this organization',
              timestamp: new Date().toISOString(),
            },
          };
          return res.status(403).json(response);
        }
      }

      const event = await eventService.createEvent(organizerId, eventData);

      const response: ApiResponse = {
        success: true,
        data: event,
      };

      return res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EVENT_CREATION_FAILED',
          message: error.message || 'Failed to create event',
          timestamp: new Date().toISOString(),
        },
      };
      return res.status(400).json(response);
    }
  }
);

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await eventService.getEvent(id);

    const response: ApiResponse = {
      success: true,
      data: event,
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'EVENT_NOT_FOUND',
        message: error.message || 'Event not found',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(404).json(response);
  }
});

/**
 * PUT /api/events/:id
 * Update an event (Organizer only)
 */
router.put(
  '/:id',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates: UpdateEventDTO = req.body;

      // TODO: Verify that the user is the organizer of this event
      const event = await eventService.updateEvent(id, updates);

      const response: ApiResponse = {
        success: true,
        data: event,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EVENT_UPDATE_FAILED',
          message: error.message || 'Failed to update event',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/events/:id/landing-page
 * Get landing page data for an event (Public, but respects visibility)
 */
router.get('/:id/landing-page', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inviteLink } = req.query;
    
    // Get user ID if authenticated (optional)
    let userId: string | undefined;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
      } catch {
        // Ignore auth errors
      }
    }

    // First check if user has access to this event
    const hasAccess = await eventService.validatePrivateEventAccess(
      id,
      userId,
      inviteLink as string
    );

    if (!hasAccess) {
      await eventService.logAccessAttempt(id, userId, inviteLink as string, false);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this event',
          timestamp: new Date().toISOString(),
        },
      };
      return res.status(403).json(response);
    }

    const landingPageData = await eventService.generateLandingPage(id);

    const response: ApiResponse = {
      success: true,
      data: landingPageData,
    };

    return res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'LANDING_PAGE_GENERATION_FAILED',
        message: error.message || 'Failed to generate landing page',
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(404).json(response);
  }
});

/**
 * GET /api/events/url/:landingPageUrl
 * Get event by landing page URL (Public)
 */
router.get('/url/:landingPageUrl', async (req: Request, res: Response) => {
  try {
    const { landingPageUrl } = req.params;
    const event = await eventService.getEventByUrl(landingPageUrl);

    const response: ApiResponse = {
      success: true,
      data: event,
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'EVENT_NOT_FOUND',
        message: error.message || 'Event not found',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(404).json(response);
  }
});

/**
 * GET /api/events/:id/analytics
 * Get event analytics (Organizer only)
 */
router.get(
  '/:id/analytics',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const analytics = await eventService.getEventAnalytics(id);

      const response: ApiResponse = {
        success: true,
        data: analytics,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: error.message || 'Failed to fetch analytics',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(404).json(response);
    }
  }
);

/**
 * GET /api/events/organizer/:organizerId
 * Get all events by organizer (Organizer only)
 */
router.get(
  '/organizer/:organizerId',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { organizerId } = req.params;

      // TODO: Verify that the user is requesting their own events or is a super admin
      const events = await eventService.getEventsByOrganizer(organizerId);

      const response: ApiResponse = {
        success: true,
        data: events,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EVENTS_FETCH_FAILED',
          message: error.message || 'Failed to fetch events',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/events/organization/:organizationId
 * Get all events by organization (Public for public events, requires auth for private)
 */
router.get(
  '/organization/:organizationId',
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { visibility } = req.query;
      
      // Get user ID if authenticated (optional)
      let userId: string | undefined;
      if (req.headers.authorization) {
        try {
          // Try to authenticate but don't require it
          const token = req.headers.authorization.split(' ')[1];
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          userId = decoded.userId;
        } catch {
          // Ignore auth errors for this endpoint
        }
      }

      const events = await eventService.getEventsByOrganization(
        organizationId,
        visibility as any,
        userId
      );

      const response: ApiResponse = {
        success: true,
        data: events,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EVENTS_FETCH_FAILED',
          message: error.message || 'Failed to fetch organization events',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/events/invite/:inviteLink
 * Access private event via invite link (Public)
 */
router.get('/invite/:inviteLink', async (req: Request, res: Response) => {
  try {
    const { inviteLink } = req.params;
    
    // Get user ID if authenticated (optional)
    let userId: string | undefined;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
      } catch {
        // Ignore auth errors
      }
    }

    const event = await eventService.getEventByInviteLink(inviteLink);

    if (!event) {
      await eventService.logAccessAttempt('unknown', userId, inviteLink, false);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_INVITE_LINK',
          message: 'Invalid or expired invite link',
          timestamp: new Date().toISOString(),
        },
      };
      return res.status(404).json(response);
    }

    // Validate access to the private event
    const hasAccess = await eventService.validatePrivateEventAccess(
      event.id,
      userId,
      inviteLink
    );

    if (!hasAccess) {
      await eventService.logAccessAttempt(event.id, userId, inviteLink, false);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this private event',
          timestamp: new Date().toISOString(),
        },
      };
      return res.status(403).json(response);
    }

    await eventService.logAccessAttempt(event.id, userId, inviteLink, true);

    const response: ApiResponse = {
      success: true,
      data: event,
    };

    return res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVITE_ACCESS_FAILED',
        message: error.message || 'Failed to access event via invite link',
        timestamp: new Date().toISOString(),
      },
    };
    return res.status(400).json(response);
  }
});

/**
 * POST /api/events/:id/validate-access
 * Validate access to a private event
 */
router.post('/:id/validate-access', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inviteLink } = req.body;
    
    // Get user ID if authenticated (optional)
    let userId: string | undefined;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
      } catch {
        // Ignore auth errors
      }
    }

    const hasAccess = await eventService.validatePrivateEventAccess(
      id,
      userId,
      inviteLink
    );

    await eventService.logAccessAttempt(id, userId, inviteLink, hasAccess);

    const response: ApiResponse = {
      success: true,
      data: { hasAccess },
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'ACCESS_VALIDATION_FAILED',
        message: error.message || 'Failed to validate event access',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(400).json(response);
  }
});

/**
 * GET /api/events/:id/marketplace
 * Get marketplace integration data for an event (Organizer only)
 */
router.get(
  '/:id/marketplace',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizerId = req.user!.userId;

      const marketplaceData = await eventService.getEventMarketplaceData(id, organizerId);

      const response: ApiResponse = {
        success: true,
        data: marketplaceData,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MARKETPLACE_DATA_FETCH_FAILED',
          message: error.message || 'Failed to fetch marketplace data',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/events/:id/dashboard-with-marketplace
 * Get event dashboard with marketplace integration (Organizer only)
 */
router.get(
  '/:id/dashboard-with-marketplace',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizerId = req.user!.userId;

      const dashboard = await eventService.getEventDashboardWithMarketplace(id, organizerId);

      const response: ApiResponse = {
        success: true,
        data: dashboard,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DASHBOARD_FETCH_FAILED',
          message: error.message || 'Failed to fetch event dashboard',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/events/:id/vendor-timeline
 * Get vendor bookings integrated with event timeline (Organizer only)
 */
router.get(
  '/:id/vendor-timeline',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizerId = req.user!.userId;

      const timelineIntegration = await eventService.integrateVendorBookingsWithTimeline(id, organizerId);

      const response: ApiResponse = {
        success: true,
        data: timelineIntegration,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TIMELINE_INTEGRATION_FAILED',
          message: error.message || 'Failed to integrate vendor timeline',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

/**
 * GET /api/events/:id/vendor-coordination
 * Get unified vendor coordination interface (Organizer only)
 */
router.get(
  '/:id/vendor-coordination',
  authenticate,
  authorize(['ORGANIZER', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizerId = req.user!.userId;

      const coordinationInterface = await eventService.createVendorCoordinationInterface(id, organizerId);

      const response: ApiResponse = {
        success: true,
        data: coordinationInterface,
      };

      res.json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'COORDINATION_INTERFACE_FAILED',
          message: error.message || 'Failed to create vendor coordination interface',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
    }
  }
);

export default router;
