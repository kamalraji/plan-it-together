import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function ExplorerAstronaut({
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
        <circle cx="100" cy="100" r="90" fill="#0F172A" opacity="0.8" />
      )}

      {/* Stars */}
      <circle cx="30" cy="40" r="2" fill={COLORS.white} />
      <circle cx="170" cy="35" r="1.5" fill={COLORS.white} />
      <circle cx="25" cy="100" r="1" fill={COLORS.white} />
      <circle cx="180" cy="90" r="2" fill={COLORS.white} />
      <circle cx="45" cy="160" r="1.5" fill={COLORS.white} />
      <circle cx="160" cy="155" r="1" fill={COLORS.white} />
      <circle cx="55" cy="75" r="1" fill={COLORS.white} />
      <circle cx="150" cy="120" r="1.5" fill={COLORS.white} />

      {/* Twinkling stars */}
      <path d="M40 70 L42 75 L47 75 L43 79 L45 84 L40 81 L35 84 L37 79 L33 75 L38 75 Z" fill="#FCD34D" opacity="0.8" />
      <path d="M165 65 L166 68 L169 68 L167 71 L168 74 L165 72 L162 74 L163 71 L161 68 L164 68 Z" fill="#FCD34D" opacity="0.6" />

      {/* Planet */}
      <g transform="translate(155, 140)">
        <circle r="18" fill="#8B5CF6" />
        <ellipse rx="25" ry="5" fill="none" stroke="#A78BFA" strokeWidth="2" transform="rotate(-20)" />
        <circle cx="-5" cy="-8" r="3" fill="#7C3AED" opacity="0.5" />
        <circle cx="8" cy="5" r="4" fill="#7C3AED" opacity="0.4" />
      </g>

      {/* Rocket in background */}
      <g transform="translate(30, 130) rotate(-30)">
        <ellipse cx="0" cy="0" rx="8" ry="20" fill="#E2E8F0" />
        <ellipse cx="0" cy="-15" rx="5" ry="8" fill="#EF4444" />
        {/* Fins */}
        <path d="M-8 10 L-15 25 L-5 15" fill="#EF4444" />
        <path d="M8 10 L15 25 L5 15" fill="#EF4444" />
        {/* Flame */}
        <path d="M-4 20 Q0 35 4 20" fill="#F59E0B" />
        <path d="M-2 20 Q0 28 2 20" fill="#FCD34D" />
        {/* Window */}
        <circle cy="-5" r="4" fill={COLORS.topAccent} opacity="0.8" />
      </g>

      {/* Astronaut */}
      
      {/* Legs */}
      <path d="M85 170 L82 145" stroke={COLORS.white} strokeWidth="14" strokeLinecap="round" />
      <path d="M115 170 L118 148" stroke={COLORS.white} strokeWidth="14" strokeLinecap="round" />
      
      {/* Boots */}
      <ellipse cx="80" cy="173" rx="12" ry="6" fill="#64748B" />
      <ellipse cx="120" cy="173" rx="12" ry="6" fill="#64748B" />

      {/* Body - space suit */}
      <path
        d="M70 150
           Q68 120 80 100
           L120 100
           Q132 120 130 150
           Z"
        fill={COLORS.white}
      />
      
      {/* Suit details */}
      <rect x="88" y="110" width="24" height="20" rx="3" fill="#E2E8F0" />
      {/* Control panel on chest */}
      <rect x="92" y="114" width="6" height="4" rx="1" fill="#EF4444" />
      <rect x="100" y="114" width="6" height="4" rx="1" fill="#22C55E" />
      <rect x="92" y="120" width="14" height="3" rx="1" fill={COLORS.topBlue} />

      {/* Arms */}
      <path
        d="M75 105 Q55 110 45 125"
        stroke={COLORS.white}
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M125 105 Q145 100 155 90"
        stroke={COLORS.white}
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />

      {/* Gloves */}
      <ellipse cx="43" cy="128" rx="8" ry="6" fill="#64748B" />
      <ellipse cx="158" cy="88" rx="8" ry="6" fill="#64748B" />

      {/* Waving hand detail */}
      <ellipse cx="160" cy="85" rx="3" ry="4" fill="#64748B" />
      <ellipse cx="163" cy="88" rx="3" ry="4" fill="#64748B" />

      {/* Flag in hand */}
      <g transform="translate(40, 100)">
        <line x1="0" y1="30" x2="0" y2="0" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="0" y="0" width="20" height="12" fill={COLORS.topBlue} />
        <circle cx="6" cy="6" r="3" fill={COLORS.white} />
      </g>

      {/* Helmet */}
      <ellipse cx="100" cy="70" rx="30" ry="32" fill={COLORS.white} />
      
      {/* Helmet visor */}
      <ellipse cx="100" cy="72" rx="22" ry="24" fill="#0EA5E9" opacity="0.6" />
      <ellipse cx="100" cy="72" rx="20" ry="22" fill="#0284C7" opacity="0.4" />
      
      {/* Visor reflection */}
      <ellipse cx="90" cy="62" rx="8" ry="10" fill={COLORS.white} opacity="0.3" />

      {/* Face visible through visor */}
      <ellipse cx="100" cy="75" rx="15" ry="17" fill={COLORS.skin} />
      <ellipse cx="94" cy="72" rx="2" ry="2.5" fill="#4A3728" />
      <ellipse cx="106" cy="72" rx="2" ry="2.5" fill="#4A3728" />
      <path d="M96 82 Q100 86 104 82" stroke={COLORS.skinShadow} strokeWidth="2" fill="none" />

      {/* Helmet rim */}
      <ellipse cx="100" cy="95" rx="28" ry="8" fill="#E2E8F0" />

      {/* Backpack/life support */}
      <rect x="78" y="105" width="44" height="35" rx="5" fill="#CBD5E1" />
      <circle cx="90" cy="115" r="4" fill="#64748B" />
      <circle cx="110" cy="115" r="4" fill="#64748B" />
      <rect x="85" y="125" width="30" height="8" rx="2" fill="#94A3B8" />

      {/* Oxygen tubes */}
      <path d="M78 110 Q70 105 72 95" stroke="#94A3B8" strokeWidth="3" fill="none" />
      <path d="M122 110 Q130 105 128 95" stroke="#94A3B8" strokeWidth="3" fill="none" />

      {/* Floating sparkles around */}
      <circle cx="65" cy="55" r="3" fill={COLORS.topAccent} opacity="0.6" />
      <circle cx="140" cy="130" r="2" fill="#F59E0B" opacity="0.6" />
    </svg>
  );
}
