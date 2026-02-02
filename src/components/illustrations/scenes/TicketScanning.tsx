import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { Ticket } from '../elements/Ticket';

export const TicketScanning = ({
  className,
  size = 'lg',
  showBackground = true,
  primaryColor = COLORS.topBlue,
  accentColor = COLORS.ticket,
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
      aria-label="Person scanning ticket with phone"
    >
      <defs>
        <linearGradient id="scanSkinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="scanTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          <Ticket x={260} y={180} size={110} primaryColor={accentColor} />
          
          {/* QR code representation */}
          <g transform="translate(280, 260)">
            <rect x={0} y={0} width={60} height={60} fill={COLORS.white} rx={4} />
            {[0, 1, 2, 3, 4].map((row) =>
              [0, 1, 2, 3, 4].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={6 + col * 10}
                  y={6 + row * 10}
                  width={8}
                  height={8}
                  fill={(row + col) % 2 === 0 ? COLORS.hair : 'transparent'}
                />
              ))
            )}
          </g>
        </g>
      )}

      {/* Person */}
      <g>
        {/* Body */}
        <path
          d="M100 220 Q90 245 95 290 L110 360 Q145 365 180 360 L195 290 Q200 245 190 220 Q145 205 100 220"
          fill="url(#scanTopGradient)"
        />

        {/* Neck */}
        <ellipse cx="145" cy="205" rx="15" ry="17" fill="url(#scanSkinGradient)" />

        {/* Head */}
        <ellipse cx="145" cy="160" rx="40" ry="48" fill="url(#scanSkinGradient)" />

        {/* Hair */}
        <path
          d="M105 140 Q95 115 110 90 Q130 70 145 70 Q160 70 180 90 Q195 115 185 140 Q180 120 145 115 Q110 120 105 140"
          fill={COLORS.hair}
        />

        {/* Eyes looking right */}
        <ellipse cx="135" cy="158" rx="5" ry="4" fill={COLORS.hair} />
        <ellipse cx="160" cy="158" rx="5" ry="4" fill={COLORS.hair} />

        {/* Focused expression */}
        <path
          d="M137 180 Q145 185 153 180"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms holding phone */}
        <path
          d="M190 240 Q220 220 240 230"
          stroke="url(#scanSkinGradient)"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M100 240 Q130 260 200 250"
          stroke="url(#scanSkinGradient)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Phone */}
        <rect x={200} y={220} width={45} height={80} rx={6} fill={COLORS.hair} />
        <rect x={204} y={228} width={37} height={60} rx={2} fill={primaryColor} opacity="0.3" />
        
        {/* Scan line */}
        <line
          x1={248}
          y1={258}
          x2={275}
          y2={290}
          stroke={primaryColor}
          strokeWidth="3"
          strokeDasharray="8 4"
          opacity="0.7"
        />
      </g>
    </svg>
  );
};
