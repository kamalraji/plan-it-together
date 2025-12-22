// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000'),
} as const;

// Environment configuration
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: import.meta.env.VITE_API_URL,
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  enableRetry: import.meta.env.VITE_ENABLE_API_RETRY !== 'false',
  enableLogging: import.meta.env.VITE_ENABLE_API_LOGGING !== 'false',
  enableHealthCheck: import.meta.env.VITE_ENABLE_HEALTH_CHECK !== 'false',
} as const;

// Validation function for required environment variables
export const validateEnvironment = (): void => {
  // VITE_API_URL is optional since we have a default value
  // No required environment variables for now
  console.log('Environment validated successfully');
};