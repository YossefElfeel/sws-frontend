# ADR-0003 — Latin numerals (0123) in every context, including Arabic UI

- **Status:** Accepted
- **Date:** 2026-09-01
- **Decision log:** B4
- **Affects:** every screen containing a number — most visibly `M-11`, `O-02`, and the whole billing surface

## Context

Arabic can be set with Eastern Arabic-Indic numerals (٠١٢٣) or Latin numerals (0123). The
Design Playbook left this open and the decision log carried it as B4, blocking "every screen
with a number on it".

The tension is real. Eastern Arabic-Indic numerals are what many Arabic readers find most
natural in running prose. But this product is a billing surface: prices, invoice numbers,
serials, IP addresses, card entry, and WHMCS output all carry figures, and those figures move
between systems that do not agree on numeral form.

## Options considered

| Option | Verdict |
|---|---|
| **Latin (0123) everywhere** | **Accepted.** One numeral system across the marketing site, the client area, invoices, and the payment gateways. Nothing to reconcile at a boundary. |
| Eastern Arabic-Indic in the UI, Latin in invoices and payments | **Rejected.** Creates two systems and a per-screen judgement about which applies. That judgement is the defect, not the numerals. |
| Eastern Arabic-Indic everywhere | **Rejected.** Payment gateways and WHMCS emit Latin figures and are not all customisable, so this produces mixed numerals on the highest-stakes screens. |

## Decision

Latin numerals in every context, including Arabic UI. Arabic text remains RTL; only the
numerals are constrained.

## Consequences

- `tokens/tokens.json` carries the rule under `typography.rules`.
- `world.css` sets `font-variant-numeric: lining-nums tabular-nums` on `body`, so a face
  cannot silently serve old-style figures and columns of prices share a decimal point.
- `Intl.NumberFormat` is called with the `ar-EG-u-nu-latn` locale extension for Arabic, which
  is what actually forces Latin digits — an Arabic locale alone does not.
- Copy-paste between the site, WHMCS, and a bank statement no longer changes numeral form.

## Revisit if

User research with the Egyptian and Gulf audience shows Eastern Arabic-Indic numerals
materially improve comprehension or trust in a *non-financial* context. Financial contexts
stay Latin regardless.
