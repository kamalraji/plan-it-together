import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function BuilderPerson({
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

      {/* Building blocks in background */}
      <rect x="145" y="45" width="25" height="20" rx="2" fill={COLORS.topBlue} opacity="0.3" />
      <rect x="155" y="30" width="20" height="18" rx="2" fill={COLORS.topAccent} opacity="0.3" />
      <rect x="160" y="62" width="18" height="15" rx="2" fill="#22C55E" opacity="0.3" />

      {/* Crane in background */}
      <g transform="translate(25, 30)" opacity="0.4">
        <line x1="10" y1="60" x2="10" y2="10" stroke="#64748B" strokeWidth="3" />
        <line x1="10" y1="15" x2="40" y2="15" stroke="#64748B" strokeWidth="2" />
        <line x1="35" y1="15" x2="35" y2="35" stroke="#64748B" strokeWidth="1" />
        <rect x="30" y="35" width="10" height="8" fill="#F59E0B" />
      </g>

      {/* Blueprint paper */}
      <g transform="translate(120, 110)">
        <rect width="50" height="35" rx="2" fill="#DBEAFE" />
        <rect x="3" y="3" width="44" height="29" fill="#EFF6FF" />
        {/* Blueprint grid */}
        <line x1="5" y1="10" x2="45" y2="10" stroke="#93C5FD" strokeWidth="0.5" />
        <line x1="5" y1="20" x2="45" y2="20" stroke="#93C5FD" strokeWidth="0.5" />
        <line x1="15" y1="5" x2="15" y2="30" stroke="#93C5FD" strokeWidth="0.5" />
        <line x1="35" y1="5" x2="35" y2="30" stroke="#93C5FD" strokeWidth="0.5" />
        {/* Blueprint drawing */}
        <rect x="10" y="12" width="15" height="12" fill="none" stroke={COLORS.topBlue} strokeWidth="1" />
        <line x1="10" y1="18" x2="25" y2="18" stroke={COLORS.topBlue} strokeWidth="0.5" />
      </g>

      {/* Stack of building blocks being built */}
      <g transform="translate(35, 120)">
        <rect y="30" width="30" height="20" rx="2" fill="#64748B" />
        <rect x="5" y="15" width="25" height="18" rx="2" fill="#94A3B8" />
        <rect x="2" y="0" width="22" height="18" rx="2" fill="#CBD5E1" />
      </g>

      {/* Person - Builder */}
      
      {/* Legs */}
      <path d="M80 170 L78 145" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
      <path d="M105 170 L108 150" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
      
      {/* Boots */}
      <ellipse cx="78" cy="172" rx="10" ry="5" fill="#78350F" />
      <ellipse cx="108" cy="172" rx="10" ry="5" fill="#78350F" />

      {/* Body - work vest */}
      <path
        d="M72 145
           Q72 120 80 105
           L110 105
           Q118 120 118 145"
        fill="#F59E0B"
      />
      {/* Vest details */}
      <line x1="95" y1="108" x2="95" y2="140" stroke="#D97706" strokeWidth="2" />
      <rect x="78" y="115" width="12" height="8" rx="1" fill="#FBBF24" />
      <rect x="100" y="115" width="12" height="8" rx="1" fill="#FBBF24" />

      {/* Arms */}
      <path
        d="M75 110 Q55 115 50 130"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M115 110 Q130 100 140 105"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Hand holding block */}
      <ellipse cx="48" cy="132" rx="6" ry="5" fill={COLORS.skin} />
      <rect x="38" y="125" width="18" height="14" rx="2" fill={COLORS.topBlue} />

      {/* Hand with tool */}
      <ellipse cx="143" cy="105" rx="6" ry="5" fill={COLORS.skin} />
      
      {/* Wrench */}
      <g transform="translate(145, 95) rotate(30)">
        <rect x="-2" y="0" width="4" height="20" rx="1" fill="#64748B" />
        <circle cy="22" r="5" fill="#64748B" />
        <circle cy="22" r="2" fill="#475569" />
      </g>

      {/* Neck */}
      <rect x="88" y="82" width="14" height="10" fill={COLORS.skin} />

      {/* Head */}
      <ellipse cx="95" cy="62" rx="20" ry="23" fill={COLORS.skin} />

      {/* Hard hat */}
      <path
        d="M70 58
           Q70 38 95 35
           Q120 38 120 58"
        fill="#F59E0B"
      />
      <ellipse cx="95" cy="58" rx="28" ry="8" fill="#FBBF24" />
      <rect x="88" y="35" width="14" height="8" rx="2" fill="#D97706" />

      {/* Face */}
      <ellipse cx="87" cy="62" rx="2.5" ry="3" fill="#4A3728" />
      <ellipse cx="103" cy="62" rx="2.5" ry="3" fill="#4A3728" />
      
      {/* Confident smile */}
      <path
        d="M88 74 Q95 80 102 74"
        stroke={COLORS.skinShadow}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Stubble */}
      <g opacity="0.3">
        <circle cx="85" cy="78" r="0.5" fill="#4A3728" />
        <circle cx="90" cy="80" r="0.5" fill="#4A3728" />
        <circle cx="95" cy="81" r="0.5" fill="#4A3728" />
        <circle cx="100" cy="80" r="0.5" fill="#4A3728" />
        <circle cx="105" cy="78" r="0.5" fill="#4A3728" />
      </g>

      {/* Tool belt */}
      <rect x="70" y="138" width="50" height="8" rx="2" fill="#78350F" />
      <rect x="75" y="140" width="8" height="12" rx="1" fill="#92400E" />
      <rect x="107" y="140" width="8" height="12" rx="1" fill="#92400E" />
      <circle cx="95" cy="142" r="3" fill="#D4A574" />

      {/* Floating gears */}
      <g transform="translate(155, 80)">
        <circle r="8" fill="#E2E8F0" />
        <circle r="3" fill={COLORS.lightGray} />
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <rect
            key={i}
            x="-2"
            y="-10"
            width="4"
            height="5"
            rx="1"
            fill="#E2E8F0"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>
    </svg>
  );
}
