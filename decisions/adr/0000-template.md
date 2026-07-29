# ADR-0000 — <short title in the imperative, e.g. "Use build-time price sync">

- **Status:** proposed | accepted | superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Decision log ID:** B1 / I12 / C19 … (the row in `decisions/decision-log.md` this closes)
- **Deciders:** names, not roles
- **Affects:** screen IDs from `inventory/screens.csv`

---

## Context

What forced this decision. Include the constraint that made it non-obvious — if the answer
were obvious there would be no ADR. State what was actually verified versus assumed.

## Options considered

| Option | Cost | Risk | Verdict |
|---|---|---|---|
| A — … | | | |
| B — … | | | |
| C — … | | | rejected because … |

Record rejected options with their reasons. Six months from now someone will propose the
rejected option again, and this table is the only thing that will stop the argument from
being re-run from scratch.

## Decision

One paragraph. What we are doing, stated plainly.

## Consequences

**Accepted costs** — what gets worse, and what we agreed to live with.

**Follow-on work** — new tasks this creates. File them, don't just name them.

**Unblocks** — which `blocked_by` values to clear in `inventory/screens.csv`. Do it in the
same commit as this ADR.

## Revisit if

The specific condition that would make this decision wrong. If you cannot name one, the
decision is probably under-examined.

---

<!--
Numbering: ADR-0001 onward, in the order decisions are made — not the order of the
decision-log IDs. Filename: 0001-short-title.md

Not every decision needs an ADR. Write one when the answer carries a technical constraint a
developer must honour, or when a plausible alternative was rejected for a reason worth
preserving. Purely administrative answers (a due date, an owner) belong in the log only.
-->
