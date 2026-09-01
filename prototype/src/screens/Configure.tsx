import { useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { IconArrow } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart, defaultAddons } from '../lib/cart';
import {
  PLANS,
  ADDONS,
  CYCLES,
  CYCLE_META,
  TAX_RATE,
  convert,
  planPrice,
  formatAmount,
  type Cycle,
} from '../lib/catalog';

/**
 * Configure Product — spec 7.2.
 *
 * Three things the spec is specific about and that are easy to get wrong:
 *   1. Six billing cycles, each showing the saving against paying monthly, with the discount
 *      shown on the longer options.
 *   2. Add-on groups with a radio per option and the price beside it.
 *   3. A summary box that stays in view and updates on every choice — the reason someone can
 *      pick add-ons without losing track of what they are about to pay.
 */
export function Configure() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { add } = useCart();
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();

  const plan = PLANS.find((p) => p.id === planId);
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [addons, setAddons] = useState<Record<string, string>>(defaultAddons);

  const totals = useMemo(() => {
    if (!plan) return { base: 0, extras: [] as { label: string; amount: number }[], sub: 0, tax: 0, due: 0 };
    const base = planPrice(plan, cycle, currency);
    const extras = ADDONS.flatMap((g) => {
      const chosen = g.options.find((o) => o.id === addons[g.id]);
      if (!chosen || chosen.id === 'none') return [];
      return [{ label: `${t(g.titleKey as never)} — ${chosen.label}`, amount: convert(chosen.priceUsdMinor, currency) }];
    });
    const sub = base + extras.reduce((s, e) => s + e.amount, 0);
    const tax = Math.round(sub * TAX_RATE);
    return { base, extras, sub, tax, due: sub + tax };
  }, [plan, cycle, addons, currency, t]);

  if (!plan) return <Navigate to="/hosting" replace />;

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t('configure.title')}</h1>
      </section>

      <section className="section shell">
        <div className="checkout">
          <div className="checkout__main">
            {/* What is being configured, restated so the choices below have a subject. */}
            <div className="config-product">
              <h2 className="card__title">{plan.name}</h2>
              <ul className="config-product__specs">
                <li>
                  {plan.sites === 'unlimited' ? t('plan.unlimited') : plan.sites}{' '}
                  {t('plan.websites')}
                </li>
                <li>
                  {plan.storageGb === 'unlimited' ? t('plan.unlimited') : `${plan.storageGb} GB`}{' '}
                  {t('plan.storage')}
                </li>
                <li>
                  {plan.bandwidthGb === 'unlimited' ? t('plan.unlimited') : `${plan.bandwidthGb} GB`}{' '}
                  {t('plan.bandwidth')}
                </li>
                {plan.additional.map((f) => (
                  <li key={f} className="config-product__extra">
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <fieldset className="fieldset">
              <legend>{t('cycle.chooseTitle')}</legend>
              <div className="cycles">
                {CYCLES.map((c) => {
                  const meta = CYCLE_META[c];
                  const price = planPrice(plan, c, currency);
                  const full = plan.monthlyUsdMinor * meta.months;
                  return (
                    <label key={c} className={`cycle-opt${cycle === c ? ' is-selected' : ''}`}>
                      <input
                        type="radio"
                        name="cycle"
                        value={c}
                        checked={cycle === c}
                        onChange={() => setCycle(c)}
                      />
                      <span className="cycle-opt__body">
                        <span className="cycle-opt__name">
                          {t(`cycle.${c}` as never)}
                        </span>
                        <span className="cycle-opt__price serial">
                          {formatAmount(price, locale)} {currency}
                        </span>
                        {meta.save > 0 && (
                          <span className="cycle-opt__save">
                            {t('cycle.saveX')} {meta.save}%
                            <s className="serial">{formatAmount(convert(full, currency), locale)}</s>
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>{t('configure.addons')}</legend>
              <div className="addons">
                {ADDONS.map((group) => (
                  <div className="addon" key={group.id}>
                    <h3 className="addon__title">{t(group.titleKey as never)}</h3>
                    <p className="addon__body">{t(group.bodyKey as never)}</p>
                    <ul className="addon__opts">
                      {group.options.map((o) => (
                        <li key={o.id}>
                          <label className={`addon__opt${addons[group.id] === o.id ? ' is-selected' : ''}`}>
                            <input
                              type="radio"
                              name={group.id}
                              value={o.id}
                              checked={addons[group.id] === o.id}
                              onChange={() =>
                                setAddons((prev) => ({ ...prev, [group.id]: o.id }))
                              }
                            />
                            <span className="addon__label">
                              {o.id === 'none' ? t('configure.none') : o.label}
                            </span>
                            <span className="addon__price serial">
                              {o.priceUsdMinor === 0
                                ? o.id === 'none'
                                  ? ''
                                  : t('configure.free')
                                : `${formatAmount(convert(o.priceUsdMinor, currency), locale)} ${currency} /${o.per === 'year' ? 'yr' : 'mo'}`}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Spec 7.2: the summary stays put and updates on every choice. */}
          <aside className="checkout__aside" aria-labelledby="cfg-sum">
            <h2 className="card__title" id="cfg-sum">
              {t('configure.summary')}
            </h2>

            <div className="summary">
              <p className="summary__line">
                <span>
                  {plan.name}
                  <span className="summary__sub">{t(`cycle.${cycle}` as never)}</span>
                </span>
                <span className="serial">{formatAmount(totals.base, locale)}</span>
              </p>
              {totals.extras.map((e) => (
                <p className="summary__line" key={e.label}>
                  <span>{e.label}</span>
                  <span className="serial">
                    {e.amount === 0 ? t('configure.free') : formatAmount(e.amount, locale)}
                  </span>
                </p>
              ))}
            </div>

            <dl className="totals">
              <div className="totals__row">
                <dt>{t('cart.subtotal')}</dt>
                <dd>{formatAmount(totals.sub, locale)}</dd>
              </div>
              <div className="totals__row">
                <dt>{t('cart.vat')}</dt>
                <dd>{formatAmount(totals.tax, locale)}</dd>
              </div>
              <div className="totals__row totals__row--grand">
                <dt>{t('configure.totalDue')}</dt>
                <dd>
                  {formatAmount(totals.due, locale)} {currency}
                </dd>
              </div>
            </dl>

            <Button
              size="lg"
              onClick={() => {
                const id = add({ plan, cycle, addons });
                navigate(`/domain/${id}`);
              }}
            >
              {t('action.continue')}
              <IconArrow size={17} />
            </Button>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
