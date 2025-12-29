import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const BouncingBallLC = (props: CharacterProps) => {
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
      viewBox="0 0 80 80"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Bouncing ball character - Ligne Claire style"
      {...rest}
    >
      {/* Ball - perfect circle */}
      <circle 
        cx="40" 
        cy="40" 
        r="30" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Bold geometric pattern - segments */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none">
        <path d="M20 25 Q40 15 60 25" />
        <path d="M20 40 L60 40" />
        <path d="M20 55 Q40 65 60 55" />
        <path d="M25 20 Q15 40 25 60" />
        <path d="M55 20 Q65 40 55 60" />
      </g>
      
      {/* Alternating segment colors */}
      <g fill="hsl(var(--coral))" stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <path d="M40 10 Q55 20 60 25 Q50 30 40 25 Q30 30 20 25 Q25 20 40 10 Z" />
        <path d="M40 55 Q55 50 60 55 Q50 60 40 65 Q30 60 20 55 Q25 50 40 55 Z" />
      </g>
      
      {/* Eyes */}
      <circle cx="32" cy="35" r="3" fill="hsl(var(--foreground))" />
      <circle cx="48" cy="35" r="3" fill="hsl(var(--foreground))" />
      
      {/* Happy smile */}
      <path 
        d="M30 45 Q40 52 50 45" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - star sticker */}
      <path 
        d="M55 25 L57 30 L62 30 L58 33 L60 38 L55 35 L50 38 L52 33 L48 30 L53 30 Z" 
        fill="hsl(var(--sunny))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
    </svg>
  );
};