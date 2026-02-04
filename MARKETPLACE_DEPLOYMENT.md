# Marketplace Deployment and Configuration Guide

This guide covers the deployment and configuration of the Thittam1Hub Event Marketplace, including payment gateway integration, marketplace settings, and automated notifications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Payment Gateway Configuration](#payment-gateway-configuration)
3. [Marketplace Settings](#marketplace-settings)
4. [Deployment Steps](#deployment-steps)
5. [Testing and Validation](#testing-and-validation)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Environment Variables

Before deploying the marketplace, ensure the following environment variables are configured:

```bash
# Payment Gateway Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# PayPal Configuration (optional)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
PAYPAL_MODE=live

# Marketplace Configuration
PLATFORM_FEE_RATE=0.05
AUTO_PAYOUT_ENABLED=true
PAYOUT_DELAY_DAYS=7
ESCROW_ENABLED=true
MINIMUM_PAYOUT_AMOUNT=50

# Payment Processing
SUPPORTED_CURRENCIES=USD,EUR,GBP,CAD
DEFAULT_CURRENCY=USD
PAYMENT_TIMEOUT_MINUTES=30

# Frontend URL for notifications
FRONTEND_URL=https://your-domain.com
```

### Database Requirements

- PostgreSQL 14+ with the marketplace configuration table
- Run database migrations: `npm run prisma:migrate:prod`

### External Services

- **Stripe Account**: Set up Stripe Connect for vendor payouts
- **Email Service**: SendGrid or AWS SES for notifications
- **File Storage**: AWS S3 or equivalent for document storage

## Payment Gateway Configuration

### Stripe Setup

1. **Create Stripe Account**
   ```bash
   # Production keys
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Configure Stripe Connect**
   ```bash
   # Enable Express accounts for vendors
   STRIPE_CONNECT_CLIENT_ID=ca_...
   ```

3. **Set up Webhooks**
   - Endpoint URL: `https://your-domain.com/api/payments/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `transfer.created`
     - `transfer.failed`
     - `account.updated`
     - `payout.created`
     - `payout.failed`

4. **Configure Webhook Secret**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### PayPal Setup (Optional)

1. **Create PayPal App**
   ```bash
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   PAYPAL_MODE=live
   ```

2. **Configure Webhooks**
   - Endpoint URL: `https://your-domain.com/api/payments/paypal-webhook`
   - Events: Payment capture, refunds, disputes

## Marketplace Settings

### Commission Structure

The marketplace uses a tiered commission structure by service category:

| Category | Base Rate | Tiered Rates | Min Fee | Max Fee |
|----------|-----------|--------------|---------|---------|
| VENUE | 3% | 2% (>$10k), 2.5% (>$5k) | $50 | $1000 |
| CATERING | 4% | 3% (>$5k), 3.5% (>$2k) | $25 | $750 |
| PHOTOGRAPHY | 6% | - | $15 | $300 |
| ENTERTAINMENT | 7% | - | $25 | $500 |
| DEFAULT | 5% | - | $5 | $500 |

### Verification Requirements

Different service categories have different verification requirements:

#### High-Risk Categories (VENUE, CATERING, TRANSPORTATION, SECURITY)
- Business License ✓
- Insurance Certificate ✓
- Tax Documents ✓
- Identity Verification ✓
- Portfolio ✓
- Background Check ✓

#### Medium-Risk Categories (PHOTOGRAPHY, VIDEOGRAPHY, ENTERTAINMENT)
- Business License ✗
- Insurance Certificate ✓
- Tax Documents ✓
- Identity Verification ✓
- Portfolio ✓
- Minimum Experience: 2 years

#### Low-Risk Categories (DECORATION, PRINTING, MARKETING)
- Business License ✓
- Insurance Certificate ✗
- Tax Documents ✓
- Identity Verification ✓
- Portfolio ✓

## Deployment Steps

### 1. Database Migration

```bash
# Run database migrations
npm run prisma:migrate:prod

# Initialize marketplace configuration
npm run marketplace:init
```

### 2. Environment Configuration

```bash
# Validate environment variables
npm run marketplace:validate

# Deploy marketplace configuration
npm run marketplace:deploy
```

### 3. Payment Gateway Setup

```bash
# Test Stripe connection
curl -X GET "https://your-domain.com/api/marketplace/config/validate" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Webhook Configuration

Set up webhook endpoints in your payment processor dashboards:

**Stripe Dashboard:**
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events listed above
4. Copy webhook secret to environment variables

**PayPal Dashboard:**
1. Go to My Apps & Credentials
2. Create webhook: `https://your-domain.com/api/payments/paypal-webhook`
3. Select relevant events

### 5. Email Notification Setup

Configure email templates and notification triggers:

```bash
# Test email configuration
curl -X POST "https://your-domain.com/api/communications/test" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "template": "VENDOR_VERIFICATION_APPROVED"}'
```

### 6. Security Configuration

- Enable HTTPS for all endpoints
- Configure CORS for your frontend domain
- Set up rate limiting for API endpoints
- Enable audit logging for sensitive operations

## Testing and Validation

### Automated Tests

Run the comprehensive test suite:

```bash
# Unit tests
npm test -- --testPathPattern=marketplace-config

# Integration tests
npm test -- --testPathPattern=marketplace-deployment

# All marketplace tests
npm test -- --testNamePattern="marketplace"
```

### Manual Testing Checklist

#### Vendor Onboarding Flow
- [ ] Vendor registration
- [ ] Document upload
- [ ] Verification approval/rejection
- [ ] Service listing creation
- [ ] Profile completion

#### Booking Process
- [ ] Service discovery
- [ ] Booking request creation
- [ ] Quote submission and acceptance
- [ ] Service agreement generation
- [ ] Payment processing

#### Payment and Payout Flow
- [ ] Payment processing with correct fees
- [ ] Escrow account creation
- [ ] Milestone-based fund release
- [ ] Automated vendor payouts
- [ ] Refund processing

#### Review System
- [ ] Review submission
- [ ] Vendor response
- [ ] Rating calculation
- [ ] Review moderation

### Load Testing

Test the system under load:

```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run load-test-config.yml
```

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Payment Metrics**
   - Transaction success rate
   - Average processing time
   - Failed payment rate
   - Chargeback rate

2. **Marketplace Metrics**
   - Vendor onboarding rate
   - Booking conversion rate
   - Average transaction value
   - Customer satisfaction scores

3. **System Metrics**
   - API response times
   - Database performance
   - Error rates
   - Webhook delivery success

### Monitoring Setup

```bash
# Set up monitoring dashboards
# - Payment processing metrics
# - Marketplace activity metrics
# - System performance metrics
# - Error tracking and alerting
```

### Regular Maintenance Tasks

1. **Weekly**
   - Review failed payments and resolve issues
   - Monitor vendor verification queue
   - Check webhook delivery status

2. **Monthly**
   - Analyze commission structure effectiveness
   - Review and update verification requirements
   - Generate marketplace performance reports

3. **Quarterly**
   - Security audit and penetration testing
   - Performance optimization review
   - Update payment processor integrations

## Troubleshooting

### Common Issues

#### Payment Processing Failures

**Symptom**: Payments failing with "Invalid API key" error
**Solution**: 
1. Verify Stripe secret key is correct
2. Check if using test vs live keys consistently
3. Ensure webhook secret matches Stripe dashboard

#### Webhook Delivery Failures

**Symptom**: Webhooks not being processed
**Solution**:
1. Check webhook endpoint URL is accessible
2. Verify webhook secret configuration
3. Review webhook event logs in Stripe dashboard
4. Check server logs for processing errors

#### Commission Calculation Errors

**Symptom**: Incorrect fee calculations
**Solution**:
1. Verify marketplace configuration is loaded correctly
2. Check service category mapping
3. Review tiered rate thresholds
4. Test fee calculation with known values

#### Vendor Payout Issues

**Symptom**: Automated payouts not processing
**Solution**:
1. Verify Stripe Connect account setup
2. Check vendor bank account verification
3. Review payout delay configuration
4. Ensure minimum payout threshold is met

### Debug Commands

```bash
# Check marketplace configuration
npm run marketplace:validate

# Test payment processing
curl -X POST "https://your-domain.com/api/payments/test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD"}'

# Verify webhook processing
curl -X POST "https://your-domain.com/api/payments/webhook/test" \
  -H "stripe-signature: test_signature" \
  -H "Content-Type: application/json" \
  -d '{"type": "payment_intent.succeeded", "data": {"object": {"id": "pi_test"}}}'
```

### Log Analysis

Key log patterns to monitor:

```bash
# Payment processing errors
grep "Payment processing error" /var/log/app.log

# Webhook failures
grep "Webhook error" /var/log/app.log

# Commission calculation issues
grep "Commission calculation" /var/log/app.log

# Vendor verification problems
grep "Vendor verification" /var/log/app.log
```

## Support and Documentation

- **API Documentation**: `/api/docs`
- **Webhook Documentation**: `/docs/webhooks`
- **Integration Guide**: `/docs/integration`
- **Support Contact**: support@thittam1hub.com

For additional support or questions about marketplace deployment, please contact the development team or refer to the comprehensive API documentation.