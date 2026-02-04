import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { marketplaceConfigService } from '../../services/marketplace-config.service';

// Mock Prisma Client
jest.mock('@prisma/client');
const mockPrisma = {
  marketplaceConfig: {
    findFirst: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  vendorProfile: {
    findUnique: jest.fn(),
  },
};

// Mock the PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

describe('MarketplaceConfigService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (marketplaceConfigService as any).config = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return default configuration when no database config exists', async () => {
      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);

      const config = await marketplaceConfigService.getConfig();

      expect(config).toHaveProperty('platformFeeRate');
      expect(config).toHaveProperty('autoPayoutEnabled');
      expect(config).toHaveProperty('escrowEnabled');
      expect(config).toHaveProperty('verificationRequirements');
      expect(config).toHaveProperty('commissionStructure');
      expect(config.platformFeeRate).toBe(0.05); // Default 5%
    });

    it('should merge database config with defaults', async () => {
      const dbConfig = {
        id: 'default',
        config: {
          platformFeeRate: 0.03,
          autoPayoutEnabled: true,
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(dbConfig);

      const config = await marketplaceConfigService.getConfig();

      expect(config.platformFeeRate).toBe(0.03); // From database
      expect(config.autoPayoutEnabled).toBe(true); // From database
      expect(config).toHaveProperty('escrowEnabled'); // From defaults
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and save to database', async () => {
      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);
      mockPrisma.marketplaceConfig.upsert.mockResolvedValue({
        id: 'default',
        config: {},
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updates = {
        platformFeeRate: 0.04,
        autoPayoutEnabled: true,
      };

      const updatedConfig = await marketplaceConfigService.updateConfig(updates);

      expect(updatedConfig.platformFeeRate).toBe(0.04);
      expect(updatedConfig.autoPayoutEnabled).toBe(true);
      expect(mockPrisma.marketplaceConfig.upsert).toHaveBeenCalledWith({
        where: { id: 'default' },
        update: expect.objectContaining({
          config: expect.any(Object),
          updatedAt: expect.any(Date),
        }),
        create: expect.objectContaining({
          id: 'default',
          config: expect.any(Object),
          active: true,
        }),
      });
    });
  });

  describe('getCommissionRate', () => {
    beforeEach(() => {
      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);
    });

    it('should return base rate for category without tiered rates', async () => {
      const rate = await marketplaceConfigService.getCommissionRate('PHOTOGRAPHY', 1000);
      expect(rate).toBe(0.06); // Photography base rate
    });

    it('should return tiered rate for VENUE category', async () => {
      // Test different tiers
      const lowTierRate = await marketplaceConfigService.getCommissionRate('VENUE', 500);
      const midTierRate = await marketplaceConfigService.getCommissionRate('VENUE', 2000);
      const highTierRate = await marketplaceConfigService.getCommissionRate('VENUE', 15000);

      expect(lowTierRate).toBe(0.03); // Base rate for VENUE
      expect(midTierRate).toBe(0.025); // Mid tier rate
      expect(highTierRate).toBe(0.02); // High tier rate
    });

    it('should return default rate for unknown category', async () => {
      const rate = await marketplaceConfigService.getCommissionRate('UNKNOWN_CATEGORY', 1000);
      expect(rate).toBe(0.05); // Default platform fee rate
    });
  });

  describe('calculatePlatformFee', () => {
    beforeEach(() => {
      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);
    });

    it('should calculate fee correctly with base rate', async () => {
      const calculation = await marketplaceConfigService.calculatePlatformFee('PHOTOGRAPHY', 1000);

      expect(calculation.rate).toBe(0.06);
      expect(calculation.fee).toBe(60); // 6% of 1000
      expect(calculation.vendorPayout).toBe(940); // 1000 - 60
    });

    it('should apply minimum fee when calculated fee is too low', async () => {
      const calculation = await marketplaceConfigService.calculatePlatformFee('PHOTOGRAPHY', 100);

      expect(calculation.fee).toBe(15); // Minimum fee for photography
      expect(calculation.vendorPayout).toBe(85); // 100 - 15
    });

    it('should apply maximum fee when calculated fee is too high', async () => {
      const calculation = await marketplaceConfigService.calculatePlatformFee('PHOTOGRAPHY', 10000);

      expect(calculation.fee).toBe(300); // Maximum fee for photography
      expect(calculation.vendorPayout).toBe(9700); // 10000 - 300
    });

    it('should handle tiered rates for VENUE category', async () => {
      const calculation = await marketplaceConfigService.calculatePlatformFee('VENUE', 15000);

      expect(calculation.rate).toBe(0.02); // High tier rate
      expect(calculation.fee).toBe(300); // 2% of 15000
      expect(calculation.vendorPayout).toBe(14700); // 15000 - 300
    });
  });

  describe('getVerificationRequirements', () => {
    beforeEach(() => {
      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);
    });

    it('should return category-specific requirements', async () => {
      const venueRequirements = await marketplaceConfigService.getVerificationRequirements('VENUE');
      const photographyRequirements = await marketplaceConfigService.getVerificationRequirements('PHOTOGRAPHY');

      expect(venueRequirements.businessLicense).toBe(true);
      expect(venueRequirements.insuranceCertificate).toBe(true);
      expect(venueRequirements.backgroundCheck).toBe(true);

      expect(photographyRequirements.businessLicense).toBe(false);
      expect(photographyRequirements.insuranceCertificate).toBe(true);
      expect(photographyRequirements.minimumExperience).toBe(2);
    });

    it('should return default requirements for unknown category', async () => {
      const requirements = await marketplaceConfigService.getVerificationRequirements('UNKNOWN_CATEGORY');

      expect(requirements.businessLicense).toBe(true);
      expect(requirements.insuranceCertificate).toBe(false);
      expect(requirements.taxDocuments).toBe(true);
      expect(requirements.identityVerification).toBe(true);
      expect(requirements.portfolioRequired).toBe(true);
    });
  });

  describe('checkVerificationCompliance', () => {
    const mockVendor = {
      id: 'vendor-123',
      verificationDocuments: {
        businessLicense: 'license.pdf',
        insuranceCertificate: 'insurance.pdf',
        taxDocuments: 'tax.pdf',
        identityVerification: 'id.pdf',
      },
      portfolio: [{ id: '1', url: 'image1.jpg' }],
    };

    beforeEach(() => {
      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);
    });

    it('should return compliant when all requirements are met', async () => {
      mockPrisma.vendorProfile.findUnique.mockResolvedValue(mockVendor);

      const compliance = await marketplaceConfigService.checkVerificationCompliance('vendor-123', 'PHOTOGRAPHY');

      expect(compliance.compliant).toBe(true);
      expect(compliance.missingRequirements).toHaveLength(0);
    });

    it('should return non-compliant with missing requirements', async () => {
      const incompleteVendor = {
        ...mockVendor,
        verificationDocuments: {
          businessLicense: null,
          insuranceCertificate: 'insurance.pdf',
        },
        portfolio: [],
      };

      mockPrisma.vendorProfile.findUnique.mockResolvedValue(incompleteVendor);

      const compliance = await marketplaceConfigService.checkVerificationCompliance('vendor-123', 'VENUE');

      expect(compliance.compliant).toBe(false);
      expect(compliance.missingRequirements).toContain('Business License');
      expect(compliance.missingRequirements).toContain('Tax Documents');
      expect(compliance.missingRequirements).toContain('Identity Verification');
      expect(compliance.missingRequirements).toContain('Portfolio');
    });

    it('should throw error for non-existent vendor', async () => {
      mockPrisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        marketplaceConfigService.checkVerificationCompliance('non-existent', 'VENUE')
      ).rejects.toThrow('Vendor not found');
    });
  });

  describe('validatePaymentConfig', () => {
    it('should validate payment configuration with all required env vars', async () => {
      // Set up environment variables
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
      process.env.STRIPE_CONNECT_CLIENT_ID = 'ca_123';

      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);

      const validation = await marketplaceConfigService.validatePaymentConfig();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should return errors for missing required configuration', async () => {
      // Clear environment variables
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);

      const validation = await marketplaceConfigService.validatePaymentConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('STRIPE_SECRET_KEY is not configured');
    });

    it('should return warnings for missing optional configuration', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_CONNECT_CLIENT_ID;

      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);

      const validation = await marketplaceConfigService.validatePaymentConfig();

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('STRIPE_WEBHOOK_SECRET is not configured - webhook verification will be disabled');
      expect(validation.warnings).toContain('STRIPE_CONNECT_CLIENT_ID is not configured - vendor payouts will be limited');
    });

    it('should validate configuration values', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.PLATFORM_FEE_RATE = '1.5'; // Invalid rate > 1
      process.env.PAYOUT_DELAY_DAYS = '-1'; // Invalid negative value

      mockPrisma.marketplaceConfig.findFirst.mockResolvedValue(null);

      const validation = await marketplaceConfigService.validatePaymentConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Platform fee rate must be between 0 and 1');
      expect(validation.errors).toContain('Payout delay days must be non-negative');
    });
  });
});