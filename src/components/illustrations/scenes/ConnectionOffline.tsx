import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function ConnectionOffline({
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

      {/* Cloud shape */}
      <path
        d="M55 110 
           Q40 110 40 95 
           Q40 80 55 80 
           Q55 60 80 60 
           Q95 50 115 60 
           Q140 55 150 75 
           Q170 75 170 95 
           Q170 110 155 110 
           Z"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        strokeWidth="2"
      />

      {/* WiFi symbol (crossed out) */}
      <g transform="translate(100, 90)">
        {/* WiFi arcs */}
        <path
          d="M-25 -5 Q0 -25 25 -5"
          stroke="#94A3B8"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-17 3 Q0 -12 17 3"
          stroke="#94A3B8"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M-9 11 Q0 2 9 11"
          stroke="#94A3B8"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cy="20" r="4" fill="#94A3B8" />

        {/* Crossed out line */}
        <line
          x1="-30"
          y1="25"
          x2="30"
          y2="-20"
          stroke="#EF4444"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Disconnected cable */}
      <g transform="translate(45, 130)">
        <rect x="0" y="5" width="35" height="10" rx="2" fill="#64748B" />
        <rect x="30" y="2" width="8" height="16" rx="1" fill="#475569" />
        <rect x="35" y="5" width="4" height="4" rx="1" fill="#94A3B8" />
        <rect x="35" y="11" width="4" height="4" rx="1" fill="#94A3B8" />
      </g>

      <g transform="translate(120, 135)">
        <rect x="0" y="0" width="35" height="10" rx="2" fill="#64748B" />
        <rect x="-8" y="-3" width="8" height="16" rx="1" fill="#475569" />
        <rect x="-4" y="0" width="4" height="4" rx="1" fill="#94A3B8" />
        <rect x="-4" y="6" width="4" height="4" rx="1" fill="#94A3B8" />
      </g>

      {/* Spark/disconnect symbol */}
      <g transform="translate(100, 145)">
        <path
          d="M-8 -5 L0 0 L-5 5 L5 0 L0 -5 L8 0"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Question marks floating */}
      <text x="50" y="55" fontSize="14" fill="#94A3B8" fontWeight="bold">?</text>
      <text x="155" y="50" fontSize="12" fill="#94A3B8" fontWeight="bold">?</text>
    </svg>
  );
}
