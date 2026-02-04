import { COLORS } from '../utils';

interface ConfettiProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  density?: 'light' | 'medium' | 'heavy';
}

export const Confetti = ({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  density = 'medium',
}: ConfettiProps) => {
  const colors = COLORS.confettiColors;
  const counts = { light: 8, medium: 15, heavy: 25 };
  const count = counts[density];
  
  // Deterministic pseudo-random positions
  const pieces = Array.from({ length: count }, (_, i) => {
    const seed = i * 137.5;
    const px = (seed % width);
    const py = ((seed * 2.3) % height);
    const rotation = (seed * 3.7) % 360;
    const colorIndex = i % colors.length;
    const shapeType = i % 3; // 0: rect, 1: circle, 2: line
    const scale = 0.5 + (i % 5) * 0.15;
    
    return { px, py, rotation, color: colors[colorIndex], shapeType, scale };
  });

  return (
    <g transform={`translate(${x}, ${y})`}>
      {pieces.map((piece, i) => {
        const baseSize = 6 * piece.scale;
        
        if (piece.shapeType === 0) {
          return (
            <rect
              key={i}
              x={piece.px}
              y={piece.py}
              width={baseSize}
              height={baseSize * 1.5}
              rx={1}
              fill={piece.color}
              transform={`rotate(${piece.rotation} ${piece.px + baseSize / 2} ${piece.py + baseSize * 0.75})`}
            />
          );
        } else if (piece.shapeType === 1) {
          return (
            <circle
              key={i}
              cx={piece.px}
              cy={piece.py}
              r={baseSize / 2}
              fill={piece.color}
            />
          );
        } else {
          return (
            <line
              key={i}
              x1={piece.px}
              y1={piece.py}
              x2={piece.px + baseSize * 2}
              y2={piece.py + baseSize}
              stroke={piece.color}
              strokeWidth={2}
              strokeLinecap="round"
              transform={`rotate(${piece.rotation} ${piece.px} ${piece.py})`}
            />
          );
        }
      })}
    </g>
  );
};
