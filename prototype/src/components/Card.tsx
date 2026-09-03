import type { ReactNode } from 'react';

/**
 * The client-area card — spec 9.
 *
 * It exists because the anatomy had drifted rather than because the markup was long. An audit
 * of all 27 client-area routes found three ways of opening a card: `<header class="card__head">`
 * around the heading (most screens), a bare `<h2 class="card__heading">` with no wrapper
 * (Affiliates, Security, both ticket screens), and no heading at all. The bare form silently
 * loses the head's 16px `margin-block-end`, so the heading sat flush against its own content on
 * exactly the screens where a form needed the separation most.
 *
 * Passing the heading as a prop is what makes that unrepresentable: a card with a heading has a
 * head, and the head is the only thing that can render one.
 *
 * `tone` carries the two states a card can be in beyond neutral, and both are marked by more
 * than colour — `urgent` reddens the border AND the heading with its glyph, `calm` greens the
 * border and tints the ground.
 */
export function Card({
  heading,
  icon,
  action,
  tone,
  flush,
  headingId,
  className = '',
  children,
}: {
  /** Omit for a card that is only a container — a table, a document, a prose block. */
  heading?: ReactNode;
  /** A glyph beside the heading. Reserved for cards that report a state, not for every card. */
  icon?: ReactNode;
  /** The "view all" or equivalent, at the far end of the head. */
  action?: ReactNode;
  tone?: 'urgent' | 'calm';
  /** Content runs to the card's own edges — a table, a list of ruled rows. */
  flush?: boolean;
  headingId?: string;
  className?: string;
  children: ReactNode;
}) {
  const cls = [
    'card',
    tone === 'urgent' ? 'card--urgent' : '',
    tone === 'calm' ? 'card--calm' : '',
    flush ? 'card--flush' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={cls}>
      {heading !== undefined && (
        <header className={flush ? 'card__head card__head--flush' : 'card__head'}>
          <h2 className="card__heading" id={headingId}>
            {icon}
            {heading}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
