import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const RocketDoodle = (props: CharacterProps) => {
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
  const fillColor = color === 'primary' ? 'hsl(var(--card))' : getColorValue(color, customColor);

  return (
    <svg
      viewBox="0 0 60 80"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.33)} // Maintain aspect ratio
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Rocket character"
      {...rest}
    >
      {/* Rocket body */}
      <path
        d="M30 5 C20 15 15 35 15 55 L45 55 C45 35 40 15 30 5"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Window */}
      <circle 
        cx="30" 
        cy="30" 
        r="8" 
        fill="hsl(var(--secondary))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      <circle 
        cx="28" 
        cy="28" 
        r="3" 
        fill="hsl(var(--primary-foreground))" 
        opacity="0.6" 
      />
      {/* Fins */}
      <path 
        d="M15 55 L5 65 L15 60" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      <path 
        d="M45 55 L55 65 L45 60" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      {/* Flame */}
      <path 
        d="M22 55 L30 75 L38 55" 
        fill="hsl(var(--sunny))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      <path d="M26 55 L30 68 L34 55" fill="hsl(var(--coral))" />
    </svg>
  );
};