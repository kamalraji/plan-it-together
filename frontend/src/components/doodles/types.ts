import React from 'react';

export type CharacterStyle = 'original' | 'ligne-claire' | 'hand-drawn';
export type CharacterSize = 'sm' | 'md' | 'lg' | 'xl';
export type CharacterAnimation = 'none' | 'float' | 'bounce' | 'wave' | 'wiggle' | 'pop-in' | 'slide-up';
export type CharacterColor = 'primary' | 'secondary' | 'accent' | 'coral' | 'sunny' | 'teal' | 'custom';

export interface CharacterProps {
  className?: string;
  style?: CharacterStyle;
  size?: CharacterSize;
  animation?: CharacterAnimation;
  color?: CharacterColor;
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
  animations: CharacterAnimation[];
  description: string;
}

export type CharacterComponent = React.ComponentType<CharacterProps>;