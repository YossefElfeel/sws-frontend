# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript (user-chosen, 2026-09-01).

Scope note: this is the **prototype** stack. It is not a decision about the production
marketing site or the WHMCS theme, both of which remain open (see B6 in
`decisions/decision-log.md`).

## Users

Three distinct audiences, all real:

1. **Hosting customers** — the people the interface is designed for.
   - **Egypt / Gulf:** Arabic, phone-dominant traffic, local wallets (Vodafone Cash,
     Etisalat Cash, Orange Cash, WE Pay), price-sensitive. Arrive almost entirely from search.
   - **Europe / Switzerland:** English/French/German, card payment, evaluate on compliance,
     data residency, and reliability before price.
   - Job: compare hosting plans, judge whether the provider is trustworthy, buy, then manage
     services, invoices, and support tickets.

2. **Management** — judges the prototype and approves or rejects the direction before a
   28-week build is committed.

3. **UI/UX designers** — use the prototype as a working tool covering all flows and all
   scenarios, not only the happy paths.

## Product Purpose

Somion Web Services (SWS) sells shared hosting, WordPress hosting, cloud hosting, VPS,
email hosting, domains, and SSL certificates.

The product spans two systems: a marketing site (`sws.somion.ch`) and a WHMCS client area
(`clients.somion.ch`). This work is a full redesign of both. Success for the immediate
deliverable is a prototype that lets management approve a direction and lets designers work
against real states rather than static mockups.

## Positioning

**Swiss infrastructure with Egyptian support and pricing — stated openly, as the offer.**
(Decision P25, resolved 2026-09-01.)

Not a Swiss provider concealing Egyptian operations, and not an Egyptian provider borrowing a
Swiss face. The live site currently attempts both without declaring either, and convinces at
neither. The resolved position makes the duality explicit: European-grade infrastructure and
compliance, with Arabic-language support, local payment methods, and regional pricing.

This is the claim a neighbouring provider cannot truthfully copy — Egyptian hosts lack the
Swiss side, European hosts lack Arabic support and local wallets.

## Operating Context

- **Two subdomains.** The purchase path crosses from the marketing site to WHMCS at
  Add-to-Cart. The visitor session is severed at that boundary by default.
- **WHMCS constrains the design.** Of 84 inventoried screens: 33 `full` (free design),
  43 `limited` (WHMCS imposes HTML structure; every decision needs developer confirmation),
  8 `closed` (no design control at all).
- **8 currencies and 7 languages are live today.** Production keeps 4 languages
  (Arabic, English, French, German).
- **Payment reality:** four Egyptian wallets in the footer match Paymob's coverage exactly.
  PayPal and cryptocurrency logos are displayed but exist in no payment flow.
- **Reference implementation:** the WHMCS client area runs the Lagom 2 theme. Its screenshots
  are a **functional** reference only — they show what a screen must do, not how it must look
  (C21, resolved 2026-09-01).

## Capabilities and Constraints

**Inventoried scope:** 84 screens / 355 states (`inventory/screens.csv`).

**Prototype scope:** 286 states across 76 screens.
- The 8 `closed` screens (69 states) ship as annotated stubs.
- `S-02` Email Templates (50 states) is **excluded** — table-based HTML without Flexbox or
  Grid, and RTL behaves differently in Outlook and Gmail than on the web. Building it in
  React would prove nothing about it. It is a separate track with its own tooling.

**Confirmed constraints:**
- Numerals are **Latin (0123)** in every context, including Arabic UI (B4).
- Design tokens carry both light and dark themes and the build fails if a semantic token
  exists in one theme and not the other. The prototype ships **light only**.
- No component may reference a primitive token; no colour value may exist outside
  `tokens/tokens.json`; spacing comes only from the base-4 scale.
- Button and column widths are sized against **German** (+30% over English), which governs
  width even though German is not rendered in the prototype.
- No font weight below 400 for Arabic.

**Explicitly undecided — do not invent answers:**
- Target WHMCS version and whether it is frozen (B6).
- Who fills the ~1200 price fields across 8 currencies, and whether all 8 are actually
  populated or some display a default conversion (B5).
- Egyptian payment provider — Paymob, Fawry, or Kashier (B1).
- Whether PayPal and cryptocurrency are implemented or removed from the footer (B7b).

## Brand Commitments

- **Name:** Somion Web Services / SWS. Domain `.ch`. Footer carries "Made by Somion".
- **Visual identity is being built within this project** (C22, resolved 2026-09-01). The
  purple palette in `tokens/tokens.json` originates from the v1.1 Design Playbook and is
  **proposed, not approved**. It is available as a starting point, not a constraint.
- **Arabic typeface: Cairo** (user-chosen, 2026-09-01).
- **Accessibility commitment: formal WCAG 2.2 AA** (I17), plus two internal rules that exceed
  AA and are held deliberately: 44×44 minimum touch targets and 2px focus rings.

## Evidence on Hand

**No verified proof metrics exist. This is the single most important constraint on the
design.** (Confirmed 2026-09-01.)

The live homepage publishes `1+ Million Active Websites`, `500K Global Servers`, and
`+48 Web Apps`. No source is documented for any of them (B7c), and half a million servers is
not plausible for a company selling four shared-hosting plans.

**These numbers must not be reproduced as fact, and must not be replaced with invented ones.**
Where the design needs proof, it either earns trust without statistics or leaves an explicitly
marked slot to be filled once something is verified.

**What actually exists:**
- Live site copy and pricing — with a known unresolved conflict: the hero advertises `$2.50`
  while the cheapest store plan is `250.00 EGP` (B7d).
- `inventory/screens.csv` — 84 screens, 355 states, verified by row count.
- `tokens/tokens.json` and `tokens/dist/tokens.css` — a working three-layer token system with
  an automated WCAG gate currently passing 42/42 contrast checks.
- `00-source/` — the v1.1 Build Plan, Design Playbook, and UI/UX spec.

**Confirmed absences future work must not fill with invention:**
- No certifications, ISO registrations, named data centre, published SLA, uptime record,
  customer count, or years-in-operation figure has been confirmed.
- No customer testimonials or case studies exist.
- No legal pages exist on the live site at all — no privacy policy, terms, refund policy,
  SLA, or acceptable-use policy.

## Product Principles

1. **Never assert what is not verified.** No invented statistics, partner logos,
   testimonials, certifications, or awards. Where proof is absent, the design earns trust by
   other means — clarity, precision, transparent pricing, and visible competence.
2. **The duality is the offer.** Swiss infrastructure and Egyptian support/pricing are stated
   together and explicitly. Blending them into vague international nonspecificity is the
   failure mode to avoid.
3. **Continuity across the seam.** The marketing → WHMCS transition is the moment trust is
   lost. Both sides must read as one company, which is the entire reason the design system
   exists as a shared file rather than a document.
4. **Show the constraint, don't promise past it.** 43 screens are WHMCS-limited. The
   prototype marks what still needs developer confirmation instead of presenting an
   unbuildable design for approval.
5. **Arabic is first-class, not a translation layer.** RTL is a native direction, not a
   mirrored afterthought. Cairo, Latin numerals, no weight below 400, and text that was
   written in Arabic rather than translated into it.

## Accessibility & Inclusion

**Formal standard: WCAG 2.2 Level AA.**

Two internal rules deliberately exceed AA and are enforced by `tokens/a11y-gate.mjs`:
- 44×44 minimum touch targets (SC 2.5.5 is AAA; the AA bar is 24×24) — justified by
  phone-dominant Egyptian and Gulf traffic.
- 2px focus ring thickness (SC 2.4.13 is AAA; AA requires visibility without a thickness).

The gate classifies AA failures as blocking and AAA shortfalls as warnings, matching the
formal AA commitment while keeping the internal bar visible.

**Bidirectional text** is a core requirement, not an enhancement: Arabic RTL layout with
Latin numerals and Latin product names embedded inside Arabic sentences.
