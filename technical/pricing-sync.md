# Pricing Sync Architecture

**Decides:** how the marketing site gets prices without anyone hand-copying them.
**Blocked by:** B5 (currency count / price data owner), B7 (does pricing relocate at all)
**Affects:** `M-02`→`M-10`, `M-12`, `M-14`, `O-01`

---

## The problem, stated precisely

The v1.1 plan's central architectural move is relocating pricing pages from WHMCS to the
marketing site. The reasoning is sound: pricing pages are the highest-value pages in the
project and they currently live inside the slow, hard-to-index, structurally constrained
system, while the fast, free, indexable system holds brochures with no numbers on them.

But **WHMCS remains the system of record for price.** It stores a separately entered price
per currency, per product, per billing cycle — roughly 1200 fields at 8 currencies. Relocating
the *pages* does not relocate the *data*. So a new question appears that the plan never asks:

> When a price changes in WHMCS, how does the marketing site find out?

There is already a live answer to what happens when nobody decides this. The homepage
advertises **`$2.50 in the first year`**. The store's cheapest plan is **`250.00 EGP/month`**.
Those numbers were entered by different people at different times into different systems, and
nothing reconciled them. That is not a content error to be fixed once — it is the predictable
output of having two sources of truth. Relocating eight more pricing pages without solving
this multiplies the failure mode by eight.

The currency mismatch makes it worse than a wrong number: marketing quotes USD, the store
lands the customer in EGP. The customer cannot even tell whether they have been misled.

---

## Options

### A — Build-time fetch with scheduled revalidation ✅ **Recommended**

The marketing site fetches prices from the WHMCS API at build time and on a schedule
(ISR / scheduled rebuild), writing them into statically generated pages.

| | |
|---|---|
| **Freshness** | Configurable. Recommended: 1 hour. |
| **Page speed** | Fastest possible — prices are static HTML at request time. |
| **SEO** | Fully indexable. Prices are in the initial HTML, not injected by JS. |
| **WHMCS load** | Negligible. One call per rebuild, not per visitor. |
| **Failure mode** | Last-known-good prices keep serving. Site never shows a blank price. |
| **Cost** | Build pipeline plus a cached fallback. |

This is the right default because hosting pricing changes on the order of times per month,
not times per minute. Paying a per-request API cost to reflect a change that happens rarely is
the wrong trade — especially with an LCP target under 2.5s on 4G.

### B — Runtime API proxy with cache

The marketing site calls a cached backend endpoint on each request.

Fresher, but every page view now depends on WHMCS being up and fast, on the exact pages where
speed matters most. WHMCS is slow by default — that is one of the stated reasons for moving
the pages off it in the first place. This option reintroduces the dependency it was meant to
remove. **Reasonable only if a hard requirement for sub-minute price accuracy emerges. None
has been stated.**

### C — Manual duplication ❌ **Rejected**

Someone types prices into the marketing site by hand.

Rejected on evidence, not principle: this is the current architecture, and it has already
produced the `$2.50` vs `250.00 EGP` conflict on a live site taking real traffic. It fails
silently, it fails in the direction that damages trust at checkout, and it gets worse with
every currency and product added. At 8 currencies it is unmaintainable by construction.

---

## Recommended design

### Data source

| Need | WHMCS action | Notes |
|---|---|---|
| Product & plan pricing | `GetProducts` | Returns pricing in **all defined currencies** in one call |
| TLD pricing | `GetTLDPricing` | Register / transfer / renew per TLD. The spec's `DomainGetPricing` is wrong — verify the real name against the frozen version (**B6**) |
| Promotions | `GetPromotions` | Only if promotional pricing is displayed on marketing pages |

> **ASSUMPTION** — action names and response shapes are taken from Build Plan §9, not from a
> live API call, because this was written without WHMCS access. Verify every one against the
> official documentation for the exact frozen version before implementation. Build Plan §9
> carries an explicit warning that action names change between versions and that some are
> admin-only and invalid from a customer context.

### Pipeline

```
WHMCS  ──GetProducts──▶  fetch job  ──▶  normalise  ──▶  validate  ──▶  prices.json
(source of truth)         (scheduled)                     (gate)         (committed
                                                            │             artifact)
                                                            │
                                                     fails ─┴─▶  build fails,
                                                                 last-known-good
                                                                 stays live
```

`prices.json` is committed. That gives three things worth having: prices are diffable in
review, a bad sync is visible in `git log`, and the site can always build offline from the
last good snapshot.

### Validation gate

The build fails — rather than publishing a wrong number — if any of these trip:

1. **Missing price.** Any displayed product/currency/cycle combination has no value. Prevents
   the "price shows as 0.00 or blank" failure.
2. **Cross-system drift.** Any price rendered on a marketing page differs from the WHMCS value
   for the same product/currency/cycle. **This is the check that makes the `$2.50` bug
   structurally impossible.**
3. **Implausible change.** Any price moved more than ±50% since the last sync. Catches a unit
   error or a fat-fingered admin entry before customers see it.
4. **Decimal-precision violation.** See below.

### Currency handling

Eight currencies are live: `USD` `EGP` `EUR` `CHF` `AED` `SAR` `KWD` `SYP`.

**KWD uses 3 decimal places.** WHMCS assumes 2 by default. Formatting and rounding both break.
Handle it in the normalise step with an explicit per-currency precision map, and assert it in
the validation gate — do not leave it to the display layer, where it will be fixed
inconsistently on each of the nine pricing surfaces.

```
USD 2 · EGP 2 · EUR 2 · CHF 2 · AED 2 · SAR 2 · KWD 3 · SYP 2
```

**The marketing/store currency handoff must be preserved.** Today marketing quotes USD and the
store opens in EGP. Whatever currency the visitor is viewing on the marketing site must carry
into WHMCS on the Add-to-Cart transition — via the WHMCS currency parameter, with the choice
persisted. A customer who sees `$5.00` and lands on `250.00 EGP` has been given no way to tell
those are the same price.

**Do not display converted prices.** WHMCS does not convert live; it stores separately entered
values. If a currency's prices are not filled in, that currency must not be offered — showing a
computed approximation that then differs at checkout is the same trust failure in a new place.
First task under **B5** is to verify which of the eight are actually populated.

### Failure behaviour

| Failure | Behaviour |
|---|---|
| WHMCS unreachable at build | Build uses the committed `prices.json`. Site stays up with last-known-good. Alert fires. |
| WHMCS returns partial data | Validation gate 1 trips. Build fails. Nothing publishes. |
| Prices stale beyond threshold | Warn at 6h, alert at 24h. Never hide prices — a stale price beats a missing one, and the drift check bounds how wrong it can get. |
| A currency has no prices filled | That currency is removed from the switcher for those products, not shown as `0.00`. |

### Staleness budget

**1 hour** normal revalidation, **6 hours** warning, **24 hours** alert. Any price change also
supports an immediate manual rebuild trigger, so a correction never waits for the schedule.

---

## What this does not solve

Only the **display** side. It does not fill the ~1200 price fields, and it does not decide who
owns them — that is **B5**, and it is unassigned in every document reviewed. The Build Plan
lists it as risk R4 with impact "high", and this architecture makes it *visible* (the gate
fails loudly on a missing price) without making it *filled*.

Recommendation from the Build Plan stands: **reduce to 3 currencies at launch.** That cuts the
matrix from ~1200 to ~450 fields and removes the KWD precision problem from the critical path
entirely.

---

## Open items before implementation

- [ ] **B6** — freeze the WHMCS version, then verify `GetProducts` / `GetTLDPricing` /
      `GetPromotions` names and response shapes against that version's documentation
- [ ] **B5** — confirm which of the 8 currencies have real prices filled versus defaults
- [ ] **B7** — confirm pricing relocation is approved before building any of this
- [ ] Decide where the fetch job runs and how the WHMCS API credential is stored
      (never committed — see `.gitignore`)
- [ ] Confirm whether promotional pricing appears on marketing pages or only in the cart
