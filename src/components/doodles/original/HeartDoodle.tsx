import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const HeartDoodle = (props: CharacterProps) => {
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
      viewBox="0 0 60 55"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={Math.round(dimensions.width * 1.09)} // Maintain aspect ratio
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Heart character"
      {...rest}
    >
      <path
        d="M30 50 C10 35 0 20 10 10 C20 0 30 8 30 15 C30 8 40 0 50 10 C60 20 50 35 30 50"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Shine */}
      <circle 
        cx="18" 
        cy="18" 
        r="4" 
        fill="hsl(var(--primary-foreground))" 
        opacity="0.6" 
      />
    </svg>
  );
};