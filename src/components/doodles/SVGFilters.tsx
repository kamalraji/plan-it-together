/**
 * SVG Filters for Hand-Drawn Effects
 * Provides texture and imperfection filters for hand-drawn style characters
 */

import React from 'react';

export const SVGFilters: React.FC = () => {
  return (
    <svg className="svg-filters" aria-hidden="true">
      <defs>
        {/* Rough paper texture filter */}
        <filter id="roughPaper" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            baseFrequency="0.04"
            numOctaves="3"
            result="noise"
            seed="1"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Texture filter for fills */}
        <filter id="textureFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            baseFrequency="0.9"
            numOctaves="4"
            result="texture"
            seed="2"
          />
          <feColorMatrix
            in="texture"
            type="saturate"
            values="0"
            result="desaturatedTexture"
          />
          <feComponentTransfer in="desaturatedTexture" result="contrastTexture">
            <feFuncA type="discrete" tableValues="0 .5 .5 .7 .7 .9 1" />
          </feComponentTransfer>
          <feComposite
            in="SourceGraphic"
            in2="contrastTexture"
            operator="multiply"
          />
        </filter>

        {/* Scribble line filter */}
        <filter id="scribbleFilter" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            baseFrequency="0.02"
            numOctaves="2"
            result="scribbleNoise"
            seed="3"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="scribbleNoise"
            scale="0.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Pencil stroke filter */}
        <filter id="pencilStroke" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            baseFrequency="0.8"
            numOctaves="2"
            result="pencilTexture"
            seed="4"
          />
          <feColorMatrix
            in="pencilTexture"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="pencilAlpha"
          />
          <feComposite
            in="SourceGraphic"
            in2="pencilAlpha"
            operator="in"
          />
        </filter>

        {/* Felt-tip marker filter */}
        <filter id="feltTipFilter" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="0.3" result="blur" />
          <feTurbulence
            baseFrequency="0.1"
            numOctaves="1"
            result="markerTexture"
            seed="5"
          />
          <feDisplacementMap
            in="blur"
            in2="markerTexture"
            scale="1"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Crayon texture filter */}
        <filter id="crayonFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            baseFrequency="0.6"
            numOctaves="3"
            result="crayonNoise"
            seed="6"
          />
          <feColorMatrix
            in="crayonNoise"
            type="saturate"
            values="0"
            result="grayCrayon"
          />
          <feComponentTransfer in="grayCrayon" result="crayonTexture">
            <feFuncA type="discrete" tableValues="0 .3 .6 .8 1" />
          </feComponentTransfer>
          <feComposite
            in="SourceGraphic"
            in2="crayonTexture"
            operator="multiply"
          />
        </filter>

        {/* Watercolor bleed effect */}
        <filter id="watercolorFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="colorBlur" />
          <feTurbulence
            baseFrequency="0.03"
            numOctaves="2"
            result="waterNoise"
            seed="7"
          />
          <feDisplacementMap
            in="colorBlur"
            in2="waterNoise"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Sketch hatching pattern */}
        <pattern
          id="hatchingPattern"
          patternUnits="userSpaceOnUse"
          width="4"
          height="4"
          patternTransform="rotate(45)"
        >
          <path
            d="M 0,2 L 4,2"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </pattern>

        {/* Cross-hatching pattern */}
        <pattern
          id="crossHatchingPattern"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
        >
          <path
            d="M 0,3 L 6,3 M 3,0 L 3,6"
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.2"
          />
        </pattern>

        {/* Stipple pattern */}
        <pattern
          id="stipplePattern"
          patternUnits="userSpaceOnUse"
          width="3"
          height="3"
        >
          <circle
            cx="1.5"
            cy="1.5"
            r="0.3"
            fill="currentColor"
            opacity="0.4"
          />
        </pattern>
      </defs>
    </svg>
  );
};

export default SVGFilters;