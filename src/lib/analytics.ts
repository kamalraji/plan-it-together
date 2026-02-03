/**
 * Analytics/Telemetry System
 * Track user flows and identify UX bottlenecks
 */

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
};

export type UserProperties = {
  userId?: string;
  email?: string;
  plan?: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
};

interface AnalyticsProvider {
  track: (event: AnalyticsEvent) => void;
  identify: (userId: string, properties?: UserProperties) => void;
  page: (name: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
}

// Console provider for development
const consoleProvider: AnalyticsProvider = {
  track: (event) => {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Track:', event.name, event.properties);
    }
  },
  identify: (userId, properties) => {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Identify:', userId, properties);
    }
  },
  page: (name, properties) => {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Page:', name, properties);
    }
  },
  reset: () => {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Reset');
    }
  },
};

class Analytics {
  private providers: AnalyticsProvider[] = [consoleProvider];
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;
  private _userId: string | null = null;

  get userId(): string | null {
    return this._userId;
  }

  /**
   * Initialize analytics with user context
   */
  init(userId?: string, properties?: UserProperties) {
    this.isInitialized = true;
    
    if (userId) {
      this._userId = userId;
      this.providers.forEach(p => p.identify(userId, properties));
    }

    // Flush queued events
    this.queue.forEach(event => this.track(event.name, event.properties));
    this.queue = [];
  }

  /**
   * Track a custom event
   */
  track(name: string, properties?: Record<string, string | number | boolean | null>) {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : null;
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: currentUrl,
      },
      timestamp: Date.now(),
    };

    if (!this.isInitialized) {
      this.queue.push(event);
      return;
    }

    this.providers.forEach(p => p.track(event));
  }

  /**
   * Track a page view
   */
  page(name: string, properties?: Record<string, unknown>) {
    this.providers.forEach(p => p.page(name, properties));
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: UserProperties) {
    this._userId = userId;
    this.providers.forEach(p => p.identify(userId, properties));
  }

  /**
   * Reset (on logout)
   */
  reset() {
    this._userId = null;
    this.providers.forEach(p => p.reset());
  }

  /**
   * Add a custom provider
   */
  addProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
  }

  // Common event helpers
  trackTaskCreated(taskId: string, workspaceId: string) {
    this.track('task_created', { taskId, workspaceId });
  }

  trackTaskCompleted(taskId: string, timeToComplete?: number) {
    this.track('task_completed', { taskId, timeToComplete: timeToComplete ?? null });
  }

  trackTaskAssigned(taskId: string, assigneeId: string) {
    this.track('task_assigned', { taskId, assigneeId });
  }

  trackWorkspaceCreated(workspaceId: string, type: string) {
    this.track('workspace_created', { workspaceId, type });
  }

  trackFeatureUsed(featureName: string, context?: string) {
    this.track('feature_used', { featureName, context: context ?? null });
  }

  trackError(errorType: string, errorMessage: string, context?: string) {
    this.track('error_occurred', { errorType, errorMessage, context: context ?? null });
  }

  trackSearch(query: string, resultsCount: number) {
    this.track('search_performed', { query, resultsCount });
  }

  trackNavigation(from: string, to: string) {
    this.track('navigation', { from, to });
  }

  trackButtonClick(buttonName: string, context?: string) {
    this.track('button_click', { buttonName, context: context ?? null });
  }

  trackFormSubmit(formName: string, success: boolean) {
    this.track('form_submit', { formName, success });
  }

  trackTimingEvent(eventName: string, durationMs: number) {
    this.track('timing', { eventName, durationMs });
  }
}

export const analytics = new Analytics();
