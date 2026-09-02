import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const themes = [
  { id: 'default', label: 'Soft Green' },
  { id: 'ptc', label: 'PTC Forest' },
  { id: 'purple', label: 'Soft Purple' },
  { id: 'pink', label: 'Soft Pink' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('equallearn-theme') || 'default');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('equallearn-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, themes }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
