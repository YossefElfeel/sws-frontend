import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { IconCheck } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { formatAmount, statementSerial } from '../lib/catalog';

/**
 * Order confirmation — the customer's own leaf of the book.
 *
 * The serial shown here is the one that will appear on every invoice and in the account, so
 * the confirmation is not a receipt of a transaction that ended; it is the first page of a
 * relationship that continues.
 */
export function Confirmation() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { lines, total, lineTotal } = useCart();
  const serial = useMemo(() => statementSerial(new Date()), []);

  return (
    <Layout>
      <section className="page-head shell" aria-labelledby="ok-head">
        <span className="confirm-mark" aria-hidden="true">
          <IconCheck size={30} />
        </span>
        <h1 className="page-title" id="ok-head">
          {t('confirm.title')}
        </h1>
        <p className="section__lede measure">{t('confirm.lede')}</p>
        <p className="confirm-ref serial" dir="ltr">
          {serial}
        </p>
      </section>

      <section className="section shell">
        <div className="panel table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('col.item')}</th>
                <th scope="col">{t('col.term')}</th>
                <th scope="col" className="num">{t('col.amount')}</th>
                <th scope="col">{t('account.status')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <span className="lead">{line.plan.name}</span>
                    <span className="data__sub serial" dir="ltr">{line.domain?.name ?? line.id}</span>
                  </td>
                  <td>{t(`cycle.${line.cycle}` as never)}</td>
                  <td className="num">
                    {formatAmount(lineTotal(line), locale)} {currency}
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

        <div className="cart-total">
          <dl className="totals">
            <div className="totals__row totals__row--grand">
              <dt>{t('cart.total')}</dt>
              <dd>
                {formatAmount(total, locale)} {currency}
              </dd>
            </div>
          </dl>
          <Link className="btn btn--lg btn--primary" to="/account">
            {t('confirm.account')}
          </Link>
        </div>
      </section>
    </Layout>
  );
}
