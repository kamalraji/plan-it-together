/**
 * Theme Toggle Component
 * Button component for switching between light, dark, and system themes
 */

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { useThemeContext } from './ThemeProvider';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = 'ghost',
  size = 'md',
}) => {
  const { theme, currentTheme, toggleTheme } = useThemeContext();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />;
    }
    return currentTheme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System theme';
    }
    return currentTheme === 'dark' ? 'Dark theme' : 'Light theme';
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'animate-pop-in transition-all duration-200 hover:scale-105',
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
      title={getLabel()}
    >
      <div className="animate-float">
        {getIcon()}
      </div>
      <span className="sr-only">{getLabel()}</span>
    </Button>
  );
};

export default ThemeToggle;