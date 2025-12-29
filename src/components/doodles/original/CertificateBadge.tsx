import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const CertificateBadge = (props: CharacterProps) => {
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
      viewBox="0 0 70 90"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.29)} // Maintain aspect ratio
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Certificate badge character"
      {...rest}
    >
      {/* Badge circle */}
      <circle 
        cx="35" 
        cy="35" 
        r="30" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      <circle 
        cx="35" 
        cy="35" 
        r="22" 
        fill="hsl(var(--card))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      {/* Star in center */}
      <path 
        d="M35 18 L38 28 L48 28 L40 34 L43 44 L35 38 L27 44 L30 34 L22 28 L32 28 Z" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="1.5" 
      />
      {/* Ribbons */}
      <path 
        d="M20 60 L25 85 L30 70 L35 85 L30 60" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      <path 
        d="M50 60 L45 85 L40 70 L35 85 L40 60" 
        fill="hsl(var(--secondary))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};