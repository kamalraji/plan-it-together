import { CharacterProps } from '../types';
import { buildCharacterClasses, getSizeDimensions, getColorValue } from '../utils';

export const CalendarDoodle = (props: CharacterProps) => {
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
      viewBox="0 0 70 70"
      fill="none"
      className={characterClasses}
      xmlns="http://www.w3.org/2000/svg"
      width={dimensions.width}
      height={dimensions.height}
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label="Calendar character"
      {...rest}
    >
      {/* Calendar body */}
      <rect 
        x="5" 
        y="15" 
        width="60" 
        height="50" 
        rx="5" 
        fill="hsl(var(--card))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      {/* Header */}
      <rect 
        x="5" 
        y="15" 
        width="60" 
        height="15" 
        rx="5" 
        fill={fillColor} 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2.5" 
      />
      {/* Rings */}
      <rect 
        x="18" 
        y="8" 
        width="6" 
        height="14" 
        rx="2" 
        fill="hsl(var(--muted))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      <rect 
        x="46" 
        y="8" 
        width="6" 
        height="14" 
        rx="2" 
        fill="hsl(var(--muted))" 
        stroke="hsl(var(--foreground))" 
        strokeWidth="2" 
      />
      {/* Date */}
      <text 
        x="35" 
        y="50" 
        textAnchor="middle" 
        fontSize="20" 
        fontWeight="bold" 
        fill="hsl(var(--foreground))"
      >
        12
      </text>
    </svg>
  );
};