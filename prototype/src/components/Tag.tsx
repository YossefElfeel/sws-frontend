import type { ReactNode } from 'react';

/**
 * ok      — settled, running, done. Nothing is asked of the reader.
 * warn    — a deadline or a queue: something will need them, and has not failed yet.
 * bad     — owed, failed, suspended.
 * neutral — a fact with no health in it: a category, a permission, a closed thread.
 */
export type TagTone = 'ok' | 'warn' | 'bad' | 'neutral';

/**
 * The status chip — one meaning, one colour, on every screen.
 *
 * Before this component the three chip classes were spread across seventeen call sites with
 * contradictory meanings. The clearest example: an open ticket was green on the tickets list
 * (`closed ? taken : ok`) and grey on the dashboard (`answered ? ok : taken`) — the same ticket,
 * two colours, one click apart. `due` (the danger red) was carrying four things that are not
 * dangers: an expiring domain, a refund, a high priority and a cheaper plan. `warn` — the amber
 * that all four of those actually wanted — was declared in the stylesheet and used nowhere.
 *
 * Meanwhile the dashboard's own tiles already spoke ok/warn/bad correctly, so a pending service
 * read amber in the tile and grey in the row beneath it, on one screen.
 *
 * Screens now pass a tone, never a colour, and the ladder is declared once in the maps below.
 */
export function Tag({ tone, children }: { tone: TagTone; children: ReactNode }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

/** A service is a thing that runs, so its ladder is running → queued → stopped → gone. */
export const SERVICE_TONE = {
  active: 'ok',
  pending: 'warn',
  suspended: 'bad',
  cancelled: 'neutral',
} as const satisfies Record<string, TagTone>;

/** A domain is a deadline. Expiring is a date approaching, not a failure. */
export const DOMAIN_TONE = {
  active: 'ok',
  expiring: 'warn',
  expired: 'bad',
} as const satisfies Record<string, TagTone>;

/** An invoice is money. Unpaid and overdue are both debts; cancelled is bookkeeping. */
export const INVOICE_TONE = {
  paid: 'ok',
  unpaid: 'bad',
  overdue: 'bad',
  cancelled: 'neutral',
} as const satisfies Record<string, TagTone>;

/**
 * A ticket, read from the customer's side: answered is the good outcome, open means they are
 * still waiting, closed is over. This is the pair that used to disagree between two screens.
 */
export const TICKET_TONE = {
  answered: 'ok',
  open: 'warn',
  closed: 'neutral',
} as const satisfies Record<string, TagTone>;

/** Priority is a queue position, not a fault. Only "high" is worth a colour. */
export const PRIORITY_TONE = {
  high: 'warn',
  medium: 'neutral',
  low: 'neutral',
} as const satisfies Record<string, TagTone>;
