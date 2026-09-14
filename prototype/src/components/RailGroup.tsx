import { useState, type ReactNode } from 'react';
import { IconChevron } from './icons';

/**
 * Which rail groups the reader has closed, for as long as the tab is. It lives outside the
 * component because `AppShell` keys `<main>` on the path — every rail remounts on every
 * navigation, and a group the reader had just closed would spring open under the very link
 * that used it. Keyed by `id` rather than by the label, so "Actions" on the domain rail and
 * "Actions" on the hosting rail are two groups and not one.
 */
const closedGroups = new Set<string>();

/**
 * One collapsible group inside a `.rail` — the hosting category rail and the domain rail.
 *
 * The rail's headings used to be captions: they named a group and did nothing else, so a rail
 * with two groups was one list of twelve links that happened to have two labels in it. The
 * sidebar in `AppShell` had already answered this — a heading is the control that opens the
 * thing it names — and the two columns are the same furniture doing the same job, so they now
 * behave the same way.
 *
 * Open to begin with. A rail is a table of contents for the page you are already on, and a
 * table of contents that arrives shut is a list of doors: every reader would pay a click to
 * get back to what was on the screen before. Closing is for the reader who has decided a group
 * is not theirs today, which is a choice they make rather than one made for them.
 *
 * Hidden rather than unmounted, as in the sidebar: the links stay in the document, so a closed
 * group is one control away and find-in-page still reaches it.
 */
export function RailGroup({
  id,
  label,
  children,
}: {
  /** Stable across a language switch, which the label is not. */
  id: string;
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => !closedGroups.has(id));
  const listId = `rail-${id}`;

  // Outside the updater, which React may call twice to check that it is pure.
  const toggle = () => {
    if (open) closedGroups.add(id);
    else closedGroups.delete(id);
    setOpen(!open);
  };

  return (
    <>
      <button
        type="button"
        className={`rail__head${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={toggle}
      >
        <span className="rail__head-text">{label}</span>
        <IconChevron size={14} className="rail__head-chev" />
      </button>
      <ul className="rail__list" id={listId} hidden={!open}>
        {children}
      </ul>
    </>
  );
}
