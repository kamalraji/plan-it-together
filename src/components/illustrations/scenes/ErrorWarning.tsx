import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function ErrorWarning({
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

      {/* Warning triangle */}
      <path
        d="M100 40 L160 145 L40 145 Z"
        fill="#FEF3C7"
        stroke="#F59E0B"
        strokeWidth="3"
      />

      {/* Inner triangle shadow */}
      <path
        d="M100 55 L145 135 L55 135 Z"
        fill="#FDE68A"
        opacity="0.5"
      />

      {/* Exclamation mark */}
      <rect x="95" y="70" width="10" height="40" rx="5" fill="#F59E0B" />
      <circle cx="100" cy="125" r="6" fill="#F59E0B" />

      {/* Floating error symbols */}
      <g transform="translate(30, 60)">
        <circle r="12" fill="#EF4444" opacity="0.15" />
        <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </g>

      <g transform="translate(170, 70)">
        <circle r="10" fill="#EF4444" opacity="0.15" />
        <path d="M-3 -3 L3 3 M3 -3 L-3 3" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Broken pieces */}
      <path
        d="M45 160 L55 155 L50 165 Z"
        fill="#CBD5E1"
      />
      <path
        d="M150 158 L160 162 L155 170 Z"
        fill="#CBD5E1"
      />
      <rect x="70" y="160" width="8" height="8" rx="1" fill="#E2E8F0" transform="rotate(15 74 164)" />
      <rect x="125" y="158" width="6" height="6" rx="1" fill="#E2E8F0" transform="rotate(-10 128 161)" />

      {/* Zigzag crack lines */}
      <path
        d="M35 100 L40 105 L35 110 L40 115"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M165 95 L160 100 L165 105 L160 110"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
