import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const ConfettiLC = (props: CharacterProps) => {
  const {
    className = '',
    size = 'md',
    animation = 'none',
    color = 'coral',
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
      viewBox="0 0 100 100"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Confetti character - Ligne Claire style"
      {...rest}
    >
      {/* Main confetti piece - geometric diamond */}
      <path 
        d="M50 20 L65 35 L50 50 L35 35 Z" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Bold pattern inside main piece */}
      <g stroke="hsl(var(--teal))" strokeWidth="2.5">
        <path d="M42 35 L58 35" />
        <path d="M50 27 L50 43" />
      </g>
      
      {/* Eyes on main piece */}
      <circle cx="46" cy="32" r="2" fill="hsl(var(--foreground))" />
      <circle cx="54" cy="32" r="2" fill="hsl(var(--foreground))" />
      
      {/* Happy smile */}
      <path 
        d="M46 38 Q50 42 54 38" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Surrounding confetti pieces - geometric shapes */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        {/* Triangles */}
        <path d="M20 25 L30 15 L30 35 Z" fill="hsl(var(--sunny))" />
        <path d="M75 60 L85 50 L85 70 Z" fill="hsl(var(--coral))" />
        
        {/* Squares */}
        <rect x="15" y="60" width="15" height="15" fill="hsl(var(--teal))" />
        <rect x="70" y="20" width="12" height="12" fill="hsl(var(--sunny))" />
        
        {/* Circles */}
        <circle cx="25" cy="80" r="8" fill="hsl(var(--coral))" />
        <circle cx="80" cy="80" r="6" fill="hsl(var(--teal))" />
        
        {/* Stars */}
        <path d="M85 35 L87 40 L92 40 L88 43 L90 48 L85 45 L80 48 L82 43 L78 40 L83 40 Z" fill="hsl(var(--sunny))" />
        <path d="M15 40 L17 45 L22 45 L18 48 L20 53 L15 50 L10 53 L12 48 L8 45 L13 45 Z" fill="hsl(var(--coral))" />
      </g>
      
      {/* Exaggerated accessories - party streamers */}
      <g stroke="hsl(var(--teal))" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M30 10 Q40 5 50 10 Q60 15 70 10" />
        <path d="M20 90 Q30 85 40 90 Q50 95 60 90 Q70 85 80 90" />
      </g>
      
      {/* Motion lines */}
      <g stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <path d="M10 30 L5 25" />
        <path d="M90 70 L95 65" />
        <path d="M30 5 L25 0" />
        <path d="M70 95 L75 100" />
      </g>
    </svg>
  );
};