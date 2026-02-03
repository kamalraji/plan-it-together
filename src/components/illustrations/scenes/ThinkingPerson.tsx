import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { TropicalPlant } from '../elements/TropicalPlant';

export const ThinkingPerson = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
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
      aria-label="Person thinking with ideas"
    >
      <defs>
        <linearGradient id="thinkSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="thinkTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
        <linearGradient id="bulbGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEFCBF" />
          <stop offset="100%" stopColor="#F6E05E" />
        </linearGradient>
      </defs>

      {/* Background elements */}
      {showBackground && (
        <g>
          <TropicalPlant x={300} y={290} scale={1.3} flip />
          
          {/* Floating idea bubbles */}
          <circle cx="80" cy="120" r="15" fill={COLORS.chartBar} opacity="0.6" />
          <circle cx="60" cy="150" r="10" fill={COLORS.chartBar} opacity="0.4" />
          <circle cx="95" cy="170" r="8" fill={COLORS.chartBar} opacity="0.3" />
        </g>
      )}

      {/* Lightbulb */}
      <g>
        {/* Glow */}
        <circle cx="300" cy="100" r="60" fill="#FEFCBF" opacity="0.3" />
        <circle cx="300" cy="100" r="45" fill="#FEFCBF" opacity="0.4" />
        
        {/* Bulb */}
        <path
          d="M280 120 
             Q260 100 270 70 
             Q280 40 300 40 
             Q320 40 330 70 
             Q340 100 320 120 
             Q315 130 315 140 
             L285 140 
             Q285 130 280 120"
          fill="url(#bulbGradient)"
        />
        {/* Bulb base */}
        <rect x="285" y="140" width="30" height="8" rx="2" fill="#A0AEC0" />
        <rect x="288" y="148" width="24" height="5" rx="1" fill="#718096" />
        <rect x="291" y="153" width="18" height="4" rx="1" fill="#718096" />
        
        {/* Rays */}
        <line x1="300" y1="15" x2="300" y2="0" stroke="#F6E05E" strokeWidth="3" strokeLinecap="round" />
        <line x1="340" y1="60" x2="355" y2="50" stroke="#F6E05E" strokeWidth="3" strokeLinecap="round" />
        <line x1="260" y1="60" x2="245" y2="50" stroke="#F6E05E" strokeWidth="3" strokeLinecap="round" />
        <line x1="350" y1="100" x2="365" y2="100" stroke="#F6E05E" strokeWidth="3" strokeLinecap="round" />
        <line x1="250" y1="100" x2="235" y2="100" stroke="#F6E05E" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Person figure - thinking pose */}
      <g>
        {/* Body */}
        <path
          d="M130 200 
             Q115 225 120 270 
             L135 350 
             Q170 360 205 350 
             L220 270 
             Q225 225 210 200 
             Q170 185 130 200"
          fill="url(#thinkTopGradient)"
        />

        {/* Pants */}
        <path
          d="M135 300 
             Q125 360 130 395 
             L160 400 
             L165 340
             L175 400 
             L210 395 
             Q215 360 205 300 
             Q170 315 135 300"
          fill={COLORS.skirt}
        />

        {/* Neck */}
        <ellipse cx="170" cy="185" rx="18" ry="18" fill="url(#thinkSkinGradient)" />

        {/* Head - tilted slightly */}
        <ellipse cx="170" cy="135" rx="45" ry="52" fill="url(#thinkSkinGradient)" transform="rotate(-5 170 135)" />

        {/* Hair - wavy */}
        <path
          d="M125 120 
             Q110 85 140 60 
             Q170 45 200 60 
             Q230 85 215 120
             Q205 100 170 95
             Q135 100 125 120"
          fill={COLORS.hair}
        />
        <path
          d="M125 125 Q115 160 120 200 Q125 170 130 150"
          fill={COLORS.hair}
        />
        <path
          d="M215 125 Q225 160 220 200 Q215 170 210 150"
          fill={COLORS.hair}
        />

        {/* Thinking face */}
        {/* Eyes - looking up */}
        <ellipse cx="152" cy="130" rx="6" ry="4" fill={COLORS.hair} />
        <ellipse cx="188" cy="128" rx="6" ry="4" fill={COLORS.hair} />
        
        {/* Raised eyebrows */}
        <path
          d="M144 118 Q152 114 162 118"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M178 116 Q188 112 198 116"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Thoughtful mouth */}
        <path
          d="M160 160 Q170 162 175 158"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Left arm - down */}
        <path
          d="M125 215 
             Q95 260 100 320 
             Q105 330 115 325 
             Q115 270 135 235"
          fill="url(#thinkSkinGradient)"
        />
        <ellipse cx="108" cy="328" rx="14" ry="10" fill="url(#thinkSkinGradient)" />

        {/* Right arm - hand on chin */}
        <path
          d="M215 215 
             Q240 200 235 170 
             Q230 150 215 155"
          fill="url(#thinkSkinGradient)"
        />
        {/* Hand on chin */}
        <ellipse cx="215" cy="165" rx="15" ry="12" fill="url(#thinkSkinGradient)" />
      </g>
    </svg>
  );
};
