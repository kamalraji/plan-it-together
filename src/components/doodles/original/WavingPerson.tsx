import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const WavingPerson = (props: CharacterProps) => {
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
      height={Math.round(dimensions.height * 1.17)} // Maintain aspect ratio
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Waving person character"
      {...rest}
    >
      {/* Head */}
      <circle 
        cx="60" 
        cy="30" 
        r="22" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      {/* Eyes */}
      <circle cx="52" cy="28" r="3" fill="hsl(var(--foreground))" />
      <circle cx="68" cy="28" r="3" fill="hsl(var(--foreground))" />
      {/* Smile */}
      <path 
        d="M50 38 Q60 48 70 38" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />
      {/* Body */}
      <path 
        d="M60 52 L60 90" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      {/* Left arm (waving) */}
      <g className="animate-wave" style={{ transformOrigin: "40px 65px" }}>
        <path 
          d="M60 60 L35 50 L25 30" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Hand */}
        <circle 
          cx="25" 
          cy="30" 
          r="6" 
          fill={fillColor} 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2" 
        />
      </g>
      {/* Right arm */}
      <path 
        d="M60 60 L85 75" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      {/* Legs */}
      <path 
        d="M60 90 L45 125" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      <path 
        d="M60 90 L75 125" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
  );
};