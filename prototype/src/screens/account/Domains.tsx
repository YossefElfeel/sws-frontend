import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Tag, DOMAIN_TONE } from '../../components/Tag';
import { IconArrow, IconPlus, IconGlobe } from '../../components/icons';
import { TableToolbar, TableFilter, matches } from '../../components/TableToolbar';
import { useLocale } from '../../lib/locale';
import { useAccountState } from '../../lib/accountState';

/** The states a domain can be in. Expiring is the one anyone filters to. */
const DOMAIN_STATUSES = ['all', 'active', 'expiring', 'expired'] as const;

/**
 * My Domains — spec 9.3: name, expiry, status, quick renew.
 *
 * The list reads the editable store rather than the fixture, so a switch flipped on a domain
 * page shows in the Auto-renew column the moment you come back. The management pages
 * themselves are in DomainPages.tsx.
 */
export function MyDomains() {
  const { t } = useLocale();
  const { domains } = useAccountState();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<(typeof DOMAIN_STATUSES)[number]>('all');

  // A domain is its own name, so the search is mostly one field; the two dates are here
  // because "what expires in 2026" is the other question this list gets asked.
  const rows = domains.filter(
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
        total={domains.length}
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
                <th scope="col">{t('dom.autoRenew')}</th>
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
                    <Tag tone={d.autoRenew ? 'ok' : 'neutral'}>{t(d.autoRenew ? 'dom.on' : 'dom.off')}</Tag>
                  </td>
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
            {t(domains.length === 0 ? 'empty.domains' : 'empty.search')}
          </p>
          <p className="empty__note">
            {t(domains.length === 0 ? 'empty.domainsNote' : 'empty.searchNote')}
          </p>
        </div>
      )}
    </AccountLayout>
  );
}
