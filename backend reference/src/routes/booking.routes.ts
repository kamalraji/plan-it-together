import { Router, Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Create a booking request
 * POST /api/bookings
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.createBookingRequest((req as any).user.id, req.body);
    
    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_BOOKING_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, (req as any).user.id);
    
    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('permission') ? 403 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'GET_BOOKING_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Update booking status
 * PUT /api/bookings/:id
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.updateBookingStatus(
      req.params.id,
      (req as any).user.id,
      req.body
    );
    
    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('permission') ? 403 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'UPDATE_BOOKING_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get bookings for an event
 * GET /api/bookings/event/:eventId
 */
router.get('/event/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getBookingsByEvent(
      req.params.eventId,
      (req as any).user.id
    );
    
    res.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('permission') ? 403 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'GET_EVENT_BOOKINGS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get bookings for a vendor
 * GET /api/bookings/vendor/:vendorId
 */
router.get('/vendor/:vendorId', authenticate, async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getBookingsByVendor(req.params.vendorId);
    
    res.json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_VENDOR_BOOKINGS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Send a message for a booking
 * POST /api/bookings/:id/messages
 */
router.post('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const message = await bookingService.sendBookingMessage(
      req.params.id,
      (req as any).user.id,
      req.body
    );
    
    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('permission') ? 403 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'SEND_MESSAGE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get messages for a booking
 * GET /api/bookings/:id/messages
 */
router.get('/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const messages = await bookingService.getBookingMessages(
      req.params.id,
      (req as any).user.id
    );
    
    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('permission') ? 403 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'GET_MESSAGES_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Cancel a booking
 * POST /api/bookings/:id/cancel
 */
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      (req as any).user.id,
      req.body.reason
    );
    
    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('permission') ? 403 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'CANCEL_BOOKING_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get booking timeline
 * GET /api/bookings/:id/timeline
 */
router.get('/:id/timeline', authenticate, async (req: Request, res: Response) => {
  try {
    const timeline = await bookingService.getBookingTimeline(
      req.params.id,
      (req as any).user.id
    );
    
    res.json({
      success: true,
      data: timeline,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('permission') ? 403 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'GET_TIMELINE_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Generate service agreement for a booking
 * POST /api/bookings/:id/service-agreement
 */
router.post('/:id/service-agreement', authenticate, async (req: Request, res: Response) => {
  try {
    const { templateId, customTerms } = req.body;
    const agreement = await bookingService.generateServiceAgreement(
      req.params.id,
      templateId,
      customTerms
    );
    
    res.status(201).json({
      success: true,
      data: agreement,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'GENERATE_AGREEMENT_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Get booking statistics
 * GET /api/bookings/stats
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const { vendorId, eventId } = req.query;
    const stats = await bookingService.getBookingStatistics(
      vendorId as string,
      eventId as string
    );
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GET_STATS_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;