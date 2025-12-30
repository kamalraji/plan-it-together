import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const FloatingCloud = (props: CharacterProps) => {
  const {
    className = '',
    size = 'md',
    animation = 'float',
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
      viewBox="0 0 100 60"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={Math.round(dimensions.width * 1.67)} // Maintain aspect ratio
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Floating cloud character"
      {...rest}
    >
      <path
        d="M25 45 C10 45 5 35 15 25 C10 15 25 5 40 15 C50 5 70 5 75 20 C95 20 95 40 80 45 Z"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Eyes */}
      <circle cx="40" cy="30" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="55" cy="30" r="2.5" fill="hsl(var(--foreground))" />
      {/* Smile */}
      <path 
        d="M42 38 Q48 43 54 38" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none" 
      />
    </svg>
  );
};