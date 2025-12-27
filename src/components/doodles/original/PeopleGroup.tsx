import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions } from '../utils';

export const PeopleGroup = (props: CharacterProps) => {
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
      viewBox="0 0 120 80"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={Math.round(dimensions.width * 1.5)} // Maintain aspect ratio
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="People group character"
      {...rest}
    >
      {/* Person 1 */}
      <circle 
        cx="30" 
        cy="25" 
        r="12" 
        fill="hsl(var(--coral))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      <path 
        d="M30 37 L30 55" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M30 42 L20 52" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M30 42 L40 52" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M30 55 L22 70" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M30 55 L38 70" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      
      {/* Person 2 (center, slightly higher) */}
      <circle 
        cx="60" 
        cy="20" 
        r="14" 
        fill="hsl(var(--secondary))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      <path 
        d="M60 34 L60 55" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M60 40 L48 50" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M60 40 L72 50" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M60 55 L50 72" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M60 55 L70 72" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      
      {/* Person 3 */}
      <circle 
        cx="90" 
        cy="25" 
        r="12" 
        fill="hsl(var(--sunny))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      <path 
        d="M90 37 L90 55" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M90 42 L80 52" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M90 42 L100 52" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M90 55 L82 70" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M90 55 L98 70" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
};