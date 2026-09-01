# Design

<!-- impeccable:design-schema 1 -->

This records the design system **as it shipped**, not as it was intended. Every value here was
read out of `tokens/dist/tokens.css` or the built artifact; where the two ever disagree, the
artifact is right and this file is stale.

Deployed: <https://sws-frontend-mu.vercel.app/> · 76 routes · AR (default) and EN · light and
dark.

---

## 1. Where the look comes from

The visual direction is **not** a concept chosen here. It is measured from the production site
at `sws.somion.ch`, because the brief pinned it there: the client area and the marketing site
have to read as one product, and the marketing site already exists.

So the primitives were sampled rather than invented — `#4E4FEB` off a production primary
button, `#020617` off its body text, Rubik because that is the face in use and because it
carries Latin and Arabic in one family. What was added is the part production does not have: a
semantic layer, a dark theme, and a set of rules that survive translation into Arabic.

**The one constraint that shapes more of this than any style decision:** PRODUCT.md records
that *no proof metric for SWS has been verified*. No uptime percentage, customer count,
certification or testimonial appears anywhere in the artifact, and `flow.mjs` greps the company
pages for the shapes a fabricated one takes. Where a page would normally carry proof it carries
a marked absence instead — the Data Centres page says outright that the facility rating will be
listed once the paperwork has been reviewed.

---

## 2. Tokens

Three layers. **Primitives are never exported** — no stylesheet can reach a raw hex, which is
what keeps this front end and the eventual WHMCS theme from drifting.

`tokens/build.mjs --check` fails the build if a semantic token exists in one theme and not the
other. That rule is why the dark theme is real rather than aspirational.

### Colour — semantic, light

| Token | Value | Used for |
|---|---|---|
| `surface-page` | `#F8F9FC` | the ground everything sits on |
| `surface-raised` | `#FFFFFF` | cards, bars, the sidebar |
| `surface-sunken` | `#F1F3F9` | wells, table heads, inset rows |
| `text-primary` | `#020617` | body and headings |
| `text-secondary` | `#4B5563` | labels, notes, meta |
| `text-disabled` | `#6B7280` | gated at 3:1, not the usual un-checked grey |
| `border-subtle` | `#E5E7EB` | hairlines between rows |
| `border-strong` | `#6B7280` | field borders, dashed slots |
| `action-primary` | `#4E4FEB` | the measured production indigo |
| `action-quiet` | `#2F30A8` | link text, where indigo is too light on white |
| `action-subtle-bg` | `#EEEEFE` | selected states, icon tiles |
| `status-success` | `#146132` | |
| `status-danger` | `#B3181B` | |
| `status-warning` | `#8A4308` | |
| `status-info` | `#1D4ED8` | |

The four status colours are **darkened from their natural values** so each clears 4.5:1 against
its own 10% tint. A status colour that only works on white is a status colour that fails inside
the banner it exists for.

### Colour — dark

Not a filter over light. Seven semantic tokens take genuinely different values:

| Token | Light | Dark |
|---|---|---|
| `surface-page` | `#F8F9FC` | `#020617` |
| `surface-raised` | `#FFFFFF` | `#141C2E` |
| `text-primary` | `#020617` | `#F8F9FC` |
| `text-secondary` | `#4B5563` | `#9CA3AF` |
| `border-subtle` | `#E5E7EB` | `#1E293B` |
| `action-primary` | `#4E4FEB` | `#9B9BF4` |
| `action-quiet` | `#2F30A8` | `#C2C2F9` |

`action-primary` lifts two steps in dark because the measured indigo reaches 4.39:1 as link
text on a dark card — close enough to pass a glance and not close enough to pass.

### Type

One family, **Rubik**, for Latin and Arabic both. Self-hosted via `@fontsource`, because a
review build that needs the network for its typography is a review build that fails in a room
with bad wifi.

| Token | Mobile | Desktop |
|---|---|---|
| `hero` | 36px | 60px |
| `display` | 30px | 40px |
| `h1` | 27px | 34px |
| `h2` | 24px | 30px |
| `h3` | 20px | 20px |
| `body-lg` | 18px | 18px |
| `body` | 16px | 16px |
| `body-sm` | 14px | 14px |
| `caption` | 12.5px | 12.5px |

`font-variant-numeric: lining-nums tabular-nums` on `body`, so figures in a column line up.

**Numerals are Latin everywhere** (ADR-0003), including inside Arabic copy, and `flow.mjs`
asserts zero Eastern Arabic digits render. Arabic never goes below weight 400.

### Spacing, radius, motion

Spacing is base-4 only: `4 8 12 16 24 32 48 64 96`. Nothing else exists, so nothing else can be
reached for.

Radius `sm 8 · md 12 · lg 16 · xl 24 · pill`. Rules `hair 1 · base 2 · heavy 3`.

Motion: `fast 140ms · base 220ms · slow 340ms`, easing `cubic-bezier(0.22, 1, 0.36, 1)`
standard and a faster exit curve. Every transition respects `prefers-reduced-motion`.

### Accessibility

Formal target **WCAG 2.2 AA**, with two AAA figures adopted as internal floors because they are
cheap and they matter on a phone:

- `touch-target-min` **44px** (AAA) — ADR-0004
- `focus-ring-width` **2px** (AAA), ring `#3B3CD4` light / `#9B9BF4` dark

`tokens/a11y-gate.mjs` runs **74 checks** and all pass. It verifies contrast pairs, focus rings
and hit areas *from the tokens*. It has been wrong once and was fixed: it passed eight banner
checks while `component.banner` declared only `danger` — a `pass` covering a real absence. It
now asserts presence before contrast.

---

## 3. Shells

Five, and the difference between them is the question the reader is asking.

| Shell | For | Chrome |
|---|---|---|
| `Layout` | marketing, ordering | masthead, category nav, cart, four-column footer, cookie bar |
| `HostingLayout` | hosting categories | `Layout` + a category rail |
| `AppShell` | the client area | sidebar, place-naming bar, account block, notifications |
| `OrderPage` / `Page` | checkout steps, company pages | `Layout` with no rail |
| `AuthShell` | sign-in and friends | one narrow card, no nav |

**The client area is an application, not another page of the site.** Someone reading it has
already signed in, so the marketing header would offer them a "Client login" button, a shopping
cart and a category nav they have finished with. `AppShell` gives it application furniture
instead: a standing navigation column grouped into four sections with counts on what is
waiting, a bar naming where you are, and no marketing chrome at all — `flow.mjs` asserts zero
`.masthead` and `.colophon` elements inside `/account`.

Density in the app is about a third tighter than marketing. These screens get read to find one
row; marketing screens get read to be persuaded.

The document scrolls and the sidebar is sticky, rather than an inner scroll pane. That reads as
an app and keeps every screen linkable, printable and capturable end to end.

---

## 4. Components

Ten in `components/`, 32 drawn icons, ~5,900 lines of CSS across six stylesheets, 911 string
keys in two languages.

`Button` — `sm | md | lg` × `primary | secondary | quiet | danger`. `danger` is for acts that
take something away; it stays quiet until you reach for it, then it is unmistakably red.

`Banner` — four severities, each carrying **ground, border and icon together**. Around one man
in twelve cannot separate red from green, so a banner that says "danger" only by being red says
nothing to him. `role="alert"` on danger and warning, `role="status"` otherwise: interrupting a
screen reader mid-sentence is right for a failure and rude for a tip. A banner with no dismiss
is not broken — some notices are not yours to silence, and the component says so by not
offering the button rather than offering an inert one.

`CookieConsent` — the most privacy-preserving default. Everything optional starts off. Reject
is *exactly* as prominent as Accept (both secondary — a filled Accept beside an outlined Reject
is the same push in a quieter register), and there is no way to dismiss it without answering.
Both of those refusals are held by gates.

`CurrencySelect` — carries the open half of I15. With an empty cart it just switches; with
items in it, it shows the old total and the new one side by side before committing. Blocking
punishes someone for looking and emptying destroys work they did not ask to lose; the actual
risk is a total changing underneath a person unnoticed.

`icons.tsx` — one stroke weight (1.75), one join, one cap. No emoji and no font glyphs: a
pictogram that changes shape with the reader's platform is not part of a design system.

---

## 5. The rules that were learned, not chosen

Each of these came out of something being visibly wrong, and each is now held by a gate.

**`dir="ltr"` on a block element does two things, and only one of them is wanted.** It isolates
the Latin run, and it flips the element's own `text-align` — which is why every domain, email
and date drifted to the far side of its own label in RTL. 72 places use `<bdi>` instead, which
isolates without touching the box. Form controls keep `dir="ltr"`: there it sets the typing
direction, which is the point.

**An arrow is a drawing.** Logical properties handle layout, but "onward" has to point the way
the reader is travelling. `IconArrow` and `IconSignOut` carry `icon--dir` and mirror under
`[dir='rtl']`. Nothing else mirrors — a globe, a shield and a wallet are the same picture in
both directions.

**An icon in a button is a flex item, and a flex item shrinks.** In narrow table cells they
collapsed to zero width while keeping their height — a one-pixel sliver where an arrow should
be, on six routes at once, invisible at review scale.

**A 38px row with a 44px pseudo-element expander gives back most of what it claims**, because on
a dense list the expanders of adjacent rows overlap and the one painted last wins the shared
strip. Rows are genuinely 44px.

**A signed amount is one LTR run.** Without isolation the sign detaches and lands on the far
side of the number: `−USD 10.00` reads as `USD 10.00−`.

**Sticky and clipping fight, and clipping wins.** A flush card clips so a table's corners follow
its radius — but when the card *is* the scroll container, the table escapes the viewport instead
of scrolling inside it.

**In RTL, an element that escapes does so past the left.** A right-only overflow probe reports
nothing at all while the page scrolls sideways.

---

## 6. Layout

Mobile-first, logical properties throughout — no mirrored stylesheet exists. Breakpoints:
600 · 700 · 768 · 900 · 1024 · 1200 · 1280.

Tables stay tables where a column of figures genuinely needs comparing, and become rows where
three fields do not need a table's machinery. One exception is deliberate: the **notification
preference grid stops being a table below 700px**, because scrolling sideways to reach a toggle
is the wrong answer on a settings screen.

The invoice keeps a document's measure (46rem) rather than filling the app's width. It is a
thing you read, print and file; a full-bleed one reads as a report.

---

## 7. What is not designed here

**Third-party frames are marked, not mocked.** Stripe's card fields and the bank's 3-D Secure
page render inside frames we neither own nor style. Drawing convincing fakes is how a reviewer
approves a screen that will never exist, so the area is a dashed slot that says whose it is. A
gate asserts it stays empty. What *is* designed is the handoff and the return.

**Email is a different medium.** `email/unified.html` is real email HTML — tables, inline
styles, no web fonts, `dir` on every table. Flexbox is unsupported in Outlook's Word engine and
RTL behaves differently there than in any browser; a React mock would prove nothing. Its colours
are literal hex copied from `tokens/dist/tokens.css` and must be re-copied by hand — no build
step can reach inside it.

**cPanel is outside our control.** The transition screen names what is about to change —
English, left-to-right, different type — because dropping someone in unwarned is the moment the
product stops feeling like one product.

---

## 8. Gates

Design intent that is not enforced is design intent that lasts one sprint.

| Gate | What it holds |
|---|---|
| `tokens/build.mjs --check` | dist in sync; both themes complete |
| `tokens/a11y-gate.mjs` | 74 checks — contrast, focus, hit area |
| `scripts/flow.mjs` | **62 checks** against a running build |
| `scripts/capture.mjs` | 76 routes × 2 viewports — overflow, empty main, console errors |
| `scripts/deadends.mjs` | no control wired to nothing, no form that only swallows its event, no screen without a way onward |

`deadends.mjs` exists because "some buttons don't work" is the one defect a screenshot never
shows and a typecheck never catches. It ran once by hand and found twenty-one. Its four
exceptions are listed with reasons rather than silenced, and an exception that stops matching
is itself reported — so the list cannot rot into a blanket.

`flow.mjs` covers, among others: every control clears 44px at 390 and 1440 (hit-tested outward
from the edges, not measured from the box, so a legitimate pseudo-element expander counts); no
icon is crushed by its flex parent; forward arrows mirror in Arabic and only they do; every
gateway reaches its own next screen; the proration total equals its own lines; no invented proof
on the company pages; all four banner severities differ by more than colour; reject is as
prominent as accept.

---

## 9. Open

| | |
|---|---|
| **B1** | payment gateway — blocks C-17 |
| **I12** | invoice PDF — blocks C-16 |
| **I13/I14** | closed here in the direction the decision log recommends; owner has not ratified |
| **I15** | closed here as *show both totals*; one component to change if ruled otherwise |
| **I16** | dark mode at launch — tokens and toggle ship either way |
| **C19** | status page build-vs-buy — decides the data source, not the design |
| **C22** | visual identity is being built inside the project: +10–15 days, uncounted |
| **G4** | 50 email templates × 4 languages = 200; estimate was built on 50 |
| **G8** | **a live password sits in `00-source/` and in git history — rotate it** |

Inventory: **74 built, 8 folded, 2 blocked.**
