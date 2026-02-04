import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const Confetti = (props: CharacterProps) => {
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

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Confetti celebration character"
      {...rest}
    >
      <rect 
        x="10" 
        y="20" 
        width="8" 
        height="8" 
        rx="1" 
        fill="hsl(var(--coral))" 
        transform="rotate(15 14 24)" 
      />
      <rect 
        x="80" 
        y="15" 
        width="6" 
        height="6" 
        rx="1" 
        fill="hsl(var(--sunny))" 
        transform="rotate(-20 83 18)" 
      />
      <rect 
        x="50" 
        y="10" 
        width="7" 
        height="7" 
        rx="1" 
        fill="hsl(var(--secondary))" 
        transform="rotate(30 53.5 13.5)" 
      />
      <rect 
        x="25" 
        y="70" 
        width="6" 
        height="6" 
        rx="1" 
        fill="hsl(var(--sunny))" 
        transform="rotate(-10 28 73)" 
      />
      <rect 
        x="70" 
        y="60" 
        width="8" 
        height="8" 
        rx="1" 
        fill="hsl(var(--coral))" 
        transform="rotate(25 74 64)" 
      />
      <circle cx="15" cy="50" r="4" fill="hsl(var(--secondary))" />
      <circle cx="85" cy="45" r="3" fill="hsl(var(--coral))" />
      <circle cx="45" cy="80" r="5" fill="hsl(var(--sunny))" />
      <path d="M60 30 L65 20 L70 30 L60 30" fill="hsl(var(--secondary))" />
      <path d="M30 40 L35 30 L40 40 L30 40" fill="hsl(var(--coral))" />
    </svg>
  );
};