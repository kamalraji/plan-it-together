import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface AnalogClockProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
}

export const AnalogClock = ({
  x = 0,
  y = 0,
  size = 80,
  primaryColor = COLORS.clockHands,
}: AnalogClockProps) => {
  const radius = size / 2;
  const cx = x + radius;
  const cy = y + radius;

  return (
    <g>
      {/* Clock face */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={COLORS.clock}
        stroke={COLORS.white}
        strokeWidth="2"
      />
      {/* Hour marks */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const innerR = radius * 0.8;
        const outerR = radius * 0.9;
        return (
          <line
            key={angle}
            x1={cx + innerR * Math.sin(rad)}
            y1={cy - innerR * Math.cos(rad)}
            x2={cx + outerR * Math.sin(rad)}
            y2={cy - outerR * Math.cos(rad)}
            stroke={COLORS.hair}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
      {/* Hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + radius * 0.4 * Math.sin(Math.PI / 3)}
        y2={cy - radius * 0.4 * Math.cos(Math.PI / 3)}
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx}
        y2={cy - radius * 0.65}
        stroke={primaryColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="4" fill={primaryColor} />
    </g>
  );
};
