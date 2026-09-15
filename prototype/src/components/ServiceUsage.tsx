import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  IconMail,
  IconArrow,
  IconFolder,
  IconArchive,
  IconGlobe,
  IconClock,
  IconDatabase,
  IconGauge,
} from './icons';
import { useLocale } from '../lib/locale';
import { CPANEL_APPS, type Service } from '../lib/account';

/**
 * One glyph per cPanel tool, so a shortcut is recognised before it is read.
 *
 * A function of a size rather than a fixed element: the same glyph marks the tool in a list of
 * ten and again, four times larger, at the head of that tool’s own page.
 */
export const APP_ICON: Record<string, (size: number) => ReactNode> = {
  email: (size) => <IconMail size={size} />,
  forwarders: (size) => <IconArrow size={size} />,
  autoresponders: (size) => <IconMail size={size} />,
  files: (size) => <IconFolder size={size} />,
  backups: (size) => <IconArchive size={size} />,
  domains: (size) => <IconGlobe size={size} />,
  cron: (size) => <IconClock size={size} />,
  mysql: (size) => <IconDatabase size={size} />,
  phpmyadmin: (size) => <IconDatabase size={size} />,
  awstats: (size) => <IconGauge size={size} />,
};

/**
 * What the account has used of what it pays for, and the ten doors into the panel.
 *
 * Both of these belonged to the service page and now also answer a question the dashboard was
 * leaving to a second click: how much room is left, and where the thing I do every day is.
 * They are one implementation rather than two, because the parts that are easy to get subtly
 * wrong on a copy are exactly the parts nobody re-reads — the meter's accessible name, which
 * is the only way the bar is readable at all to a screen reader, and the two thresholds that
 * turn it amber and red.
 */

/** The bars a hosting product reports: disk, then transfer. */
export function ServiceMeters({ svc }: { svc: Service }) {
  const { t } = useLocale();
  const bars = [
    { key: 'svc.disk', used: svc.diskUsedGb, total: svc.diskTotalGb, unit: 'GB' },
    { key: 'svc.bandwidth', used: svc.bandwidthUsedGb, total: svc.bandwidthTotalGb, unit: 'GB' },
  ];

  return (
    <div className="meters">
      {bars.map((b) => {
        const pct = Math.min(100, (b.used / b.total) * 100);
        const left = Math.round((b.total - b.used) * 10) / 10;
        return (
          <div className="meter" key={b.key}>
            <p className="meter__head">
              <span>{t(b.key as never)}</span>
              <span>
                <span className="meter__left serial">
                  {left} {b.unit}
                </span>{' '}
                {t('svc.left')}
              </span>
            </p>
            {/*
              A bar is a picture of a number, so it carries the number as its name. Without it
              a screen reader meets an empty span and the whole meter is silent.
            */}
            <span
              className="meter__track"
              role="img"
              aria-label={`${t(b.key as never)}: ${b.used} ${t('dash.of')} ${b.total} ${b.unit}`}
            >
              <span
                className={`meter__fill${pct >= 90 ? ' meter__fill--full' : pct >= 75 ? ' meter__fill--high' : ''}`}
                style={{ inlineSize: `${pct}%` }}
              />
            </span>
            <p className="meter__head">
              <span className="serial">
                {b.used} {t('dash.of')} {b.total} {b.unit}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The panel's tools, as links that carry the domain they are for.
 *
 * Webmail and the site builder are left out: both have their own front door elsewhere in the
 * client area, and a shortcut list is for the things that have none.
 */
export function ServiceShortcuts({ domain, limit = 10 }: { domain: string; limit?: number }) {
  const { t } = useLocale();
  const apps = CPANEL_APPS.filter((a) => a.id !== 'webmail' && a.id !== 'builder').slice(0, limit);

  return (
    <ul className="shortcuts">
      {apps.map((a) => (
        <li key={a.id}>
          <Link className="quick__item" to={`/cpanel/${a.id}?domain=${domain}`}>
            {APP_ICON[a.id]?.(17)}
            {t(a.labelKey as never)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
