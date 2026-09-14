import { IconChevron } from './icons';
import { useLocale } from '../lib/locale';

/** How many rows a client-area table shows before it pages. */
export const PAGE_SIZE = 8;

interface PagerProps {
  /** 1-based, owned by the screen — the screen owns the filtering, so it owns the page too. */
  page: number;
  onPage: (next: number) => void;
  /** Rows that survived the search and the filters. */
  matched: number;
  /** Rows there are in total, before either. */
  total: number;
}

/**
 * The count and the page controls, under the table.
 *
 * They used to be a bare "3 of 3" above it, tucked under the search field. That put the answer
 * above the question it answers and left the bottom of a long table as a dead edge — you read
 * to the end of the rows and there was nothing there to tell you whether that was the end of
 * the list. The count belongs where the rows run out, and once it is there the page controls
 * belong beside it.
 *
 * `pagination-item` has been in tokens.json since the design system was written — 44px, its own
 * focus ring, its own active ground — and nothing had ever drawn it. This is that component.
 *
 * The count says two numbers only when they differ. "1–8 of 10" is the whole truth on an
 * unfiltered list; on a filtered one, 10 is not the number of services someone owns, so it says
 * what it was filtered from rather than letting the reader assume. An empty result drops the
 * range and reads "0 of 10", which is `TableCount`'s own shape — the two say the same thing in
 * the same words, and it wears `.tcount` so they are the same line on the screen as well.
 *
 * It renders at zero rather than unmounting, for `TableCount`'s reason: `role="status"`
 * announces only while it is mounted, so a count that took itself off the page on an empty
 * result would go silent at the one moment it has something to report.
 */
export function TablePager({ page, onPage, matched, total }: PagerProps) {
  const { t } = useLocale();
  const pages = Math.max(1, Math.ceil(matched / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, matched);

  return (
    <nav className="pager" aria-label={t('page.label')}>
      <p className="tcount" role="status">
        {matched === 0 ? (
          <>
            <span className="serial">0</span> {t('dash.of')} <span className="serial">{total}</span>
          </>
        ) : (
          <>
            <span className="serial">
              {from}–{to}
            </span>{' '}
            {t('dash.of')} <span className="serial">{matched}</span>
            {matched !== total && (
              <>
                {' '}
                <span className="pager__from">
                  ({t('page.filteredFrom')} <span className="serial">{total}</span>)
                </span>
              </>
            )}
          </>
        )}
      </p>

      {/* One page is not a choice, so it is not drawn as one. The count above stays either way. */}
      {pages > 1 && (
        <ul className="pager__pages">
          <li>
            <button
              type="button"
              className="pager__go pager__go--prev"
              onClick={() => onPage(page - 1)}
              disabled={page === 1}
              aria-label={t('page.prev')}
              title={t('page.prev')}
            >
              <IconChevron size={18} />
            </button>
          </li>

          {pageList(page, pages).map((n, i) =>
            n === 'gap' ? (
              <li key={`gap-${i}`} className="pager__gap" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={n}>
                <button
                  type="button"
                  className={`pager__n serial${n === page ? ' is-current' : ''}`}
                  onClick={() => onPage(n)}
                  aria-label={`${t('page.n')} ${n}`}
                  aria-current={n === page ? 'page' : undefined}
                >
                  {n}
                </button>
              </li>
            ),
          )}

          <li>
            <button
              type="button"
              className="pager__go pager__go--next"
              onClick={() => onPage(page + 1)}
              disabled={page === pages}
              aria-label={t('page.next')}
              title={t('page.next')}
            >
              <IconChevron size={18} />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}

/**
 * The numbers to draw: all of them up to seven, and after that the first, the last, the current
 * and its neighbours, with a gap standing in for the rest. Seven 44px targets is 308px, which
 * is what a 390px phone has once the card's gutters are paid for.
 */
function pageList(page: number, pages: number): (number | 'gap')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const near = [page - 1, page, page + 1].filter((n) => n > 1 && n < pages);
  const shown = new Set([1, ...near, pages]);
  const out: (number | 'gap')[] = [];
  let last = 0;
  for (const n of [...shown].sort((a, b) => a - b)) {
    if (n - last > 1) out.push('gap');
    out.push(n);
    last = n;
  }
  return out;
}
