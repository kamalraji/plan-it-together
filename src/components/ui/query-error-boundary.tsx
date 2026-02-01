import { ReactNode, useCallback, useState, useEffect } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { isRetryableError } from '@/hooks/useRetry';
import { cn } from '@/lib/utils';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  error?: Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  variant?: 'inline' | 'card' | 'fullpage';
  retryCount?: number;
  maxRetries?: number;
}

interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
  isRetrying: boolean;
  isOnline: boolean;
  isSlowConnection: boolean;
  variant: 'inline' | 'card' | 'fullpage';
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
}

function getErrorInfo(error: Error, isOnline: boolean) {
  const err = error as { isNetworkError?: boolean; isServerError?: boolean; response?: { status?: number } };
  
  if (!isOnline || err.isNetworkError) {
    return {
      title: 'Connection Lost',
      message: 'Please check your internet connection and try again.',
      icon: WifiOff,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    };
  }
  
  if (err.response?.status === 429) {
    return {
      title: 'Too Many Requests',
      message: 'Please wait a moment before trying again.',
      icon: Clock,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    };
  }
  
  if (err.isServerError) {
    return {
      title: 'Server Error',
      message: 'Our servers are experiencing issues. Please try again later.',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
    };
  }
  
  return {
    title: 'Something Went Wrong',
    message: error.message || 'An unexpected error occurred.',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/5',
    borderColor: 'border-destructive/20',
  };
}

function ErrorDisplay({
  error,
  onRetry,
  isRetrying,
  isOnline,
  isSlowConnection,
  variant,
  retryCount,
  maxRetries,
  canRetry,
}: ErrorDisplayProps) {
  const errorInfo = getErrorInfo(error, isOnline);
  const Icon = errorInfo.icon;
  
  const containerClasses = {
    inline: 'p-4 rounded-lg',
    card: 'p-6 rounded-xl shadow-sm',
    fullpage: 'min-h-[50vh] flex items-center justify-center p-8',
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center text-center gap-4',
      variant === 'inline' && 'flex-row text-left gap-3',
    )}>
      <div className={cn(
        'flex items-center justify-center rounded-full',
        variant === 'fullpage' ? 'w-16 h-16' : 'w-12 h-12',
        errorInfo.bgColor,
      )}>
        <Icon className={cn(
          errorInfo.iconColor,
          variant === 'fullpage' ? 'w-8 h-8' : 'w-6 h-6',
        )} />
      </div>
      
      <div className={cn(
        'flex-1',
        variant === 'inline' && 'min-w-0',
      )}>
        <h3 className={cn(
          'font-semibold text-foreground',
          variant === 'fullpage' ? 'text-xl mb-2' : 'text-base mb-1',
        )}>
          {errorInfo.title}
        </h3>
        <p className={cn(
          'text-muted-foreground',
          variant === 'fullpage' ? 'text-base' : 'text-sm',
        )}>
          {errorInfo.message}
        </p>
        
        {isSlowConnection && isOnline && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Slow connection detected
          </p>
        )}
        
        {retryCount > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Retry attempt {retryCount} of {maxRetries}
          </p>
        )}
      </div>
      
      {canRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying || !isOnline}
          variant={variant === 'fullpage' ? 'default' : 'outline'}
          size={variant === 'inline' ? 'sm' : 'default'}
          className={cn(
            variant === 'inline' && 'shrink-0',
          )}
        >
          <RefreshCw className={cn(
            'w-4 h-4 mr-2',
            isRetrying && 'animate-spin',
          )} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      )}
    </div>
  );

  if (variant === 'fullpage') {
    return (
      <div className={containerClasses.fullpage}>
        <div className="max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      containerClasses[variant],
      errorInfo.bgColor,
      'border',
      errorInfo.borderColor,
    )}>
      {content}
    </div>
  );
}

export function QueryErrorFallback({
  error,
  onRetry,
  isRetrying = false,
  className,
  variant = 'card',
  retryCount = 0,
  maxRetries = 3,
}: Omit<QueryErrorBoundaryProps, 'children'> & { error: Error }) {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const canRetry = retryCount < maxRetries && isRetryableError(error);
  
  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && !isRetrying && canRetry && onRetry) {
      const timer = setTimeout(onRetry, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, isRetrying, canRetry, onRetry]);

  return (
    <div className={className}>
      <ErrorDisplay
        error={error}
        onRetry={onRetry ?? (() => {})}
        isRetrying={isRetrying}
        isOnline={isOnline}
        isSlowConnection={isSlowConnection}
        variant={variant}
        retryCount={retryCount}
        maxRetries={maxRetries}
        canRetry={canRetry}
      />
    </div>
  );
}

// Hook for query error handling with retry
export function useQueryErrorHandler() {
  const { reset } = useQueryErrorResetBoundary();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async (refetch: () => Promise<unknown>) => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      reset();
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  }, [reset]);

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
  }, []);

  return {
    retryCount,
    isRetrying,
    handleRetry,
    resetRetryCount,
  };
}

// Offline banner component
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else if (show) {
      // Show "back online" briefly
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, show]);

  if (!show) return null;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-colors',
      isOnline
        ? 'bg-green-500 text-white'
        : 'bg-orange-500 text-white',
    )}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Back online
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            You're offline. Some features may be unavailable.
          </>
        )}
      </div>
    </div>
  );
}
