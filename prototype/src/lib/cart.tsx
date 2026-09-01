import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PLANS, type Currency, type Cycle, type Plan } from './catalog';

export interface CartLine {
  /** The counterfoil number. The statement keeps one; the order carries the other. */
  serial: string;
  plan: Plan;
  cycle: Cycle;
  domain?: string;
}

interface CartValue {
  lines: CartLine[];
  currency: Currency;
  cycle: Cycle;
  setCurrency: (c: Currency) => void;
  setCycle: (c: Cycle) => void;
  add: (planId: string, serial: string, domain?: string) => void;
  remove: (serial: string) => void;
  clear: () => void;
  subtotal: number;
  vat: number;
  total: number;
}

const CartContext = createContext<CartValue | null>(null);

/** Egyptian VAT on hosting services. Shown as its own line, never folded into the price. */
const VAT_RATE = 0.14;

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [currency, setCurrency] = useState<Currency>('EGP');
  const [cycle, setCycle] = useState<Cycle>('monthly');

  const add = useCallback(
    (planId: string, serial: string, domain?: string) => {
      const plan = PLANS.find((p) => p.id === planId);
      if (!plan) return;
      setLines((prev) =>
        prev.some((l) => l.plan.id === planId) ? prev : [...prev, { serial, plan, cycle, domain }],
      );
    },
    [cycle],
  );

  const remove = useCallback((serial: string) => {
    setLines((prev) => prev.filter((l) => l.serial !== serial));
  }, []);

  const value = useMemo<CartValue>(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.plan.price[currency][cycle], 0);
    const vat = Math.round(subtotal * VAT_RATE);
    return {
      lines,
      currency,
      cycle,
      setCurrency,
      setCycle,
      add,
      remove,
      clear: () => setLines([]),
      subtotal,
      vat,
      total: subtotal + vat,
    };
  }, [lines, currency, cycle, add, remove]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
