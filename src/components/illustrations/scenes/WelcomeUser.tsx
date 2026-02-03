import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function WelcomeUser({
  className,
  size = 'md',
  showBackground = true,
  animation = 'none',
}: IllustrationProps) {
  const sizeStyles = getSizeStyles(size);
  const classes = buildIllustrationClasses(animation, className);

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={sizeStyles}
      className={classes}
      aria-hidden="true"
    >
      {/* Background */}
      {showBackground && (
        <circle cx="100" cy="100" r="90" fill={COLORS.lightGray} opacity="0.5" />
      )}

      {/* Person - Body */}
      <ellipse cx="100" cy="155" rx="25" ry="10" fill={COLORS.pants} opacity="0.3" />
      
      {/* Legs */}
      <rect x="85" y="130" width="10" height="30" rx="5" fill={COLORS.pants} />
      <rect x="105" y="130" width="10" height="30" rx="5" fill={COLORS.pants} />

      {/* Body/Torso */}
      <path
        d="M80 95 Q80 130 90 130 L110 130 Q120 130 120 95 L100 85 Z"
        fill={COLORS.topBlue}
      />

      {/* Arms - waving */}
      <path
        d="M75 100 Q60 85 50 70"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M125 100 Q140 95 150 100"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Waving hand */}
      <ellipse cx="48" cy="65" rx="8" ry="10" fill={COLORS.skin} />

      {/* Head */}
      <circle cx="100" cy="65" r="22" fill={COLORS.skin} />
      
      {/* Hair */}
      <path
        d="M78 60 Q78 40 100 40 Q122 40 122 60 Q115 50 100 52 Q85 50 78 60"
        fill={COLORS.hair}
      />

      {/* Face - happy expression */}
      <circle cx="92" cy="62" r="2" fill={COLORS.hair} />
      <circle cx="108" cy="62" r="2" fill={COLORS.hair} />
      <path
        d="M92 72 Q100 80 108 72"
        stroke={COLORS.hair}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blush */}
      <ellipse cx="86" cy="70" rx="4" ry="2" fill="#FECACA" opacity="0.6" />
      <ellipse cx="114" cy="70" rx="4" ry="2" fill="#FECACA" opacity="0.6" />

      {/* Stars/sparkles around */}
      <path
        d="M40 100 L42 105 L47 105 L43 109 L45 114 L40 111 L35 114 L37 109 L33 105 L38 105 Z"
        fill="#F59E0B"
      />
      <path
        d="M160 85 L162 90 L167 90 L163 94 L165 99 L160 96 L155 99 L157 94 L153 90 L158 90 Z"
        fill={COLORS.topAccent}
      />

      {/* Confetti */}
      <circle cx="55" cy="50" r="3" fill={COLORS.topBlue} />
      <circle cx="145" cy="55" r="3" fill="#EC4899" />
      <circle cx="160" cy="120" r="2" fill="#22C55E" />
      <circle cx="40" cy="130" r="2" fill="#F59E0B" />

      {/* Welcome banner hint */}
      <rect x="130" y="35" width="35" height="20" rx="3" fill={COLORS.topAccent} opacity="0.2" />
      <path d="M137 45 L140 48 L155 40" stroke={COLORS.topAccent} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
