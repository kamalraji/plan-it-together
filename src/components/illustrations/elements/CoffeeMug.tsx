import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface CoffeeMugProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
}

export const CoffeeMug = ({
  x = 0,
  y = 0,
  size = 50,
  primaryColor = COLORS.white,
}: CoffeeMugProps) => {
  const width = size;
  const height = size;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Steam */}
      <path
        d={`M ${width * 0.3} ${height * 0.15} Q ${width * 0.25} ${height * 0.05} ${width * 0.35} 0`}
        stroke={COLORS.lightGray}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d={`M ${width * 0.5} ${height * 0.12} Q ${width * 0.55} ${height * 0.02} ${width * 0.45} ${-height * 0.05}`}
        stroke={COLORS.lightGray}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      {/* Mug body */}
      <path
        d={`
          M ${width * 0.1} ${height * 0.25}
          L ${width * 0.1} ${height * 0.85}
          Q ${width * 0.1} ${height} ${width * 0.25} ${height}
          L ${width * 0.55} ${height}
          Q ${width * 0.7} ${height} ${width * 0.7} ${height * 0.85}
          L ${width * 0.7} ${height * 0.25}
          Z
        `}
        fill={primaryColor}
        stroke={COLORS.lightGray}
        strokeWidth="1"
      />
      
      {/* Coffee liquid */}
      <ellipse
        cx={width * 0.4}
        cy={height * 0.32}
        rx={width * 0.28}
        ry={height * 0.08}
        fill={COLORS.coffee}
      />
      
      {/* Handle */}
      <path
        d={`
          M ${width * 0.7} ${height * 0.35}
          Q ${width * 0.95} ${height * 0.35} ${width * 0.95} ${height * 0.55}
          Q ${width * 0.95} ${height * 0.75} ${width * 0.7} ${height * 0.75}
        `}
        stroke={primaryColor}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`
          M ${width * 0.7} ${height * 0.35}
          Q ${width * 0.95} ${height * 0.35} ${width * 0.95} ${height * 0.55}
          Q ${width * 0.95} ${height * 0.75} ${width * 0.7} ${height * 0.75}
        `}
        stroke={COLORS.lightGray}
        strokeWidth="1"
        fill="none"
      />
    </g>
  );
};
