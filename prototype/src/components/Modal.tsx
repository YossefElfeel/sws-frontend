import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconClose } from './icons';
import { useLocale } from '../lib/locale';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Names the dialog. Short, and says which machine or which act, not just "Confirm". */
  title: string;
  /** The line under the title: what the act does, before anybody agrees to it. */
  lede?: ReactNode;
  children?: ReactNode;
  /** The act and its way out. A dialog that only shows something can leave this empty. */
  footer?: ReactNode;
  /** Widens the panel for a dialog that carries a form rather than a sentence. */
  size?: 'sm' | 'md';
}

/**
 * A dialog, for the acts that need one.
 *
 * ConfirmButton exists for the opposite case and says why: a row action arms in place, because
 * a dialog takes the reader away from the row they were pointing at. The server controls are
 * the case it was arguing against. Reinstall erases a disk, rescue boots a different system,
 * change-hostname needs a field and a validity rule — none of those fit in the width of a
 * button, and none of them should be one press away from the press that opened them.
 *
 * What a dialog owes, and what this one pays:
 *
 * - It is announced as a dialog and named by its own heading (role, aria-modal, labelledby).
 * - Focus moves into it on open and back to the control that opened it on close. Losing the
 *   return is what strands a keyboard reader at the top of the document after every dialog.
 * - Tab cycles inside it. Escape closes it.
 * - The scrim closes it too, because a reader who clicked outside has already left.
 * - The page behind does not scroll. A scrim that scrolls reads as two pages at once.
 *
 * It renders through a portal so the scrim is not trapped in a card's stacking context — a
 * dialog painted underneath the header is the usual way this goes wrong.
 */
export function Modal({ open, onClose, title, lede, children, footer, size = 'sm' }: ModalProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;

    // The first field, or the first button. Not the close button: opening a dialog onto its own
    // dismiss reads as "are you sure you want to be here".
    //
    // It has to skip it by name rather than by order: the close button is the first focusable
    // element in the panel's markup, so the plain "first focusable" this used to be landed on
    // it every time and the comment above described an intention the code did not carry out.
    // The fallback is the close button, for a dialog that holds nothing else to focus.
    const panel = panelRef.current;
    const stops = Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const first = stops.find((n) => !n.classList.contains('modal__close')) ?? stops[0];
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const stops = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (stops.length === 0) return;
      const edge = e.shiftKey ? stops[0] : stops[stops.length - 1];
      if (document.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? stops[stops.length - 1] : stops[0]).focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    const held = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = held;
      openerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal__panel modal__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="modal__head">
          <h2 className="modal__title" id={id}>
            {title}
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label={t('action.close')}>
            <IconClose size={18} />
          </button>
        </header>

        {lede && <p className="modal__lede">{lede}</p>}
        {children && <div className="modal__body">{children}</div>}
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
