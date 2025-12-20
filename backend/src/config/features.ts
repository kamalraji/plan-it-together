/**
 * Feature flags configuration
 * Controls which features are enabled/disabled in the application
 */

export interface FeatureFlags {
  // Marketplace features
  PAYMENT_PROCESSING: boolean;
  ESCROW_MANAGEMENT: boolean;
  AUTOMATED_PAYOUTS: boolean;
  COMMISSION_COLLECTION: boolean;
  
  // Future features
  MOBILE_APPS: boolean;
  ADVANCED_ANALYTICS: boolean;
  MULTI_CURRENCY: boolean;
}

/**
 * Default feature flags - can be overridden by environment variables
 */
const defaultFeatures: FeatureFlags = {
  // Payment features - disabled by default (Future Implementation)
  PAYMENT_PROCESSING: false,
  ESCROW_MANAGEMENT: false,
  AUTOMATED_PAYOUTS: false,
  COMMISSION_COLLECTION: false,
  
  // Other features
  MOBILE_APPS: false,
  ADVANCED_ANALYTICS: true,
  MULTI_CURRENCY: false,
};

/**
 * Get feature flag value with environment variable override
 */
function getFeatureFlag(key: keyof FeatureFlags): boolean {
  const envKey = `FEATURE_${key}`;
  const envValue = process.env[envKey];
  
  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true';
  }
  
  return defaultFeatures[key];
}

/**
 * Current feature flags configuration
 */
export const features: FeatureFlags = {
  PAYMENT_PROCESSING: getFeatureFlag('PAYMENT_PROCESSING'),
  ESCROW_MANAGEMENT: getFeatureFlag('ESCROW_MANAGEMENT'),
  AUTOMATED_PAYOUTS: getFeatureFlag('AUTOMATED_PAYOUTS'),
  COMMISSION_COLLECTION: getFeatureFlag('COMMISSION_COLLECTION'),
  MOBILE_APPS: getFeatureFlag('MOBILE_APPS'),
  ADVANCED_ANALYTICS: getFeatureFlag('ADVANCED_ANALYTICS'),
  MULTI_CURRENCY: getFeatureFlag('MULTI_CURRENCY'),
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return features[feature];
}

/**
 * Middleware to check if a feature is enabled
 */
export function requireFeature(feature: keyof FeatureFlags) {
  return (req: any, res: any, next: any) => {
    if (!isFeatureEnabled(feature)) {
      return res.status(501).json({
        success: false,
        error: 'Feature not implemented',
        message: `${feature} is planned for future implementation`,
        code: 'FEATURE_NOT_AVAILABLE'
      });
    }
    next();
  };
}

/**
 * Get list of enabled features for client
 */
export function getEnabledFeatures(): Partial<FeatureFlags> {
  const enabled: Partial<FeatureFlags> = {};
  
  Object.entries(features).forEach(([key, value]) => {
    if (value) {
      enabled[key as keyof FeatureFlags] = true;
    }
  });
  
  return enabled;
}