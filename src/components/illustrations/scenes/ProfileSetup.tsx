import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function ProfileSetup({
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

      {/* Profile card */}
      <rect x="50" y="45" width="100" height="120" rx="8" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="2" />

      {/* Avatar placeholder */}
      <circle cx="100" cy="80" r="25" fill="#E2E8F0" />
      <circle cx="100" cy="75" r="10" fill="#CBD5E1" />
      <ellipse cx="100" cy="95" rx="15" ry="10" fill="#CBD5E1" />

      {/* Camera icon overlay */}
      <circle cx="118" cy="95" r="10" fill={COLORS.topBlue} />
      <path
        d="M114 95 L116 92 L120 92 L122 95 L122 98 L114 98 Z"
        fill={COLORS.white}
      />
      <circle cx="118" cy="96" r="2" fill={COLORS.white} />

      {/* Form fields */}
      <rect x="60" y="115" width="80" height="8" rx="2" fill="#E2E8F0" />
      <rect x="60" y="130" width="60" height="8" rx="2" fill="#E2E8F0" />
      <rect x="60" y="145" width="70" height="8" rx="2" fill="#E2E8F0" />

      {/* Progress indicator */}
      <rect x="60" y="160" width="80" height="4" rx="2" fill="#E2E8F0" />
      <rect x="60" y="160" width="50" height="4" rx="2" fill={COLORS.topBlue} />

      {/* Floating elements */}
      <g transform="translate(155, 55)">
        <rect width="20" height="20" rx="4" fill={COLORS.topAccent} opacity="0.2" />
        <path d="M6 10 L9 13 L14 8" stroke={COLORS.topAccent} strokeWidth="2" strokeLinecap="round" />
      </g>

      <g transform="translate(25, 100)">
        <rect width="18" height="18" rx="4" fill="#F59E0B" opacity="0.2" />
        <circle cx="9" cy="9" r="4" fill="#F59E0B" opacity="0.6" />
      </g>

      {/* Pencil icon */}
      <g transform="translate(160, 130)">
        <path
          d="M0 15 L3 5 L10 12 Z"
          fill={COLORS.topBlue}
        />
        <path
          d="M3 5 L8 0 L15 7 L10 12 Z"
          fill={COLORS.topBlueDark}
        />
        <path
          d="M0 15 L1 12 L3 14 Z"
          fill={COLORS.hair}
        />
      </g>
    </svg>
  );
}
