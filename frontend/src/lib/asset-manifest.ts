/**
 * Asset Manifest
 * Central registry of all static assets with metadata and optimization info
 */

export interface AssetManifestEntry {
  id: string;
  path: string;
  type: 'image' | 'icon' | 'svg' | 'font' | 'video' | 'audio';
  size?: number;
  width?: number;
  height?: number;
  formats?: string[];
  critical?: boolean;
  lazy?: boolean;
  fallback?: string;
  description?: string;
  alt?: string;
  source?: 'frontend' | 'doodle-hub-delight' | 'merged';
}

/**
 * Complete asset manifest for the merged application
 */
export const ASSET_MANIFEST: Record<string, AssetManifestEntry> = {
  // Public assets
  'favicon': {
    id: 'favicon',
    path: '/favicon.ico',
    type: 'icon',
    critical: true,
    lazy: false,
    description: 'Application favicon',
    source: 'doodle-hub-delight',
  },
  
  'placeholder': {
    id: 'placeholder',
    path: '/placeholder.svg',
    type: 'svg',
    critical: false,
    lazy: false,
    description: 'Placeholder image for missing assets',
    alt: 'Placeholder image',
    source: 'doodle-hub-delight',
  },

  'robots': {
    id: 'robots',
    path: '/robots.txt',
    type: 'text',
    critical: false,
    lazy: false,
    description: 'Search engine robots configuration',
    source: 'doodle-hub-delight',
  },

  'manifest': {
    id: 'manifest',
    path: '/manifest.json',
    type: 'json',
    critical: true,
    lazy: false,
    description: 'Progressive Web App manifest',
    source: 'frontend',
  },

  'offline-page': {
    id: 'offline-page',
    path: '/offline.html',
    type: 'html',
    critical: false,
    lazy: false,
    description: 'Offline fallback page',
    source: 'frontend',
  },

  'service-worker': {
    id: 'service-worker',
    path: '/sw.js',
    type: 'javascript',
    critical: true,
    lazy: false,
    description: 'Service worker for offline functionality',
    source: 'frontend',
  },

  // PWA Icons (referenced in manifest but may not exist yet)
  'icon-72': {
    id: 'icon-72',
    path: '/icon-72x72.png',
    type: 'icon',
    width: 72,
    height: 72,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 72x72',
    source: 'frontend',
  },

  'icon-96': {
    id: 'icon-96',
    path: '/icon-96x96.png',
    type: 'icon',
    width: 96,
    height: 96,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 96x96',
    source: 'frontend',
  },

  'icon-128': {
    id: 'icon-128',
    path: '/icon-128x128.png',
    type: 'icon',
    width: 128,
    height: 128,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 128x128',
    source: 'frontend',
  },

  'icon-144': {
    id: 'icon-144',
    path: '/icon-144x144.png',
    type: 'icon',
    width: 144,
    height: 144,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 144x144',
    source: 'frontend',
  },

  'icon-152': {
    id: 'icon-152',
    path: '/icon-152x152.png',
    type: 'icon',
    width: 152,
    height: 152,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 152x152',
    source: 'frontend',
  },

  'icon-192': {
    id: 'icon-192',
    path: '/icon-192x192.png',
    type: 'icon',
    width: 192,
    height: 192,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 192x192',
    source: 'frontend',
  },

  'icon-384': {
    id: 'icon-384',
    path: '/icon-384x384.png',
    type: 'icon',
    width: 384,
    height: 384,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 384x384',
    source: 'frontend',
  },

  'icon-512': {
    id: 'icon-512',
    path: '/icon-512x512.png',
    type: 'icon',
    width: 512,
    height: 512,
    critical: true,
    lazy: false,
    fallback: '/placeholder.svg',
    description: 'PWA icon 512x512',
    source: 'frontend',
  },
} as const;

/**
 * Get asset by ID
 */
export function getAsset(id: string): AssetManifestEntry | undefined {
  return ASSET_MANIFEST[id];
}

/**
 * Get all assets of a specific type
 */
export function getAssetsByType(type: AssetManifestEntry['type']): AssetManifestEntry[] {
  return Object.values(ASSET_MANIFEST).filter(asset => asset.type === type);
}

/**
 * Get all critical assets
 */
export function getCriticalAssets(): AssetManifestEntry[] {
  return Object.values(ASSET_MANIFEST).filter(asset => asset.critical);
}

/**
 * Get all assets from a specific source
 */
export function getAssetsBySource(source: AssetManifestEntry['source']): AssetManifestEntry[] {
  return Object.values(ASSET_MANIFEST).filter(asset => asset.source === source);
}

/**
 * Check for duplicate assets (same path, different ID)
 */
export function findDuplicateAssets(): Array<{ path: string; assets: AssetManifestEntry[] }> {
  const pathMap = new Map<string, AssetManifestEntry[]>();
  
  Object.values(ASSET_MANIFEST).forEach(asset => {
    const existing = pathMap.get(asset.path) || [];
    existing.push(asset);
    pathMap.set(asset.path, existing);
  });
  
  return Array.from(pathMap.entries())
    .filter(([, assets]) => assets.length > 1)
    .map(([path, assets]) => ({ path, assets }));
}

/**
 * Validate asset manifest for consistency
 */
export function validateAssetManifest(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for duplicates
  const duplicates = findDuplicateAssets();
  if (duplicates.length > 0) {
    errors.push(`Found duplicate asset paths: ${duplicates.map(d => d.path).join(', ')}`);
  }
  
  // Check for missing fallbacks
  Object.values(ASSET_MANIFEST).forEach(asset => {
    if (asset.type === 'image' && !asset.fallback) {
      warnings.push(`Asset ${asset.id} has no fallback specified`);
    }
  });
  
  // Check for missing critical assets
  const criticalAssets = getCriticalAssets();
  if (criticalAssets.length === 0) {
    warnings.push('No critical assets defined');
  }
  
  // Check for PWA icon consistency
  const icons = getAssetsByType('icon');
  const iconSizes = icons.map(icon => ({ id: icon.id, width: icon.width, height: icon.height }));
  iconSizes.forEach(({ id, width, height }) => {
    if (width !== height) {
      warnings.push(`Icon ${id} is not square (${width}x${height})`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate asset preload links for critical assets
 */
export function generatePreloadLinks(): string[] {
  const criticalAssets = getCriticalAssets();
  
  return criticalAssets.map(asset => {
    const rel = asset.type === 'font' ? 'preload' : 'prefetch';
    const as = asset.type === 'image' ? 'image' : 
               asset.type === 'font' ? 'font' :
               asset.type === 'icon' ? 'image' : 'fetch';
    
    let link = `<link rel="${rel}" href="${asset.path}" as="${as}"`;
    
    if (asset.type === 'font') {
      link += ' crossorigin="anonymous"';
    }
    
    if (asset.type === 'image' && asset.formats) {
      link += ` type="image/${asset.formats[0]}"`;
    }
    
    link += '>';
    return link;
  });
}

/**
 * Asset optimization recommendations
 */
export function getOptimizationRecommendations(): Array<{
  type: 'error' | 'warning' | 'info';
  message: string;
  asset?: string;
}> {
  const recommendations: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    asset?: string;
  }> = [];
  
  // Check for missing modern image formats
  const images = getAssetsByType('image');
  images.forEach(asset => {
    if (!asset.formats || !asset.formats.includes('webp')) {
      recommendations.push({
        type: 'info',
        message: 'Consider adding WebP format for better compression',
        asset: asset.id,
      });
    }
  });
  
  // Check for large icons without optimization
  const icons = getAssetsByType('icon');
  icons.forEach(asset => {
    if (asset.size && asset.size > 50000) { // 50KB
      recommendations.push({
        type: 'warning',
        message: 'Icon file size is large, consider optimization',
        asset: asset.id,
      });
    }
  });
  
  // Check for missing lazy loading on non-critical images
  images.forEach(asset => {
    if (!asset.critical && asset.lazy !== true) {
      recommendations.push({
        type: 'info',
        message: 'Consider enabling lazy loading for non-critical images',
        asset: asset.id,
      });
    }
  });
  
  return recommendations;
}

/**
 * Export asset manifest for build tools
 */
export function exportManifestForBuild(): Record<string, any> {
  return {
    version: '1.0.0',
    generated: new Date().toISOString(),
    assets: ASSET_MANIFEST,
    validation: validateAssetManifest(),
    recommendations: getOptimizationRecommendations(),
  };
}