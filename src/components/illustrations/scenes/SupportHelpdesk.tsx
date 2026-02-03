import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { CoffeeMug } from '../elements/CoffeeMug';

export const SupportHelpdesk = ({
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
      aria-label="Support person with headset ready to help"
    >
      <defs>
        <linearGradient id="helpSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="helpTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          {/* Chat bubbles */}
          <g>
            <rect x={280} y={100} width={90} height={50} rx={10} fill={COLORS.lightGray} />
            <polygon points="280,135 265,145 280,140" fill={COLORS.lightGray} />
            <line x1={295} y1={118} x2={355} y2={118} stroke={primaryColor} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
            <line x1={295} y1={132} x2={340} y2={132} stroke={primaryColor} strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          </g>
          
          <g>
            <rect x={290} y={170} width={80} height={45} rx={10} fill={accentColor} opacity="0.2" />
            <polygon points="290,195 275,205 290,200" fill={accentColor} opacity="0.2" />
            <line x1={305} y1={188} x2={355} y2={188} stroke={COLORS.white} strokeWidth="3" strokeLinecap="round" />
          </g>

          <CoffeeMug x={40} y={300} size={50} />
        </g>
      )}

      {/* Person with headset */}
      <g>
        {/* Body */}
        <path
          d="M130 220 Q120 245 125 295 L140 365 Q180 370 220 365 L235 295 Q240 245 230 220 Q180 205 130 220"
          fill="url(#helpTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="180" cy="205" rx="16" ry="18" fill="url(#helpSkinGradient)" />

        {/* Head */}
        <ellipse cx="180" cy="155" rx="45" ry="54" fill="url(#helpSkinGradient)" />

        {/* Hair */}
        <path
          d="M135 140 Q125 115 140 90 Q165 70 180 70 Q195 70 220 90 Q235 115 225 140 Q220 120 180 112 Q140 120 135 140"
          fill={COLORS.hair}
        />
        <path
          d="M135 145 Q125 175 130 200"
          stroke={COLORS.hair}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M225 145 Q235 175 230 200"
          stroke={COLORS.hair}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />

        {/* Headset */}
        <path
          d="M130 130 Q120 100 140 85 Q160 75 180 75 Q200 75 220 85 Q240 100 230 130"
          stroke={COLORS.hair}
          strokeWidth="6"
          fill="none"
        />
        <ellipse cx="128" cy="145" rx="12" ry="18" fill={COLORS.hair} />
        <ellipse cx="232" cy="145" rx="12" ry="18" fill={COLORS.hair} />
        
        {/* Microphone */}
        <path
          d="M128 163 Q115 175 115 195"
          stroke={COLORS.hair}
          strokeWidth="4"
          fill="none"
        />
        <ellipse cx="115" cy="200" rx="10" ry="8" fill={COLORS.hair} />

        {/* Eyes friendly */}
        <ellipse cx="165" cy="155" rx="5" ry="4" fill={COLORS.hair} />
        <ellipse cx="195" cy="155" rx="5" ry="4" fill={COLORS.hair} />

        {/* Welcoming smile */}
        <path
          d="M165 180 Q180 192 195 180"
          stroke={COLORS.hair}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms gesturing */}
        <path
          d="M235 240 Q265 230 280 250"
          stroke="url(#helpSkinGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="285" cy="253" rx="12" ry="10" fill="url(#helpSkinGradient)" />
        
        <path
          d="M125 240 Q95 260 85 300"
          stroke="url(#helpSkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="82" cy="305" rx="11" ry="9" fill="url(#helpSkinGradient)" />
      </g>
    </svg>
  );
};
