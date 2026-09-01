import { useState } from 'react';
import { Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { HostingLayout } from '../components/HostingLayout';
import { Button } from '../components/Button';
import { IconCheck, IconArrow, IconInfo, IconSearch } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { convert, formatAmount, planPrice, PLANS, TLDS, CYCLES, CYCLE_META, type Cycle } from '../lib/catalog';

/**
 * Plan comparison — M-10.
 *
 * The plan cards are a shop window; this is the spec sheet. Every row is a real difference, so
 * a row where all four plans agree does not appear at all — a comparison table whose job is to
 * separate four things should not spend half its height showing where they are identical.
 */
const ROWS = [
  { key: 'cmp.sites', get: (p: (typeof PLANS)[number]) => p.sites },
  { key: 'cmp.storage', get: (p: (typeof PLANS)[number]) => p.storageGb, unit: 'GB' },
  { key: 'cmp.bandwidth', get: (p: (typeof PLANS)[number]) => p.bandwidthGb, unit: 'GB' },
  { key: 'cmp.subdomains', get: (p: (typeof PLANS)[number]) => p.subdomains },
  { key: 'cmp.mailboxes', get: (p: (typeof PLANS)[number]) => p.mailboxes },
  { key: 'cmp.freeDomain', get: (p: (typeof PLANS)[number]) => p.freeDomainFirstYear },
];

export function Compare() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle>('annually');

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;
  const show = (v: number | 'unlimited' | boolean, unit?: string) => {
    // A tick and a dash are symbols, not figures: they centre in a shared box rather than
    // aligning to the column's end, where an SVG and a glyph land in different places.
    if (v === true)
      return (
        <span className="bool">
          <IconCheck size={16} />
        </span>
      );
    if (v === false) return <span className="bool muted">—</span>;
    if (v === 'unlimited') return <span className="unl">{t('plan.unlimited')}</span>;
    return (
      <span className="serial">
        {v}
        {unit ? ` ${unit}` : ''}
      </span>
    );
  };

  return (
    <HostingLayout title={t('cmp.title')} lede={t('cmp.lede')}>
      <div className="bar">
        <div className="filters" role="group" aria-label={t('col.term')}>
          {CYCLES.map((c) => (
            <button
              key={c}
              type="button"
              className={`filters__btn${cycle === c ? ' is-active' : ''}`}
              aria-pressed={cycle === c}
              onClick={() => setCycle(c)}
            >
              {t(`cycle.${c}` as never)}
              {CYCLE_META[c].save > 0 && <span className="tag tag--ok">−{CYCLE_META[c].save}%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="panel table-scroll">
        <table className="data compare">
          <caption className="u-visually-hidden">{t('cmp.title')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('cmp.feature')}</th>
              {PLANS.map((p) => (
                <th scope="col" className="num" key={p.id}>
                  <span className="compare__plan">{p.name}</span>
                  <span className="compare__price serial">{money(planPrice(p, cycle, currency))}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.key}>
                <th scope="row">{t(r.key as never)}</th>
                {PLANS.map((p) => (
                  <td className="num" key={p.id}>
                    {show(r.get(p), r.unit)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" />
              {PLANS.map((p) => (
                <td className="num" key={p.id}>
                  <Button
                    size="sm"
                    variant={p.featured ? 'primary' : 'secondary'}
                    onClick={() => navigate(`/configure/${p.id}`)}
                  >
                    {t('plan.orderNow')}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/*
        I13: "Unlimited" is a fair-use word, not an infinite one, and the decision on where to
        say so is still open. Saying it here beside the table is the honest minimum — the
        alternative is a superlative on a spec sheet with nothing qualifying it.
      */}
      <div className="notice notice--spaced">
        <IconInfo size={20} />
        <div>
          <h2 className="card__title">{t('cmp.fairUse')}</h2>
          <p className="card__body">
            {t('cmp.fairUseBody')} <Link to="/legal/terms">{t('footer.terms')}</Link>
          </p>
        </div>
      </div>
    </HostingLayout>
  );
}

/**
 * All TLD pricing — M-12.
 *
 * Three prices per extension, and the one people are surprised by is the renewal — a .shop at
 * $1.99 renews at $34.99. So renewal is a column of its own rather than a footnote, and where
 * it is more than double the first year the row says so out loud.
 */
export function TldPricing() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [q, setQ] = useState('');

  const rows = TLDS.filter((x) => (q.trim() ? x.tld.includes(q.trim().toLowerCase()) : true));
  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  return (
    <HostingLayout title={t('tld.title')} lede={t('tld.lede')}>
      <form className="domain-search" onSubmit={(e) => e.preventDefault()}>
        <label className="u-visually-hidden" htmlFor="tldq">
          {t('action.search')}
        </label>
        <input
          id="tldq"
          className="field domain-search__input serial"
          dir="ltr"
          placeholder=".com"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button size="lg" type="submit">
          <IconSearch size={17} />
          {t('action.search')}
        </Button>
      </form>

      {rows.length > 0 ? (
        <div className="panel table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('tld.ext')}</th>
                <th scope="col" className="num">{t('tld.register')}</th>
                <th scope="col" className="num">{t('tld.transfer')}</th>
                <th scope="col" className="num">{t('tld.renew')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => {
                // The gap people get caught by, stated on the row rather than in small print.
                const jump = x.renewUsdMinor > x.registerUsdMinor * 2;
                return (
                  <tr key={x.tld}>
                    <td>
                      <span className="lead serial">
                        <bdi>{x.tld}</bdi>
                      </span>
                      {x.featured && <span className="tag tag--ok">{t('tld.popular')}</span>}
                    </td>
                    <td className="num serial">{money(x.registerUsdMinor)}</td>
                    <td className="num serial">{money(x.transferUsdMinor)}</td>
                    <td className="num">
                      <span className="serial">{money(x.renewUsdMinor)}</span>
                      {jump && <span className="tag tag--due">{t('tld.jump')}</span>}
                    </td>
                    <td className="num">
                      <Link className="btn btn--sm btn--secondary" to="/domains">
                        {t('tld.check')}
                        <IconArrow size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel empty">
          <IconSearch size={28} />
          <p className="empty__title">{t('tld.none')}</p>
          <p className="empty__note">{t('tld.noneNote')}</p>
        </div>
      )}

      <p className="hint u-mt-16">{t('tld.vatNote')}</p>
    </HostingLayout>
  );
}

/**
 * Product detail — M-14.
 *
 * One plan, everything about it. The family pages compare; this page commits. The renewal
 * price of the free domain is on the page rather than in the terms, which is the recommendation
 * the decision log records against I14 — it is the single biggest source of billing complaints.
 */
export function ProductDetail() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<Cycle>('annually');

  const plan = PLANS.find((p) => p.id === id);
  if (!plan) return <Navigate to="/hosting/shared" replace />;

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;
  const dotCom = TLDS.find((x) => x.tld === '.com');

  const specs = [
    { key: 'cmp.sites', v: plan.sites },
    { key: 'cmp.storage', v: plan.storageGb, unit: 'GB' },
    { key: 'cmp.bandwidth', v: plan.bandwidthGb, unit: 'GB' },
    { key: 'cmp.subdomains', v: plan.subdomains },
    { key: 'cmp.mailboxes', v: plan.mailboxes },
  ];

  return (
    <HostingLayout
      title={plan.name}
      lede={t('prod.lede')}
      crumbs={[
        { label: t('nav.hosting'), to: '/hosting' },
        { label: t('fam.shared'), to: '/hosting/shared' },
        { label: plan.name },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="panel panel--pad">
            <h2 className="card__title">{t('prod.whatYouGet')}</h2>
            <dl className="kv">
              {specs.map((s) => (
                <div key={s.key}>
                  <dt>{t(s.key as never)}</dt>
                  <dd>
                    {s.v === 'unlimited' ? (
                      <span className="unl">{t('plan.unlimited')}</span>
                    ) : (
                      <span className="serial">
                        {s.v}
                        {s.unit ? ` ${s.unit}` : ''}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {(plan.sites === 'unlimited' ||
              plan.storageGb === 'unlimited' ||
              plan.bandwidthGb === 'unlimited') && (
              <p className="hint">{t('cmp.fairUseBody')}</p>
            )}
          </section>

          {plan.freeDomainFirstYear && dotCom && (
            /*
              I14, implemented as the decision log recommends: on the card, not in the terms.
              A free first year that renews at a price you meet twelve months later is the
              single biggest source of billing complaints, so the second-year price is stated
              next to the offer that creates it.
            */
            <section className="panel panel--pad">
              <h2 className="card__title">{t('prod.freeDomain')}</h2>
              <dl className="kv">
                <div>
                  <dt>{t('prod.year1')}</dt>
                  <dd>{t('configure.free')}</dd>
                </div>
                <div>
                  <dt>{t('prod.year2')}</dt>
                  <dd className="serial">
                    {money(dotCom.renewUsdMinor)} / {t('prod.perYear')}
                  </dd>
                </div>
              </dl>
              <p className="hint">{t('prod.freeDomainNote')}</p>
            </section>
          )}
        </div>

        <div className="dash__side">
          <section className="panel panel--pad">
            <h2 className="card__title">{t('col.term')}</h2>
            <ul className="terms">
              {CYCLES.map((c) => (
                <li key={c}>
                  <label className={`term${cycle === c ? ' is-selected' : ''}`}>
                    <input type="radio" name="cyc" checked={cycle === c} onChange={() => setCycle(c)} />
                    <span className="term__name">{t(`cycle.${c}` as never)}</span>
                    <span className="term__price serial">{money(planPrice(plan, c, currency))}</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="acts u-mt-16">
              <Button size="lg" onClick={() => navigate(`/configure/${plan.id}`)}>
                {t('plan.orderNow')}
                <IconArrow size={17} />
              </Button>
              <Link className="btn btn--md btn--secondary" to="/compare">
                {t('cmp.title')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </HostingLayout>
  );
}
