import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Banner } from '../components/Banner';
import { useLocale } from './locale';

/**
 * "It saved" — the smallest honest thing a Save button can do.
 *
 * A control that changes nothing visible reads as broken, and a prototype full of them reads
 * as a prototype that does not work. There is no server here to save to, so what the button
 * can honestly report is that it was pressed and the form was accepted; that is what this
 * shows, and it says nothing about a round trip that did not happen.
 *
 * The message clears itself, because a success banner that stays forever stops being about
 * the thing you just did.
 */
export function useSaved(ms = 4000) {
  const [saved, setSaved] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const mark = (message?: string) => {
    window.clearTimeout(timer.current);
    setSaved(message ?? '');
    timer.current = window.setTimeout(() => setSaved(null), ms);
  };

  return { saved, mark, clear: () => setSaved(null) };
}

/** The banner the hook is usually paired with. Renders nothing until something has happened. */
export function SavedNote({
  saved,
  onDismiss,
  children,
}: {
  saved: string | null;
  onDismiss?: () => void;
  children?: ReactNode;
}) {
  const { t } = useLocale();
  if (saved === null) return null;

  return (
    <div className="u-mb-16">
      <Banner severity="success" title={saved || t('save.done')} onDismiss={onDismiss}>
        {children ?? t('save.doneNote')}
      </Banner>
    </div>
  );
}
