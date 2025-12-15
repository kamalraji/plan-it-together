import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance with enhanced configuration
export const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility function for exponential backoff delay
const getRetryDelay = (attempt: number): number => {
  return RETRY_DELAY * Math.pow(2, attempt - 1);
};

// Utility function to check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;
  // Retry on server errors (5xx) and rate limiting (429)
  return status >= 500 || status === 429;
};

// Request interceptor for adding auth token and request logging
api.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic and enhanced error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { 
      _retry?: boolean; 
      _retryCount?: number; 
    };

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.response?.status} ${originalRequest?.url}`, {
        error: error.message,
        response: error.response?.data,
      });
    }

    // Handle 401 errors (token expired) - Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Dispatch custom event for auth failure
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { reason: 'token_refresh_failed' } 
        }));
        
        return Promise.reject(refreshError);
      }
    }

    // Retry logic for retryable errors
    if (isRetryableError(error) && originalRequest) {
      const retryCount = originalRequest._retryCount || 0;
      
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        originalRequest._retryCount = retryCount + 1;
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, getRetryDelay(originalRequest._retryCount!))
        );
        
        console.log(`[API Retry] Attempt ${originalRequest._retryCount} for ${originalRequest.url}`);
        return api(originalRequest);
      }
    }

    // Enhanced error object with additional context
    const enhancedError = {
      ...error,
      isNetworkError: !error.response,
      isServerError: error.response?.status ? error.response.status >= 500 : false,
      isClientError: error.response?.status ? error.response.status >= 400 && error.response.status < 500 : false,
      requestId: originalRequest?.headers?.['X-Request-ID'],
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(enhancedError);
  }
);

// API health check function
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
};

// Utility function to handle API errors consistently
export const handleApiError = (error: any): string => {
  if (error.isNetworkError) {
    return 'Network error. Please check your internet connection.';
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.status === 429) {
    return 'Too many requests. Please try again later.';
  }
  
  if (error.isServerError) {
    return 'Server error. Please try again later.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

// Export types for better TypeScript support
export interface ApiError extends AxiosError {
  isNetworkError: boolean;
  isServerError: boolean;
  isClientError: boolean;
  requestId?: string;
  timestamp: string;
}

export default api;
