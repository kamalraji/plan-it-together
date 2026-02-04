import { CharacterProps, CharacterSize, CharacterAnimation } from './types';
import { cn } from '@/lib/utils';

export const getSizeClasses = (size: CharacterSize): string => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  return sizeMap[size];
};

export const getAnimationClasses = (animation: CharacterAnimation): string => {
  const animationMap = {
    none: '',
    float: 'animate-float',
    bounce: 'animate-bounce-gentle',
    wave: 'animate-wave',
    wiggle: 'animate-wiggle',
    'pop-in': 'animate-pop-in',
    'slide-up': 'animate-slide-up'
  };
  return animationMap[animation];
};

export const getColorValue = (color: string, customColor?: string): string => {
  if (color === 'custom' && customColor) {
    return customColor;
  }
  
  const colorMap = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    coral: 'hsl(var(--coral))',
    sunny: 'hsl(var(--sunny))',
    teal: 'hsl(var(--teal))'
  };
  
  return colorMap[color as keyof typeof colorMap] || 'hsl(var(--primary))';
};

export const buildCharacterClasses = (props: CharacterProps): string => {
  const { className = '', size = 'md', animation = 'none', interactive = false } = props;
  
  return cn(
    getSizeClasses(size),
    getAnimationClasses(animation),
    interactive && 'cursor-pointer hover:scale-105 transition-transform',
    className
  );
};

export const getSizeDimensions = (size: CharacterSize): { width: number; height: number } => {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 }
  };
  return sizeMap[size];
};