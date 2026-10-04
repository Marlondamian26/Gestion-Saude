import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

import { readTheme, writeTheme, writeThemeAutomatic } from '../utils/storage';

const ThemeContext = createContext();

const VALID_THEMES = ['light', 'dark', 'auto'];

const detectInitialTheme = () => {
  if (typeof window === 'undefined') return 'auto';
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl && VALID_THEMES.includes(fromUrl)) return fromUrl;
  const fromStorage = readTheme();
  if (fromStorage && VALID_THEMES.includes(fromStorage)) return fromStorage;
  return 'auto';
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutomatic, setIsAutomatic] = useState(true);

  useEffect(() => {
    if (isTransitioning) {
      document.body.classList.add('theme-transition');
      const timer = setTimeout(() => {
        document.body.classList.remove('theme-transition');
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  useEffect(() => {
    const resolved = detectInitialTheme();
    if (resolved === 'auto') {
      setIsAutomatic(true);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setIsAutomatic(false);
      setTheme(resolved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (!isAutomatic) {
      writeTheme(theme);
    }
    writeThemeAutomatic(isAutomatic);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme, isAutomatic } }));
  }, [theme, isAutomatic]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (isAutomatic) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isAutomatic]);

  const toggleTheme = useCallback(() => {
    if (isAutomatic) {
      setIsAutomatic(false);
      setIsTransitioning(true);
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    } else {
      setIsTransitioning(true);
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    }
  }, [isAutomatic]);

  const setThemeManually = useCallback((newTheme) => {
    setIsAutomatic(false);
    setIsTransitioning(true);
    setTheme(newTheme);
  }, []);

  const setThemeAutomatic = useCallback(() => {
    setIsAutomatic(true);
    setIsTransitioning(true);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
    writeTheme('auto');
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      setThemeManually,
      setThemeAutomatic,
      isTransitioning,
      isAutomatic,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
