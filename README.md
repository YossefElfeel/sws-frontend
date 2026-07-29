# SWS — Phase 0 Execution Kit

Working repo for the **Somion Web Services** redesign (marketing site + WHMCS client area).

This repo does not contain the product. It contains the things that must exist **before**
design or development starts — the decisions that are still open, the inventory of what has
to be built, the gaps nobody has assigned, and the four technical designs the planning
documents call for but never specify.

---

## Governance rule

There are two kinds of document here and they must not be confused.

| | Role | Changes when |
|---|---|---|
| `00-source/*.html` `00-source/*.pdf` | **Narrative snapshots.** Versioned, presentation-ready, written for a human audience (management, design team). | A new version is issued (v1.2, v2.0). Not edited in place. |
| Everything else | **Living state.** Trackers, data, and technical specs that the team updates continuously. | Daily, as decisions close and work progresses. |

**Content is never duplicated between the two.** The snapshots carry the argument; the
trackers carry the state. This exists because the Design Playbook's own closing warning
applies to itself: a rules document that no longer matches reality is worse than no document,
because the team stops trusting it and each person quietly reverts to their own rules.

When a decision in `decisions/decision-log.md` closes, it does **not** get written back into
the HTML. It gets an ADR, and the affected rows in `inventory/screens.csv` unblock.

---

## Repo map

```
00-source/          The three original documents, unchanged. Read-only baseline.
decisions/          The 27 open questions blocking work, as a trackable log. (AR)
  adr/              Architecture Decision Records — one per decision, once made. (EN)
inventory/          All 74 screens as filterable data. (EN headers, bilingual names)
gaps/               The 8 gaps the v1.1 plans do not cover. (AR)
technical/          The four technical designs the plans require but never specify. (EN)
tokens/             Design tokens as machine-readable data + an automated contrast gate. (EN)
actions/            Fixes that are live on production right now and do not wait for Phase 0. (AR)
```

**Language split:** Arabic for management- and design-facing artifacts (decision log, gap
register, action list). English for anything code, tooling, or developers touch (inventory
headers, technical specs, tokens, ADRs).

---

## Where to start

| If you are… | Read |
|---|---|
| The manager / product owner | `gaps/gap-register.md`, then `decisions/decision-log.md` |
| Fixing what is broken today | `actions/this-week.md` |
| Planning the design work | `inventory/screens.csv` — filter `customization=full AND priority=P0` |
| Building the front end | `technical/` — all four, in the order listed below |
| Setting up the design system | `tokens/README.md` |

---

## The four technical designs

Each addresses something the planning documents identify as necessary and then leave
unspecified. Read in this order — each depends on the one before it.

1. **`technical/pricing-sync.md`** — The v1.1 plan's central move is relocating pricing from
   WHMCS to the marketing site. WHMCS owns the ~1200 price fields. This decides how the
   marketing site gets them without hand-copying, which is what produced the current
   `$2.50` vs `250.00 EGP` conflict.
2. **`technical/url-and-seo-map.md`** — Relocating pricing is called the project's biggest SEO
   item. This is the mechanism: URL scheme, hreflang, redirect map, structured data, and the
   architectural line of demarcation written as an enforceable routing rule.
3. **`technical/analytics-plan.md`** — The marketing site and WHMCS are separate subdomains,
   so the conversion funnel is severed by default and every KPI in the plan is unmeasurable
   until that is fixed. Event dictionary, cross-domain setup, and a baseline you can start
   collecting this week.
4. **`technical/environments.md`** — Where each system's source lives, how the WHMCS theme is
   version-controlled, staging, the version freeze, and rollback.

---

## Status

Phase 0 kit built 2026-07-29. Live-site claims in the v1.1 audit were re-verified the same
day and all were still true — see `actions/this-week.md` for the evidence.

Written without WHMCS admin or marketing-site source access. Anything that could not be
verified from public pages is marked **ASSUMPTION** in the document that relies on it, with
a note on how to confirm it. Search the repo for `ASSUMPTION` before treating any of it as
settled.
