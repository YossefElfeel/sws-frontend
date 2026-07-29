# Environments, Version Control & Release

**Decides:** where each system's source lives, how changes reach production, how to roll back.
**Blocked by:** B6 (WHMCS version freeze), I8 (existing customers)
**Affects:** every phase; risk R10 (a WHMCS update breaking customisations)

---

## Why this document exists

Build Plan risk **R10** — *"a WHMCS update during the project breaks the customisations"* —
lists its mitigation as *"freeze the version, use a staging environment, avoid editing core
files."* All three are correct and none is a plan. Nothing anywhere states:

- where the WHMCS theme source lives, or **whether it is under version control at all**
- whether a staging copy of `clients.somion.ch` exists
- how a theme change gets from a developer's machine to production
- how to undo a bad release
- where the marketing site is built and deployed

For a 28-week project across two systems with a live customer base, these are not details that
resolve themselves. The theme question in particular is the one that quietly ends projects: if
the WHMCS theme is edited directly on the production server via FTP — which is the WHMCS
default working style and therefore the base case until proven otherwise — then there is no
history, no review, no rollback, and no way for two people to work at once.

> **ASSUMPTION — this entire document.** Written without WHMCS admin or hosting access.
> Everything below is a recommended topology plus the questions that must be answered to
> replace it with fact. Treat the "must confirm" list as the real deliverable here.

---

## Must confirm before this becomes real

Answer these first. Each one can invalidate the recommendation below.

- [ ] What **exact WHMCS version** is running? (**B6**) Auto-updates on or off?
- [ ] Is the Lagom 2 theme **stock, a child theme, or directly modified**?
- [ ] Are theme files in **any version control** today? If not, how are changes made?
- [ ] Does a **staging** WHMCS instance exist? If yes, is its data a production copy?
- [ ] Where is the **marketing site** source? Which framework? Which host?
- [ ] Is the marketing site deployed from a **repo** or uploaded manually?
- [ ] Who has **production access** to each system?
- [ ] Are there **backups**, and has a restore ever been tested?
- [ ] **I8** — are there existing customers on `clients.somion.ch`? How many?

That last one governs everything. A system with real customers cannot be iterated on in
production, and the entire release process below depends on the answer.

---

## Recommended topology

```
                    ┌─────────────────────────────────────┐
                    │  Git  (single repo or two — see below)
                    └───────────────┬─────────────────────┘
                                    │
              ┌─────────────────────┴──────────────────────┐
              │                                            │
   ┌──────────▼──────────┐                     ┌───────────▼───────────┐
   │  MARKETING          │                     │  WHMCS THEME          │
   │  sws.somion.ch      │                     │  clients.somion.ch    │
   │                     │                     │                       │
   │  source: repo       │                     │  source: repo         │
   │  build: CI          │                     │  build: token export  │
   │  deploy: automatic  │                     │  deploy: to theme dir │
   │  preview per PR     │                     │  staging first        │
   └─────────────────────┘                     └───────────────────────┘
              │                                            │
              └────────────────► tokens/ ◄─────────────────┘
                        one source, two consumers
```

**Two deployables, one token source.** This is the structural expression of the condition in
Build Plan §8.1: *one design system exported to two environments.* If tokens are maintained
separately per environment they will diverge, and the moment they diverge is the Add-to-Cart
transition — the exact moment the plan identifies as where trust is lost.

The pipeline exists: `tokens/build.mjs` generates `tokens/dist/tokens.css`, which **both**
environments import. Run `node tokens/build.mjs --check` in CI for each deployable — it fails
the build if the committed CSS no longer matches `tokens.json`, so the two environments cannot
silently ship different design systems. See `tokens/README.md`.

### Repo layout

One repo, or two with the tokens published as a versioned package. **Start with one.** Two
repos means version-skew between the token package and its consumers, which is a real problem
to have later and an imaginary one to solve now.

```
sws/
├── tokens/          shared design tokens (this repo's tokens/ dir)
├── marketing/       marketing site source
├── whmcs-theme/     WHMCS child theme
└── docs/            this Phase 0 kit
```

---

## WHMCS theme strategy

**Recommendation: a child theme of Lagom 2. Never modify Lagom's own files, never touch WHMCS
core.**

| Approach | Verdict |
|---|---|
| **Child theme of Lagom 2** ✅ | Lagom and WHMCS updates apply cleanly. Customisations survive. Diffs stay small and reviewable. |
| Fork Lagom 2 | Every Lagom update becomes a manual merge. Accumulates until updates stop happening. |
| Custom theme from scratch | Re-implements a large amount of working WHMCS template logic for no design benefit that a child theme cannot deliver. |
| Edit core files | Guarantees R10. Every update overwrites the work. |

The child theme lives in `whmcs-theme/` and is deployed into the WHMCS themes directory. It is
the **only** WHMCS-side artifact under version control — WHMCS's own files and its database
are not.

**Take "before" screenshots now.** Playbook §4 requires this and it degrades daily: capture
every client-area screen in both themes and both directions into `99 · Archive` in Figma. Two
reasons — it documents what WHMCS actually imposes before you design something that cannot be
built, and it is the only way to produce a before/after comparison at the end of the project.
You cannot go back and take these later.

---

## Environments

| Env | Marketing | WHMCS | Data | Purpose |
|---|---|---|---|---|
| **Local** | dev server | Local WHMCS or theme-only preview | Fixtures | Day-to-day |
| **Preview** | Per pull request | — | Production prices, no customer data | Design review before merge |
| **Staging** | Yes | **Required** | Anonymised production copy | Full-funnel and payment testing |
| **Production** | `sws.somion.ch` | `clients.somion.ch` | Live | — |

**Staging WHMCS is not optional.** The payment flow cannot be tested anywhere else: five
gateways, redirect and iframe and OTP variants, 3-D Secure, and the Dunning cycle which is
time-based and needs date manipulation to exercise at all. Testing that in production means
testing it on customers.

Staging must use **gateway sandbox credentials**, never live ones.

---

## Version freeze (R10)

1. Record the exact WHMCS version in `decisions/adr/` when **B6** closes.
2. **Disable automatic updates** for the duration of the project.
3. Security patches are the exception — apply on staging, run the regression checklist, then
   production. Do not skip a security patch to preserve a freeze.
4. Re-validate the `api_actions` column in `inventory/screens.csv` against the frozen version's
   documentation. Build Plan §9 explicitly warns that action names change between versions and
   that some are admin-only and invalid from a customer context.
5. Plan the un-freeze. A version frozen for 28 weeks is a large upgrade at the end — schedule
   it as work rather than discovering it.

---

## Release process

**Marketing** — merge to `main` → CI builds → deploy. Preview per PR. Rollback is a redeploy of
the previous build.

**WHMCS theme** — merge to `main` → deploy to staging → verify → deploy to production during a
low-traffic window. Rollback is a redeploy of the previous theme version.

Because the price data is a committed artifact (`prices.json`, see `pricing-sync.md`), a
rollback restores prices along with code. Nothing is left pointing at values from a build that
no longer exists.

### Pre-release checklist

- [ ] Purchase path works end to end on **every enabled gateway** (staging, sandbox credentials)
- [ ] Arabic RTL verified on changed screens — both directions, both themes
- [ ] Arabic invoice PDF renders correctly (`C-16` — separate engine, separate failure mode)
- [ ] Emails render in Gmail, Outlook, and Apple Mail in Arabic
- [ ] Accessibility gate passes (`node tokens/a11y-gate.mjs`) — zero AA failures
- [ ] Design tokens are in sync (`node tokens/build.mjs --check`) — both environments ship the
      same generated CSS
- [ ] Analytics events fire and cross-domain continuity holds
- [ ] No console errors on the conversion path
- [ ] Rollback verified as available

---

## Secrets

The WHMCS API credential, gateway keys, and analytics tokens are **never committed**. The
`.gitignore` covers `.env*` and key files; commit a `.env.example` with names and no values.

Related and current: the spec PDF in `00-source/` carries a **working password** for
`clients.somion.ch` on its cover page. Rotate that account. Logged as **G8** in
`gaps/gap-register.md`. Note that rotating the credential does not remove it from the PDF or
from anywhere the PDF has already been shared.

---

## Open items

- [ ] Answer every question in "Must confirm" above — this document is assumption until then
- [ ] **B6** — freeze the version, record it in an ADR
- [ ] **I8** — establish whether existing customers exist and in what number
- [ ] Confirm a staging WHMCS instance can be provisioned, and what it costs
- [ ] Decide the deploy mechanism for the WHMCS theme (CI push vs manual, and who holds access)
- [ ] Verify a backup restore actually works before the first production theme deploy
