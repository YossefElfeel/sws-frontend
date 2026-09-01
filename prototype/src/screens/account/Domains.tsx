import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconArrow, IconPlus, IconTrash, IconGlobe } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { DOMAINS, DNS_RECORDS } from '../../lib/account';

/** My Domains — spec 9.3: name, expiry, status, quick renew. */
export function MyDomains() {
  const { t } = useLocale();

  return (
    <AccountLayout
      title={t('acc.domains')}
      actions={
        <>
          <Link className="btn btn--md btn--secondary" to="/transfer">
            {t('rail.transfer')}
          </Link>
          <Link className="btn btn--md btn--primary" to="/domains">
            <IconPlus size={15} />
            {t('rail.register')}
          </Link>
        </>
      }
    >
      {DOMAINS.length > 0 ? (
        <div className="card card--flush table-scroll">
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
                    <span className="lead serial"><bdi>{d.name}</bdi></span>
                  </td>
                  <td className="serial"><bdi>{d.registered}</bdi></td>
                  <td className="serial"><bdi>{d.expires}</bdi></td>
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
      ) : (
        <div className="card empty">
          <IconGlobe size={28} />
          <p className="empty__title">{t('empty.domains')}</p>
          <p className="empty__note">{t('empty.domainsNote')}</p>
        </div>
      )}
    </AccountLayout>
  );
}

/**
 * Domain management — spec 9.3: nameservers, DNS records, WHOIS privacy, registrar lock and
 * transfer out.
 *
 * Registrar lock and transfer-out sit together on purpose: the lock is the thing that blocks
 * the transfer, so putting them apart would leave someone toggling one without seeing why the
 * other is refused. DNS is the long table and gets the main column; the switches are short and
 * belong beside it rather than under it.
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
      actions={<Button size="md">{t('dom.renew')}</Button>}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dom.nameservers')}</h2>
            </header>
            <div className="form">
              {dom.nameservers.map((ns, i) => (
                <label className="field-label" key={ns}>
                  <span className="eyebrow">
                    {t('dom.ns')} {i + 1}
                  </span>
                  <input className="field serial" dir="ltr" defaultValue={ns} />
                </label>
              ))}
              <div className="form__foot">
                <Button size="md">{t('sec.save')}</Button>
                <Button size="md" variant="secondary">
                  <IconPlus size={15} />
                  {t('dom.addNs')}
                </Button>
              </div>
            </div>
          </section>

          <section className="card card--flush">
            <header className="card__head card__head--flush">
              <h2 className="card__heading">{t('dom.dns')}</h2>
              <Button size="sm" variant="secondary">
                <IconPlus size={14} />
                {t('dom.addRecord')}
              </Button>
            </header>
            <div className="table-scroll">
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
                      <td className="serial"><bdi>{r.host}</bdi></td>
                      <td className="serial"><bdi>{r.value}</bdi></td>
                      <td className="num">{r.ttl}</td>
                      <td className="num">
                        <Button
                          size="sm"
                          variant="danger"
                          aria-label={`${t('action.remove')} ${r.type} ${r.host}`}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dom.registration')}</h2>
            </header>
            <dl className="kv">
              <div><dt>{t('dom.registered')}</dt><dd className="serial"><bdi>{dom.registered}</bdi></dd></div>
              <div><dt>{t('dom.expires')}</dt><dd className="serial"><bdi>{dom.expires}</bdi></dd></div>
              <div>
                <dt>{t('account.status')}</dt>
                <dd>
                  <span className={`tag tag--${dom.status === 'active' ? 'ok' : 'due'}`}>
                    {t(`dom.${dom.status}` as never)}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dom.protection')}</h2>
            </header>
            <div className="form">
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

              {/* Transfer out is only possible with the lock off, so the state is explained
                  right here rather than left as a button that silently refuses. */}
              <div className="acts__sep">
                <Button size="md" variant="danger" disabled={lock}>
                  {t('dom.transferOut')}
                </Button>
                {lock && <p className="form__note">{t('dom.lockedNote')}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}
