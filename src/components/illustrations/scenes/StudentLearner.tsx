import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function StudentLearner({
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

      {/* Floating books in background */}
      <g transform="translate(30, 35)">
        <rect width="20" height="25" rx="2" fill="#8B5CF6" transform="rotate(-10)" />
        <rect x="2" y="2" width="16" height="21" rx="1" fill="#A78BFA" transform="rotate(-10)" />
      </g>

      <g transform="translate(155, 50)">
        <rect width="18" height="22" rx="2" fill={COLORS.topBlue} transform="rotate(8)" />
        <rect x="2" y="2" width="14" height="18" rx="1" fill="#60A5FA" transform="rotate(8)" />
      </g>

      {/* Lightbulb - idea */}
      <g transform="translate(150, 25)">
        <path
          d="M15 5 Q25 5 25 18 Q25 28 20 32 L10 32 Q5 28 5 18 Q5 5 15 5"
          fill="#FEF3C7"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <rect x="10" y="32" width="10" height="5" fill="#F59E0B" />
        <line x1="12" y1="35" x2="18" y2="35" stroke="#D97706" strokeWidth="1" />
        {/* Rays */}
        <line x1="15" y1="0" x2="15" y2="-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="15" x2="33" y2="15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <line x1="2" y1="15" x2="-3" y2="15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Desk */}
      <rect x="45" y="140" width="110" height="6" rx="2" fill="#D4A574" />
      <rect x="50" y="146" width="8" height="20" fill="#C4956A" />
      <rect x="142" y="146" width="8" height="20" fill="#C4956A" />

      {/* Stack of books on desk */}
      <g transform="translate(120, 115)">
        <rect y="15" width="28" height="8" rx="1" fill="#EF4444" />
        <rect y="8" width="28" height="8" rx="1" fill="#22C55E" />
        <rect y="0" width="28" height="9" rx="1" fill={COLORS.topBlue} />
      </g>

      {/* Open book being read */}
      <g transform="translate(55, 100)">
        {/* Left page */}
        <path
          d="M40 0 Q20 5 5 0 L5 40 Q20 35 40 40 Z"
          fill={COLORS.white}
          stroke="#E2E8F0"
          strokeWidth="1"
        />
        {/* Right page */}
        <path
          d="M40 0 Q60 5 75 0 L75 40 Q60 35 40 40 Z"
          fill="#F8FAFC"
          stroke="#E2E8F0"
          strokeWidth="1"
        />
        {/* Text lines - left */}
        <line x1="12" y1="10" x2="35" y2="12" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="10" y1="18" x2="35" y2="20" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="11" y1="26" x2="32" y2="28" stroke="#CBD5E1" strokeWidth="2" />
        {/* Text lines - right */}
        <line x1="45" y1="12" x2="68" y2="10" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="45" y1="20" x2="70" y2="18" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="45" y1="28" x2="65" y2="26" stroke="#CBD5E1" strokeWidth="2" />
        {/* Spine */}
        <line x1="40" y1="0" x2="40" y2="40" stroke="#CBD5E1" strokeWidth="2" />
      </g>

      {/* Person - sitting pose suggested by body */}
      <path
        d="M75 170
           L70 145
           Q70 130 85 125
           L85 170"
        fill="#8B5CF6"
      />
      <path
        d="M85 170
           L85 125
           Q100 130 100 145
           L105 170"
        fill="#7C3AED"
      />

      {/* Arms holding/near book */}
      <path
        d="M70 128 Q55 125 55 115 Q55 105 65 100"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M100 128 Q115 125 125 120 Q135 115 130 105"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Hands on book */}
      <ellipse cx="60" cy="102" rx="6" ry="5" fill={COLORS.skin} />
      <ellipse cx="125" cy="108" rx="6" ry="5" fill={COLORS.skin} />

      {/* Neck */}
      <rect x="82" y="78" width="12" height="10" fill={COLORS.skin} />

      {/* Head - tilted slightly forward reading */}
      <ellipse cx="88" cy="60" rx="20" ry="22" fill={COLORS.skin} />

      {/* Hair - studious style */}
      <path
        d="M68 55
           Q68 35 88 32
           Q108 35 108 55
           Q108 45 88 42
           Q68 45 68 55"
        fill="#4A3728"
      />
      {/* Side hair */}
      <path d="M68 55 Q65 60 66 70" stroke="#4A3728" strokeWidth="4" fill="none" />
      <path d="M108 55 Q111 60 110 70" stroke="#4A3728" strokeWidth="4" fill="none" />

      {/* Eyes - focused on book */}
      <ellipse cx="80" cy="60" rx="3" ry="4" fill="#4A3728" />
      <ellipse cx="96" cy="60" rx="3" ry="4" fill="#4A3728" />
      <circle cx="79" cy="59" r="1" fill={COLORS.white} />
      <circle cx="95" cy="59" r="1" fill={COLORS.white} />

      {/* Glasses */}
      <circle cx="80" cy="60" r="8" fill="none" stroke="#64748B" strokeWidth="1.5" />
      <circle cx="96" cy="60" r="8" fill="none" stroke="#64748B" strokeWidth="1.5" />
      <line x1="88" y1="60" x2="88" y2="60" stroke="#64748B" strokeWidth="1.5" />
      <path d="M72 58 L68 55" stroke="#64748B" strokeWidth="1.5" />
      <path d="M104" y1="58" x2="108" y2="55" stroke="#64748B" strokeWidth="1.5" />

      {/* Small concentrated mouth */}
      <ellipse cx="88" cy="72" rx="3" ry="2" fill={COLORS.skinShadow} />

      {/* Pencil behind ear */}
      <line x1="108" y1="50" x2="118" y2="40" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <polygon points="118,40 122,36 120,42" fill="#FCD34D" />

      {/* Floating thought bubbles with symbols */}
      <circle cx="45" cy="45" r="10" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="1" />
      <text x="45" y="49" fontSize="12" fill={COLORS.topBlue} textAnchor="middle">?</text>

      <circle cx="35" cy="65" r="6" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="1" />
      <text x="35" y="68" fontSize="8" fill="#22C55E" textAnchor="middle">!</text>
    </svg>
  );
}
