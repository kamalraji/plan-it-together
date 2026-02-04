import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MarketplaceConfig {
  platformFeeRate: number;
  autoPayoutEnabled: boolean;
  payoutDelayDays: number;
  escrowEnabled: boolean;
  minimumPayoutAmount: number;
  supportedCurrencies: string[];
  defaultCurrency: string;
  paymentTimeoutMinutes: number;
  verificationRequirements: VerificationRequirements;
  commissionStructure: CommissionStructure;
}

export interface VerificationRequirements {
  [category: string]: {
    businessLicense: boolean;
    insuranceCertificate: boolean;
    taxDocuments: boolean;
    identityVerification: boolean;
    portfolioRequired: boolean;
    minimumExperience?: number; // in years
    backgroundCheck?: boolean;
  };
}

export interface CommissionStructure {
  [category: string]: {
    baseRate: number;
    tieredRates?: {
      threshold: number;
      rate: number;
    }[];
    minimumFee?: number;
    maximumFee?: number;
  };
}

export class MarketplaceConfigService {
  private static instance: MarketplaceConfigService;
  private config: MarketplaceConfig | null = null;

  private constructor() {}

  public static getInstance(): MarketplaceConfigService {
    if (!MarketplaceConfigService.instance) {
      MarketplaceConfigService.instance = new MarketplaceConfigService();
    }
    return MarketplaceConfigService.instance;
  }

  /**
   * Get marketplace configuration
   */
  async getConfig(): Promise<MarketplaceConfig> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config!;
  }

  /**
   * Load configuration from environment and database
   */
  private async loadConfig(): Promise<void> {
    // Load base configuration from environment variables
    const baseConfig: MarketplaceConfig = {
      platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE || '0.05'),
      autoPayoutEnabled: process.env.AUTO_PAYOUT_ENABLED === 'true',
      payoutDelayDays: parseInt(process.env.PAYOUT_DELAY_DAYS || '7'),
      escrowEnabled: process.env.ESCROW_ENABLED === 'true',
      minimumPayoutAmount: parseFloat(process.env.MINIMUM_PAYOUT_AMOUNT || '50'),
      supportedCurrencies: (process.env.SUPPORTED_CURRENCIES || 'USD,EUR,GBP,CAD').split(','),
      defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
      paymentTimeoutMinutes: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '30'),
      verificationRequirements: this.getDefaultVerificationRequirements(),
      commissionStructure: this.getDefaultCommissionStructure(),
    };

    // Try to load custom configuration from database
    try {
      const dbConfig = await prisma.marketplaceConfig.findFirst({
        where: { active: true },
      });

      if (dbConfig) {
        // Merge database config with base config
        this.config = {
          ...baseConfig,
          ...dbConfig.config as any,
        };
      } else {
        this.config = baseConfig;
      }
    } catch (error) {
      console.warn('Failed to load marketplace config from database, using defaults:', error);
      this.config = baseConfig;
    }
  }

  /**
   * Update marketplace configuration
   */
  async updateConfig(updates: Partial<MarketplaceConfig>): Promise<MarketplaceConfig> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates };

    try {
      // Save to database
      await prisma.marketplaceConfig.upsert({
        where: { id: 'default' },
        update: {
          config: newConfig as any,
          updatedAt: new Date(),
        },
        create: {
          id: 'default',
          config: newConfig as any,
          active: true,
        },
      });

      this.config = newConfig;
      return newConfig;
    } catch (error) {
      console.error('Failed to update marketplace config:', error);
      throw new Error('Failed to update marketplace configuration');
    }
  }

  /**
   * Get commission rate for a service category
   */
  async getCommissionRate(category: string, amount: number): Promise<number> {
    const config = await this.getConfig();
    const categoryConfig = config.commissionStructure[category] || config.commissionStructure['DEFAULT'];

    if (!categoryConfig) {
      return config.platformFeeRate;
    }

    // Check for tiered rates
    if (categoryConfig.tieredRates) {
      for (const tier of categoryConfig.tieredRates.sort((a, b) => b.threshold - a.threshold)) {
        if (amount >= tier.threshold) {
          return tier.rate;
        }
      }
    }

    return categoryConfig.baseRate;
  }

  /**
   * Calculate platform fee for a transaction
   */
  async calculatePlatformFee(category: string, amount: number): Promise<{
    rate: number;
    fee: number;
    vendorPayout: number;
  }> {
    const config = await this.getConfig();
    const rate = await this.getCommissionRate(category, amount);
    let fee = amount * rate;

    // Apply minimum and maximum fee limits if configured
    const categoryConfig = config.commissionStructure[category] || config.commissionStructure['DEFAULT'];
    if (categoryConfig) {
      if (categoryConfig.minimumFee && fee < categoryConfig.minimumFee) {
        fee = categoryConfig.minimumFee;
      }
      if (categoryConfig.maximumFee && fee > categoryConfig.maximumFee) {
        fee = categoryConfig.maximumFee;
      }
    }

    return {
      rate,
      fee,
      vendorPayout: amount - fee,
    };
  }

  /**
   * Get verification requirements for a service category
   */
  async getVerificationRequirements(category: string): Promise<any> {
    const config = await this.getConfig();
    return config.verificationRequirements[category] || config.verificationRequirements['DEFAULT'];
  }

  /**
   * Check if vendor meets verification requirements for category
   */
  async checkVerificationCompliance(vendorId: string, category: string): Promise<{
    compliant: boolean;
    missingRequirements: string[];
  }> {
    const requirements = await this.getVerificationRequirements(category);
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const verificationDocs = vendor.verificationDocuments as any || {};
    const missingRequirements: string[] = [];

    if (requirements.businessLicense && !verificationDocs.businessLicense) {
      missingRequirements.push('Business License');
    }
    if (requirements.insuranceCertificate && !verificationDocs.insuranceCertificate) {
      missingRequirements.push('Insurance Certificate');
    }
    if (requirements.taxDocuments && !verificationDocs.taxDocuments) {
      missingRequirements.push('Tax Documents');
    }
    if (requirements.identityVerification && !verificationDocs.identityVerification) {
      missingRequirements.push('Identity Verification');
    }
    if (requirements.portfolioRequired && (!vendor.portfolio || vendor.portfolio.length === 0)) {
      missingRequirements.push('Portfolio');
    }

    return {
      compliant: missingRequirements.length === 0,
      missingRequirements,
    };
  }

  /**
   * Get default verification requirements by category
   */
  private getDefaultVerificationRequirements(): VerificationRequirements {
    return {
      DEFAULT: {
        businessLicense: true,
        insuranceCertificate: false,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
      },
      VENUE: {
        businessLicense: true,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
        backgroundCheck: true,
      },
      CATERING: {
        businessLicense: true,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
        backgroundCheck: true,
      },
      PHOTOGRAPHY: {
        businessLicense: false,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
        minimumExperience: 2,
      },
      VIDEOGRAPHY: {
        businessLicense: false,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
        minimumExperience: 2,
      },
      ENTERTAINMENT: {
        businessLicense: false,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
        backgroundCheck: true,
      },
      DECORATION: {
        businessLicense: true,
        insuranceCertificate: false,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
      },
      AUDIO_VISUAL: {
        businessLicense: true,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: true,
      },
      TRANSPORTATION: {
        businessLicense: true,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: false,
        backgroundCheck: true,
      },
      SECURITY: {
        businessLicense: true,
        insuranceCertificate: true,
        taxDocuments: true,
        identityVerification: true,
        portfolioRequired: false,
        backgroundCheck: true,
      },
    };
  }

  /**
   * Get default commission structure by category
   */
  private getDefaultCommissionStructure(): CommissionStructure {
    return {
      DEFAULT: {
        baseRate: 0.05, // 5%
        minimumFee: 5,
        maximumFee: 500,
      },
      VENUE: {
        baseRate: 0.03, // 3% for high-value venue bookings
        tieredRates: [
          { threshold: 10000, rate: 0.02 }, // 2% for bookings over $10k
          { threshold: 5000, rate: 0.025 }, // 2.5% for bookings over $5k
          { threshold: 1000, rate: 0.03 }, // 3% for bookings over $1k
        ],
        minimumFee: 50,
        maximumFee: 1000,
      },
      CATERING: {
        baseRate: 0.04, // 4%
        tieredRates: [
          { threshold: 5000, rate: 0.03 }, // 3% for large catering orders
          { threshold: 2000, rate: 0.035 }, // 3.5% for medium orders
        ],
        minimumFee: 25,
        maximumFee: 750,
      },
      PHOTOGRAPHY: {
        baseRate: 0.06, // 6%
        minimumFee: 15,
        maximumFee: 300,
      },
      VIDEOGRAPHY: {
        baseRate: 0.06, // 6%
        minimumFee: 20,
        maximumFee: 400,
      },
      ENTERTAINMENT: {
        baseRate: 0.07, // 7%
        minimumFee: 25,
        maximumFee: 500,
      },
      DECORATION: {
        baseRate: 0.05, // 5%
        minimumFee: 10,
        maximumFee: 200,
      },
      AUDIO_VISUAL: {
        baseRate: 0.04, // 4%
        minimumFee: 20,
        maximumFee: 300,
      },
      TRANSPORTATION: {
        baseRate: 0.08, // 8%
        minimumFee: 10,
        maximumFee: 150,
      },
      SECURITY: {
        baseRate: 0.06, // 6%
        minimumFee: 15,
        maximumFee: 200,
      },
      CLEANING: {
        baseRate: 0.07, // 7%
        minimumFee: 8,
        maximumFee: 100,
      },
      EQUIPMENT_RENTAL: {
        baseRate: 0.05, // 5%
        minimumFee: 10,
        maximumFee: 250,
      },
      PRINTING: {
        baseRate: 0.08, // 8%
        minimumFee: 5,
        maximumFee: 100,
      },
      MARKETING: {
        baseRate: 0.10, // 10%
        minimumFee: 25,
        maximumFee: 500,
      },
    };
  }

  /**
   * Validate payment configuration
   */
  async validatePaymentConfig(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY is not configured');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      warnings.push('STRIPE_WEBHOOK_SECRET is not configured - webhook verification will be disabled');
    }
    if (!process.env.STRIPE_CONNECT_CLIENT_ID) {
      warnings.push('STRIPE_CONNECT_CLIENT_ID is not configured - vendor payouts will be limited');
    }

    // Check PayPal configuration (optional)
    if (process.env.PAYPAL_CLIENT_ID && !process.env.PAYPAL_CLIENT_SECRET) {
      errors.push('PAYPAL_CLIENT_SECRET is required when PAYPAL_CLIENT_ID is set');
    }

    // Validate configuration values
    const config = await this.getConfig();
    if (config.platformFeeRate < 0 || config.platformFeeRate > 1) {
      errors.push('Platform fee rate must be between 0 and 1');
    }
    if (config.payoutDelayDays < 0) {
      errors.push('Payout delay days must be non-negative');
    }
    if (config.minimumPayoutAmount < 0) {
      errors.push('Minimum payout amount must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const marketplaceConfigService = MarketplaceConfigService.getInstance();