/**
 * Mid-cycle plan changes — spec 9.2, screens C-04 to C-06.
 *
 * The one number someone wants is "what do I pay today", but showing only that number is what
 * makes upgrades feel like a trick. So the calculation is returned in its parts and the screen
 * shows every one of them: the days you have already paid for, what that unused time is worth
 * on the old plan, what the same days cost on the new one, and the difference. Nothing is
 * rounded until the last step, and the rounding is stated.
 *
 * Downgrades do not refund. They credit, because a refund implies money moving back to a card
 * and that is a different promise — one the billing system has to keep, not the UI.
 */

import { CYCLE_META, type Cycle, type Priced } from './catalog';

export interface Proration {
  /** Whole days left in the paid term, counted from today to the renewal date. */
  daysLeft: number;
  daysInTerm: number;
  /** Unused value on the plan being left, in USD minor units. */
  creditUsdMinor: number;
  /** Cost of the same remaining days on the plan being taken. */
  chargeUsdMinor: number;
  /** charge − credit. Negative means the account is credited instead of billed. */
  dueUsdMinor: number;
  /** What the next full term will cost once the change has taken effect. */
  nextTermUsdMinor: number;
  direction: 'upgrade' | 'downgrade' | 'same';
}

/** Whole days between two ISO dates, never negative. */
function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00Z`).getTime();
  const b = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * Term price for a plan on a cycle, before currency conversion. Kept here rather than reusing
 * planPrice so the proration is computed once in USD minor units and converted at the edge —
 * converting each part separately would let the parts stop adding up to the total.
 */
function termPrice(plan: Priced, cycle: Cycle): number {
  const { months, save } = CYCLE_META[cycle];
  return Math.round(plan.monthlyUsdMinor * months * (1 - save / 100));
}

export function prorate(
  from: Priced,
  to: Priced,
  cycle: Cycle,
  today: string,
  renewsOn: string,
): Proration {
  const daysInTerm = CYCLE_META[cycle].months * 30;
  const daysLeft = Math.min(daysInTerm, daysBetween(today, renewsOn));

  const share = daysInTerm === 0 ? 0 : daysLeft / daysInTerm;
  const creditUsdMinor = Math.round(termPrice(from, cycle) * share);
  const chargeUsdMinor = Math.round(termPrice(to, cycle) * share);

  return {
    daysLeft,
    daysInTerm,
    creditUsdMinor,
    chargeUsdMinor,
    dueUsdMinor: chargeUsdMinor - creditUsdMinor,
    nextTermUsdMinor: termPrice(to, cycle),
    direction:
      to.monthlyUsdMinor > from.monthlyUsdMinor
        ? 'upgrade'
        : to.monthlyUsdMinor < from.monthlyUsdMinor
          ? 'downgrade'
          : 'same',
  };
}
