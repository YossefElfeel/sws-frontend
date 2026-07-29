# Design Tokens

`tokens.json` — the Design Playbook §3 token system in machine-readable form, plus
`a11y-gate.mjs`, an automated WCAG gate covering contrast, target size, and focus indicators.

---

## Why this exists as a file

Build Plan §8.1 recommends the hybrid architecture — separate marketing site, WHMCS for
billing — and then names the condition it depends on:

> *"The decisive condition for this option to succeed: **one design system exported to two
> environments** (shared CSS tokens). Without it the two sites will look like two different
> companies at the moment the user goes from 'Order Now' to the cart — which is exactly the
> moment trust is lost."*

Two environments cannot share a design system that exists only as a colour table in an HTML
document. Somebody types the hex values into the marketing site, somebody else types them into
the WHMCS theme, and they drift. This file is what makes the shared system a fact rather than
an intention.

**Status: PROPOSED, not approved.** The Playbook says the values are *"proposed to start with,
not final"*, and decision **C22** (is there an approved SWS brand identity, or is it built
inside the project?) is still open. Treat these as a working baseline.

---

## The three layers

```
primitive          purple-500: #5B2E91        raw values, named by what they are
    │
    ▼
semantic           action-primary  →  { light: purple-500, dark: purple-300 }
    │                                  ↑ dark mode happens HERE and only here
    ▼
component          button-primary-bg  →  action-primary
```

**The governing rule: no component token may reference a primitive directly.**

This is what makes dark mode a values swap in one layer instead of a redesign of 84 screens.
Break the rule once and dark mode gets fixed screen by screen forever after. The Playbook puts
it as a diagnostic: *if you find yourself fixing individual screens in dark mode, the problem
is in the tokens, not the screen.*

---

## Accessibility gate

```bash
node tokens/a11y-gate.mjs            # exits 1 on any AA failure
node tokens/a11y-gate.mjs --strict   # also exits 1 on AAA warnings
node tokens/a11y-gate.mjs --warn     # report only, always exits 0
```

**64 checks in three groups**, all read from `tokens.accessibility`:

| Group | What it checks | Count |
|---|---|---|
| **Contrast** | 21 foreground/background pairs × 2 themes, including composited banner backgrounds (a status colour at 12% over a surface, with status-coloured text on it) — the case a designer is least likely to catch by eye | 42 |
| **Target size** | Declared interactive dimensions against the 24px AA and 44px project minimums | 12 |
| **Focus indicator** | Every interactive component declares a focus ring, and it is thick enough | 10 |

Playbook §3.2 and §2.3 both demand this be automated:

> *"Do not trust the contrast numbers — test them."*
>
> *"Forgetting the `focus` state — the most forgotten and the most important for accessibility."*

### Verdicts

| | Meaning | Blocks? |
|---|---|---|
| `pass` | Meets the threshold | — |
| `FAIL` | Violates **WCAG 2.2 AA** | Yes — exit 1 |
| `WARN` | Violates an **AAA** rule the Playbook states as if it were AA | Only with `--strict` |
| `TODO` | No token declared — **nothing was verified** | No, but it is not a pass |

`TODO` exists so an unchecked component never reads as a compliant one. 17 of the 64 checks are
currently `TODO`, which is the honest state of a component library that is 2 components deep on
dimensions out of the 56 planned.

### The Playbook mixes AA and AAA rules

Worth knowing before anyone reports "we are WCAG 2.2 AA compliant". Two of the Playbook §11
rules are not AA:

| Playbook rule | Actual criterion | Level | The real AA bar |
|---|---|---|---|
| Touch target ≥ 44×44 | SC 2.5.5 Target Size (Enhanced) | **AAA** | SC 2.5.8 — 24×24 |
| Focus ring 2px | SC 2.4.13 Focus Appearance | **AAA** | SC 2.4.7 — visible, no thickness specified |
| Contrast 4.5:1 / 3:1 | SC 1.4.3 / 1.4.11 | AA ✓ | — |

Decision **I17** commits to AA, so the gate treats AAA violations as warnings. The team is
either committing to more than it realises, or will quietly drop these and still believe it is
compliant. Either is fine — but decide it rather than drift into it.

### Current result — 2026-07-29

```
64 checks: 46 pass · 0 fail · 1 warn · 17 not specified      exit 0
```

**Contrast: 42 / 42 pass** in both themes, after the `border-strong` fix below.

**Target size: 1 warning.** The default button was raised to 44px (ADR-0002); `sm` is still
under the rule:

| Component | Size | Verdict |
|---|---|---|
| Button `sm` | 32px | ⚠️ meets AA (24px), under the 44px project rule |
| Button `md` — **the default** | 40px → **44px** | ✅ raised, ADR-0002 |
| Button `lg` | 48px | ✅ |

The finding was an internal contradiction in the source document, not a token error: Playbook
§7.1 set `md` (40px) as the **default**, and Playbook §11 mandates targets ≥ 44×44 — so the
most-used control in the product violated the project's own rule. The Playbook hints at the
tension (*"use `lg` for primary actions on mobile"*), but that is a convention, and conventions
get skipped under deadline.

> ⚠️ **Side effect worth knowing:** the size scale is now **32 / 44 / 48** — steps of 12px then
> 4px. `lg` is only 4px taller than `md`, which is close to imperceptible, so the three-size
> scale is effectively two sizes and a rounding error. Real design debt, tracked under G11.
> Fixing it means moving `lg` or dropping to two sizes — a component API change.

**`sm` (32px) is still open.** Three ways to close it:

1. **Restrict `sm` to desktop-only** with enforced spacing — defensible for dense contexts
   (table row actions, toolbars) where pointer input dominates and the AA bar of 24×24 is met.
2. **Give it a `hit-area` token** larger than its visible box. Playbook §11 already endorses
   this (*"small icons need a click area wider than their visible shape"*) — but the gate needs
   the token to verify it, otherwise it is an untested promise.
3. **Raise it**, which collapses the scale further.

Tracked in **G11**. See **ADR-0002** for the reasoning behind the `md` change.

**Focus indicator: 2 pass, 8 not specified.** `button` and `input` declare a 2px ring; the
other eight interactive components have no focus token yet. Playbook §2.3 calls `focus` the
most-forgotten state, so the `TODO` count is the point — it goes down as the library is built,
and it never silently reads as a pass.

### Resolved — `border-strong` raised to `neutral-500`

On first run the gate failed **4 of 42** pairs, all on `border-strong` — the **input field
border** — in both themes:

| Theme | Pair | Was | Now | Required |
|---|---|---|---|---|
| light | `border-strong` on `surface-base` | 1.56:1 ❌ | **4.23:1** ✅ | 3:1 |
| light | `border-strong` on `surface-raised` | 1.67:1 ❌ | **4.51:1** ✅ | 3:1 |
| dark | `border-strong` on `surface-base` | 1.74:1 ❌ | **4.07:1** ✅ | 3:1 |
| dark | `border-strong` on `surface-raised` | 1.57:1 ❌ | **3.67:1** ✅ | 3:1 |

Failing WCAG 2.2 SC 1.4.11 (Non-text Contrast) meant the boundary of every text input, select
and textarea was not perceivable to low-vision users. Not a cosmetic finding — form fields are
how every purchase and every support request is made. The Playbook predicted exactly this
class of failure: *"light grey borders usually fail — test them."* They did, in both themes,
by a wide margin.

**Applied 2026-07-29:**

```jsonc
// semantic.light.border-strong   {primitive.neutral.300} → {primitive.neutral.500}
// semantic.dark.border-strong    {primitive.neutral.700} → {primitive.neutral.500}
```

`neutral-400` was not enough (2.50:1 / 2.67:1 in light — still failing). `neutral-500`
(`#7B7389`) is the first step that clears 3:1 everywhere, and it happens to serve **both**
themes, so one value covers the light and dark cases.

> ⚠️ **This value now differs from the Design Playbook §3.2 table on purpose.** The Playbook is
> a dated snapshot; this file is the living state (see the governance rule in the root
> `README.md`). Do not "correct" `border-strong` back to `neutral-300` / `neutral-700` to make
> it match the document — that reintroduces the accessibility failure. The `$description` on
> both tokens records this. If the Playbook is reissued, the table should be updated to match
> this file, not the reverse.

**Fixed in the semantic layer only.** Every component referencing `border-strong` — inputs,
selects, textareas, secondary buttons — corrected at once. That is the three-layer structure
doing its job: one value changed, no component touched, no screen revisited.

Brand identity (**C22**) is still open, so all values here remain proposed. If the palette
changes, re-run the gate before approving it.

---

## Export pipeline

```bash
node tokens/build.mjs           # validate, then write dist/tokens.css
node tokens/build.mjs --check   # validate, then fail if dist/ is stale  (CI)
```

One source, one generated file, two consumers. Nobody hand-copies a value.

```
tokens.json
   │
   ▼  node tokens/build.mjs
dist/tokens.css                115 custom properties
   │
   ├──▶  marketing/            imported directly
   └──▶  whmcs-theme/          imported by the Lagom 2 child theme
```

`dist/tokens.css` is **committed** — same reasoning as `prices.json` in
`technical/pricing-sync.md`. Consumers can use it without running a build, a token change shows
up as a reviewable diff, and `--check` makes drift a build failure rather than a discovery.

### Three choices worth knowing about

**1. Primitives are not exported.** There is no `--sws-purple-500` in the output. The rule that
components must not reference primitives is not documented and hoped for — it is unbreakable,
because the variable a developer would need simply does not exist in CSS. The rule is enforced
at the API boundary rather than in review.

**2. Component tokens are emitted once, as `var()` references.**

```css
--sws-button-primary-bg: var(--sws-action-primary);
```

Emitted a single time in `:root`. When the theme flips, the semantic variable changes and every
component follows through the cascade. No component token is duplicated per theme — which is
the three-layer structure paying off in the generated output, not just in the source.

**3. Everything is prefixed `--sws-`.** Lagom 2 ships its own custom properties; an unprefixed
`--surface-base` would be a collision waiting to happen inside the WHMCS theme.

### What the build validates

The build **fails** — it does not warn — on any of these:

| Check | Why it matters |
|---|---|
| A component references a primitive | The governing rule. Breaks dark mode the moment it happens. |
| A semantic token exists in one theme but not the other | Silently breaks the missing theme; nothing else would catch it. |
| Any reference does not resolve | Would emit a broken or empty value. |
| `dist/` is stale (`--check`) | The whole point of a single source. |

All five paths are tested: injecting a primitive reference, deleting a dark-theme token,
hand-editing the generated file, and changing `tokens.json` without rebuilding all exit 1.

### Theme switching

```css
:root                                   { /* light */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"])       { /* dark by OS preference */ }
}
:root[data-theme="dark"]                { /* dark by explicit choice */ }
```

Spec §4.3 requires the toggle to persist the user's choice, so `data-theme` must win over the
OS preference **in both directions** — a user who picks light on a dark-mode OS gets light.

### Alpha-composited tokens

The banner tints (a status colour at 12% over a surface) are the one exception to "emitted
once": the composite differs per theme, so they are pre-computed as `rgba()` in each theme
block. `color-mix()` would allow a single emission, but browser support scope is still open
(**C23**), and verbosity is free in a generated file while a broken banner on an older Safari
is not.

### Breakpoints are reference-only

CSS custom properties **cannot** be used in media query conditions. The breakpoint values are
emitted as a comment block so the numbers are in front of you when writing one, but they have
to be typed as literals. If a build step needs them programmatically, read `tokens.json`
directly rather than adding a second generated format.

### RTL

These tokens are direction-neutral values; direction is handled where they are *used*. Always
reach for logical properties — `margin-inline-start`, `padding-inline-end`, `inset-inline-start`
— never the physical equivalents. With `dir="rtl"` on the document the browser mirrors the
layout itself. Playbook §4.1: think in *start/end*, not *left/right*. The alternative, a
separate `rtl.css`, costs 30–40% ongoing maintenance and is where most RTL bugs come from.

---

## What is not in here yet

- **Dimensions for 8 of the 10 interactive components.** Only `button` and `input` declare
  sizes and focus rings. The gate reports the rest as `TODO` — see the count above. Add
  `height-*`/`hit-area` and `focus-ring-width` as each component is designed, and the `TODO`
  count falls on its own.
- **Disabled-state tokens.** Playbook §3.2 names disabled text as a usual contrast failure.
  There is no disabled token to test yet; add it and a matching gate pair together.
- **Icon mirroring metadata.** Playbook §4.2 requires every icon to be tagged `mirror` or
  `no-mirror` (next/back arrows mirror; upload arrows, clocks, logos, card marks do not).
  Without the tag a developer decides case by case and gets it wrong. Belongs here once the
  icon set is chosen.
- **The Arabic font choice.** Playbook §7.3 recommends IBM Plex Sans Arabic. Not recorded as a
  token until confirmed, and it interacts with the < 150KB subset budget in
  `technical/url-and-seo-map.md`.
- **Motion tokens.** Duration and easing, with `prefers-reduced-motion` handling.
- **Elevation.** Deliberately absent — dark mode raises surfaces with lightness, not shadow, so
  a shared shadow scale would be misleading.

> The gate can only check what the tokens declare. It verifies **colour, declared size, and
> declared focus thickness** — it cannot verify keyboard tab order, focus visibility against
> adjacent elements, screen-reader labelling, or whether a 44px hit area is actually applied in
> the built CSS. Those still need the manual review in Playbook §13. The gate narrows what
> humans must check; it does not replace them.

---

## Rules that are not negotiable

1. No component token references a primitive.
2. No colour value outside this file appears in any stylesheet.
3. No spacing value outside the base-4 scale: `4 8 12 16 24 32 48 64 96`.
4. No font weight below 400 for Arabic — 300 renders Arabic near-illegible.
5. Test button and column widths against **German**, not English. German runs +30% and is the
   width-governing language while it remains enabled (**B7a**).
6. The contrast gate passes before every release.
