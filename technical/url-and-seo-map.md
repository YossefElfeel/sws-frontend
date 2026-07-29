# URL, i18n & SEO Map

**Decides:** URL structure, language routing, redirects, and where the two systems meet.
**Blocked by:** B7 (pricing relocation), B7a (how many languages)
**Affects:** every marketing screen, plus the `M-*` → `O-*` handoff

---

## Why this document exists

The v1.1 audit calls relocating pricing to the marketing site *"the single most important SEO
item in the project"* — and then specifies no SEO mechanism at all. No URL scheme, no hreflang
strategy, no redirect map, no structured data, no canonical rules.

Moving a page without a redirect does not improve its ranking. It destroys it. Whatever
authority `clients.somion.ch/store/*` has accumulated is discarded, and the new page starts
from zero. For a hosting company — a business whose customers arrive almost entirely through
search — that is the most expensive way to execute a good idea.

There is also live damage to repair. A menu item labelled **"Hosting"** points at
`/en/vps-hosting`, and `/en/hosting` returns a bare **404** (verified 2026-07-29). Every
internal link, external link, and indexed reference to that path is currently dead.

---

## The line of demarcation, as a routing rule

Build Plan §8.1 states the principle: *everything before Add-to-Cart on the marketing site;
everything after inside WHMCS.* That is architecture prose. As an enforceable rule:

| Concern | System | Domain |
|---|---|---|
| Browse, compare, read pricing, search domains (informational) | Marketing | `sws.somion.ch` |
| **Add to Cart** | ← **the boundary** → | |
| Configure, cart, checkout, pay, account, billing, support | WHMCS | `clients.somion.ch` |

**One rule, one exception, and no third case:** a page that shows a price without taking one is
marketing. A page that takes money or shows account state is WHMCS. Domain *search* is
marketing (it is a hook); domain *purchase* crosses the boundary.

Two subdomains is a deliberate cost. It buys independent deploy cycles and lets the marketing
site be fast without WHMCS in the request path. It costs a visible domain change at the moment
of highest purchase intent — the exact moment trust is most fragile. Two things make that cost
survivable, and both are non-negotiable:

1. **Shared design tokens** so the transition is not visibly a different company
   (see `tokens/`). Build Plan §8.1 names this the make-or-break condition.
2. **Cross-domain analytics** so the funnel is still measurable across the seam
   (see `analytics-plan.md`). Without it the boundary is invisible in every report.

---

## URL scheme

```
sws.somion.ch/{locale}/{section}/{page}
```

Locale is always explicit — no implicit default locale at the root. `/` redirects (302) to the
visitor's best-match locale; every real page carries its locale in the path. This keeps every
page independently indexable, shareable, and cacheable.

### Marketing

| Path | Screen | Notes |
|---|---|---|
| `/{loc}/` | `M-01` | Homepage |
| `/{loc}/hosting` | — | **Hosting overview / hub. Currently a 404. Fix first.** |
| `/{loc}/hosting/shared` | `M-02` | |
| `/{loc}/hosting/wordpress` | `M-03` | |
| `/{loc}/hosting/cloud` | `M-04` | |
| `/{loc}/hosting/email` | `M-05` | |
| `/{loc}/hosting/vps` | `M-06` | Redirect from existing `/en/vps-hosting` |
| `/{loc}/hosting/compare` | `M-10` | |
| `/{loc}/ssl` | `M-07` | |
| `/{loc}/website-builder` | `M-08` | |
| `/{loc}/monitoring` | `M-09` | |
| `/{loc}/domains` | `M-11` | Domain search — exists, currently priceless |
| `/{loc}/domains/pricing` | `M-12` | All TLD pricing |
| `/{loc}/domains/transfer` | `M-13` | |
| `/{loc}/migration` | `M-15` | |
| `/{loc}/status` | `M-16` | |
| `/{loc}/about` | `M-17` | Redirect from `/en/about-us` |
| `/{loc}/contact` | `M-18` | Redirect from `/en/contact-us` |
| `/{loc}/data-centres` | `M-19` | |
| `/{loc}/legal/{terms,privacy,refund,sla,aup}` | `M-20` | **P0 — compliance** |
| `/{loc}/blog` , `/{loc}/blog/{slug}` | `M-21` | |

**Product URLs are stable identifiers, not marketing copy.** `/hosting/shared` will survive a
rename of the "Single / Pro / Ultra" tiers; `/cheap-hosting-egypt` will not.

---

## Redirect map

### Fix now — independent of the redesign

| From | To | Code | Why |
|---|---|---|---|
| `/en/hosting` | `/en/hosting` (build the page) | — | **404 today.** A menu item leading nowhere. |
| Nav label "Hosting" → `/en/vps-hosting` | → `/en/hosting` | — | Mislabeled link, not a redirect. Fix the menu. |
| `/en/vps-hosting` | `/en/hosting/vps` | 301 | Only if the URL scheme is adopted |

### On pricing relocation (after B7)

| From | To | Code |
|---|---|---|
| `clients.somion.ch/store/shared-hosting-cpanel` | `sws.somion.ch/{loc}/hosting/shared` | 301 |
| `clients.somion.ch/store/wordpress-hosting-cpanel` | `sws.somion.ch/{loc}/hosting/wordpress` | 301 |
| `clients.somion.ch/store/cloud-hosting-cpanel` | `sws.somion.ch/{loc}/hosting/cloud` | 301 |
| `clients.somion.ch/store/email-hosting` | `sws.somion.ch/{loc}/hosting/email` | 301 |
| `clients.somion.ch/store/vps` | `sws.somion.ch/{loc}/hosting/vps` | 301 |
| `clients.somion.ch/store/ssl-certificates` | `sws.somion.ch/{loc}/ssl` | 301 |

> **ASSUMPTION** — store slugs beyond `/store/shared-hosting-cpanel` and `/store/vps`
> (both verified live) are inferred from the product list. Enumerate the real set from WHMCS
> admin before writing redirect rules. A 301 to a 404 is worse than no redirect.

**Do not redirect the cart or checkout paths.** Those stay in WHMCS by design — that is the
boundary. Only the *browsing* surfaces move.

**Preserve the locale.** A visitor on `/ar/hosting/shared` who adds to cart must land in the
Arabic WHMCS with the same currency selected. Losing either at the boundary is the transition
failure the design system is meant to prevent, arriving through routing instead.

---

## Language routing (hreflang)

**Blocked by B7a.** Seven locales are live today: `ar` `en` `fr` `de` `it` `es` `tr`. The
recommendation on the table is to prune to `ar` + `en`, possibly plus `fr` + `de` if the Swiss
market is real rather than symbolic.

**Do not emit hreflang for a locale whose content is not genuinely translated.** Declaring
`hreflang="de"` for a page that is half machine-translated WHMCS strings invites search engines
to serve that page to German speakers, who then bounce. An unmaintained language is worse than
an absent one — that argument already appears in the plan for UI reasons; it applies with more
force to SEO, because search engines act on the declaration.

Every page in the set emits reciprocal `hreflang` for **maintained locales only**, plus
`x-default` pointing at `en`.

```html
<link rel="alternate" hreflang="ar" href="https://sws.somion.ch/ar/hosting/shared">
<link rel="alternate" hreflang="en" href="https://sws.somion.ch/en/hosting/shared">
<link rel="alternate" hreflang="x-default" href="https://sws.somion.ch/en/hosting/shared">
```

Arabic pages carry `<html lang="ar" dir="rtl">`. The `dir` attribute is what makes the logical
CSS properties in the design system resolve — the RTL strategy depends on it being correct at
the document level, not patched per component.

---

## Canonical rules

1. Every page self-canonicalises to its locale-specific URL.
2. **Cross-domain canonical after relocation:** if any WHMCS store page must remain reachable,
   it canonicalises to the marketing equivalent. Two indexable pages for one product split the
   ranking signal and let Google choose — it will choose the slower one.
3. Currency and billing-cycle switches must **not** produce new indexable URLs. Use one
   canonical page per product; do not create `?currency=EGP` variants for the crawler.
4. Domain search *results* are `noindex`. Infinite generated pages, no search value.
5. Paginated TLD pricing (`M-12`) — self-canonical per page, not to page 1.

---

## Structured data

`Product` + `Offer` on every pricing page (`M-02`→`M-10`). This is what produces price display
in search results, which for a price-sensitive market is the difference between a click and a
scroll past.

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Shared Hosting — Single",
  "offers": {
    "@type": "Offer",
    "price": "250.00",
    "priceCurrency": "EGP",
    "availability": "https://schema.org/InStock",
    "url": "https://sws.somion.ch/ar/hosting/shared"
  }
}
```

**The `price` value must come from the same `prices.json` that renders the visible price**
(see `pricing-sync.md`). Structured data that disagrees with the page is a manual-action risk
with Google, and hand-maintained structured data always drifts eventually.

Also worth adding: `BreadcrumbList` on all pages, `FAQPage` on `M-14` and pricing pages that
carry an FAQ, `Organization` on the homepage — with `sameAs` and real, verifiable identifiers.

> **Do not add `AggregateRating` without genuine reviews**, and do not mark up the
> `1+ Million Active Websites` class of claim as structured data. Unverifiable claims in
> structured data are a policy violation on top of the credibility problem they already
> represent (**B7c**).

---

## Performance targets

Inherited from Build Plan §15.3, restated here because URL and rendering decisions determine
whether they are reachable:

| Metric | Target |
|---|---|
| LCP (marketing, 4G) | < 2.5s |
| CLS | < 0.1 — **critical with Arabic fonts** |
| INP | < 200ms |
| Subset font payload | < 150KB |

Arabic webfonts are substantially heavier than Latin. Subset aggressively, load at most two
weights for body text, and use `font-display: swap` with a metric-matched fallback. CLS is
where an unmatched Arabic fallback shows up, and it shows up on every page at once.

Static generation (per `pricing-sync.md` option A) is what makes the LCP target achievable.
Runtime price fetching puts WHMCS latency into the critical rendering path of exactly the pages
this target applies to.

---

## Open items

- [ ] **B7** — confirm pricing relocation before writing any redirect
- [ ] **B7a** — final locale list; hreflang cannot be written until it is fixed
- [ ] Enumerate real WHMCS store slugs from admin (needed for an accurate redirect map)
- [ ] Fix `/en/hosting` and the mislabeled nav item — **do not wait for the redesign**
- [ ] Verify `sws.somion.ch` and `clients.somion.ch` share a registrable domain for
      cross-domain cookies (they do: `somion.ch`) — see `analytics-plan.md`
- [ ] Confirm whether the marketing site currently emits any hreflang at all
