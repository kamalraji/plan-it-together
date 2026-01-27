import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface LaptopOpenProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
}

export const LaptopOpen = ({
  x = 0,
  y = 0,
  size = 100,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.laptop,
}: LaptopOpenProps) => {
  const width = size;
  const height = size * 0.7;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Screen */}
      <rect
        x={width * 0.1}
        y={0}
        width={width * 0.8}
        height={height * 0.65}
        rx={4}
        fill={accentColor}
      />
      <rect
        x={width * 0.14}
        y={height * 0.05}
        width={width * 0.72}
        height={height * 0.52}
        rx={2}
        fill={primaryColor}
        opacity="0.2"
      />
      
      {/* Screen content lines */}
      <line
        x1={width * 0.2}
        y1={height * 0.15}
        x2={width * 0.6}
        y2={height * 0.15}
        stroke={COLORS.white}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1={width * 0.2}
        y1={height * 0.28}
        x2={width * 0.75}
        y2={height * 0.28}
        stroke={COLORS.white}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1={width * 0.2}
        y1={height * 0.38}
        x2={width * 0.5}
        y2={height * 0.38}
        stroke={COLORS.white}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Base / Keyboard */}
      <path
        d={`
          M 0 ${height * 0.68}
          L ${width * 0.05} ${height * 0.65}
          L ${width * 0.95} ${height * 0.65}
          L ${width} ${height * 0.68}
          L ${width} ${height}
          L 0 ${height}
          Z
        `}
        fill={accentColor}
      />
      
      {/* Keyboard area */}
      <rect
        x={width * 0.15}
        y={height * 0.72}
        width={width * 0.7}
        height={height * 0.2}
        rx={2}
        fill={COLORS.hair}
        opacity="0.3"
      />
      
      {/* Trackpad */}
      <rect
        x={width * 0.38}
        y={height * 0.85}
        width={width * 0.24}
        height={height * 0.1}
        rx={2}
        fill={COLORS.hair}
        opacity="0.2"
      />
    </g>
  );
};
