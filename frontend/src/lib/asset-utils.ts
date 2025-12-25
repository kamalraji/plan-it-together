/**
 * Asset utilities for managing and optimizing static assets
 * Provides helpers for asset loading, fallbacks, and optimization
 */

export type AssetType = 'image' | 'icon' | 'svg' | 'font' | 'video' | 'audio';

/**
 * Asset configuration for different types
 */
export const ASSET_CONFIG = {
  image: {
    formats: ['webp', 'avif', 'jpg', 'png'],
    fallback: '/placeholder.svg',
    lazy: true,
  },
  icon: {
    formats: ['svg', 'png'],
    fallback: '/placeholder.svg',
    lazy: false,
  },
  svg: {
    formats: ['svg'],
    fallback: '/placeholder.svg',
    lazy: false,
  },
  font: {
    formats: ['woff2', 'woff', 'ttf'],
    fallback: 'system-ui, sans-serif',
    lazy: false,
  },
} as const;

/**
 * Asset registry for tracking loaded assets and preventing duplicates
 */
class AssetRegistry {
  private loadedAssets = new Set<string>();
  private failedAssets = new Set<string>();
  private loadingPromises = new Map<string, Promise<boolean>>();

  /**
   * Check if asset is already loaded
   */
  isLoaded(url: string): boolean {
    return this.loadedAssets.has(url);
  }

  /**
   * Check if asset failed to load
   */
  hasFailed(url: string): boolean {
    return this.failedAssets.has(url);
  }

  /**
   * Mark asset as loaded
   */
  markLoaded(url: string): void {
    this.loadedAssets.add(url);
    this.loadingPromises.delete(url);
  }

  /**
   * Mark asset as failed
   */
  markFailed(url: string): void {
    this.failedAssets.add(url);
    this.loadingPromises.delete(url);
  }

  /**
   * Get or create loading promise for asset
   */
  getLoadingPromise(url: string, loader: () => Promise<boolean>): Promise<boolean> {
    if (!this.loadingPromises.has(url)) {
      this.loadingPromises.set(url, loader());
    }
    return this.loadingPromises.get(url)!;
  }

  /**
   * Clear registry (useful for testing)
   */
  clear(): void {
    this.loadedAssets.clear();
    this.failedAssets.clear();
    this.loadingPromises.clear();
  }
}

export const assetRegistry = new AssetRegistry();

/**
 * Preload an asset
 */
export function preloadAsset(url: string, type: AssetType = 'image'): Promise<boolean> {
  if (assetRegistry.isLoaded(url)) {
    return Promise.resolve(true);
  }

  if (assetRegistry.hasFailed(url)) {
    return Promise.resolve(false);
  }

  return assetRegistry.getLoadingPromise(url, () => {
    return new Promise((resolve) => {
      if (type === 'image' || type === 'icon' || type === 'svg') {
        const img = new Image();
        img.onload = () => {
          assetRegistry.markLoaded(url);
          resolve(true);
        };
        img.onerror = () => {
          assetRegistry.markFailed(url);
          resolve(false);
        };
        img.src = url;
      } else if (type === 'font') {
        // For fonts, we can use CSS Font Loading API if available
        if ('fonts' in document) {
          const fontFace = new FontFace('preload-font', `url(${url})`);
          fontFace.load().then(() => {
            assetRegistry.markLoaded(url);
            resolve(true);
          }).catch(() => {
            assetRegistry.markFailed(url);
            resolve(false);
          });
        } else {
          // Fallback for older browsers
          assetRegistry.markLoaded(url);
          resolve(true);
        }
      } else {
        // For other asset types, use fetch
        fetch(url, { method: 'HEAD' })
          .then((response) => {
            if (response.ok) {
              assetRegistry.markLoaded(url);
              resolve(true);
            } else {
              assetRegistry.markFailed(url);
              resolve(false);
            }
          })
          .catch(() => {
            assetRegistry.markFailed(url);
            resolve(false);
          });
      }
    });
  });
}

/**
 * Get optimized asset URL with fallback
 */
export function getAssetUrl(
  basePath: string,
  type: AssetType = 'image',
  options?: {
    preferredFormat?: string;
    size?: string;
    quality?: number;
  }
): string {
  const config = ASSET_CONFIG[type];
  const { preferredFormat, size, quality } = options || {};

  // If a preferred format is specified and supported, use it
  if (preferredFormat && config.formats.includes(preferredFormat as any)) {
    const extension = basePath.split('.').pop();
    const baseWithoutExt = basePath.replace(`.${extension}`, '');
    return `${baseWithoutExt}.${preferredFormat}`;
  }

  // For images, try to use modern formats first
  if (type === 'image') {
    const extension = basePath.split('.').pop();
    const baseWithoutExt = basePath.replace(`.${extension}`, '');
    
    // Check browser support for modern formats
    if (supportsWebP()) {
      return `${baseWithoutExt}.webp`;
    }
    if (supportsAVIF()) {
      return `${baseWithoutExt}.avif`;
    }
  }

  return basePath;
}

/**
 * Get fallback asset URL
 */
export function getFallbackUrl(type: AssetType): string {
  const config = ASSET_CONFIG[type];
  return config.fallback;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Check if browser supports AVIF
 */
export function supportsAVIF(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  try {
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  } catch {
    return false;
  }
}

/**
 * Lazy load an image with intersection observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options?: {
    rootMargin?: string;
    threshold?: number;
    fallback?: string;
  }
): void {
  const { rootMargin = '50px', threshold = 0.1, fallback } = options || {};

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLImageElement;
            
            // Try to load the image
            preloadAsset(src, 'image').then((success) => {
              if (success) {
                target.src = src;
              } else if (fallback) {
                target.src = fallback;
              } else {
                target.src = getFallbackUrl('image');
              }
              target.classList.remove('lazy-loading');
              target.classList.add('lazy-loaded');
            });
            
            observer.unobserve(target);
          }
        });
      },
      { rootMargin, threshold }
    );

    img.classList.add('lazy-loading');
    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
  }
}

/**
 * Optimize asset loading by preloading critical assets
 */
export function preloadCriticalAssets(assets: Array<{ url: string; type: AssetType }>): Promise<boolean[]> {
  return Promise.all(assets.map(({ url, type }) => preloadAsset(url, type)));
}

/**
 * Asset deduplication utility
 */
export function deduplicateAssets(assets: string[]): string[] {
  const seen = new Set<string>();
  const deduplicated: string[] = [];

  for (const asset of assets) {
    // Normalize the asset path
    const normalized = asset.replace(/\/+/g, '/').replace(/^\//, '');
    
    if (!seen.has(normalized)) {
      seen.add(normalized);
      deduplicated.push(asset);
    }
  }

  return deduplicated;
}

/**
 * Get asset size information
 */
export async function getAssetSize(url: string): Promise<{ width?: number; height?: number; size?: number }> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    // For images, we can get dimensions
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            size,
          });
        };
        img.onerror = () => {
          resolve({ size });
        };
        img.src = url;
      });
    }

    return { size };
  } catch {
    return {};
  }
}

/**
 * Create responsive image srcset
 */
export function createSrcSet(
  basePath: string,
  sizes: number[],
  format: string = 'webp'
): string {
  const extension = basePath.split('.').pop();
  const baseWithoutExt = basePath.replace(`.${extension}`, '');
  
  return sizes
    .map((size) => `${baseWithoutExt}-${size}w.${format} ${size}w`)
    .join(', ');
}

/**
 * Asset loading performance metrics
 */
export class AssetPerformanceMonitor {
  private metrics = new Map<string, { startTime: number; endTime?: number; success?: boolean }>();

  startLoading(url: string): void {
    this.metrics.set(url, { startTime: performance.now() });
  }

  endLoading(url: string, success: boolean): void {
    const metric = this.metrics.get(url);
    if (metric) {
      metric.endTime = performance.now();
      metric.success = success;
    }
  }

  getMetrics(): Array<{ url: string; duration: number; success: boolean }> {
    return Array.from(this.metrics.entries())
      .filter(([, metric]) => metric.endTime !== undefined)
      .map(([url, metric]) => ({
        url,
        duration: metric.endTime! - metric.startTime,
        success: metric.success!,
      }));
  }

  getAverageLoadTime(): number {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return 0;
    
    const totalTime = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalTime / metrics.length;
  }

  getSuccessRate(): number {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return 0;
    
    const successCount = metrics.filter(metric => metric.success).length;
    return successCount / metrics.length;
  }
}

export const assetPerformanceMonitor = new AssetPerformanceMonitor();