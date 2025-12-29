import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const HappyStar = (props: CharacterProps) => {
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
      aria-label="Happy star character"
      {...rest}
    >
      <path
        d="M40 5 L47 28 L72 28 L52 44 L58 68 L40 54 L22 68 L28 44 L8 28 L33 28 Z"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Eyes */}
      <circle cx="34" cy="35" r="3" fill="hsl(var(--foreground))" />
      <circle cx="46" cy="35" r="3" fill="hsl(var(--foreground))" />
      {/* Smile */}
      <path 
        d="M34 44 Q40 50 46 44" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none" 
      />
    </svg>
  );
};