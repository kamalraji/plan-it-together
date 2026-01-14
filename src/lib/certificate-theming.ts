/**
 * Certificate Theming Utilities
 * Handles dynamic color application to pre-built templates
 */

// A4 Landscape dimensions at 72 DPI
export const CANVAS_WIDTH = 842;
export const CANVAS_HEIGHT = 595;

/**
 * Converts a hex color to HSL values
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL values to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjusts the brightness of a hex color
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  const hsl = hexToHSL(hex);
  const newL = Math.max(0, Math.min(100, hsl.l + percent));
  return hslToHex(hsl.h, hsl.s, newL);
}

/**
 * Determines if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  const hsl = hexToHSL(hex);
  return hsl.l > 50;
}

/**
 * Gets appropriate text color based on background
 */
export function getContrastTextColor(bgHex: string): string {
  return isLightColor(bgHex) ? '#1F2937' : '#FFFFFF';
}

/**
 * Color placeholder mapping for templates
 */
interface ColorTheme {
  primaryColor: string;
  secondaryColor: string;
  textColor?: string;
  textMuted?: string;
}

/**
 * Recursively applies color theme to an object
 */
function applyColorsToObject(obj: object, theme: ColorTheme): object {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      switch (value) {
        case 'PRIMARY_COLOR':
          result[key] = theme.primaryColor;
          break;
        case 'PRIMARY_COLOR_LIGHT':
          result[key] = adjustColorBrightness(theme.primaryColor, 20);
          break;
        case 'PRIMARY_COLOR_DARK':
          result[key] = adjustColorBrightness(theme.primaryColor, -20);
          break;
        case 'SECONDARY_COLOR':
          result[key] = theme.secondaryColor;
          break;
        case 'SECONDARY_COLOR_LIGHT':
          result[key] = adjustColorBrightness(theme.secondaryColor, 20);
          break;
        case 'SECONDARY_COLOR_DARK':
          result[key] = adjustColorBrightness(theme.secondaryColor, -20);
          break;
        case 'TEXT_COLOR':
          result[key] = theme.textColor || '#1F2937';
          break;
        case 'TEXT_MUTED':
          result[key] = theme.textMuted || '#6B7280';
          break;
        default:
          result[key] = value;
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? applyColorsToObject(item, theme) 
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = applyColorsToObject(value as object, theme);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Applies color theme to an array of Fabric.js objects
 */
export function applyColorTheme(
  objects: object[],
  primaryColor: string,
  secondaryColor: string
): object[] {
  const theme: ColorTheme = {
    primaryColor,
    secondaryColor,
    textColor: '#1F2937',
    textMuted: '#6B7280',
  };

  return objects.map(obj => applyColorsToObject(obj, theme));
}

/**
 * Combines background and content layout objects into a single canvas JSON
 */
export function combineDesignElements(
  backgroundObjects: object[],
  contentObjects: object[],
  canvasWidth: number = CANVAS_WIDTH,
  canvasHeight: number = CANVAS_HEIGHT
): object {
  return {
    version: '6.0.0',
    objects: [...backgroundObjects, ...contentObjects],
    background: '#FFFFFF',
    width: canvasWidth,
    height: canvasHeight,
  };
}

/**
 * Creates canvas JSON with a background image
 * Used for pre-generated AI background images
 */
export function createCanvasWithImageBackground(
  backgroundImageUrl: string,
  contentObjects: object[],
  canvasWidth: number = CANVAS_WIDTH,
  canvasHeight: number = CANVAS_HEIGHT
): object {
  return {
    version: '6.0.0',
    objects: contentObjects,
    background: '#FFFFFF',
    backgroundImage: {
      type: 'image',
      src: backgroundImageUrl,
      scaleX: 1,
      scaleY: 1,
      left: 0,
      top: 0,
      originX: 'left',
      originY: 'top',
      crossOrigin: 'anonymous',
    },
    width: canvasWidth,
    height: canvasHeight,
  };
}

/**
 * Pre-defined color palettes for certificates
 */
export const CERTIFICATE_COLOR_PALETTES = [
  { 
    id: 'navy-gold',
    name: 'Navy Gold',
    primary: '#1a365d',
    secondary: '#c9a227',
  },
  { 
    id: 'burgundy-bronze',
    name: 'Burgundy Bronze',
    primary: '#722f37',
    secondary: '#cd7f32',
  },
  { 
    id: 'forest-cream',
    name: 'Forest Cream',
    primary: '#1e4d2b',
    secondary: '#d4af37',
  },
  { 
    id: 'royal-blue',
    name: 'Royal Blue',
    primary: '#1E40AF',
    secondary: '#3B82F6',
  },
  { 
    id: 'charcoal-silver',
    name: 'Charcoal Silver',
    primary: '#374151',
    secondary: '#9CA3AF',
  },
  { 
    id: 'purple-gold',
    name: 'Purple Gold',
    primary: '#5B21B6',
    secondary: '#D4AF37',
  },
  { 
    id: 'teal-coral',
    name: 'Teal Coral',
    primary: '#0D9488',
    secondary: '#FB7185',
  },
  { 
    id: 'slate-amber',
    name: 'Slate Amber',
    primary: '#475569',
    secondary: '#F59E0B',
  },
] as const;
