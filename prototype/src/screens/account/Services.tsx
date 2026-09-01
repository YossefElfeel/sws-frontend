import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconArrow, IconExternal } from '../../components/icons';
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
    <AccountLayout title={t('acc.services')}>
      <div className="toolbar">
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
      </div>

      <div className="panel table-scroll">
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
                  <span className="data__sub serial" dir="ltr">{s.domain}</span>
                </td>
                <td>{t(`cycle.${s.cycle}` as never)}</td>
                <td className="serial" dir="ltr">{s.nextDue}</td>
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
    </AccountLayout>
  );
}

/**
 * Service details — spec 9.2: server information, a direct cPanel login, billing details,
 * upgrade/downgrade, cancellation, and related support.
 *
 * Usage is shown as a used-of-total bar rather than a percentage, because the number someone
 * needs before buying more storage is how much is left, not what share is gone.
 */
export function ServiceDetail() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const svc = SERVICES.find((s) => s.id === id);

  if (!svc) return <Navigate to="/account/services" replace />;

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
    >
      <div className="split">
        <div className="panel panel--pad">
          <h2 className="card__title">{t('svc.server')}</h2>
          <dl className="kv">
            <div><dt>{t('svc.hostname')}</dt><dd className="serial" dir="ltr">{svc.server}</dd></div>
            <div><dt>{t('svc.ip')}</dt><dd className="serial" dir="ltr">{svc.ip}</dd></div>
            <div><dt>{t('account.since')}</dt><dd className="serial" dir="ltr">{svc.since}</dd></div>
            <div><dt>{t('account.status')}</dt><dd><span className="tag tag--ok">{t(`status.${svc.status}` as never)}</span></dd></div>
          </dl>

          {bars.map((b) => (
            <div className="meter" key={b.key}>
              <p className="meter__head">
                <span>{t(b.key as never)}</span>
                <span className="serial">
                  {b.used} / {b.total} {b.unit}
                </span>
              </p>
              <span
                className="meter__track"
                role="img"
                aria-label={`${t(b.key as never)}: ${b.used} of ${b.total} ${b.unit}`}
              >
                <span
                  className="meter__fill"
                  style={{ inlineSize: `${Math.min(100, (b.used / b.total) * 100)}%` }}
                />
              </span>
            </div>
          ))}

          <Button size="lg">
            <IconExternal size={17} />
            {t('svc.cpanel')}
          </Button>
        </div>

        <div className="panel panel--pad">
          <h2 className="card__title">{t('svc.billing')}</h2>
          <dl className="kv">
            <div><dt>{t('col.term')}</dt><dd>{t(`cycle.${svc.cycle}` as never)}</dd></div>
            <div><dt>{t('col.amount')}</dt><dd className="serial">{formatAmount(convert(svc.amountUsdMinor, currency), locale)} {currency}</dd></div>
            <div><dt>{t('account.nextdue')}</dt><dd className="serial" dir="ltr">{svc.nextDue}</dd></div>
          </dl>

          <div className="stack">
            <Button size="md" variant="secondary">{t('svc.upgrade')}</Button>
            <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
              {t('svc.support')}
            </Link>
            {/* Cancellation is a request, not a button that ends the service instantly. */}
            <Button size="md" variant="quiet">{t('svc.cancel')}</Button>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
