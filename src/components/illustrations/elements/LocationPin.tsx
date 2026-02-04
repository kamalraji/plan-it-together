import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface LocationPinProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
}

export const LocationPin = ({
  x = 0,
  y = 0,
  size = 40,
  primaryColor = COLORS.topBlue,
}: LocationPinProps) => {
  const width = size * 0.7;
  const height = size;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Pin shadow */}
      <ellipse
        cx={width / 2}
        cy={height - 4}
        rx={width * 0.3}
        ry={4}
        fill={COLORS.hair}
        opacity="0.15"
      />
      
      {/* Pin body */}
      <path
        d={`
          M ${width / 2} ${height - 8}
          C ${width / 2} ${height - 8} ${width * 0.1} ${height * 0.55} ${width * 0.1} ${height * 0.35}
          A ${width * 0.4} ${width * 0.4} 0 1 1 ${width * 0.9} ${height * 0.35}
          C ${width * 0.9} ${height * 0.55} ${width / 2} ${height - 8} ${width / 2} ${height - 8}
          Z
        `}
        fill={primaryColor}
      />
      
      {/* Inner circle */}
      <circle
        cx={width / 2}
        cy={height * 0.32}
        r={width * 0.22}
        fill={COLORS.white}
      />
    </g>
  );
};
