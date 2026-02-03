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
        <linearGradient id="dw-skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDDCCC" />
          <stop offset="100%" stopColor="#F5C4B0" />
        </linearGradient>
        <linearGradient id="dw-topGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="dw-hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="100%" stopColor="#2C3E50" />
        </linearGradient>
        <linearGradient id="dw-skirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Background elements */}
      {showBackground && (
        <g>
          <TropicalPlant x={280} y={200} scale={1.4} />
          <AnalogClock x={260} y={40} size={100} primaryColor="#DBEAFE" />
          <BarChart x={20} y={100} width={140} height={100} accentColor={accentColor} />
        </g>
      )}

      {/* Woman figure */}
      <g>
        {/* Hair - back layer (wavy, voluminous) */}
        <path
          d="M130 140
             Q110 130 115 100
             Q130 60 200 55
             Q270 60 285 100
             Q290 130 270 140
             Q280 180 275 230
             C270 260 260 280 250 290
             Q240 260 235 220
             Q220 240 200 235
             Q180 240 165 220
             Q160 260 150 290
             C140 280 130 260 125 230
             Q120 180 130 140"
          fill="url(#dw-hairGradient)"
        />

        {/* Hair waves detail */}
        <path
          d="M125 180 Q115 200 120 240 Q125 220 130 200"
          fill="#1E3A5F"
        />
        <path
          d="M275 180 Q285 200 280 240 Q275 220 270 200"
          fill="#1E3A5F"
        />
        <path
          d="M140 120 Q130 140 135 170"
          stroke="#3D5A80"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M260 120 Q270 140 265 170"
          stroke="#3D5A80"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Neck */}
        <path
          d="M180 210 Q180 230 185 245 L215 245 Q220 230 220 210"
          fill="url(#dw-skinGradient)"
        />

        {/* Body / Torso */}
        <path
          d="M155 245
             Q140 260 145 300
             L150 340
             Q200 350 250 340
             L255 300
             Q260 260 245 245
             Q200 235 155 245"
          fill="url(#dw-topGradient)"
        />

        {/* Skirt */}
        <path
          d="M150 340
             Q130 380 145 400
             L180 400
             Q200 370 220 400
             L255 400
             Q270 380 250 340
             Q200 355 150 340"
          fill="url(#dw-skirtGradient)"
        />

        {/* Head */}
        <ellipse cx="200" cy="160" rx="52" ry="60" fill="url(#dw-skinGradient)" />

        {/* Hair - front layer (bangs and sides) */}
        <path
          d="M148 140
             Q145 110 165 90
             Q185 75 200 75
             Q215 75 235 90
             Q255 110 252 140
             Q240 130 220 135
             Q200 130 180 135
             Q160 130 148 140"
          fill="url(#dw-hairGradient)"
        />

        {/* Hair wave strands on sides */}
        <path
          d="M145 145 Q135 170 140 200 Q150 180 155 160"
          fill="url(#dw-hairGradient)"
        />
        <path
          d="M255 145 Q265 170 260 200 Q250 180 245 160"
          fill="url(#dw-hairGradient)"
        />

        {/* Eyebrows */}
        <path
          d="M168 145 Q180 140 188 145"
          stroke="#2C3E50"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M212 145 Q220 140 232 145"
          stroke="#2C3E50"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyes (closed, happy) */}
        <path
          d="M170 158 Q178 164 186 158"
          stroke="#2C3E50"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M214 158 Q222 164 230 158"
          stroke="#2C3E50"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyelashes */}
        <path d="M168 157 L165 154" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M188 157 L191 154" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M212 157 L209 154" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M232 157 L235 154" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" />

        {/* Nose */}
        <path
          d="M200 165 Q202 175 198 180"
          stroke="#E8B4A0"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Smile */}
        <path
          d="M185 190 Q200 202 215 190"
          stroke="#E85A5A"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Upper lip detail */}
        <ellipse cx="200" cy="188" rx="8" ry="3" fill="#E85A5A" />

        {/* Cheek blush */}
        <ellipse cx="165" cy="175" rx="8" ry="5" fill="#FFD5CC" opacity="0.6" />
        <ellipse cx="235" cy="175" rx="8" ry="5" fill="#FFD5CC" opacity="0.6" />

        {/* Necklace */}
        <path
          d="M175 245 Q200 260 225 245"
          stroke="#F59E0B"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="200" cy="258" r="12" fill="#F59E0B" />
        <circle cx="200" cy="258" r="7" fill="#FBBF24" />

        {/* Left arm (down, gesturing) */}
        <path
          d="M145 260
             Q120 290 130 340
             Q135 350 145 345
             Q150 310 160 280"
          fill="url(#dw-skinGradient)"
        />
        {/* Left hand */}
        <ellipse cx="140" cy="348" rx="14" ry="12" fill="url(#dw-skinGradient)" />
        {/* Left fingers */}
        <path d="M135 360 Q132 368 136 370" stroke="url(#dw-skinGradient)" strokeWidth="5" strokeLinecap="round" />
        <path d="M142 362 Q142 372 145 372" stroke="url(#dw-skinGradient)" strokeWidth="5" strokeLinecap="round" />

        {/* Right arm (raised behind head) */}
        <path
          d="M245 260
             Q270 240 280 200
             Q285 180 290 160
             Q295 150 288 148
             Q275 160 270 180
             Q260 220 250 250"
          fill="url(#dw-skinGradient)"
        />
        {/* Right hand */}
        <ellipse cx="288" cy="145" rx="14" ry="12" fill="url(#dw-skinGradient)" />
        
        {/* Right fingers spread */}
        <path d="M295 135 Q302 128 300 125" stroke="url(#dw-skinGradient)" strokeWidth="6" strokeLinecap="round" />
        <path d="M298 142 Q308 140 306 136" stroke="url(#dw-skinGradient)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
};
