import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function DocumentFile({
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

      {/* Back document */}
      <rect x="70" y="40" width="80" height="100" rx="4" fill="#E2E8F0" />
      
      {/* Middle document */}
      <rect x="60" y="50" width="80" height="100" rx="4" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
      
      {/* Front document */}
      <rect x="50" y="60" width="80" height="100" rx="4" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="2" />
      
      {/* Folded corner */}
      <path
        d="M110 60 L130 60 L130 80 Z"
        fill="#E2E8F0"
      />
      <path
        d="M110 60 L110 80 L130 80"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="1"
      />

      {/* Document lines */}
      <rect x="60" y="90" width="50" height="4" rx="2" fill="#E2E8F0" />
      <rect x="60" y="100" width="60" height="4" rx="2" fill="#E2E8F0" />
      <rect x="60" y="110" width="45" height="4" rx="2" fill="#E2E8F0" />
      <rect x="60" y="120" width="55" height="4" rx="2" fill="#E2E8F0" />
      <rect x="60" y="130" width="40" height="4" rx="2" fill="#E2E8F0" />
      <rect x="60" y="140" width="50" height="4" rx="2" fill="#E2E8F0" />

      {/* Document icon/badge */}
      <circle cx="75" cy="75" r="10" fill={COLORS.topBlue} opacity="0.15" />
      <rect x="71" y="71" width="8" height="10" rx="1" fill={COLORS.topBlue} />
      <path d="M73 73 L77 73 M73 75 L77 75 M73 77 L76 77" stroke={COLORS.white} strokeWidth="0.5" />

      {/* Floating elements */}
      <g transform="translate(145, 70)">
        <rect width="25" height="25" rx="4" fill={COLORS.topAccent} opacity="0.15" />
        <path d="M7 12.5 L11 16.5 L18 9.5" stroke={COLORS.topAccent} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Magnifying glass */}
      <g transform="translate(140, 130)">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#64748B" strokeWidth="2" />
        <line x1="20" y1="20" x2="28" y2="28" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Small decorative files */}
      <rect x="35" y="100" width="12" height="15" rx="2" fill={COLORS.topBlue} opacity="0.2" />
      <rect x="35" y="120" width="12" height="15" rx="2" fill="#F59E0B" opacity="0.2" />
    </svg>
  );
}
