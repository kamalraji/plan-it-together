/**
 * Optimized Image Component
 * Provides automatic optimization, lazy loading, and fallback handling
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getAssetUrl, getFallbackUrl, lazyLoadImage, preloadAsset } from '@/lib/asset-utils';
import { getAsset } from '@/lib/asset-manifest';

export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** Asset ID from manifest or direct URL */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
  /** Enable lazy loading (default: true) */
  lazy?: boolean;
  /** Preferred image format */
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  /** Quality setting (1-100) */
  quality?: number;
  /** Responsive sizes */
  sizes?: string;
  /** Custom fallback URL */
  fallback?: string;
  /** Loading state component */
  loadingComponent?: React.ReactNode;
  /** Error state component */
  errorComponent?: React.ReactNode;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  lazy = true,
  format,
  quality,
  sizes,
  fallback,
  loadingComponent,
  errorComponent,
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Determine the actual image URL
  const getImageUrl = (): string => {
    // Check if src is an asset ID from manifest
    const asset = getAsset(src);
    if (asset) {
      return getAssetUrl(asset.path, 'image', { preferredFormat: format, quality });
    }
    
    // Otherwise treat as direct URL
    return getAssetUrl(src, 'image', { preferredFormat: format, quality });
  };

  // Get fallback URL
  const getFallback = (): string => {
    if (fallback) {
      return fallback;
    }
    const asset = getAsset(src);
    if (asset?.fallback) {
      return asset.fallback;
    }
    return getFallbackUrl('image');
  };

  useEffect(() => {
    const imageUrl = getImageUrl();

    if (!lazy) {
      // Preload immediately if not lazy
      preloadAsset(imageUrl, 'image').then((success) => {
        if (success) {
          setCurrentSrc(imageUrl);
          setLoadState('loaded');
          onLoad?.();
        } else {
          setCurrentSrc(getFallback());
          setLoadState('error');
          onError?.();
        }
      });
      return;
    }

    if (imgRef.current) {
      // Set up lazy loading
      lazyLoadImage(imgRef.current, imageUrl, {
        fallback: getFallback(),
      });

      // Listen for load events
      const img = imgRef.current;
      const handleLoad = () => {
        setLoadState('loaded');
        onLoad?.();
      };
      const handleError = () => {
        setLoadState('error');
        onError?.();
      };

      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);

      return () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
    }

    return;
  }, [src, lazy, format, quality, fallback, onLoad, onError]);

  // Generate srcSet for responsive images
  const generateSrcSet = (): string | undefined => {
    if (!sizes) return undefined;
    
    const asset = getAsset(src);
    if (!asset) return undefined;
    
    // Generate different sizes based on the original dimensions
    const baseSizes = [480, 768, 1024, 1280, 1920];
    const applicableSizes = baseSizes.filter(size => 
      !asset.width || size <= asset.width
    );
    
    return applicableSizes
      .map(size => {
        const url = getAssetUrl(asset.path, 'image', { 
          preferredFormat: format,
          quality,
        });
        return `${url} ${size}w`;
      })
      .join(', ');
  };

  // Render loading state
  if (loadState === 'loading' && loadingComponent) {
    return <>{loadingComponent}</>;
  }

  // Render error state
  if (loadState === 'error' && errorComponent) {
    return <>{errorComponent}</>;
  }

  return (
    <img
      ref={imgRef}
      src={lazy ? undefined : currentSrc}
      srcSet={generateSrcSet()}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      className={cn(
        'transition-opacity duration-300',
        loadState === 'loading' && 'opacity-0',
        loadState === 'loaded' && 'opacity-100',
        loadState === 'error' && 'opacity-75',
        className
      )}
      {...props}
    />
  );
};

/**
 * Optimized Avatar Component
 * Specialized image component for user avatars with consistent sizing
 */
export interface OptimizedAvatarProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Fallback to initials */
  initials?: string;
}

export const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  size = 'md',
  initials,
  className,
  ...props
}) => {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };
  
  const actualSize = typeof size === 'number' ? size : sizeMap[size];
  
  const errorComponent = initials ? (
    <div
      className={cn(
        'flex items-center justify-center bg-muted text-muted-foreground font-medium rounded-full',
        className
      )}
      style={{ width: actualSize, height: actualSize }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  ) : undefined;
  
  return (
    <OptimizedImage
      width={actualSize}
      height={actualSize}
      className={cn('rounded-full object-cover', className)}
      errorComponent={errorComponent}
      {...props}
    />
  );
};

/**
 * Optimized Icon Component
 * Specialized component for icons with consistent sizing and fallbacks
 */
export interface OptimizedIconProps extends Omit<OptimizedImageProps, 'lazy'> {
  /** Icon size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
}

export const OptimizedIcon: React.FC<OptimizedIconProps> = ({
  size = 'md',
  className,
  ...props
}) => {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };
  
  const actualSize = typeof size === 'number' ? size : sizeMap[size];
  
  return (
    <OptimizedImage
      width={actualSize}
      height={actualSize}
      lazy={false} // Icons are typically critical and small
      className={cn('inline-block', className)}
      {...props}
    />
  );
};

export default OptimizedImage;