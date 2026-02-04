/**
 * useFeatureFlag - React hook for feature flag access
 */
import { useState, useEffect, useCallback } from 'react';
import { featureFlags, FEATURE_FLAGS } from '@/lib/featureFlags';
import { useAuth } from '@/hooks/useAuth';

type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function useFeatureFlag(flagKey: FeatureFlagKey): boolean {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(() => featureFlags.isEnabled(flagKey));

  useEffect(() => {
    // Re-initialize when user changes
    featureFlags.init(user?.id || null, []);
    setIsEnabled(featureFlags.isEnabled(flagKey));
  }, [user?.id, flagKey]);

  return isEnabled;
}

export function useFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState(() => featureFlags.getAllFlags());

  useEffect(() => {
    featureFlags.init(user?.id || null, []);
    setFlags(featureFlags.getAllFlags());
  }, [user?.id]);

  const setOverride = useCallback((flagKey: FeatureFlagKey, value: boolean) => {
    featureFlags.setOverride(flagKey, value);
    setFlags(featureFlags.getAllFlags());
  }, []);

  const clearOverride = useCallback((flagKey: FeatureFlagKey) => {
    featureFlags.clearOverride(flagKey);
    setFlags(featureFlags.getAllFlags());
  }, []);

  const clearAllOverrides = useCallback(() => {
    featureFlags.clearAllOverrides();
    setFlags(featureFlags.getAllFlags());
  }, []);

  return {
    flags,
    isEnabled: (key: FeatureFlagKey) => flags[key]?.enabled ?? false,
    setOverride,
    clearOverride,
    clearAllOverrides,
  };
}

/**
 * Feature flag wrapper component
 */
interface FeatureProps {
  flag: FeatureFlagKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Feature({ flag, children, fallback = null }: FeatureProps): React.ReactNode {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? children : fallback;
}
