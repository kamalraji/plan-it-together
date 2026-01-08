import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function DetectiveSearch({
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

      {/* Search pattern circles in background */}
      <circle cx="45" cy="50" r="15" fill="none" stroke={COLORS.topBlue} strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />
      <circle cx="160" cy="60" r="12" fill="none" stroke={COLORS.topAccent} strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />
      <circle cx="150" cy="140" r="18" fill="none" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />

      {/* Footprints trail */}
      <g opacity="0.3">
        <ellipse cx="155" cy="165" rx="5" ry="8" fill="#64748B" transform="rotate(-20 155 165)" />
        <ellipse cx="168" cy="158" rx="5" ry="8" fill="#64748B" transform="rotate(-15 168 158)" />
        <ellipse cx="178" cy="148" rx="4" ry="7" fill="#64748B" transform="rotate(-10 178 148)" />
      </g>

      {/* Clue markers */}
      <g transform="translate(35, 130)">
        <circle r="8" fill="#EF4444" opacity="0.2" />
        <circle r="4" fill="#EF4444" opacity="0.4" />
        <text y="4" fontSize="6" fill="#EF4444" textAnchor="middle" fontWeight="bold">!</text>
      </g>

      <g transform="translate(165, 95)">
        <circle r="6" fill="#F59E0B" opacity="0.2" />
        <circle r="3" fill="#F59E0B" opacity="0.4" />
        <text y="3" fontSize="5" fill="#F59E0B" textAnchor="middle" fontWeight="bold">?</text>
      </g>

      {/* Person - Detective */}
      
      {/* Legs */}
      <path d="M85 170 L80 145" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
      <path d="M110 170 L115 150" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
      
      {/* Shoes */}
      <ellipse cx="78" cy="172" rx="10" ry="5" fill="#4A3728" />
      <ellipse cx="113" cy="172" rx="10" ry="5" fill="#4A3728" />

      {/* Body - trench coat */}
      <path
        d="M70 150
           Q68 125 78 105
           L112 105
           Q122 125 120 150
           L95 155
           Z"
        fill="#D4A574"
      />
      {/* Coat lapels */}
      <path d="M85 105 L80 130 L95 125" fill="#C4956A" />
      <path d="M105 105 L110 130 L95 125" fill="#C4956A" />
      {/* Coat belt */}
      <rect x="72" y="135" width="46" height="5" rx="1" fill="#92400E" />
      <rect x="92" y="133" width="8" height="9" rx="1" fill="#78350F" />

      {/* Arm holding magnifying glass */}
      <path
        d="M112 110 Q135 95 150 85"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Magnifying glass */}
      <g transform="translate(155, 75)">
        <line x1="-8" y1="8" x2="-20" y2="20" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
        <circle r="15" fill="none" stroke="#8B5CF6" strokeWidth="4" />
        <circle r="12" fill="#E0E7FF" opacity="0.4" />
        <ellipse cx="-4" cy="-4" rx="3" ry="4" fill={COLORS.white} opacity="0.6" />
      </g>

      {/* Other arm */}
      <path
        d="M78 110 Q60 120 55 140"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="53" cy="142" rx="6" ry="5" fill={COLORS.skin} />

      {/* Neck */}
      <rect x="88" y="82" width="14" height="10" fill={COLORS.skin} />

      {/* Head */}
      <ellipse cx="95" cy="60" rx="20" ry="24" fill={COLORS.skin} />

      {/* Detective hat */}
      <ellipse cx="95" cy="42" rx="25" ry="8" fill="#4A3728" />
      <path
        d="M70 42
           Q70 28 95 25
           Q120 28 120 42"
        fill="#5D4E3A"
      />
      <rect x="70" y="38" width="50" height="6" fill="#4A3728" />

      {/* Hair peeking out */}
      <path d="M75 50 Q73 55 75 60" stroke="#1E293B" strokeWidth="3" fill="none" />
      <path d="M115 50 Q117 55 115 60" stroke="#1E293B" strokeWidth="3" fill="none" />

      {/* Face - investigative expression */}
      <ellipse cx="87" cy="58" rx="3" ry="3.5" fill="#4A3728" />
      <ellipse cx="103" cy="58" rx="3" ry="3.5" fill="#4A3728" />
      
      {/* One eyebrow raised */}
      <path d="M82 52 Q87 50 92 53" stroke="#4A3728" strokeWidth="2" fill="none" />
      <path d="M98 50 Q103 48 108 51" stroke="#4A3728" strokeWidth="2" fill="none" />

      {/* Thoughtful expression */}
      <path
        d="M90 72 Q95 70 100 72"
        stroke={COLORS.skinShadow}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Pipe (optional detective element) */}
      <g transform="translate(100, 72)">
        <rect x="0" y="0" width="15" height="3" rx="1" fill="#78350F" />
        <ellipse cx="17" cy="0" rx="5" ry="4" fill="#5D4037" />
        {/* Smoke */}
        <path d="M17 -5 Q19 -10 17 -15" stroke="#CBD5E1" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M19 -8 Q21 -13 19 -18" stroke="#CBD5E1" strokeWidth="1.5" fill="none" opacity="0.4" />
      </g>

      {/* Floating document/evidence */}
      <g transform="translate(30, 75)">
        <rect width="25" height="30" rx="2" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="1" />
        <rect x="4" y="5" width="17" height="2" rx="1" fill="#E2E8F0" />
        <rect x="4" y="10" width="14" height="2" rx="1" fill="#E2E8F0" />
        <rect x="4" y="15" width="17" height="2" rx="1" fill="#E2E8F0" />
        <rect x="4" y="20" width="10" height="2" rx="1" fill="#E2E8F0" />
        <circle cx="18" cy="24" r="4" fill="#EF4444" opacity="0.3" />
      </g>

      {/* Connection lines */}
      <path
        d="M45 50 Q60 60 35 130"
        stroke={COLORS.topBlue}
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M160 60 Q170 100 165 95"
        stroke={COLORS.topAccent}
        strokeWidth="1"
        strokeDasharray="3 3"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
