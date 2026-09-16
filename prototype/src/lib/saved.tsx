import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
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

/**
 * Whether anything in a form has actually been changed.
 *
 * These forms are uncontrolled — every field carries a `defaultValue`, which is the right
 * shape for a prototype whose fixtures are the source of truth. What it costs is that nothing
 * knows whether a field has been touched, so Save sat lit on a form nobody had edited,
 * offering to save changes that did not exist.
 *
 * Rather than make every form controlled, this listens at the container and asks the fields
 * themselves: a text field against its `defaultValue`, a checkbox or radio against its
 * `defaultChecked`, a select against the option marked selected. Putting an edit back the way
 * it was makes the form clean again, which a flag set once on the first keystroke would not.
 *
 * `settle` is what a save does to the baseline: what is on screen becomes the new starting
 * point, so the button goes quiet again without the page reloading.
 */
type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function useDirty<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [dirty, setDirty] = useState(false);

  const fields = () =>
    Array.from(ref.current?.querySelectorAll<Field>('input, textarea, select') ?? []);

  const check = useCallback(() => {
    setDirty(
      fields().some((f) => {
        if (f instanceof HTMLSelectElement) {
          const base = Array.from(f.options).find((o) => o.defaultSelected);
          return f.value !== (base?.value ?? f.options[0]?.value ?? '');
        }
        if (f instanceof HTMLInputElement && (f.type === 'checkbox' || f.type === 'radio')) {
          return f.checked !== f.defaultChecked;
        }
        return f.value !== f.defaultValue;
      }),
    );
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.addEventListener('input', check);
    root.addEventListener('change', check);
    return () => {
      root.removeEventListener('input', check);
      root.removeEventListener('change', check);
    };
  }, [check]);

  const settle = useCallback(() => {
    fields().forEach((f) => {
      if (f instanceof HTMLSelectElement) {
        Array.from(f.options).forEach((o) => {
          o.defaultSelected = o.selected;
        });
        return;
      }
      if (f instanceof HTMLInputElement && (f.type === 'checkbox' || f.type === 'radio')) {
        f.defaultChecked = f.checked;
        return;
      }
      f.defaultValue = f.value;
    });
    setDirty(false);
  }, []);

  return { dirty, ref, settle };
}
