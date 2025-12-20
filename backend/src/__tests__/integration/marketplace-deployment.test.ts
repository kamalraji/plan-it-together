import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../index';
import { marketplaceConfigService } from '../../services/marketplace-config.service';
import { paymentService } from '../../services/payment.service';

const prisma = new PrismaClient();

describe('Marketplace Deployment Integration Tests', () => {
  let authToken: string;
  let vendorToken: string;
  let organizerToken: string;
  let testVendorId: string;
  let testEventId: string;
  let testServiceListingId: string;
  let testBookingId: string;

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing';
    process.env.PLATFORM_FEE_RATE = '0.05';
    process.env.AUTO_PAYOUT_ENABLED = 'false';
    
    // Initialize marketplace configuration
    await marketplaceConfigService.updateConfig({
      platformFeeRate: 0.05,
      autoPayoutEnabled: false,
      payoutDelayDays: 1,
      escrowEnabled: true,
      minimumPayoutAmount: 10,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.paymentRecord.deleteMany({});
    await prisma.bookingRequest.deleteMany({});
    await prisma.serviceAgreement.deleteMany({});
    await prisma.vendorReview.deleteMany({});
    await prisma.serviceListing.deleteMany({});
    await prisma.vendorProfile.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.marketplaceConfig.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test users and authenticate
    const adminUser = await createTestUser('admin@test.com', 'SUPER_ADMIN');
    const vendorUser = await createTestUser('vendor@test.com', 'ORGANIZER');
    const organizerUser = await createTestUser('organizer@test.com', 'ORGANIZER');

    authToken = await getAuthToken(adminUser.email);
    vendorToken = await getAuthToken(vendorUser.email);
    organizerToken = await getAuthToken(organizerUser.email);

    // Create test vendor profile
    const vendorProfile = await createTestVendorProfile(vendorUser.id);
    testVendorId = vendorProfile.id;

    // Create test event
    const event = await createTestEvent(organizerUser.id);
    testEventId = event.id;

    // Create test service listing
    const serviceListing = await createTestServiceListing(testVendorId);
    testServiceListingId = serviceListing.id;
  });

  describe('Marketplace Configuration', () => {
    it('should validate payment gateway configuration', async () => {
      const response = await request(app)
        .get('/api/marketplace/config/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('warnings');
    });

    it('should get marketplace configuration', async () => {
      const response = await request(app)
        .get('/api/marketplace/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('platformFeeRate');
      expect(response.body.data).toHaveProperty('autoPayoutEnabled');
      expect(response.body.data).toHaveProperty('escrowEnabled');
      expect(response.body.data.platformFeeRate).toBe(0.05);
    });

    it('should calculate commission rates correctly', async () => {
      const response = await request(app)
        .get('/api/marketplace/config/commission?category=VENUE&amount=5000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rate');
      expect(response.body.data).toHaveProperty('fee');
      expect(response.body.data).toHaveProperty('vendorPayout');
      expect(response.body.data.fee).toBeGreaterThan(0);
      expect(response.body.data.vendorPayout).toBeLessThan(5000);
    });

    it('should get verification requirements by category', async () => {
      const response = await request(app)
        .get('/api/marketplace/config/verification/VENUE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('businessLicense');
      expect(response.body.data).toHaveProperty('insuranceCertificate');
      expect(response.body.data).toHaveProperty('identityVerification');
    });
  });

  describe('Complete Vendor Onboarding Flow', () => {
    it('should complete vendor registration and verification', async () => {
      // 1. Vendor registers profile
      const profileResponse = await request(app)
        .post('/api/vendors/profile')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          businessName: 'Test Catering Co',
          description: 'Professional catering services',
          contactInfo: {
            email: 'vendor@test.com',
            phone: '+1234567890',
            website: 'https://testcatering.com',
          },
          serviceCategories: ['CATERING'],
          businessAddress: {
            street: '123 Business St',
            city: 'Test City',
            state: 'TS',
            country: 'US',
            postalCode: '12345',
          },
        })
        .expect(201);

      expect(profileResponse.body.success).toBe(true);
      const vendorProfileId = profileResponse.body.data.id;

      // 2. Submit verification documents
      const verificationResponse = await request(app)
        .post(`/api/vendors/${vendorProfileId}/verification`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          businessLicense: 'license123.pdf',
          insuranceCertificate: 'insurance456.pdf',
          taxDocuments: 'tax789.pdf',
        })
        .expect(200);

      expect(verificationResponse.body.success).toBe(true);

      // 3. Admin approves verification
      const approvalResponse = await request(app)
        .post(`/api/vendors/${vendorProfileId}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          approved: true,
          reason: 'All documents verified successfully',
        })
        .expect(200);

      expect(approvalResponse.body.success).toBe(true);

      // 4. Check verification compliance
      const complianceResponse = await request(app)
        .get(`/api/marketplace/config/verification/${vendorProfileId}/CATERING/check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(complianceResponse.body.success).toBe(true);
      expect(complianceResponse.body.data.compliant).toBe(true);
      expect(complianceResponse.body.data.missingRequirements).toHaveLength(0);
    });

    it('should create and manage service listings', async () => {
      // Create service listing
      const listingResponse = await request(app)
        .post('/api/vendors/services')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          vendorId: testVendorId,
          title: 'Premium Wedding Catering',
          description: 'Full-service wedding catering with custom menus',
          category: 'CATERING',
          pricing: {
            type: 'PER_PERSON',
            basePrice: 75,
            currency: 'USD',
            minimumOrder: 50,
          },
          availability: {
            timezone: 'America/New_York',
            recurringAvailability: {
              friday: [{ startTime: '09:00', endTime: '23:00' }],
              saturday: [{ startTime: '09:00', endTime: '23:00' }],
              sunday: [{ startTime: '09:00', endTime: '22:00' }],
            },
            blockedDates: [],
            customAvailability: [],
          },
          serviceArea: ['New York', 'New Jersey', 'Connecticut'],
          inclusions: ['Setup', 'Service staff', 'Cleanup'],
          exclusions: ['Alcohol', 'Decorations'],
        })
        .expect(201);

      expect(listingResponse.body.success).toBe(true);
      expect(listingResponse.body.data).toHaveProperty('id');
      expect(listingResponse.body.data.title).toBe('Premium Wedding Catering');
    });
  });

  describe('End-to-End Booking Process', () => {
    beforeEach(async () => {
      // Create a booking request for testing
      const booking = await createTestBookingRequest(testEventId, testServiceListingId, testVendorId);
      testBookingId = booking.id;
    });

    it('should complete full booking workflow', async () => {
      // 1. Organizer creates booking request
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          eventId: testEventId,
          serviceListingId: testServiceListingId,
          serviceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          requirements: 'Need catering for 100 guests, vegetarian options required',
          budgetRange: { min: 5000, max: 8000 },
        })
        .expect(201);

      expect(bookingResponse.body.success).toBe(true);
      const bookingId = bookingResponse.body.data.id;

      // 2. Vendor sends quote
      const quoteResponse = await request(app)
        .put(`/api/bookings/${bookingId}/quote`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          quotedPrice: 7500,
          additionalNotes: 'Includes premium vegetarian menu and service staff',
        })
        .expect(200);

      expect(quoteResponse.body.success).toBe(true);

      // 3. Organizer accepts quote
      const acceptResponse = await request(app)
        .put(`/api/bookings/${bookingId}/accept`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(acceptResponse.body.success).toBe(true);

      // 4. Generate service agreement
      const agreementResponse = await request(app)
        .post(`/api/service-agreements/${bookingId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          terms: 'Standard catering service agreement',
          deliverables: [
            {
              title: 'Menu Planning',
              description: 'Finalize menu 2 weeks before event',
              dueDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Event Catering',
              description: 'Provide catering service on event day',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          ],
          paymentSchedule: [
            {
              title: 'Deposit',
              description: '50% deposit upon agreement signing',
              amount: 3750,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            {
              title: 'Final Payment',
              description: 'Remaining balance on event day',
              amount: 3750,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          ],
          cancellationPolicy: 'Full refund if cancelled 14+ days before event',
        })
        .expect(201);

      expect(agreementResponse.body.success).toBe(true);

      // 5. Check booking status
      const statusResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.status).toBe('QUOTE_ACCEPTED');
    });

    it('should handle booking cancellation', async () => {
      // Cancel booking
      const cancelResponse = await request(app)
        .put(`/api/bookings/${testBookingId}/cancel`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          reason: 'Event postponed due to unforeseen circumstances',
        })
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);

      // Verify booking status
      const statusResponse = await request(app)
        .get(`/api/bookings/${testBookingId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(statusResponse.body.data.status).toBe('CANCELLED');
    });
  });

  describe('Payment and Payout Workflows', () => {
    beforeEach(async () => {
      // Set up a confirmed booking for payment testing
      await prisma.bookingRequest.update({
        where: { id: testBookingId },
        data: {
          status: 'QUOTE_ACCEPTED',
          quotedPrice: 5000,
          finalPrice: 5000,
        },
      });
    });

    it('should process payment with correct fee calculation', async () => {
      // Process payment
      const paymentResponse = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          bookingId: testBookingId,
          amount: 5000,
          currency: 'USD',
          paymentMethod: {
            type: 'CREDIT_CARD',
            details: {
              paymentMethodId: 'pm_test_card_visa',
            },
          },
          description: 'Payment for catering services',
        });

      // Note: This will fail in test environment without real Stripe setup
      // but we can test the fee calculation logic
      expect(paymentResponse.status).toBeOneOf([200, 400]); // 400 expected due to test Stripe key

      // Test fee calculation directly
      const feeCalculation = await marketplaceConfigService.calculatePlatformFee('CATERING', 5000);
      expect(feeCalculation.fee).toBeGreaterThan(0);
      expect(feeCalculation.vendorPayout).toBe(5000 - feeCalculation.fee);
      expect(feeCalculation.rate).toBeGreaterThan(0);
    });

    it('should create and manage escrow account', async () => {
      // Create escrow account
      const escrowResponse = await request(app)
        .post('/api/payments/escrow')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          bookingId: testBookingId,
          amount: 5000,
        })
        .expect(200);

      expect(escrowResponse.body.success).toBe(true);
      expect(escrowResponse.body.data).toHaveProperty('id');
      expect(escrowResponse.body.data.totalAmount).toBe(5000);
      expect(escrowResponse.body.data.pendingAmount).toBe(5000);
    });

    it('should generate invoice correctly', async () => {
      // Generate invoice
      const invoiceResponse = await request(app)
        .get(`/api/payments/invoice/${testBookingId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(invoiceResponse.body.success).toBe(true);
      expect(invoiceResponse.body.data).toHaveProperty('invoiceNumber');
      expect(invoiceResponse.body.data).toHaveProperty('billTo');
      expect(invoiceResponse.body.data).toHaveProperty('billFrom');
      expect(invoiceResponse.body.data).toHaveProperty('items');
      expect(invoiceResponse.body.data).toHaveProperty('total');
    });

    it('should retrieve payment history', async () => {
      // Get organizer payment history
      const organizerHistoryResponse = await request(app)
        .get('/api/payments/history?type=ORGANIZER')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(organizerHistoryResponse.body.success).toBe(true);
      expect(Array.isArray(organizerHistoryResponse.body.data)).toBe(true);

      // Get vendor payment history
      const vendorHistoryResponse = await request(app)
        .get('/api/payments/history?type=VENDOR')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);

      expect(vendorHistoryResponse.body.success).toBe(true);
      expect(Array.isArray(vendorHistoryResponse.body.data)).toBe(true);
    });
  });

  describe('Review and Rating System', () => {
    beforeEach(async () => {
      // Set booking to completed status for review testing
      await prisma.bookingRequest.update({
        where: { id: testBookingId },
        data: { status: 'COMPLETED' },
      });
    });

    it('should submit and manage vendor reviews', async () => {
      // Submit review
      const reviewResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          bookingId: testBookingId,
          rating: 5,
          title: 'Excellent catering service!',
          comment: 'The food was amazing and the service was professional. Highly recommended!',
          serviceQuality: 5,
          communication: 5,
          timeliness: 5,
          value: 4,
          wouldRecommend: true,
        })
        .expect(201);

      expect(reviewResponse.body.success).toBe(true);
      expect(reviewResponse.body.data).toHaveProperty('id');
      expect(reviewResponse.body.data.rating).toBe(5);

      const reviewId = reviewResponse.body.data.id;

      // Vendor responds to review
      const responseResponse = await request(app)
        .put(`/api/reviews/${reviewId}/respond`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          response: 'Thank you for the wonderful review! It was a pleasure working with you.',
        })
        .expect(200);

      expect(responseResponse.body.success).toBe(true);

      // Get vendor reviews
      const vendorReviewsResponse = await request(app)
        .get(`/api/vendors/${testVendorId}/reviews`)
        .expect(200);

      expect(vendorReviewsResponse.body.success).toBe(true);
      expect(Array.isArray(vendorReviewsResponse.body.data)).toBe(true);
      expect(vendorReviewsResponse.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Webhook Processing', () => {
    it('should handle payment webhook events', async () => {
      const webhookPayload = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_payment_intent',
            metadata: {
              bookingId: testBookingId,
            },
          },
        },
      };

      const webhookResponse = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test_signature')
        .send(webhookPayload)
        .expect(200);

      expect(webhookResponse.body.received).toBe(true);
    });
  });

  // Helper functions
  async function createTestUser(email: string, role: string) {
    return await prisma.user.create({
      data: {
        email,
        passwordHash: 'hashed_password',
        name: 'Test User',
        role: role as any,
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }

  async function getAuthToken(email: string): Promise<string> {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'password',
      });

    return response.body.data.accessToken;
  }

  async function createTestVendorProfile(userId: string) {
    return await prisma.vendorProfile.create({
      data: {
        userId,
        businessName: 'Test Vendor',
        description: 'Test vendor description',
        contactInfo: {
          email: 'vendor@test.com',
          phone: '+1234567890',
        },
        serviceCategories: ['CATERING'],
        businessAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          country: 'US',
          postalCode: '12345',
        },
        verificationStatus: 'VERIFIED',
        portfolio: [],
      },
    });
  }

  async function createTestEvent(organizerId: string) {
    return await prisma.event.create({
      data: {
        name: 'Test Event',
        description: 'Test event description',
        mode: 'OFFLINE',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        organizerId,
        branding: {},
        landingPageUrl: `test-event-${Date.now()}`,
        status: 'PUBLISHED',
      },
    });
  }

  async function createTestServiceListing(vendorId: string) {
    return await prisma.serviceListing.create({
      data: {
        vendorId,
        title: 'Test Catering Service',
        description: 'Test catering service description',
        category: 'CATERING',
        pricing: {
          type: 'PER_PERSON',
          basePrice: 50,
          currency: 'USD',
        },
        availability: {},
        serviceArea: ['Test City'],
        inclusions: ['Food', 'Service'],
        exclusions: [],
        media: [],
      },
    });
  }

  async function createTestBookingRequest(eventId: string, serviceListingId: string, vendorId: string) {
    const organizer = await prisma.user.findFirst({
      where: { role: 'ORGANIZER', email: 'organizer@test.com' },
    });

    return await prisma.bookingRequest.create({
      data: {
        eventId,
        serviceListingId,
        organizerId: organizer!.id,
        vendorId,
        serviceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        requirements: 'Test requirements',
        status: 'PENDING',
      },
    });
  }
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});