/**
 * Feature Flags System
 * Enables gradual rollout of new features with user/group targeting
 */

export type FeatureFlagValue = boolean | string | number;

export interface FeatureFlag {
  key: string;
  defaultValue: FeatureFlagValue;
  description?: string;
  rolloutPercentage?: number; // 0-100
  enabledForUsers?: string[];
  enabledForGroups?: string[];
}

// Internal type for flags that may not have all optional properties
type DefinedFlag = {
  readonly key: string;
  readonly defaultValue: FeatureFlagValue;
  readonly description?: string;
  readonly rolloutPercentage?: number;
  readonly enabledForUsers?: readonly string[];
  readonly enabledForGroups?: readonly string[];
};

// Define all feature flags here
export const FEATURE_FLAGS = {
  // UI Features
  NEW_DASHBOARD_LAYOUT: {
    key: 'new_dashboard_layout',
    defaultValue: false,
    description: 'Enable new dashboard layout with improved widgets',
    rolloutPercentage: 0,
  },
  DARK_MODE_V2: {
    key: 'dark_mode_v2',
    defaultValue: false,
    description: 'Enhanced dark mode with better contrast',
    rolloutPercentage: 100,
  },
  
  // Functionality Features
  AI_TASK_SUGGESTIONS: {
    key: 'ai_task_suggestions',
    defaultValue: false,
    description: 'AI-powered task priority suggestions',
    rolloutPercentage: 0,
  },
  OFFLINE_MODE: {
    key: 'offline_mode',
    defaultValue: true,
    description: 'Enable offline task management',
    rolloutPercentage: 100,
  },
  REALTIME_COLLABORATION: {
    key: 'realtime_collaboration',
    defaultValue: true,
    description: 'Real-time presence and collaboration',
    rolloutPercentage: 100,
  },
  ADVANCED_ANALYTICS: {
    key: 'advanced_analytics',
    defaultValue: false,
    description: 'Advanced analytics dashboard',
    rolloutPercentage: 50,
  },
  
  // Experimental
  VOICE_COMMANDS: {
    key: 'voice_commands',
    defaultValue: false,
    description: 'Voice command support for task management',
    rolloutPercentage: 0,
  },
  BULK_IMPORT: {
    key: 'bulk_import',
    defaultValue: true,
    description: 'Bulk import from CSV/Excel',
    rolloutPercentage: 100,
  },
} as const;

type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

class FeatureFlagService {
  private overrides: Map<string, FeatureFlagValue> = new Map();
  private userId: string | null = null;
  private userGroups: string[] = [];

  /**
   * Initialize with user context
   */
  init(userId: string | null, groups: string[] = []) {
    this.userId = userId;
    this.userGroups = groups;
    
    // Load local overrides from localStorage (for development)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('feature_flag_overrides');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          Object.entries(parsed).forEach(([key, value]) => {
            this.overrides.set(key, value as FeatureFlagValue);
          });
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagKey: FeatureFlagKey): boolean {
    const flag = FEATURE_FLAGS[flagKey];
    const key = flag.key;
    
    // Check for local override first
    if (this.overrides.has(key)) {
      return Boolean(this.overrides.get(key));
    }
    
    // Cast flag to access optional properties
    const flagConfig = flag as DefinedFlag;
    
    // Check if user is specifically enabled
    if (flagConfig.enabledForUsers?.includes(this.userId || '')) {
      return true;
    }
    
    // Check if user's group is enabled
    if (flagConfig.enabledForGroups?.some((g: string) => this.userGroups.includes(g))) {
      return true;
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && this.userId) {
      const hash = this.hashString(`${key}:${this.userId}`);
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }
    
    return Boolean(flag.defaultValue);
  }

  /**
   * Get a feature flag value (for non-boolean flags)
   */
  getValue<T extends FeatureFlagValue>(flagKey: FeatureFlagKey): T {
    const flag = FEATURE_FLAGS[flagKey];
    const key = flag.key;
    
    if (this.overrides.has(key)) {
      return this.overrides.get(key) as T;
    }
    
    return flag.defaultValue as T;
  }

  /**
   * Set a local override (for development/testing)
   */
  setOverride(flagKey: FeatureFlagKey, value: FeatureFlagValue) {
    const key = FEATURE_FLAGS[flagKey].key;
    this.overrides.set(key, value);
    this.persistOverrides();
  }

  /**
   * Clear a local override
   */
  clearOverride(flagKey: FeatureFlagKey) {
    const key = FEATURE_FLAGS[flagKey].key;
    this.overrides.delete(key);
    this.persistOverrides();
  }

  /**
   * Clear all overrides
   */
  clearAllOverrides() {
    this.overrides.clear();
    this.persistOverrides();
  }

  /**
   * Get all flags with their current values
   */
  getAllFlags(): Record<string, { enabled: boolean; description?: string }> {
    return Object.fromEntries(
      Object.entries(FEATURE_FLAGS).map(([key, flag]) => [
        key,
        {
          enabled: this.isEnabled(key as FeatureFlagKey),
          description: flag.description,
        },
      ])
    );
  }

  private persistOverrides() {
    if (typeof window !== 'undefined') {
      const obj = Object.fromEntries(this.overrides);
      localStorage.setItem('feature_flag_overrides', JSON.stringify(obj));
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlagService();
