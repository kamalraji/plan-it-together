import * as Sentry from '@sentry/react';

// Centralized logging service for frontend errors and events.
// This is wired primarily to GlobalErrorBoundary and can be reused elsewhere.
//
// Sentry DSN is expected to be provided at runtime via a global variable
// `window.__SENTRY_DSN__` so secrets are not hardcoded in the bundle.
// If no DSN is configured, the logger gracefully degrades to console-only.

export interface LoggingUserContext {
  id: string;
  email?: string;
  role?: string;
}

export interface LoggingAuthContext {
  sessionExpiresAt?: string; // ISO timestamp
  provider?: string;
}

export interface LoggingExtraContext {
  [key: string]: unknown;
}

let initialized = false;
let lastUserContext: LoggingUserContext | null = null;
let lastAuthContext: LoggingAuthContext | null = null;

function getSentryDsn(): string | null {
  if (typeof window === 'undefined') return null;
  const dsn = (window as any).__SENTRY_DSN__ as string | undefined;
  return dsn && typeof dsn === 'string' && dsn.length > 0 ? dsn : null;
}

export function initLogging() {
  if (initialized) return;

  const dsn = getSentryDsn();
  if (!dsn) {
    // Sentry DSN not configured; falling back to console-only logging
    initialized = true;
    return;
  }

  Sentry.init({
    dsn,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE ?? 'development',
  });

  initialized = true;
}

export function setLoggingUserContext(user: LoggingUserContext | null, auth?: LoggingAuthContext | null) {
  lastUserContext = user;
  lastAuthContext = auth ?? null;

  if (!initialized || !user) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
  });

  if (auth) {
    Sentry.setContext('supabase_auth', {
      session_expires_at: auth.sessionExpiresAt,
      provider: auth.provider,
    });
  }
}

export function captureError(error: unknown, extra?: LoggingExtraContext) {
  if (!initialized) {
    // Error captured but Sentry is disabled - silently ignore
    return;
  }

  Sentry.withScope((scope) => {
    if (lastUserContext) {
      scope.setUser({
        id: lastUserContext.id,
        email: lastUserContext.email,
        username: lastUserContext.email,
      });
    }

    if (lastAuthContext) {
      scope.setContext('supabase_auth', {
        session_expires_at: lastAuthContext.sessionExpiresAt,
        provider: lastAuthContext.provider,
      });
    }

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value as any);
      });
    }

    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}

export const logging = {
  init: initLogging,
  setUserContext: setLoggingUserContext,
  captureError,
};
