import { useState, useCallback, useRef } from 'react';

interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxAttemptsReached?: (error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

interface RetryState {
  attempts: number;
  isRetrying: boolean;
  lastError: Error | null;
  nextRetryAt: Date | null;
}

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'onRetry' | 'onMaxAttemptsReached' | 'shouldRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

export function useRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
) {
  const {
    maxAttempts = DEFAULT_CONFIG.maxAttempts,
    initialDelay = DEFAULT_CONFIG.initialDelay,
    maxDelay = DEFAULT_CONFIG.maxDelay,
    backoffMultiplier = DEFAULT_CONFIG.backoffMultiplier,
    onRetry,
    onMaxAttemptsReached,
    shouldRetry = () => true,
  } = config;

  const [state, setState] = useState<RetryState>({
    attempts: 0,
    isRetrying: false,
    lastError: null,
    nextRetryAt: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef(false);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.min(delay + jitter, maxDelay);
  }, [initialDelay, backoffMultiplier, maxDelay]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortRef.current = true;
    setState({
      attempts: 0,
      isRetrying: false,
      lastError: null,
      nextRetryAt: null,
    });
  }, []);

  const execute = useCallback(async (): Promise<T> => {
    abortRef.current = false;
    let currentAttempt = 0;
    let lastError: Error | null = null;

    while (currentAttempt < maxAttempts && !abortRef.current) {
      currentAttempt++;
      
      setState(prev => ({
        ...prev,
        attempts: currentAttempt,
        isRetrying: currentAttempt > 1,
        nextRetryAt: null,
      }));

      try {
        const result = await operation();
        setState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: null,
          nextRetryAt: null,
        }));
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setState(prev => ({
          ...prev,
          lastError,
        }));

        if (!shouldRetry(lastError)) {
          throw lastError;
        }

        if (currentAttempt < maxAttempts && !abortRef.current) {
          const delay = calculateDelay(currentAttempt);
          const nextRetryAt = new Date(Date.now() + delay);
          
          setState(prev => ({
            ...prev,
            nextRetryAt,
          }));

          onRetry?.(currentAttempt, lastError);
          
          await new Promise<void>((resolve) => {
            timeoutRef.current = setTimeout(resolve, delay);
          });
        }
      }
    }

    if (lastError) {
      onMaxAttemptsReached?.(lastError);
      throw lastError;
    }

    throw new Error('Retry operation aborted');
  }, [operation, maxAttempts, calculateDelay, shouldRetry, onRetry, onMaxAttemptsReached]);

  const retry = useCallback(() => {
    reset();
    return execute();
  }, [reset, execute]);

  return {
    ...state,
    execute,
    retry,
    reset,
    canRetry: state.attempts < maxAttempts,
    remainingAttempts: maxAttempts - state.attempts,
  };
}

// Utility to determine if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as { isNetworkError?: boolean; isServerError?: boolean; response?: { status?: number } };
  
  // Network errors
  if (err.isNetworkError) return true;
  
  // Server errors (5xx)
  if (err.isServerError) return true;
  
  // Rate limiting
  if (err.response?.status === 429) return true;
  
  // Timeout errors
  if (error instanceof Error && error.message.includes('timeout')) return true;
  
  return false;
}
