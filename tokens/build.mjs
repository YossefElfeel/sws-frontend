#!/usr/bin/env node
/**
 * Token export pipeline — tokens.json -> dist/tokens.css
 *
 * Build Plan section 8.1 names the condition the hybrid architecture depends on:
 *
 *   "one design system exported to two environments (shared CSS tokens). Without it the two
 *    sites will look like two different companies at the moment the user goes from 'Order Now'
 *    to the cart — which is exactly the moment trust is lost."
 *
 * This is that export. One source, one generated file, two consumers: the marketing site and
 * the WHMCS Lagom child theme. Neither hand-copies a value.
 *
 *   node tokens/build.mjs           # validate and write dist/tokens.css
 *   node tokens/build.mjs --check   # validate and fail if dist/ is stale (for CI)
 *
 * Exit codes: 0 = ok, 1 = validation failed or output is stale, 2 = could not run.
 *
 * ── TWO DELIBERATE DESIGN CHOICES ────────────────────────────────────────────
 *
 * 1. PRIMITIVES ARE NOT EXPORTED.
 *    The governing rule is that no component may reference a primitive directly — that is what
 *    keeps dark mode a values swap instead of a redesign. Rather than merely documenting the
 *    rule, this exporter makes it unbreakable: there is no `--sws-purple-500` to reference,
 *    because primitives never reach CSS. A developer cannot violate the rule by accident.
 *
 * 2. COMPONENT TOKENS ARE EMITTED ONCE, AS var() REFERENCES.
 *    `--sws-button-primary-bg: var(--sws-action-primary)` is emitted a single time in :root.
 *    When the theme flips, the semantic variable changes and every component follows through
 *    the CSS cascade. No component token is duplicated per theme.
 *
 *    The exception is alpha-composited tokens (the banner tints). Those flatten a status
 *    colour against a surface, so the result differs per theme and must be emitted in each
 *    theme block. `color-mix()` would let them be emitted once, but browser support scope is
 *    still open (decision C23), so this emits pre-computed rgba() instead. Verbosity is free
 *    in a generated file; a broken banner on an older Safari is not.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'tokens.json');
const OUT_DIR = join(HERE, 'dist');
const OUT = join(OUT_DIR, 'tokens.css');
const CHECK = process.argv.includes('--check');
const PREFIX = '--sws-';

let tokens;
try {
  tokens = JSON.parse(readFileSync(SRC, 'utf8'));
} catch (err) {
  console.error(`Could not read tokens.json: ${err.message}`);
  process.exit(2);
}

const THEMES = ['light', 'dark'];
const errors = [];

/**
 * Component groups, excluding `$`-prefixed metadata keys. The `$description` on the component
 * block is a plain string, so iterating it unfiltered walks it character by character.
 */
const components = () =>
  Object.entries(tokens.component ?? {})
    .filter(([name, group]) => !name.startsWith('$') && group && typeof group === 'object');

/** Real tokens inside a component group, excluding `$` metadata. */
const groupTokens = (group) =>
  Object.entries(group).filter(([name]) => !name.startsWith('$'));

// ── resolution ───────────────────────────────────────────────────────────────

/** Resolve `{primitive.purple.500}` to a literal. Primitive refs only. */
function resolvePrimitive(value, seen = 0) {
  if (seen > 10) throw new Error(`Reference loop at ${value}`);
  if (typeof value !== 'string' || !value.startsWith('{')) return value;
  const path = value.slice(1, -1).split('.');
  let node = tokens;
  for (const key of path) {
    node = node?.[key];
    if (node === undefined) throw new Error(`Unresolved reference: ${value}`);
  }
  return resolvePrimitive(node.$value ?? node, seen + 1);
}

/**
 * Component values reference the semantic layer WITHOUT a theme:
 *   "{semantic.action-primary}"  not  "{semantic.light.action-primary}"
 *
 * That is intentional — the semantic layer is the theme-agnostic API, and in CSS the cascade
 * resolves it. So this returns the CSS variable name, not a colour, and separately verifies
 * the token exists in BOTH themes (a name present in only one silently breaks that theme).
 */
function semanticRefToVar(value) {
  const match = /^\{semantic\.([\w-]+)\}$/.exec(value);
  if (!match) return null;
  const name = match[1];
  for (const theme of THEMES) {
    if (!tokens.semantic?.[theme]?.[name]) {
      throw new Error(`"{semantic.${name}}" is not defined in the "${theme}" theme`);
    }
  }
  return `var(${PREFIX}${name})`;
}

// ── colour maths (for alpha compositing) ─────────────────────────────────────

function hexToRgb(hex) {
  const clean = String(hex).replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Bad hex colour: ${hex}`);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

const rgba = (hex, alpha) => `rgba(${hexToRgb(hex).join(', ')}, ${alpha})`;

// ── validation ───────────────────────────────────────────────────────────────

// The governing rule, enforced rather than documented.
for (const [compName, comp] of components()) {
  for (const [tokenName, token] of groupTokens(comp)) {
    const value = token?.$value;
    if (typeof value === 'string' && value.startsWith('{primitive.')) {
      errors.push(
        `component.${compName}.${tokenName} references a primitive (${value}). ` +
        `Components must reference the semantic layer only — otherwise dark mode breaks.`
      );
    }
  }
}

// Both themes must define the same set of semantic tokens.
{
  const [light, dark] = THEMES.map((t) => new Set(
    Object.keys(tokens.semantic?.[t] ?? {}).filter((k) => !k.startsWith('$'))
  ));
  for (const name of light) if (!dark.has(name)) errors.push(`semantic "${name}" is missing from the dark theme`);
  for (const name of dark) if (!light.has(name)) errors.push(`semantic "${name}" is missing from the light theme`);
}

// Every semantic value must resolve to a literal.
for (const theme of THEMES) {
  for (const [name, token] of Object.entries(tokens.semantic?.[theme] ?? {})) {
    if (name.startsWith('$')) continue;
    try {
      resolvePrimitive(token.$value);
    } catch (err) {
      errors.push(`semantic.${theme}.${name}: ${err.message}`);
    }
  }
}

// Every component value must resolve — to a semantic var, or a literal.
for (const [compName, comp] of components()) {
  for (const [tokenName, token] of groupTokens(comp)) {
    const value = token?.$value;
    try {
      if (typeof value === 'string' && value.startsWith('{semantic.')) {
        semanticRefToVar(value);
      } else if (typeof value === 'string' && value.startsWith('{')) {
        resolvePrimitive(value);
      }
    } catch (err) {
      errors.push(`component.${compName}.${tokenName}: ${err.message}`);
    }
  }
}

if (errors.length) {
  console.error(`\n  Token validation failed — ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`    - ${e}`);
  console.error('');
  process.exit(1);
}

// ── generation ───────────────────────────────────────────────────────────────

const lines = [];
const out = (s = '') => lines.push(s);
const section = (title) => { out(); out(`  /* ${'─'.repeat(2)} ${title} ${'─'.repeat(Math.max(2, 68 - title.length))} */`); };

/**
 * Variables whose value depends on the active theme: the semantic layer, plus any component
 * token that composites an alpha over a surface.
 */
function themeBlock(theme, indent = '  ') {
  const body = [];
  const push = (name, value) => body.push(`${indent}${PREFIX}${name}: ${value};`);

  for (const [name, token] of Object.entries(tokens.semantic[theme])) {
    if (name.startsWith('$')) continue;
    push(name, resolvePrimitive(token.$value));
  }

  // Alpha-composited component tokens — theme-dependent, so emitted per theme.
  for (const [compName, comp] of components()) {
    for (const [tokenName, token] of groupTokens(comp)) {
      const alpha = token?.$extensions?.['sws.alpha'];
      if (alpha === undefined) continue;
      const base = resolvePrimitive(
        tokens.semantic[theme][/^\{semantic\.([\w-]+)\}$/.exec(token.$value)[1]].$value
      );
      push(`${compName}-${tokenName}`, rgba(base, alpha));
    }
  }
  return body;
}

const stamp = tokens.$description ? '' : '';
out('/*');
out(' * SWS design tokens — GENERATED FILE, DO NOT EDIT.');
out(' *');
out(' * Source:    tokens/tokens.json');
out(' * Regenerate: node tokens/build.mjs');
out(' * Verify:     node tokens/build.mjs --check   (fails if this file is stale)');
out(' *');
out(' * Consumed by BOTH the marketing site and the WHMCS Lagom child theme. One source, one');
out(' * generated file — see Build Plan section 8.1 on why the two must not diverge.');
out(' *');
out(' * Primitives are deliberately absent. Components reference the semantic layer only; there');
out(' * is no --sws-purple-500 to reach for, which makes the rule impossible to break by accident.');
out(' *');
out(' * All variables are prefixed --sws- to avoid colliding with Lagom 2\'s own properties.');
out(' */');
out();

// ── :root — light theme + theme-independent values ───────────────────────────

out(':root {');
section('semantic — light theme');
out(themeBlock('light').join('\n'));

section('component — resolves through the semantic layer, so themes follow automatically');
for (const [compName, comp] of components()) {
  for (const [tokenName, token] of groupTokens(comp)) {
    if (token?.$extensions?.['sws.alpha'] !== undefined) continue; // emitted per theme above
    const value = token.$value;
    const asVar = typeof value === 'string' && value.startsWith('{semantic.')
      ? semanticRefToVar(value)
      : resolvePrimitive(value);
    out(`  ${PREFIX}${compName}-${tokenName}: ${asVar};`);
  }
}

section('spacing — base-4 scale. No value outside this scale.');
for (const step of tokens.spacing?.scale ?? []) out(`  ${PREFIX}space-${step}: ${step}px;`);

section('typography — mobile-first base; desktop overrides in the media query below');
for (const [name, spec] of Object.entries(tokens.typography?.scale ?? {})) {
  const size = spec['size-mobile'] ?? spec.size;
  out(`  ${PREFIX}font-size-${name}: ${size}px;`);
  out(`  ${PREFIX}line-height-${name}: ${spec['line-height']};`);
  out(`  ${PREFIX}font-weight-${name}: ${spec.weight};`);
}

section('accessibility — enforced by tokens/a11y-gate.mjs');
out(`  ${PREFIX}focus-ring-width: ${tokens.accessibility['focus-ring-width-px']}px;`);
out(`  ${PREFIX}touch-target-min: ${tokens.accessibility['touch-target-min-px']}px;`);
out('}');

// ── dark theme ───────────────────────────────────────────────────────────────

out();
out('/* Dark by OS preference — unless the user has explicitly chosen light. */');
out('@media (prefers-color-scheme: dark) {');
out('  :root:not([data-theme="light"]) {');
out(themeBlock('dark', '    ').join('\n'));
out('  }');
out('}');
out();
out('/* Dark by explicit choice. Spec 4.3 requires the toggle to persist, so the attribute must');
out('   win over the OS preference in both directions. */');
out(':root[data-theme="dark"] {');
out(themeBlock('dark').join('\n'));
out('}');

// ── responsive typography ────────────────────────────────────────────────────

const tabletMin = tokens.breakpoints?.tablet?.min ?? 768;
const responsive = Object.entries(tokens.typography?.scale ?? {})
  .filter(([, spec]) => spec['size-mobile'] !== undefined);

if (responsive.length) {
  out();
  out(`/* Desktop type sizes. Mobile-first: the base values above are the small ones. */`);
  out(`@media (min-width: ${tabletMin}px) {`);
  out('  :root {');
  for (const [name, spec] of responsive) out(`    ${PREFIX}font-size-${name}: ${spec.size}px;`);
  out('  }');
  out('}');
}

// ── breakpoints, as reference only ───────────────────────────────────────────

out();
out('/* ── BREAKPOINTS — reference values ──────────────────────────────────────────');
out(' *');
out(' * CSS custom properties CANNOT be used in media query conditions. These are documented');
out(' * here so the numbers are in front of you when writing one, but they must be typed as');
out(' * literals. If a build step needs them programmatically, read tokens.json directly.');
out(' *');
for (const [name, bp] of Object.entries(tokens.breakpoints ?? {})) {
  if (name.startsWith('$')) continue;
  const range = bp.max ? `${bp.min}–${bp.max}` : `${bp.min}+`;
  out(` *   ${name.padEnd(8)} ${String(range).padEnd(10)} ${bp.columns} cols · ${bp.gutter}px gutter · ${bp.margin} margin`);
}
out(' *');
out(' * Design starts at 360px. Most of the Egyptian and Gulf market arrives on a phone.');
out(' */');

// ── RTL note ─────────────────────────────────────────────────────────────────

out();
out('/* ── RTL ─────────────────────────────────────────────────────────────────────');
out(' *');
out(' * These tokens are direction-neutral values. Direction is handled where they are USED:');
out(' * always reach for logical properties — margin-inline-start, padding-inline-end,');
out(' * inset-inline-start, border-inline-start — never the physical left/right equivalents.');
out(' * With dir="rtl" on the document the browser then mirrors the layout on its own.');
out(' *');
out(' * Playbook 4.1: think in start/end, not left/right. The alternative — a separate rtl.css —');
out(' * costs 30–40% ongoing maintenance and is where most RTL bugs come from.');
out(' */');
out();

const css = lines.join('\n');

// ── write or check ───────────────────────────────────────────────────────────

if (CHECK) {
  if (!existsSync(OUT)) {
    console.error(`\n  dist/tokens.css does not exist. Run: node tokens/build.mjs\n`);
    process.exit(1);
  }
  const onDisk = readFileSync(OUT, 'utf8');
  if (onDisk !== css) {
    console.error('\n  dist/tokens.css is STALE — it does not match tokens.json.');
    console.error('  Someone edited the generated file, or changed tokens.json without rebuilding.');
    console.error('  Fix: node tokens/build.mjs\n');
    process.exit(1);
  }
  console.log('\n  dist/tokens.css is up to date with tokens.json.\n');
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, css, 'utf8');

const count = (css.match(new RegExp(`^\\s*${PREFIX}`, 'gm')) ?? []).length;
console.log(`\n  Wrote dist/tokens.css — ${count} custom properties, ${css.split('\n').length} lines.`);
console.log('  Primitives excluded by design; components resolve through the semantic layer.\n');
