import { useId, type ReactNode } from 'react';
import { IconChevron, IconSearch } from './icons';
import { useLocale } from '../lib/locale';

/**
 * The toolbar every dashboard table wears: one search field that takes the row, and the
 * table's filters as pill selects beside it.
 *
 * Every list in the client area used to narrow itself a different way — invoices and services
 * by a segmented pill strip, tickets by a strip plus two labelled selects, the knowledgebase
 * by a strip plus a search box with its own button, and half the tables not at all. Same job,
 * four shapes. One toolbar makes the row above a table mean the same thing everywhere: type to
 * narrow, pick to narrow further.
 *
 * Filters became selects rather than strips because they now share the row with a search field
 * that has to stay wide enough to type a domain into. A strip of five statuses is five widths
 * that change with the language; a select is one, and it holds its width when German or Arabic
 * runs long.
 */

interface ToolbarProps {
  /** The current query. Owned by the screen, since the screen owns the filtering. */
  value: string;
  onChange: (next: string) => void;
  /** Names the list for a screen reader — the visible placeholder is only ever "Search". */
  label: string;
  /** Filters for this table: TableFilter elements, rendered after the field. */
  children?: ReactNode;
  /** How many rows survived, out of how many there are. */
  shown?: number;
  total?: number;
  /** Set when the toolbar sits inside a flush card, above the table it narrows. */
  inset?: boolean;
}

export function TableToolbar({
  value,
  onChange,
  label,
  children,
  shown,
  total,
  inset,
}: ToolbarProps) {
  const { t } = useLocale();
  // Not derived from the label: \W eats every Arabic letter, so both languages have to keep
  // their own id rather than one collapsing to the same string on every screen.
  const id = useId();

  return (
    <div className={`tbar${inset ? ' tbar--inset' : ''}`}>
      {/* A form, so pressing Enter is a submit the browser understands rather than a keypress
          that does nothing. There is no server round-trip, so it only has to not reload. */}
      <form className="tbar__row" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="tsearch">
          <label className="u-visually-hidden" htmlFor={id}>
            {label}
          </label>
          <IconSearch size={20} className="tsearch__icon" />
          <input
            id={id}
            type="search"
            className="tsearch__input"
            placeholder={t('action.search')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        {/* The filters are one flex item, not three, so a row too narrow for all of them drops
            the whole group to a second line rather than stranding the last pill on its own. */}
        {children && <div className="tbar__filters">{children}</div>}
      </form>

      {/* The count answers the question the search just asked, so it sits under the field
          rather than in the row — the row is the control, this is its result. */}
      {shown !== undefined && total !== undefined && (
        <p className="tbar__count" role="status">
          <span className="serial">{shown}</span> {t('dash.of')} <span className="serial">{total}</span>
        </p>
      )}
    </div>
  );
}

interface FilterProps<T extends string> {
  /** Names the filter for a screen reader; the pill shows the chosen option instead. */
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}

/**
 * One pill select. The chosen option is the label — "All statuses" reads as both the state and
 * the name of the control, which is why there is no separate caption above it.
 */
export function TableFilter<T extends string>({ label, value, onChange, options }: FilterProps<T>) {
  return (
    <label className="tfilter">
      <span className="u-visually-hidden">{label}</span>
      <select
        className="tfilter__select"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevron size={16} className="tfilter__chev" />
    </label>
  );
}

/**
 * Matches a query against the fields a row can be found by. Case is folded and Arabic
 * diacritics are left alone — the fixtures people search here are serials, domains and dates,
 * which are Latin either way.
 */
export function matches(q: string, ...fields: (string | number | undefined)[]) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => f !== undefined && String(f).toLowerCase().includes(needle));
}
