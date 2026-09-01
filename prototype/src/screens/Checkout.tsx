import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { useLocale } from '../lib/locale';
import { useCart } from '../lib/cart';
import { PAYMENT_METHODS, formatAmount } from '../lib/catalog';

/**
 * Checkout.
 *
 * The payment methods listed here are the ones a customer can actually pay with. The live
 * footer advertises PayPal and cryptocurrency, neither of which exists in any flow; showing a
 * method that cannot take money is a trust failure at the one moment trust is being asked for.
 */
export function Checkout() {
  const { t, locale } = useLocale();
  const { lines, currency, subtotal, vat, total } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState<string>('card');

  return (
    <Layout>
      <section className="page-head shell" aria-labelledby="pay-head">
        <h1 className="page-title" id="pay-head">
          {t('checkout.title')}
        </h1>
      </section>

      <section className="section shell">
        <form
            className="checkout"
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/confirmation');
            }}
          >
            <div className="checkout__main">
              <fieldset className="fieldset">
                <legend>{t('checkout.billing')}</legend>

                <div className="field-grid">
                  <label className="field-label">
                    <span className="eyebrow">{t('checkout.name')}</span>
                    <input className="field" type="text" name="name" autoComplete="name" required />
                  </label>
                  <label className="field-label">
                    <span className="eyebrow">{t('checkout.email')}</span>
                    <input className="field" type="email" name="email" autoComplete="email" dir="ltr" required />
                  </label>
                  <label className="field-label">
                    <span className="eyebrow">{t('checkout.phone')}</span>
                    <input className="field" type="tel" name="phone" autoComplete="tel" dir="ltr" required />
                  </label>
                  <label className="field-label">
                    <span className="eyebrow">{t('checkout.country')}</span>
                    <select className="field" name="country" defaultValue="EG">
                      <option value="EG">مصر · Egypt</option>
                      <option value="CH">سويسرا · Switzerland</option>
                      <option value="SA">السعودية · Saudi Arabia</option>
                      <option value="AE">الإمارات · United Arab Emirates</option>
                      <option value="DE">ألمانيا · Germany</option>
                    </select>
                  </label>
                </div>
              </fieldset>

              <fieldset className="fieldset">
                <legend>{t('checkout.method')}</legend>

                <div className="methods">
                  {PAYMENT_METHODS.map((m) => (
                      <label
                        key={m.id} className={`method${method === m.id ? ' is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="method"
                          value={m.id}
                          checked={method === m.id}
                          onChange={() => setMethod(m.id)}
                        />
                        <span className="method__label">{t(m.labelKey)}</span>
                      </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* The order summary travels with the form, so the figure is never out of sight. */}
            <aside className="checkout__aside" aria-labelledby="sum-head">
              <h2 className="card__title" id="sum-head">
                {t('checkout.summary')}
              </h2>

              <div className="summary">
                {lines.map((line) => (
                  <p key={line.serial} className="summary__line">
                    <span>{line.plan.name}</span>
                    <span className="serial">
                      {formatAmount(line.plan.price[currency].monthly, locale)}
                    </span>
                  </p>
                ))}
              </div>

              <dl className="totals">
                <div className="totals__row">
                  <dt>{t('cart.subtotal')}</dt>
                  <dd>{formatAmount(subtotal, locale)}</dd>
                </div>
                <div className="totals__row">
                  <dt>{t('cart.vat')}</dt>
                  <dd>{formatAmount(vat, locale)}</dd>
                </div>
                <div className="totals__row totals__row--grand">
                  <dt>{t('cart.due')}</dt>
                  <dd>
                    {formatAmount(total, locale)} {currency}
                  </dd>
                </div>
              </dl>

              <Button size="lg" type="submit" disabled={lines.length === 0}>
                {t('action.checkout')}
              </Button>
            </aside>
        </form>
      </section>
    </Layout>
  );
}
