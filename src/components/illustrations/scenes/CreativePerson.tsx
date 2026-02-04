import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses, COLORS } from '../utils';

export function CreativePerson({
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

      {/* Floating color swatches */}
      <circle cx="40" cy="50" r="10" fill="#EC4899" opacity="0.8" />
      <circle cx="55" cy="35" r="8" fill={COLORS.topBlue} opacity="0.8" />
      <circle cx="30" cy="70" r="6" fill="#22C55E" opacity="0.8" />

      <circle cx="165" cy="60" r="9" fill={COLORS.topAccent} opacity="0.8" />
      <circle cx="150" cy="45" r="7" fill="#F59E0B" opacity="0.8" />
      <circle cx="170" cy="80" r="5" fill="#8B5CF6" opacity="0.8" />

      {/* Paintbrush strokes in background */}
      <path
        d="M25 140 Q40 130 55 140"
        stroke="#EC4899"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
      <path
        d="M150 145 Q165 135 180 145"
        stroke={COLORS.topAccent}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />

      {/* Easel */}
      <line x1="130" y1="100" x2="145" y2="170" stroke="#8B4513" strokeWidth="3" />
      <line x1="170" y1="100" x2="155" y2="170" stroke="#8B4513" strokeWidth="3" />
      <line x1="135" y1="135" x2="165" y2="135" stroke="#8B4513" strokeWidth="2" />

      {/* Canvas on easel */}
      <rect x="125" y="80" width="50" height="55" rx="2" fill={COLORS.white} stroke="#E2E8F0" strokeWidth="2" />
      
      {/* Art on canvas */}
      <circle cx="140" cy="100" r="12" fill={COLORS.topBlue} opacity="0.6" />
      <circle cx="155" cy="105" r="8" fill="#EC4899" opacity="0.6" />
      <path d="M135 120 Q150 110 165 120" stroke="#22C55E" strokeWidth="3" fill="none" opacity="0.6" />

      {/* Person - Body with artistic smock */}
      <path
        d="M60 175 
           L55 130
           Q55 115 75 110
           L75 175"
        fill="#8B5CF6"
      />
      <path
        d="M75 175 
           L75 110
           Q95 115 95 130
           L100 175"
        fill="#7C3AED"
      />

      {/* Paint splatter on smock */}
      <circle cx="65" cy="140" r="3" fill="#EC4899" opacity="0.7" />
      <circle cx="80" cy="150" r="2" fill={COLORS.topBlue} opacity="0.7" />
      <circle cx="70" cy="160" r="2.5" fill="#22C55E" opacity="0.7" />

      {/* Arms */}
      <path
        d="M55 115 Q40 120 35 135 Q33 142 40 145"
        fill={COLORS.skin}
        stroke={COLORS.skin}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M95 115 Q110 110 118 100"
        fill={COLORS.skin}
        stroke={COLORS.skin}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Palette in left hand */}
      <ellipse cx="38" cy="148" rx="15" ry="10" fill="#D4A574" />
      <ellipse cx="35" cy="143" rx="3" ry="2" fill="#EF4444" />
      <ellipse cx="42" cy="145" rx="3" ry="2" fill="#F59E0B" />
      <ellipse cx="32" cy="150" rx="3" ry="2" fill={COLORS.topBlue} />
      <ellipse cx="40" cy="152" rx="3" ry="2" fill="#22C55E" />
      <ellipse cx="47" cy="149" rx="3" ry="2" fill="#EC4899" />
      {/* Thumb hole */}
      <ellipse cx="38" cy="155" rx="4" ry="3" fill={COLORS.skin} />

      {/* Paintbrush in right hand */}
      <line x1="118" y1="100" x2="135" y2="95" stroke="#8B4513" strokeWidth="3" strokeLinecap="round" />
      <path d="M135 95 L142 93 L140 97 Z" fill="#EC4899" />

      {/* Neck */}
      <rect x="70" y="85" width="15" height="12" fill={COLORS.skin} />

      {/* Head */}
      <ellipse cx="77" cy="70" rx="22" ry="24" fill={COLORS.skin} />

      {/* Artistic beret */}
      <ellipse cx="77" cy="50" rx="25" ry="8" fill="#1E293B" />
      <path
        d="M52 50 Q52 35 77 35 Q102 35 102 50"
        fill="#1E293B"
      />
      <circle cx="77" cy="32" r="4" fill="#1E293B" />

      {/* Curly hair peeking out */}
      <circle cx="55" cy="55" r="5" fill="#8B4513" />
      <circle cx="60" cy="50" r="4" fill="#8B4513" />
      <circle cx="95" cy="52" r="4" fill="#8B4513" />
      <circle cx="100" cy="57" r="5" fill="#8B4513" />

      {/* Face */}
      <ellipse cx="68" cy="70" rx="3" ry="3.5" fill="#1E293B" />
      <ellipse cx="86" cy="70" rx="3" ry="3.5" fill="#1E293B" />
      
      {/* Eyebrows raised in inspiration */}
      <path d="M63 63 Q68 60 73 63" stroke="#8B4513" strokeWidth="2" fill="none" />
      <path d="M81 63 Q86 60 91 63" stroke="#8B4513" strokeWidth="2" fill="none" />

      {/* Happy smile */}
      <path
        d="M68 80 Q77 88 86 80"
        stroke={COLORS.skinShadow}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rosy cheeks */}
      <ellipse cx="60" cy="75" rx="4" ry="3" fill="#FDA4AF" opacity="0.5" />
      <ellipse cx="94" cy="75" rx="4" ry="3" fill="#FDA4AF" opacity="0.5" />

      {/* Sparkles of inspiration */}
      <path
        d="M45 30 L47 35 L52 35 L48 39 L50 44 L45 41 L40 44 L42 39 L38 35 L43 35 Z"
        fill="#F59E0B"
      />
      <path
        d="M160 30 L161 33 L164 33 L162 36 L163 39 L160 37 L157 39 L158 36 L156 33 L159 33 Z"
        fill={COLORS.topAccent}
      />
    </svg>
  );
}
