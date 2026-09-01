import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useLocale } from '../lib/locale';
import { useCart } from '../lib/cart';
import { formatAmount } from '../lib/catalog';

/**
 * Cart.
 *
 * VAT is its own line rather than folded into the price. A total that appears from nowhere at
 * the last step is the thing this product exists to refuse.
 */
export function Cart() {
  const { t, locale } = useLocale();
  const { lines, currency, cycle, remove, subtotal, vat, total } = useCart();
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="page-head shell" aria-labelledby="cart-head">
        <h1 className="page-title" id="cart-head">
          {t('cart.title')}
        </h1>
      </section>

      <section className="section shell">
        {lines.length === 0 ? (
          <div className="empty">
            <p className="empty__line">{t('cart.empty')}</p>
            <Link className="btn btn--lg btn--primary" to="/hosting">
              {t('cart.empty.cta')}
            </Link>
          </div>
        ) : (
          <>
            <div className="panel table-scroll">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">{t('col.item')}</th>
                    <th scope="col">{t('col.term')}</th>
                    <th scope="col" className="num">
                      {t('col.amount')}
                    </th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.serial}>
                      <td>
                        <span className="lead">{line.plan.name}</span>
                        <span className="data__sub serial" dir="ltr">
                          {line.serial}
                        </span>
                      </td>
                      <td>{t(cycle === 'monthly' ? 'cycle.monthly' : 'cycle.annually')}</td>
                      <td className="num">
                        {formatAmount(line.plan.price[currency][cycle], locale)} {currency}
                      </td>
                      <td className="num">
                        <Button
                          size="sm"
                          variant="quiet"
                          onClick={() => remove(line.serial)}
                          aria-label={`${t('action.remove')} — ${line.plan.name}`}
                        >
                          {t('action.remove')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cart-total">
              <dl className="totals">
                <div className="totals__row">
                  <dt>{t('cart.subtotal')}</dt>
                  <dd>
                    {formatAmount(subtotal, locale)} {currency}
                  </dd>
                </div>
                <div className="totals__row">
                  <dt>{t('cart.vat')}</dt>
                  <dd>
                    {formatAmount(vat, locale)} {currency}
                  </dd>
                </div>
                <div className="totals__row totals__row--grand">
                  <dt>{t('cart.due')}</dt>
                  <dd>
                    {formatAmount(total, locale)} {currency}
                  </dd>
                </div>
              </dl>

              <Button size="lg" onClick={() => navigate('/checkout')}>
                {t('action.continue')}
              </Button>
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}
