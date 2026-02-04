import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { BarChart } from '../elements/BarChart';
import { TropicalPlant } from '../elements/TropicalPlant';

export const WorkingMan = ({
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
      aria-label="Man working on laptop"
    >
      <defs>
        <linearGradient id="manSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C4A8" />
          <stop offset="100%" stopColor="#D4A984" />
        </linearGradient>
        <linearGradient id="manTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {/* Background elements */}
      {showBackground && (
        <g>
          <TropicalPlant x={320} y={250} scale={1.3} flip />
          <BarChart x={260} y={60} width={120} height={100} accentColor={accentColor} />
        </g>
      )}

      {/* Desk */}
      <rect x="80" y="280" width="220" height="12" rx="4" fill={COLORS.hair} />
      <rect x="90" y="292" width="8" height="80" fill={COLORS.hair} />
      <rect x="282" y="292" width="8" height="80" fill={COLORS.hair} />

      {/* Laptop */}
      <g>
        {/* Screen */}
        <rect x="130" y="200" width="120" height="80" rx="4" fill="#1A202C" />
        <rect x="135" y="205" width="110" height="70" rx="2" fill="#4A5568" />
        {/* Code lines on screen */}
        <rect x="145" y="215" width="50" height="4" rx="1" fill={accentColor} opacity="0.8" />
        <rect x="145" y="225" width="70" height="4" rx="1" fill={COLORS.white} opacity="0.5" />
        <rect x="145" y="235" width="40" height="4" rx="1" fill={COLORS.white} opacity="0.5" />
        <rect x="145" y="245" width="60" height="4" rx="1" fill={accentColor} opacity="0.6" />
        {/* Keyboard */}
        <path d="M120 280 L130 200 L250 200 L260 280 Z" fill="#2D3748" />
      </g>

      {/* Coffee mug */}
      <g>
        <rect x="290" y="250" width="30" height="30" rx="3" fill={COLORS.white} />
        <path d="M320 258 Q335 265 320 275" stroke={COLORS.white} strokeWidth="4" fill="none" />
        {/* Steam */}
        <path d="M300 245 Q305 235 300 225" stroke={COLORS.chartBar} strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M310 245 Q315 232 310 220" stroke={COLORS.chartBar} strokeWidth="2" fill="none" opacity="0.4" />
      </g>

      {/* Man figure */}
      <g>
        {/* Body */}
        <path
          d="M165 150 
             Q150 170 155 210 
             L160 260 
             Q190 265 220 260 
             L225 210 
             Q230 170 215 150 
             Q190 140 165 150"
          fill="url(#manTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="190" cy="140" rx="15" ry="15" fill="url(#manSkinGradient)" />

        {/* Head */}
        <ellipse cx="190" cy="100" rx="40" ry="45" fill="url(#manSkinGradient)" />

        {/* Hair - short style */}
        <path
          d="M150 85 
             Q145 60 170 50 
             Q190 45 210 50 
             Q235 60 230 85
             Q220 70 190 68
             Q160 70 150 85"
          fill={COLORS.hair}
        />

        {/* Eyes */}
        <ellipse cx="175" cy="100" rx="5" ry="3" fill={COLORS.hair} />
        <ellipse cx="205" cy="100" rx="5" ry="3" fill={COLORS.hair} />
        
        {/* Glasses */}
        <rect x="165" y="93" width="22" height="16" rx="4" stroke={COLORS.hair} strokeWidth="2" fill="none" />
        <rect x="195" y="93" width="22" height="16" rx="4" stroke={COLORS.hair} strokeWidth="2" fill="none" />
        <line x1="187" y1="100" x2="195" y2="100" stroke={COLORS.hair} strokeWidth="2" />

        {/* Smile */}
        <path
          d="M180 118 Q190 125 200 118"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms - typing position */}
        <path
          d="M160 165 
             Q130 200 140 250 
             Q145 260 155 255"
          fill="url(#manSkinGradient)"
        />
        <path
          d="M220 165 
             Q250 200 240 250 
             Q235 260 225 255"
          fill="url(#manSkinGradient)"
        />
        
        {/* Hands on keyboard */}
        <ellipse cx="155" cy="265" rx="15" ry="10" fill="url(#manSkinGradient)" />
        <ellipse cx="225" cy="265" rx="15" ry="10" fill="url(#manSkinGradient)" />
      </g>
    </svg>
  );
};
