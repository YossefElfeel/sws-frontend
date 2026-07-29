#!/usr/bin/env node
/**
 * Accessibility gate for the SWS design tokens.
 *
 * Three check groups:
 *   1. CONTRAST        text and non-text colour pairs, both themes
 *   2. TARGET SIZE     declared interactive component dimensions
 *   3. FOCUS INDICATOR presence and thickness of a focus ring per interactive component
 *
 * Design Playbook section 3.2 says, verbatim: "do not trust the contrast numbers — test them",
 * and section 2.3 warns that `focus` is "the most forgotten state and the most important for
 * accessibility". This turns both instructions from checklist items a designer might skip into
 * a gate that fails a build.
 *
 *   node tokens/a11y-gate.mjs            # exits 1 on any AA failure
 *   node tokens/a11y-gate.mjs --strict   # also exits 1 on AAA warnings
 *   node tokens/a11y-gate.mjs --warn     # report only, always exits 0
 *
 * Exit codes: 0 = clean, 1 = at least one blocking failure, 2 = could not run.
 *
 * ── A NOTE ON LEVELS, WHICH MATTERS ──────────────────────────────────────────
 * The Playbook presents its accessibility rules as "WCAG 2.2 AA". Two of them are not:
 *
 *   44x44 touch target   is SC 2.5.5 Target Size (Enhanced)  -> Level AAA
 *                        the AA bar is SC 2.5.8, at 24x24
 *   2px focus ring       is SC 2.4.13 Focus Appearance       -> Level AAA
 *                        SC 2.4.7 (AA) requires a visible indicator but sets no thickness
 *
 * So every check is labelled with its real SC and level. AA violations FAIL. AAA violations
 * WARN, because decision I17 commits to AA — pass --strict to hold the AAA line too. The team
 * should know which standard it is actually being measured against.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const WARN_ONLY = process.argv.includes('--warn');
const STRICT = process.argv.includes('--strict');

// ── token loading ────────────────────────────────────────────────────────────

let tokens;
try {
  tokens = JSON.parse(readFileSync(join(HERE, 'tokens.json'), 'utf8'));
} catch (err) {
  console.error(`Could not read tokens.json: ${err.message}`);
  process.exit(2);
}

const A11Y = tokens.accessibility ?? {};
const AA_NORMAL = A11Y['contrast-normal-text'] ?? 4.5;
const AA_NON_TEXT = A11Y['contrast-non-text'] ?? 3.0;
const TARGET_AAA = A11Y['touch-target-min-px'] ?? 44;
const TARGET_AA = A11Y['touch-target-aa-min-px'] ?? 24;
const FOCUS_WIDTH = A11Y['focus-ring-width-px'] ?? 2;
const INTERACTIVE = A11Y['interactive-components'] ?? [];

/** Resolve a `{primitive.purple.500}` style reference to a literal value. */
function resolve(value, seen = 0) {
  if (seen > 10) throw new Error(`Reference loop at ${value}`);
  if (typeof value !== 'string') throw new Error(`Expected string, got ${typeof value}`);
  if (!value.startsWith('{')) return value;

  const path = value.slice(1, -1).split('.');
  let node = tokens;
  for (const key of path) {
    node = node?.[key];
    if (node === undefined) throw new Error(`Unresolved reference: ${value}`);
  }
  return resolve(node.$value ?? node, seen + 1);
}

function semantic(theme, name) {
  const token = tokens.semantic?.[theme]?.[name];
  if (!token) throw new Error(`No semantic token "${name}" in theme "${theme}"`);
  return resolve(token.$value);
}

/** Read a component token, or undefined if it is not declared. */
function component(name, token) {
  return tokens.component?.[name]?.[token];
}

/** "32px" -> 32 */
function px(dimension) {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(String(dimension).trim());
  if (!match) throw new Error(`Not a px dimension: ${dimension}`);
  return parseFloat(match[1]);
}

// ── WCAG maths ───────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Bad hex colour: ${hex}`);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function flatten(fgHex, bgHex, alpha) {
  if (alpha >= 1) return fgHex;
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const mixed = fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
  return '#' + mixed.map((c) => c.toString(16).padStart(2, '0')).join('');
}

function contrast(aHex, bHex) {
  const a = luminance(aHex);
  const b = luminance(bHex);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// ── results ──────────────────────────────────────────────────────────────────

const PASS = 'pass', FAIL = 'FAIL', WARN = 'WARN', TODO = 'TODO';
const results = [];
const record = (group, verdict, label, detail, sc) =>
  results.push({ group, verdict, label, detail, sc });

// ── 1. contrast ──────────────────────────────────────────────────────────────

/** [foreground, background, minimum, label, SC] */
const PAIRS = [
  ['text-primary',   'surface-base',   AA_NORMAL,   'Primary text on page background',   '1.4.3 AA'],
  ['text-primary',   'surface-raised', AA_NORMAL,   'Primary text on cards',             '1.4.3 AA'],
  ['text-primary',   'surface-sunken', AA_NORMAL,   'Primary text in inputs',            '1.4.3 AA'],
  ['text-secondary', 'surface-base',   AA_NORMAL,   'Secondary text on page background', '1.4.3 AA'],
  ['text-secondary', 'surface-raised', AA_NORMAL,   'Secondary text on cards',           '1.4.3 AA'],
  ['text-secondary', 'surface-sunken', AA_NORMAL,   'Placeholder text in inputs',        '1.4.3 AA'],
  ['text-on-action', 'action-primary', AA_NORMAL,   'Button label on primary button',    '1.4.3 AA'],
  ['action-primary', 'surface-base',   AA_NORMAL,   'Link text on page background',      '1.4.3 AA'],
  ['action-primary', 'surface-raised', AA_NORMAL,   'Link text on cards',                '1.4.3 AA'],
  ['border-strong',  'surface-base',   AA_NON_TEXT, 'Input border on page background',   '1.4.11 AA'],
  ['border-strong',  'surface-raised', AA_NON_TEXT, 'Input border on cards',             '1.4.11 AA'],
  ['focus-ring',     'surface-base',   AA_NON_TEXT, 'Focus ring on page background',     '1.4.11 AA'],
  ['focus-ring',     'surface-raised', AA_NON_TEXT, 'Focus ring on cards',               '1.4.11 AA'],
  ['status-danger',  'surface-raised', AA_NORMAL,   'Danger text on cards',              '1.4.3 AA'],
  ['status-success', 'surface-raised', AA_NORMAL,   'Success text on cards',             '1.4.3 AA'],
  ['status-warning', 'surface-raised', AA_NORMAL,   'Warning text on cards',             '1.4.3 AA'],
  ['status-info',    'surface-raised', AA_NORMAL,   'Info text on cards',                '1.4.3 AA'],
];

const BANNER_ALPHA = 0.12;
const BANNER_SEVERITIES = ['danger', 'success', 'warning', 'info'];

for (const theme of ['light', 'dark']) {
  for (const [fgName, bgName, min, label, sc] of PAIRS) {
    try {
      const fg = semantic(theme, fgName);
      const bg = semantic(theme, bgName);
      const ratio = contrast(fg, bg);
      record('contrast', ratio >= min ? PASS : FAIL, `${theme}  ${label}`,
        `${ratio.toFixed(2)}:1  (min ${min})  ${fg} on ${bg}`, sc);
    } catch (err) {
      record('contrast', FAIL, `${theme}  ${label}`, err.message, sc);
    }
  }

  for (const severity of BANNER_SEVERITIES) {
    try {
      const status = semantic(theme, `status-${severity}`);
      const surface = semantic(theme, 'surface-raised');
      const bg = flatten(status, surface, BANNER_ALPHA);
      const ratio = contrast(status, bg);
      record('contrast', ratio >= AA_NORMAL ? PASS : FAIL,
        `${theme}  ${severity} text on ${severity} banner (${BANNER_ALPHA * 100}% tint)`,
        `${ratio.toFixed(2)}:1  (min ${AA_NORMAL})  ${status} on ${bg}`, '1.4.3 AA');
    } catch (err) {
      record('contrast', FAIL, `${theme}  ${severity} banner`, err.message, '1.4.3 AA');
    }
  }
}

// ── 2. target size ───────────────────────────────────────────────────────────
//
// Only dimensions actually declared in tokens.json are checked. Components whose sizes are
// not yet specified are reported as TODO rather than silently passing — an unchecked
// component must never look like a compliant one.

const TARGET_CHECKS = [
  ['button', 'height-sm', 'Button sm'],
  ['button', 'height-md', 'Button md (default)'],
  ['button', 'height-lg', 'Button lg'],
];

for (const [comp, token, label] of TARGET_CHECKS) {
  const declared = component(comp, token);
  if (!declared) {
    record('target', TODO, label, 'no dimension declared', '2.5.8 AA / 2.5.5 AAA');
    continue;
  }
  try {
    const size = px(resolve(declared.$value));
    if (size < TARGET_AA) {
      record('target', FAIL, label,
        `${size}px — below the AA minimum of ${TARGET_AA}px`, '2.5.8 AA');
    } else if (size < TARGET_AAA) {
      record('target', WARN, label,
        `${size}px — meets AA (${TARGET_AA}px), below project rule (${TARGET_AAA}px)`, '2.5.5 AAA');
    } else {
      record('target', PASS, label, `${size}px (>= ${TARGET_AAA}px)`, '2.5.5 AAA');
    }
  } catch (err) {
    record('target', FAIL, label, err.message, '2.5.8 AA');
  }
}

// Interactive components with no declared size at all
for (const comp of INTERACTIVE) {
  if (TARGET_CHECKS.some(([c]) => c === comp)) continue;
  const hasSize = Object.keys(tokens.component?.[comp] ?? {})
    .some((k) => k.startsWith('height') || k.startsWith('size') || k === 'hit-area');
  if (!hasSize) {
    record('target', TODO, comp, 'no size or hit-area token declared', '2.5.8 AA / 2.5.5 AAA');
  }
}

// ── 3. focus indicator ───────────────────────────────────────────────────────
//
// Playbook 2.3: `focus` is "the most forgotten state and the most important for
// accessibility". This is a completeness check as much as a conformance one — a component
// with no focus token has not been checked, and must not read as compliant.

for (const comp of INTERACTIVE) {
  const width = component(comp, 'focus-ring-width');
  if (!width) {
    record('focus', TODO, comp, 'no focus-ring-width declared', '2.4.7 AA / 2.4.13 AAA');
    continue;
  }
  try {
    const w = px(resolve(width.$value));
    if (w <= 0) {
      record('focus', FAIL, comp, `${w}px — no visible focus indicator`, '2.4.7 AA');
    } else if (w < FOCUS_WIDTH) {
      record('focus', WARN, comp,
        `${w}px — visible, below project rule (${FOCUS_WIDTH}px)`, '2.4.13 AAA');
    } else {
      record('focus', PASS, comp, `${w}px (>= ${FOCUS_WIDTH}px)`, '2.4.13 AAA');
    }
  } catch (err) {
    record('focus', FAIL, comp, err.message, '2.4.7 AA');
  }
}

// ── report ───────────────────────────────────────────────────────────────────

const GROUPS = [
  ['contrast', 'CONTRAST', 'colour pairs, both themes'],
  ['target', 'TARGET SIZE', 'declared interactive dimensions'],
  ['focus', 'FOCUS INDICATOR', 'presence and thickness per component'],
];

const pad = (s, n) => String(s).padEnd(n);

for (const [key, title, subtitle] of GROUPS) {
  const rows = results.filter((r) => r.group === key);
  if (!rows.length) continue;
  const n = (v) => rows.filter((r) => r.verdict === v).length;

  console.log(`\n  ${title}  —  ${subtitle}`);
  console.log(`  ${n(PASS)} pass · ${n(FAIL)} fail · ${n(WARN)} warn · ${n(TODO)} not specified`);
  console.log('  ' + '-'.repeat(96));

  for (const r of rows) {
    const sc = key === 'contrast' && r.verdict === PASS ? '' : `  SC ${r.sc}`;
    console.log(`  ${r.verdict}   ${pad(r.label, 52)} ${pad(r.detail, 58)}${sc}`);
  }
}

const failures = results.filter((r) => r.verdict === FAIL);
const warnings = results.filter((r) => r.verdict === WARN);
const todos = results.filter((r) => r.verdict === TODO);

console.log('\n  ' + '='.repeat(96));

if (!failures.length && !warnings.length && !todos.length) {
  console.log(`  All ${results.length} checks pass.`);
} else {
  console.log(`  ${results.length} checks: ${results.length - failures.length - warnings.length - todos.length} pass · ${failures.length} fail · ${warnings.length} warn · ${todos.length} not specified\n`);
  if (failures.length) {
    console.log(`  ${failures.length} FAILURE(S) — WCAG 2.2 AA. These block release.`);
    console.log('  Fix in the SEMANTIC layer. One value there fixes every component that');
    console.log('  references it. Never patch an individual component.\n');
  }
  if (warnings.length) {
    console.log(`  ${warnings.length} WARNING(S) — AAA-level rules the Playbook states as if they were AA.`);
    console.log('  Decision I17 commits to AA, so these do not block. Run --strict to hold the');
    console.log('  AAA line, or amend the rule in tokens.accessibility if the team does not');
    console.log('  intend to meet it — but decide it, do not drift into it.\n');
  }
  if (todos.length) {
    console.log(`  ${todos.length} NOT SPECIFIED — no token declared, so nothing was verified.`);
    console.log('  These are not passes. Add tokens as each component is designed.\n');
  }
}
console.log('  ' + '='.repeat(96) + '\n');

const blocking = failures.length + (STRICT ? warnings.length : 0);
process.exit(blocking > 0 && !WARN_ONLY ? 1 : 0);
