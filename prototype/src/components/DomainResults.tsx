import type { ReactNode } from 'react';
import { Button } from './Button';
import { IconCheck } from './icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { TLDS, convert, formatAmount, type Tld } from '../lib/catalog';

/**
 * The answer to a domain search: a shortlist before one, a price list that becomes a result
 * list after.
 *
 * This is one component because it used to be two. The domain search and the order flow's
 * domain step each drew their own, and the copies drifted the way copies do — the order step
 * lost the renewal price, lost per-extension availability, and grew an Add button that only
 * toggled itself. Registration and renewal sitting in adjacent columns is this product's whole
 * claim, so a second screen quietly dropping the renewal column is not a styling difference.
 *
 * What a caller may still decide is the one thing that genuinely differs between the two: the
 * search sells a standalone domain, while the order step picks the single domain its hosting
 * line will carry. That is the `action` prop, and it is the entire licensed variation.
 */

/**
 * The shortlist, before a search only.
 *
 * Four extensions with their two prices on them is the fastest answer to "what does a domain
 * cost here", and it is the state a visitor lands in. Once a search has answered, the answer is
 * the result card and the table, and the same four extensions repeated in between would be
 * noise rather than a shortcut — so the component takes the stem and disappears on its own
 * rather than trusting each caller to remember.
 *
 * The button chooses rather than buys, for the reason the table's action column also gives:
 * before a search there is no product in a row, because an extension on its own cannot be
 * bought. It sets the extension and puts the cursor where the name goes.
 */
export function TldShortlist({ stem, onPick }: { stem: string; onPick: (row: Tld) => void }) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();

  if (stem) return null;

  return (
    <>
      <div className="section__head section__head--sub">
        <h2 className="section__title section__title--sm" id="pop-head">
          {t('domain.popularTlds')}
        </h2>
        <p className="section__note">{t('domain.popularNote')}</p>
      </div>

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
            <Button size="sm" variant="secondary" onClick={() => onPick(row)}>
              {t('domain.pick')}
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * The price list, which becomes the result list once a search has answered.
 *
 * It is the *answer* to the search above it, not a second area of the page, so it takes a
 * subordinate heading that changes with the state rather than a page-level title of its own.
 */
export function DomainTable({
  stem,
  availability,
  action,
}: {
  stem: string;
  availability: Map<string, boolean>;
  /**
   * What a row offers once the search has answered and the name is free. Before a search the
   * slot carries the popular mark instead — an extension on its own cannot be bought — and a
   * taken row is given nothing, because there is nothing it could honestly offer.
   */
  action: (row: Tld) => ReactNode;
}) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();

  const freeCount = TLDS.filter((row) => availability.get(row.tld)).length;

  /*
   * Available first once a search has answered. A taken row is a dead end, and there were four
   * of them above the first name the visitor could actually buy. Before a search this is a
   * price list and keeps the price list's own order.
   */
  const rows = stem
    ? [...TLDS].sort(
        (a, b) =>
          Number(availability.get(b.tld) === true) - Number(availability.get(a.tld) === true),
      )
    : TLDS;

  return (
    <>
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
                    column of dead controls; the slot carries the popular mark instead, which is
                    information rather than a refusal. After a search the same slot holds a real
                    control on every row that can take one, so the column reads as a list of
                    things that work. The column keeps its width across both, so nothing on the
                    page moves when the answer arrives.
                  */}
                  <td className="num">
                    {free === undefined
                      ? row.featured && (
                          <span className="tag tag--neutral">{t('domainstep.popular')}</span>
                        )
                      : free && action(row)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
