import { IllustrationSize, IllustrationAnimation } from './types';
import { cn } from '@/lib/utils';

export const SIZE_DIMENSIONS: Record<IllustrationSize, { width: number; height: number }> = {
  sm: { width: 120, height: 120 },
  md: { width: 200, height: 200 },
  lg: { width: 320, height: 320 },
  xl: { width: 480, height: 480 },
  full: { width: 600, height: 600 },
};

export const COLORS = {
  // People
  hair: '#1E293B',
  skin: '#F5D0B9',
  skinShadow: '#E8B89C',
  
  // Clothing (brand primary/accent)
  topBlue: '#3B82F6',
  topBlueDark: '#2563EB',
  topAccent: '#06B6D4',
  topAccentDark: '#0891B2',
  skirt: '#1E293B',
  pants: '#1E293B',
  
  // Elements (brand-aligned)
  clock: '#F1F5F9',
  clockHands: '#3B82F6',
  plant: '#22C55E',
  plantDark: '#16A34A',
  chartBar: '#E2E8F0',
  chartAccent: '#3B82F6',
  
  // Additional colors
  white: '#FFFFFF',
  lightGray: '#F8FAFC',
  ticket: '#F59E0B',
  calendar: '#8B5CF6',
  notification: '#EF4444',
  megaphone: '#EC4899',
  laptop: '#64748B',
  coffee: '#92400E',
  confettiColors: ['#3B82F6', '#06B6D4', '#22C55E', '#F59E0B', '#EC4899'],
};

export const ANIMATION_CLASSES: Record<IllustrationAnimation, string> = {
  none: '',
  float: 'animate-float',
  subtle: 'animate-subtle-move',
};

export function getSizeStyles(size: IllustrationSize): { width: string; height: string } {
  if (size === 'full') {
    return { width: '100%', height: 'auto' };
  }
  const dims = SIZE_DIMENSIONS[size];
  return { width: `${dims.width}px`, height: `${dims.height}px` };
}

export function buildIllustrationClasses(
  animation: IllustrationAnimation = 'none',
  className?: string
): string {
  return cn(
    'illustration',
    ANIMATION_CLASSES[animation],
    className
  );
}
