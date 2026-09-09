import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { useLocale } from '../lib/locale';

interface ConfirmButtonProps {
  /** Runs only after the second, deliberate press. */
  onConfirm: () => void;
  /** Names the row, so a list of them does not read as "Remove, Remove, Remove". */
  label: string;
  /** What the resting button shows — usually an icon. */
  children: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * A delete that asks first.
 *
 * Four deletions in the client area were a single click with no confirmation and no undo, and
 * there is no undo to build against: a DNS record, an email forwarding rule, a saved card and a
 * sub-account contact. The DNS one is the reason this exists at all — removing an MX or an A
 * record is a live site or a dead mailbox, and the fixtures make it look free.
 *
 * It arms in place rather than opening a dialog. A dialog for a row action means a scrim, a
 * focus trap, a return-focus contract and another stacking layer, and it takes the reader away
 * from the row they were pointing at — the one piece of information that tells them they picked
 * the right one. Arming keeps the row on screen and asks in the same place.
 *
 * Escape disarms, because a control that arms and cannot be disarmed from the keyboard is a
 * trap. Focus moves to the confirm button so the keyboard path is press, read, press again, and
 * the armed state is announced rather than only drawn.
 */
export function ConfirmButton({
  onConfirm,
  label,
  children,
  size = 'sm',
  className,
}: ConfirmButtonProps) {
  const { t } = useLocale();
  const [armed, setArmed] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setArmed(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [armed]);

  if (!armed) {
    return (
      <Button
        size={size}
        variant="danger"
        aria-label={label}
        className={className}
        onClick={() => setArmed(true)}
      >
        {children}
      </Button>
    );
  }

  return (
    <span className="confirm" role="group" aria-label={label}>
      <Button
        size={size}
        variant="danger"
        ref={confirmRef}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {t('action.confirmRemove')}
      </Button>
      <Button size={size} variant="quiet" onClick={() => setArmed(false)}>
        {t('action.cancel')}
      </Button>
      <span className="u-visually-hidden" role="status">
        {t('action.armed')}
      </span>
    </span>
  );
}
