import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconArrow, IconExternal, IconServer, IconSupport } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount } from '../../lib/catalog';
import { SERVICES, type ServiceStatus } from '../../lib/account';

/** The statuses a service can be filtered to, matching invoices and tickets. */
const STATUSES: (ServiceStatus | 'all')[] = ['all', 'active', 'pending', 'suspended'];

/** My Services — spec 9.2: plan, linked domain, status, next renewal. */
export function Services() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [status, setStatus] = useState<ServiceStatus | 'all'>('all');

  const rows = SERVICES.filter((s) => status === 'all' || s.status === status);

  return (
    <AccountLayout
      title={t('acc.services')}
      actions={
        <Link className="btn btn--md btn--secondary" to="/hosting">
          {t('action.order')}
        </Link>
      }
    >
      <div className="bar">
        <div className="filters" role="group" aria-label={t('account.status')}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`filters__btn${status === s ? ' is-active' : ''}`}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {t(s === 'all' ? 'inv.all' : (`status.${s}` as never))}
            </button>
          ))}
        </div>
        <p className="bar__count">
          <span className="serial">{rows.length}</span> {t('dash.of')}{' '}
          <span className="serial">{SERVICES.length}</span>
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="card card--flush table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('col.item')}</th>
                <th scope="col">{t('col.term')}</th>
                <th scope="col">{t('account.nextdue')}</th>
                <th scope="col" className="num">{t('col.amount')}</th>
                <th scope="col">{t('account.status')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="lead">{s.product}</span>
                    <span className="data__sub serial"><bdi>{s.domain}</bdi></span>
                  </td>
                  <td>{t(`cycle.${s.cycle}` as never)}</td>
                  <td className="serial"><bdi>{s.nextDue}</bdi></td>
                  <td className="num">
                    {formatAmount(convert(s.amountUsdMinor, currency), locale)} {currency}
                  </td>
                  <td>
                    <span className={`tag tag--${s.status === 'active' ? 'ok' : 'taken'}`}>
                      {t(`status.${s.status}` as never)}
                    </span>
                  </td>
                  <td className="num">
                    <Link className="btn btn--sm btn--secondary" to={`/account/services/${s.id}`}>
                      {t('svc.manage')}
                      <IconArrow size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* A filter that matches nothing says so, rather than showing an empty table frame. */
        <div className="card empty">
          <IconServer size={28} />
          <p className="empty__title">{t('empty.services')}</p>
          <p className="empty__note">{t('empty.filter')}</p>
        </div>
      )}
    </AccountLayout>
  );
}

/**
 * Service details — spec 9.2: server information, a direct cPanel login, billing details,
 * upgrade/downgrade, cancellation, and related support.
 *
 * cPanel is the reason most people open this screen, so it is the header action rather than a
 * button at the bottom of a card. Usage reads as what is left rather than what is gone: the
 * number someone needs before buying more storage is the remainder.
 */
export function ServiceDetail() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const svc = SERVICES.find((s) => s.id === id);

  if (!svc) return <Navigate to="/account/services" replace />;

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  const bars = [
    { key: 'svc.disk', used: svc.diskUsedGb, total: svc.diskTotalGb, unit: 'GB' },
    { key: 'svc.bandwidth', used: svc.bandwidthUsedGb, total: svc.bandwidthTotalGb, unit: 'GB' },
  ];

  return (
    <AccountLayout
      title={svc.product}
      lede={svc.domain}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.services'), to: '/account/services' },
        { label: svc.product },
      ]}
      actions={
        <Button size="md">
          <IconExternal size={15} />
          {t('svc.cpanel')}
        </Button>
      }
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.usage')}</h2>
            </header>
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
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.server')}</h2>
            </header>
            <dl className="kv">
              <div><dt>{t('svc.hostname')}</dt><dd className="serial"><bdi>{svc.server}</bdi></dd></div>
              <div><dt>{t('svc.ip')}</dt><dd className="serial"><bdi>{svc.ip}</bdi></dd></div>
              <div><dt>{t('account.since')}</dt><dd className="serial"><bdi>{svc.since}</bdi></dd></div>
              <div>
                <dt>{t('account.status')}</dt>
                <dd>
                  <span className={`tag tag--${svc.status === 'active' ? 'ok' : 'taken'}`}>
                    {t(`status.${svc.status}` as never)}
                  </span>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.billing')}</h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(svc.amountUsdMinor)}</span>
              <span className="figure__unit">{t(`cycle.${svc.cycle}` as never)}</span>
            </p>
            <dl className="kv">
              <div><dt>{t('account.nextdue')}</dt><dd className="serial"><bdi>{svc.nextDue}</bdi></dd></div>
            </dl>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.manage')}</h2>
            </header>
            <div className="acts">
              <Link className="btn btn--md btn--secondary" to={`/account/services/${svc.id}/upgrade`}>
                {t('svc.upgrade')}
              </Link>
              <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
                <IconSupport size={15} />
                {t('svc.support')}
              </Link>
              {/* Cancellation is a request, not a button that ends the service instantly —
                  and it is set apart so it is never the one you meant to hit. */}
              <div className="acts__sep">
                <Link className="btn btn--md btn--danger" to={`/account/services/${svc.id}/cancel`}>
                  {t('svc.cancel')}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}
