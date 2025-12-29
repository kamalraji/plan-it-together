import { Router } from 'express';
import { paymentService } from '../services/payment.service';
import { authenticate } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';

const router = Router();

/**
 * Process payment for a booking
 * POST /api/payments/process
 */
router.post('/process', authenticate, async (req, res) => {
  try {
    const { bookingId, amount, currency, paymentMethod, description, milestoneId } = req.body;

    if (!bookingId || !amount || !currency || !paymentMethod || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields: bookingId, amount, currency, paymentMethod, description',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const result = await paymentService.processPayment({
      bookingId,
      amount,
      currency,
      paymentMethod,
      description,
      milestoneId,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message: result.error || 'Payment processing failed',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process payment',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Create escrow account for milestone-based payments
 * POST /api/payments/escrow
 */
router.post('/escrow', authenticate, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields: bookingId, amount',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const escrow = await paymentService.createEscrow(bookingId, amount);

    res.json({
      success: true,
      data: escrow,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Escrow creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to create escrow account',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Release funds from escrow for completed milestone
 * POST /api/payments/escrow/:escrowId/release
 */
router.post('/escrow/:escrowId/release', authenticate, async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { milestoneId } = req.body;

    if (!milestoneId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required field: milestoneId',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const result = await paymentService.releaseFunds(escrowId, milestoneId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FUND_RELEASE_FAILED',
          message: result.error || 'Failed to release funds',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Fund release error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to release funds',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Process refund
 * POST /api/payments/:paymentId/refund
 */
router.post('/:paymentId/refund', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields: amount, reason',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const result = await paymentService.processRefund(paymentId, amount, reason);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REFUND_FAILED',
          message: result.error || 'Refund processing failed',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process refund',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Get payment history for current user
 * GET /api/payments/history?type=organizer|vendor
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const userType = req.query.type as 'ORGANIZER' | 'VENDOR';

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

    if (!userType || !['ORGANIZER', 'VENDOR'].includes(userType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_TYPE',
          message: 'User type must be either ORGANIZER or VENDOR',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const history = await paymentService.getPaymentHistory(userId, userType);

    res.json({
      success: true,
      data: history,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve payment history',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Generate invoice for a booking
 * GET /api/payments/invoice/:bookingId
 */
router.get('/invoice/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const invoice = await paymentService.generateInvoice(bookingId);

    res.json({
      success: true,
      data: invoice,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to generate invoice',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Set up automated vendor payout
 * POST /api/payments/payout/setup
 */
router.post('/payout/setup', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { vendorId, payoutDetails } = req.body;

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

    if (!vendorId || !payoutDetails) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields: vendorId, payoutDetails',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    const success = await paymentService.setupAutomatedPayout(vendorId, payoutDetails);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYOUT_SETUP_FAILED',
          message: 'Failed to set up automated payout',
          timestamp: new Date().toISOString(),
        },
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: { message: 'Automated payout setup successful' },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Payout setup error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to set up automated payout',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  }
});

/**
 * Webhook endpoint for payment processor notifications
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    // Handle Stripe webhook events
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    // In production, verify the webhook signature
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    const event = req.body;

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object.id);
        break;
      case 'transfer.created':
        // Handle vendor payout
        console.log('Transfer created:', event.data.object.id);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;