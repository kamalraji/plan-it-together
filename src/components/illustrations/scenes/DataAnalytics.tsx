import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { BarChart } from '../elements/BarChart';

export const DataAnalytics = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.chartAccent,
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
      aria-label="Person analyzing data charts"
    >
      <defs>
        <linearGradient id="dataSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="dataTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          {/* Large chart board */}
          <rect x={200} y={80} width={170} height={200} rx={8} fill={COLORS.white} stroke={COLORS.lightGray} strokeWidth="2" />
          <BarChart x={220} y={110} width={130} height={100} accentColor={accentColor} />
          
          {/* Trend line */}
          <path
            d="M230 240 L270 220 L310 230 L350 200"
            stroke={accentColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Arrow up */}
          <path
            d="M355 195 L350 200 L355 205"
            stroke={COLORS.plant}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            transform="rotate(-45 352 200)"
          />
        </g>
      )}

      {/* Person */}
      <g>
        {/* Body */}
        <path
          d="M80 220 Q70 245 75 295 L90 365 Q125 370 160 365 L175 295 Q180 245 170 220 Q125 205 80 220"
          fill="url(#dataTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="125" cy="205" rx="15" ry="17" fill="url(#dataSkinGradient)" />

        {/* Head */}
        <ellipse cx="125" cy="160" rx="42" ry="50" fill="url(#dataSkinGradient)" />

        {/* Hair */}
        <path
          d="M83 145 Q72 120 88 95 Q110 75 125 75 Q140 75 162 95 Q178 120 167 145 Q163 125 125 118 Q87 125 83 145"
          fill={COLORS.hair}
        />

        {/* Glasses */}
        <circle cx="110" cy="158" r="12" fill="none" stroke={COLORS.hair} strokeWidth="2" />
        <circle cx="140" cy="158" r="12" fill="none" stroke={COLORS.hair} strokeWidth="2" />
        <line x1="122" y1="158" x2="128" y2="158" stroke={COLORS.hair} strokeWidth="2" />

        {/* Eyes behind glasses */}
        <ellipse cx="110" cy="160" rx="3" ry="2" fill={COLORS.hair} />
        <ellipse cx="140" cy="160" rx="3" ry="2" fill={COLORS.hair} />

        {/* Thoughtful expression */}
        <path
          d="M118 182 Q125 186 132 182"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arm pointing at chart */}
        <path
          d="M170 240 Q200 220 225 200"
          stroke="url(#dataSkinGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="230" cy="196" rx="12" ry="10" fill="url(#dataSkinGradient)" />
        
        {/* Other arm with clipboard */}
        <path
          d="M80 240 Q55 260 50 290"
          stroke="url(#dataSkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Clipboard */}
        <rect x={30} y={285} width={45} height={60} rx={4} fill={COLORS.hair} />
        <rect x={34} y={295} width={37} height={45} rx={2} fill={COLORS.white} />
        <line x1={40} y1={305} x2={60} y2={305} stroke={COLORS.lightGray} strokeWidth="2" />
        <line x1={40} y1={315} x2={55} y2={315} stroke={COLORS.lightGray} strokeWidth="2" />
        <line x1={40} y1={325} x2={62} y2={325} stroke={COLORS.lightGray} strokeWidth="2" />
      </g>
    </svg>
  );
};
