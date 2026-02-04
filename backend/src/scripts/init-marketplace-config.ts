#!/usr/bin/env ts-node

/**
 * Initialize marketplace configuration with default settings
 * This script should be run during deployment to set up initial marketplace configuration
 */

import { PrismaClient } from '@prisma/client';
import { marketplaceConfigService } from '../services/marketplace-config.service';

const prisma = new PrismaClient();

async function initializeMarketplaceConfig() {
  try {
    console.log('🚀 Initializing marketplace configuration...');

    // Check if configuration already exists
    const existingConfig = await prisma.marketplaceConfig.findFirst({
      where: { active: true },
    });

    if (existingConfig) {
      console.log('✅ Marketplace configuration already exists');
      
      // Validate existing configuration
      const validation = await marketplaceConfigService.validatePaymentConfig();
      
      if (validation.valid) {
        console.log('✅ Existing configuration is valid');
      } else {
        console.log('⚠️  Configuration validation warnings:');
        validation.warnings.forEach(warning => console.log(`   - ${warning}`));
        
        if (validation.errors.length > 0) {
          console.log('❌ Configuration validation errors:');
          validation.errors.forEach(error => console.log(`   - ${error}`));
        }
      }
      
      return;
    }

    // Create default configuration
    const defaultConfig = await marketplaceConfigService.getConfig();
    
    console.log('📝 Creating default marketplace configuration...');
    console.log(`   - Platform fee rate: ${(defaultConfig.platformFeeRate * 100).toFixed(1)}%`);
    console.log(`   - Auto payout enabled: ${defaultConfig.autoPayoutEnabled}`);
    console.log(`   - Payout delay: ${defaultConfig.payoutDelayDays} days`);
    console.log(`   - Escrow enabled: ${defaultConfig.escrowEnabled}`);
    console.log(`   - Minimum payout: $${defaultConfig.minimumPayoutAmount}`);
    console.log(`   - Supported currencies: ${defaultConfig.supportedCurrencies.join(', ')}`);

    // Save configuration to database
    await prisma.marketplaceConfig.create({
      data: {
        id: 'default',
        config: defaultConfig as any,
        active: true,
      },
    });

    console.log('✅ Default marketplace configuration created successfully');

    // Validate payment gateway configuration
    const validation = await marketplaceConfigService.validatePaymentConfig();
    
    if (validation.valid) {
      console.log('✅ Payment gateway configuration is valid');
    } else {
      console.log('⚠️  Payment gateway configuration issues:');
      
      if (validation.warnings.length > 0) {
        console.log('   Warnings:');
        validation.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      if (validation.errors.length > 0) {
        console.log('   Errors:');
        validation.errors.forEach(error => console.log(`   - ${error}`));
        console.log('❌ Please fix configuration errors before enabling payments');
      }
    }

    // Display commission structure summary
    console.log('\n📊 Commission Structure Summary:');
    const categories = ['VENUE', 'CATERING', 'PHOTOGRAPHY', 'ENTERTAINMENT', 'DEFAULT'];
    
    for (const category of categories) {
      const rate = await marketplaceConfigService.getCommissionRate(category, 1000);
      console.log(`   - ${category}: ${(rate * 100).toFixed(1)}%`);
    }

    // Display verification requirements summary
    console.log('\n🔒 Verification Requirements Summary:');
    const verificationCategories = ['VENUE', 'CATERING', 'PHOTOGRAPHY', 'TRANSPORTATION'];
    
    for (const category of verificationCategories) {
      const requirements = await marketplaceConfigService.getVerificationRequirements(category);
      const requiredDocs = [];
      
      if (requirements.businessLicense) requiredDocs.push('Business License');
      if (requirements.insuranceCertificate) requiredDocs.push('Insurance');
      if (requirements.taxDocuments) requiredDocs.push('Tax Docs');
      if (requirements.identityVerification) requiredDocs.push('ID Verification');
      if (requirements.portfolioRequired) requiredDocs.push('Portfolio');
      if (requirements.backgroundCheck) requiredDocs.push('Background Check');
      
      console.log(`   - ${category}: ${requiredDocs.join(', ')}`);
    }

    console.log('\n🎉 Marketplace configuration initialization completed!');
    
  } catch (error) {
    console.error('❌ Failed to initialize marketplace configuration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeMarketplaceConfig()
    .then(() => {
      console.log('✅ Marketplace configuration initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Marketplace configuration initialization failed:', error);
      process.exit(1);
    });
}

export { initializeMarketplaceConfig };