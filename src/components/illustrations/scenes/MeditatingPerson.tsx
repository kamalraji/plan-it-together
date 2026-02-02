import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function MeditatingPerson({
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

      {/* Zen circles emanating */}
      <circle cx="100" cy="110" r="75" fill="none" stroke={COLORS.topAccent} strokeWidth="1" opacity="0.15" />
      <circle cx="100" cy="110" r="60" fill="none" stroke={COLORS.topAccent} strokeWidth="1" opacity="0.2" />
      <circle cx="100" cy="110" r="45" fill="none" stroke={COLORS.topAccent} strokeWidth="1" opacity="0.25" />

      {/* Floating leaves */}
      <g transform="translate(35, 50) rotate(-20)">
        <path
          d="M0 10 Q5 0 15 5 Q10 10 15 20 Q5 15 0 10"
          fill="#22C55E"
          opacity="0.6"
        />
        <line x1="7" y1="8" x2="10" y2="15" stroke="#16A34A" strokeWidth="1" />
      </g>

      <g transform="translate(160, 60) rotate(15)">
        <path
          d="M0 10 Q5 0 15 5 Q10 10 15 20 Q5 15 0 10"
          fill="#22C55E"
          opacity="0.5"
        />
        <line x1="7" y1="8" x2="10" y2="15" stroke="#16A34A" strokeWidth="1" />
      </g>

      <g transform="translate(45, 140) rotate(30)">
        <path
          d="M0 8 Q4 0 12 4 Q8 8 12 16 Q4 12 0 8"
          fill={COLORS.topAccent}
          opacity="0.4"
        />
      </g>

      <g transform="translate(150, 145) rotate(-25)">
        <path
          d="M0 8 Q4 0 12 4 Q8 8 12 16 Q4 12 0 8"
          fill={COLORS.topAccent}
          opacity="0.4"
        />
      </g>

      {/* Meditation cushion */}
      <ellipse cx="100" cy="165" rx="40" ry="12" fill="#8B5CF6" />
      <ellipse cx="100" cy="162" rx="35" ry="8" fill="#A78BFA" />

      {/* Person - lotus position */}
      
      {/* Crossed legs */}
      <path
        d="M65 150 Q80 160 100 155 Q120 160 135 150"
        fill="#1E293B"
      />
      <ellipse cx="70" cy="155" rx="12" ry="8" fill="#1E293B" />
      <ellipse cx="130" cy="155" rx="12" ry="8" fill="#1E293B" />

      {/* Body - straight, relaxed posture */}
      <path
        d="M75 155
           Q75 130 85 115
           L115 115
           Q125 130 125 155"
        fill={COLORS.topBlue}
      />

      {/* Arms resting on knees - mudra position */}
      <path
        d="M80 125 Q60 135 65 150"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M120 125 Q140 135 135 150"
        stroke={COLORS.skin}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Hands in mudra */}
      <g transform="translate(60, 148)">
        <circle r="6" fill={COLORS.skin} />
        <circle cx="3" cy="-3" r="2" fill={COLORS.skin} />
        <circle cx="-1" cy="4" r="2" fill={COLORS.skin} />
      </g>
      <g transform="translate(140, 148)">
        <circle r="6" fill={COLORS.skin} />
        <circle cx="-3" cy="-3" r="2" fill={COLORS.skin} />
        <circle cx="1" cy="4" r="2" fill={COLORS.skin} />
      </g>

      {/* Neck */}
      <rect x="93" y="90" width="14" height="12" fill={COLORS.skin} />

      {/* Head - serene expression */}
      <ellipse cx="100" cy="70" rx="22" ry="25" fill={COLORS.skin} />

      {/* Hair - tied up in bun */}
      <circle cx="100" cy="40" r="10" fill="#4A3728" />
      <path
        d="M78 65
           Q78 42 100 38
           Q122 42 122 65
           Q118 52 100 50
           Q82 52 78 65"
        fill="#4A3728"
      />

      {/* Closed eyes - peaceful */}
      <path d="M88 68 Q92 72 96 68" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M104 68 Q108 72 112 68" stroke="#4A3728" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Serene smile */}
      <path
        d="M94 82 Q100 86 106 82"
        stroke={COLORS.skinShadow}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Third eye dot (optional spiritual element) */}
      <circle cx="100" cy="58" r="2" fill={COLORS.topAccent} opacity="0.5" />

      {/* Peaceful glow around head */}
      <circle cx="100" cy="65" r="32" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.3" />

      {/* Small floating elements */}
      <circle cx="55" cy="85" r="3" fill="#F59E0B" opacity="0.4" />
      <circle cx="145" cy="80" r="3" fill={COLORS.topAccent} opacity="0.4" />
      <circle cx="50" cy="120" r="2" fill="#22C55E" opacity="0.4" />
      <circle cx="150" cy="115" r="2" fill="#22C55E" opacity="0.4" />

      {/* Om symbol floating */}
      <g transform="translate(100, 25)" opacity="0.3">
        <text fontSize="16" fill={COLORS.topBlue} textAnchor="middle" fontFamily="serif">ॐ</text>
      </g>
    </svg>
  );
}
