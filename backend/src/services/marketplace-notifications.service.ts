import { PrismaClient } from '@prisma/client';
import { CommunicationService } from './communication.service';

const prisma = new PrismaClient();

export interface NotificationTemplate {
  subject: string;
  body: string;
  variables: string[];
}

export class MarketplaceNotificationService {
  private communicationService: CommunicationService;

  constructor() {
    this.communicationService = new CommunicationService();
  }

  /**
   * Send vendor verification approval notification
   */
  async sendVendorVerificationApproved(vendorId: string): Promise<void> {
    try {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { user: true },
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      const template = this.getTemplate('VENDOR_VERIFICATION_APPROVED');
      const emailData = {
        to: [vendor.user.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          vendorName: vendor.businessName,
          loginUrl: `${process.env.FRONTEND_URL}/vendor/dashboard`,
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send vendor verification approval notification:', error);
    }
  }

  /**
   * Send vendor verification rejection notification
   */
  async sendVendorVerificationRejected(vendorId: string, reason: string): Promise<void> {
    try {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { user: true },
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      const template = this.getTemplate('VENDOR_VERIFICATION_REJECTED');
      const emailData = {
        to: [vendor.user.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          vendorName: vendor.businessName,
          rejectionReason: reason,
          resubmitUrl: `${process.env.FRONTEND_URL}/vendor/verification`,
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send vendor verification rejection notification:', error);
    }
  }

  /**
   * Send new booking request notification to vendor
   */
  async sendNewBookingRequest(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          event: true,
          serviceListing: true,
          organizer: true,
          vendor: { include: { user: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const template = this.getTemplate('NEW_BOOKING_REQUEST');
      const emailData = {
        to: [booking.vendor.user.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          vendorName: booking.vendor.businessName,
          eventName: booking.event.name,
          serviceName: booking.serviceListing.title,
          organizerName: booking.organizer.name,
          serviceDate: booking.serviceDate.toLocaleDateString(),
          bookingUrl: `${process.env.FRONTEND_URL}/vendor/bookings/${booking.id}`,
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send new booking request notification:', error);
    }
  }

  /**
   * Send booking confirmation notification to organizer
   */
  async sendBookingConfirmed(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          event: true,
          serviceListing: true,
          organizer: true,
          vendor: { include: { user: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const template = this.getTemplate('BOOKING_CONFIRMED');
      const emailData = {
        to: [booking.organizer.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          organizerName: booking.organizer.name,
          eventName: booking.event.name,
          serviceName: booking.serviceListing.title,
          vendorName: booking.vendor.businessName,
          serviceDate: booking.serviceDate.toLocaleDateString(),
          finalPrice: booking.finalPrice?.toFixed(2) || 'TBD',
          bookingUrl: `${process.env.FRONTEND_URL}/organizer/bookings/${booking.id}`,
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send booking confirmation notification:', error);
    }
  }

  /**
   * Send payment received notification to vendor
   */
  async sendPaymentReceived(paymentId: string): Promise<void> {
    try {
      const payment = await prisma.paymentRecord.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              event: true,
              serviceListing: true,
              vendor: { include: { user: true } },
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const template = this.getTemplate('PAYMENT_RECEIVED');
      const emailData = {
        to: [payment.booking.vendor.user.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          vendorName: payment.booking.vendor.businessName,
          eventName: payment.booking.event.name,
          serviceName: payment.booking.serviceListing.title,
          paymentAmount: payment.amount.toFixed(2),
          vendorPayout: payment.vendorPayout.toFixed(2),
          currency: payment.currency,
          paymentDate: payment.processedAt?.toLocaleDateString() || 'Pending',
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send payment received notification:', error);
    }
  }

  /**
   * Send payout processed notification to vendor
   */
  async sendPayoutProcessed(paymentId: string): Promise<void> {
    try {
      const payment = await prisma.paymentRecord.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              vendor: { include: { user: true } },
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const template = this.getTemplate('PAYOUT_PROCESSED');
      const emailData = {
        to: [payment.booking.vendor.user.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          vendorName: payment.booking.vendor.businessName,
          payoutAmount: payment.vendorPayout.toFixed(2),
          currency: payment.currency,
          payoutDate: new Date().toLocaleDateString(),
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send payout processed notification:', error);
    }
  }

  /**
   * Send review request notification to organizer
   */
  async sendReviewRequest(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          event: true,
          serviceListing: true,
          organizer: true,
          vendor: { include: { user: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const template = this.getTemplate('REVIEW_REQUEST');
      const emailData = {
        to: [booking.organizer.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          organizerName: booking.organizer.name,
          eventName: booking.event.name,
          serviceName: booking.serviceListing.title,
          vendorName: booking.vendor.businessName,
          reviewUrl: `${process.env.FRONTEND_URL}/organizer/bookings/${booking.id}/review`,
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send review request notification:', error);
    }
  }

  /**
   * Send new review notification to vendor
   */
  async sendNewReview(reviewId: string): Promise<void> {
    try {
      const review = await prisma.vendorReview.findUnique({
        where: { id: reviewId },
        include: {
          vendor: { include: { user: true } },
          booking: {
            include: {
              event: true,
              serviceListing: true,
            },
          },
          organizer: true,
        },
      });

      if (!review) {
        throw new Error('Review not found');
      }

      const template = this.getTemplate('NEW_REVIEW');
      const emailData = {
        to: [review.vendor.user.email],
        subject: template.subject,
        body: this.replaceVariables(template.body, {
          vendorName: review.vendor.businessName,
          eventName: review.booking.event.name,
          serviceName: review.booking.serviceListing.title,
          organizerName: review.organizer.name,
          rating: review.rating.toString(),
          reviewTitle: review.title,
          reviewUrl: `${process.env.FRONTEND_URL}/vendor/reviews/${review.id}`,
        }),
      };

      await this.communicationService.sendEmail(emailData);
    } catch (error) {
      console.error('Failed to send new review notification:', error);
    }
  }

  /**
   * Get email template by type
   */
  private getTemplate(type: string): NotificationTemplate {
    const templates: Record<string, NotificationTemplate> = {
      VENDOR_VERIFICATION_APPROVED: {
        subject: 'Congratulations! Your vendor profile has been verified',
        body: `
          Dear {{vendorName}},

          Great news! Your vendor profile on Thittam1Hub has been successfully verified. You can now:

          • Accept booking requests from event organizers
          • Receive payments through our secure platform
          • Build your reputation with customer reviews
          • Access advanced marketplace features

          Get started by logging into your vendor dashboard: {{loginUrl}}

          Welcome to the Thittam1Hub marketplace!

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['vendorName', 'loginUrl'],
      },

      VENDOR_VERIFICATION_REJECTED: {
        subject: 'Action Required: Vendor Verification Update Needed',
        body: `
          Dear {{vendorName}},

          Thank you for your interest in joining the Thittam1Hub marketplace. After reviewing your vendor application, we need additional information before we can approve your profile.

          Reason for rejection: {{rejectionReason}}

          Please update your verification documents and resubmit your application: {{resubmitUrl}}

          If you have any questions, please don't hesitate to contact our support team.

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['vendorName', 'rejectionReason', 'resubmitUrl'],
      },

      NEW_BOOKING_REQUEST: {
        subject: 'New Booking Request - {{eventName}}',
        body: `
          Dear {{vendorName}},

          You have received a new booking request for your service "{{serviceName}}"!

          Event Details:
          • Event: {{eventName}}
          • Organizer: {{organizerName}}
          • Service Date: {{serviceDate}}

          Please review the request and respond promptly: {{bookingUrl}}

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['vendorName', 'eventName', 'serviceName', 'organizerName', 'serviceDate', 'bookingUrl'],
      },

      BOOKING_CONFIRMED: {
        subject: 'Booking Confirmed - {{serviceName}}',
        body: `
          Dear {{organizerName}},

          Your booking has been confirmed!

          Service Details:
          • Service: {{serviceName}}
          • Vendor: {{vendorName}}
          • Event: {{eventName}}
          • Service Date: {{serviceDate}}
          • Final Price: ${{finalPrice}}

          View your booking details: {{bookingUrl}}

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['organizerName', 'eventName', 'serviceName', 'vendorName', 'serviceDate', 'finalPrice', 'bookingUrl'],
      },

      PAYMENT_RECEIVED: {
        subject: 'Payment Received - {{eventName}}',
        body: `
          Dear {{vendorName}},

          We have received payment for your service "{{serviceName}}" for the event "{{eventName}}".

          Payment Details:
          • Total Payment: {{paymentAmount}} {{currency}}
          • Your Payout: {{vendorPayout}} {{currency}}
          • Payment Date: {{paymentDate}}

          Your payout will be processed according to your payout schedule.

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['vendorName', 'eventName', 'serviceName', 'paymentAmount', 'vendorPayout', 'currency', 'paymentDate'],
      },

      PAYOUT_PROCESSED: {
        subject: 'Payout Processed - {{payoutAmount}} {{currency}}',
        body: `
          Dear {{vendorName}},

          Your payout has been processed successfully!

          Payout Details:
          • Amount: {{payoutAmount}} {{currency}}
          • Payout Date: {{payoutDate}}

          The funds should appear in your account within 1-3 business days.

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['vendorName', 'payoutAmount', 'currency', 'payoutDate'],
      },

      REVIEW_REQUEST: {
        subject: 'Please Review Your Recent Service - {{eventName}}',
        body: `
          Dear {{organizerName}},

          We hope your event "{{eventName}}" was a success! 

          Please take a moment to review the service provided by {{vendorName}} for "{{serviceName}}". Your feedback helps other organizers make informed decisions and helps vendors improve their services.

          Leave your review here: {{reviewUrl}}

          Thank you for using Thittam1Hub!

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['organizerName', 'eventName', 'serviceName', 'vendorName', 'reviewUrl'],
      },

      NEW_REVIEW: {
        subject: 'New Review Received - {{rating}}/5 Stars',
        body: `
          Dear {{vendorName}},

          You have received a new review for your service "{{serviceName}}"!

          Review Details:
          • Event: {{eventName}}
          • Organizer: {{organizerName}}
          • Rating: {{rating}}/5 stars
          • Title: {{reviewTitle}}

          View the full review and respond: {{reviewUrl}}

          Best regards,
          The Thittam1Hub Team
        `,
        variables: ['vendorName', 'eventName', 'serviceName', 'organizerName', 'rating', 'reviewTitle', 'reviewUrl'],
      },
    };

    return templates[type] || {
      subject: 'Notification from Thittam1Hub',
      body: 'You have a new notification from Thittam1Hub.',
      variables: [],
    };
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result.trim();
  }
}

export const marketplaceNotificationService = new MarketplaceNotificationService();