import { useCallback, useEffect, useState } from 'react';
import { readJSON, THEME_KEY, writeJSON } from '../lib/storage';

export type Theme = 'light' | 'dark';

/**
 * Light is the default for everyone; the button switches to dark.
 * (No system-preference follow: the request was day mode by default.)
 * The choice is remembered across reloads.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => (readJSON<Theme>(THEME_KEY) === 'dark' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeJSON(THEME_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}
