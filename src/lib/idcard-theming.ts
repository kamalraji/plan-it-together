/**
 * ID Card Theming Utilities
 * Handles dynamic color application to pre-built templates
 */

/**
 * Converts a hex color to HSL values
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse RGB values
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
 * Generates a complementary color
 */
export function generateComplementaryColor(hex: string): string {
  const hsl = hexToHSL(hex);
  const newH = (hsl.h + 180) % 360;
  return hslToHex(newH, hsl.s, hsl.l);
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
      // Replace color placeholders
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
 * Scales objects for different orientations
 * Transforms landscape (324x204) objects to portrait (204x324) and vice versa
 */
export function scaleObjectsForOrientation(
  objects: object[],
  fromOrientation: 'landscape' | 'portrait',
  toOrientation: 'landscape' | 'portrait'
): object[] {
  if (fromOrientation === toOrientation) return objects;

  const landscapeWidth = 324;
  const landscapeHeight = 204;
  const portraitWidth = 204;
  const portraitHeight = 324;

  const scaleX = toOrientation === 'portrait' 
    ? portraitWidth / landscapeWidth 
    : landscapeWidth / portraitWidth;
  
  const scaleY = toOrientation === 'portrait' 
    ? portraitHeight / landscapeHeight 
    : landscapeHeight / portraitHeight;

  return objects.map(obj => {
    const scaled: Record<string, unknown> = { ...obj };
    
    // Scale position
    if (typeof scaled.left === 'number') {
      scaled.left = Math.round((scaled.left as number) * scaleX);
    }
    if (typeof scaled.top === 'number') {
      scaled.top = Math.round((scaled.top as number) * scaleY);
    }
    
    // Scale dimensions
    if (typeof scaled.width === 'number') {
      scaled.width = Math.round((scaled.width as number) * scaleX);
    }
    if (typeof scaled.height === 'number') {
      scaled.height = Math.round((scaled.height as number) * scaleY);
    }
    if (typeof scaled.radius === 'number') {
      scaled.radius = Math.round((scaled.radius as number) * Math.min(scaleX, scaleY));
    }
    if (typeof scaled.rx === 'number') {
      scaled.rx = Math.round((scaled.rx as number) * scaleX);
    }
    if (typeof scaled.ry === 'number') {
      scaled.ry = Math.round((scaled.ry as number) * scaleY);
    }

    // Scale line coordinates
    if (typeof scaled.x1 === 'number') {
      scaled.x1 = Math.round((scaled.x1 as number) * scaleX);
    }
    if (typeof scaled.x2 === 'number') {
      scaled.x2 = Math.round((scaled.x2 as number) * scaleX);
    }
    if (typeof scaled.y1 === 'number') {
      scaled.y1 = Math.round((scaled.y1 as number) * scaleY);
    }
    if (typeof scaled.y2 === 'number') {
      scaled.y2 = Math.round((scaled.y2 as number) * scaleY);
    }

    // Scale font size proportionally
    if (typeof scaled.fontSize === 'number') {
      scaled.fontSize = Math.round((scaled.fontSize as number) * Math.min(scaleX, scaleY));
    }

    return scaled;
  });
}

/**
 * Combines background and content layout objects into a single canvas JSON
 */
export function combineDesignElements(
  backgroundObjects: object[],
  contentObjects: object[],
  canvasWidth: number,
  canvasHeight: number
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
  canvasWidth: number,
  canvasHeight: number
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
 * Pre-defined color palettes for quick selection
 */
export const COLOR_PALETTES = [
  { 
    id: 'ocean',
    name: 'Ocean',
    primary: '#0EA5E9',
    secondary: '#06B6D4',
  },
  { 
    id: 'forest',
    name: 'Forest',
    primary: '#10B981',
    secondary: '#059669',
  },
  { 
    id: 'sunset',
    name: 'Sunset',
    primary: '#F97316',
    secondary: '#EF4444',
  },
  { 
    id: 'lavender',
    name: 'Lavender',
    primary: '#8B5CF6',
    secondary: '#A855F7',
  },
  { 
    id: 'midnight',
    name: 'Midnight',
    primary: '#3B82F6',
    secondary: '#1E40AF',
  },
  { 
    id: 'rose',
    name: 'Rose',
    primary: '#EC4899',
    secondary: '#DB2777',
  },
  { 
    id: 'slate',
    name: 'Slate',
    primary: '#475569',
    secondary: '#64748B',
  },
  { 
    id: 'amber',
    name: 'Amber',
    primary: '#F59E0B',
    secondary: '#D97706',
  },
] as const;
