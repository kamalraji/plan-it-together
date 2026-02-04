import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const CalendarDoodleLC = (props: CharacterProps) => {
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
      viewBox="0 0 90 100"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.11)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Calendar doodle character - Ligne Claire style"
      {...rest}
    >
      {/* Calendar base - geometric rectangle */}
      <rect 
        x="15" 
        y="25" 
        width="60" 
        height="65" 
        rx="5" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Header section */}
      <rect 
        x="15" 
        y="25" 
        width="60" 
        height="15" 
        rx="5" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Spiral binding holes */}
      <g fill="hsl(var(--foreground))">
        <circle cx="25" cy="15" r="3" />
        <circle cx="35" cy="15" r="3" />
        <circle cx="45" cy="15" r="3" />
        <circle cx="55" cy="15" r="3" />
        <circle cx="65" cy="15" r="3" />
      </g>
      
      {/* Binding rings */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none">
        <circle cx="25" cy="20" r="4" />
        <circle cx="35" cy="20" r="4" />
        <circle cx="45" cy="20" r="4" />
        <circle cx="55" cy="20" r="4" />
        <circle cx="65" cy="20" r="4" />
      </g>
      
      {/* Calendar grid - bold geometric pattern */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        {/* Vertical lines */}
        <path d="M25 40 L25 85" />
        <path d="M35 40 L35 85" />
        <path d="M45 40 L45 85" />
        <path d="M55 40 L55 85" />
        <path d="M65 40 L65 85" />
        
        {/* Horizontal lines */}
        <path d="M15 50 L75 50" />
        <path d="M15 60 L75 60" />
        <path d="M15 70 L75 70" />
        <path d="M15 80 L75 80" />
      </g>
      
      {/* Important date highlight */}
      <rect 
        x="46" 
        y="51" 
        width="8" 
        height="8" 
        fill="hsl(var(--sunny))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Eyes */}
      <circle cx="35" cy="32" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="55" cy="32" r="2.5" fill="hsl(var(--foreground))" />
      
      {/* Organized smile */}
      <path 
        d="M35 35 Q45 38 55 35" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - sticky notes */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <rect x="78" y="45" width="10" height="10" fill="hsl(var(--coral))" />
        <rect x="78" y="60" width="10" height="10" fill="hsl(var(--sunny))" />
        <rect x="5" y="55" width="8" height="8" fill="hsl(var(--teal))" />
      </g>
      
      {/* Date numbers - bold typography */}
      <g fill="hsl(var(--foreground))" fontSize="8" fontWeight="bold" textAnchor="middle">
        <text x="20" y="47">1</text>
        <text x="30" y="47">2</text>
        <text x="40" y="47">3</text>
        <text x="50" y="57">15</text>
        <text x="60" y="67">25</text>
      </g>
      
      {/* Checkmark on important date */}
      <path 
        d="M47 55 L49 57 L53 53" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none" 
      />
    </svg>
  );
};