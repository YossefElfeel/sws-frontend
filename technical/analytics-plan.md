# Analytics & Measurement Plan

**Decides:** what gets measured, how, and how the cross-domain funnel stays intact.
**Blocked by:** I18 (tooling and owner) — **due this week**
**Affects:** every screen in the conversion funnel; the ability to prove the project worked

---

## The problem nobody has stated

Build Plan §3.1 defines seven success metrics — order completion rate, cart abandonment, time
to first active service, ticket deflection, auto-renewal success, LCP, Arabic session share.
Five of them say "measured from the current system" in the baseline column.

Nothing is measuring the current system. And Build Plan §16 lists installing measurement as a
this-week action that has not happened.

That is the visible problem. Here is the one that is not in any document:

> **The marketing site and WHMCS are on different subdomains. Without explicit cross-domain
> configuration, the funnel is severed at exactly the point it matters most.**

By default, a visitor who moves from `sws.somion.ch` to `clients.somion.ch` is counted as a
**new session from a referral source**. The consequences are not subtle:

- Every purchase is attributed to `sws.somion.ch` as the referrer, not to the ad, search, or
  campaign that actually brought the customer.
- **Order completion rate cannot be computed at all** — the cart and the browsing session are
  in different sessions.
- Cart abandonment is unmeasurable for the same reason.
- Marketing spend cannot be attributed to revenue.

You can install analytics on both domains, watch data flow into dashboards, and have every
number in §3.1 be wrong — with no error message anywhere. This is the single highest-leverage
item in this document, and it costs an afternoon to configure correctly and months to discover
if you get it wrong.

**Good news:** both hosts sit under the registrable domain `somion.ch`, so cross-domain
measurement is straightforward. It just has to be deliberately switched on.

---

## Tooling

| Option | Fit | Note |
|---|---|---|
| **GA4** ✅ recommended | Cross-domain is a first-class feature; free; ecommerce model matches the funnel | Needs a consent-mode configuration for EU/Swiss traffic — see below |
| PostHog | Strong product analytics, self-hostable (helps the Swiss privacy story) | Heavier to run; ecommerce reporting is more DIY |
| Plausible | Privacy-first, lightweight, good LCP impact | Weak funnel and ecommerce analysis — insufficient for §3.1 |

**Recommendation: GA4 with cross-domain measurement, plus a server-side purchase event.**

The server-side purchase event matters because a client-side `purchase` fires only if the
customer lands back on the confirmation page. With redirect-based gateways (the Egyptian
provider, 3-D Secure, InstaPay), a meaningful share of *successful* payments never return
cleanly. Client-side-only tracking systematically undercounts revenue, and it undercounts it
worst on the payment methods most used by the largest customer segment.

---

## Cross-domain setup — do this first

1. Configure both `sws.somion.ch` and `clients.somion.ch` in the **same GA4 property**, and
   list both in cross-domain measurement settings.
2. Set the cookie domain to `.somion.ch` so the client ID survives the hop.
3. Add both to the referral exclusion list, so neither is recorded as a source for the other.
4. **Verify by walking the funnel yourself.** Load a marketing page, click through to the
   store, complete an order in a test environment, and confirm it is **one session** with the
   original source preserved. Do not trust the configuration screen — check the data.
5. Repeat the check in Arabic. RTL does not affect measurement, but the language switcher can
   alter URLs in ways that break the handoff.

Cookie consent (`S-06`) gates this for EU/Swiss visitors. With GA4 consent mode, denied consent
yields modelled rather than observed data. Configure it deliberately — do not let the consent
banner silently zero out the measurement the whole plan depends on.

---

## Event dictionary

`snake_case`, present tense. Parameters in `()`. GA4 recommended ecommerce events are used
where they exist, so standard reports work without custom configuration.

### Conversion funnel — the revenue path

| Event | Fires when | Parameters | Screen |
|---|---|---|---|
| `view_item_list` | Plan page viewed | `item_list_name`, `currency` | `M-02`→`M-10` |
| `select_item` | A plan is chosen | `item_id`, `item_name`, `price`, `currency` | `M-02`→`M-10` |
| `billing_cycle_change` | Cycle toggle used | `from_cycle`, `to_cycle`, `item_id` | `M-02`→`M-10`, `O-01` |
| `currency_change` | Currency switched | `from_currency`, `to_currency`, `cart_has_items` | `S-04` |
| `domain_search` | Search submitted | `query_length`, `mode` (`classic`\|`ai`), `tld_filter` | `M-11`, `O-02` |
| `domain_search_result` | Results returned | `available` (bool), `alternatives_shown`, `latency_ms` | `M-11`, `O-02` |
| `domain_search_error` | Search failed | `error_type`, `provider` (`whois`\|`ai`) | `M-11` |
| `add_to_cart` | Item added | `item_id`, `price`, `currency`, `has_domain` | `O-01`→`O-03` |
| `begin_checkout` | Cart → checkout | `value`, `currency`, `item_count` | `O-04` |
| `add_payment_info` | Gateway selected | `payment_type` | `O-07` |
| `purchase` | Payment succeeds | `transaction_id`, `value`, `currency`, `tax`, `items[]`, `payment_type` | `O-12` **+ server-side** |
| `payment_failure` | Payment declined | `payment_type`, `failure_reason`, `attempt_number` | `O-13` |
| `payment_retry` | Retry after failure | `payment_type`, `switched_gateway` (bool) | `O-13` |
| `order_pending_review` | Held for fraud review | `reason` | `O-14` |

`payment_failure` and `payment_retry` are not standard GA4 events but are the most valuable
custom pair here. `O-13` is described in the plan as the single biggest conversion-recovery
opportunity in the project — and it cannot be improved without knowing which gateway fails, for
what reason, and whether the retry succeeds.

### Retention — the Dunning path (`C-21`)

Highest financial impact in the project. Typically recovers 3–7% of lost revenue.

| Event | Fires when | Parameters |
|---|---|---|
| `dunning_banner_view` | Warning banner shown | `severity` (1\|2\|3), `days_overdue` |
| `dunning_banner_click` | Banner CTA clicked | `severity` |
| `payment_method_update` | Card updated | `trigger` (`dunning`\|`self_serve`), `days_overdue` |
| `dunning_recovered` | Failed payment recovered | `days_to_recover`, `severity_at_recovery` |
| `service_suspended` | Service suspended | `days_overdue` |
| `service_reactivated` | Reactivated after suspension | `days_suspended` |

The pair `dunning_banner_view` → `dunning_recovered` gives a recovery rate per severity level,
which is what tells you whether the three-stage escalation is calibrated or just annoying.

### Support deflection

| Event | Fires when | Parameters |
|---|---|---|
| `kb_suggestion_shown` | Suggestions appear while typing | `suggestion_count`, `subject_length` |
| `kb_suggestion_click` | Suggested article opened | `article_id`, `position` |
| `kb_suggestion_resolved` | "This solved my problem" clicked | `article_id` |
| `ticket_submitted` | Ticket created | `department`, `priority`, `has_attachment`, `saw_suggestions` (bool) |

`kb_suggestion_resolved` is the only event named anywhere in the source documents. It is
useless alone — a resolution count with no denominator. `kb_suggestion_shown` and
`ticket_submitted.saw_suggestions` supply the denominator, which is what turns it into a
deflection rate.

### Lifecycle & account

| Event | Fires when | Parameters |
|---|---|---|
| `sign_up` | Account created | `method` |
| `login` | Login succeeds | `method`, `used_2fa` (bool) |
| `service_first_active` | First service goes live | `minutes_since_first_visit` |
| `upgrade_started` / `upgrade_completed` | Upgrade flow | `from_plan`, `to_plan`, `proration_amount` |
| `cancellation_started` | Cancel flow entered | `service_age_days` |
| `cancellation_reason` | Reason chosen | `reason` |
| `retention_offer_shown` / `retention_offer_accepted` | Retention offer | `offer_type` |
| `cancellation_completed` | Cancellation confirmed | `reason`, `timing` |

`cancellation_reason` → `retention_offer_accepted` measures whether the retention offer is
worth its build cost. Without it, `C-07` is a feature nobody can evaluate.

---

## KPI → event mapping

Every metric in Build Plan §3.1, and what actually computes it:

| KPI (§3.1) | Computed from | Target |
|---|---|---|
| Order completion rate | `purchase` ÷ `begin_checkout` | +25% relative |
| Cart abandonment | `begin_checkout` without `purchase` in 24h | −15pp |
| Time to first active service | `service_first_active.minutes_since_first_visit` | < 10 min (card) |
| "How do I" ticket share | `ticket_submitted` by `department` ÷ all | −30% |
| Auto-renewal success | `purchase` (recurring) first-attempt ÷ all recurring | ≥ 92% |
| Marketing LCP | Web Vitals (CrUX + field data) | < 2.5s on 4G |
| Arabic session share | Sessions by `language` | validates the RTL bet |

**Every one of the first five is unmeasurable without cross-domain configuration**, because
each spans the `sws` → `clients` boundary.

---

## Baseline collection — start this week

The system is live and taking visitors. Every week without measurement is a week you cannot
later compare against. This does not wait for Phase 0 to close.

- [ ] Create the GA4 property; install on **both** subdomains
- [ ] Configure cross-domain measurement; verify by walking the funnel end to end
- [ ] Configure consent mode for EU/Swiss traffic
- [ ] Instrument the minimum viable funnel: `view_item_list` → `add_to_cart` →
      `begin_checkout` → `purchase`
- [ ] Add `payment_failure` with `failure_reason` — the highest-value single event
- [ ] Enable Web Vitals collection on marketing pages
- [ ] Record ticket volume by department from the WHMCS admin as a manual baseline
- [ ] Let it run **≥ 4 weeks** before quoting any baseline number

Four weeks is the minimum for a stable baseline in a business with weekly traffic seasonality.
A one-week baseline will produce a number that the redesign appears to beat or lose to by
random variation — which is worse than no baseline, because it will be quoted.

---

## Do not measure this way

- **No personal data in event parameters.** No email, no name, no full domain the customer
  bought, no IP. Under nFADP and GDPR, analytics is a processing activity that has to be
  disclosed — see the subprocessor gap (`gaps/gap-register.md` G6).
- **Never put personal data in URL query strings.** They are logged, cached, and shared.
- **Do not defer instrumentation to Phase 8.** Build Plan risk R12 is exactly this. Events
  belong in the same commit as the screen — retrofitting means every phase-2 screen gets
  reopened.

---

## Open items

- [ ] **I18** — confirm tool and owner (**due this week**)
- [ ] Decide server-side purchase event: WHMCS hook vs Measurement Protocol from the
      confirmation flow
- [ ] Confirm the consent banner's default state with whoever owns the legal pages (`M-20`)
- [ ] Agree who reads the dashboard weekly — an unread dashboard is not measurement
