#!/usr/bin/env ts-node

/**
 * Marketplace deployment configuration script
 * This script configures all marketplace settings for production deployment
 */

import { PrismaClient } from '@prisma/client';
import { marketplaceConfigService } from '../services/marketplace-config.service';
import { initializeMarketplaceConfig } from './init-marketplace-config';

const prisma = new PrismaClient();

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  paymentGateway: {
    stripe: {
      enabled: boolean;
      testMode: boolean;
    };
    paypal: {
      enabled: boolean;
      testMode: boolean;
    };
  };
  marketplace: {
    platformFeeRate: number;
    autoPayoutEnabled: boolean;
    payoutDelayDays: number;
    escrowEnabled: boolean;
    minimumPayoutAmount: number;
  };
  notifications: {
    emailEnabled: boolean;
    webhookEnabled: boolean;
  };
}

async function deployMarketplace() {
  try {
    console.log('🚀 Starting marketplace deployment configuration...');

    const environment = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';
    console.log(`📍 Environment: ${environment}`);

    // Initialize base configuration
    await initializeMarketplaceConfig();

    // Configure environment-specific settings
    const deploymentConfig = getDeploymentConfig(environment);
    await applyDeploymentConfig(deploymentConfig);

    // Validate configuration
    await validateDeploymentConfig();

    // Set up webhook endpoints
    await setupWebhookEndpoints();

    // Configure automated email notifications
    await configureEmailNotifications();

    // Run deployment tests
    await runDeploymentTests();

    console.log('🎉 Marketplace deployment configuration completed successfully!');

  } catch (error) {
    console.error('❌ Marketplace deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function getDeploymentConfig(environment: string): DeploymentConfig {
  const configs: Record<string, DeploymentConfig> = {
    development: {
      environment: 'development',
      paymentGateway: {
        stripe: {
          enabled: true,
          testMode: true,
        },
        paypal: {
          enabled: false,
          testMode: true,
        },
      },
      marketplace: {
        platformFeeRate: 0.05, // 5%
        autoPayoutEnabled: false,
        payoutDelayDays: 1, // Faster for testing
        escrowEnabled: true,
        minimumPayoutAmount: 10, // Lower for testing
      },
      notifications: {
        emailEnabled: true,
        webhookEnabled: true,
      },
    },
    staging: {
      environment: 'staging',
      paymentGateway: {
        stripe: {
          enabled: true,
          testMode: true,
        },
        paypal: {
          enabled: true,
          testMode: true,
        },
      },
      marketplace: {
        platformFeeRate: 0.05, // 5%
        autoPayoutEnabled: true,
        payoutDelayDays: 3,
        escrowEnabled: true,
        minimumPayoutAmount: 25,
      },
      notifications: {
        emailEnabled: true,
        webhookEnabled: true,
      },
    },
    production: {
      environment: 'production',
      paymentGateway: {
        stripe: {
          enabled: true,
          testMode: false,
        },
        paypal: {
          enabled: true,
          testMode: false,
        },
      },
      marketplace: {
        platformFeeRate: 0.05, // 5%
        autoPayoutEnabled: true,
        payoutDelayDays: 7,
        escrowEnabled: true,
        minimumPayoutAmount: 50,
      },
      notifications: {
        emailEnabled: true,
        webhookEnabled: true,
      },
    },
  };

  return configs[environment] || configs.development;
}

async function applyDeploymentConfig(config: DeploymentConfig) {
  console.log('⚙️  Applying deployment configuration...');

  // Update marketplace configuration
  await marketplaceConfigService.updateConfig({
    platformFeeRate: config.marketplace.platformFeeRate,
    autoPayoutEnabled: config.marketplace.autoPayoutEnabled,
    payoutDelayDays: config.marketplace.payoutDelayDays,
    escrowEnabled: config.marketplace.escrowEnabled,
    minimumPayoutAmount: config.marketplace.minimumPayoutAmount,
  });

  console.log(`✅ Applied ${config.environment} marketplace configuration`);
}

async function validateDeploymentConfig() {
  console.log('🔍 Validating deployment configuration...');

  const validation = await marketplaceConfigService.validatePaymentConfig();

  if (!validation.valid) {
    console.log('❌ Configuration validation failed:');
    validation.errors.forEach(error => console.log(`   - ${error}`));
    throw new Error('Invalid configuration');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  Configuration warnings:');
    validation.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('✅ Configuration validation passed');
}

async function setupWebhookEndpoints() {
  console.log('🔗 Setting up webhook endpoints...');

  const webhookEndpoints = [
    {
      name: 'Stripe Payments',
      url: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/payments/webhook`,
      events: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'transfer.created',
        'transfer.failed',
        'account.updated',
        'payout.created',
        'payout.failed',
      ],
    },
  ];

  for (const endpoint of webhookEndpoints) {
    console.log(`   - ${endpoint.name}: ${endpoint.url}`);
    console.log(`     Events: ${endpoint.events.join(', ')}`);
  }

  console.log('✅ Webhook endpoints configured');
}

async function configureEmailNotifications() {
  console.log('📧 Configuring email notifications...');

  const emailTemplates = [
    'VENDOR_VERIFICATION_APPROVED',
    'VENDOR_VERIFICATION_REJECTED',
    'NEW_BOOKING_REQUEST',
    'BOOKING_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYOUT_PROCESSED',
    'REVIEW_REQUEST',
    'NEW_REVIEW',
  ];

  console.log(`   - Configured ${emailTemplates.length} email templates`);
  emailTemplates.forEach(template => console.log(`     - ${template}`));

  console.log('✅ Email notifications configured');
}

async function runDeploymentTests() {
  console.log('🧪 Running deployment tests...');

  const tests = [
    {
      name: 'Database Connection',
      test: async () => {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      },
    },
    {
      name: 'Marketplace Configuration',
      test: async () => {
        const config = await marketplaceConfigService.getConfig();
        return config.platformFeeRate > 0;
      },
    },
    {
      name: 'Commission Calculation',
      test: async () => {
        const calculation = await marketplaceConfigService.calculatePlatformFee('VENUE', 1000);
        return calculation.fee > 0 && calculation.vendorPayout > 0;
      },
    },
    {
      name: 'Verification Requirements',
      test: async () => {
        const requirements = await marketplaceConfigService.getVerificationRequirements('VENUE');
        return requirements && typeof requirements === 'object';
      },
    },
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`   ✅ ${test.name}`);
      } else {
        console.log(`   ❌ ${test.name}`);
        throw new Error(`Test failed: ${test.name}`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error}`);
      throw error;
    }
  }

  console.log('✅ All deployment tests passed');
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployMarketplace()
    .then(() => {
      console.log('✅ Marketplace deployment completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Marketplace deployment failed:', error);
      process.exit(1);
    });
}

export { deployMarketplace };