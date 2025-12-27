import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const PencilWritingLC = (props: CharacterProps) => {
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
      viewBox="0 0 90 120"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.33)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Pencil writing character - Ligne Claire style"
      {...rest}
    >
      {/* Pencil body - geometric rectangle */}
      <rect 
        x="35" 
        y="20" 
        width="20" 
        height="70" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Bold pattern - stripes */}
      <g stroke="hsl(var(--coral))" strokeWidth="2.5">
        <path d="M35 30 L55 30" />
        <path d="M35 40 L55 40" />
        <path d="M35 50 L55 50" />
        <path d="M35 60 L55 60" />
        <path d="M35 70 L55 70" />
        <path d="M35 80 L55 80" />
      </g>
      
      {/* Pencil tip - triangle */}
      <path 
        d="M35 20 L45 5 L55 20 Z" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Lead tip */}
      <circle 
        cx="45" 
        cy="5" 
        r="2" 
        fill="hsl(var(--foreground))" 
      />
      
      {/* Eraser end */}
      <rect 
        x="38" 
        y="90" 
        width="14" 
        height="12" 
        rx="7" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Metal band */}
      <rect 
        x="35" 
        y="85" 
        width="20" 
        height="8" 
        fill="hsl(var(--primary))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Eyes */}
      <circle cx="40" cy="35" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="50" cy="35" r="2.5" fill="hsl(var(--foreground))" />
      
      {/* Focused smile */}
      <path 
        d="M40 45 Q45 48 50 45" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - writing lines */}
      <g stroke="hsl(var(--teal))" strokeWidth="2.5" strokeLinecap="round">
        <path d="M60 25 L80 20" />
        <path d="M60 35 L85 30" />
        <path d="M60 45 L75 40" />
        <path d="M60 55 L82 50" />
      </g>
      
      {/* Paper corner */}
      <path 
        d="M65 15 L85 10 L85 60 L65 65 Z" 
        fill="white" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
    </svg>
  );
};