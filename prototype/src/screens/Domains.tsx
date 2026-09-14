import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { Select } from '../components/Select';
import { IconCheck, IconSearch } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { TLDS, convert, formatAmount, type Tld } from '../lib/catalog';

/**
 * Domain search.
 *
 * Registration and renewal sit in adjacent columns on purpose. Advertising a first-year price
 * and burying the renewal in the terms is the most common way a hosting invoice surprises
 * someone, and it is precisely what this product is claiming not to do.
 *
 * The table is the *answer* to the search above it, not a second area of the page, so it takes
 * a subordinate heading that changes with the state — a price list before a search, a result
 * list after one — rather than a page-level title of its own.
 */
export function Domains() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { add } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  /*
   * The lookup used to be synchronous: results were simply there on the next paint, so the
   * second or two a registry actually takes never appeared on screen and a lookup that failed
   * had nowhere to say so. M-11 declares both `searching` and `error`. There is no server here,
   * so the failure has a stated trigger — a name starting "fail" — and the hint below the
   * field says so, because a rule the reviewer cannot discover is the same as no rule.
   */
  const [stage, setStage] = useState<'idle' | 'searching' | 'done' | 'failed'>('idle');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /*
   * The extension is a control now rather than something to be guessed at from the typing.
   * Someone who knows they want a .eg had to type it and hope the parser agreed; the select
   * says which extensions exist and makes the choice before the search rather than after it.
   * Typing one still wins — see `typed` below — because a person who writes the whole name
   * has been more specific than a dropdown left at its default.
   */
  const [tld, setTld] = useState(TLDS[0].tld);
  const field = useRef<HTMLInputElement>(null);

  /*
   * Someone who types "somion.net" is asking about .net, not about a name called "somionnet".
   * Splitting the extension off here is what lets the headline result answer the question that
   * was actually asked; without it the extension was silently folded into the stem.
   */
  const raw = searched.trim().toLowerCase();
  const dot = raw.indexOf('.');
  const typed = dot > 0 ? TLDS.find((x) => x.tld === raw.slice(dot)) : undefined;
  const stem = (typed ? raw.slice(0, dot) : raw).replace(/[^a-z0-9-]/g, '');

  // Deterministic from the stem, so the same search always answers the same way.
  const availability = useMemo(() => {
    if (!stem) return new Map<string, boolean>();
    const hash = [...stem].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    return new Map(TLDS.map((row, i) => [row.tld, ((hash >> i) & 1) === 1]));
  }, [stem]);

  const freeCount = TLDS.filter((row) => availability.get(row.tld)).length;

  /*
   * Available first once a search has answered. A taken row is a dead end, and there were four
   * of them above the first name the visitor could actually buy. Before a search this is a
   * price list and keeps the price list's own order.
   */
  const rows = useMemo(() => {
    if (!stem) return TLDS;
    return [...TLDS].sort(
      (a, b) => Number(availability.get(b.tld) === true) - Number(availability.get(a.tld) === true),
    );
  }, [stem, availability]);
  // The extension typed, or the one chosen beside the field — the result the search is about.
  const hero = typed ?? TLDS.find((x) => x.tld === tld) ?? TLDS[0];
  const heroFree = stem ? availability.get(hero.tld) === true : false;

  /*
   * A domain is a yearly product, so it enters the cart on the annual cycle at its registration
   * price. The headline card and the table rows share this one path, so the two can never
   * disagree about what was added.
   */
  const addDomain = (row: Tld) => {
    const name = `${stem}${row.tld}`;
    add({
      plan: {
        id: `dom-${name}`,
        name,
        monthlyUsdMinor: Math.round(row.registerUsdMinor / 12),
        // A year of a domain costs the registration price, not twelve twelfths with the
        // annual discount taken off.
        fixedUsdMinor: row.registerUsdMinor,
      },
      cycle: 'annually',
      addons: {},
      domain: { name, action: 'register', years: 1, addons: [] },
    });
    navigate('/cart');
  };

  return (
    <Layout>
      <section className="page-head shell" aria-labelledby="dom-head">
        <h1 className="page-title" id="dom-head">
          {t('domain.title')}
        </h1>

        {/*
          The three doors, and the same three the order flow offers at its domain step — same
          words, same card. A visitor who meets "Transfer a domain" here and again inside the
          funnel has met one thing twice rather than two things once.

          They are doors rather than radio buttons, which is the one difference from the funnel:
          there is no form on this page to hold a third state, and two of the three already have
          a screen of their own. A selector would have put a click between the visitor and a
          page that exists. The first card is the page they are already on, so it says so and
          does the only useful thing left — puts the cursor in the field.
        */}
        <h2 className="u-visually-hidden">{t('domain.doors')}</h2>
        <ul className="choices choices--doors">
          <li>
            <button
              type="button"
              className="choice choice--door is-selected"
              aria-current="page"
              onClick={() => field.current?.focus()}
            >
              <span className="choice__tick" aria-hidden="true">
                <IconCheck size={13} />
              </span>
              <span className="choice__title">{t('domainstep.register')}</span>
              <span className="choice__body">{t('domainstep.registerBody')}</span>
            </button>
          </li>
          <li>
            <Link className="choice choice--door" to="/transfer">
              <span className="choice__title">{t('domainstep.transfer')}</span>
              <span className="choice__body">{t('domainstep.transferBody')}</span>
            </Link>
          </li>
          <li>
            {/* Owning a domain already is not a domain purchase — it is a hosting one, with the
                nameservers pointed here afterwards. So this door opens the plans. */}
            <Link className="choice choice--door" to="/hosting/shared">
              <span className="choice__title">{t('domainstep.own')}</span>
              <span className="choice__body">{t('domainstep.ownBody')}</span>
            </Link>
          </li>
        </ul>

        <form
          className="domain-search"
          onSubmit={(e) => {
            e.preventDefault();
            const term = query;
            setStage('searching');
            // Drop the previous answer rather than leaving it beside the spinner: a stale
            // verdict under a loading indicator reads as the answer to the new question.
            setSearched('');
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
          <label className="u-visually-hidden" htmlFor="domain-q">
            {t('domain.placeholder')}
          </label>
          <input
            id="domain-q"
            ref={field}
            className="field domain-search__input"
            type="text"
            inputMode="url"
            dir="ltr"
            placeholder={t('domain.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            wrapClassName="domain-search__tld"
            dir="ltr"
            aria-label={t('domainstep.tld')}
            value={tld}
            onChange={(e) => setTld(e.target.value)}
          >
            {TLDS.map((x) => (
              <option key={x.tld} value={x.tld}>
                {x.tld}
              </option>
            ))}
          </Select>
          <Button size="lg" type="submit">
            <IconSearch size={17} />
            {t('action.search')}
          </Button>
        </form>

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
      </section>

      <section className="section section--tight shell" aria-labelledby="tld-head">
        {/*
          The headline result. A domain search has one question behind it — is the name I typed
          free — and answering it inside row four of a ten-row table leaves the person hunting
          for their own answer.
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
              <>
                <span className="result__price serial">
                  {formatAmount(convert(hero.registerUsdMinor, currency), locale)} {currency}
                </span>
                <Button className="result__cta" onClick={() => addDomain(hero)}>
                  {t('action.add')}
                </Button>
              </>
            )}
          </div>
        )}

        {/*
          The shortlist, before a search only.

          Four extensions with their two prices on them is the fastest answer to "what does a
          domain cost here", and it is the state a visitor lands in. Once a search has answered,
          the answer is the card above and the table below, and the same four extensions
          repeated a third time in between would be noise rather than a shortcut.

          The button chooses rather than buys, for the reason the table's action column already
          gives: before a search there is no product in a row, because an extension on its own
          cannot be bought. It sets the select and puts the cursor where the name goes.
        */}
        {!stem && (
          <div className="section__head section__head--sub">
            <h2 className="section__title section__title--sm" id="pop-head">
              {t('domain.popularTlds')}
            </h2>
            <p className="section__note">{t('domain.popularNote')}</p>
          </div>
        )}

        {!stem && (
          <ul className="tld-cards" aria-labelledby="pop-head">
            {TLDS.filter((row) => row.featured).map((row) => (
              <li className="tld-card" key={row.tld}>
                <p className="tld-card__name serial" dir="ltr">
                  {row.tld}
                </p>
                <p className="tld-card__price">
                  <span className="serial">
                    {formatAmount(convert(row.registerUsdMinor, currency), locale)} {currency}
                  </span>
                  <span className="tld-card__per">/ {t('cycle.perYear')}</span>
                </p>
                {/* The renewal, on the card. It is the whole point of this page. */}
                <p className="tld-card__renew">
                  {t('domain.renew')}{' '}
                  <span className="serial">
                    {formatAmount(convert(row.renewUsdMinor, currency), locale)} {currency}
                  </span>{' '}
                  {t('dom.perYear')}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTld(row.tld);
                    field.current?.focus();
                  }}
                >
                  {t('domain.pick')}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="section__head section__head--sub">
          <h2 className="section__title section__title--sm" id="tld-head">
            {stem ? (
              <>
                {t('domain.resultsFor')}{' '}
                <bdi className="serial" dir="ltr">
                  {stem}
                </bdi>
              </>
            ) : (
              t('domain.tldtitle')
            )}
          </h2>
          <p className="section__note">
            {stem ? (
              <bdi>
                <span className="serial">{freeCount}</span> {t('domain.freeOf')}{' '}
                <span className="serial">{TLDS.length}</span>
              </bdi>
            ) : (
              t('domain.tldnote')
            )}
          </p>
        </div>

        <div className="panel table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t(stem ? 'domain.colDomain' : 'domain.colTld')}</th>
                <th scope="col" className="num">
                  {t('domain.register')}
                </th>
                <th scope="col" className="num">
                  {t('domain.renew')}
                </th>
                <th scope="col" className="num">
                  <span className="u-visually-hidden">{t('domain.colAction')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const free = stem ? availability.get(row.tld) === true : undefined;
                const tagClass = free ? 'tag tag--ok' : 'tag tag--taken';
                return (
                  <tr key={row.tld}>
                    <td>
                      <span className="domain-cell">
                        <span className="lead serial">
                          <bdi>{stem ? `${stem}${row.tld}` : row.tld}</bdi>
                        </span>
                        {free !== undefined && (
                          <span className={tagClass}>
                            {free && <IconCheck size={13} />}
                            {t(free ? 'domain.available' : 'domain.taken')}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="num">
                      {formatAmount(convert(row.registerUsdMinor, currency), locale)} {currency}
                    </td>
                    <td className="num">
                      {formatAmount(convert(row.renewUsdMinor, currency), locale)} {currency}
                    </td>
                    {/*
                      One slot, two jobs. Before a search there is no product in this row — an
                      extension on its own cannot be bought — so a disabled Add stood there as a
                      column of dead controls; the slot carries the popular mark instead, which
                      is information rather than a refusal. After a search the same slot holds a
                      real Add on every row that can take one, so the column reads as a list of
                      things that work. The column keeps its width across both, so nothing on
                      the page moves when the answer arrives.
                    */}
                    <td className="num">
                      {free === undefined
                        ? row.featured && (
                            <span className="tag tag--neutral">{t('domainstep.popular')}</span>
                          )
                        : free && (
                            <Button size="sm" variant="secondary" onClick={() => addDomain(row)}>
                              {t('action.add')}
                            </Button>
                          )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}
