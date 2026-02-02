import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';

export const SecurityCheck = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.plant,
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
      aria-label="Person with security shield"
    >
      <defs>
        <linearGradient id="secSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="secTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          {/* Lock icon */}
          <g transform="translate(300, 120)">
            <rect x={10} y={25} width={40} height={35} rx={5} fill={COLORS.hair} opacity="0.8" />
            <path
              d="M18 25 L18 15 A 12 12 0 0 1 42 15 L42 25"
              stroke={COLORS.hair}
              strokeWidth="5"
              fill="none"
              opacity="0.8"
            />
            <circle cx={30} cy={42} r={6} fill={COLORS.lightGray} />
          </g>
          
          {/* Security particles */}
          <circle cx={80} cy={100} r={4} fill={accentColor} opacity="0.3" />
          <circle cx={60} cy={180} r={3} fill={primaryColor} opacity="0.2" />
          <circle cx={340} cy={250} r={4} fill={accentColor} opacity="0.25" />
        </g>
      )}

      {/* Shield */}
      <g transform="translate(220, 180)">
        <path
          d="M60 0 L120 20 L120 70 Q120 120 60 150 Q0 120 0 70 L0 20 Z"
          fill="url(#shieldGradient)"
        />
        <path
          d="M60 15 L105 32 L105 68 Q105 108 60 133 Q15 108 15 68 L15 32 Z"
          fill={COLORS.white}
          opacity="0.2"
        />
        {/* Checkmark */}
        <path
          d="M40 70 L55 85 L85 50"
          stroke={COLORS.white}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Person */}
      <g>
        {/* Body */}
        <path
          d="M100 210 Q90 235 95 285 L110 360 Q145 365 180 360 L195 285 Q200 235 190 210 Q145 195 100 210"
          fill="url(#secTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="145" cy="195" rx="15" ry="17" fill="url(#secSkinGradient)" />

        {/* Head */}
        <ellipse cx="145" cy="150" rx="42" ry="50" fill="url(#secSkinGradient)" />

        {/* Hair - short style */}
        <path
          d="M103 135 Q95 110 110 88 Q130 70 145 70 Q160 70 180 88 Q195 110 187 135 Q183 115 145 108 Q107 115 103 135"
          fill={COLORS.hair}
        />

        {/* Eyes */}
        <ellipse cx="130" cy="148" rx="5" ry="4" fill={COLORS.hair} />
        <ellipse cx="160" cy="148" rx="5" ry="4" fill={COLORS.hair} />

        {/* Confident smile */}
        <path
          d="M135 172 Q145 180 155 172"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arm holding shield area */}
        <path
          d="M190 230 Q220 220 245 230"
          stroke="url(#secSkinGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Other arm */}
        <path
          d="M100 230 Q70 260 75 310"
          stroke="url(#secSkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="75" cy="315" rx="11" ry="9" fill="url(#secSkinGradient)" />
      </g>
    </svg>
  );
};
