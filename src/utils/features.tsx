/**
 * Feature flags utility for frontend
 * Checks which features are enabled on the backend
 */

import React from 'react';

export interface FeatureFlags {
  PAYMENT_PROCESSING?: boolean;
  ESCROW_MANAGEMENT?: boolean;
  AUTOMATED_PAYOUTS?: boolean;
  COMMISSION_COLLECTION?: boolean;
  MOBILE_APPS?: boolean;
  ADVANCED_ANALYTICS?: boolean;
  MULTI_CURRENCY?: boolean;
}

let cachedFeatures: FeatureFlags | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch enabled features from backend
 */
export async function fetchEnabledFeatures(): Promise<FeatureFlags> {
  const now = Date.now();

  // Return cached features if still valid
  if (cachedFeatures && (now - lastFetch) < CACHE_DURATION) {
    return cachedFeatures as FeatureFlags;
  }

  try {
    const response = await fetch('/api/features');
    const data = await response.json();

    if (data.success) {
      cachedFeatures = data.data.features || {};
      lastFetch = now;
      return cachedFeatures || getDefaultFeatures();
    }
  } catch {
    // Feature flags fetch failed - use defaults
  }

  // Return empty object if fetch fails
  return {};
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  const features = await fetchEnabledFeatures();
  return features[feature] === true;
}

/**
 * Get all enabled features
 */
export async function getEnabledFeatures(): Promise<FeatureFlags> {
  return await fetchEnabledFeatures();
}

/**
 * React hook for feature flags (if using React)
 */
export function useFeatures() {
  const [features, setFeatures] = React.useState<FeatureFlags>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchEnabledFeatures()
      .then(setFeatures)
      .finally(() => setLoading(false));
  }, []);

  return { features, loading, isEnabled: (feature: keyof FeatureFlags) => features[feature] === true };
}

/**
 * Feature flag component for conditional rendering
 */
interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { features, loading } = useFeatures();

  if (loading) {
    return null; // or loading spinner
  }

  return features[feature] ? <>{children}</> : <>{fallback}</>;
}

function getDefaultFeatures(): FeatureFlags {
  return {};
}

/**
 * Payment feature unavailable message component
 */
export function PaymentUnavailableMessage() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Payment Processing Coming Soon
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              Integrated payment processing is planned for future implementation.
              For now, please arrange payment directly with the vendor using your preferred method.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}