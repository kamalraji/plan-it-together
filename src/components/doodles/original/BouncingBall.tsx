import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const BouncingBall = (props: CharacterProps) => {
  const {
    className = '',
    size = 'md',
    animation = 'bounce',
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
      viewBox="0 0 60 60"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Bouncing ball character"
      {...rest}
    >
      <circle 
        cx="30" 
        cy="30" 
        r="25" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      {/* Shine */}
      <circle 
        cx="22" 
        cy="22" 
        r="6" 
        fill="hsl(var(--primary-foreground))" 
        opacity="0.5" 
      />
      {/* Eyes */}
      <circle cx="24" cy="30" r="3" fill="hsl(var(--primary-foreground))" />
      <circle cx="36" cy="30" r="3" fill="hsl(var(--primary-foreground))" />
      {/* Smile */}
      <path 
        d="M24 38 Q30 44 36 38" 
        stroke="hsl(var(--primary-foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none" 
      />
    </svg>
  );
};