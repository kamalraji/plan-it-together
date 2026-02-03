/**
 * Rate Limiting Hook
 * Provides client-side rate limiting and debouncing for API calls
 */
import { useRef, useCallback } from 'react';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface ThrottleOptions {
  waitMs: number;
}

export function useRateLimit({ maxRequests, windowMs }: RateLimitOptions) {
  const requestTimestamps = useRef<number[]>([]);

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    // Remove timestamps outside the window
    requestTimestamps.current = requestTimestamps.current.filter(
      ts => now - ts < windowMs
    );
    return requestTimestamps.current.length >= maxRequests;
  }, [maxRequests, windowMs]);

  const recordRequest = useCallback(() => {
    requestTimestamps.current.push(Date.now());
  }, []);

  const executeIfAllowed = useCallback(<T,>(fn: () => T): T | null => {
    if (isRateLimited()) {
      console.warn('Rate limit exceeded');
      return null;
    }
    recordRequest();
    return fn();
  }, [isRateLimited, recordRequest]);

  const executeAsyncIfAllowed = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    if (isRateLimited()) {
      console.warn('Rate limit exceeded');
      return null;
    }
    recordRequest();
    return fn();
  }, [isRateLimited, recordRequest]);

  const getRemainingRequests = useCallback(() => {
    const now = Date.now();
    const validTimestamps = requestTimestamps.current.filter(
      ts => now - ts < windowMs
    );
    return Math.max(0, maxRequests - validTimestamps.length);
  }, [maxRequests, windowMs]);

  const getResetTime = useCallback(() => {
    if (requestTimestamps.current.length === 0) return 0;
    const oldest = Math.min(...requestTimestamps.current);
    const resetAt = oldest + windowMs;
    return Math.max(0, resetAt - Date.now());
  }, [windowMs]);

  return {
    isRateLimited,
    executeIfAllowed,
    executeAsyncIfAllowed,
    getRemainingRequests,
    getResetTime,
  };
}

export function useThrottle({ waitMs }: ThrottleOptions) {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttle = useCallback(<T extends (...args: unknown[]) => unknown>(
    fn: T
  ) => {
    return (...args: Parameters<T>): void => {
      const now = Date.now();
      const remaining = waitMs - (now - lastCallTime.current);

      if (remaining <= 0) {
        lastCallTime.current = now;
        fn(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastCallTime.current = Date.now();
          timeoutRef.current = null;
          fn(...args);
        }, remaining);
      }
    };
  }, [waitMs]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { throttle, cancel };
}

export function useDebounce({ waitMs }: ThrottleOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debounce = useCallback(<T extends (...args: unknown[]) => unknown>(
    fn: T
  ) => {
    return (...args: Parameters<T>): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        fn(...args);
        timeoutRef.current = null;
      }, waitMs);
    };
  }, [waitMs]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flush = useCallback(<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ...args: Parameters<T>
  ) => {
    cancel();
    fn(...args);
  }, [cancel]);

  return { debounce, cancel, flush };
}
