import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconMore } from './icons';
import { useLocale } from '../lib/locale';

export interface RowMenuItem {
  /** Stable across renders; also what the menu keys its children by. */
  id: string;
  label: string;
  icon?: ReactNode;
  /** A destination, or an action. Exactly one of the two. */
  to?: string;
  onSelect?: () => void;
  /** Takes something away — cancelling, deleting, closing. */
  danger?: boolean;
}

/**
 * The actions a table row has that are not its one obvious action.
 *
 * A services row has four things you can do to it and room for about one. Spreading them along
 * the row was the alternative and it was tried on paper: four `sm` buttons per row, forty
 * buttons on a ten-row table, and the row's own meaning — a plan, a domain, a price, a state —
 * competing with a wall of chrome for the same width. So the row keeps the action people came
 * for and the rest live behind one handle.
 *
 * **Fixed rather than absolute.** The table it sits in is a scroll container
 * (`.card--flush.table-scroll`), and `overflow-x: auto` with a visible block axis computes to
 * `auto` on both — so an absolutely positioned panel is clipped at the card's edge, which is
 * exactly where a last-column menu opens. Positioning from the button's own rect sidesteps the
 * container entirely. The cost is that the panel does not travel with a scroll, so any scroll
 * closes it; that is the honest behaviour for a menu anchored to a row you just scrolled away.
 */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const { dir } = useLocale();
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /** Anchored to the button's trailing edge, and flipped above it when the fold is closer. */
  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    // 44 per item plus the panel's own padding — close enough to decide which side to open on,
    // and it only has to be right about "is there room", not about the pixel.
    const need = items.length * 44 + 16;
    const below = window.innerHeight - r.bottom > need;
    setAt({
      insetInlineEnd: dir === 'rtl' ? r.left : window.innerWidth - r.right,
      ...(below
        ? { insetBlockStart: r.bottom + 8 }
        : { insetBlockEnd: window.innerHeight - r.top + 8 }),
    });
  }, [dir, items.length]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        btnRef.current?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      // A menu you opened from the keyboard has to be walkable from the keyboard.
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      );
      if (focusable.length === 0) return;
      e.preventDefault();
      const here = focusable.indexOf(document.activeElement as HTMLElement);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const next = (here + step + focusable.length) % focusable.length;
      focusable[next].focus();
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    // Capture, so a scroll inside the table card counts as well as one on the document.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="rowmenu__btn"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconMore size={18} />
      </button>

      {open && (
        <div ref={panelRef} className="rowmenu" style={at} role="menu" aria-label={label}>
          {items.map((item) => {
            const body = (
              <>
                {item.icon}
                <span>{item.label}</span>
              </>
            );
            const cls = `rowmenu__item${item.danger ? ' rowmenu__item--danger' : ''}`;
            return item.to ? (
              <Link
                key={item.id}
                className={cls}
                role="menuitem"
                to={item.to}
                onClick={() => setOpen(false)}
              >
                {body}
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                className={cls}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {body}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
