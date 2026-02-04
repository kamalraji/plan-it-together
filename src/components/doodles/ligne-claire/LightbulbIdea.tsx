import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const LightbulbIdeaLC = (props: CharacterProps) => {
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
      viewBox="0 0 70 100"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.43)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Lightbulb idea character - Ligne Claire style"
      {...rest}
    >
      {/* Bulb - simplified geometric shape */}
      <path
        d="M35 15 Q50 15 50 30 Q50 45 45 50 L25 50 Q20 45 20 30 Q20 15 35 15 Z"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      
      {/* Bold geometric pattern inside bulb */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none">
        <path d="M25 25 L45 25" />
        <path d="M25 35 L45 35" />
        <path d="M25 45 L45 45" />
      </g>
      
      {/* Base/screw threads - simplified */}
      <rect 
        x="28" 
        y="50" 
        width="14" 
        height="20" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Thread lines */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <path d="M28 55 L42 55" />
        <path d="M28 60 L42 60" />
        <path d="M28 65 L42 65" />
      </g>
      
      {/* Eyes */}
      <circle cx="30" cy="30" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="40" cy="30" r="2.5" fill="hsl(var(--foreground))" />
      
      {/* Excited smile */}
      <path 
        d="M28 38 Q35 44 42 38" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - radiating lines for brightness */}
      <g stroke="hsl(var(--coral))" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10 20 L15 25" />
        <path d="M10 35 L15 35" />
        <path d="M10 50 L15 45" />
        <path d="M60 20 L55 25" />
        <path d="M60 35 L55 35" />
        <path d="M60 50 L55 45" />
        <path d="M25 5 L30 10" />
        <path d="M35 5 L35 10" />
        <path d="M45 5 L40 10" />
      </g>
      
      {/* Bottom cap */}
      <rect 
        x="25" 
        y="70" 
        width="20" 
        height="8" 
        rx="4" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
    </svg>
  );
};