import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const TrophyDoodle = (props: CharacterProps) => {
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
      viewBox="0 0 70 80"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.14)} // Maintain aspect ratio
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Trophy character"
      {...rest}
    >
      {/* Cup */}
      <path
        d="M15 10 L15 35 C15 50 25 55 35 55 C45 55 55 50 55 35 L55 10 Z"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Handles */}
      <path 
        d="M15 15 C5 15 5 30 15 30" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        fill="none" 
      />
      <path 
        d="M55 15 C65 15 65 30 55 30" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        fill="none" 
      />
      {/* Stem */}
      <rect 
        x="30" 
        y="55" 
        width="10" 
        height="10" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      {/* Base */}
      <rect 
        x="20" 
        y="65" 
        width="30" 
        height="8" 
        rx="2" 
        fill="hsl(var(--muted))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      {/* Star */}
      <path 
        d="M35 25 L37 30 L42 30 L38 34 L40 39 L35 36 L30 39 L32 34 L28 30 L33 30 Z" 
        fill="hsl(var(--foreground))" 
      />
    </svg>
  );
};