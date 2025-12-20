import { Router } from 'express';
import { paymentService } from '../services/payment.service';
import { authenticate } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    let event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      console.warn('Webhook secret not configured - skipping signature verification');
      event = req.body;
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object);
        break;
      
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      
      case 'transfer.failed':
        await handleTransferFailed(event.data.object);
        break;
      
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      
      case 'payout.created':
        await handlePayoutCreated(event.data.object);
        break;
      
      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;
      
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    if (!bookingId) {
      console.warn('Payment succeeded but no booking ID in metadata:', paymentIntent.id);
      return;
    }

    // Update payment record
    await prisma.paymentRecord.updateMany({
      where: {
        bookingId,
        transactionId: paymentIntent.id,
      },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update booking status
    await prisma.bookingRequest.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    });

    // Trigger automated payout if enabled
    if (process.env.AUTO_PAYOUT_ENABLED === 'true') {
      const payment = await prisma.paymentRecord.findFirst({
        where: {
          bookingId,
          transactionId: paymentIntent.id,
        },
      });
      
      if (payment) {
        await paymentService.processVendorPayout(payment.id);
      }
    }

    console.log('Payment succeeded and processed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: any) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    if (!bookingId) {
      console.warn('Payment failed but no booking ID in metadata:', paymentIntent.id);
      return;
    }

    // Update payment record
    await prisma.paymentRecord.updateMany({
      where: {
        bookingId,
        transactionId: paymentIntent.id,
      },
      data: {
        status: 'FAILED',
      },
    });

    // Optionally update booking status back to previous state
    await prisma.bookingRequest.update({
      where: { id: bookingId },
      data: { status: 'QUOTE_SENT' }, // Revert to previous state
    });

    console.log('Payment failed and processed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle payment requiring action
 */
async function handlePaymentRequiresAction(paymentIntent: any) {
  try {
    const bookingId = paymentIntent.metadata?.bookingId;
    if (!bookingId) {
      return;
    }

    // Update payment record to indicate action required
    await prisma.paymentRecord.updateMany({
      where: {
        bookingId,
        transactionId: paymentIntent.id,
      },
      data: {
        status: 'PENDING',
        // Store action details in payment method
        paymentMethod: {
          ...paymentIntent.metadata,
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
        },
      },
    });

    console.log('Payment requires action:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment action required:', error);
  }
}

/**
 * Handle transfer created (vendor payout)
 */
async function handleTransferCreated(transfer: any) {
  try {
    const paymentId = transfer.metadata?.paymentId;
    if (!paymentId) {
      return;
    }

    // Update payment record with transfer information
    await prisma.paymentRecord.update({
      where: { id: paymentId },
      data: {
        paymentMethod: {
          ...transfer.metadata,
          transferId: transfer.id,
          transferStatus: 'created',
          transferredAt: new Date(),
        },
      },
    });

    console.log('Transfer created:', transfer.id);
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
}

/**
 * Handle transfer failed
 */
async function handleTransferFailed(transfer: any) {
  try {
    const paymentId = transfer.metadata?.paymentId;
    if (!paymentId) {
      return;
    }

    // Update payment record with failure information
    await prisma.paymentRecord.update({
      where: { id: paymentId },
      data: {
        paymentMethod: {
          ...transfer.metadata,
          transferId: transfer.id,
          transferStatus: 'failed',
          transferFailureReason: transfer.failure_message,
        },
      },
    });

    console.log('Transfer failed:', transfer.id, transfer.failure_message);
  } catch (error) {
    console.error('Error handling transfer failure:', error);
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(account: any) {
  try {
    // Find vendor with this Stripe account
    const vendor = await prisma.vendorProfile.findFirst({
      where: {
        verificationDocuments: {
          path: ['stripeAccountId'],
          equals: account.id,
        },
      },
    });

    if (!vendor) {
      return;
    }

    // Update vendor verification status based on account status
    const verificationDocs = vendor.verificationDocuments as any;
    verificationDocs.stripeAccountStatus = account.charges_enabled ? 'active' : 'pending';
    verificationDocs.stripeAccountDetails = {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };

    await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: {
        verificationDocuments: verificationDocs,
      },
    });

    console.log('Account updated:', account.id);
  } catch (error) {
    console.error('Error handling account update:', error);
  }
}

/**
 * Handle payout created
 */
async function handlePayoutCreated(payout: any) {
  try {
    console.log('Payout created:', payout.id, 'Amount:', payout.amount);
    // Log payout for audit purposes
  } catch (error) {
    console.error('Error handling payout created:', error);
  }
}

/**
 * Handle payout failed
 */
async function handlePayoutFailed(payout: any) {
  try {
    console.log('Payout failed:', payout.id, 'Reason:', payout.failure_message);
    // Handle payout failure - might need to retry or notify vendor
  } catch (error) {
    console.error('Error handling payout failure:', error);
  }
}

export default router;