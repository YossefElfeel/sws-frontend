import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Tag, DOMAIN_TONE } from '../../components/Tag';
import { Button } from '../../components/Button';
import { IconArrow, IconPlus, IconTrash, IconGlobe } from '../../components/icons';
import { TableToolbar, TableFilter, matches } from '../../components/TableToolbar';
import { useLocale } from '../../lib/locale';
import { useSaved, SavedNote } from '../../lib/saved';
import { DOMAINS, DNS_RECORDS } from '../../lib/account';

/** The states a domain can be in. Expiring is the one anyone filters to. */
const DOMAIN_STATUSES = ['all', 'active', 'expiring', 'expired'] as const;

/** My Domains — spec 9.3: name, expiry, status, quick renew. */
export function MyDomains() {
  const { t } = useLocale();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<(typeof DOMAIN_STATUSES)[number]>('all');

  // A domain is its own name, so the search is mostly one field; the two dates are here
  // because "what expires in 2026" is the other question this list gets asked.
  const rows = DOMAINS.filter(
    (d) =>
      (status === 'all' || d.status === status) && matches(q, d.name, d.registered, d.expires),
  );

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
      <TableToolbar
        value={q}
        onChange={setQ}
        label={t('search.domains')}
        shown={rows.length}
        total={DOMAINS.length}
      >
        <TableFilter
          label={t('account.status')}
          value={status}
          onChange={setStatus}
          options={DOMAIN_STATUSES.map((s) => ({
            value: s,
            label: t(s === 'all' ? 'filter.allStatuses' : (`dom.${s}` as never)),
          }))}
        />
      </TableToolbar>

      {rows.length > 0 ? (
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
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="lead serial"><bdi>{d.name}</bdi></span>
                  </td>
                  <td className="serial"><bdi>{d.registered}</bdi></td>
                  <td className="serial"><bdi>{d.expires}</bdi></td>
                  <td>
                    <Tag tone={DOMAIN_TONE[d.status]}>{t(`dom.${d.status}` as never)}</Tag>
                  </td>
                  <td className="num">
                    <span className="row-actions">
                      <Link className="btn btn--sm btn--primary" to={`/account/renew/${d.id}`}>
                        {t('dom.renew')}
                      </Link>
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
        /* Owning no domains and matching no search are different problems, so the empty
           state does not offer to sell a domain to someone who just mistyped one. */
        <div className="card empty">
          <IconGlobe size={28} />
          <p className="empty__title">
            {t(DOMAINS.length === 0 ? 'empty.domains' : 'empty.search')}
          </p>
          <p className="empty__note">
            {t(DOMAINS.length === 0 ? 'empty.domainsNote' : 'empty.searchNote')}
          </p>
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

  // Nameservers and DNS are lists you edit, so they are state rather than a fixture read
  // straight into inputs — an Add button that adds nothing is the clearest kind of broken.
  const [ns, setNs] = useState<string[]>(dom?.nameservers ?? []);
  const [records, setRecords] = useState(DNS_RECORDS);
  const [dnsQ, setDnsQ] = useState('');
  const [dnsType, setDnsType] = useState('all');
  const [epp, setEpp] = useState(false);
  const { saved, mark, clear } = useSaved();

  // The record types actually present, not every type DNS defines: a filter offering SRV on a
  // zone with no SRV record is four clicks to an empty table.
  const dnsTypes = ['all', ...new Set(records.map((r) => r.type))];
  const dnsRows = records.filter(
    (r) => (dnsType === 'all' || r.type === dnsType) && matches(dnsQ, r.type, r.host, r.value),
  );

  if (!dom) return <Navigate to="/account/domains" replace />;

  return (
    <AccountLayout
      title={dom.name}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.domains'), to: '/account/domains' },
        { label: dom.name },
      ]}
      actions={
        <Link className="btn btn--md btn--primary" to={`/account/renew/${dom.id}`}>
          {t('dom.renew')}
        </Link>
      }
    >
      <SavedNote saved={saved} onDismiss={clear} />

      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dom.nameservers')}</h2>
            </header>
            <div className="form">
              {ns.map((host, i) => (
                <label className="field-label" key={i}>
                  <span className="eyebrow">
                    {t('dom.ns')} {i + 1}
                  </span>
                  <input
                    className="field serial"
                    dir="ltr"
                    value={host}
                    onChange={(e) =>
                      setNs((rows) => rows.map((r, j) => (j === i ? e.target.value : r)))
                    }
                  />
                </label>
              ))}
              <div className="form__foot">
                <Button size="md" onClick={() => mark()}>
                  {t('sec.save')}
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  disabled={ns.length >= 5}
                  onClick={() => setNs((rows) => [...rows, ''])}
                >
                  <IconPlus size={15} />
                  {t('dom.addNs')}
                </Button>
              </div>
            </div>
          </section>

          <section className="card card--flush">
            <header className="card__head card__head--flush">
              <h2 className="card__heading">{t('dom.dns')}</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  // The toolbar resets with the new row, or a zone filtered to MX would
                  // answer Add Record by appending an A record you cannot see.
                  setDnsQ('');
                  setDnsType('all');
                  setRecords((rows) => [
                    ...rows,
                    { id: `dns-new-${rows.length}`, type: 'A', host: '@', value: '', ttl: 3600 },
                  ]);
                }}
              >
                <IconPlus size={14} />
                {t('dom.addRecord')}
              </Button>
            </header>
            <TableToolbar
              inset
              value={dnsQ}
              onChange={setDnsQ}
              label={t('search.dns')}
              shown={dnsRows.length}
              total={records.length}
            >
              <TableFilter
                label={t('filter.recordType')}
                value={dnsType}
                onChange={setDnsType}
                options={dnsTypes.map((ty) => ({
                  value: ty,
                  label: ty === 'all' ? t('filter.allTypes') : ty,
                }))}
              />
            </TableToolbar>
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
                  {dnsRows.map((r) => (
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
                          onClick={() => setRecords((rows) => rows.filter((x) => x.id !== r.id))}
                        >
                          <IconTrash size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* A zone with records but none matching says so inside the card, so the Add
                Record button stays where it was rather than jumping up the page. */}
            {dnsRows.length === 0 && (
              <div className="empty empty--inset">
                <p className="empty__title">{t(dnsQ.trim() ? 'empty.search' : 'empty.dns')}</p>
                <p className="empty__note">{t(dnsQ.trim() ? 'empty.searchNote' : 'empty.filter')}</p>
              </div>
            )}
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
                  <Tag tone={DOMAIN_TONE[dom.status]}>{t(`dom.${dom.status}` as never)}</Tag>
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
                <Button
                  size="md"
                  variant="danger"
                  disabled={lock}
                  onClick={() => setEpp(true)}
                >
                  {t('dom.transferOut')}
                </Button>
                {lock && <p className="form__note">{t('dom.lockedNote')}</p>}

                {/* Transferring out means handing the EPP code to the gaining registrar, so
                    the code is what the button produces. Refusing to show it is how registrars
                    make leaving hard, and this product is claiming not to do that. */}
                {epp && !lock && (
                  <div className="u-mt-16">
                    <p className="ref__label">{t('dom.epp')}</p>
                    <p className="ref__code serial">
                      <bdi>SWS-EPP-4417</bdi>
                    </p>
                    <p className="form__note">{t('dom.eppNote')}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}
