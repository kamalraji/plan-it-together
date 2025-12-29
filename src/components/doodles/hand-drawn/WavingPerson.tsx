import { CharacterProps } from "../types";
import { buildCharacterClasses, getSizeDimensions, getColorValue } from "../utils";

// Hand-drawn sketch style: intentionally imperfect lines, scribble textures
export const WavingPersonHD = (props: CharacterProps) => {
  const {
    size = "md",
    animation = "none",
    color = "sunny",
    customColor,
    interactive = false,
    onClick,
    className,
    ...rest
  } = props;

  const dimensions = getSizeDimensions(size);
  const classes = buildCharacterClasses({ ...props, className });
  const fillColor = getColorValue(color, customColor);

  return (
    <svg
      viewBox="0 0 120 140"
      className={classes}
      width={dimensions.width}
      height={Math.round(dimensions.height * 1.17)}
      xmlns="http://www.w3.org/2000/svg"
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : "img"}
      aria-label="Waving person character - hand drawn sketch style"
      {...rest}
    >
      {/* Notebook-style background stroke */}
      <rect
        x="6"
        y="6"
        width="108"
        height="128"
        rx="10"
        fill="none"
        stroke="hsl(var(--muted-foreground))"
        strokeDasharray="3 5"
        strokeWidth="1.5"
      />

      {/* Slightly squashed head with wobble outline */}
      <ellipse
        cx="60"
        cy="30"
        rx="23"
        ry="25"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
      />
      <path
        d="M38 26 C42 18 50 14 60 14 C70 14 78 18 82 26"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Scribble hair */}
      <path
        d="M44 14 L48 10 L52 14 L56 9 L60 13 L64 9 L68 13 L72 10 L76 14"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Simple dot eyes + tiny nose */}
      <circle cx="52" cy="28" r="2" fill="hsl(var(--foreground))" />
      <circle cx="68" cy="28" r="2" fill="hsl(var(--foreground))" />
      <path
        d="M60 28 L60 30"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Asymmetric smile */}
      <path
        d="M50 36 Q60 42 71 35"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Loose hoodie body */}
      <path
        d="M44 52 Q60 48 76 52 L80 86 Q60 94 40 86 Z"
        fill="hsl(var(--teal))"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Hoodie pocket scribble */}
      <path
        d="M48 72 Q60 78 72 72"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Waving arm - slightly shaky polyline */}
      <g className="animate-wave" style={{ transformOrigin: "34px 60px" }}>
        <path
          d="M46 58 L34 50 L26 38 L22 26"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse
          cx="20"
          cy="24"
          rx="7"
          ry="6"
          fill={fillColor}
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
        />
        {/* Little motion ticks */}
        <path
          d="M14 16 L10 12"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M18 18 L14 10"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </g>

      {/* Resting arm */}
      <path
        d="M74 58 L86 70"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="88"
        cy="72"
        rx="7"
        ry="6"
        fill={fillColor}
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
      />

      {/* Legs with notebook-style shadow */}
      <path
        d="M52 86 L50 114"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M68 86 L70 114"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Chunky sneakers with scribble base */}
      <rect
        x="40"
        y="114"
        width="18"
        height="8"
        rx="3"
        fill="hsl(var(--coral))"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.8"
      />
      <rect
        x="62"
        y="114"
        width="18"
        height="8"
        rx="3"
        fill="hsl(var(--coral))"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.8"
      />
      <path
        d="M38 124 Q60 130 82 124"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
