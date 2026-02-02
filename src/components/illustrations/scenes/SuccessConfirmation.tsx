import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function SuccessConfirmation({
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

      {/* Success circle */}
      <circle cx="100" cy="100" r="50" fill="#22C55E" />
      <circle cx="100" cy="100" r="42" fill="#16A34A" opacity="0.3" />

      {/* Checkmark */}
      <path
        d="M75 100 L92 117 L125 84"
        stroke={COLORS.white}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Confetti particles */}
      <circle cx="45" cy="55" r="4" fill={COLORS.topBlue} />
      <circle cx="155" cy="60" r="3" fill={COLORS.topAccent} />
      <circle cx="35" cy="110" r="3" fill="#F59E0B" />
      <circle cx="165" cy="105" r="4" fill="#EC4899" />
      <circle cx="50" cy="150" r="3" fill={COLORS.topBlue} />
      <circle cx="150" cy="145" r="3" fill="#22C55E" />

      {/* Stars */}
      <path
        d="M40 75 L42 80 L47 80 L43 84 L45 89 L40 86 L35 89 L37 84 L33 80 L38 80 Z"
        fill="#F59E0B"
      />
      <path
        d="M160 130 L162 135 L167 135 L163 139 L165 144 L160 141 L155 144 L157 139 L153 135 L158 135 Z"
        fill={COLORS.topAccent}
      />

      {/* Sparkle lines */}
      <line x1="60" y1="45" x2="65" y2="50" stroke={COLORS.topBlue} strokeWidth="2" strokeLinecap="round" />
      <line x1="140" y1="48" x2="135" y2="53" stroke={COLORS.topAccent} strokeWidth="2" strokeLinecap="round" />
      <line x1="55" y1="140" x2="60" y2="135" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
      <line x1="145" y1="138" x2="140" y2="133" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
