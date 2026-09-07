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
  type Priced,
} from '../lib/catalog';
import { VPS, VPS_OS } from '../lib/products';

/** A hostname is a full name with at least one dot and a real top level. */
const FQDN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

/**
 * Configure Product — spec 7.2.
 *
 * Three things the spec is specific about and that are easy to get wrong:
 *   1. Six billing cycles, each showing the saving against paying monthly, with the discount
 *      shown on the longer options.
 *   2. Add-on groups with a radio per option and the price beside it.
 *   3. A summary box that stays in view and updates on every choice — the reason someone can
 *      pick add-ons without losing track of what they are about to pay.
 *
 * A VPS comes through here too (spec 6.3), and brings the fourth thing: server settings — the
 * hostname, root password and nameservers a provisioning module needs, plus the OS choice.
 * They sit between the cycles and the add-ons, and Continue waits for them, because an order
 * placed without a hostname is a ticket before it is a server.
 */
export function Configure() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { add } = useCart();
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();

  const plan = PLANS.find((p) => p.id === planId);
  const vps = VPS.find((v) => v.id === planId);
  const product: Priced | undefined = plan ?? vps;

  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [addons, setAddons] = useState<Record<string, string>>(defaultAddons);
  const [server, setServer] = useState({
    hostname: '',
    rootPassword: '',
    ns1: '',
    ns2: '',
    os: VPS_OS[0],
  });
  const [showPw, setShowPw] = useState(false);

  // The builder is a website product; it has no meaning on a bare server.
  const groups = useMemo(() => (vps ? ADDONS.filter((g) => g.id !== 'builder') : ADDONS), [vps]);

  const totals = useMemo(() => {
    if (!product) return { base: 0, extras: [] as { label: string; amount: number }[], sub: 0, tax: 0, due: 0 };
    const base = planPrice(product, cycle, currency);
    const extras = groups.flatMap((g) => {
      const chosen = g.options.find((o) => o.id === addons[g.id]);
      if (!chosen || chosen.id === 'none') return [];
      return [{ label: `${t(g.titleKey as never)} — ${chosen.label}`, amount: convert(chosen.priceUsdMinor, currency) }];
    });
    const sub = base + extras.reduce((s, e) => s + e.amount, 0);
    const tax = Math.round(sub * TAX_RATE);
    return { base, extras, sub, tax, due: sub + tax };
  }, [product, groups, cycle, addons, currency, t]);

  if (!product) return <Navigate to="/hosting" replace />;

  const hostnameOk = FQDN.test(server.hostname);
  const ns1Ok = FQDN.test(server.ns1);
  const ns2Ok = FQDN.test(server.ns2);
  const serverValid =
    !vps || (hostnameOk && server.rootPassword.length >= 10 && ns1Ok && ns2Ok);

  const setField = (key: keyof typeof server) => (value: string) =>
    setServer((s) => ({ ...s, [key]: value }));

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
              <h2 className="card__title">{product.name}</h2>
              {plan ? (
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
              ) : (
                vps && (
                  <ul className="config-product__specs">
                    <li>
                      <span className="serial">{vps.vcpu}</span> {t('vps.cpu')}
                    </li>
                    <li>
                      <span className="serial">{vps.ramGb} GB</span> {t('vps.ram')}
                    </li>
                    <li>
                      <span className="serial">{vps.storageGb} GB</span> {t('vps.disk')}
                    </li>
                    <li>
                      <span className="serial">{vps.bandwidthTb} TB</span> {t('vps.bw')}
                    </li>
                  </ul>
                )
              )}
            </div>

            <fieldset className="fieldset">
              <legend>{t('cycle.chooseTitle')}</legend>
              <div className="cycles">
                {CYCLES.map((c) => {
                  const meta = CYCLE_META[c];
                  const price = planPrice(product, c, currency);
                  const full = product.monthlyUsdMinor * meta.months;
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

            {vps && (
              <fieldset className="fieldset server-settings">
                <legend>{t('vps.settings')}</legend>
                <p className="hint">{t('vps.settingsNote')}</p>
                <div className="field-grid">
                  <label className="field-label">
                    <span className="eyebrow">{t('vps.hostname')}</span>
                    <input
                      className="field serial"
                      name="hostname"
                      dir="ltr"
                      autoComplete="off"
                      placeholder="srv1.example.com"
                      required
                      value={server.hostname}
                      onChange={(e) => setField('hostname')(e.target.value.trim().toLowerCase())}
                    />
                    {server.hostname !== '' && !hostnameOk && (
                      <span className="hint hint--bad">{t('vps.hostnameBad')}</span>
                    )}
                  </label>

                  <label className="field-label field-label--wide">
                    <span className="eyebrow">{t('vps.rootPassword')}</span>
                    <span className="copy-row">
                      <input
                        className="field serial"
                        name="rootPassword"
                        type={showPw ? 'text' : 'password'}
                        dir="ltr"
                        autoComplete="new-password"
                        required
                        minLength={10}
                        value={server.rootPassword}
                        onChange={(e) => setField('rootPassword')(e.target.value)}
                      />
                      <Button
                        size="md"
                        variant="secondary"
                        aria-pressed={showPw}
                        onClick={() => setShowPw((v) => !v)}
                      >
                        {t(showPw ? 'vps.hide' : 'vps.show')}
                      </Button>
                    </span>
                    <span className="hint">{t('vps.pwRule')}</span>
                  </label>

                  <label className="field-label">
                    <span className="eyebrow">{t('vps.ns1')}</span>
                    <input
                      className="field serial"
                      name="ns1"
                      dir="ltr"
                      autoComplete="off"
                      placeholder="ns1.example.com"
                      required
                      value={server.ns1}
                      onChange={(e) => setField('ns1')(e.target.value.trim().toLowerCase())}
                    />
                    {server.ns1 !== '' && !ns1Ok && (
                      <span className="hint hint--bad">{t('vps.nsBad')}</span>
                    )}
                  </label>

                  <label className="field-label">
                    <span className="eyebrow">{t('vps.ns2')}</span>
                    <input
                      className="field serial"
                      name="ns2"
                      dir="ltr"
                      autoComplete="off"
                      placeholder="ns2.example.com"
                      required
                      value={server.ns2}
                      onChange={(e) => setField('ns2')(e.target.value.trim().toLowerCase())}
                    />
                    {server.ns2 !== '' && !ns2Ok && (
                      <span className="hint hint--bad">{t('vps.nsBad')}</span>
                    )}
                  </label>

                  <label className="field-label">
                    <span className="eyebrow">{t('vps.os')}</span>
                    <select
                      className="field"
                      name="os"
                      value={server.os}
                      onChange={(e) => setField('os')(e.target.value)}
                    >
                      {VPS_OS.map((os) => (
                        <option key={os} value={os}>
                          {os}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </fieldset>
            )}

            <fieldset className="fieldset">
              <legend>{t('configure.addons')}</legend>
              <div className="addons">
                {groups.map((group) => (
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
                  {product.name}
                  <span className="summary__sub">{t(`cycle.${cycle}` as never)}</span>
                  {vps && server.hostname && (
                    <span className="summary__sub serial">
                      <bdi>{server.hostname}</bdi> · {server.os}
                    </span>
                  )}
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
              disabled={!serverValid}
              onClick={() => {
                const id = add({ plan: product, cycle, addons, ...(vps ? { server } : {}) });
                // A server has no domain step: the hostname above is what it is called.
                navigate(vps ? '/cart' : `/domain/${id}`);
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
