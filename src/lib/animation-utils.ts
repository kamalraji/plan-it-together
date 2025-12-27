/**
 * Animation utilities for style-specific animations
 * Provides helpers for managing animations across different artistic styles
 */

export type AnimationType = 'float' | 'bounce-gentle' | 'wave' | 'wiggle' | 'pop-in' | 'slide-up' | 'sketch-jitter' | 'scribble-draw' | 'slide-precise';
export type ArtisticStyle = 'original' | 'ligne-claire' | 'hand-drawn';

/**
 * Animation configuration for each artistic style
 */
export const ANIMATION_CONFIG = {
  original: {
    float: 'animate-float-original',
    'bounce-gentle': 'animate-bounce-gentle-original',
    wave: 'animate-wave-original',
    wiggle: 'animate-wiggle-original',
    'pop-in': 'animate-pop-in',
    'slide-up': 'animate-slide-up',
  },
  'ligne-claire': {
    float: 'animate-float-ligne-claire',
    'bounce-gentle': 'animate-bounce-gentle-ligne-claire',
    wave: 'animate-wave-ligne-claire',
    wiggle: 'animate-wiggle-ligne-claire',
    'pop-in': 'animate-pop-in',
    'slide-up': 'animate-slide-precise',
  },
  'hand-drawn': {
    float: 'animate-float-hand-drawn',
    'bounce-gentle': 'animate-bounce-gentle-hand-drawn',
    wave: 'animate-wave-hand-drawn',
    wiggle: 'animate-wiggle-hand-drawn',
    'pop-in': 'animate-pop-in',
    'slide-up': 'animate-slide-up',
    'sketch-jitter': 'animate-sketch-jitter',
    'scribble-draw': 'animate-scribble-draw',
  },
} as const;

/**
 * Get the appropriate animation class for a given style and animation type
 */
export function getAnimationClass(
  style: ArtisticStyle,
  animation: AnimationType
): string {
  const styleConfig = ANIMATION_CONFIG[style];
  const animationClass = styleConfig[animation as keyof typeof styleConfig];
  
  // Fallback to base animation if style-specific version doesn't exist
  if (!animationClass) {
    const fallbackMap: Record<AnimationType, string> = {
      float: 'animate-float',
      'bounce-gentle': 'animate-bounce-gentle',
      wave: 'animate-wave',
      wiggle: 'animate-wiggle',
      'pop-in': 'animate-pop-in',
      'slide-up': 'animate-slide-up',
      'sketch-jitter': 'animate-sketch-jitter',
      'scribble-draw': 'animate-scribble-draw',
      'slide-precise': 'animate-slide-precise',
    };
    return fallbackMap[animation] || '';
  }
  
  return animationClass;
}

/**
 * Get staggered delay class for coordinated animations
 */
export function getStaggeredDelay(index: number, maxDelay: number = 1000): string {
  const delay = Math.min(index * 100, maxDelay);
  return `delay-${delay}`;
}

/**
 * Animation timing configurations
 */
export const ANIMATION_TIMINGS = {
  slow: '4s',
  medium: '2s',
  fast: '1s',
  quick: '0.5s',
} as const;

/**
 * Easing configurations
 */
export const ANIMATION_EASINGS = {
  doodle: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply animation with reduced motion consideration
 */
export function applyAnimation(
  element: HTMLElement,
  style: ArtisticStyle,
  animation: AnimationType,
  options?: {
    delay?: number;
    respectReducedMotion?: boolean;
  }
): void {
  const { delay = 0, respectReducedMotion = true } = options || {};
  
  if (respectReducedMotion && prefersReducedMotion()) {
    // Apply subtle hover effect instead of animation
    element.classList.add('hover:transform', 'hover:translate-y-[-2px]', 'transition-transform', 'duration-200');
    return;
  }
  
  const animationClass = getAnimationClass(style, animation);
  if (animationClass) {
    element.classList.add(animationClass);
  }
  
  if (delay > 0) {
    const delayClass = getStaggeredDelay(Math.floor(delay / 100));
    element.classList.add(delayClass);
  }
}

/**
 * Remove animation classes from element
 */
export function removeAnimation(element: HTMLElement, style: ArtisticStyle, animation: AnimationType): void {
  const animationClass = getAnimationClass(style, animation);
  if (animationClass) {
    element.classList.remove(animationClass);
  }
  
  // Remove delay classes
  for (let i = 100; i <= 1000; i += 100) {
    element.classList.remove(`delay-${i}`);
  }
}

/**
 * CSS custom property helpers for dynamic animation configuration
 */
export const CSS_ANIMATION_PROPERTIES = {
  setFloatDistance: (distance: string) => `--original-float-distance: ${distance}`,
  setFloatRotation: (rotation: string) => `--original-float-rotation: ${rotation}`,
  setBounceDistance: (distance: string) => `--original-bounce-distance: ${distance}`,
  setWaveAngle: (angle: string) => `--original-wave-angle: ${angle}`,
  setWiggleAngle: (angle: string) => `--original-wiggle-angle: ${angle}`,
  
  // Ligne Claire properties
  setLigneClairFloat: (distance: string, rotation: string) => 
    `--ligne-claire-float-distance: ${distance}; --ligne-claire-float-rotation: ${rotation}`,
  
  // Hand-drawn properties
  setHandDrawnFloat: (distance: string, rotation: string) => 
    `--hand-drawn-float-distance: ${distance}; --hand-drawn-float-rotation: ${rotation}`,
} as const;

/**
 * Apply CSS custom properties for animation configuration
 */
export function configureAnimationProperties(
  element: HTMLElement,
  properties: Record<string, string>
): void {
  Object.entries(properties).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}