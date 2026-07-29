# Design Tokens

`tokens.json` — the Design Playbook §3 token system in machine-readable form, plus
`contrast-check.mjs`, an automated WCAG gate.

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

## Contrast gate

```bash
node tokens/contrast-check.mjs          # exits 1 on any failure
node tokens/contrast-check.mjs --warn   # report only, always exits 0
```

Checks 21 foreground/background pairs across both themes — 42 checks — against the thresholds
in `tokens.accessibility`. It includes the composited banner backgrounds (a status colour at
12% over a surface, with status-coloured text on top), which are the case a designer is least
likely to check by eye.

Playbook §3.2 is explicit that this must be automated:

> *"Do not trust the contrast numbers — test them. The pairs that usually fail: secondary text
> on raised surfaces in dark mode, text over coloured status backgrounds, and disabled text."*

### Current result: 4 failures out of 42

**Run on 2026-07-29 against the values as transcribed from the Playbook.**

| Theme | Pair | Ratio | Required |
|---|---|---|---|
| light | `border-strong` on `surface-base` | **1.56:1** | 3:1 |
| light | `border-strong` on `surface-raised` | **1.67:1** | 3:1 |
| dark | `border-strong` on `surface-base` | **1.74:1** | 3:1 |
| dark | `border-strong` on `surface-raised` | **1.57:1** | 3:1 |

`border-strong` is the **input field border**. Failing WCAG 2.2 SC 1.4.11 (Non-text Contrast)
means the boundary of every text input, select, and textarea is not perceivable to low-vision
users. It is not a cosmetic finding — form fields are how every purchase and every support
request is made.

The Playbook predicted this exact class of failure: *"light grey borders usually fail — test
them."* They do, in both themes, by a wide margin.

### Recommended fix

Move `border-strong` to `neutral-500` (`#7B7389`) in **both** themes. Verified ratios:

| | vs `surface-base` | vs `surface-raised` |
|---|---|---|
| light | 4.23:1 ✅ | 4.51:1 ✅ |
| dark | 4.07:1 ✅ | 3.67:1 ✅ |

`neutral-400` is not enough (2.50:1 / 2.67:1 in light — still fails). `neutral-500` is the
first step that clears 3:1 everywhere, and it happens to work for both themes, so one value
serves both.

**Not applied.** Changing a foundational border colour is the design lead's decision, and
brand identity (**C22**) is not settled. The finding is recorded; the fix is one line in
`tokens.json` when it is approved:

```jsonc
// semantic.light.border-strong   {primitive.neutral.300} → {primitive.neutral.500}
// semantic.dark.border-strong    {primitive.neutral.700} → {primitive.neutral.500}
```

Then re-run the gate. It should report 42/42.

**Fix in the semantic layer only.** Every component that references `border-strong` — inputs,
selects, textareas, secondary buttons — corrects at once. Patching an individual component is
how the three-layer structure gets destroyed.

---

## Exporting to two environments

One source, two consumers. Generate, never hand-copy.

```
tokens.json
   │
   ├──▶  marketing/    CSS custom properties  :root { --color-action-primary: … }
   │                                          [data-theme="dark"] { … }
   │
   └──▶  whmcs-theme/  the same CSS custom properties, imported by the Lagom child theme
```

Both consumers get the **same generated file**. The build fails if the export is stale relative
to `tokens.json`, so drift is impossible rather than merely discouraged.

For RTL, the generated CSS uses logical properties — `margin-inline-start`, not `margin-left`.
Playbook §4.1: think in *start/end*, not *left/right*, and the browser handles both directions
from `dir="rtl"` on the document. The alternative — a separate `rtl.css` — costs 30–40% ongoing
maintenance and is where most RTL bugs come from.

---

## What is not in here yet

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

---

## Rules that are not negotiable

1. No component token references a primitive.
2. No colour value outside this file appears in any stylesheet.
3. No spacing value outside the base-4 scale: `4 8 12 16 24 32 48 64 96`.
4. No font weight below 400 for Arabic — 300 renders Arabic near-illegible.
5. Test button and column widths against **German**, not English. German runs +30% and is the
   width-governing language while it remains enabled (**B7a**).
6. The contrast gate passes before every release.
