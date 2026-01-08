import { IllustrationProps } from '../types';
import { getSizeStyles, buildIllustrationClasses } from '../utils';

export const TeamCollaboration = ({
  className,
  size = 'lg',
  showBackground = true,
  animation = 'none',
}: IllustrationProps) => {
  const styles = getSizeStyles(size);
  const classes = buildIllustrationClasses(animation, className);

  // Colors matching the reference
  const mintShirt = '#7DD3C0';
  const blueShirt = '#4A90D9';
  const greenShirt = '#5CB85C';
  const navyPants = '#2C3E50';
  const navyHair = '#1E3A5F';
  const brownHair = '#6B4423';
  const curlyHair = '#1C2833';
  const lightSkin = '#F5D0B9';
  const mediumSkin = '#E8C4A8';
  const darkSkin = '#8D6E4C';
  const tableColor = '#FFFFFF';
  const floorShadow = '#E8E8E8';

  return (
    <svg
      viewBox="0 0 500 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={classes}
      style={styles}
      role="img"
      aria-label="Team collaborating around a table"
    >
      <defs>
        <linearGradient id="plantGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
      </defs>

      {showBackground && (
        <g>
          {/* Background wall */}
          <rect x="0" y="0" width="500" height="320" fill="#F5F5F5" />
          
          {/* Window */}
          <rect x="120" y="40" width="260" height="180" fill="#E8E8E8" rx="2" />
          <rect x="130" y="50" width="115" height="160" fill="#FAFAFA" />
          <rect x="255" y="50" width="115" height="160" fill="#FAFAFA" />
          
          {/* Wall art - orange/coral abstract */}
          <rect x="30" y="100" width="70" height="90" fill="#FAFAFA" rx="2" />
          <rect x="35" y="105" width="60" height="80" fill="#F5D0B9" />
          <path d="M35 185 L95 105 L95 185 Z" fill="#E07B54" />
          <circle cx="55" cy="135" r="15" fill="#F4A460" />
          
          {/* Left computer desk */}
          <rect x="20" y="180" width="100" height="60" fill="#E0E0E0" />
          <rect x="45" y="160" width="50" height="40" fill="#B0B0B0" rx="3" />
          <rect x="50" y="165" width="40" height="28" fill="#1E3A5F" />
          <ellipse cx="70" cy="210" rx="20" ry="5" fill="#C0C0C0" />
          
          {/* Right computer desk */}
          <rect x="380" y="180" width="100" height="60" fill="#E0E0E0" />
          <rect x="405" y="160" width="50" height="40" fill="#B0B0B0" rx="3" />
          <rect x="410" y="165" width="40" height="28" fill="#1E3A5F" />
          <ellipse cx="430" cy="210" rx="20" ry="5" fill="#C0C0C0" />
          
          {/* Plant */}
          <rect x="400" y="260" width="25" height="40" fill="#5D4037" />
          {/* Plant leaves */}
          <ellipse cx="395" cy="220" rx="30" ry="50" fill="url(#plantGradient)" />
          <ellipse cx="430" cy="200" rx="35" ry="60" fill="#4CAF50" />
          <ellipse cx="450" cy="240" rx="25" ry="45" fill="#66BB6A" />
          {/* Leaf details */}
          <path d="M395 180 Q405 220 395 260" stroke="#2E7D32" strokeWidth="2" fill="none" />
          <path d="M430 150 Q440 200 430 250" stroke="#388E3C" strokeWidth="2" fill="none" />
          <path d="M450 200 Q455 230 450 270" stroke="#43A047" strokeWidth="2" fill="none" />
          {/* Leaf spots/holes */}
          <circle cx="390" cy="200" r="4" fill="#81C784" />
          <circle cx="400" cy="240" r="3" fill="#A5D6A7" />
          <circle cx="425" cy="180" r="5" fill="#81C784" />
          <circle cx="440" cy="220" r="4" fill="#A5D6A7" />
          <circle cx="455" cy="250" r="3" fill="#81C784" />
        </g>
      )}

      {/* Floor shadow */}
      <ellipse cx="250" cy="420" rx="180" ry="20" fill={floorShadow} />

      {/* Table */}
      <ellipse cx="250" cy="310" rx="100" ry="25" fill={tableColor} />
      {/* Table legs */}
      <rect x="180" y="310" width="8" height="80" fill="#E0E0E0" />
      <rect x="230" y="310" width="8" height="80" fill="#E0E0E0" />
      <rect x="262" y="310" width="8" height="80" fill="#E0E0E0" />
      <rect x="312" y="310" width="8" height="80" fill="#E0E0E0" />

      {/* Person 1 - Left Man (mint/teal shirt, brown hair) */}
      <g>
        {/* Legs */}
        <path d="M100 340 L85 420 L100 425 L110 345" fill={navyPants} />
        <path d="M130 340 L145 420 L130 425 L120 345" fill={navyPants} />
        {/* Shoes */}
        <ellipse cx="92" cy="423" rx="12" ry="5" fill={navyHair} />
        <ellipse cx="138" cy="423" rx="12" ry="5" fill={navyHair} />
        {/* Socks */}
        <rect x="82" y="410" width="15" height="10" fill="#7DD3C0" />
        
        {/* Body */}
        <path d="M85 240 Q75 280 90 340 L140 340 Q155 280 145 240 Q115 230 85 240" fill={mintShirt} />
        
        {/* Neck */}
        <rect x="105" y="210" width="20" height="25" fill={lightSkin} />
        
        {/* Head */}
        <ellipse cx="115" cy="190" rx="32" ry="38" fill={lightSkin} />
        
        {/* Hair - short brown */}
        <path d="M83 175 Q80 145 95 130 Q115 115 135 130 Q150 145 147 175 Q145 160 115 155 Q85 160 83 175" fill={brownHair} />
        
        {/* Eyebrows */}
        <path d="M98 178 Q103 175 108 178" stroke={brownHair} strokeWidth="2" fill="none" />
        <path d="M122 178 Q127 175 132 178" stroke={brownHair} strokeWidth="2" fill="none" />
        
        {/* Eyes - happy/closed */}
        <path d="M100 185 Q105 182 110 185" stroke="#1E3A5F" strokeWidth="2" fill="none" />
        <path d="M120 185 Q125 182 130 185" stroke="#1E3A5F" strokeWidth="2" fill="none" />
        
        {/* Smile */}
        <path d="M105 200 Q115 212 125 200" stroke="#1E3A5F" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Pointing arm */}
        <path d="M145 260 Q170 250 195 260 Q210 265 220 270" stroke={lightSkin} strokeWidth="18" strokeLinecap="round" fill="none" />
        {/* Pointing hand/finger */}
        <circle cx="220" cy="268" r="10" fill={lightSkin} />
        <path d="M225 265 L240 258" stroke={lightSkin} strokeWidth="6" strokeLinecap="round" />
        
        {/* Other arm (relaxed) */}
        <path d="M85 260 Q70 290 80 310" stroke={lightSkin} strokeWidth="16" strokeLinecap="round" fill="none" />
      </g>

      {/* Person 2 - Center Woman (blue shirt, long dark hair, holding tablet) */}
      <g>
        {/* Legs */}
        <path d="M225 340 L215 400 L230 410 L240 345" fill={navyPants} />
        <path d="M270 340 L280 400 L265 410 L255 345" fill={navyPants} />
        {/* Heels */}
        <path d="M215 405 L210 420 L235 420 L230 405" fill={navyHair} />
        <path d="M265 405 L260 420 L285 420 L280 405" fill={navyHair} />
        
        {/* Body */}
        <path d="M210 250 Q195 290 210 340 L285 340 Q300 290 285 250 Q250 240 210 250" fill={blueShirt} />
        
        {/* Neck */}
        <rect x="237" y="220" width="20" height="25" fill={mediumSkin} />
        
        {/* Head */}
        <ellipse cx="247" cy="195" rx="32" ry="40" fill={mediumSkin} />
        
        {/* Long dark hair */}
        <path d="M215 195 Q210 150 225 130 Q247 110 270 130 Q285 150 280 195 Q280 240 275 280 L260 280 Q265 240 260 200 Q255 170 247 165 Q239 170 234 200 Q229 240 234 280 L220 280 Q215 240 215 195" fill={navyHair} />
        
        {/* Bangs */}
        <path d="M220 170 Q225 155 235 150 Q247 145 259 150 Q269 155 274 170 Q265 165 247 163 Q229 165 220 170" fill={navyHair} />
        
        {/* Eyebrows */}
        <path d="M230 185 Q235 182 240 185" stroke={navyHair} strokeWidth="1.5" fill="none" />
        <path d="M254 185 Q259 182 264 185" stroke={navyHair} strokeWidth="1.5" fill="none" />
        
        {/* Eyes - happy */}
        <path d="M232 192 Q237 189 242 192" stroke="#1E3A5F" strokeWidth="2" fill="none" />
        <path d="M252 192 Q257 189 262 192" stroke="#1E3A5F" strokeWidth="2" fill="none" />
        
        {/* Smile */}
        <path d="M237 208 Q247 218 257 208" stroke="#1E3A5F" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Arms holding tablet */}
        <path d="M210 270 Q200 285 205 300" stroke={mediumSkin} strokeWidth="14" strokeLinecap="round" fill="none" />
        <path d="M285 270 Q295 285 290 300" stroke={mediumSkin} strokeWidth="14" strokeLinecap="round" fill="none" />
        
        {/* Tablet */}
        <rect x="200" y="285" width="95" height="65" rx="5" fill="#4A6FA5" />
        <rect x="205" y="290" width="85" height="55" rx="3" fill="#FFFFFF" />
        
        {/* Hands on tablet */}
        <circle cx="205" cy="310" r="8" fill={mediumSkin} />
        <circle cx="290" cy="310" r="8" fill={mediumSkin} />
      </g>

      {/* Person 3 - Right Woman (green shirt, curly afro hair, dark skin) */}
      <g>
        {/* Legs */}
        <path d="M345 340 L335 410 L350 420 L360 345" fill={navyPants} />
        <path d="M385 340 L405 410 L390 420 L380 345" fill={navyPants} />
        {/* Shoes */}
        <ellipse cx="342" cy="418" rx="12" ry="5" fill={navyHair} />
        <ellipse cx="398" cy="418" rx="12" ry="5" fill={navyHair} />
        
        {/* Body */}
        <path d="M335 250 Q320 290 335 340 L400 340 Q415 290 400 250 Q368 240 335 250" fill={greenShirt} />
        
        {/* Neck */}
        <rect x="357" y="215" width="20" height="25" fill={darkSkin} />
        
        {/* Head */}
        <ellipse cx="367" cy="190" rx="30" ry="38" fill={darkSkin} />
        
        {/* Curly afro hair */}
        <circle cx="367" cy="160" r="45" fill={curlyHair} />
        <circle cx="340" cy="170" r="20" fill={curlyHair} />
        <circle cx="394" cy="170" r="20" fill={curlyHair} />
        <circle cx="350" cy="145" r="18" fill={curlyHair} />
        <circle cx="384" cy="145" r="18" fill={curlyHair} />
        <circle cx="367" cy="130" r="20" fill={curlyHair} />
        
        {/* Eyebrows */}
        <path d="M352 180 Q357 177 362 180" stroke={curlyHair} strokeWidth="1.5" fill="none" />
        <path d="M372 180 Q377 177 382 180" stroke={curlyHair} strokeWidth="1.5" fill="none" />
        
        {/* Eyes - happy */}
        <path d="M354 188 Q359 185 364 188" stroke="#1C2833" strokeWidth="2" fill="none" />
        <path d="M370 188 Q375 185 380 188" stroke="#1C2833" strokeWidth="2" fill="none" />
        
        {/* Smile */}
        <path d="M357 205 Q367 215 377 205" stroke="#1C2833" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Left arm on table */}
        <path d="M335 270 Q300 290 280 300" stroke={darkSkin} strokeWidth="16" strokeLinecap="round" fill="none" />
        <circle cx="280" cy="300" r="10" fill={darkSkin} />
        
        {/* Right arm gesturing */}
        <path d="M400 270 Q420 290 410 320" stroke={darkSkin} strokeWidth="14" strokeLinecap="round" fill="none" />
        <circle cx="410" cy="320" r="9" fill={darkSkin} />
      </g>
    </svg>
  );
};
