import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface NotificationBellProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
  showDot?: boolean;
}

export const NotificationBell = ({
  x = 0,
  y = 0,
  size = 50,
  primaryColor = COLORS.topBlue,
  showDot = true,
}: NotificationBellProps) => {
  const width = size;
  const height = size;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Bell body */}
      <path
        d={`
          M ${width * 0.5} ${height * 0.1}
          C ${width * 0.3} ${height * 0.1} ${width * 0.15} ${height * 0.3} ${width * 0.15} ${height * 0.55}
          L ${width * 0.15} ${height * 0.7}
          L ${width * 0.05} ${height * 0.75}
          L ${width * 0.05} ${height * 0.8}
          L ${width * 0.95} ${height * 0.8}
          L ${width * 0.95} ${height * 0.75}
          L ${width * 0.85} ${height * 0.7}
          L ${width * 0.85} ${height * 0.55}
          C ${width * 0.85} ${height * 0.3} ${width * 0.7} ${height * 0.1} ${width * 0.5} ${height * 0.1}
          Z
        `}
        fill={primaryColor}
      />
      
      {/* Bell top */}
      <circle
        cx={width * 0.5}
        cy={height * 0.08}
        r={width * 0.06}
        fill={primaryColor}
      />
      
      {/* Clapper */}
      <ellipse
        cx={width * 0.5}
        cy={height * 0.88}
        rx={width * 0.12}
        ry={height * 0.08}
        fill={primaryColor}
      />
      
      {/* Notification dot */}
      {showDot && (
        <circle
          cx={width * 0.78}
          cy={height * 0.22}
          r={width * 0.14}
          fill={COLORS.notification}
          stroke={COLORS.white}
          strokeWidth="2"
        />
      )}
    </g>
  );
};
