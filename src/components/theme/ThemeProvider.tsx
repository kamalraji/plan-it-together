/**
 * Theme Provider Component
 * Provides theme context and switching capabilities throughout the app
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme, Theme } from '../../hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  currentTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}
 
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children
}) => {
  const themeState = useTheme();

  return (
    <ThemeContext.Provider value={themeState}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;