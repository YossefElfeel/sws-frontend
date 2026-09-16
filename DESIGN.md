---
name: Orgtik Web Services
description: Swiss infrastructure with Egyptian support and pricing, stated openly, across a bilingual marketing site and WHMCS client area.
colors:
  surface-page: "#F8F9FC"
  surface-raised: "#FFFFFF"
  surface-sunken: "#F1F3F9"
  text-primary: "#020617"
  text-secondary: "#4B5563"
  text-disabled: "#6B7280"
  text-on-action: "#FFFFFF"
  border-subtle: "#E5E7EB"
  border-strong: "#6B7280"
  action-primary: "#4E4FEB"
  action-primary-hover: "#3B3CD4"
  action-quiet: "#2F30A8"
  action-subtle-bg: "#EEEEFE"
  focus-ring: "#3B3CD4"
  status-success: "#146132"
  status-danger: "#B3181B"
  status-warning: "#8A4308"
  status-info: "#1D4ED8"
typography:
  hero:
    fontFamily: "Rubik, system-ui, -apple-system, sans-serif"
    fontSize: "60px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  display:
    fontFamily: "Rubik, system-ui, -apple-system, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Rubik, system-ui, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Rubik, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Rubik, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
    fontFeature: "lining-nums tabular-nums"
  label:
    fontFamily: "Rubik, system-ui, -apple-system, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "24": "24px"
  "32": "32px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.action-primary}"
    textColor: "{colors.text-on-action}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.action-primary-hover}"
    textColor: "{colors.text-on-action}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.action-quiet}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "44px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.status-danger}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "44px"
  button-disabled:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-disabled}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "32px"
  card-feature:
    backgroundColor: "{colors.action-subtle-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "32px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  tag-ok:
    backgroundColor: "rgba(20, 97, 50, 0.1)"
    textColor: "{colors.status-success}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  tag-bad:
    backgroundColor: "rgba(179, 24, 27, 0.1)"
    textColor: "{colors.status-danger}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---
# Design

<!-- impeccable:design-schema 1 -->

This records the design system **as it shipped**, not as it was intended. Every value here was
read out of `tokens/dist/tokens.css` or the built artifact; where the two ever disagree, the
artifact is right and this file is stale.

Deployed: <https://sws-frontend-mu.vercel.app/> · 118 routes · AR (default) and EN · light and
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

**Tracking is a token, not a per-component decision.** The scale above carried size, line-height
and weight but no letter-spacing, so each component picked its own — ten distinct values in the
client area alone, four of them on the dashboard at once. Four roles cover all of them:

| Token | Value | For |
|---|---|---|
| `tracking-tight` | `-0.02em` | figures at 30px and up, where the default fit is loose |
| `tracking-snug` | `-0.01em` | headings, screen titles, card headings |
| `tracking-normal` | `0` | body — and every Arabic run, whose letterforms join |
| `tracking-wide` | `0.06em` | Latin small-caps labels: table heads, group labels |
| `tracking-widest` | `0.4em` | a code typed one character at a time |

**Numerals are Latin everywhere** (ADR-0003), including inside Arabic copy, and `flow.mjs`
asserts zero Eastern Arabic digits render. Arabic never goes below weight 400.

### Spacing, radius, motion

Spacing is base-4 only: `4 8 12 16 24 32 48 64 96`. Nothing else exists, so nothing else can be
reached for.

Radius `sm 8 · md 12 · lg 16 · xl 24 · pill`. Rules `hair 1 · base 2 · heavy 3`.

Radius is assigned by level, not by taste: **`lg` is card level, `md` is a form control and a
block inside a card, `sm` is a button and the small affordances, `pill` is a chip.** `xl` is a
marketing radius and does not appear in the client area. Before the audit it did, on two
screens, alongside `md` stat tiles and `lg` cards — three card radii on one product.

Form controls moved from `sm` to `md` on 2026-09-14. The client area had two answers to "what
shape is a control": the table search and its filters were `pill`, and every field beside them
was `sm`. A 9999px radius reads as a chip, so nine screens opened with a control that looked
like a tag. One radius for everything a person types or picks in — input, textarea, select,
search, filter — settles it, and `md` is the step that reads as a field next to a `lg` card
without reading as a chip. Buttons stayed at `sm`: a button is a filled affordance, not a
frame you put something into, and the two are meant to be told apart.

Motion: `fast 140ms · base 220ms · slow 340ms`, easing `cubic-bezier(0.22, 1, 0.36, 1)`
standard and a faster exit curve. Every transition respects `prefers-reduced-motion`.

### The scales added on 2026-09-09

Five groups were added because five kinds of value were being decided in the stylesheets rather
than in the token file. The count is the number of raw values each one retired.

| Group | Steps | Retired |
|---|---|---|
| `weight` | `regular 400 · medium 500 · semibold 600 · bold 700` | 134 raw numbers |
| `layer` | `behind · base · raised · sticky · bar · scrim · drawer · popover · consent · toast` | 9 hand-picked z-indexes |
| `leading` | `flat 1 · tight 1.1 · snug 1.3 · normal 1.5 · loose 1.7` | line heights outside the type roles |
| `size` | `icon · control · bar · tile · field · card · panel · column · table · prose · document · shell` | 62 raw `rem` across 28 values |
| `elevation` | `flat · card · raised · over` — per theme | see §4 |

`weight` has no step below 400 and will not get one: Arabic letterforms lose their joins, and
the rule was previously enforceable only by eye. `layer` leaves gaps between its steps so a new
overlay can be inserted without renumbering the ones around it.

`tracking` gained a sixth step, `label 0.1em`. The scale ran `wide 0.06em` then `widest 0.4em`,
and nine real values sat in that gap — 0.04, 0.08, 0.1, 0.14, 0.18 — so every uppercase label
invented its own. 28 hardcoded letter-spacings now resolve to the scale, and the four font sizes
below the 12.5px caption floor are gone: the masthead wordmark, its strapline and the cart count
were 13px, 10px and 11px, which this file elsewhere calls apologies rather than sizes.

### Accessibility

Formal target **WCAG 2.2 AA**, with two AAA figures adopted as internal floors because they are
cheap and they matter on a phone:

- `touch-target-min` **44px** (AAA) — ADR-0004
- `focus-ring-width` **2px** (AAA), ring `#3B3CD4` light / `#9B9BF4` dark

`tokens/a11y-gate.mjs` runs **84 checks** and all pass. It verifies contrast pairs, focus rings
and hit areas *from the tokens*. It has been wrong once and was fixed: it passed eight banner
checks while `component.banner` declared only `danger` — a `pass` covering a real absence. It
now asserts presence before contrast.

`scripts/flow.mjs` has since been caught by the same class of fault, and worse. Two of its four
fabricated-proof patterns carried their `\b` word boundaries as literal backspace bytes, so both
required a control character in the page text and neither could match anything a browser is able
to render. The uptime and data-centre-tier assertions had been reporting a pass while testing for
nothing — on the one rule PRODUCT.md calls non-negotiable. Repaired and verified against four
sample claims that all four now catch. The lesson is the banner lesson again: a gate is not
trustworthy because it is green, only because it has been shown to go red.

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

**Every menu collapses, and every menu arrives open.** The four sidebar groups and both
groups on each rail — the hosting categories and the eight pages of a domain — are disclosures
on the same control: a heading with a chevron, `aria-expanded`, and the links `hidden` rather
than unmounted, so a shut group is one press away and find-in-page still reaches it. Open is
the state you arrive in, because a column that greets you closed is four words and no
navigation, and the link you came for is behind a guess about which word contains it. What a
reader closes stays closed for as long as the tab lives, across every navigation. Under 900px a
rail is a chip strip with no heading to press, so its groups are always open there.

Density in the app is about a third tighter than marketing. These screens get read to find one
row; marketing screens get read to be persuaded.

The document scrolls and the sidebar is sticky, rather than an inner scroll pane. That reads as
an app and keeps every screen linkable, printable and capturable end to end.

**A domain is eight flat routes behind one rail.** Four contact records alone are forty fields,
so domain management is not one screen: `DomainRail` brings the `.with-rail` idiom from the
hosting categories inside `AppShell`, and under 900px it is the same chip strip. What makes
eight pages one domain is `AccountStateProvider` — the editable copy of the fixtures that a
lock switched off on Transfer-out reads from on Overview a moment later. Nothing persists
across reloads; a prototype that remembered edits would review as though it had a server.

---

## 4. Components

Eighteen in `components/`, 47 drawn icons, ~6,800 lines of CSS across six stylesheets, 1,173
string keys in two languages.

Three of the eighteen exist because an audit found the same thing built twice.

`Card` — the client-area card, and the only one. `components.css` also declares `.card`, and
`app.css` loads last: it was overriding radius, padding and border while leaving the marketing
`box-shadow` untouched, so every client-area card carried a lifted marketing shadow it never
asked for — and one that does not render in dark at all, making elevation a language that existed
in one theme only. The app card became a bordered plane on a flat ground.

**Superseded 2026-09-09.** That fix was right about the diagnosis and its remedy has now been
replaced rather than reverted. The objection was never to depth; it was to depth spelled in a
medium only one theme can read. So the spelling changed. `elevation` is declared once per theme
in `tokens.json` and emitted inside each theme block: in light it is a soft shadow, because
white has no lightness left above it; in dark it is `none`, because the surface is already a
step lighter than the page and a near-black blur on a near-black ground says nothing. The rank
is identical in both themes and each theme states it in the only way it can. `--sws-elevation-over`
does the same for the three surfaces that genuinely float — the notifications popover, the mobile
drawer and the consent bar, which was previously separated from the page in dark by one hairline.

The dark ramp has exactly one rung of headroom and this is the place it is written down:
`surface-raised-2` is `slate.800`, and it is the last legal value. `border-strong` on `slate.800`
measures 3.03:1, which clears SC 1.4.11 by 0.03; on `slate.700` it measures 2.14:1 and fails. A
third elevation level cannot be signalled by lightness and must use border and radius instead.

The component also takes its heading as a prop, because the anatomy had drifted three ways: a
`.card__head` wrapper on most screens, a bare `.card__heading` on Affiliates, Security and both
ticket screens — which silently loses the head's 16px `margin-block-end` — and none at all. A
card with a heading has a head, and the head is the only thing that can render one.

`StatRow` — the four counts a screen opens with. The dashboard drew them as `.stat` and
Affiliates drew them as `.tile`, a marketing card at `xl` corners on a drop shadow with the
figure a step larger, no glyph, no qualifier and no arrow. Two screens, one job, two languages.

`Tag` — the status chip, with a tone rather than a colour. The three old classes were spread
across seventeen call sites with contradictory meanings: an open ticket was green on the tickets
list and grey on the dashboard, one click apart. `due` — the danger red — was carrying an
expiring domain, a refund, a high priority and a cheaper plan, none of which is a danger. `warn`,
the amber all four of those wanted, was declared in the stylesheet and used nowhere. Meanwhile
the dashboard's own tiles already spoke ok/warn/bad correctly, so a pending service read amber in
the tile and grey in the row beneath it. The ladder is now declared once, in `Tag.tsx`.

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

`CurrencySelect` — two behaviours, both halves of I15. For a visitor it keeps the cart: with
items in it, it shows the old total and the new one side by side before committing. Blocking
punishes someone for looking and emptying destroys work they did not ask to lose; the actual
risk is a total changing underneath a person unnoticed. Inside the client area, once a payment
exists, the control is a lock rather than a select: it opens a note saying why the currency
cannot change here and where to ask (a Sales ticket), and it holds the preference to the
account currency so every figure in the account is in the money the person actually pays.
Because the preference persists, the marketing site shows that currency afterwards until it is
changed.

`GatewayDetails` — one panel per gateway flow: card fields for `inline`, a redirect notice for
`redirect`, account rows plus a reference and what-to-do-after for `manual`. The rows are the
gateway's own data, so the checkout, the invoice, Add Funds, Renew and the transfer screens
cannot disagree about an IBAN.

`DevNote` — the marker for a control WHMCS cannot do natively. Today: the per-service
auto-renew switch, and the invoice's tax registration line, which waits on I12.

`StatusBoard` — the headline, systems and incidents shared by `/status` and `/account/status`,
so the two cannot drift.

`icons.tsx` — one stroke weight (1.75), one join, one cap. No emoji and no font glyphs: a
pictogram that changes shape with the reader's platform is not part of a design system.

---

### Added on 2026-09-09

`ConfirmButton` — a delete that arms before it acts. Four deletions in the client area were one
click with no confirmation and no undo: a DNS record, an email forwarding rule, a saved card and
a sub-account contact. Removing an MX or an A record is a dead mailbox or a dead site, and the
fixtures make it look free. It arms in place rather than opening a dialog, because a dialog for
a row action costs a scrim, a focus trap, a return-focus contract and another stacking layer,
and it takes the reader away from the row that tells them they picked the right one. Escape
disarms; focus moves to the confirm step; the armed state is announced, not only drawn.

`illustrations.tsx` — drawn artwork on the icon set's terms. Every path carries
`vector-effect="non-scaling-stroke"`, so a 1.75 stroke renders at 1.75 device pixels whatever
coordinate space the piece is drawn in; a 1.75 stroke on a 400-unit box would otherwise come out
a tenth as thick as the icons beside it. Two weights, `1.75` for detail and `2.5` for a primary
contour, and no third. Palette is `currentColor` plus the two lavender fills. No lettering: SVG
text is real text to the mobile audit, and there is nothing here worth putting under 12px. Every
piece is schematic and asserts nothing — no numbers, no logos, no charts — because the project
has no verified proof figure and an illustration that implied one would be the same invention in
a different medium.

**The site menu is a drawer below 900px.** The marketing header wrapped into four stacked rows
on a phone — brand, tools, login, nav — and stood 237px tall on a 390×844 screen, 28% of the
first viewport spent on chrome. The nav, the preferences and the login now live in an off-canvas
panel on the same terms as the client-area drawer, and the header is 69px. Two things this cost,
both worth recording: `backdrop-filter` on `.masthead` makes it a containing block for its
`position: fixed` descendants, so the frost had to come off below the breakpoint or the drawer
laid itself out against the 68px header and rendered as a strip across the top; and the closed
state is stated as `visibility` and `pointer-events` rather than only as a transform, because an
off-canvas percentage transform has a sign that depends on writing direction, and when it was
wrong the panel sat invisibly across the header swallowing every tap on the button that opens
it.

**Consent is asked in both shells.** `CookieConsent` rendered only inside `Layout`, so a
first-time visitor arriving on any of the 42 client-area screens — which is how a WHMCS
notification email lands one — was never asked. Both shells render it, both read the same stored
answer, and while the question is open the document carries `data-consent="open"` so each shell
reserves the bar's height instead of covering its own last control with it.

**A route change announces itself.** Focus moves to `main` on navigation and the tab title is
read from the screen's own `h1`. Neither happened before: one `<title>` served all 96 routes, and
focus stayed wherever the link had been, so a screen reader went on reading the previous screen.
Not on first paint, and not from a route table — a table is a second place to update when a
heading changes, and it would be wrong the first time someone forgot.

### States that were declared and not built

`inventory/screens.csv` lists the states each screen owes. Four screens owed a failure and did
not have one, and in every case the missing state was the one a real user meets most often.

- **Sign-in could not be got wrong.** Submit navigated on, whatever was typed, and there was no
  wrong-password string in the table to render if it had. Same for the 2FA code. The state a
  reviewer most needs to see was the one screen state nobody could reach.
- **Domain search had no `searching` and no `error`.** Results appeared on the next paint, so
  the second or two a registry lookup takes was never on screen, and a lookup that fails had
  nowhere to say so. A taken name also sorted above available ones, which is the inventory's
  `unavailable-with-alternatives` state with the alternatives underneath the dead ends.
- **Transfer accepted any EPP code**, including a wrong one. An EPP code is copied by hand out
  of another registrar's control panel and expires, so getting it wrong is the normal case.
- **Contact had no send failure.** Submit replaced the form with a thank-you, so there was
  nowhere to put a send that did not work — and nowhere for the text the visitor had written to
  survive, which is the part that decides whether they try again.

There is no server here to be right or wrong, so each failure has a stated trigger and the
screen says what it is: a password or an EPP code of `wrong`, a 2FA code of six zeros, the word
`wrong` in a contact message. An invented rule a reviewer cannot discover is the same as no
rule. The 2FA placeholder moved off `000000` for the same reason — a placeholder demonstrating
the failure is one nobody should be invited to copy.

Each of the three asynchronous steps now has a `role="status"` region, so the outcome is
announced rather than only drawn, and the one spinner in the product stops rather than slows
under `prefers-reduced-motion`: a slow spinner is still motion, and the setting is not a request
for less of it.

**Five components arrived 2026-09-16, with the review pass that asked for them.**

`StatusStrip` — ninety days of one system, one column a day, on the status detail page. The
plot is HTML rather than SVG for the reason `UsageChart` keeps its labels outside one: text
inside a viewBox scales with it, and this is read at 390px as often as at 1440, where each
column is 2.45px of pure colour and needs no text in it at all. It is **not an uptime figure**
and says so underneath. Every column is read off the incidents `marketing.ts` already holds,
and a day with nothing written against it is drawn green — which is a statement about our
records rather than a measurement of the network. A wall of green with a percentage over it is
the exact claim the no-verified-proof constraint exists to stop.

`.composer` — the ticket reply. It had been a card with a heading, a labelled textarea, a
labelled file field, a hint and a footer of two buttons: five rows of furniture around one
thing you type into, at the end of a thread where nobody needs telling that the next box is
the reply. One frame now, Enter sends and shift+enter breaks the line, and the frame carries
the focus ring so the composer lights up as one object. The file input is the 44px target
itself rather than hiding behind the clip — clipped to a pixel it was still a control, and
`mobile.mjs` read it correctly as one with an icon sitting on top of it.

`Select`'s menu. The closed control has been ours since the chevron replaced the platform
arrow, but the list that opened under it was still the operating system's — a hard system blue
on the selected row and not one value in it from this palette. `base-select` hands the picker
to CSS in the engines that have shipped it, and everywhere else the block is inert and the
native menu opens as before. The control stays a real `<select>`, which is the whole point: the
keyboard, the phone, the form and the twelve places the gates drive it with `selectOption` all
keep working. A custom listbox would have bought the same menu and paid for it in all four.

`.sys__row--link` — the status index answered "is it me?" and stopped. The name carries the
link and its `::after` takes the 44px band, so the target is the row rather than the word. The
public page passes no `hrefFor` and keeps the list it had.

`useDirty` — Save was lit on forms nobody had touched. It listens at the container and asks the
fields themselves: text against `defaultValue`, checkbox and radio against `defaultChecked`, a
select against the option marked selected. Putting an edit back the way it was makes the form
clean again, which a flag set on the first keystroke would not.

**A discount is red.** It wore two colours depending on which screen you met it on — green on
the plan cards, red at the order step — for the same saving on the same purchase. Red won
because it is the one the reader reaches last, on the screen where the money is committed.
`status-success` keeps its own work: a thing that is running, a charge that cleared.

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

**One word for one thing, and the majority wins the vote.** The masthead said النطاقات and the
whole client area and ordering flow said دومين — nine strings against thirty-seven, for the same
object, and the one the customer meets first was the one used least. It is دومين everywhere now.
The same audit found the client area named three times over: لوحة الحساب, لوحة القيادة, and in
English "Client area", "Account" and "Dashboard" for one room.

**Title Case is an English-only artefact, so it makes the two locales diverge in tone.** Arabic
has no case: a nav that shouts in English reads level in Arabic, and the product ends up with two
voices. Nineteen strings were Title Case — the sidebar and the whole Support section — against
ninety-three in sentence case. Sentence case won, and it is also the quieter of the two in a
dense application.

---

## 6. Layout

Mobile-first, logical properties throughout — no mirrored stylesheet exists. Six breakpoints are
declared in `tokens.json` with the thing each exists for, so a number in a media query can be
checked against a reason:

| px | Name | What changes |
|---|---|---|
| 600 | `content.compact` | the order summary and the auth card go single-column |
| 700 | `content.settings` | the notification preference grid stops being a table |
| 768 | `tablet` | the device band; also where the responsive type sizes step up |
| 900 | `content.shell` | the masthead gives up its inline nav for a drawer |
| 1024 | `laptop` | the client-area sidebar stops being off-canvas |
| 1280 | `content.roomy` | a wider shell gutter and an uneven dashboard split |

Two corrections to what this file used to say. The **1200** it listed was never a breakpoint —
it is `.shell`'s `max-width` in `world.css`, and no media query has ever used it. And **1440**
is declared as a device band and deliberately never used: nothing in the product changes there,
because the last layout change is at 1280 and the shell has stopped growing by 1200. The gap is
a decision, recorded in the token so it stops looking like an oversight.

Three more are in use and not yet declared: **640**, **720** and **1140**, which the plan grid
uses to decide how many cards fit a row. They are honest values — a card count is exactly the
kind of thing that earns a breakpoint — but they arrived after the table above was written, and
declaring them is outstanding rather than done.

Tables stay tables where a column of figures genuinely needs comparing, and become rows where
three fields do not need a table's machinery. One exception is deliberate: the **notification
preference grid stops being a table below 700px**, because scrolling sideways to reach a toggle
is the wrong answer on a settings screen.

Below 600px a table that still has to scroll keeps its **first column pinned**, so the thing
that says which row you are reading stays on screen while the figures move under it. Restacking
each row as labelled pairs was considered and rejected: giving `tr` and `td` a display other
than `table-row` and `table-cell` drops their roles out of the accessibility tree, so the fix
for a phone would have cost the table its structure for everyone using assistive tech.

The invoice keeps a document's measure (52rem) inside a two-column `.with-side`. It is a thing
you read, print and file; a full-bleed one reads as a report. Beside it sits the one thing a
document cannot do — take the payment — and under it the ledger of what actually moved, so a
"paid" invoice with a balance is a fixture error that shows rather than hides.

**Pay now is offered once.** The page head carried a second one, with the same words, a screen
away from the first — and only the card's button is the real one: it sends the method, the
credit switch and the figure those two produce, where the head's sent whatever the defaults
happened to be. One label with two consequences is a worse fault than a button placed low, so
the head keeps the PDF and paying stays where the amount is. Below 1024px the payment card then
leads the page (`.with-side--act-first`) rather than falling to the foot of the document it
settles.

**A refund is a state, not a row.** The ledger says a refund happened, on the day it happened;
somebody owed money is asking where it is now, which is a state, an amount and a date the bank
controls rather than us. So it gets its own section above the ledger, with the step it has
reached, and the arrival date named as the bank's. Beside it, on every invoice paid or not, the
way to a human: a failed charge and a charge that left the account while the invoice stayed
open are the two moments the client area can otherwise leave someone with nothing to press.

---

**The dashboard's two columns flow independently.** `--paired` put the cards straight into the
grid so both columns shared row tracks. That ruled the page — every pair began on one line —
and it also made every row as tall as the taller of its two cards. Stretching the short card to
fill the difference is what the ruling cost; handing the difference back as a gap is what it
costs once the card stops stretching, and it came to 477px down the screen with 142px of that
in a single hole. There is no third answer inside one grid: masonry is what packs columns
independently, and no engine this runs on has it — not `grid-template-rows: masonry`, not
`item-pack`. So the columns are real again, every gap is the 16px the grid sets, and the page
ends 162px sooner.

The cost is the DOM order, and it is paid where it is cheapest. Grouped by column the markup is
what the desktop needs and the reverse of what a phone needs, so below 1280 the two wrappers go
`display: contents` and the cards interleave back by `order`. The pairs are counted rather than
named, which survives the two cards that are not always there: usage and shortcuts are one
child of each column, so with no live cPanel service both columns lose their third child at
once and the rest still pair off.

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
| `tokens/a11y-gate.mjs` | 84 checks — contrast, focus, hit area |
| `scripts/flow.mjs` | **171 checks** against a running build |
| `scripts/capture.mjs` | 118 routes × 2 viewports, plus the two funnel steps whose path carries a cart id — overflow, empty main, console errors |
| `scripts/deadends.mjs` | no control wired to nothing, no form that only swallows its event, no screen without a way onward |
| `scripts/journeys.mjs` | 21 journeys walked by clicking only — a link that goes nowhere stalls the walk |
| `scripts/mobile.mjs` | 118 routes at 390px — overflow, hit area, crowding, tiny text, covered controls, crushed icons |

`mobile.mjs` walks every route at 390 in Arabic and looks for what a 1440px screen never shows.
It found the marketing header failing on four counts at once — a 40px language select, a 43px
cart, nav links four pixels apart, and a 10px tagline — on all 49 marketing routes.

Three of its own findings were the audit being wrong, and each is now documented in it: a
closed off-canvas drawer is not a covered control, an item scrolled out of a horizontal strip
is reachable by scrolling, and an input wrapped in a label is tapped through the label. A
fourth was sub-pixel: `elementFromPoint` resolves to whole pixels, so a genuine 44px target
whose box begins at 243.0156 measures 43. That one carries a documented 1px tolerance,
verified against a real button first.

`journeys.mjs` never sets the URL mid-walk. Every other gate asserts screens; this one asserts
the routes *between* them, which is the only way a dead link fails a test instead of being
stepped over. It found the domain search's Add button doing nothing — the primary action of an
entire journey — after `deadends.mjs` had cleared the file.

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
| **B1** | payment gateway — C-17 is built against the inline / redirect / manual split; the provider is still open |
| **I12** | invoice PDF — blocks C-16; the invoice's tax registration line is a marked slot until it closes |
| **I13/I14** | closed here in the direction the decision log recommends; owner has not ratified |
| **I15** | closed 2026-09-07: *show both totals* in the cart; locked to the account currency after the first payment (S-04 `locked-after-payment`) |
| **I16** | dark mode at launch — tokens and toggle ship either way |
| **C19** | status page build-vs-buy — decides the data source, not the design |
| **C22** | visual identity is being built inside the project: +10–15 days, uncounted |
| **G4** | 50 email templates × 4 languages = 200; estimate was built on 50 |
| **G8** | **a live password sits in `00-source/` and in git history — rotate it** |

Inventory: **85 built, 4 folded, 1 not started** (90 rows; C-37 to C-42 added 2026-09-07).
