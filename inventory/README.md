# Screen Inventory

`screens.csv` — every screen in the SWS redesign as filterable data, transcribed from
Build Plan §5 with the corrected WHMCS API actions from Build Plan §9.

This is the artifact that makes the work plannable. The Build Plan itself says the
customization column is the most important column in the project and that *"any deadline
commitment made before reviewing this column is a commitment to guesswork."* It could not be
reviewed while it lived inside an HTML table.

---

## The count is 84, not 74

**The source document's summary does not match its own tables.**

| | Build Plan §5 summary claims | Actual row count in §5 tables |
|---|---|---|
| Total screens | 74 | **84** |
| `full` (free to design) | 31 | **33** |
| `limited` (WHMCS-constrained) | 35 | **43** |
| `closed` (third-party output) | 8 | **8** ✓ |

Verified by counting `<tr>` rows and customization tags directly in
`00-source/SWS-Build-Plan-v1.1.html` on 2026-07-29. The `closed` figure is correct; `full` is
understated by 2 and `limited` by 8.

**Why this matters:** the 573 person-day estimate, the ~260-state figure, and the 28-week
schedule are all anchored to 74 screens. The real enumeration is 13.5% larger, and the
understatement falls almost entirely on `limited` — the harder category, where WHMCS dictates
the HTML structure and every design decision needs developer confirmation first.

This does not automatically mean the estimate is 13.5% low; several of the extra rows are
low-complexity. But the estimate was built on a screen count that the document's own tables
contradict, so it needs re-checking before anyone commits to a date. Logged as **G9** in
`gaps/gap-register.md`.

A second, smaller inconsistency: the v1.1 audit claims relocating pricing to the marketing
site *"converts 8 screens from limited to full."* In the §5 tables, M-02 through M-10 are
**already** marked `full`. Of the pricing-related screens, only M-12 is actually `limited`.
The design win is real but smaller than stated.

---

## Columns

| Column | Meaning |
|---|---|
| `id` | Stable screen ID from Build Plan §5. Never renumber — everything cross-references these. |
| `name_ar` / `name_en` | Screen name. Arabic is authoritative (matches the source docs). |
| `group` | `marketing` · `ordering` · `auth` · `client-area` · `system` |
| `customization` | How much design freedom exists. See key below. |
| `priority` | `P0`–`P3` from the source, **except M-20** — see override note in its row. |
| `design_complexity` | `low` · `medium` · `high` · `very-high` |
| `states` | Semicolon-separated list of states that must be designed. |
| `states_count` | Number of states. **Estimate on this, not on screen count.** |
| `phase` | Target phase from Build Plan §10, refined by Playbook §16. |
| `owner` | Assign a name. Blank means unassigned. |
| `status` | `not-started` · `in-progress` · `in-review` · `ready-for-dev` · `built` |
| `api_actions` | Corrected WHMCS actions from Build Plan §9 — **not** the spec PDF's table, which has known errors. |
| `blocked_by` | Decision IDs from `decisions/decision-log.md`. Semicolon-separated. |
| `notes` | Constraints, overrides, and traps. |

### Customization key

| Value | Meaning | Count |
|---|---|---|
| `full` | Complete design freedom. No structural constraint to hide behind. | 33 |
| `limited` | WHMCS or a module dictates the HTML structure. Styling is free; restructuring needs developer confirmation **before** design starts. | 43 |
| `closed` | Third-party output or a separate rendering engine. Influence on appearance is very limited. | 8 |

---

## Global blockers not listed per row

Four open decisions block essentially every row. Repeating them 84 times would make
`blocked_by` useless, so they are recorded here instead:

| ID | Decision | Blocks |
|---|---|---|
| **B3** | Approval of the customization table as the formal definition of "custom design" | All estimation |
| **B4** | Numerals — Hindi (٠١٢٣) or Arabic (0123) | Every screen containing a number, i.e. nearly all of them |
| **B6** | WHMCS version freeze | The validity of every `api_actions` value |
| **B7a** | How many of the 7 active languages to keep | Every button and label width in the component library |

`B4` is listed explicitly only on the screens where the choice is most consequential
(M-11, O-02 — domain names, EPP codes, and IPs must stay LTR regardless of the answer).

---

## Using it

**Open in Excel on Windows:** the file is UTF-8 with a BOM, so double-clicking renders Arabic
correctly. If your tooling chokes on the BOM, read it as `utf-8-sig`.

**The Phase 2 work list** — the conversion path, which is where the revenue is:

```bash
python -c "import csv;[print(r['id'],r['name_en']) for r in csv.DictReader(open('screens.csv',encoding='utf-8-sig')) if r['phase']=='2']"
```

**Screens with no structural excuse** (`full` + `P0` — 11 of them). These are where design
quality is judged, because nothing can be blamed on WHMCS:

```bash
python -c "import csv;[print(r['id'],r['name_en']) for r in csv.DictReader(open('screens.csv',encoding='utf-8-sig')) if r['customization']=='full' and r['priority']=='P0']"
```

**What is blocked right now:**

```bash
python -c "import csv;[print(r['id'],r['blocked_by']) for r in csv.DictReader(open('screens.csv',encoding='utf-8-sig')) if r['blocked_by']]"
```

---

## Keeping it honest

When a decision closes in `decisions/decision-log.md`, clear the matching value from
`blocked_by` in the same commit. A stale `blocked_by` field is worse than none — the team
stops trusting the filter and goes back to asking in chat.

Do **not** edit the HTML source documents when this file changes. They are versioned
snapshots; this is the living state. See the governance rule in the root `README.md`.
