import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconArrow, IconCheck, IconAlert } from './icons';

/** ok — nothing to do · warn — something needs attention · bad — something is owed or failed. */
export type Tone = 'ok' | 'warn' | 'bad';

export interface StatItem {
  /** The figure. A count, or an amount already formatted. */
  n: ReactNode;
  /** A unit riding beside the figure at label size, so a row of them keeps one height. */
  unit?: string;
  label: string;
  /**
   * One qualifier line. It names the exception, never the healthy remainder: "2 active" under a
   * count of three says nothing, because the reader has to subtract to find the one that is not.
   */
  note?: string;
  tone?: Tone;
  /** A count is a link wherever there is somewhere to send the reader. */
  to?: string;
  icon?: ReactNode;
  /** The tile is itself the thing that is owed — ground, border, figure and glyph all say so. */
  alert?: boolean;
}

/**
 * The counts that open a client-area screen — spec 9.1 and 9.6.
 *
 * One component, because there were two. The dashboard drew its four counts as `.stat`
 * (12px corners, a hairline, a category glyph, an arrow and a qualifier line) and Affiliates
 * drew its four as `.tile` — a marketing card at 24px corners with a drop shadow, no glyph, no
 * qualifier and no arrow. Two screens doing the same job, one screen apart, in two different
 * visual languages.
 *
 * The anatomy is fixed here rather than per screen: glyph and arrow on the top line, then the
 * figure, then the label, then the qualifier docked to the bottom edge. Equal height is
 * structural — the grid row stretches every `<li>` and the tile fills it — so a label that runs
 * to two lines in English and one in Arabic grows all four together and no fixed height has to
 * be revisited when the copy changes.
 */
export function StatRow({ items }: { items: StatItem[] }) {
  return (
    <ul className="stat-row">
      {items.map((s, i) => (
        <li key={s.to ?? `${s.label}-${i}`}>
          <StatTile {...s} />
        </li>
      ))}
    </ul>
  );
}

function StatTile({ n, unit, label, note, tone = 'ok', to, icon, alert }: StatItem) {
  const cls = `stat${alert ? ' stat--alert' : ''}${to ? '' : ' stat--static'}`;

  const body = (
    <>
      {(icon || to) && (
        <span className="stat__top">
          <span className="stat__icon" aria-hidden="true">
            {icon}
          </span>
          {to && <IconArrow size={14} className="stat__go" />}
        </span>
      )}
      <span className="stat__n serial">
        {n}
        {unit && <span className="stat__unit">{unit}</span>}
      </span>
      <span className="stat__label">{label}</span>
      {note && (
        /* The tone is carried by a glyph as well as a colour, so a tile that is a debt still
           reads as one in greyscale and to a red-green eye. */
        <span className={`stat__note stat__note--${tone} serial`}>
          {tone === 'ok' ? <IconCheck size={13} /> : <IconAlert size={13} />}
          <span>{note}</span>
        </span>
      )}
    </>
  );

  return to ? (
    <Link className={cls} to={to}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}
