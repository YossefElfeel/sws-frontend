import type { ReactNode } from 'react';
import { IconAlert } from './icons';
import { useLocale } from '../lib/locale';

/**
 * The marker for a control WHMCS cannot do natively.
 *
 * PRODUCT.md principle 4: show the constraint, don't promise past it. A switch that the
 * platform has no field for would otherwise review as finished, be approved, and be
 * discovered at build time. So it says, next to the control, that a developer has to confirm
 * how — and what the gap is.
 */
export function DevNote({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  return (
    <p className="dev-note" role="note">
      <IconAlert size={14} />
      <span>
        <strong>{t('dev.confirm')}</strong> — {children}
      </span>
    </p>
  );
}
