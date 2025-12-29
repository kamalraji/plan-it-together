// Design System Types
// TypeScript interfaces and types for the merged design system

export type CharacterStyle = 'original' | 'ligne-claire' | 'hand-drawn';

export interface CharacterProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animation?: 'none' | 'float' | 'bounce' | 'wave' | 'wiggle';
  color?: 'primary' | 'secondary' | 'accent' | 'custom';
  customColor?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  category: 'person' | 'object' | 'nature' | 'symbol' | 'celebration';
  variants: {
    original: React.ComponentType<CharacterProps>;
    ligneClaire: React.ComponentType<CharacterProps>;
    handDrawn: React.ComponentType<CharacterProps>;
  };
  defaultProps: Partial<CharacterProps>;
  animations: string[];
  description: string;
}

export interface DesignTokens {
  colors: {
    coral: string;
    coralLight: string;
    teal: string;
    tealLight: string;
    sunny: string;
    lavender: string;
    mint: string;
    cream: string;
  };
  
  animations: {
    float: string;
    bounceGentle: string;
    wave: string;
    wiggle: string;
    popIn: string;
    slideUp: string;
  };
  
  shadows: {
    soft: string;
    doodle: string;
    float: string;
  };
  
  typography: {
    fontFamily: string;
    weights: Record<string, number>;
  };
}