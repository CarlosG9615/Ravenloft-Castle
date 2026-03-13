import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {

  useEffect(() => {
    // Siempre modo oscuro — elimina cualquier tema claro guardado
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode: true, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}