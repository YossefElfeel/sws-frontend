# ADR-0001 — Raise `border-strong` to `neutral-500` for WCAG non-text contrast

- **Status:** accepted
- **Date:** 2026-07-29
- **Decision log ID:** none — closes gap **G10** (`gaps/gap-register.md`). Related open
  decisions: **I17** (formal WCAG 2.2 AA commitment), **C22** (brand identity approval).
- **Deciders:** project owner
- **Affects:** every screen containing a form field — in practice all 84 rows in
  `inventory/screens.csv`. Most directly `O-05`, `A-01`→`A-05`, `C-23`, `C-31`.

---

## Context

Design Playbook §3.2 instructs that every foreground/background pair in the semantic token
layer be checked with a real contrast tool before adoption, and predicts that *"light grey
borders usually fail."* The check had never been run.

Running it (`node tokens/contrast-check.mjs`) failed **4 of 42** pairs. All four were
`border-strong` — the input field border — in **both** themes:

| Theme | Pair | Ratio | Required |
|---|---|---|---|
| light | on `surface-base` | 1.56:1 | 3:1 |
| light | on `surface-raised` | 1.67:1 | 3:1 |
| dark | on `surface-base` | 1.74:1 | 3:1 |
| dark | on `surface-raised` | 1.57:1 | 3:1 |

WCAG 2.2 SC 1.4.11 (Non-text Contrast) requires 3:1 for the visual boundary of a UI component
where that boundary is what identifies the control. A text input is exactly that case: remove
the perceivable border and the field is indistinguishable from the surface behind it.

The values were not marginal. They were roughly half the required ratio, in both themes.

This was not obvious by eye, which is the point — a border can look perfectly reasonable to a
designer with normal vision and still be invisible to a user with low vision. It is precisely
why the Playbook demanded a tool rather than a judgement.

## Options considered

| Option | Verdict |
|---|---|
| `neutral-400` (`#A29BB2`) | **Rejected.** 2.50:1 / 2.67:1 in light — still fails. The obvious "one step darker" fix is not enough, and adopting it would have produced a token that looks fixed and is not. |
| `neutral-500` (`#7B7389`) | **Accepted.** 4.23:1 / 4.51:1 light, 4.07:1 / 3.67:1 dark. First step clearing 3:1 everywhere, and it serves both themes with a single value. |
| Different values per theme | **Rejected.** Unnecessary once one value cleared both. Two values would be two things to maintain and two chances to regress. |
| Keep the Playbook values, document the failure, defer | **Rejected.** Deferring means 84 screens get built on a component that fails an accessibility criterion, and the failure surfaces in the Phase 8 accessibility review — after everything is built on top of it. The whole reason to fix tokens early is that they are the cheapest layer to change. |

## Decision

`semantic.light.border-strong` and `semantic.dark.border-strong` both resolve to
`primitive.neutral.500` (`#7B7389`).

Applied in the **semantic layer only**. No component token, no screen, and no primitive was
touched.

## Consequences

**Accepted costs**
- Input borders are visibly heavier than the Playbook mock-ups show. This is the intended
  trade: a border that can be seen.
- `tokens.json` now **deliberately disagrees** with the Playbook §3.2 table. Both tokens carry
  a `$description` explaining why, and `tokens/README.md` and G10 both warn against
  "correcting" it back. If the Playbook is reissued, its table should be updated to match this
  file — not the reverse.

**Confirmed working**
- The three-layer token structure did what it exists to do: one semantic value changed and
  every component referencing `border-strong` — inputs, selects, textareas, secondary buttons —
  corrected at once. No component was patched. Had any component referenced the primitive
  directly, this fix would have been a hunt instead of a one-line edit.

**Follow-on work**
- The gate covers colour only. `focus-ring` **width** (2px) and touch target size (44×44) are
  in `tokens.accessibility` but are not automatically verified — they need a separate check or
  a manual review step.
- Disabled-state contrast is not yet in the pair list. Playbook §3.2 names it as a usual
  failure; there is no disabled token to test yet. Add both when the state is defined.

**Unblocks**
- Nothing in `blocked_by`. This was a gap, not a blocking decision.

## Revisit if

- **C22** closes with a brand palette that changes the neutral ramp — re-run the gate before
  adopting any new value.
- **I17** closes as *not* committing to WCAG 2.2 AA. Even then, keep this change: the previous
  values were low enough to be a usability problem for sighted users on low-quality displays,
  independent of any formal standard.
- Surface colours change. The ratio depends on both sides of the pair, so a change to
  `surface-base` or `surface-raised` can break a border that passes today. The gate catches
  this automatically — which is the reason it is a gate and not a checklist.
