import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface CalendarProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
}

export const Calendar = ({
  x = 0,
  y = 0,
  size = 80,
  primaryColor = COLORS.calendar,
}: CalendarProps) => {
  const width = size;
  const height = size * 0.9;
  const cellSize = width / 7;
  const headerHeight = height * 0.25;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Calendar body */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={6}
        fill={COLORS.white}
        stroke={COLORS.lightGray}
        strokeWidth="1"
      />
      
      {/* Header */}
      <rect
        x={0}
        y={0}
        width={width}
        height={headerHeight}
        rx={6}
        fill={primaryColor}
      />
      <rect
        x={0}
        y={headerHeight - 6}
        width={width}
        height={6}
        fill={primaryColor}
      />
      
      {/* Binding rings */}
      <circle cx={width * 0.25} cy={2} r={3} fill={COLORS.hair} />
      <circle cx={width * 0.75} cy={2} r={3} fill={COLORS.hair} />
      
      {/* Date grid - simplified */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3, 4, 5, 6].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={col * cellSize + 2}
            y={headerHeight + row * cellSize + 4}
            width={cellSize - 4}
            height={cellSize - 4}
            rx={2}
            fill={row === 2 && col === 3 ? primaryColor : 'transparent'}
            opacity={row === 2 && col === 3 ? 0.3 : 1}
          />
        ))
      )}
      
      {/* Highlighted date */}
      <circle
        cx={3 * cellSize + cellSize / 2}
        cy={headerHeight + 2 * cellSize + cellSize / 2 + 4}
        r={cellSize / 3}
        fill={primaryColor}
      />
    </g>
  );
};
