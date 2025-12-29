import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const CertificateBadgeLC = (props: CharacterProps) => {
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
      viewBox="0 0 100 120"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.2)}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Certificate badge character - Ligne Claire style"
      {...rest}
    >
      {/* Main badge - geometric octagon */}
      <path 
        d="M30 20 L70 20 L80 30 L80 50 L70 60 L30 60 L20 50 L20 30 Z" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Inner circle */}
      <circle 
        cx="50" 
        cy="40" 
        r="18" 
        fill="hsl(var(--teal))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Bold pattern - radiating lines */}
      <g stroke="hsl(var(--coral))" strokeWidth="2.5" strokeLinecap="round">
        <path d="M50 22 L50 28" />
        <path d="M50 52 L50 58" />
        <path d="M32 40 L38 40" />
        <path d="M62 40 L68 40" />
        <path d="M38 28 L42 32" />
        <path d="M58 48 L62 52" />
        <path d="M62 28 L58 32" />
        <path d="M42 48 L38 52" />
      </g>
      
      {/* Center star */}
      <path 
        d="M50 30 L52 36 L58 36 L53 40 L55 46 L50 43 L45 46 L47 40 L42 36 L48 36 Z" 
        fill="hsl(var(--sunny))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      
      {/* Eyes on badge */}
      <circle cx="44" cy="35" r="2" fill="hsl(var(--foreground))" />
      <circle cx="56" cy="35" r="2" fill="hsl(var(--foreground))" />
      
      {/* Proud smile */}
      <path 
        d="M44 45 Q50 50 56 45" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Exaggerated ribbons - geometric shapes */}
      <g stroke="hsl(var(--foreground))" strokeWidth="2.5">
        {/* Left ribbon */}
        <path 
          d="M35 60 L25 70 L25 100 L35 95 L45 100 L45 70 Z" 
          fill="hsl(var(--coral))" 
        />
        
        {/* Right ribbon */}
        <path 
          d="M65 60 L55 70 L55 100 L65 95 L75 100 L75 70 Z" 
          fill="hsl(var(--teal))" 
        />
        
        {/* Ribbon patterns */}
        <path d="M30 75 L40 75" />
        <path d="M30 85 L40 85" />
        <path d="M60 75 L70 75" />
        <path d="M60 85 L70 85" />
      </g>
      
      {/* Achievement text placeholder */}
      <g fill="hsl(var(--foreground))" fontSize="4" fontWeight="bold" textAnchor="middle">
        <text x="50" y="25">#1</text>
      </g>
      
      {/* Decorative corner elements */}
      <g fill="hsl(var(--sunny))" stroke="hsl(var(--foreground))" strokeWidth="2.5">
        <circle cx="25" cy="25" r="3" />
        <circle cx="75" cy="25" r="3" />
        <circle cx="25" cy="55" r="3" />
        <circle cx="75" cy="55" r="3" />
      </g>
      
      {/* Celebration sparkles */}
      <g stroke="hsl(var(--sunny))" strokeWidth="2" strokeLinecap="round">
        <path d="M10 15 L8 10 M6 13 L12 13" />
        <path d="M90 15 L88 10 M86 13 L92 13" />
        <path d="M15 65 L13 60 M11 63 L17 63" />
        <path d="M85 65 L83 60 M81 63 L87 63" />
      </g>
    </svg>
  );
};