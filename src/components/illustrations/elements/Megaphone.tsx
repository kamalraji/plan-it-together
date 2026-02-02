import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface MegaphoneProps extends ElementProps {
  x?: number;
  y?: number;
  size?: number;
}

export const Megaphone = ({
  x = 0,
  y = 0,
  size = 80,
  primaryColor = COLORS.megaphone,
}: MegaphoneProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sound waves */}
      <path
        d={`M ${size * 0.75} ${size * 0.3} Q ${size * 0.9} ${size * 0.5} ${size * 0.75} ${size * 0.7}`}
        stroke={primaryColor}
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      <path
        d={`M ${size * 0.85} ${size * 0.2} Q ${size * 1.05} ${size * 0.5} ${size * 0.85} ${size * 0.8}`}
        stroke={primaryColor}
        strokeWidth="2"
        fill="none"
        opacity="0.25"
      />
      
      {/* Megaphone body */}
      <path
        d={`
          M ${size * 0.15} ${size * 0.4}
          L ${size * 0.7} ${size * 0.15}
          L ${size * 0.7} ${size * 0.85}
          L ${size * 0.15} ${size * 0.6}
          Z
        `}
        fill={primaryColor}
      />
      
      {/* Handle */}
      <rect
        x={0}
        y={size * 0.35}
        width={size * 0.2}
        height={size * 0.3}
        rx={4}
        fill={COLORS.hair}
      />
      
      {/* Bell opening */}
      <ellipse
        cx={size * 0.7}
        cy={size * 0.5}
        rx={size * 0.08}
        ry={size * 0.35}
        fill={primaryColor}
      />
      <ellipse
        cx={size * 0.72}
        cy={size * 0.5}
        rx={size * 0.05}
        ry={size * 0.28}
        fill={COLORS.white}
        opacity="0.3"
      />
    </g>
  );
};
