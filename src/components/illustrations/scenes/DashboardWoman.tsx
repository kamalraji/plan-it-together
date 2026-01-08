import { IllustrationProps } from '../types';
import { COLORS, getSizeStyles, buildIllustrationClasses } from '../utils';
import { AnalogClock } from '../elements/AnalogClock';
import { BarChart } from '../elements/BarChart';
import { TropicalPlant } from '../elements/TropicalPlant';

export const DashboardWoman = ({
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
      aria-label="Woman checking dashboard statistics"
    >
      <defs>
        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skin} />
          <stop offset="100%" stopColor={COLORS.skinShadow} />
        </linearGradient>
        <linearGradient id="topGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={COLORS.topBlueDark} />
        </linearGradient>
        <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3D4A5C" />
          <stop offset="100%" stopColor={COLORS.hair} />
        </linearGradient>
      </defs>

      {/* Background elements */}
      {showBackground && (
        <g>
          {/* Tropical plants */}
          <TropicalPlant x={10} y={280} scale={1.2} />
          <TropicalPlant x={340} y={300} scale={1} flip />
          
          {/* Clock */}
          <AnalogClock x={280} y={60} size={90} primaryColor={accentColor} />
          
          {/* Bar chart */}
          <BarChart x={30} y={80} width={110} height={90} accentColor={accentColor} />
        </g>
      )}

      {/* Woman figure */}
      <g>
        {/* Body / Torso */}
        <path
          d="M160 200 
             Q150 220 155 260 
             L175 340 
             Q200 345 225 340 
             L245 260 
             Q250 220 240 200 
             Q200 190 160 200"
          fill="url(#topGradient)"
        />

        {/* Skirt */}
        <path
          d="M165 260 
             Q140 340 150 380 
             L180 385 
             Q200 350 220 385 
             L250 380 
             Q260 340 235 260 
             Q200 270 165 260"
          fill={COLORS.skirt}
        />

        {/* Neck */}
        <ellipse cx="200" cy="185" rx="18" ry="20" fill="url(#skinGradient)" />

        {/* Head */}
        <ellipse cx="200" cy="140" rx="45" ry="55" fill="url(#skinGradient)" />

        {/* Hair - back layer */}
        <path
          d="M155 120 
             Q140 100 150 70 
             Q180 50 200 50 
             Q220 50 250 70 
             Q260 100 245 120
             Q250 150 240 180
             Q235 160 230 140
             Q210 150 200 145
             Q190 150 170 140
             Q165 160 160 180
             Q150 150 155 120"
          fill="url(#hairGradient)"
        />

        {/* Hair - wavy strands */}
        <path
          d="M155 130 Q145 160 150 200 Q155 180 160 170"
          fill={COLORS.hair}
        />
        <path
          d="M245 130 Q255 160 250 200 Q245 180 240 170"
          fill={COLORS.hair}
        />

        {/* Face features */}
        {/* Eyes */}
        <ellipse cx="182" cy="140" rx="6" ry="4" fill={COLORS.hair} />
        <ellipse cx="218" cy="140" rx="6" ry="4" fill={COLORS.hair} />
        
        {/* Eyebrows */}
        <path
          d="M174 130 Q182 127 190 130"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M210 130 Q218 127 226 130"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Smile */}
        <path
          d="M188 160 Q200 170 212 160"
          stroke={COLORS.hair}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Necklace */}
        <path
          d="M180 195 Q200 205 220 195"
          stroke={COLORS.chartAccent}
          strokeWidth="2"
          fill="none"
        />
        <circle cx="200" cy="202" r="4" fill={COLORS.chartAccent} />

        {/* Left arm (down) */}
        <path
          d="M155 210 
             Q130 250 140 300 
             Q145 310 150 305 
             Q155 260 165 230"
          fill="url(#skinGradient)"
        />
        {/* Left hand */}
        <ellipse cx="145" cy="308" rx="12" ry="10" fill="url(#skinGradient)" />

        {/* Right arm (raised) */}
        <path
          d="M245 210 
             Q280 180 300 140 
             Q310 130 305 125 
             Q290 140 270 170
             Q255 195 250 215"
          fill="url(#skinGradient)"
        />
        {/* Right hand */}
        <ellipse cx="303" cy="122" rx="12" ry="10" fill="url(#skinGradient)" />
        
        {/* Fingers on raised hand */}
        <path
          d="M310 115 Q315 108 312 105"
          stroke="url(#skinGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
};
