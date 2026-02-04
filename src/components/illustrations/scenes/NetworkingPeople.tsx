import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { LocationPin } from '../elements/LocationPin';

export const NetworkingPeople = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.topAccent,
  animation = 'none',
}: IllustrationProps) => {
  const styles = getSizeStyles(size);
  const classes = buildIllustrationClasses(animation, className);

  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={classes}
      style={styles}
      role="img"
      aria-label="Two people networking and shaking hands"
    >
      <defs>
        <linearGradient id="netSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="netTopGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
        <linearGradient id="netTopGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} />
          <stop offset="100%" stopColor={COLORS.topAccentDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          <LocationPin x={180} y={40} size={45} primaryColor={primaryColor} />
          
          {/* Connection dots */}
          <circle cx="100" cy="120" r="6" fill={primaryColor} opacity="0.2" />
          <circle cx="300" cy="100" r="5" fill={accentColor} opacity="0.2" />
          <circle cx="80" cy="180" r="4" fill={accentColor} opacity="0.15" />
          <circle cx="320" cy="160" r="5" fill={primaryColor} opacity="0.15" />
        </g>
      )}

      {/* Person 1 - Left */}
      <g>
        <path
          d="M60 230 Q50 250 55 300 L70 370 Q100 375 130 370 L145 300 Q150 250 140 230 Q100 215 60 230"
          fill="url(#netTopGradient1)"
        />
        <ellipse cx="100" cy="215" rx="14" ry="16" fill="url(#netSkinGradient)" />
        <ellipse cx="100" cy="175" rx="38" ry="45" fill="url(#netSkinGradient)" />
        <path
          d="M62 160 Q55 135 70 115 Q90 100 100 100 Q110 100 130 115 Q145 135 138 160 Q135 140 100 135 Q65 140 62 160"
          fill={COLORS.hair}
        />
        <ellipse cx="88" cy="175" rx="4" ry="3" fill={COLORS.hair} />
        <ellipse cx="112" cy="175" rx="4" ry="3" fill={COLORS.hair} />
        <path d="M92 195 Q100 203 108 195" stroke={COLORS.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Right arm reaching */}
        <path
          d="M140 250 Q170 240 195 250"
          stroke="url(#netSkinGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Person 2 - Right */}
      <g>
        <path
          d="M260 230 Q250 250 255 300 L270 370 Q300 375 330 370 L345 300 Q350 250 340 230 Q300 215 260 230"
          fill="url(#netTopGradient2)"
        />
        <ellipse cx="300" cy="215" rx="14" ry="16" fill="url(#netSkinGradient)" />
        <ellipse cx="300" cy="175" rx="38" ry="45" fill="url(#netSkinGradient)" />
        <path
          d="M262 165 Q258 140 268 120 Q285 105 300 105 Q315 105 332 120 Q342 140 338 165 Q335 185 325 190 Q310 175 300 175 Q290 175 275 190 Q265 185 262 165"
          fill={COLORS.hair}
        />
        <ellipse cx="288" cy="175" rx="4" ry="3" fill={COLORS.hair} />
        <ellipse cx="312" cy="175" rx="4" ry="3" fill={COLORS.hair} />
        <path d="M292 195 Q300 203 308 195" stroke={COLORS.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Left arm reaching */}
        <path
          d="M260 250 Q230 240 205 250"
          stroke="url(#netSkinGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Handshake */}
      <ellipse cx="200" cy="252" rx="18" ry="14" fill="url(#netSkinGradient)" />
      
      {/* Connection glow */}
      <circle cx="200" cy="252" r="30" fill={primaryColor} opacity="0.1" />
    </svg>
  );
};
