import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { logging } from '@/lib/logging';

// ============================================================================
// PRODUCTION INITIALIZATION
// ============================================================================

// Initialize Sentry for production error tracking
// DSN should be set via VITE_SENTRY_DSN environment variable
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.MODE === 'production';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `thittam1hub@${APP_VERSION}`,
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: IS_PRODUCTION,
        blockAllMedia: IS_PRODUCTION,
      }),
    ],
    
    // Sampling rates - lower in production for cost control
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0, // Capture 100% of error sessions
    
    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Ignore network errors that are expected
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          return null;
        }
        if (error.message.includes('ResizeObserver loop')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        app: 'thittam1hub',
        platform: 'web',
      },
    },
  });
  
  console.info('[Sentry] Error tracking initialized for', import.meta.env.MODE);
} else if (IS_PRODUCTION) {
  console.warn('[Sentry] DSN not configured - error tracking disabled');
}

// Initialize internal logging system
logging.init();

// ============================================================================
// APPLICATION BOOTSTRAP
// ============================================================================

try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found - ensure index.html has a #root element');
  }

  const root = createRoot(rootElement);
  
  // Wrap App with Sentry error boundary in production
  if (SENTRY_DSN) {
    root.render(
      <Sentry.ErrorBoundary
        fallback={({ error, resetError }) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return (
            <div className="min-h-screen flex items-center justify-center bg-background p-8">
              <div className="max-w-md text-center space-y-4">
                <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
                <p className="text-muted-foreground">
                  We've been notified of this error and are working to fix it.
                </p>
                <pre className="text-xs text-left bg-muted p-4 rounded overflow-auto max-h-32">
                  {errorMessage}
                </pre>
                <button
                  onClick={resetError}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          );
        }}
        onError={(error) => {
          console.error('[App] Critical error:', error);
        }}
      >
        <App />
      </Sentry.ErrorBoundary>
    );
  } else {
    root.render(<App />);
  }
  
} catch (startupError) {
  // Critical startup error - log to Sentry if available
  if (SENTRY_DSN) {
    Sentry.captureException(startupError, {
      tags: { phase: 'startup' },
    });
  }
  
  console.error('[App] Startup failed:', startupError);
  
  // Show fallback UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; font-family: system-ui, sans-serif;">
        <div style="max-width: 400px; text-align: center;">
          <h1 style="color: #ef4444; font-size: 1.5rem; margin-bottom: 1rem;">Application Error</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">
            Failed to start the application. Please refresh the page.
          </p>
          <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}