import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const HappyStarLC = (props: CharacterProps) => {
  const {
    className = '',
    size = 'md',
    animation = 'none',
    color = 'sunny',
    customColor,
    interactive = false,
    onClick,
    ...rest
  } = props;

  const dimensions = getSizeDimensions(size);
  const characterClasses = buildCharacterClasses(props);
  const fillColor = getColorValue(color, customColor);

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Happy star character - Ligne Claire style"
      {...rest}
    >
      {/* Star shape with consistent line weight */}
      <path
        d="M40 8 L45 26 L65 26 L50 38 L55 58 L40 48 L25 58 L30 38 L15 26 L35 26 Z"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      
      {/* Bold pattern on star - stripes */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <path d="M35 20 L45 20" />
        <path d="M32 30 L48 30" />
        <path d="M35 40 L45 40" />
      </g>
      
      {/* Eyes */}
      <circle cx="35" cy="32" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="45" cy="32" r="2.5" fill="hsl(var(--foreground))" />
      
      {/* Simple smile */}
      <path 
        d="M35 42 Q40 46 45 42" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - bow tie */}
      <path 
        d="M32 48 L40 52 L48 48 L40 56 Z" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      <circle 
        cx="40" 
        cy="52" 
        r="2" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
    </svg>
  );
};