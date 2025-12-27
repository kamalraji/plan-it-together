import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const FloatingCloudLC = (props: CharacterProps) => {
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
  const fillColor = getColorValue(color, customColor);

  return (
    <svg
      viewBox="0 0 100 70"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 0.7)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Floating cloud character - Ligne Claire style"
      {...rest}
    >
      {/* Cloud base - simplified geometric shape */}
      <path
        d="M25 45 Q15 35 25 25 Q35 15 50 20 Q65 15 75 25 Q85 35 75 45 Q70 55 50 50 Q30 55 25 45 Z"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      
      {/* Bold pattern - geometric shapes */}
      <g fill="hsl(var(--teal))" stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <circle cx="35" cy="35" r="4" />
        <circle cx="50" cy="30" r="4" />
        <circle cx="65" cy="35" r="4" />
      </g>
      
      {/* Eyes */}
      <circle cx="42" cy="32" r="2.5" fill="hsl(var(--foreground))" />
      <circle cx="58" cy="32" r="2.5" fill="hsl(var(--foreground))" />
      
      {/* Peaceful smile */}
      <path 
        d="M45 40 Q50 44 55 40" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated accessories - sunglasses on top */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="hsl(var(--coral))">
        <ellipse cx="42" cy="25" rx="6" ry="4" />
        <ellipse cx="58" cy="25" rx="6" ry="4" />
        <path d="M48 25 L52 25" fill="none" />
      </g>
    </svg>
  );
};