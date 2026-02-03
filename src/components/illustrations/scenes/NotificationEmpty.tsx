import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function NotificationEmpty({
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

      {/* Large bell */}
      <path
        d="M70 95 
           Q70 60 100 55 
           Q130 60 130 95 
           L135 115 
           L65 115 
           Z"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      
      {/* Bell top */}
      <circle cx="100" cy="55" r="6" fill="#CBD5E1" />
      
      {/* Bell bottom curve */}
      <ellipse cx="100" cy="115" rx="38" ry="8" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" />
      
      {/* Bell clapper */}
      <ellipse cx="100" cy="130" rx="10" ry="6" fill="#CBD5E1" />

      {/* "Zzz" sleep indicators */}
      <text x="135" y="60" fontSize="14" fill="#94A3B8" fontWeight="bold">z</text>
      <text x="145" y="50" fontSize="12" fill="#94A3B8" fontWeight="bold">z</text>
      <text x="153" y="42" fontSize="10" fill="#94A3B8" fontWeight="bold">z</text>

      {/* Empty indicator - dashed circle */}
      <circle
        cx="100"
        cy="90"
        r="20"
        fill="none"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Checkmark in circle (all caught up) */}
      <circle cx="100" cy="90" r="15" fill={COLORS.topBlue} opacity="0.1" />
      <path
        d="M92 90 L97 95 L108 84"
        stroke={COLORS.topBlue}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />

      {/* Floating notification cards (faded/empty) */}
      <g transform="translate(40, 50)" opacity="0.4">
        <rect width="30" height="20" rx="3" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="1" />
        <rect x="5" y="6" width="15" height="2" rx="1" fill="#E2E8F0" />
        <rect x="5" y="11" width="20" height="2" rx="1" fill="#E2E8F0" />
      </g>

      <g transform="translate(140, 80)" opacity="0.4">
        <rect width="25" height="18" rx="3" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="1" />
        <rect x="4" y="5" width="12" height="2" rx="1" fill="#E2E8F0" />
        <rect x="4" y="10" width="17" height="2" rx="1" fill="#E2E8F0" />
      </g>

      {/* Peace/calm indicators */}
      <circle cx="55" cy="140" r="4" fill={COLORS.topAccent} opacity="0.3" />
      <circle cx="145" cy="145" r="3" fill="#22C55E" opacity="0.3" />

      {/* Sparkle (all clear) */}
      <path
        d="M50 100 L52 105 L57 105 L53 109 L55 114 L50 111 L45 114 L47 109 L43 105 L48 105 Z"
        fill={COLORS.topAccent}
        opacity="0.5"
      />
    </svg>
  );
}
