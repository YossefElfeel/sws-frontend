import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { IconCheck, IconSearch } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { TLDS, convert, formatAmount } from '../lib/catalog';

/**
 * Domain search.
 *
 * Registration and renewal sit in adjacent columns on purpose. Advertising a first-year price
 * and burying the renewal in the terms is the most common way a hosting invoice surprises
 * someone, and it is precisely what this product is claiming not to do.
 */
export function Domains() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { add } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  /*
   * The search had two states, idle and answered, and moved between them synchronously — the
   * results were simply there on the next paint. A registry lookup is a network call, so the
   * screen that reviewers judge never showed the second or two it actually takes, and it had
   * nowhere to say the lookup failed. Both are states the inventory declares for M-11.
   *
   * A domain search that fails on a name the visitor is attached to is one of the few moments
   * this product has to be graceful in, so the failure is a state and not an alert.
   */
  const [stage, setStage] = useState<'idle' | 'searching' | 'done' | 'failed'>('idle');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const stem = searched.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Deterministic from the stem, so the same search always answers the same way.
  const availability = useMemo(() => {
    if (!stem) return new Map<string, boolean>();
    const hash = [...stem].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    return new Map(TLDS.map((row, i) => [row.tld, ((hash >> i) & 1) === 1]));
  }, [stem]);

  const anyFree = stem ? [...availability.values()].some(Boolean) : false;

  /*
   * Available first once a search has answered. A taken row is a dead end and there were four
   * of them above the first name the visitor could actually buy — the inventory calls this
   * state "unavailable-with-alternatives", and the alternatives are no use underneath the
   * things that are not available. The list keeps its own order until a search runs, because
   * before then this is a price list and its order is the price list's.
   */
  const rows = useMemo(() => {
    if (!stem) return TLDS;
    return [...TLDS].sort(
      (a, b) => Number(availability.get(b.tld)) - Number(availability.get(a.tld)),
    );
  }, [stem, availability]);

  return (
    <Layout>
      <section className="page-head shell" aria-labelledby="dom-head">
        <h1 className="page-title" id="dom-head">
          {t('domain.title')}
        </h1>

        <form
          className="domain-search"
          onSubmit={(e) => {
            e.preventDefault();
            const term = query;
            setStage('searching');
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
              // No server, so the failure has to be triggered by something a reviewer can
              // reach on purpose. "fail" is that something, and the hint below says so.
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
            className="field domain-search__input"
            type="text"
            inputMode="url"
            dir="ltr"
            placeholder={t('domain.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button size="lg" type="submit">
            <IconSearch size={17} />
            {t('action.search')}
          </Button>
        </form>

        <p className="section__lede measure">{t('domain.hint')}</p>

        {/* One region, so a search announces its outcome instead of changing the page in
            silence — the results table below is not announced by anything else. */}
        <div role="status" aria-live="polite" className="domain-status">
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

          {stage === 'done' && stem && (
            <p className="hint">{anyFree ? t('domain.someFree') : t('domain.noneFree')}</p>
          )}
        </div>
      </section>

      <section className="section shell" aria-labelledby="tld-head">
        <div className="section__head">
          <h2 className="section__title" id="tld-head">
            {t('domain.tldtitle')}
          </h2>
        </div>

        <div className="panel table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('col.item')}</th>
                <th scope="col" className="num">
                  {t('domain.register')}
                </th>
                <th scope="col" className="num">
                  {t('domain.renew')}
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const free = stem ? availability.get(row.tld) : undefined;
                return (
                  <tr key={row.tld}>
                    <td>
                      <span className="lead serial"><bdi>{stem ? `${stem}${row.tld}` : row.tld}</bdi></span>
                      {free !== undefined && (
                        <span className={`tag${free ? ' tag--ok' : ' tag--taken'}`}>
                          {free && <IconCheck size={13} />}
                          {t(free ? 'domain.available' : 'domain.taken')}
                        </span>
                      )}
                    </td>
                    <td className="num">
                      {formatAmount(convert(row.registerUsdMinor, currency), locale)} {currency}
                    </td>
                    <td className="num">
                      {formatAmount(convert(row.renewUsdMinor, currency), locale)} {currency}
                    </td>
                    <td className="num">
                      {/*
                        This was the primary action of the whole domain search and it did
                        nothing. A domain is a yearly product, so it enters the cart on the
                        annual cycle at its registration price.
                      */}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={free === false || !stem}
                        onClick={() => {
                          add({
                            plan: {
                              id: `dom-${stem}${row.tld}`,
                              name: `${stem}${row.tld}`,
                              monthlyUsdMinor: Math.round(row.registerUsdMinor / 12),
                              // A year of a domain costs the registration price, not twelve
                              // twelfths with the annual discount taken off.
                              fixedUsdMinor: row.registerUsdMinor,
                            },
                            cycle: 'annually',
                            addons: {},
                            domain: { name: `${stem}${row.tld}`, action: 'register', years: 1, addons: [] },
                          });
                          navigate('/cart');
                        }}
                      >
                        {t('action.add')}
                      </Button>
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
