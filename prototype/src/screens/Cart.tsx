import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { IconTrash, IconArrow, IconSearch } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { formatAmount } from '../lib/catalog';

/**
 * Cart — spec 7.1.
 *
 * Line items with cycle, price and a remove control; a promo field with its own apply button;
 * and a totals block that shows subtotal, discount and tax as separate lines rather than
 * folding them into one figure.
 */
export function Cart() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { lines, remove, applyPromo, promo, subtotal, discount, tax, total, lineTotal } = useCart();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [promoState, setPromoState] = useState<'idle' | 'ok' | 'bad'>('idle');

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t('cart.review')}</h1>
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
          <div className="checkout">
            <div className="checkout__main">
              <div className="table-scroll">
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
                      <tr key={line.id}>
                        <td>
                          <span className="lead">{line.plan.name}</span>
                          {line.domain?.name && (
                            <span className="data__sub serial">
                              <bdi>{line.domain.name}</bdi>
                            </span>
                          )}
                        </td>
                        <td>{t(`cycle.${line.cycle}` as never)}</td>
                        <td className="num">
                          {formatAmount(lineTotal(line), locale)} {currency}
                        </td>
                        <td className="num">
                          <Button
                            size="sm"
                            variant="quiet"
                            onClick={() => remove(line.id)}
                            aria-label={`${t('action.remove')} — ${line.plan.name}`}
                          >
                            <IconTrash size={15} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Spec 7.1: promo field with its own apply button. */}
              <div className="promo">
                <h2 className="card__title">{t('cart.promo')}</h2>
                <form
                  className="promo__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPromoState(applyPromo(code) ? 'ok' : 'bad');
                  }}
                >
                  <label className="u-visually-hidden" htmlFor="promo">
                    {t('cart.promo')}
                  </label>
                  <span className="promo__field">
                    <IconSearch size={16} />
                    <input
                      id="promo"
                      className="field"
                      type="text"
                      dir="ltr"
                      placeholder={t('cart.promoPlaceholder')}
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setPromoState('idle');
                      }}
                    />
                  </span>
                  <Button type="submit" size="md">
                    {t('cart.promoApply')}
                  </Button>
                </form>
                {promoState !== 'idle' && (
                  <p className={`promo__msg${promoState === 'ok' ? ' is-ok' : ' is-bad'}`} role="status">
                    {t(promoState === 'ok' ? 'cart.promoOk' : 'cart.promoBad')}
                  </p>
                )}
              </div>

              <div className="actions actions--split">
                <Link className="btn btn--md btn--quiet" to="/hosting">
                  {t('cart.continueShopping')}
                </Link>
              </div>
            </div>

            <aside className="checkout__aside" aria-labelledby="cart-sum">
              <h2 className="card__title" id="cart-sum">
                {t('checkout.summary')}
              </h2>

              <dl className="totals">
                <div className="totals__row">
                  <dt>{t('cart.subtotal')}</dt>
                  <dd>{formatAmount(subtotal, locale)}</dd>
                </div>
                {discount > 0 && (
                  <div className="totals__row totals__row--credit">
                    <dt>
                      {t('cart.discount')} <span className="serial">{promo}</span>
                    </dt>
                    <dd>−{formatAmount(discount, locale)}</dd>
                  </div>
                )}
                <div className="totals__row">
                  <dt>{t('cart.vat')}</dt>
                  <dd>{formatAmount(tax, locale)}</dd>
                </div>
                <div className="totals__row totals__row--grand">
                  <dt>{t('cart.due')}</dt>
                  <dd>
                    {formatAmount(total, locale)} {currency}
                  </dd>
                </div>
              </dl>

              <Button size="lg" onClick={() => navigate('/checkout')}>
                {t('action.checkout')}
                <IconArrow size={17} />
              </Button>
            </aside>
          </div>
        )}
      </section>
    </Layout>
  );
}
