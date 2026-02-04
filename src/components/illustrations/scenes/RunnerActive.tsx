import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function RunnerActive({
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

      {/* Speed lines */}
      <line x1="20" y1="80" x2="50" y2="80" stroke={COLORS.topBlue} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="25" y1="95" x2="60" y2="95" stroke={COLORS.topBlue} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="30" y1="110" x2="55" y2="110" stroke={COLORS.topBlue} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="20" y1="125" x2="45" y2="125" stroke={COLORS.topBlue} strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Motion dust particles */}
      <circle cx="45" cy="150" r="4" fill="#CBD5E1" opacity="0.5" />
      <circle cx="55" cy="158" r="3" fill="#CBD5E1" opacity="0.4" />
      <circle cx="40" cy="162" r="2" fill="#CBD5E1" opacity="0.3" />

      {/* Progress dots trail */}
      <circle cx="160" cy="60" r="5" fill={COLORS.topAccent} opacity="0.8" />
      <circle cx="175" cy="55" r="4" fill={COLORS.topAccent} opacity="0.6" />
      <circle cx="185" cy="52" r="3" fill={COLORS.topAccent} opacity="0.4" />

      {/* Ground line */}
      <line x1="60" y1="170" x2="180" y2="170" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="8 4" />

      {/* Runner - dynamic running pose */}
      
      {/* Back leg (extended behind) */}
      <path
        d="M85 130 Q70 145 60 165"
        stroke="#1E293B"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      {/* Back foot */}
      <ellipse cx="58" cy="168" rx="8" ry="4" fill="#EF4444" />

      {/* Front leg (bent, forward) */}
      <path
        d="M95 125 Q115 130 125 145 Q130 160 120 170"
        stroke="#1E293B"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      {/* Front foot */}
      <ellipse cx="122" cy="170" rx="10" ry="4" fill="#EF4444" />

      {/* Body - leaning forward */}
      <path
        d="M90 130
           Q80 110 85 95
           Q90 80 100 80
           Q110 80 115 95
           Q118 105 110 130"
        fill={COLORS.topBlue}
      />

      {/* Athletic stripe on shirt */}
      <path
        d="M92 95 Q100 93 108 95"
        stroke={COLORS.white}
        strokeWidth="3"
        fill="none"
      />

      {/* Back arm (swinging back) */}
      <path
        d="M88 95 Q70 100 60 85"
        stroke={COLORS.skin}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Back hand */}
      <circle cx="58" cy="83" r="5" fill={COLORS.skin} />

      {/* Front arm (swinging forward) */}
      <path
        d="M108 95 Q125 85 140 75"
        stroke={COLORS.skin}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Front hand */}
      <circle cx="142" cy="73" r="5" fill={COLORS.skin} />

      {/* Neck */}
      <rect x="95" y="65" width="10" height="10" fill={COLORS.skin} />

      {/* Head - tilted forward */}
      <ellipse cx="105" cy="50" rx="18" ry="20" fill={COLORS.skin} />

      {/* Athletic headband */}
      <path
        d="M87 48 Q105 42 123 48"
        stroke={COLORS.topAccent}
        strokeWidth="4"
        fill="none"
      />

      {/* Hair (windswept) */}
      <path
        d="M87 48
           Q87 32 105 30
           Q123 32 123 48
           Q120 40 105 38
           Q90 40 87 48"
        fill="#4A3728"
      />
      {/* Windswept strands */}
      <path d="M87 40 Q75 35 70 40" stroke="#4A3728" strokeWidth="3" fill="none" />
      <path d="M90 35 Q80 28 75 32" stroke="#4A3728" strokeWidth="2" fill="none" />

      {/* Determined face */}
      <ellipse cx="98" cy="50" rx="2.5" ry="3" fill="#4A3728" />
      <ellipse cx="112" cy="50" rx="2.5" ry="3" fill="#4A3728" />
      
      {/* Focused eyebrows */}
      <line x1="94" y1="44" x2="101" y2="46" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
      <line x1="109" y1="46" x2="116" y2="44" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />

      {/* Determined mouth */}
      <line x1="100" y1="60" x2="110" y2="60" stroke={COLORS.skinShadow} strokeWidth="2" strokeLinecap="round" />

      {/* Sweat drops */}
      <path d="M125 45 Q127 50 125 55" stroke={COLORS.topAccent} strokeWidth="2" fill="none" opacity="0.6" />
      <circle cx="125" cy="57" r="2" fill={COLORS.topAccent} opacity="0.6" />

      {/* Energy burst behind */}
      <path
        d="M75 75 L70 70 L75 72 L72 65 L78 70 L80 63 L80 72 L85 68 L82 75 Z"
        fill="#F59E0B"
        opacity="0.6"
      />

      {/* Timer/stopwatch floating */}
      <g transform="translate(155, 100)">
        <circle r="12" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="2" />
        <circle r="8" fill="none" stroke={COLORS.topBlue} strokeWidth="2" />
        <line x1="0" y1="0" x2="0" y2="-5" stroke={COLORS.topBlue} strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="0" x2="3" y2="2" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="-2" y="-16" width="4" height="4" rx="1" fill="#64748B" />
      </g>
    </svg>
  );
}
