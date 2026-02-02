import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function MarketplaceVendor({
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

      {/* Storefront */}
      <rect x="45" y="80" width="110" height="75" rx="4" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="2" />
      
      {/* Awning */}
      <path
        d="M40 80 L100 60 L160 80"
        fill="none"
        stroke={COLORS.topBlue}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M40 80 Q55 90 70 80 Q85 70 100 80 Q115 90 130 80 Q145 70 160 80"
        fill={COLORS.topBlue}
        opacity="0.9"
      />
      <path
        d="M40 80 Q55 90 70 80 Q85 70 100 80 Q115 90 130 80 Q145 70 160 80 L160 88 Q145 78 130 88 Q115 98 100 88 Q85 78 70 88 Q55 98 40 88 Z"
        fill={COLORS.topBlueDark}
        opacity="0.3"
      />

      {/* Window displays */}
      <rect x="52" y="95" width="40" height="35" rx="2" fill="#F1F5F9" />
      <rect x="108" y="95" width="40" height="35" rx="2" fill="#F1F5F9" />

      {/* Products on display */}
      <rect x="58" y="110" width="12" height="18" rx="2" fill={COLORS.topAccent} />
      <rect x="74" y="105" width="12" height="23" rx="2" fill="#F59E0B" />
      <rect x="114" y="108" width="12" height="20" rx="2" fill="#EC4899" />
      <rect x="130" y="112" width="12" height="16" rx="2" fill="#22C55E" />

      {/* Door */}
      <rect x="85" y="115" width="30" height="40" rx="2" fill={COLORS.topBlue} opacity="0.2" />
      <circle cx="110" cy="135" r="2" fill={COLORS.topBlueDark} />

      {/* Shopping bag */}
      <path
        d="M160 140 L175 140 L180 170 L155 170 Z"
        fill={COLORS.topAccent}
      />
      <path
        d="M162 140 Q167 130 175 140"
        fill="none"
        stroke={COLORS.topAccentDark}
        strokeWidth="2"
      />

      {/* Price tags */}
      <circle cx="55" cy="70" r="8" fill="#F59E0B" />
      <text x="55" y="73" textAnchor="middle" fontSize="8" fill={COLORS.white} fontWeight="bold">$</text>

      {/* Star rating */}
      <g transform="translate(140, 50)">
        <path d="M5 0 L6.5 3.5 L10 4 L7.5 6.5 L8 10 L5 8.5 L2 10 L2.5 6.5 L0 4 L3.5 3.5 Z" fill="#F59E0B" />
        <path d="M20 0 L21.5 3.5 L25 4 L22.5 6.5 L23 10 L20 8.5 L17 10 L17.5 6.5 L15 4 L18.5 3.5 Z" fill="#F59E0B" />
      </g>
    </svg>
  );
}
