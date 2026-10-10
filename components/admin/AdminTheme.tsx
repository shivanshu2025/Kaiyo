'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AdminTheme = 'light' | 'dark';

const STORAGE_KEY = 'kaiyo-admin-theme';
const ROOT_CLASS = 'kayo-dark';

type AdminThemeContextValue = {
  theme: AdminTheme;
  isDark: boolean;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function readStoredTheme(): AdminTheme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    // Private mode / storage disabled — fall back to the default theme.
    return null;
  }
}

/**
 * Runs before first paint so the correct theme is on <html> before React ever
 * hydrates. Without this the dashboard would paint light, then flip to dark.
 */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY
)});if(t==="dark"||t==="light"){var r=document.documentElement;if(t==="dark"){r.classList.add(${JSON.stringify(
  ROOT_CLASS
)});}else{r.classList.remove(${JSON.stringify(ROOT_CLASS)});}}}catch(e){}})();`;

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  // Always starts 'light' so the server HTML and the first client render match.
  // The real value is adopted in the effect below; CSS has already painted the
  // correct theme via the <html> class, so nothing visibly shifts.
  const [theme, setThemeState] = useState<AdminTheme>('light');

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) setThemeState(stored);
  }, []);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    const root = document.documentElement;
    root.classList.toggle(ROOT_CLASS, next === 'dark');
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; the theme still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: AdminTheme = current === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      root.classList.toggle(ROOT_CLASS, next === 'dark');
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // See above.
      }
      return next;
    });
  }, []);

  // Keep multiple open tabs consistent.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = event.newValue === 'dark' ? 'dark' : 'light';
      setThemeState(next);
      document.documentElement.classList.toggle(ROOT_CLASS, next === 'dark');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used inside <AdminThemeProvider>');
  }
  return context;
}