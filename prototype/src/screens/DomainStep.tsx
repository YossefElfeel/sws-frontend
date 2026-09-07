import { useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { IconCheck, IconSearch, IconArrow } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { TLDS, convert, formatAmount } from '../lib/catalog';

type Choice = 'cart' | 'register' | 'transfer' | 'own';

/**
 * Choose a Domain — spec 7.2.1, matched to the reference screenshot.
 *
 * Side-by-side option cards, a coloured strip beneath them whose behaviour changes with the
 * choice, and the featured TLDs below. The spec is explicit that "Use Own Domain" only asks
 * for the name while "Register a New Domain" checks availability before the Use button
 * becomes active — so the strip is not one control with a changing label, it is two different
 * behaviours sharing a position.
 *
 * "Domain from cart" is the fourth card, and it is only a card when the cart actually holds a
 * domain to take: offered on an empty cart it was a choice that led nowhere and a Continue
 * that wrote an empty name into the order.
 *
 * The featured-TLD "Add" buttons remain a cosmetic count; adding several domains at once is
 * the multi-domain state O-03 does not cover yet.
 */
export function DomainStep() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { lines, update } = useCart();
  const navigate = useNavigate();
  const { lineId } = useParams<{ lineId: string }>();

  const line = lines.find((l) => l.id === lineId);
  // Standalone domain lines come from the domain search; a domain attached to another hosting
  // line is already spoken for.
  const cartDomains = lines.filter(
    (l) => l.id !== lineId && l.plan.id.startsWith('dom-') && l.domain?.name,
  );

  const [choice, setChoice] = useState<Choice>('register');
  const [query, setQuery] = useState('');
  const [tld, setTld] = useState<string>(TLDS[0].tld);
  const [checked, setChecked] = useState<string | null>(null);
  const [fromCart, setFromCart] = useState('');
  const [extras, setExtras] = useState<string[]>([]);

  const stem = (checked ?? '').split('.')[0];
  const fqdn = (q: string) => (q.includes('.') ? q : `${q}${tld}`);

  // Deterministic availability, so the same name always answers the same way. The stem is
  // what is hashed; the extension only decides what the answer is called and what it costs.
  const available = useMemo(() => {
    if (!checked) return null;
    const hash = [...checked].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);
    return (hash & 1) === 1;
  }, [checked]);

  if (!line) return <Navigate to="/hosting" replace />;

  const options: { id: Choice; title: string; body: string }[] = [
    ...(cartDomains.length
      ? [{ id: 'cart' as Choice, title: t('domainstep.fromCart'), body: t('domainstep.fromCartBody') }]
      : []),
    { id: 'register', title: t('domainstep.register'), body: t('domainstep.registerBody') },
    { id: 'transfer', title: t('domainstep.transfer'), body: t('domainstep.transferBody') },
    { id: 'own', title: t('domainstep.own'), body: t('domainstep.ownBody') },
  ];

  const canContinue =
    (choice === 'own' && query.trim().length > 3) ||
    (choice === 'register' && available === true) ||
    (choice === 'transfer' && query.trim().length > 3) ||
    (choice === 'cart' && fromCart !== '');

  const resultName = checked ? fqdn(checked) : '';
  const resultTld = TLDS.find((x) => resultName.endsWith(x.tld)) ?? TLDS[0];

  const chosenName = () => {
    if (choice === 'cart') return cartDomains.find((d) => d.id === fromCart)?.domain?.name ?? '';
    if (choice === 'register') return fqdn(checked ?? query.trim().toLowerCase());
    return query.trim().toLowerCase();
  };

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t('domainstep.title')}…</h1>
        <p className="chip">
          <span className="chip__key">{t('domainstep.selected')}</span>
          <span className="chip__val">{line.plan.name}</span>
        </p>
      </section>

      <section className="section shell">
        <ul className="choices">
          {options.map((o) => (
            <li key={o.id}>
              <label className={`choice${choice === o.id ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="domain-choice"
                  value={o.id}
                  checked={choice === o.id}
                  onChange={() => {
                    setChoice(o.id);
                    setChecked(null);
                  }}
                />
                {choice === o.id && (
                  <span className="choice__tick" aria-hidden="true">
                    <IconCheck size={13} />
                  </span>
                )}
                <span className="choice__title">{o.title}</span>
                <span className="choice__body">{o.body}</span>
              </label>
            </li>
          ))}
        </ul>

        {choice === 'cart' ? (
          <div className="domain-strip">
            <div className="domain-strip__form">
              <label className="u-visually-hidden" htmlFor="dom-cart">
                {t('domainstep.fromCartPick')}
              </label>
              <select
                id="dom-cart"
                className="field"
                dir="ltr"
                value={fromCart}
                onChange={(e) => setFromCart(e.target.value)}
              >
                <option value="">{t('domainstep.pickFromCart')}</option>
                {cartDomains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.domain?.name}
                  </option>
                ))}
              </select>
            </div>
            {!canContinue && <p className="domain-strip__note">{t('domainstep.required')}</p>}
          </div>
        ) : (
          <div className="domain-strip">
            <form
              className="domain-strip__form"
              onSubmit={(e) => {
                e.preventDefault();
                if (choice === 'register') setChecked(query.trim().toLowerCase());
              }}
            >
              <label className="u-visually-hidden" htmlFor="dom">
                {t('domain.placeholder')}
              </label>
              <input
                id="dom"
                className="field"
                type="text"
                dir="ltr"
                inputMode="url"
                placeholder={t('domain.placeholder')}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setChecked(null);
                }}
              />
              {choice === 'register' && (
                <select
                  className="field domain-strip__tld"
                  dir="ltr"
                  aria-label={t('domainstep.tld')}
                  value={tld}
                  onChange={(e) => {
                    setTld(e.target.value);
                    setChecked(null);
                  }}
                >
                  {TLDS.map((x) => (
                    <option key={x.tld} value={x.tld}>
                      {x.tld}
                    </option>
                  ))}
                </select>
              )}
              <Button size="lg" type="submit" variant="secondary">
                {choice === 'register' ? <IconSearch size={17} /> : null}
                {choice === 'register' ? t('action.search') : t('domainstep.use')}
              </Button>
            </form>
            {/* The spec asks for a Required note above the field when the step is unmet. */}
            {!canContinue && <p className="domain-strip__note">{t('domainstep.required')}</p>}
          </div>
        )}

        {choice === 'register' && checked && (
          <div className={`result${available ? ' result--ok' : ' result--no'}`}>
            <span className="result__mark" aria-hidden="true">
              {available ? <IconCheck size={18} /> : null}
            </span>
            <p>
              <strong className="serial" dir="ltr">
                {resultName}
              </strong>{' '}
              {t(available ? 'domainstep.available' : 'domainstep.unavailable')}
            </p>
            {available && (
              <span className="result__price serial">
                {formatAmount(convert(resultTld.registerUsdMinor, currency), locale)} {currency}
              </span>
            )}
          </div>
        )}

        <h2 className="section__title section__title--sm">{t('domainstep.popular')}</h2>
        <ul className="tlds">
          {TLDS.filter((x) => x.featured || extras.includes(x.tld))
            .concat(TLDS.filter((x) => !x.featured && !extras.includes(x.tld)).slice(0, 3))
            .map((row) => (
              <li className="tld" key={row.tld}>
                <span className="tld__name serial">
                  <bdi>{stem ? `${stem}${row.tld}` : row.tld}</bdi>
                </span>
                <span className="tld__price serial">
                  {formatAmount(convert(row.registerUsdMinor, currency), locale)} {currency}
                </span>
                <Button
                  size="sm"
                  variant={extras.includes(row.tld) ? 'primary' : 'secondary'}
                  onClick={() =>
                    setExtras((prev) =>
                      prev.includes(row.tld)
                        ? prev.filter((x) => x !== row.tld)
                        : [...prev, row.tld],
                    )
                  }
                >
                  {extras.includes(row.tld) ? <IconCheck size={14} /> : null}
                  {t('action.add')}
                </Button>
              </li>
            ))}
        </ul>

        <div className="step-foot">
          <p className="step-foot__count">
            <span className="serial">{extras.length + (canContinue ? 1 : 0)}</span>{' '}
            {t('domainstep.selectedCount')}
          </p>
          <Button
            size="lg"
            disabled={!canContinue}
            onClick={() => {
              update(line.id, {
                domain: { name: chosenName(), action: choice, years: 1, addons: [] },
              });
              // A registration or transfer gets its add-ons chosen next (O-03); a domain that
              // already exists somewhere has nothing to configure.
              navigate(
                choice === 'register' || choice === 'transfer'
                  ? `/domain/${line.id}/addons`
                  : '/cart',
              );
            }}
          >
            {t('action.continue')}
            <IconArrow size={17} />
          </Button>
        </div>
      </section>
    </Layout>
  );
}
