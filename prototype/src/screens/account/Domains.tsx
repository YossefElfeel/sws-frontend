import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { IconArrow, IconPlus, IconGlobe } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { useAccountState } from '../../lib/accountState';

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
      {domains.length > 0 ? (
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
              {domains.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="lead serial"><bdi>{d.name}</bdi></span>
                  </td>
                  <td className="serial"><bdi>{d.registered}</bdi></td>
                  <td className="serial"><bdi>{d.expires}</bdi></td>
                  <td>
                    <span className={`tag tag--${d.autoRenew ? 'ok' : 'taken'}`}>
                      {t(d.autoRenew ? 'dom.on' : 'dom.off')}
                    </span>
                  </td>
                  <td>
                    <span className={`tag tag--${d.status === 'active' ? 'ok' : 'due'}`}>
                      {t(`dom.${d.status}` as never)}
                    </span>
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
        <div className="card empty">
          <IconGlobe size={28} />
          <p className="empty__title">{t('empty.domains')}</p>
          <p className="empty__note">{t('empty.domainsNote')}</p>
        </div>
      )}
    </AccountLayout>
  );
}
