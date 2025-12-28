import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const HeartDoodleLC = (props: CharacterProps) => {
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
      viewBox="0 0 80 70"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 0.875)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Heart doodle character - Ligne Claire style"
      {...rest}
    >
      {/* Heart shape - geometric and clean */}
      <path
        d="M40 60 Q20 40 20 25 Q20 10 35 15 Q40 18 40 18 Q40 18 45 15 Q60 10 60 25 Q60 40 40 60 Z"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      
      {/* Bold geometric pattern - concentric hearts */}
      <path
        d="M40 45 Q28 32 28 22 Q28 18 35 20 Q40 22 40 22 Q40 22 45 20 Q52 18 52 22 Q52 32 40 45 Z"
        fill="none"
        stroke="hsl(var(--teal))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      
      {/* Eyes */}
      <circle cx="32" cy="28" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="48" cy="28" r="2.5" fill="hsl(var(--foreground))" />
      
      {/* Loving smile */}
      <path 
        d="M32 35 Q40 40 48 35" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - bow on top */}
      <g fill="hsl(var(--sunny))" stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <path d="M30 15 Q35 10 40 15 Q45 10 50 15 Q45 20 40 18 Q35 20 30 15 Z" />
        <circle cx="40" cy="15" r="3" />
      </g>
      
      {/* Decorative dots around heart */}
      <g fill="hsl(var(--coral))" stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <circle cx="15" cy="30" r="3" />
        <circle cx="65" cy="30" r="3" />
        <circle cx="25" cy="50" r="3" />
        <circle cx="55" cy="50" r="3" />
      </g>
    </svg>
  );
};