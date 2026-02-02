import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Intersection observer hook for lazy loading
function useLazyLoad(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px', ...options }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
}

// Preload an image programmatically
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Hook to preload images for next likely navigation
export function usePreloadImages(srcs: string[]) {
  useEffect(() => {
    srcs.filter(Boolean).forEach(src => preloadImage(src));
  }, [srcs]);
}

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
}

// General purpose lazy loaded image
export const LazyImage = React.memo(function LazyImage({
  src,
  alt,
  className,
  fallback,
  placeholder,
  aspectRatio = 'auto',
  objectFit = 'cover',
  ...props
}: LazyImageProps) {
  const { elementRef, hasIntersected } = useLazyLoad();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Check for native lazy loading support
  const supportsNativeLazy = 'loading' in HTMLImageElement.prototype;

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    auto: '',
  };

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  };

  // Use native lazy loading if supported
  if (supportsNativeLazy) {
    return (
      <div 
        ref={elementRef}
        className={cn('relative overflow-hidden', aspectClasses[aspectRatio], className)}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClasses[objectFit],
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            {placeholder}
          </div>
        )}
        {hasError && fallback && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            {fallback}
          </div>
        )}
      </div>
    );
  }

  // Fallback to IntersectionObserver
  return (
    <div 
      ref={elementRef}
      className={cn('relative overflow-hidden', aspectClasses[aspectRatio], className)}
    >
      {hasIntersected && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClasses[objectFit],
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          {placeholder}
        </div>
      )}
      {hasError && fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {fallback}
        </div>
      )}
    </div>
  );
});

interface LazyBannerProps {
  src: string;
  alt: string;
  className?: string;
  height?: string;
  fallbackIcon?: React.ReactNode;
}

// Lazy loaded banner/hero images with gradient placeholder
export const LazyBanner = React.memo(function LazyBanner({
  src,
  alt,
  className,
  height = 'h-48',
  fallbackIcon,
}: LazyBannerProps) {
  const { elementRef, hasIntersected } = useLazyLoad();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div 
      ref={elementRef}
      className={cn('relative overflow-hidden', height, className)}
    >
      {hasIntersected && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          {fallbackIcon}
        </div>
      )}
    </div>
  );
});

interface LazyThumbnailProps {
  src: string | null | undefined;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  className?: string;
  fallbackIcon?: React.ReactNode;
}

// Lazy loaded card thumbnails with fixed aspect ratio
export const LazyThumbnail = React.memo(function LazyThumbnail({
  src,
  alt,
  aspectRatio = 'video',
  className,
  fallbackIcon,
}: LazyThumbnailProps) {
  const { elementRef, hasIntersected } = useLazyLoad();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  const showFallback = !src || hasError;

  return (
    <div 
      ref={elementRef}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5',
        aspectClasses[aspectRatio],
        className
      )}
    >
      {hasIntersected && src && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full object-cover transition-all duration-300 group-hover:scale-105',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
      {!isLoaded && !showFallback && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {showFallback && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallbackIcon}
        </div>
      )}
    </div>
  );
});
