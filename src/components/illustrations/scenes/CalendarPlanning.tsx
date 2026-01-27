import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { Calendar } from '../elements/Calendar';
import { AnalogClock } from '../elements/AnalogClock';

export const CalendarPlanning = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.calendar,
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
      aria-label="Person planning with calendar"
    >
      <defs>
        <linearGradient id="calSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="calTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          <Calendar x={240} y={100} size={120} primaryColor={accentColor} />
          <AnalogClock x={40} y={60} size={80} primaryColor={primaryColor} />
        </g>
      )}

      <g>
        <path
          d="M120 210 Q110 230 115 280 L130 360 Q160 365 190 360 L205 280 Q210 230 200 210 Q160 195 120 210"
          fill="url(#calTopGradient)"
        />
        <ellipse cx="160" cy="195" rx="16" ry="18" fill="url(#calSkinGradient)" />
        <ellipse cx="160" cy="150" rx="42" ry="50" fill="url(#calSkinGradient)" />
        <path
          d="M118 130 Q105 105 120 80 Q145 60 160 60 Q175 60 200 80 Q215 105 202 130 Q200 110 160 105 Q120 110 118 130"
          fill={COLORS.hair}
        />
        <path d="M118 135 Q110 160 115 190" stroke={COLORS.hair} strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M202 135 Q210 160 205 190" stroke={COLORS.hair} strokeWidth="12" strokeLinecap="round" fill="none" />
        <ellipse cx="145" cy="150" rx="5" ry="4" fill={COLORS.hair} />
        <ellipse cx="175" cy="150" rx="5" ry="4" fill={COLORS.hair} />
        <path d="M150 172 Q160 180 170 172" stroke={COLORS.hair} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M200 230 Q230 200 260 180" stroke="url(#calSkinGradient)" strokeWidth="22" strokeLinecap="round" fill="none" />
        <ellipse cx="265" cy="175" rx="12" ry="10" fill="url(#calSkinGradient)" />
        <path d="M115 230 Q90 270 100 320" stroke="url(#calSkinGradient)" strokeWidth="20" strokeLinecap="round" fill="none" />
        <ellipse cx="100" cy="325" rx="11" ry="9" fill="url(#calSkinGradient)" />
      </g>
    </svg>
  );
};
