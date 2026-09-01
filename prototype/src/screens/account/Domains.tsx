import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconArrow, IconPlus, IconTrash } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { DOMAINS, DNS_RECORDS } from '../../lib/account';

/** My Domains — spec 9.3: name, expiry, status, quick renew. */
export function MyDomains() {
  const { t } = useLocale();

  return (
    <AccountLayout title={t('acc.domains')}>
      <div className="panel table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">{t('col.item')}</th>
              <th scope="col">{t('dom.registered')}</th>
              <th scope="col">{t('dom.expires')}</th>
              <th scope="col">{t('account.status')}</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {DOMAINS.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className="lead serial" dir="ltr">{d.name}</span>
                </td>
                <td className="serial" dir="ltr">{d.registered}</td>
                <td className="serial" dir="ltr">{d.expires}</td>
                <td>
                  <span className={`tag tag--${d.status === 'active' ? 'ok' : 'due'}`}>
                    {t(`dom.${d.status}` as never)}
                  </span>
                </td>
                <td className="num">
                  <span className="row-actions">
                    <Button size="sm">{t('dom.renew')}</Button>
                    <Link className="btn btn--sm btn--secondary" to={`/account/domains/${d.id}`}>
                      {t('svc.manage')}
                      <IconArrow size={14} />
                    </Link>
                  </span>
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
 * Domain management — spec 9.3: nameservers, DNS records, WHOIS privacy, registrar lock and
 * transfer out.
 *
 * Registrar lock and transfer-out sit together on purpose: the lock is the thing that blocks
 * the transfer, so putting them apart would leave someone toggling one without seeing why the
 * other is refused.
 */
export function DomainManage() {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const dom = DOMAINS.find((d) => d.id === id);

  const [privacy, setPrivacy] = useState(dom?.whoisPrivacy ?? false);
  const [lock, setLock] = useState(dom?.registrarLock ?? false);

  if (!dom) return <Navigate to="/account/domains" replace />;

  return (
    <AccountLayout
      title={dom.name}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.domains'), to: '/account/domains' },
        { label: dom.name },
      ]}
    >
      <div className="split">
        <div className="panel panel--pad">
          <h2 className="card__title">{t('dom.nameservers')}</h2>
          <div className="stack">
            {dom.nameservers.map((ns, i) => (
              <label className="field-label" key={ns}>
                <span className="eyebrow">
                  {t('dom.ns')} {i + 1}
                </span>
                <input className="field serial" dir="ltr" defaultValue={ns} />
              </label>
            ))}
            <Button size="md" variant="secondary">
              <IconPlus size={15} />
              {t('dom.addNs')}
            </Button>
          </div>
        </div>

        <div className="panel panel--pad">
          <h2 className="card__title">{t('dom.protection')}</h2>
          <div className="stack">
            <label className="switch-row">
              <span>
                <span className="switch-row__label">{t('dom.privacy')}</span>
                <span className="switch-row__note">{t('dom.privacyNote')}</span>
              </span>
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
              />
            </label>

            <label className="switch-row">
              <span>
                <span className="switch-row__label">{t('dom.lock')}</span>
                <span className="switch-row__note">{t('dom.lockNote')}</span>
              </span>
              <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />
            </label>

            {/* Transfer out is only possible with the lock off, so the state is explained here. */}
            <Button size="md" variant="quiet" disabled={lock}>
              {t('dom.transferOut')}
            </Button>
            {lock && <p className="hint">{t('dom.lockedNote')}</p>}
          </div>
        </div>
      </div>

      <h2 className="section__title section__title--sm">{t('dom.dns')}</h2>
      <div className="panel table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">{t('dom.type')}</th>
              <th scope="col">{t('dom.host')}</th>
              <th scope="col">{t('dom.value')}</th>
              <th scope="col" className="num">TTL</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {DNS_RECORDS.map((r) => (
              <tr key={r.id}>
                <td><span className="lead serial">{r.type}</span></td>
                <td className="serial" dir="ltr">{r.host}</td>
                <td className="serial" dir="ltr">{r.value}</td>
                <td className="num">{r.ttl}</td>
                <td className="num">
                  <Button size="sm" variant="quiet" aria-label={`${t('action.remove')} ${r.type} ${r.host}`}>
                    <IconTrash size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions actions--split">
        <Button size="md" variant="secondary">
          <IconPlus size={15} />
          {t('dom.addRecord')}
        </Button>
      </div>
    </AccountLayout>
  );
}
