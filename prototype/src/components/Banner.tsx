import type { ReactNode } from 'react';
import { IconCheck, IconAlert, IconInfo, IconClose } from './icons';
import { useLocale } from '../lib/locale';

/**
 * System banner — S-05.
 *
 * Four severities, and all four have had tokens since the gate was extended; this is the
 * component that finally uses them. Severity is carried by ground, border and icon together —
 * never by colour alone — so the four stay distinguishable to anyone who cannot separate red
 * from green.
 *
 * A banner announces itself when it carries bad news and stays quiet when it does not:
 * role="alert" interrupts a screen reader mid-sentence, which is right for a failure and rude
 * for a tip.
 */
export type Severity = 'success' | 'warning' | 'danger' | 'info';

const ICON: Record<Severity, ReactNode> = {
  success: <IconCheck size={18} />,
  warning: <IconAlert size={18} />,
  danger: <IconAlert size={18} />,
  info: <IconInfo size={18} />,
};

export function Banner({
  severity = 'info',
  title,
  children,
  onDismiss,
  action,
}: {
  severity?: Severity;
  title?: string;
  children?: ReactNode;
  /** Omit to make the banner permanent — a dismiss button that does nothing is worse. */
  onDismiss?: () => void;
  action?: ReactNode;
}) {
  const { t } = useLocale();
  const loud = severity === 'danger' || severity === 'warning';

  return (
    <div
      className={`banner banner--${severity}`}
      role={loud ? 'alert' : 'status'}
      aria-live={loud ? 'assertive' : 'polite'}
    >
      <span className="banner__icon" aria-hidden="true">
        {ICON[severity]}
      </span>

      <div className="banner__text">
        {title && <p className="banner__title">{title}</p>}
        {children && <div className="banner__body">{children}</div>}
      </div>

      {action && <div className="banner__action">{action}</div>}

      {onDismiss && (
        <button
          type="button"
          className="banner__close"
          onClick={onDismiss}
          aria-label={t('sys.dismiss')}
        >
          <IconClose size={16} />
        </button>
      )}
    </div>
  );
}
