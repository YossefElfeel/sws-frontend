import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { IconServer, IconGlobe, IconInvoice, IconSupport, IconArrow } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount } from '../../lib/catalog';
import { SERVICES, DOMAINS, INVOICES, TICKETS, ANNOUNCEMENTS, ACCOUNT } from '../../lib/account';

/**
 * Dashboard — spec 9.1: a greeting, a quick count of what matters, shortcut cards, and the
 * latest announcements.
 *
 * The counts are the four the spec names, and each is a link rather than a statistic, because
 * the reason to show "2 unpaid invoices" is to let someone go and pay them.
 */
export function Dashboard() {
  const { t, locale, bi } = useLocale();
  const { currency } = usePrefs();

  const unpaid = INVOICES.filter((i) => i.status === 'unpaid' || i.status === 'overdue');
  const openTickets = TICKETS.filter((x) => x.status !== 'closed');
  const dueTotal = unpaid.reduce((s, i) => s + i.totalUsdMinor, 0);

  const tiles = [
    { to: '/account/services', icon: <IconServer size={22} />, n: SERVICES.length, key: 'acc.services' },
    { to: '/account/domains', icon: <IconGlobe size={22} />, n: DOMAINS.length, key: 'acc.domains' },
    { to: '/account/invoices', icon: <IconInvoice size={22} />, n: unpaid.length, key: 'dash.unpaid' },
    { to: '/account/tickets', icon: <IconSupport size={22} />, n: openTickets.length, key: 'dash.openTickets' },
  ];

  return (
    <AccountLayout title={`${t('dash.hello')} ${bi(ACCOUNT.name).split(' ')[0]}`} lede={t('dash.lede')}>
      <ul className="tiles">
        {tiles.map((tile) => (
          <li key={tile.to}>
            <Link className="tile" to={tile.to}>
              <span className="tile__icon" aria-hidden="true">
                {tile.icon}
              </span>
              <span className="tile__n serial">{tile.n}</span>
              <span className="tile__label">{t(tile.key as never)}</span>
            </Link>
          </li>
        ))}
      </ul>

      {unpaid.length > 0 && (
        <div className="notice notice--due">
          <IconInvoice size={22} />
          <div>
            <p>
              {t('dash.dueNote')}{' '}
              <strong className="serial">
                {formatAmount(convert(dueTotal, currency), locale)} {currency}
              </strong>
            </p>
            <Link className="btn btn--sm btn--primary" to="/account/invoices">
              {t('account.pay')}
            </Link>
          </div>
        </div>
      )}

      <h2 className="section__title section__title--sm">{t('acc.services')}</h2>
      <div className="panel table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">{t('col.item')}</th>
              <th scope="col">{t('account.nextdue')}</th>
              <th scope="col">{t('account.status')}</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {SERVICES.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="lead">{s.product}</span>
                  <span className="data__sub serial" dir="ltr">
                    {s.domain}
                  </span>
                </td>
                <td className="serial" dir="ltr">
                  {s.nextDue}
                </td>
                <td>
                  <span className={`tag tag--${s.status === 'active' ? 'ok' : 'taken'}`}>
                    {t(`status.${s.status}` as never)}
                  </span>
                </td>
                <td className="num">
                  <Link
                    className="btn btn--sm btn--secondary"
                    to={`/account/services/${s.id}`}
                    aria-label={`${t('svc.manage')} — ${s.product}`}
                  >
                    <IconArrow size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section__title section__title--sm">{t('acc.news')}</h2>
      <ul className="news panel panel--pad">
        {ANNOUNCEMENTS.map((n) => (
          <li className="news__item" key={n.id}>
            <p className="news__date serial" dir="ltr">
              {n.date}
            </p>
            <h3 className="card__title">{t(n.titleKey as never)}</h3>
            <p className="card__body">{t(n.bodyKey as never)}</p>
          </li>
        ))}
      </ul>
    </AccountLayout>
  );
}
