# ADR-0002 — Raise the default button height to 44px

- **Status:** accepted
- **Date:** 2026-07-29
- **Decision log ID:** none — partially closes gap **G11** (`gaps/gap-register.md`).
  Related open decision: **I17** (formal WCAG 2.2 AA commitment).
- **Deciders:** project owner
- **Affects:** every button in the product. Most visibly `M-02`→`M-10` (Order Now),
  `O-04`, `O-07`, `O-12`, `C-21`.

---

## Context

Extending the accessibility gate to cover target size (ADR-0001 follow-on) exposed a
contradiction inside the Design Playbook.

- **§7.1** defines the Button component API: `sm (32) · md (40) · lg (48)`, with **`md` as the
  default**.
- **§11** mandates a touch target of **≥ 44×44 px**.

So the default button — the single most-used interactive control in the product — violated the
project's own accessibility rule. `sm` violated it too.

The Playbook half-anticipates the tension: its `size` row notes *"lg for primary actions on
mobile."* But that is a convention expressed in prose, not a constraint anything enforces, and
conventions are exactly what gets skipped under deadline pressure. The Order Now button is the
first control in the revenue path; leaving its size to a remembered guideline is how it ends up
at 40px on launch day.

Worth being precise about the standard, because the Playbook is not: 44×44 is **SC 2.5.5 Target
Size (Enhanced), Level AAA**. The Level AA bar is **SC 2.5.8**, at 24×24, which 40px already
met. This change is therefore above the AA line that decision **I17** commits to. It is
nonetheless the right call — 44px is the Apple HIG minimum and close to Material's 48dp, and
the primary market reaches the product on a phone.

## Options considered

| Option | Verdict |
|---|---|
| **Raise `md` to 44px** | **Accepted.** Fixes the default, so the common path is correct without anyone having to remember a rule. |
| Drop the project rule to the AA bar (24×24) | **Rejected.** Legitimate on paper — 44 is AAA — but the Playbook's mobile-first premise and the Egyptian/Gulf market's phone-dominant traffic make 44 the right target. Lowering the rule to match the tokens would be solving the contradiction backwards. |
| Keep 40px, rely on hit-area padding beyond the visible box | **Rejected for the default.** The pattern is valid and Playbook §11 already endorses it for small icons, but it needs a `hit-area` token for the gate to verify. An unverifiable promise is what produced this finding in the first place. Still the right approach for icon-only controls. |
| Also raise `sm` to 44px | **Not taken now.** Would collapse the scale to a single size. See below. |

## Decision

`component.button.height-md` is **44px**, up from the Playbook's 40px.

`sm` (32px) and `lg` (48px) are unchanged.

## Consequences

**Accepted costs**

- The size scale is now **32 / 44 / 48**. The steps are uneven — 12px then 4px — and `lg` is
  only 4px taller than `md`, which is close to imperceptible. The three-size scale is
  effectively a two-size scale with a rounding error. This is a real design debt, logged
  under G11 rather than fixed here, because resolving it means either moving `lg` (a second
  unrequested change) or dropping to two sizes (a component API change).
- `tokens.json` now deliberately disagrees with Playbook §7.1, as it already does with §3.2
  after ADR-0001. The `$description` records why.
- Buttons are visibly chunkier on desktop. Intended.

**Still open**

- **`sm` (32px) remains below the 44px rule** and the gate still warns on it. It was left
  because it was not part of the request, and because a 32px control is defensible in dense
  desktop contexts (table row actions, toolbar buttons) where SC 2.5.8's AA bar of 24×24 is
  met and pointer input dominates. It needs an explicit decision: restrict `sm` to
  desktop-only with enforced spacing, give it a `hit-area` token, or raise it.

**Unblocks**

- Nothing in `blocked_by`. G11 is a gap, not a blocking decision.

## Revisit if

- **I17** closes as an explicit AA-only commitment *and* the team decides AAA target sizes are
  out of scope. Even then, keep 44px for the default — it is a mobile usability decision before
  it is a compliance one.
- The `lg` size is revisited. If `lg` moves, re-check that `md` and `lg` remain visually
  distinguishable; 4px apart, they currently are not.
- A `hit-area` token is introduced. That would allow `sm` to satisfy the rule without changing
  its visible height, and would make this decision reconsiderable for `md` too.
