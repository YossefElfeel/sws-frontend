import { Link } from 'react-router-dom';
import { IconCheck, IconAlert, IconArrow } from './icons';
import { Tag, type TagTone } from './Tag';
import { useLocale } from '../lib/locale';
import type { SystemRow, Incident, SystemState } from '../lib/marketing';

/**
 * The status page's three blocks — the headline, the systems, the incidents — shared by the
 * public page (M-16) and the one inside the client area (C-41), so the two cannot drift.
 *
 * Three tones, not two. Red is for an outage; a slow API and a scheduled maintenance window
 * are not outages, and painting them red is how a status page teaches people to ignore it.
 *
 * No uptime percentage appears anywhere. None has been verified, and a status page is the one
 * place where an invented "99.9%" is not marketing but a claim someone will hold you to.
 */

/** The headline's ground, keyed to the modifiers the headline rule declares. */
export const STATE_TAG: Record<SystemState, string> = {
  operational: 'ok',
  degraded: 'warn',
  maintenance: 'taken',
  down: 'due',
};

/** The chip beside a system or an incident, in the Tag component's own ladder. */
export const STATE_TONE: Record<SystemState, TagTone> = {
  operational: 'ok',
  degraded: 'warn',
  maintenance: 'neutral',
  down: 'bad',
};

/** The one word the page was opened to read. */
export function worstOf(systems: SystemRow[]): SystemState {
  if (systems.some((s) => s.state === 'down')) return 'down';
  if (systems.some((s) => s.state === 'degraded')) return 'degraded';
  if (systems.some((s) => s.state === 'maintenance')) return 'maintenance';
  return 'operational';
}

export function StatusHeadline({ worst }: { worst: SystemState }) {
  const { t } = useLocale();
  return (
    <div className={`headline headline--${STATE_TAG[worst]}`}>
      {worst === 'operational' ? <IconCheck size={26} /> : <IconAlert size={26} />}
      <div>
        <p className="headline__title">{t(`status.all.${worst}` as never)}</p>
        <p className="headline__note">{t('status.checked')}</p>
      </div>
    </div>
  );
}

/*
 * The list is an index, and an index that cannot be opened is a dead end: six chips answer
 * "is it me?" and nothing answers "since when, and has this happened before?". Where a caller
 * passes `hrefFor`, the name becomes the way in and its ::after takes the whole row, so the
 * target is the 44px band rather than the word. The public page passes nothing and keeps the
 * list it had.
 */
export function SystemList({
  systems,
  hrefFor,
}: {
  systems: SystemRow[];
  hrefFor?: (system: SystemRow) => string;
}) {
  const { t } = useLocale();
  return (
    <ul className="sys">
      {systems.map((s) => (
        <li className={`sys__row${hrefFor ? ' sys__row--link' : ''}`} key={s.id}>
          <span className={`sys__dot sys__dot--${s.state}`} aria-hidden="true" />
          {hrefFor ? (
            <Link className="sys__name sys__link" to={hrefFor(s)}>
              {t(s.labelKey as never)}
            </Link>
          ) : (
            <span className="sys__name">{t(s.labelKey as never)}</span>
          )}
          <Tag tone={STATE_TONE[s.state]}>{t(`status.state.${s.state}` as never)}</Tag>
          {hrefFor && <IconArrow size={15} className="sys__arrow" />}
        </li>
      ))}
    </ul>
  );
}

export function IncidentList({ incidents }: { incidents: Incident[] }) {
  const { t } = useLocale();
  return (
    <ul className="incidents">
      {incidents.map((i) => (
        <li className="incident" key={i.id}>
          <div className="incident__head">
            <Tag tone={STATE_TONE[i.state]}>{t(`status.state.${i.state}` as never)}</Tag>
            <span className="incident__at serial">
              <bdi>{i.at}</bdi>
            </span>
            {i.minutes !== undefined && (
              <span className="incident__len">
                <span className="serial">{i.minutes}</span> {t('status.minutes')}
              </span>
            )}
          </div>
          <h3 className="incident__title">{t(i.titleKey as never)}</h3>
          <p className="incident__body">{t(i.bodyKey as never)}</p>
        </li>
      ))}
    </ul>
  );
}
