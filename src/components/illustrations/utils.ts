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
  hair: '#2D3748',
  skin: '#F5D0B9',
  skinShadow: '#E8B89C',
  topBlue: '#4299E1',
  topBlueDark: '#3182CE',
  skirt: '#2D3748',
  clock: '#E2E8F0',
  clockHands: '#4299E1',
  plant: '#48BB78',
  plantDark: '#38A169',
  chartBar: '#E2E8F0',
  chartAccent: '#4299E1',
  white: '#FFFFFF',
  lightGray: '#F7FAFC',
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
