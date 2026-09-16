import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { DomainTable, TldShortlist } from '../components/DomainResults';
import { IconCheck, IconSearch, IconArrow } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { TLDS, availabilityFor, convert, formatAmount, splitDomain } from '../lib/catalog';
import { Select } from '../components/Select';

type Choice = 'cart' | 'register' | 'transfer' | 'own';

/**
 * Choose a Domain — spec 7.2.1.
 *
 * Side-by-side option cards, a coloured strip beneath them whose behaviour changes with the
 * choice, and the search's answer below. The spec is explicit that "Use Own Domain" only asks
 * for the name while "Register a New Domain" checks availability before the Use button becomes
 * active — so the strip is not one control with a changing label, it is two different
 * behaviours sharing a position.
 *
 * "Domain from cart" is the fourth card, and it is only a card when the cart actually holds a
 * domain to take: offered on an empty cart it was a choice that led nowhere and a Continue that
 * wrote an empty name into the order.
 *
 * The registration path is the domain search, not a second thing that looks like it. It used to
 * be a second thing that looked like it, and the copy had drifted badly enough to be wrong
 * rather than merely inconsistent:
 *
 *   - its own availability arithmetic, which disagreed with the search screen — orgtik.shop was
 *     free there and taken here — and which ignored the extension beside the field entirely, so
 *     .com and .eg always came back with the same verdict;
 *   - no renewal price, on the one screen where money is about to change hands, which is the
 *     single promise this product makes loudest elsewhere;
 *   - a row of featured extensions whose Add buttons toggled a local array nothing read. They
 *     lit up, moved a counter that could say "1 selected" while Continue sat disabled, and were
 *     dropped on Continue. One of them offered to add the name the strip had just called taken.
 *
 * So the lookup is `availabilityFor` and the answer is `DomainTable`, both shared with the
 * search screen. What stays different is the only thing that really is: this step picks the one
 * domain its hosting line will carry, so a row *chooses* rather than buys. Adding several
 * domains at once is the multi-domain state O-03 does not cover yet, and a button that pretends
 * otherwise is worse than no button.
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
  const [fromCart, setFromCart] = useState('');

  /*
   * The same four states the search screen declares for M-11, and for the same reason: a lookup
   * that answers on the next paint never shows the second or two a registry really takes, and a
   * lookup that fails has nowhere to say so. The failure has a stated trigger — a name starting
   * "fail" — and the hint under the field says so.
   */
  const [stage, setStage] = useState<'idle' | 'searching' | 'done' | 'failed'>('idle');
  const [searched, setSearched] = useState('');
  /** The row the person clicked, if they went past the extension they searched with. */
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<number>();
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const { stem, typed } = splitDomain(searched);
  const availability = availabilityFor(stem);
  /*
   * Which extension this screen is about: a row the person clicked, else one they typed into
   * the field, else the select — each a more specific statement than the one beneath it. It is
   * one value rather than three so the headline card, the extension select and the footer can
   * never end up naming three different domains, which is the failure this whole screen is
   * being rebuilt out of.
   */
  const hero =
    TLDS.find((x) => x.tld === picked) ?? typed ?? TLDS.find((x) => x.tld === tld) ?? TLDS[0];
  const heroFree = stem ? availability.get(hero.tld) === true : false;
  /*
   * The name that was searched for is already the answer when it is free, so the common case is
   * search, then Continue. A table row only has to overrule which extension.
   */
  const selected = heroFree ? hero.tld : null;

  /*
   * Editing the field drops the answer. The search screen leaves its last verdict on screen
   * while you retype, which is fine there because nothing carries the field's value forward —
   * you buy the row you click. Here Continue writes a name into the order, and a Continue that
   * carries `atelier.com` while the field reads `atelier2` is the kind of defect nobody catches
   * until an invoice arrives.
   */
  const clearAnswer = () => {
    window.clearTimeout(timer.current);
    setStage('idle');
    setSearched('');
    setPicked(null);
  };

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
    (choice === 'register' && stage === 'done' && selected !== null) ||
    (choice === 'transfer' && query.trim().length > 3) ||
    (choice === 'cart' && fromCart !== '');

  const chosenName = () => {
    if (choice === 'cart') return cartDomains.find((d) => d.id === fromCart)?.domain?.name ?? '';
    if (choice === 'register') return selected ? `${stem}${selected}` : '';
    return query.trim().toLowerCase();
  };

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t('domainstep.title')}…</h1>
        <p className="pair">
          <span className="pair__key">{t('domainstep.selected')}</span>
          <span className="pair__val">{line.plan.name}</span>
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
                    clearAnswer();
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
              <Select
                id="dom-cart"
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
              </Select>
            </div>
            {!canContinue && <p className="domain-strip__note">{t('domainstep.required')}</p>}
          </div>
        ) : (
          <div className="domain-strip">
            <form
              className="domain-strip__form"
              onSubmit={(e) => {
                e.preventDefault();
                if (choice !== 'register') return;
                const term = query;
                setStage('searching');
                // Drop the previous answer rather than leaving it beside the spinner: a stale
                // verdict under a loading indicator reads as the answer to the new question.
                setSearched('');
                setPicked(null);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => {
                  if (term.trim().toLowerCase().startsWith('fail')) {
                    setStage('failed');
                    return;
                  }
                  setSearched(term);
                  setStage('done');
                }, 700);
              }}
            >
              <label className="u-visually-hidden" htmlFor="dom">
                {t('domain.placeholder')}
              </label>
              <input
                id="dom"
                ref={field}
                className="field"
                type="text"
                dir="ltr"
                inputMode="url"
                placeholder={t('domain.placeholder')}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  clearAnswer();
                }}
              />
              {choice === 'register' && (
                <Select
                  wrapClassName="domain-strip__tld"
                  dir="ltr"
                  aria-label={t('domainstep.tld')}
                  value={tld}
                  onChange={(e) => {
                    setTld(e.target.value);
                    /*
                     * The verdict survives this. Availability is a property of the name, so the
                     * answer for every extension is already on screen — moving the select moves
                     * which row the headline card is about, and re-running the lookup to learn
                     * something it already knows would only cost a spinner.
                     */
                    setPicked(null);
                  }}
                >
                  {TLDS.map((x) => (
                    <option key={x.tld} value={x.tld}>
                      {x.tld}
                    </option>
                  ))}
                </Select>
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

        {choice === 'register' && (
          <>
            <p className="section__lede measure">{t('domain.hint')}</p>

            {/* The transient states. The answered state is the result card below, which carries
                its own role="status". */}
            <div className="domain-status" role="status" aria-live="polite">
              {stage === 'searching' && (
                <p className="hint domain-status__busy">
                  <span className="spinner" aria-hidden="true" />
                  {t('domain.searching')} {t('domain.searchingNote')}
                </p>
              )}

              {stage === 'failed' && (
                <Banner
                  severity="danger"
                  title={t('domain.failed')}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => setStage('idle')}>
                      {t('domain.retry')}
                    </Button>
                  }
                >
                  {t('domain.failedNote')}
                </Banner>
              )}
            </div>

            {/*
              The headline result, and the renewal beside the registration. Someone one click
              from paying is the last person who should have to leave to find out what year two
              costs.
            */}
            {stem && (
              <div className={`result${heroFree ? ' result--ok' : ' result--no'}`} role="status">
                <span className="result__mark" aria-hidden="true">
                  {heroFree ? <IconCheck size={18} /> : null}
                </span>
                <p>
                  <strong className="serial" dir="ltr">
                    {stem}
                    {hero.tld}
                  </strong>{' '}
                  {t(heroFree ? 'domainstep.available' : 'domainstep.unavailable')}
                  {!heroFree && <span className="result__note">{t('domain.tryOthers')}</span>}
                </p>
                {heroFree && (
                  <span className="result__price serial">
                    {formatAmount(convert(hero.registerUsdMinor, currency), locale)} {currency}
                    <span className="result__renew">
                      {t('domain.renew')}{' '}
                      {formatAmount(convert(hero.renewUsdMinor, currency), locale)} {currency}{' '}
                      {t('dom.perYear')}
                    </span>
                  </span>
                )}
              </div>
            )}

            <TldShortlist
              stem={stem}
              onPick={(row) => {
                setTld(row.tld);
                field.current?.focus();
              }}
            />

            {/*
              A row chooses. On the search screen the same slot holds Add, because there a domain
              is the product; here the product is the hosting line and the domain is one of its
              fields, so a second Add would be the multi-domain state O-03 has not specified.
            */}
            <DomainTable
              stem={stem}
              availability={availability}
              action={(row) => (
                <Button
                  size="sm"
                  variant={selected === row.tld ? 'primary' : 'secondary'}
                  aria-pressed={selected === row.tld}
                  onClick={() => {
                    // The select moves with it. A row that chose .eg while the control beside
                    // the field still read .com is the same two-sources-of-truth bug in
                    // miniature.
                    setPicked(row.tld);
                    setTld(row.tld);
                  }}
                >
                  {selected === row.tld ? <IconCheck size={14} /> : null}
                  {t(selected === row.tld ? 'domainstep.pickedRow' : 'domainstep.pickRow')}
                </Button>
              )}
            />
          </>
        )}

        <div className="step-foot">
          {/*
            What Continue will carry. The counter that stood here read "N domains selected" off a
            local array nothing else looked at, so it could say 1 while Continue was disabled and
            it counted things the next screen never received.
          */}
          <p className="step-foot__count">
            {canContinue && (
              <>
                <span className="serial" dir="ltr">
                  {chosenName()}
                </span>{' '}
                {t('domainstep.chosen')}
              </>
            )}
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
