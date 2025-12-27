import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const TrophyDoodleLC = (props: CharacterProps) => {
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
      viewBox="0 0 90 110"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.22)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Trophy doodle character - Ligne Claire style"
      {...rest}
    >
      {/* Trophy cup - geometric bowl shape */}
      <path 
        d="M25 35 Q25 20 45 20 Q65 20 65 35 Q65 50 45 55 Q25 50 25 35 Z" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Bold pattern on cup - geometric segments */}
      <g stroke="hsl(var(--teal))" strokeWidth="2.5" fill="none">
        <path d="M30 30 L60 30" />
        <path d="M28 40 L62 40" />
        <path d="M32 50 L58 50" />
      </g>
      
      {/* Handles - geometric curves */}
      <path 
        d="M25 30 Q15 30 15 40 Q15 50 25 50" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        fill="none" 
      />
      <path 
        d="M65 30 Q75 30 75 40 Q75 50 65 50" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        fill="none" 
      />
      
      {/* Stem - geometric cylinder */}
      <rect 
        x="40" 
        y="55" 
        width="10" 
        height="25" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Base - geometric platform */}
      <rect 
        x="30" 
        y="80" 
        width="30" 
        height="15" 
        rx="7" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Eyes */}
      <circle cx="38" cy="35" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="52" cy="35" r="2.5" fill="hsl(var(--foreground))" />
      
      {/* Proud smile */}
      <path 
        d="M36 42 Q45 48 54 42" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - winner's ribbon */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <path d="M20 15 Q25 10 30 15 L30 25 Q25 30 20 25 Z" fill="hsl(var(--coral))" />
        <path d="M60 15 Q65 10 70 15 L70 25 Q65 30 60 25 Z" fill="hsl(var(--sunny))" />
        
        {/* Ribbon tails */}
        <path d="M20 25 L15 35 L25 30 Z" fill="hsl(var(--coral))" />
        <path d="M70 25 L75 35 L65 30 Z" fill="hsl(var(--sunny))" />
      </g>
      
      {/* Star on trophy */}
      <path 
        d="M45 25 L46 28 L49 28 L47 30 L48 33 L45 31 L42 33 L43 30 L41 28 L44 28 Z" 
        fill="hsl(var(--sunny))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Base inscription plate */}
      <rect 
        x="32" 
        y="85" 
        width="26" 
        height="5" 
        fill="white" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Celebration sparkles */}
      <g stroke="hsl(var(--sunny))" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10 25 L8 20 M6 23 L12 23" />
        <path d="M80 35 L78 30 M76 33 L82 33" />
        <path d="M15 60 L13 55 M11 58 L17 58" />
        <path d="M75 65 L73 60 M71 63 L77 63" />
      </g>
    </svg>
  );
};