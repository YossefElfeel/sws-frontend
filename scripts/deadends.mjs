/**
 * Static audit for the three kinds of nothing.
 *
 *   1. a control wired to nothing at all
 *   2. a form whose submit only calls preventDefault — it looks like it saved and did not
 *   3. a screen with no way onward
 *
 * This exists because "some buttons don't work" is the one defect a screenshot never shows and
 * a typecheck never catches. It ran once by hand and found twenty-one; it runs every time now.
 *
 * Exceptions are listed rather than silenced, each with the reason it is not a defect. An
 * exception that stops matching is itself reported, so the list cannot rot into a blanket.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Known non-defects. Each must still match something, or the entry is stale. */
const ALLOWED = [
  {
    id: 'components/Button.tsx:Button',
    why: 'The Button component itself. It forwards onClick from props; the JSX here has none.',
  },
  {
    id: 'screens/Compare.tsx:tld-search',
    why: 'The TLD list filters on input. Submitting has nothing left to do, which is correct.',
  },
  {
    id: 'components/TableToolbar.tsx:search',
    why:
      'Same, for every dashboard table now: the toolbar filters as you type. The form exists so ' +
      'that Enter is a submit the browser understands rather than a keypress that does nothing.',
  },
  {
    id: 'screens/Order.tsx:gatewayDestination',
    why: 'A pure function that maps a gateway id to a route. Not a screen.',
  },
];

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const files = walk('prototype/src').filter((f) => f.endsWith('.tsx'));
const findings = [];
const matchedExceptions = new Set();

const allow = (id) => {
  const hit = ALLOWED.find((a) => a.id === id);
  if (hit) matchedExceptions.add(id);
  return Boolean(hit);
};

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const short = f.replace(/\\/g, '/').split('prototype/src/')[1];
  const lineOf = (i) => src.slice(0, i).split('\n').length;

  // ── 1. controls wired to nothing ───────────────────────────────────────────
  /*
   * Attributes are read with a brace-aware scan rather than [^>]*, because an expression can
   * contain the very character that would end the tag: disabled={ns.length >= 5} truncated the
   * match right before its own onClick and reported a working button as dead.
   */
  for (const tag of ['Button', 'button']) {
    let i = 0;
    while ((i = src.indexOf(`<${tag}`, i)) !== -1) {
      const after = src[i + tag.length + 1];
      if (after && /[A-Za-z0-9_]/.test(after)) { i += 1; continue; }
      let j = i + tag.length + 1;
      let depth = 0;
      while (j < src.length) {
        const c = src[j];
        if (c === '{') depth++;
        else if (c === '}') depth--;
        else if (c === '>' && depth === 0) break;
        j++;
      }
      const attrs = src.slice(i + tag.length + 1, j);
      const selfClosing = src[j - 1] === '/';
      const close = selfClosing ? j : src.indexOf(`</${tag}>`, j);
      const body = selfClosing ? '' : src.slice(j + 1, close === -1 ? j + 1 : close);
      i = j + 1;

      const alwaysOff = /\sdisabled(\s|\/|$|=\{true\})/.test(attrs);
      if (/onClick|type="submit"/.test(attrs) || alwaysOff) continue;
      if (short === 'components/Button.tsx' && allow('components/Button.tsx:Button')) continue;
      const label = body.match(/t\('([^']+)'\)/)?.[1] ?? body.trim().replace(/\s+/g, ' ').slice(0, 28);
      findings.push({ kind: 'control', where: `${short}:${lineOf(i)}`, what: label });
    }
  }

  // ── 2. forms that only swallow the event ──────────────────────────────────
  for (const m of src.matchAll(/onSubmit=\{\(e\)\s*=>\s*e\.preventDefault\(\)\}/g)) {
    /* The window looks backwards as well as forwards: what names a form is sometimes an
       attribute on the form tag itself, which sits before the onSubmit that matched. */
    const near = src.slice(Math.max(0, m.index - 200), m.index + 400);
    /* The knowledgebase search used to live in Support.tsx and was found by its `kbq` id. It is
       the shared table toolbar now, and every list wears it, so the search form is named once
       by its role rather than per screen. */
    const id = near.includes('tldq')
      ? 'screens/Compare.tsx:tld-search'
      : near.includes('role="search"')
        ? 'components/TableToolbar.tsx:search'
        : `${short}:${lineOf(m.index)}`;
    if (allow(id)) continue;
    findings.push({ kind: 'form', where: `${short}:${lineOf(m.index)}`, what: 'preventDefault only' });
  }

  // ── 3. screens with no way onward ─────────────────────────────────────────
  if (short.startsWith('screens/')) {
    for (const fn of src.matchAll(/export function (\w+)\(/g)) {
      const start = fn.index;
      const next = src.indexOf('\nexport function ', start + 1);
      const block = src.slice(start, next === -1 ? src.length : next);
      const exits =
        /\bto=|navigate\(|location\.hash/.test(block) ||
        /<(AccountLayout|HostingLayout|OrderPage|Page|AuthShell|Layout|TransferInstructions)\b/.test(block);
      if (exits) continue;
      if (allow(`${short}:${fn[1]}`)) continue;
      findings.push({ kind: 'dead end', where: short, what: fn[1] });
    }
  }
}

const stale = ALLOWED.filter((a) => !matchedExceptions.has(a.id));

for (const f of findings) console.log(`  ${f.kind.padEnd(9)} ${f.where.padEnd(44)} ${f.what}`);
for (const a of stale) console.log(`  stale-exc ${a.id.padEnd(44)} no longer matches — remove it`);

const bad = findings.length + stale.length;
console.log(
  bad
    ? `\n${findings.length} dead control(s)/flow(s), ${stale.length} stale exception(s).`
    : `\nNothing dead. ${ALLOWED.length} documented exception(s), all still matching.`,
);
process.exit(bad ? 1 : 0);
