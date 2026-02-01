import React, { createContext, useContext, useState, ReactNode } from 'react';

type BuilderTheme = 'light' | 'dark';

interface BuilderThemeContextType {
  theme: BuilderTheme;
  toggleTheme: () => void;
  isDark: boolean;
}

const BuilderThemeContext = createContext<BuilderThemeContextType | undefined>(undefined);

export const BuilderThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<BuilderTheme>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <BuilderThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </BuilderThemeContext.Provider>
  );
};

export const useBuilderTheme = () => {
  const context = useContext(BuilderThemeContext);
  if (!context) {
    throw new Error('useBuilderTheme must be used within BuilderThemeProvider');
  }
  return context;
};

// Theme CSS variables for light and dark modes
export const getBuilderThemeVars = (isDark: boolean) => ({
  bgPrimary: isDark ? 'hsl(222, 47%, 7%)' : 'hsl(0, 0%, 100%)',
  bgSecondary: isDark ? 'hsl(222, 47%, 9%)' : 'hsl(210, 20%, 98%)',
  bgTertiary: isDark ? 'hsl(222, 47%, 11%)' : 'hsl(210, 20%, 96%)',
  bgHover: isDark ? 'hsl(217, 33%, 18%)' : 'hsl(210, 20%, 93%)',
  border: isDark ? 'hsl(217, 33%, 18%)' : 'hsl(214, 32%, 91%)',
  textPrimary: isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222, 47%, 11%)',
  textSecondary: isDark ? 'hsl(215, 20%, 75%)' : 'hsl(215, 16%, 47%)',
  textMuted: isDark ? 'hsl(215, 20%, 55%)' : 'hsl(215, 16%, 57%)',
  accent: 'hsl(221, 83%, 53%)',
  accentSecondary: 'hsl(199, 89%, 60%)',
});

// Export theme class names for conditional styling
export const BUILDER_THEME_CLASSES = {
  dark: 'builder-theme-dark',
  light: 'builder-theme-light',
} as const;
