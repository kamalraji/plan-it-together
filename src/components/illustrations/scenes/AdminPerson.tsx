import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function AdminPerson({
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

      {/* Settings gear - background */}
      <g transform="translate(145, 35)">
        <circle cx="15" cy="15" r="12" fill="#E2E8F0" />
        <circle cx="15" cy="15" r="6" fill={COLORS.lightGray} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <rect
            key={i}
            x="13"
            y="0"
            width="4"
            height="8"
            rx="2"
            fill="#E2E8F0"
            transform={`rotate(${angle} 15 15)`}
          />
        ))}
      </g>

      {/* Security shield */}
      <g transform="translate(25, 40)">
        <path
          d="M15 2 L28 8 L28 18 Q28 28 15 35 Q2 28 2 18 L2 8 Z"
          fill={COLORS.topBlue}
          opacity="0.2"
        />
        <path
          d="M15 8 L22 12 L22 18 Q22 24 15 28 Q8 24 8 18 L8 12 Z"
          fill={COLORS.topBlue}
          opacity="0.4"
        />
        <path
          d="M12 17 L14 19 L19 14"
          stroke={COLORS.white}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Desk/Console */}
      <rect x="55" y="130" width="90" height="8" rx="2" fill="#CBD5E1" />
      <rect x="60" y="138" width="80" height="25" rx="3" fill="#94A3B8" />

      {/* Monitor */}
      <rect x="70" y="85" width="60" height="45" rx="3" fill="#1E293B" />
      <rect x="73" y="88" width="54" height="36" rx="2" fill="#0F172A" />
      
      {/* Dashboard on screen */}
      <rect x="76" y="91" width="20" height="8" rx="1" fill={COLORS.topBlue} opacity="0.8" />
      <rect x="76" y="101" width="15" height="4" rx="1" fill="#22C55E" opacity="0.8" />
      <rect x="76" y="107" width="22" height="4" rx="1" fill={COLORS.topAccent} opacity="0.8" />
      <rect x="76" y="113" width="12" height="4" rx="1" fill="#F59E0B" opacity="0.8" />
      
      {/* Mini chart on screen */}
      <rect x="100" y="101" width="4" height="18" rx="1" fill="#22C55E" opacity="0.6" />
      <rect x="106" y="107" width="4" height="12" rx="1" fill={COLORS.topBlue} opacity="0.6" />
      <rect x="112" y="104" width="4" height="15" rx="1" fill={COLORS.topAccent} opacity="0.6" />
      <rect x="118" y="110" width="4" height="9" rx="1" fill="#F59E0B" opacity="0.6" />

      {/* Monitor stand */}
      <rect x="95" y="130" width="10" height="5" fill="#64748B" />

      {/* Person - Body */}
      <path
        d="M85 165 
           Q85 145 100 145 
           Q115 145 115 165"
        fill={COLORS.topBlue}
      />

      {/* Arms on desk */}
      <ellipse cx="72" cy="142" rx="8" ry="5" fill={COLORS.skin} />
      <ellipse cx="128" cy="142" rx="8" ry="5" fill={COLORS.skin} />

      {/* Neck */}
      <rect x="95" y="115" width="10" height="12" fill={COLORS.skin} />

      {/* Head */}
      <ellipse cx="100" cy="105" rx="18" ry="20" fill={COLORS.skin} />

      {/* Hair - short professional */}
      <path
        d="M82 100 
           Q82 80 100 78 
           Q118 80 118 100
           Q118 92 100 90
           Q82 92 82 100"
        fill={COLORS.hair}
      />

      {/* Eyes */}
      <ellipse cx="93" cy="105" rx="2.5" ry="3" fill={COLORS.hair} />
      <ellipse cx="107" cy="105" rx="2.5" ry="3" fill={COLORS.hair} />

      {/* Glasses */}
      <rect x="87" y="101" width="12" height="8" rx="2" fill="none" stroke="#64748B" strokeWidth="1.5" />
      <rect x="101" y="101" width="12" height="8" rx="2" fill="none" stroke="#64748B" strokeWidth="1.5" />
      <line x1="99" y1="105" x2="101" y2="105" stroke="#64748B" strokeWidth="1.5" />

      {/* Smile */}
      <path
        d="M95 113 Q100 117 105 113"
        stroke={COLORS.skinShadow}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Headset */}
      <path
        d="M78 100 Q78 85 100 85 Q122 85 122 100"
        stroke="#64748B"
        strokeWidth="3"
        fill="none"
      />
      <ellipse cx="78" cy="105" rx="5" ry="7" fill="#64748B" />
      <ellipse cx="122" cy="105" rx="5" ry="7" fill="#64748B" />
      
      {/* Microphone */}
      <path d="M78 112 L70 125" stroke="#64748B" strokeWidth="2" />
      <ellipse cx="68" cy="127" rx="4" ry="3" fill="#475569" />

      {/* Floating notification badges */}
      <circle cx="150" cy="85" r="8" fill="#EF4444" />
      <text x="150" y="88" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">3</text>

      <circle cx="42" cy="120" r="6" fill="#22C55E" />
      <path d="M39 120 L41 122 L45 118" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
