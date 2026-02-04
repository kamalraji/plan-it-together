import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const PeopleGroupLC = (props: CharacterProps) => {
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
      viewBox="0 0 120 100"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 0.83)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="People group character - Ligne Claire style"
      {...rest}
    >
      {/* Person 1 - Left */}
      <g>
        {/* Head */}
        <circle 
          cx="25" 
          cy="25" 
          r="15" 
          fill={fillColor} 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
        
        {/* Exaggerated glasses */}
        <g stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none">
          <circle cx="20" cy="23" r="5" />
          <circle cx="30" cy="23" r="5" />
          <path d="M25 23 L25 23" />
        </g>
        
        {/* Eyes */}
        <circle cx="20" cy="23" r="1.5" fill="hsl(var(--foreground))" />
        <circle cx="30" cy="23" r="1.5" fill="hsl(var(--foreground))" />
        
        {/* Smile */}
        <path 
          d="M20 28 Q25 32 30 28" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        {/* Body - geometric rectangle */}
        <rect 
          x="15" 
          y="40" 
          width="20" 
          height="30" 
          rx="3" 
          fill="hsl(var(--teal))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
        
        {/* Arms */}
        <path 
          d="M15 50 L5 60" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M35 50 L45 45" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Legs */}
        <path 
          d="M20 70 L20 85" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M30 70 L30 85" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
      </g>
      
      {/* Person 2 - Center (taller) */}
      <g>
        {/* Head */}
        <circle 
          cx="60" 
          cy="20" 
          r="18" 
          fill="hsl(var(--sunny))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
        
        {/* Exaggerated hat */}
        <path 
          d="M42 15 Q60 5 78 15 Q75 10 60 8 Q45 10 42 15 Z" 
          fill="hsl(var(--coral))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
        
        {/* Eyes */}
        <circle cx="54" cy="18" r="2" fill="hsl(var(--foreground))" />
        <circle cx="66" cy="18" r="2" fill="hsl(var(--foreground))" />
        
        {/* Smile */}
        <path 
          d="M52 25 Q60 30 68 25" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        {/* Body - geometric rectangle */}
        <rect 
          x="45" 
          y="38" 
          width="30" 
          height="35" 
          rx="4" 
          fill="hsl(var(--primary))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
        
        {/* Bold pattern - stripes */}
        <g stroke="hsl(var(--teal))" strokeWidth="2.5">
          <path d="M45 45 L75 45" />
          <path d="M45 55 L75 55" />
          <path d="M45 65 L75 65" />
        </g>
        
        {/* Arms */}
        <path 
          d="M45 48 L30 55" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M75 48 L90 55" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Legs */}
        <path 
          d="M52 73 L52 90" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M68 73 L68 90" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
      </g>
      
      {/* Person 3 - Right */}
      <g>
        {/* Head */}
        <circle 
          cx="95" 
          cy="25" 
          r="15" 
          fill="hsl(var(--teal))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
        
        {/* Exaggerated hair/bow */}
        <g fill="hsl(var(--coral))" stroke="hsl(var(--foreground))" strokeWidth="2.5">
          <path d="M85 15 Q95 8 105 15 Q100 20 95 18 Q90 20 85 15 Z" />
          <circle cx="95" cy="15" r="3" />
        </g>
        
        {/* Eyes */}
        <circle cx="90" cy="23" r="1.5" fill="hsl(var(--foreground))" />
        <circle cx="100" cy="23" r="1.5" fill="hsl(var(--foreground))" />
        
        {/* Smile */}
        <path 
          d="M90 28 Q95 32 100 28" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        {/* Body - geometric rectangle */}
        <rect 
          x="85" 
          y="40" 
          width="20" 
          height="30" 
          rx="3" 
          fill="hsl(var(--sunny))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
        
        {/* Arms */}
        <path 
          d="M85 50 L75 45" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M105 50 L115 60" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Legs */}
        <path 
          d="M90 70 L90 85" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        <path 
          d="M100 70 L100 85" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
      </g>
      
      {/* Exaggerated accessories - team banner */}
      <rect 
        x="40" 
        y="85" 
        width="40" 
        height="12" 
        rx="2" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Banner text placeholder */}
      <g fill="hsl(var(--foreground))" fontSize="6" fontWeight="bold" textAnchor="middle">
        <text x="60" y="93">TEAM</text>
      </g>
    </svg>
  );
};