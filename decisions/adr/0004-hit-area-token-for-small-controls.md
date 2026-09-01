# ADR-0004 — A `hit-area` token, so the gate can verify small controls

- **Status:** Accepted
- **Date:** 2026-09-01
- **Gap:** G11 (remaining half)
- **Supersedes nothing. Completes ADR-0002.**

## Context

ADR-0002 raised the default button to 44px and left `sm` (32px) open. `sm` meets the WCAG 2.2
AA bar (SC 2.5.8, 24×24) but sits below the project's own 44px rule, so the accessibility gate
reported it as a standing `WARN`.

Design Playbook §11 already endorses the obvious fix — "small icons need a click area larger
than their visible shape" — and ADR-0002 explicitly rejected relying on it, for one reason:

> "it needs a `hit-area` token for the gate to verify. An unverifiable promise is what
> produced this finding in the first place."

That is the whole issue. The pattern was never wrong; it was unmeasurable.

## Options considered

| Option | Verdict |
|---|---|
| **Declare `hit-area` as a token and teach the gate to read it** | **Accepted.** Turns the Playbook's convention into something a build can fail on. |
| Restrict `sm` to desktop with enforced spacing | **Rejected as the primary fix.** Legitimate for dense pointer contexts, but it is a usage rule nothing verifies, which is the failure mode being corrected. Retained as guidance in the component's own docs. |
| Raise `sm` to 44px | **Rejected.** Collapses the scale to 44/48 and removes the size the dense contexts need. |

## Decision

`component.button.hit-area = 44px`, implemented as a pseudo-element that extends the pointer
target past the visible box, and `tokens/a11y-gate.mjs` extended to score a component by
`max(visible size, declared hit area)`.

The same token now covers `checkbox` (20px visible), `radio` (20px), `switch` (24px), and
standalone `link`, none of which had a verified size before.

## Consequences

- The gate's target-size group went from 3 checks (2 pass, 1 warn) to 12 checks, all passing.
- The 17 `TODO` verdicts across the interactive components are now zero: every component in
  `accessibility.interactive-components` declares a size or a hit area, and a focus ring.
- The gate reports *how* a control passes — "32px visible via 44px hit area" — so a reviewer
  can see the mechanism rather than just the verdict.
- A future component that ships small without declaring a hit area fails, rather than warning.

## Revisit if

The team adopts a formal AAA commitment, at which point `--strict` becomes the default gate
mode and the distinction between pass-by-size and pass-by-hit-area may need separating.
