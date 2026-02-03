import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';

export const EmptyInbox = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  animation = 'none',
}: IllustrationProps) => {
  const styles = getSizeStyles(size);
  const classes = buildIllustrationClasses(animation, className);

  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={classes}
      style={styles}
      role="img"
      aria-label="Person with empty inbox"
    >
      <defs>
        <linearGradient id="emptySkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="emptyTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          {/* Floating papers */}
          <rect x={60} y={80} width={40} height={50} rx={3} fill={COLORS.lightGray} transform="rotate(-15 80 105)" />
          <rect x={300} y={100} width={45} height={55} rx={3} fill={COLORS.lightGray} transform="rotate(20 322 127)" />
          <rect x={320} y={60} width={35} height={45} rx={3} fill={COLORS.white} stroke={COLORS.lightGray} transform="rotate(10 337 82)" />
        </g>
      )}

      {/* Empty box */}
      <g>
        <path
          d="M120 220 L140 180 L260 180 L280 220 L280 320 L120 320 Z"
          fill={COLORS.lightGray}
          stroke={COLORS.chartBar}
          strokeWidth="2"
        />
        <path
          d="M120 220 L200 240 L280 220"
          stroke={COLORS.chartBar}
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="200" cy="270" rx="40" ry="20" fill={COLORS.white} opacity="0.5" />
      </g>

      {/* Person looking into box */}
      <g>
        {/* Body leaning forward */}
        <path
          d="M180 140 Q160 160 165 200 L180 240 Q200 245 220 240 L235 200 Q240 160 220 140 Q200 130 180 140"
          fill="url(#emptyTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="200" cy="125" rx="14" ry="16" fill="url(#emptySkinGradient)" />

        {/* Head looking down */}
        <ellipse cx="200" cy="90" rx="38" ry="45" fill="url(#emptySkinGradient)" />

        {/* Hair */}
        <path
          d="M162 75 Q155 55 170 40 Q190 28 200 28 Q210 28 230 40 Q245 55 238 75 Q235 60 200 55 Q165 60 162 75"
          fill={COLORS.hair}
        />

        {/* Eyes looking down */}
        <ellipse cx="188" cy="95" rx="4" ry="3" fill={COLORS.hair} />
        <ellipse cx="212" cy="95" rx="4" ry="3" fill={COLORS.hair} />

        {/* Neutral/curious expression */}
        <path
          d="M193 112 Q200 115 207 112"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms on box edge */}
        <path
          d="M165 180 Q140 200 125 218"
          stroke="url(#emptySkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="122" cy="222" rx="11" ry="9" fill="url(#emptySkinGradient)" />
        
        <path
          d="M235 180 Q260 200 275 218"
          stroke="url(#emptySkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="278" cy="222" rx="11" ry="9" fill="url(#emptySkinGradient)" />
      </g>

      {/* Question marks */}
      <text x="80" y="160" fontSize="24" fill={primaryColor} opacity="0.4">?</text>
      <text x="310" y="180" fontSize="20" fill={primaryColor} opacity="0.3">?</text>
    </svg>
  );
};
