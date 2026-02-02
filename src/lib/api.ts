import axios, { AxiosError, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 5000; // 5 seconds for faster failure detection

// Create axios instance with enhanced configuration
export const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding request metadata (minimal logging)
api.interceptors.request.use(
  (config) => {
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with minimal logging and fast error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // On 401, dispatch auth logout event
    if (error.response?.status === 401) {
      window.dispatchEvent(
        new CustomEvent('auth:logout', {
          detail: { reason: 'unauthorized' },
        }),
      );
    }

    // Enhanced error object with additional context
    const enhancedError = {
      ...error,
      isNetworkError: !error.response,
      isServerError: error.response?.status ? error.response.status >= 500 : false,
      isClientError: error.response?.status ? error.response.status >= 400 && error.response.status < 500 : false,
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
