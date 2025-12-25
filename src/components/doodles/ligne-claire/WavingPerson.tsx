import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const WavingPersonLC = (props: CharacterProps) => {
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
      viewBox="0 0 120 140"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.17)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Waving person character - Ligne Claire style"
      {...rest}
    >
      {/* Head - rounder shape */}
      <circle 
        cx="60" 
        cy="30" 
        r="24" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      
      {/* Exaggerated glasses */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none">
        <circle cx="50" cy="28" r="8" />
        <circle cx="70" cy="28" r="8" />
        <path d="M58 28 L62 28" />
        <path d="M42 28 L35 25" />
        <path d="M78 28 L85 25" />
      </g>
      
      {/* Eyes behind glasses */}
      <circle cx="50" cy="28" r="2" fill="hsl(var(--foreground))" />
      <circle cx="70" cy="28" r="2" fill="hsl(var(--foreground))" />
      
      {/* Simple smile */}
      <path 
        d="M52 38 Q60 44 68 38" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Body - simple rectangle */}
      <rect 
        x="45" 
        y="54" 
        width="30" 
        height="36" 
        rx="4" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Left arm (waving) */}
      <g className="animate-wave" style={{ transformOrigin: "35px 65px" }}>
        <path 
          d="M45 60 L30 50 L20 30" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Hand */}
        <circle 
          cx="20" 
          cy="30" 
          r="7" 
          fill={fillColor} 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2.5" 
        />
      </g>
      
      {/* Right arm */}
      <path 
        d="M75 60 L90 70" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <circle 
        cx="90" 
        cy="70" 
        r="7" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Legs */}
      <path 
        d="M52 90 L52 115" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M68 90 L68 115" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      
      {/* Exaggerated chunky sneakers */}
      <ellipse 
        cx="52" 
        cy="125" 
        rx="12" 
        ry="8" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      <ellipse 
        cx="68" 
        cy="125" 
        rx="12" 
        ry="8" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Shoe details */}
      <path d="M44 125 L60 125" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
      <path d="M60 125 L76 125" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
    </svg>
  );
};