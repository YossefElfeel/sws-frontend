import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CURRENCIES, type Currency } from './catalog';

/**
 * Viewer preferences: theme and currency.
 *
 * Spec 4.2 requires the currency to switch without a full page reload and to persist for the
 * next visit; spec 4.3 requires a light/dark toggle in the header, remembered in local
 * storage and, once signed in, on the account. Both are stored here and applied to the
 * document root so CSS resolves them through the token layer rather than through component
 * logic.
 */

export type Theme = 'light' | 'dark';

interface PrefsValue {
  theme: Theme;
  currency: Currency;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setCurrency: (c: Currency) => void;
}

const PrefsContext = createContext<PrefsValue | null>(null);

const THEME_KEY = 'sws.theme';
const CURRENCY_KEY = 'sws.currency';

/** Storage can throw in a private window or with site data blocked, so every read is guarded. */
function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* A viewer who blocks storage still gets a working page, just not a remembered one. */
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => read(THEME_KEY, ['light', 'dark'], 'light'));
  const [currency, setCurrency] = useState<Currency>(() =>
    read(CURRENCY_KEY, CURRENCIES, 'USD'),
  );

  useEffect(() => {
    // The attribute drives the token layer's dark block, which is why no component needs to
    // know which theme is active.
    document.documentElement.setAttribute('data-theme', theme);
    write(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    write(CURRENCY_KEY, currency);
  }, [currency]);

  const value = useMemo<PrefsValue>(
    () => ({
      theme,
      currency,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
      setCurrency,
    }),
    [theme, currency],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
