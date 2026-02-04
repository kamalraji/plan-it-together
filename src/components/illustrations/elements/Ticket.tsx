import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface TicketProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
}

export const Ticket = ({
  x = 0,
  y = 0,
  size = 80,
  primaryColor = COLORS.ticket,
}: TicketProps) => {
  const width = size;
  const height = size * 0.5;
  const notchRadius = 8;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Ticket body with notches */}
      <path
        d={`
          M ${notchRadius} 0
          L ${width - notchRadius} 0
          A ${notchRadius} ${notchRadius} 0 0 1 ${width - notchRadius} ${notchRadius * 2}
          L ${width - notchRadius} ${height - notchRadius * 2}
          A ${notchRadius} ${notchRadius} 0 0 1 ${width - notchRadius} ${height}
          L ${notchRadius} ${height}
          A ${notchRadius} ${notchRadius} 0 0 1 ${notchRadius} ${height - notchRadius * 2}
          L ${notchRadius} ${notchRadius * 2}
          A ${notchRadius} ${notchRadius} 0 0 1 ${notchRadius} 0
          Z
        `}
        fill={primaryColor}
      />
      
      {/* Ticket stub divider */}
      <line
        x1={width * 0.7}
        y1={4}
        x2={width * 0.7}
        y2={height - 4}
        stroke={COLORS.white}
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      
      {/* Decorative lines */}
      <line
        x1={width * 0.15}
        y1={height * 0.35}
        x2={width * 0.55}
        y2={height * 0.35}
        stroke={COLORS.white}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1={width * 0.15}
        y1={height * 0.55}
        x2={width * 0.45}
        y2={height * 0.55}
        stroke={COLORS.white}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      {/* Star on stub */}
      <circle
        cx={width * 0.85}
        cy={height * 0.5}
        r={6}
        fill={COLORS.white}
      />
    </g>
  );
};
