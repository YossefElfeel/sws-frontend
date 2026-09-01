import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  PLANS,
  ADDONS,
  TAX_RATE,
  convert,
  planPrice,
  type Cycle,
  type Plan,
} from './catalog';
import { usePrefs } from './prefs';

/** A configured line: the plan, its cycle, its add-on choices and any linked domain. */
export interface CartLine {
  id: string;
  plan: Plan;
  cycle: Cycle;
  /** addon group id -> option id */
  addons: Record<string, string>;
  domain?: { name: string; action: 'register' | 'transfer' | 'own' | 'cart'; years: number };
}

interface CartValue {
  lines: CartLine[];
  promo: string | null;
  add: (line: Omit<CartLine, 'id'>) => string;
  update: (id: string, patch: Partial<Omit<CartLine, 'id'>>) => void;
  remove: (id: string) => void;
  clear: () => void;
  applyPromo: (code: string) => boolean;
  /** All figures in the active currency, as minor units. */
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  lineTotal: (line: CartLine) => number;
}

const CartContext = createContext<CartValue | null>(null);

/** The one code the spec's promo field is demonstrated with. */
const PROMOS: Record<string, number> = { SWS10: 0.1 };

export function CartProvider({ children }: { children: ReactNode }) {
  const { currency } = usePrefs();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [promo, setPromo] = useState<string | null>(null);

  const add = useCallback((line: Omit<CartLine, 'id'>) => {
    const id = `${line.plan.id}-${Math.random().toString(36).slice(2, 8)}`;
    setLines((prev) => [...prev, { ...line, id }]);
    return id;
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<CartLine, 'id'>>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const value = useMemo<CartValue>(() => {
    /** A line is its plan for the cycle, plus every chosen add-on priced over the same term. */
    const lineTotal = (line: CartLine) => {
      let sum = planPrice(line.plan, line.cycle, currency);
      for (const group of ADDONS) {
        const chosen = group.options.find((o) => o.id === line.addons[group.id]);
        if (!chosen || chosen.priceUsdMinor === 0) continue;
        sum += convert(chosen.priceUsdMinor, currency);
      }
      return sum;
    };

    const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
    const discount = promo ? Math.round(subtotal * (PROMOS[promo] ?? 0)) : 0;
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * TAX_RATE);

    return {
      lines,
      promo,
      add,
      update,
      remove,
      clear: () => {
        setLines([]);
        setPromo(null);
      },
      applyPromo: (code: string) => {
        const key = code.trim().toUpperCase();
        if (!(key in PROMOS)) return false;
        setPromo(key);
        return true;
      },
      subtotal,
      discount,
      tax,
      total: taxable + tax,
      lineTotal,
    };
  }, [lines, promo, currency, add, update, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

/** Default add-on selection: the first option of every group, which the spec shows as None. */
export function defaultAddons(): Record<string, string> {
  return Object.fromEntries(ADDONS.map((g) => [g.id, g.options[0].id]));
}

export { PLANS };
