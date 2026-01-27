import { ElementProps } from '../types';
import { COLORS } from '../utils';

interface TropicalPlantProps extends ElementProps {
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
}

export const TropicalPlant = ({
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
}: TropicalPlantProps) => {
  const transform = `translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`;

  return (
    <g transform={transform}>
      {/* Large leaf 1 */}
      <path
        d="M0 60 Q20 40 15 0 Q30 35 50 50 Q25 55 0 60"
        fill={COLORS.plant}
        opacity="0.9"
      />
      {/* Leaf vein */}
      <path
        d="M5 55 Q18 38 15 5"
        stroke={COLORS.plantDark}
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
      {/* Large leaf 2 */}
      <path
        d="M10 70 Q35 55 45 15 Q55 50 75 60 Q45 65 10 70"
        fill={COLORS.plantDark}
        opacity="0.8"
      />
      {/* Small accent leaf */}
      <path
        d="M-5 50 Q5 35 0 15 Q15 30 25 45 Q10 50 -5 50"
        fill={COLORS.plant}
        opacity="0.7"
      />
    </g>
  );
};
