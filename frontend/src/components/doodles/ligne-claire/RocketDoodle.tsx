import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const RocketDoodleLC = (props: CharacterProps) => {
  const {
    className = '',
    size = 'md',
    animation = 'none',
    color = 'primary',
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
      viewBox="0 0 80 120"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.5)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Rocket doodle character - Ligne Claire style"
      {...rest}
    >
      {/* Rocket body - geometric cylinder */}
      <rect 
        x="30" 
        y="30" 
        width="20" 
        height="50" 
        rx="10" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Nose cone - triangle */}
      <path 
        d="M30 30 Q40 10 50 30 Z" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Bold pattern - horizontal stripes */}
      <g stroke="hsl(var(--teal))" strokeWidth="2.5">
        <path d="M30 40 L50 40" />
        <path d="M30 50 L50 50" />
        <path d="M30 60 L50 60" />
        <path d="M30 70 L50 70" />
      </g>
      
      {/* Window - porthole */}
      <circle 
        cx="40" 
        cy="45" 
        r="8" 
        fill="hsl(var(--sunny))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Eyes in window */}
      <circle cx="37" cy="43" r="2" fill="hsl(var(--foreground))" />
      <circle cx="43" cy="43" r="2" fill="hsl(var(--foreground))" />
      
      {/* Excited smile */}
      <path 
        d="M36 47 Q40 50 44 47" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Fins - geometric triangles */}
      <path 
        d="M30 70 L20 85 L30 80 Z" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      <path 
        d="M50 70 L60 85 L50 80 Z" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Exhaust flames - geometric shapes */}
      <g fill="hsl(var(--sunny))" stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <path d="M35 80 L40 95 L45 80 Z" />
        <path d="M32 85 L40 105 L48 85 Z" />
      </g>
      
      {/* Exaggerated accessories - antenna */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <path d="M40 10 L40 5" />
        <circle cx="40" cy="5" r="3" fill="hsl(var(--teal))" />
      </g>
      
      {/* Side boosters */}
      <rect 
        x="20" 
        y="55" 
        width="8" 
        height="20" 
        rx="4" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      <rect 
        x="52" 
        y="55" 
        width="8" 
        height="20" 
        rx="4" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Booster flames */}
      <path d="M22 75 L24 85 L26 75 Z" fill="hsl(var(--coral))" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
      <path d="M54 75 L56 85 L58 75 Z" fill="hsl(var(--coral))" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
    </svg>
  );
};