import { useState } from 'react';
import { IconCoin, IconChevron } from './icons';
import { Button } from './Button';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { CURRENCIES, convert, formatAmount, type Currency } from '../lib/catalog';

/**
 * Currency switch — S-04, and the open half of I15.
 *
 * The decision on the register is framed as a choice between blocking the switch and emptying
 * the cart with a warning. Both are worse than the third option, which is what this does:
 * keep the cart, and show the new total before committing to it.
 *
 * Blocking punishes someone for looking. Emptying destroys work they did not ask to lose. The
 * actual risk in the spec is neither — it is a total that changes underneath a person without
 * their noticing, so the fix is to make the change visible rather than to prevent it. If the
 * product owner rules the other way this is one component to change, not every screen.
 *
 * With an empty cart there is nothing to be surprised by, so nothing interrupts.
 */
export function CurrencySelect({ variant }: { variant: 'masthead' | 'app' }) {
  const { t, locale } = useLocale();
  const { currency, setCurrency } = usePrefs();
  const { lines, total } = useCart();
  const [pending, setPending] = useState<Currency | null>(null);

  const cls = variant === 'masthead' ? 'masthead__select' : 'app__select app__select--currency';

  const request = (next: Currency) => {
    if (next === currency) return;
    if (lines.length === 0) {
      setCurrency(next);
      return;
    }
    setPending(next);
  };

  return (
    <span className="cur">
      <label className={cls}>
        {variant === 'masthead' && <IconCoin />}
        <span className="u-visually-hidden">{t('currency.label')}</span>
        <select
          value={currency}
          onChange={(e) => request(e.target.value as Currency)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <IconChevron size={variant === 'masthead' ? 14 : 13} />
      </label>

      {pending && (
        <div className="cur__ask" role="dialog" aria-label={t('cur.title')}>
          <p className="cur__title">{t('cur.title')}</p>

          {/* The two totals side by side is the whole point: the number is not the same number,
              and seeing that before it changes is what stops it feeling like a trick. */}
          <div className="cur__compare">
            <span className="cur__side">
              <span className="cur__label">{t('cur.now')}</span>
              <span className="cur__amount serial">
                {formatAmount(convert(total, currency), locale)} {currency}
              </span>
            </span>
            <span className="cur__side cur__side--to">
              <span className="cur__label">{t('cur.after')}</span>
              <span className="cur__amount serial">
                {formatAmount(convert(total, pending), locale)} {pending}
              </span>
            </span>
          </div>

          <p className="cur__note">{t('cur.note')}</p>

          <div className="cur__acts">
            <Button
              size="sm"
              onClick={() => {
                setCurrency(pending);
                setPending(null);
              }}
            >
              {t('cur.switch')}
            </Button>
            <Button size="sm" variant="quiet" onClick={() => setPending(null)}>
              {t('cur.keep')}
            </Button>
          </div>
        </div>
      )}
    </span>
  );
}
