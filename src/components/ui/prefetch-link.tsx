import React, { useCallback, useRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PrefetchLinkProps extends LinkProps {
  /** Function to call on hover/focus to prefetch data */
  prefetchFn?: () => void;
  /** Delay in ms before triggering prefetch (default: 100) */
  prefetchDelay?: number;
  /** Whether to prefetch on focus as well (default: true) */
  prefetchOnFocus?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * A Link component that prefetches data on hover/focus
 * for instant navigation experience
 */
export function PrefetchLink({
  prefetchFn,
  prefetchDelay = 100,
  prefetchOnFocus = true,
  children,
  className,
  ...props
}: PrefetchLinkProps) {
  const prefetchedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const triggerPrefetch = useCallback(() => {
    if (prefetchedRef.current || !prefetchFn) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delay prefetch slightly to avoid unnecessary fetches on quick hover-throughs
    timeoutRef.current = setTimeout(() => {
      prefetchFn();
      prefetchedRef.current = true;
    }, prefetchDelay);
  }, [prefetchFn, prefetchDelay]);

  const handleMouseEnter = useCallback(() => {
    triggerPrefetch();
  }, [triggerPrefetch]);

  const handleFocus = useCallback(() => {
    if (prefetchOnFocus) {
      triggerPrefetch();
    }
  }, [triggerPrefetch, prefetchOnFocus]);

  const handleMouseLeave = useCallback(() => {
    // Cancel pending prefetch if user quickly moves away
    if (timeoutRef.current && !prefetchedRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return (
    <Link
      {...props}
      className={cn(className)}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
}

/**
 * Higher-order component to wrap any clickable element with prefetch behavior
 */
export function withPrefetch<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function PrefetchableComponent({
    prefetchFn,
    prefetchDelay = 100,
    ...props
  }: P & { prefetchFn?: () => void; prefetchDelay?: number }) {
    const prefetchedRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        if (prefetchedRef.current || !prefetchFn) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          prefetchFn();
          prefetchedRef.current = true;
        }, prefetchDelay);

        // Call original handler if it exists
        const originalHandler = (props as any).onMouseEnter;
        if (originalHandler) originalHandler(e);
      },
      [prefetchFn, prefetchDelay, props]
    );

    return <WrappedComponent {...(props as P)} onMouseEnter={handleMouseEnter} />;
  };
}
