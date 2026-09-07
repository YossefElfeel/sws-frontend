import { IconCheck, IconAlert } from './icons';
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
export const STATE_TAG: Record<SystemState, string> = {
  operational: 'ok',
  degraded: 'warn',
  maintenance: 'taken',
  down: 'due',
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

export function SystemList({ systems }: { systems: SystemRow[] }) {
  const { t } = useLocale();
  return (
    <ul className="sys">
      {systems.map((s) => (
        <li className="sys__row" key={s.id}>
          <span className={`sys__dot sys__dot--${s.state}`} aria-hidden="true" />
          <span className="sys__name">{t(s.labelKey as never)}</span>
          <span className={`tag tag--${STATE_TAG[s.state]}`}>
            {t(`status.state.${s.state}` as never)}
          </span>
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
            <span className={`tag tag--${STATE_TAG[i.state]}`}>
              {t(`status.state.${i.state}` as never)}
            </span>
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
