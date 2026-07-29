#!/usr/bin/env node
/**
 * WCAG contrast gate for the SWS semantic token layer.
 *
 * Design Playbook section 3.2 says, verbatim: "do not trust the contrast numbers — test them",
 * and predicts which pairs usually fail: secondary text on raised surfaces in dark mode,
 * text over coloured status backgrounds, and disabled text.
 *
 * This turns that instruction from a checklist item a designer might skip into a gate that
 * fails a build. Run it before every release.
 *
 *   node tokens/contrast-check.mjs          # report + exit 1 on any failure
 *   node tokens/contrast-check.mjs --warn    # report only, always exit 0
 *
 * Exit codes: 0 = all pass (or --warn), 1 = at least one failure, 2 = could not run.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const WARN_ONLY = process.argv.includes('--warn');

// ── token loading ────────────────────────────────────────────────────────────

let tokens;
try {
  tokens = JSON.parse(readFileSync(join(HERE, 'tokens.json'), 'utf8'));
} catch (err) {
  console.error(`Could not read tokens.json: ${err.message}`);
  process.exit(2);
}

const AA_NORMAL = tokens.accessibility?.['contrast-normal-text'] ?? 4.5;
const AA_LARGE = tokens.accessibility?.['contrast-large-text'] ?? 3.0;
const AA_NON_TEXT = tokens.accessibility?.['contrast-non-text'] ?? 3.0;

/** Resolve a `{primitive.purple.500}` style reference to a hex string. */
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

/** Read a semantic token for a theme and return its hex value. */
function semantic(theme, name) {
  const token = tokens.semantic?.[theme]?.[name];
  if (!token) throw new Error(`No semantic token "${name}" in theme "${theme}"`);
  return resolve(token.$value);
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

/** Relative luminance, WCAG 2.x definition. */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Composite a foreground over a background at a given alpha. */
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

// ── the pairs that must pass ─────────────────────────────────────────────────

/** [foreground, background, minimum ratio, label] */
const PAIRS = [
  // Body text on every surface
  ['text-primary',   'surface-base',     AA_NORMAL,   'Primary text on page background'],
  ['text-primary',   'surface-raised',   AA_NORMAL,   'Primary text on cards'],
  ['text-primary',   'surface-sunken',   AA_NORMAL,   'Primary text in inputs'],

  // Playbook flags secondary-on-raised in dark as a usual failure
  ['text-secondary', 'surface-base',     AA_NORMAL,   'Secondary text on page background'],
  ['text-secondary', 'surface-raised',   AA_NORMAL,   'Secondary text on cards  <-- usual failure'],
  ['text-secondary', 'surface-sunken',   AA_NORMAL,   'Placeholder text in inputs'],

  // Primary action
  ['text-on-action', 'action-primary',   AA_NORMAL,   'Button label on primary button'],
  ['action-primary', 'surface-base',     AA_NORMAL,   'Link text on page background'],
  ['action-primary', 'surface-raised',   AA_NORMAL,   'Link text on cards'],

  // Non-text: borders and focus ring (3:1)
  ['border-strong',  'surface-base',     AA_NON_TEXT, 'Input border on page background'],
  ['border-strong',  'surface-raised',   AA_NON_TEXT, 'Input border on cards'],
  ['focus-ring',     'surface-base',     AA_NON_TEXT, 'Focus ring on page background'],
  ['focus-ring',     'surface-raised',   AA_NON_TEXT, 'Focus ring on cards'],

  // Status colours as text — the other predicted failure area
  ['status-danger',  'surface-raised',   AA_NORMAL,   'Danger text on cards'],
  ['status-success', 'surface-raised',   AA_NORMAL,   'Success text on cards'],
  ['status-warning', 'surface-raised',   AA_NORMAL,   'Warning text on cards'],
  ['status-info',    'surface-raised',   AA_NORMAL,   'Info text on cards'],
];

/**
 * Banner tokens composite a status colour at 12% over a surface, then put status-coloured
 * text on top. Checked separately because the background is a computed composite.
 */
const BANNER_ALPHA = 0.12;
const BANNER_SEVERITIES = ['danger', 'success', 'warning', 'info'];

// ── run ──────────────────────────────────────────────────────────────────────

const results = [];

for (const theme of ['light', 'dark']) {
  for (const [fgName, bgName, min, label] of PAIRS) {
    try {
      const fg = semantic(theme, fgName);
      const bg = semantic(theme, bgName);
      const ratio = contrast(fg, bg);
      results.push({ theme, label, fg, bg, ratio, min, pass: ratio >= min });
    } catch (err) {
      results.push({ theme, label, error: err.message, pass: false });
    }
  }

  // Status text over its own tinted banner background
  for (const severity of BANNER_SEVERITIES) {
    try {
      const status = semantic(theme, `status-${severity}`);
      const surface = semantic(theme, 'surface-raised');
      const bannerBg = flatten(status, surface, BANNER_ALPHA);
      const ratio = contrast(status, bannerBg);
      results.push({
        theme,
        label: `${severity} text on ${severity} banner (${BANNER_ALPHA * 100}% tint)  <-- usual failure`,
        fg: status,
        bg: bannerBg,
        ratio,
        min: AA_NORMAL,
        pass: ratio >= AA_NORMAL,
      });
    } catch (err) {
      results.push({ theme, label: `${severity} banner`, error: err.message, pass: false });
    }
  }
}

// ── report ───────────────────────────────────────────────────────────────────

const pad = (s, n) => String(s).padEnd(n);

for (const theme of ['light', 'dark']) {
  const rows = results.filter((r) => r.theme === theme);
  const failed = rows.filter((r) => !r.pass).length;

  console.log(`\n  ${theme.toUpperCase()} THEME  —  ${rows.length - failed}/${rows.length} pass`);
  console.log('  ' + '-'.repeat(88));

  for (const r of rows) {
    if (r.error) {
      console.log(`  ERROR  ${pad(r.label, 58)} ${r.error}`);
      continue;
    }
    const mark = r.pass ? 'pass  ' : 'FAIL  ';
    const ratio = `${r.ratio.toFixed(2)}:1`.padStart(8);
    console.log(`  ${mark} ${pad(r.label, 58)} ${ratio}  (min ${r.min})  ${r.fg} on ${r.bg}`);
  }
}

const failures = results.filter((r) => !r.pass);

console.log('\n' + '  ' + '='.repeat(88));
if (failures.length === 0) {
  console.log(`  All ${results.length} pairs pass WCAG AA in both themes.`);
} else {
  console.log(`  ${failures.length} of ${results.length} pairs FAIL WCAG AA.\n`);
  console.log('  These are findings, not bugs in this script. Playbook section 3.2 predicts');
  console.log('  exactly these failures. Fix them in the SEMANTIC layer — changing a value in');
  console.log('  one place fixes every component that references it. Never patch a component.');
}
console.log('  ' + '='.repeat(88) + '\n');

process.exit(failures.length > 0 && !WARN_ONLY ? 1 : 0);
