import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface BarChartProps extends ElementProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export const BarChart = ({
  x = 0,
  y = 0,
  width = 100,
  height = 80,
  accentColor = COLORS.chartAccent,
}: BarChartProps) => {
  const barWidth = width / 6;
  const gap = barWidth * 0.3;
  const heights = [0.4, 0.7, 0.5, 0.9, 0.6];

  return (
    <g>
      {/* Background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="8"
        fill={COLORS.white}
        opacity="0.9"
      />
      {/* Bars */}
      {heights.map((h, i) => {
        const barHeight = height * h * 0.7;
        const barX = x + gap + i * (barWidth + gap);
        const barY = y + height - barHeight - 10;
        const isAccent = i === 3; // Highlight the tallest bar

        return (
          <rect
            key={i}
            x={barX}
            y={barY}
            width={barWidth}
            height={barHeight}
            rx="3"
            fill={isAccent ? accentColor : COLORS.chartBar}
          />
        );
      })}
    </g>
  );
};
