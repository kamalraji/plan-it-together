import { Router, Request, Response } from 'express';
import { eventService } from '../services/event.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { CreateEventDTO, UpdateEventDTO, ApiResponse } from '../types';
import * as analyticsService from '../services/analytics.service';

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

      const event = await eventService.createEvent(organizerId, eventData);

      const response: ApiResponse = {
        success: true,
        data: event,
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EVENT_CREATION_FAILED',
          message: error.message || 'Failed to create event',
          timestamp: new Date().toISOString(),
        },
      };
      res.status(400).json(response);
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
 * Get landing page data for an event (Public)
 */
router.get('/:id/landing-page', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const landingPageData = await eventService.generateLandingPage(id);

    const response: ApiResponse = {
      success: true,
      data: landingPageData,
    };

    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'LANDING_PAGE_GENERATION_FAILED',
        message: error.message || 'Failed to generate landing page',
        timestamp: new Date().toISOString(),
      },
    };
    res.status(404).json(response);
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

export default router;
