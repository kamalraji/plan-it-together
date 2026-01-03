import { PrismaClient, PaymentStatus } from '@prisma/client';
const prisma = new PrismaClient();

// Initialize Stripe (in production, use environment variables)
let stripe: any = null;
try {
  const Stripe = require('stripe');
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
    apiVersion: '2023-10-16',
  });
} catch (error) {
  console.warn('Stripe not available - payment processing will be limited');
}

export interface ProcessPaymentDTO {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  description: string;
  milestoneId?: string;
}

export interface PaymentMethod {
  type: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET';
  details: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  error?: string;
}

export interface EscrowAccount {
  id: string;
  bookingId: string;
  totalAmount: number;
  releasedAmount: number;
  pendingAmount: number;
  milestones: PaymentMilestone[];
}

export interface PaymentMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: Date;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  error?: string;
}

export class PaymentService {
  /**
   * Process payment for a booking
   */
  async processPayment(paymentData: ProcessPaymentDTO): Promise<PaymentResult> {
    try {
      // Verify booking exists and is in correct state
      const booking = await prisma.bookingRequest.findUnique({
        where: { id: paymentData.bookingId },
        include: {
          organizer: true,
          vendor: { include: { user: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (!['QUOTE_ACCEPTED', 'CONFIRMED'].includes(booking.status)) {
        throw new Error('Booking is not in a payable state');
      }

      // Calculate platform fee (e.g., 5% of transaction)
      const platformFeeRate = parseFloat(process.env.PLATFORM_FEE_RATE || '0.05');
      const platformFee = paymentData.amount * platformFeeRate;
      const vendorPayout = paymentData.amount - platformFee;

      let transactionId: string | undefined;
      let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

      // Process payment based on method type
      switch (paymentData.paymentMethod.type) {
        case 'CREDIT_CARD':
          const paymentResult = await this.processCreditCardPayment(paymentData);
          transactionId = paymentResult.transactionId;
          paymentStatus = paymentResult.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
          if (!paymentResult.success) {
            throw new Error(paymentResult.error || 'Credit card payment failed');
          }
          break;

        case 'BANK_TRANSFER':
          // For bank transfers, create pending payment that will be confirmed later
          transactionId = `bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          paymentStatus = PaymentStatus.PENDING;
          break;

        case 'DIGITAL_WALLET':
          const walletResult = await this.processDigitalWalletPayment(paymentData);
          transactionId = walletResult.transactionId;
          paymentStatus = walletResult.success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
          if (!walletResult.success) {
            throw new Error(walletResult.error || 'Digital wallet payment failed');
          }
          break;

        default:
          throw new Error(`Unsupported payment method: ${paymentData.paymentMethod.type}`);
      }

      // Create payment record
      const paymentRecord = await prisma.paymentRecord.create({
        data: {
          bookingId: paymentData.bookingId,
          payerId: booking.organizerId,
          payeeId: booking.vendor.userId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentStatus,
          paymentMethod: paymentData.paymentMethod as any,
          transactionId,
          platformFee,
          vendorPayout,
          processedAt: paymentStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
        },
      });

      // Update booking status if payment is completed
      if (paymentStatus === PaymentStatus.COMPLETED && booking.status === 'QUOTE_ACCEPTED') {
        await prisma.bookingRequest.update({
          where: { id: paymentData.bookingId },
          data: { status: 'CONFIRMED' },
        });

        // Trigger automated vendor payout if configured
        if (process.env.AUTO_PAYOUT_ENABLED === 'true') {
          await this.processVendorPayout(paymentRecord.id);
        }
      }

      return {
        success: true,
        paymentId: paymentRecord.id,
        transactionId,
      };
    } catch (error: any) {
      console.error('Payment processing error:', error);
      
      // Try to get booking info for failed payment record
      let payerId = '';
      let payeeId = '';
      try {
        const booking = await prisma.bookingRequest.findUnique({
          where: { id: paymentData.bookingId },
          include: { vendor: { include: { user: true } } },
        });
        if (booking) {
          payerId = booking.organizerId;
          payeeId = booking.vendor.userId;
        }
      } catch (bookingError) {
        console.error('Failed to get booking info for failed payment record:', bookingError);
      }

      // Create failed payment record
      await prisma.paymentRecord.create({
        data: {
          bookingId: paymentData.bookingId,
          payerId,
          payeeId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: PaymentStatus.FAILED,
          paymentMethod: paymentData.paymentMethod as any,
          platformFee: 0,
          vendorPayout: 0,
        },
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process credit card payment via Stripe
   */
  private async processCreditCardPayment(paymentData: ProcessPaymentDTO): Promise<PaymentResult> {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured - cannot process credit card payments');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency.toLowerCase(),
        payment_method: paymentData.paymentMethod.details.paymentMethodId,
        confirm: true,
        description: paymentData.description,
        metadata: {
          bookingId: paymentData.bookingId,
          milestoneId: paymentData.milestoneId || '',
        },
        // Enable automatic payment methods for better conversion
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id,
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          success: false,
          error: 'Payment requires additional authentication',
          transactionId: paymentIntent.id,
        };
      } else {
        return {
          success: false,
          error: 'Payment failed',
          transactionId: paymentIntent.id,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process digital wallet payment (PayPal, Apple Pay, Google Pay, etc.)
   */
  private async processDigitalWalletPayment(paymentData: ProcessPaymentDTO): Promise<PaymentResult> {
    try {
      // This is a simplified implementation
      // In production, you would integrate with the specific wallet provider
      const walletType = paymentData.paymentMethod.details.walletType;
      
      switch (walletType) {
        case 'paypal':
          // Integrate with PayPal API
          return await this.processPayPalPayment(paymentData);
        case 'apple_pay':
        case 'google_pay':
          // These can be processed through Stripe
          return await this.processCreditCardPayment(paymentData);
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process PayPal payment (placeholder implementation)
   */
  private async processPayPalPayment(_paymentData: ProcessPaymentDTO): Promise<PaymentResult> {
    // This is a placeholder - in production, integrate with PayPal SDK
    try {
      // Simulate PayPal payment processing
      const transactionId = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In real implementation, you would:
      // 1. Create PayPal order
      // 2. Capture payment
      // 3. Handle webhooks
      
      return {
        success: true,
        transactionId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create escrow account for milestone-based payments
   */
  async createEscrow(bookingId: string, amount: number): Promise<EscrowAccount> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { serviceAgreement: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.serviceAgreement) {
      throw new Error('Service agreement required for escrow');
    }

    const paymentSchedule = booking.serviceAgreement.paymentSchedule as any;
    
    // Create escrow account (this would typically be with a payment processor)
    // For now, we'll track it in our database
    const escrowData = {
      id: `escrow_${bookingId}`,
      bookingId,
      totalAmount: amount,
      releasedAmount: 0,
      pendingAmount: amount,
      milestones: paymentSchedule || [],
    };

    // Store escrow information in booking
    await prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        additionalNotes: JSON.stringify({ escrow: escrowData }),
      },
    });

    return escrowData;
  }

  /**
   * Release funds from escrow for completed milestone
   */
  async releaseFunds(escrowId: string, milestoneId: string): Promise<PaymentResult> {
    try {
      const bookingId = escrowId.replace('escrow_', '');
      
      const booking = await prisma.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          vendor: { include: { user: true } },
          serviceAgreement: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const paymentSchedule = booking.serviceAgreement?.paymentSchedule as any;
      const milestone = paymentSchedule?.find((m: any) => m.id === milestoneId);

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.status === 'PAID') {
        throw new Error('Milestone already paid');
      }

      // Calculate platform fee
      const platformFeeRate = 0.05;
      const platformFee = milestone.amount * platformFeeRate;
      const vendorPayout = milestone.amount - platformFee;

      // Create payment record for milestone release
      const paymentRecord = await prisma.paymentRecord.create({
        data: {
          bookingId,
          payerId: booking.organizerId,
          payeeId: booking.vendor.userId,
          amount: milestone.amount,
          currency: 'USD',
          status: PaymentStatus.COMPLETED,
          paymentMethod: { type: 'ESCROW_RELEASE' } as any,
          transactionId: `milestone_${milestoneId}`,
          platformFee,
          vendorPayout,
          processedAt: new Date(),
        },
      });

      // Update milestone status
      milestone.status = 'PAID';
      milestone.paidAt = new Date();

      await prisma.serviceAgreement.update({
        where: { bookingId },
        data: {
          paymentSchedule: paymentSchedule,
        },
      });

      // TODO: Actually transfer funds to vendor account

      return {
        success: true,
        paymentId: paymentRecord.id,
        transactionId: `milestone_${milestoneId}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<RefundResult> {
    try {
      const payment = await prisma.paymentRecord.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Cannot refund incomplete payment');
      }

      let refundId: string | undefined;

      // Process refund through payment processor
      if (payment.transactionId && payment.transactionId.startsWith('pi_')) {
        // Stripe refund
        const refund = await stripe.refunds.create({
          payment_intent: payment.transactionId,
          amount: Math.round(amount * 100), // Convert to cents
          reason: 'requested_by_customer',
          metadata: {
            reason,
            originalPaymentId: paymentId,
          },
        });

        refundId = refund.id;
      }

      // Update payment record
      await prisma.paymentRecord.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUNDED },
      });

      return {
        success: true,
        refundId,
        amount,
      };
    } catch (error: any) {
      return {
        success: false,
        amount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(
    userId: string,
    userType: 'ORGANIZER' | 'VENDOR'
  ): Promise<any[]> {
    const whereClause = userType === 'ORGANIZER' 
      ? { payerId: userId }
      : { payeeId: userId };

    const payments = await prisma.paymentRecord.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            event: { select: { name: true } },
            serviceListing: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transactionId: payment.transactionId,
      platformFee: payment.platformFee,
      vendorPayout: payment.vendorPayout,
      processedAt: payment.processedAt,
      createdAt: payment.createdAt,
      eventName: payment.booking.event?.name,
      serviceName: payment.booking.serviceListing?.title,
    }));
  }

  /**
   * Generate invoice for a booking
   */
  async generateInvoice(bookingId: string): Promise<any> {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        serviceListing: true,
        organizer: true,
        vendor: { include: { user: true } },
        paymentRecords: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const invoice = {
      invoiceNumber: `INV-${booking.id.slice(-8).toUpperCase()}`,
      bookingId: booking.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      
      // Billing information
      billTo: {
        name: booking.organizer.name,
        email: booking.organizer.email,
        eventName: booking.event.name,
      },
      
      billFrom: {
        businessName: booking.vendor.businessName,
        email: booking.vendor.user.email,
        serviceName: booking.serviceListing.title,
      },
      
      // Line items
      items: [
        {
          description: booking.serviceListing.title,
          quantity: 1,
          unitPrice: booking.finalPrice || booking.quotedPrice || 0,
          total: booking.finalPrice || booking.quotedPrice || 0,
        },
      ],
      
      // Totals
      subtotal: booking.finalPrice || booking.quotedPrice || 0,
      platformFee: (booking.finalPrice || booking.quotedPrice || 0) * 0.05,
      total: booking.finalPrice || booking.quotedPrice || 0,
      
      // Payment status
      paymentStatus: booking.paymentRecords.length > 0 ? 'PAID' : 'PENDING',
      paymentRecords: booking.paymentRecords,
    };

    return invoice;
  }

  /**
   * Set up automated vendor payout
   */
  async setupAutomatedPayout(vendorId: string, _payoutDetails: any): Promise<boolean> {
    try {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { user: true },
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Create Stripe Connect account for vendor
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Should be dynamic based on vendor location
        email: vendor.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: vendor.businessName,
          support_email: vendor.user.email,
        },
      });

      // Store Stripe account ID with vendor
      await prisma.vendorProfile.update({
        where: { id: vendorId },
        data: {
          verificationDocuments: {
            ...vendor.verificationDocuments as any,
            stripeAccountId: account.id,
          },
        },
      });

      return true;
    } catch (error: any) {
      console.error('Payout setup error:', error);
      return false;
    }
  }

  /**
   * Process automated vendor payout
   */
  async processVendorPayout(paymentId: string): Promise<boolean> {
    try {
      const payment = await prisma.paymentRecord.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              vendor: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const vendor = payment.booking.vendor;
      const verificationDocs = vendor.verificationDocuments as any;
      
      if (!verificationDocs?.stripeAccountId) {
        throw new Error('Vendor payout account not set up');
      }

      // Create transfer to vendor
      const transfer = await stripe.transfers.create({
        amount: Math.round(payment.vendorPayout * 100), // Convert to cents
        currency: payment.currency.toLowerCase(),
        destination: verificationDocs.stripeAccountId,
        description: `Payout for booking ${payment.bookingId}`,
        metadata: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
        },
      });

      // Update payment record with payout information
      await prisma.paymentRecord.update({
        where: { id: paymentId },
        data: {
          paymentMethod: {
            ...payment.paymentMethod as any,
            payoutTransferId: transfer.id,
            payoutProcessedAt: new Date(),
          },
        },
      });

      return true;
    } catch (error: any) {
      console.error('Vendor payout error:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();