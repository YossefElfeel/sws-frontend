import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { IconArrow, IconShield } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { gatewaysFor, formatAmount } from '../lib/catalog';

/**
 * Checkout — spec 7.3 and 11.
 *
 * The gateway list is exactly the five the spec names, in its order, and "Card & Mobile
 * Wallet" disappears when the selected currency is not EGP — the spec ties that to the same
 * currency logic as the rest of the site rather than to a separate setting. Card fields only
 * appear for the card gateways; the others would show transfer instructions instead, which is
 * why the panel is conditional rather than always present.
 */
export function Checkout() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { lines, subtotal, discount, tax, total, lineTotal } = useCart();
  const navigate = useNavigate();

  const gateways = gatewaysFor(currency);
  const [method, setMethod] = useState(gateways[0]?.id ?? 'stripe-card');
  const [agreed, setAgreed] = useState(false);

  // If the currency moves away from EGP while the wallet gateway is selected, that option no
  // longer exists — fall back rather than submitting against a gateway that is off screen.
  useEffect(() => {
    if (!gateways.some((g) => g.id === method)) setMethod(gateways[0]?.id ?? 'stripe-card');
  }, [gateways, method]);

  const showsCardFields = method === 'stripe-card' || method === 'wallet-egp';

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t('checkout.title')}</h1>
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
                    <option value="KW">الكويت · Kuwait</option>
                    <option value="DE">ألمانيا · Germany</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>{t('checkout.method')}</legend>
              <ul className="methods">
                {gateways.map((g) => (
                  <li key={g.id}>
                    <label className={`method${method === g.id ? ' is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="method"
                        value={g.id}
                        checked={method === g.id}
                        onChange={() => setMethod(g.id)}
                      />
                      <span className="method__label">{t(g.labelKey as never)}</span>
                      <span className="method__marks" aria-hidden="true">
                        {g.marks.map((m) => (
                          <span className="mark" key={m}>
                            {m}
                          </span>
                        ))}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {currency !== 'EGP' && <p className="hint">{t('pay.walletNote')}</p>}
            </fieldset>

            {showsCardFields && (
              <fieldset className="fieldset">
                <legend>{t('pay.details')}</legend>
                <p className="secure-note">
                  <IconShield size={16} />
                  {t('pay.secure')}
                </p>
                <div className="field-grid field-grid--card">
                  <label className="field-label">
                    <span className="eyebrow">{t('pay.cardNumber')}</span>
                    <input className="field" inputMode="numeric" dir="ltr" placeholder="1234 1234 1234 1234" />
                  </label>
                  <label className="field-label">
                    <span className="eyebrow">{t('pay.expiry')}</span>
                    <input className="field" inputMode="numeric" dir="ltr" placeholder="MM / YY" />
                  </label>
                  <label className="field-label">
                    <span className="eyebrow">{t('pay.cvv')}</span>
                    <input className="field" inputMode="numeric" dir="ltr" placeholder="CVC" />
                  </label>
                </div>
              </fieldset>
            )}
          </div>

          <aside className="checkout__aside" aria-labelledby="sum-head">
            <h2 className="card__title" id="sum-head">
              {t('checkout.summary')}
            </h2>

            <div className="summary">
              {lines.map((line) => (
                <p className="summary__line" key={line.id}>
                  <span>
                    {line.plan.name}
                    <span className="summary__sub">{t(`cycle.${line.cycle}` as never)}</span>
                  </span>
                  <span className="serial">{formatAmount(lineTotal(line), locale)}</span>
                </p>
              ))}
            </div>

            <dl className="totals">
              <div className="totals__row">
                <dt>{t('cart.subtotal')}</dt>
                <dd>{formatAmount(subtotal, locale)}</dd>
              </div>
              {discount > 0 && (
                <div className="totals__row totals__row--credit">
                  <dt>{t('cart.discount')}</dt>
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

            {/* Spec 7.3: agreement is required before the pay button becomes active. */}
            <label className="agree">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>{t('cart.terms')}</span>
            </label>

            <Button size="lg" type="submit" disabled={!agreed || lines.length === 0}>
              {t('cart.placeOrder')}
              <IconArrow size={17} />
            </Button>
          </aside>
        </form>
      </section>
    </Layout>
  );
}
