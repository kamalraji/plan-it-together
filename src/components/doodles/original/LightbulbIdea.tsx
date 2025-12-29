import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const LightbulbIdea = (props: CharacterProps) => {
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
      viewBox="0 0 60 80"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.33)} // Maintain aspect ratio
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Lightbulb idea character"
      {...rest}
    >
      {/* Bulb */}
      <path
        d="M30 5 C15 5 5 18 5 30 C5 42 18 48 18 55 L42 55 C42 48 55 42 55 30 C55 18 45 5 30 5"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Base */}
      <rect 
        x="18" 
        y="55" 
        width="24" 
        height="8" 
        rx="2" 
        fill="hsl(var(--muted))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      <rect 
        x="22" 
        y="63" 
        width="16" 
        height="6" 
        rx="2" 
        fill="hsl(var(--muted))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      {/* Sparkles */}
      <path 
        d="M30 0 L30 -8 M50 10 L58 5 M60 30 L68 30 M10 10 L2 5 M0 30 L-8 30" 
        stroke={fillColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
};