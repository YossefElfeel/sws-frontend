import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { Select } from '../components/Select';
import { DomainDoors } from '../components/DomainDoors';
import { DomainTable, TldShortlist } from '../components/DomainResults';
import { IconCheck, IconSearch } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import {
  TLDS,
  availabilityFor,
  convert,
  formatAmount,
  splitDomain,
  type Tld,
} from '../lib/catalog';

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
   * Both of these live in catalog.ts. The order flow's domain step asks the same two questions
   * one screen later and used to answer them with its own arithmetic, which is how the two
   * screens came to disagree about whether somion.shop was free.
   */
  const { stem, typed } = splitDomain(searched);
  const availability = availabilityFor(stem);
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

        <DomainDoors />

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

        <TldShortlist
          stem={stem}
          onPick={(row) => {
            setTld(row.tld);
            field.current?.focus();
          }}
        />

        <DomainTable
          stem={stem}
          availability={availability}
          action={(row) => (
            <Button size="sm" variant="secondary" onClick={() => addDomain(row)}>
              {t('action.add')}
            </Button>
          )}
        />
      </section>
    </Layout>
  );
}
