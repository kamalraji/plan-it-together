import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { Megaphone } from '../elements/Megaphone';
import { Confetti } from '../elements/Confetti';

export const EventHosting = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.megaphone,
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
      aria-label="Person hosting an event at podium"
    >
      <defs>
        <linearGradient id="eventSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="eventTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          <Confetti x={50} y={40} width={300} height={150} density="medium" />
          <Megaphone x={300} y={180} size={70} primaryColor={accentColor} />
        </g>
      )}

      {/* Podium */}
      <path
        d="M140 320 L160 250 L240 250 L260 320 L280 380 L120 380 Z"
        fill={COLORS.hair}
        opacity="0.9"
      />
      <rect x={155} y={260} width={90} height={8} rx={2} fill={primaryColor} />

      {/* Person */}
      <g>
        {/* Body */}
        <path
          d="M175 180 Q165 200 170 240 L185 250 Q200 255 215 250 L230 240 Q235 200 225 180 Q200 170 175 180"
          fill="url(#eventTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="200" cy="165" rx="15" ry="18" fill="url(#eventSkinGradient)" />

        {/* Head */}
        <ellipse cx="200" cy="125" rx="40" ry="48" fill="url(#eventSkinGradient)" />

        {/* Hair */}
        <path
          d="M160 105 Q150 80 165 60 Q185 45 200 45 Q215 45 235 60 Q250 80 240 105 Q245 85 230 75 Q200 65 170 75 Q155 85 160 105"
          fill={COLORS.hair}
        />

        {/* Eyes */}
        <ellipse cx="185" cy="125" rx="5" ry="4" fill={COLORS.hair} />
        <ellipse cx="215" cy="125" rx="5" ry="4" fill={COLORS.hair} />

        {/* Smile */}
        <path
          d="M190 145 Q200 155 210 145"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms raised */}
        <path
          d="M170 190 Q140 160 120 130 Q115 125 120 120 Q130 130 150 155 Q165 175 175 185"
          fill="url(#eventSkinGradient)"
        />
        <ellipse cx="118" cy="118" rx="10" ry="9" fill="url(#eventSkinGradient)" />
        
        <path
          d="M230 190 Q260 160 280 130 Q285 125 280 120 Q270 130 250 155 Q235 175 225 185"
          fill="url(#eventSkinGradient)"
        />
        <ellipse cx="282" cy="118" rx="10" ry="9" fill="url(#eventSkinGradient)" />
      </g>
    </svg>
  );
};
