export type IllustrationSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type IllustrationVariant = 'light' | 'dark';
export type IllustrationAnimation = 'none' | 'float' | 'subtle';

export interface IllustrationProps {
  className?: string;
  size?: IllustrationSize;
  variant?: IllustrationVariant;
  showBackground?: boolean;
  primaryColor?: string;
  accentColor?: string;
  animation?: IllustrationAnimation;
}

export interface ElementProps {
  className?: string;
  primaryColor?: string;
  accentColor?: string;
}
