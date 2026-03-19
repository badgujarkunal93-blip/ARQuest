import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = [
  { id: 'solo-leveling', label: 'Solo Leveling', color: '#7c3aed' },
  { id: 'jarvis', label: 'JARVIS', color: '#00d4ff' },
  { id: 'cyberpunk', label: 'Cyberpunk', color: '#ff00aa' },
  { id: 'samurai', label: 'Samurai', color: '#ff3333' },
  { id: 'ocean', label: 'Ocean', color: '#00e5cc' },
  { id: 'sunset', label: 'Sunset', color: '#ff6b00' },
  { id: 'nature', label: 'Nature', color: '#22c55e' },
  { id: 'midnight', label: 'Midnight', color: '#ffffff' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('arquest-theme') || 'solo-leveling';
  });

  useEffect(() => {
    const attr = theme === 'solo-leveling' ? '' : theme;
    document.documentElement.setAttribute('data-theme', attr);
    localStorage.setItem('arquest-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}