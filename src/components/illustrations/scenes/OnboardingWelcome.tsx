import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { Confetti } from '../elements/Confetti';

export const OnboardingWelcome = ({
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
      aria-label="Friendly person waving welcome"
    >
      <defs>
        <linearGradient id="welcomeSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="welcomeTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          <Confetti x={30} y={50} width={340} height={180} density="light" />
          
          {/* Stars */}
          <g fill={COLORS.ticket} opacity="0.6">
            <path d="M80 120 L83 128 L92 128 L85 134 L88 142 L80 137 L72 142 L75 134 L68 128 L77 128 Z" />
            <path d="M320 100 L322 106 L328 106 L323 110 L325 116 L320 112 L315 116 L317 110 L312 106 L318 106 Z" />
            <path d="M340 180 L342 185 L347 185 L343 188 L345 193 L340 190 L335 193 L337 188 L333 185 L338 185 Z" />
          </g>
        </g>
      )}

      {/* Person */}
      <g>
        {/* Body */}
        <path
          d="M160 200 Q150 225 155 280 L170 360 Q200 365 230 360 L245 280 Q250 225 240 200 Q200 185 160 200"
          fill="url(#welcomeTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="200" cy="185" rx="16" ry="18" fill="url(#welcomeSkinGradient)" />

        {/* Head */}
        <ellipse cx="200" cy="140" rx="45" ry="52" fill="url(#welcomeSkinGradient)" />

        {/* Hair */}
        <path
          d="M155 120 Q145 95 160 70 Q185 50 200 50 Q215 50 240 70 Q255 95 245 120 Q250 100 235 85 Q200 70 165 85 Q150 100 155 120"
          fill={COLORS.hair}
        />

        {/* Eyes happy */}
        <path d="M180 135 Q185 130 190 135" stroke={COLORS.hair} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M210 135 Q215 130 220 135" stroke={COLORS.hair} strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Big smile */}
        <path
          d="M182 160 Q200 178 218 160"
          stroke={COLORS.hair}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Cheek blush */}
        <ellipse cx="170" cy="155" rx="8" ry="5" fill="#F9A8D4" opacity="0.4" />
        <ellipse cx="230" cy="155" rx="8" ry="5" fill="#F9A8D4" opacity="0.4" />

        {/* Waving arm */}
        <path
          d="M245 215 Q280 180 290 130 Q295 115 288 112"
          stroke="url(#welcomeSkinGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="286" cy="108" rx="14" ry="12" fill="url(#welcomeSkinGradient)" />
        
        {/* Wave lines */}
        <path d="M305 95 Q315 100 310 110" stroke={primaryColor} strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M315 90 Q328 97 320 112" stroke={primaryColor} strokeWidth="2" fill="none" opacity="0.4" />

        {/* Other arm */}
        <path
          d="M155 215 Q125 260 130 310"
          stroke="url(#welcomeSkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="130" cy="315" rx="12" ry="10" fill="url(#welcomeSkinGradient)" />
      </g>
    </svg>
  );
};
