import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('innolink_theme') as AppTheme;
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'system';
  });

  const getSystemTheme = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (theme === 'system') return getSystemTheme();
    return theme;
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('innolink_theme', newTheme);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    const applyTheme = () => {
      let active: 'dark' | 'light';
      if (theme === 'system') {
        active = getSystemTheme();
      } else {
        active = theme;
      }

      setResolvedTheme(active);

      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(active);
      root.setAttribute('data-theme', active);
      root.style.colorScheme = active;
    };

    applyTheme();

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        if (theme === 'system') {
          applyTheme();
        }
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
