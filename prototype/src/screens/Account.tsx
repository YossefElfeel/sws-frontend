import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { IconCheck, IconInfo } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { formatAmount } from '../lib/catalog';

/**
 * The account area.
 *
 * This is where the design system earns its existence. The marketing pages and the account
 * pages are one product in one language — same header, same type, same indigo, same tables.
 * The move between them is the moment the build plan names as where trust is lost, and it is
 * only survivable if the two halves read as one company.
 */

const SERVICES = [
  { serial: 'SWS-20260714-0431-BUS', plan: 'Business', domain: 'atelier-kamal.com', days: 49, amount: 69000 },
  { serial: 'SWS-20251102-2287-SIN', plan: 'Single', domain: 'nadia-shafik.eg', days: 303, amount: 25000 },
];

const INVOICES = [
  { no: 'INV-20260901-4417', date: '2026-09-01', amount: 78660, paid: false },
  { no: 'INV-20260801-4310', date: '2026-08-01', amount: 78660, paid: true },
  { no: 'INV-20260701-4188', date: '2026-07-01', amount: 78660, paid: true },
  { no: 'INV-20260601-4062', date: '2026-06-01', amount: 28500, paid: true },
];

export function Account() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();

  return (
    <Layout>
      <section className="page-head shell" aria-labelledby="acc-head">
        <h1 className="page-title" id="acc-head">
          {t('account.title')}
        </h1>
      </section>

      <section className="section shell" aria-labelledby="svc-head">
        <div className="section__head">
          <h2 className="section__title" id="svc-head">
            {t('account.services')}
          </h2>
        </div>

        <div className="panel table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('col.item')}</th>
                <th scope="col">{t('account.since')}</th>
                <th scope="col" className="num">
                  {t('col.amount')}
                </th>
                <th scope="col">{t('account.status')}</th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s) => (
                <tr key={s.serial}>
                  <td>
                    <span className="lead">{s.plan}</span>
                    <span className="data__sub serial"><bdi>{s.domain} · {s.serial}</bdi></span>
                  </td>
                  {/*
                    Days running, as a plain count. An uptime percentage would be a claim
                    nobody has verified; the number of days a service has been up is a fact
                    the system already holds.
                  */}
                  <td>
                    <span className="serial">{s.days}</span> {t('account.days')}
                  </td>
                  <td className="num">
                    {formatAmount(s.amount, locale)} {currency}
                  </td>
                  <td>
                    <span className="tag tag--ok">
                      <IconCheck size={13} />
                      {t('account.active')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section shell" aria-labelledby="inv-head">
        <div className="section__head">
          <h2 className="section__title" id="inv-head">
            {t('account.invoices')}
          </h2>
        </div>

        <div className="panel table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('account.invoice')}</th>
                <th scope="col">{t('account.date')}</th>
                <th scope="col" className="num">
                  {t('col.amount')}
                </th>
                <th scope="col">{t('account.status')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.no}>
                  <td>
                    <span className="lead serial"><bdi>{inv.no}</bdi></span>
                  </td>
                  <td className="serial"><bdi>{inv.date}</bdi></td>
                  <td className="num">
                    {formatAmount(inv.amount, locale)} {currency}
                  </td>
                  <td>
                    <span className={`tag${inv.paid ? ' tag--ok' : ' tag--due'}`}>
                      {inv.paid ? <IconCheck size={13} /> : <IconInfo size={13} />}
                      {t(inv.paid ? 'account.paid' : 'account.unpaid')}
                    </span>
                  </td>
                  <td className="num">
                    {!inv.paid && <Button size="sm">{t('account.pay')}</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}
