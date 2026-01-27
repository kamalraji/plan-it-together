import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { TropicalPlant } from '../elements/TropicalPlant';

export const CelebrationScene = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.chartAccent,
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
      aria-label="Person celebrating success"
    >
      <defs>
        <linearGradient id="celebSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="celebTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {/* Background elements */}
      {showBackground && (
        <g>
          <TropicalPlant x={20} y={300} scale={1.1} />
          <TropicalPlant x={330} y={280} scale={1.2} flip />
          
          {/* Confetti */}
          <rect x="80" y="60" width="12" height="12" rx="2" fill="#F6AD55" transform="rotate(15 86 66)" />
          <rect x="320" y="80" width="10" height="10" rx="2" fill={accentColor} transform="rotate(-20 325 85)" />
          <rect x="150" y="40" width="8" height="8" rx="1" fill="#FC8181" transform="rotate(30 154 44)" />
          <rect x="280" y="50" width="10" height="10" rx="2" fill="#68D391" transform="rotate(-10 285 55)" />
          <circle cx="100" cy="100" r="6" fill={accentColor} />
          <circle cx="300" cy="120" r="5" fill="#F6AD55" />
          <circle cx="200" cy="30" r="7" fill="#FC8181" />
          
          {/* Stars */}
          <path d="M60 150 L65 140 L70 150 L60 145 L70 145 Z" fill="#F6AD55" />
          <path d="M340 170 L345 160 L350 170 L340 165 L350 165 Z" fill={accentColor} />
        </g>
      )}

      {/* Trophy */}
      <g>
        <path
          d="M175 300 L185 260 L215 260 L225 300 Z"
          fill="#ECC94B"
        />
        <path
          d="M165 260 
             Q160 220 175 200 
             L225 200 
             Q240 220 235 260 
             Z"
          fill="#ECC94B"
        />
        <path
          d="M160 220 Q140 220 140 240 Q140 260 160 255"
          stroke="#ECC94B"
          strokeWidth="8"
          fill="none"
        />
        <path
          d="M240 220 Q260 220 260 240 Q260 260 240 255"
          stroke="#ECC94B"
          strokeWidth="8"
          fill="none"
        />
        <rect x="175" y="300" width="50" height="10" rx="2" fill="#D69E2E" />
        <rect x="165" y="310" width="70" height="15" rx="3" fill="#B7791F" />
        {/* Star on trophy */}
        <path d="M200 220 L205 235 L220 235 L208 245 L213 260 L200 250 L187 260 L192 245 L180 235 L195 235 Z" fill={COLORS.white} />
      </g>

      {/* Person figure - arms raised in celebration */}
      <g>
        {/* Body */}
        <path
          d="M160 180 
             Q145 200 150 240 
             L165 320 
             Q200 330 235 320 
             L250 240 
             Q255 200 240 180 
             Q200 165 160 180"
          fill="url(#celebTopGradient)"
        />

        {/* Pants */}
        <path
          d="M165 280 
             Q155 340 160 380 
             L185 385 
             L195 320
             L205 385 
             L240 380 
             Q245 340 235 280 
             Q200 290 165 280"
          fill={COLORS.skirt}
        />

        {/* Neck */}
        <ellipse cx="200" cy="165" rx="18" ry="18" fill="url(#celebSkinGradient)" />

        {/* Head */}
        <ellipse cx="200" cy="120" rx="42" ry="50" fill="url(#celebSkinGradient)" />

        {/* Hair */}
        <path
          d="M158 105 
             Q150 75 175 55 
             Q200 45 225 55 
             Q250 75 242 105
             Q235 85 200 80
             Q165 85 158 105"
          fill={COLORS.hair}
        />

        {/* Excited face */}
        {/* Eyes - wide open */}
        <ellipse cx="182" cy="115" rx="8" ry="8" fill={COLORS.white} />
        <ellipse cx="218" cy="115" rx="8" ry="8" fill={COLORS.white} />
        <circle cx="182" cy="115" r="4" fill={COLORS.hair} />
        <circle cx="218" cy="115" r="4" fill={COLORS.hair} />
        
        {/* Big smile */}
        <path
          d="M180 140 Q200 160 220 140"
          stroke={COLORS.hair}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M185 145 Q200 155 215 145"
          fill={COLORS.white}
        />

        {/* Arms raised high */}
        <path
          d="M155 195 
             Q120 150 90 100 
             Q85 90 95 88 
             Q130 130 160 180"
          fill="url(#celebSkinGradient)"
        />
        <path
          d="M245 195 
             Q280 150 310 100 
             Q315 90 305 88 
             Q270 130 240 180"
          fill="url(#celebSkinGradient)"
        />
        
        {/* Hands */}
        <ellipse cx="92" cy="85" rx="15" ry="12" fill="url(#celebSkinGradient)" />
        <ellipse cx="308" cy="85" rx="15" ry="12" fill="url(#celebSkinGradient)" />
      </g>
    </svg>
  );
};
