import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { LaptopOpen } from '../elements/LaptopOpen';

export const TeamCollaboration = ({
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
      aria-label="Team collaborating together"
    >
      <defs>
        <linearGradient id="teamSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="teamTopGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
        <linearGradient id="teamTopGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} />
          <stop offset="100%" stopColor={COLORS.topAccentDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          <LaptopOpen x={150} y={280} size={100} primaryColor={primaryColor} />
        </g>
      )}

      {/* Person 1 - Left */}
      <g>
        <path
          d="M80 220 Q70 240 75 280 L90 340 Q115 345 140 340 L155 280 Q160 240 150 220 Q115 210 80 220"
          fill="url(#teamTopGradient1)"
        />
        <ellipse cx="115" cy="205" rx="14" ry="16" fill="url(#teamSkinGradient)" />
        <ellipse cx="115" cy="165" rx="35" ry="42" fill="url(#teamSkinGradient)" />
        <path
          d="M80 145 Q70 125 85 105 Q105 90 115 90 Q125 90 145 105 Q160 125 150 145 Q145 125 115 120 Q85 125 80 145"
          fill={COLORS.hair}
        />
        <ellipse cx="102" cy="165" rx="4" ry="3" fill={COLORS.hair} />
        <ellipse cx="128" cy="165" rx="4" ry="3" fill={COLORS.hair} />
        <path d="M108 182 Q115 190 122 182" stroke={COLORS.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Arm pointing */}
        <path
          d="M150 240 Q180 230 210 240"
          stroke="url(#teamSkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Person 2 - Right */}
      <g>
        <path
          d="M250 220 Q240 240 245 280 L260 340 Q285 345 310 340 L325 280 Q330 240 320 220 Q285 210 250 220"
          fill="url(#teamTopGradient2)"
        />
        <ellipse cx="285" cy="205" rx="14" ry="16" fill="url(#teamSkinGradient)" />
        <ellipse cx="285" cy="165" rx="35" ry="42" fill="url(#teamSkinGradient)" />
        <path
          d="M250 155 Q245 130 255 110 Q270 95 285 95 Q300 95 315 110 Q325 130 320 155 Q315 175 305 180 Q295 170 285 168 Q275 170 265 180 Q255 175 250 155"
          fill={COLORS.hair}
        />
        <ellipse cx="272" cy="165" rx="4" ry="3" fill={COLORS.hair} />
        <ellipse cx="298" cy="165" rx="4" ry="3" fill={COLORS.hair} />
        <path d="M278 182 Q285 190 292 182" stroke={COLORS.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Arm gesturing */}
        <path
          d="M250 240 Q220 250 200 260"
          stroke="url(#teamSkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Speech indicators */}
      <circle cx="200" cy="140" r="8" fill={primaryColor} opacity="0.3" />
      <circle cx="180" cy="120" r="5" fill={accentColor} opacity="0.3" />
      <circle cx="220" cy="130" r="6" fill={primaryColor} opacity="0.2" />
    </svg>
  );
};
