import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCoin, IconChevron, IconLock, IconCheck } from './icons';
import { Button } from './Button';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { CURRENCIES, convert, formatAmount, type Currency } from '../lib/catalog';
import { ACCOUNT, BILLING_LOCKED } from '../lib/account';

/**
 * Currency switch — S-04, and both halves of I15.
 *
 * For a visitor, the decision on the register is framed as a choice between blocking the
 * switch and emptying the cart with a warning. Both are worse than the third option, which is
 * what this does: keep the cart, and show the new total before committing to it. Blocking
 * punishes someone for looking. Emptying destroys work they did not ask to lose. The actual
 * risk in the spec is neither — it is a total that changes underneath a person without their
 * noticing, so the fix is to make the change visible rather than to prevent it.
 *
 * Inside the client area the question is different. Once a payment has been made the account
 * is billed in one currency, and re-pricing it from a menu would change what every invoice
 * says. So the control becomes a lock: it still answers "which currency", it opens a note
 * saying why it cannot be changed here and where to ask, and it holds the preference to the
 * account currency so every figure in the account is in the money the person actually pays.
 *
 * With an empty cart there is nothing to be surprised by, so nothing interrupts.
 *
 * ── why the seven options are not a <select>
 *
 * Spec 4.2 asks for seven currencies. A native select gave seven three-letter codes in a list
 * the operating system draws: no names, no mark on the one in force, no relation to anything
 * else on the bar. But the code is the part you only recognise once you already know it —
 * someone looking for their own money is looking for "جنيه مصري", and EGP is what they read
 * *after* they have found the row. So every option carries its name beside its code, the one
 * in force carries a tick, and the list is the same raised panel as the other menus in the
 * shell. All three states of this control — the list, the question, the lock — now open in
 * the same place, at the same width, in the same clothes.
 */
export function CurrencySelect({ variant }: { variant: 'masthead' | 'app' }) {
  const { t, locale } = useLocale();
  const { currency, setCurrency } = usePrefs();
  const { lines, total } = useCart();
  const [pending, setPending] = useState<Currency | null>(null);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);

  const locked = variant === 'app' && BILLING_LOCKED;

  useEffect(() => {
    if (locked && currency !== ACCOUNT.currency) setCurrency(ACCOUNT.currency);
  }, [locked, currency, setCurrency]);

  // The panel closes on the next thing you do, like the notification panel does — and it is
  // one flag for both panels, because the list and the locked note hang off the same trigger
  // and only one of them can ever be under it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      // A list you opened from the keyboard has to be walkable from the keyboard.
      const items = Array.from(
        panel.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [],
      );
      if (items.length === 0) return;
      e.preventDefault();
      const here = items.indexOf(document.activeElement as HTMLElement);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      items[(here + step + items.length) % items.length].focus();
    };
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  // Opening the list lands you on the currency you are already in, so the first arrow press
  // steps away from where you are rather than into the top of a list of seven.
  useEffect(() => {
    if (!open || locked) return;
    panel.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, [open, locked]);

  // The question replaces the list under the same trigger, so that is where focus has to go:
  // otherwise a keyboard is left holding a button whose menu has just disappeared. And having
  // put a keyboard inside a dialog, Escape has to mean the same thing there as it does in the
  // list — which here is "Leave it", the answer that changes nothing.
  useEffect(() => {
    if (!pending) return;
    confirm.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPending(null);
      trigger.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending]);

  const cls = variant === 'masthead' ? 'masthead__select' : 'app__select app__select--currency';

  if (locked) {
    return (
      <span className="cur" ref={wrap}>
        <button
          ref={trigger}
          type="button"
          className={`${cls} cur__trigger`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <IconLock size={14} />
          <span className="u-visually-hidden">{t('cur.lockedLabel')}</span>
          <span className="serial">{ACCOUNT.currency}</span>
        </button>

        {open && (
          <div className="cur__ask" role="dialog" aria-label={t('cur.lockedTitle')}>
            <p className="cur__title">{t('cur.lockedTitle')}</p>
            <p className="cur__note">{t('cur.lockedBody')}</p>
            <div className="cur__acts">
              <Link
                className="btn btn--sm btn--secondary"
                to="/account/tickets/new"
                onClick={() => setOpen(false)}
              >
                {t('cur.lockedAsk')}
              </Link>
              <Button size="sm" variant="quiet" onClick={() => setOpen(false)}>
                {t('cur.lockedClose')}
              </Button>
            </div>
          </div>
        )}
      </span>
    );
  }

  const request = (next: Currency) => {
    setOpen(false);
    if (next !== currency && lines.length > 0) {
      setPending(next);
      return;
    }
    if (next !== currency) setCurrency(next);
    trigger.current?.focus();
  };

  return (
    <span className="cur" ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className={`${cls} cur__trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {variant === 'masthead' && <IconCoin />}
        <span className="u-visually-hidden">{t('currency.label')}</span>
        <span className="serial">{currency}</span>
        <IconChevron size={variant === 'masthead' ? 14 : 13} />
      </button>

      {open && (
        <div ref={panel} className="cur__menu" role="menu" aria-label={t('cur.menu')}>
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              className="cur__opt"
              role="menuitemradio"
              aria-checked={c === currency}
              onClick={() => request(c)}
            >
              {/* The tick keeps its column whether or not it is drawn, so the seven rows read
                  as one list rather than as six rows and an indented one. */}
              <span className="cur__tick" aria-hidden="true">
                {c === currency && <IconCheck size={15} />}
              </span>
              <span className="cur__code serial">{c}</span>
              <span className="cur__name">{t(`cur.name.${c}`)}</span>
            </button>
          ))}
        </div>
      )}

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
              ref={confirm}
              size="sm"
              onClick={() => {
                setCurrency(pending);
                setPending(null);
                trigger.current?.focus();
              }}
            >
              {t('cur.switch')}
            </Button>
            <Button
              size="sm"
              variant="quiet"
              onClick={() => {
                setPending(null);
                trigger.current?.focus();
              }}
            >
              {t('cur.keep')}
            </Button>
          </div>
        </div>
      )}
    </span>
  );
}
