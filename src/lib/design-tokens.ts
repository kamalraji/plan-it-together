/**
 * Design Tokens
 * Programmatic access to design system tokens
 * Merged from doodle-hub-delight design system
 */

export interface DesignTokens {
  colors: {
    coral: string;
    coralLight: string;
    teal: string;
    tealLight: string;
    sunny: string;
    lavender: string;
    mint: string;
    cream: string;
  };
  
  animations: {
    float: string;
    bounceGentle: string;
    wave: string;
    wiggle: string;
    popIn: string;
    slideUp: string;
    drawLine: string;
    pulseGlow: string;
    spinSlow: string;
    shimmer: string;
    pulseDot: string;
  };
  
  shadows: {
    soft: string;
    doodle: string;
    float: string;
  };
  
  gradients: {
    hero: string;
    card: string;
    button: string;
  };
  
  typography: {
    fontFamily: string;
    weights: Record<string, number>;
  };
}

export const designTokens: DesignTokens = {
  colors: {
    coral: 'hsl(var(--coral))',
    coralLight: 'hsl(var(--coral-light))',
    teal: 'hsl(var(--teal))',
    tealLight: 'hsl(var(--teal-light))',
    sunny: 'hsl(var(--sunny))',
    lavender: 'hsl(var(--lavender))',
    mint: 'hsl(var(--mint))',
    cream: 'hsl(var(--cream))',
  },
  
  animations: {
    float: 'float 4s ease-in-out infinite',
    bounceGentle: 'bounce-gentle 2s ease-in-out infinite',
    wave: 'wave 1s ease-in-out infinite',
    wiggle: 'wiggle 0.5s ease-in-out infinite',
    popIn: 'pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    slideUp: 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    drawLine: 'draw-line 2s ease forwards',
    pulseGlow: 'pulse-glow 2s ease-in-out infinite',
    spinSlow: 'spin-slow 20s linear infinite',
    shimmer: 'shimmer 2s infinite',
    pulseDot: 'pulse-dot 1.4s infinite ease-in-out both',
  },
  
  shadows: {
    soft: 'var(--shadow-soft)',
    doodle: 'var(--shadow-doodle)',
    float: 'var(--shadow-float)',
  },
  
  gradients: {
    hero: 'var(--gradient-hero)',
    card: 'var(--gradient-card)',
    button: 'var(--gradient-button)',
  },
  
  typography: {
    fontFamily: 'Nunito, system-ui, sans-serif',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
};

/**
 * Animation delay utilities for staggered effects
 */
export const animationDelays = {
  100: '100ms',
  200: '200ms',
  300: '300ms',
  400: '400ms',
  500: '500ms',
  600: '600ms',
  700: '700ms',
  800: '800ms',
  900: '900ms',
  1000: '1000ms',
} as const;

/**
 * Theme switching utilities
 */
export const themeUtils = {
  /**
   * Apply theme transition class to element
   */
  applyThemeTransition: (element: HTMLElement) => {
    element.classList.add('theme-transition');
  },
  
  /**
   * Toggle dark mode
   */
  toggleDarkMode: () => {
    document.documentElement.classList.toggle('dark');
  },
  
  /**
   * Set theme mode
   */
  setTheme: (theme: 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  /**
   * Get current theme
   */
  getCurrentTheme: (): 'light' | 'dark' => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },
};

/**
 * CSS custom property utilities
 */
export const cssVarUtils = {
  /**
   * Get CSS custom property value
   */
  getCSSVar: (property: string): string => {
    return getComputedStyle(document.documentElement).getPropertyValue(property);
  },
  
  /**
   * Set CSS custom property value
   */
  setCSSVar: (property: string, value: string): void => {
    document.documentElement.style.setProperty(property, value);
  },
  
  /**
   * Remove CSS custom property
   */
  removeCSSVar: (property: string): void => {
    document.documentElement.style.removeProperty(property);
  },
};

/**
 * Animation configuration utilities
 */
export const animationConfig = {
  /**
   * Configure animation using CSS custom properties
   */
  configureAnimation: (element: HTMLElement, config: {
    duration?: string;
    delay?: string;
    timingFunction?: string;
    iterationCount?: string;
  }) => {
    if (config.duration) {
      element.style.setProperty('--animation-duration', config.duration);
    }
    if (config.delay) {
      element.style.setProperty('--animation-delay', config.delay);
    }
    if (config.timingFunction) {
      element.style.setProperty('--animation-timing-function', config.timingFunction);
    }
    if (config.iterationCount) {
      element.style.setProperty('--animation-iteration-count', config.iterationCount);
    }
  },
  
  /**
   * Apply staggered animation delays to a list of elements
   */
  applyStaggeredDelay: (elements: HTMLElement[], baseDelay: number = 100) => {
    elements.forEach((element, index) => {
      element.style.animationDelay = `${baseDelay * index}ms`;
    });
  },
};

export default designTokens;