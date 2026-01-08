import { IllustrationSize, IllustrationAnimation } from './types';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export const SIZE_DIMENSIONS: Record<IllustrationSize, { width: number; height: number }> = {
  sm: { width: 120, height: 120 },
  md: { width: 200, height: 200 },
  lg: { width: 320, height: 320 },
  xl: { width: 480, height: 480 },
  full: { width: 600, height: 600 },
};

// Fallback colors (used during SSR or if CSS vars unavailable)
const FALLBACK_COLORS = {
  primary: '#3B82F6',
  accent: '#06B6D4',
  foreground: '#1E293B',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
};

// Helper to get computed CSS variable value
function getCSSVar(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!value) return fallback;
  // Convert HSL to hex for SVG compatibility
  if (value.includes(' ')) {
    const [h, s, l] = value.split(' ').map(v => parseFloat(v));
    return hslToHex(h, s, l);
  }
  return fallback;
}

// Convert HSL values to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Hook to get theme-aware colors
export function useIllustrationColors() {
  return useMemo(() => {
    const primary = getCSSVar('--primary', FALLBACK_COLORS.primary);
    const accent = getCSSVar('--accent', FALLBACK_COLORS.accent);
    const foreground = getCSSVar('--foreground', FALLBACK_COLORS.foreground);
    const muted = getCSSVar('--muted', FALLBACK_COLORS.muted);
    const mutedForeground = getCSSVar('--muted-foreground', FALLBACK_COLORS.mutedForeground);

    return {
      // People
      hair: foreground,
      skin: '#F5D0B9',
      skinShadow: '#E8B89C',
      
      // Clothing
      topBlue: primary,
      topBlueDark: primary,
      topAccent: accent,
      topAccentDark: accent,
      skirt: foreground,
      pants: foreground,
      
      // Elements
      clock: muted,
      clockHands: primary,
      plant: '#22C55E',
      plantDark: '#16A34A',
      chartBar: muted,
      chartAccent: primary,
      
      // Additional
      white: '#FFFFFF',
      lightGray: '#F8FAFC',
      ticket: '#F59E0B',
      calendar: '#8B5CF6',
      notification: '#EF4444',
      megaphone: '#EC4899',
      laptop: mutedForeground,
      coffee: '#92400E',
      confettiColors: [primary, accent, '#22C55E', '#F59E0B', '#EC4899'],
    };
  }, []);
}

// Static colors for non-hook contexts (fallback)
export const COLORS = {
  hair: FALLBACK_COLORS.foreground,
  skin: '#F5D0B9',
  skinShadow: '#E8B89C',
  topBlue: FALLBACK_COLORS.primary,
  topBlueDark: FALLBACK_COLORS.primary,
  topAccent: FALLBACK_COLORS.accent,
  topAccentDark: FALLBACK_COLORS.accent,
  skirt: FALLBACK_COLORS.foreground,
  pants: FALLBACK_COLORS.foreground,
  clock: FALLBACK_COLORS.muted,
  clockHands: FALLBACK_COLORS.primary,
  plant: '#22C55E',
  plantDark: '#16A34A',
  chartBar: '#E2E8F0',
  chartAccent: FALLBACK_COLORS.primary,
  white: '#FFFFFF',
  lightGray: '#F8FAFC',
  ticket: '#F59E0B',
  calendar: '#8B5CF6',
  notification: '#EF4444',
  megaphone: '#EC4899',
  laptop: FALLBACK_COLORS.mutedForeground,
  coffee: '#92400E',
  confettiColors: [FALLBACK_COLORS.primary, FALLBACK_COLORS.accent, '#22C55E', '#F59E0B', '#EC4899'],
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
