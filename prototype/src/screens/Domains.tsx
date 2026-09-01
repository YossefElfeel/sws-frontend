import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
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

  const stem = searched.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Deterministic from the stem, so the same search always answers the same way.
  const availability = useMemo(() => {
    if (!stem) return new Map<string, boolean>();
    const hash = [...stem].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    return new Map(TLDS.map((row, i) => [row.tld, ((hash >> i) & 1) === 1]));
  }, [stem]);

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
            setSearched(query);
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
              {TLDS.map((row) => {
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
                            },
                            cycle: 'annually',
                            addons: {},
                            domain: { name: `${stem}${row.tld}`, action: 'register', years: 1 },
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
