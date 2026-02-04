import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const PencilWriting = (props: CharacterProps) => {
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
      viewBox="0 0 80 80"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Pencil writing character"
      {...rest}
    >
      <g transform="rotate(-45 40 40)">
        {/* Pencil body */}
        <rect 
          x="35" 
          y="10" 
          width="10" 
          height="50" 
          rx="1" 
          fill={fillColor} 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2" 
        />
        {/* Eraser */}
        <rect 
          x="35" 
          y="5" 
          width="10" 
          height="8" 
          rx="2" 
          fill="hsl(var(--coral))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2" 
        />
        {/* Tip */}
        <polygon 
          points="35,60 45,60 40,72" 
          fill="hsl(var(--muted))" 
          stroke="hsl(var(--foreground))" 
          strokeWidth="2" 
          strokeLinejoin="round" 
        />
        <polygon points="38,65 42,65 40,72" fill="hsl(var(--foreground))" />
      </g>
      {/* Writing lines */}
      <path 
        d="M55 70 Q62 68 70 70" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.5" 
      />
      <path 
        d="M58 75 Q64 73 72 75" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.3" 
      />
    </svg>
  );
};