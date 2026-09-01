/**
 * The mobile audit — every route at 390x844, in Arabic.
 *
 * capture.mjs already flags horizontal overflow. This looks for the rest of what actually goes
 * wrong on a phone and never shows up on a 1440px screen:
 *
 *   overflow      something escapes the viewport, named rather than only flagged
 *   target        a control whose effective hit area is under 44px (ADR-0004)
 *   crowding      two controls closer than 8px, where a thumb cannot separate them
 *   tiny-text     visible text under 12px, which is below the readable floor
 *   covered       a control sitting under the sticky bar or the consent bar
 *   crushed       an icon squashed to a sliver by a flex parent
 *
 * Hit areas are measured by hit-testing outward from each edge rather than by reading the box,
 * because a control may legitimately extend its target with a pseudo-element that a box
 * measurement cannot see and a fingertip can.
 *
 *   node scripts/mobile.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { ROUTES } from './routes.mjs';

const BASE = (process.argv[2] ?? 'http://localhost:5173/').replace(/\/?$/, '/');
const MIN = 44;
const GAP = 8;
const TEXT = 12;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();

// Answer the consent bar once. It is checked on its own route; leaving it up everywhere would
// report the same finding seventy-six times and hide everything else.
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.evaluate(() =>
  localStorage.setItem('sws.consent', JSON.stringify({ analytics: false, marketing: false })),
);
// The app is already mounted, and a hash change does not remount it — so the consent bar
// would stay up for the first route and be reported on every control it covers.
await p.reload({ waitUntil: 'networkidle' });

const audit = () =>
  p.evaluate(
    ({ MIN, GAP, TEXT }) => {
      const out = [];
      const seen = (kind, what) => out.push({ kind, what });
      const name = (el) =>
        `${el.tagName.toLowerCase()}.${String(el.className || '').trim().split(/\s+/)[0] || '—'}`;

      const vis = (el) => {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };

      // ── overflow, both edges: in RTL what escapes does so past the left ──────
      if (document.documentElement.scrollWidth > window.innerWidth + 1) {
        const who = [...document.querySelectorAll('*')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.right <= window.innerWidth + 1 && r.left >= -1) return false;
            for (let n = el.parentElement; n; n = n.parentElement) {
              const ox = getComputedStyle(n).overflowX;
              if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return false;
            }
            return true;
          })
          .slice(0, 2)
          .map((el) => `${name(el)} ${Math.round(el.getBoundingClientRect().width)}px`);
        seen('overflow', who.join(', ') || 'document scrolls sideways');
      }

      /*
       * An item scrolled out of a horizontal strip is not unreachable — the category rail on a
       * phone is exactly that, and reporting its off-screen items as covered buried everything
       * else on eight routes.
       */
      /*
       * A closed off-canvas drawer is translated clear of the viewport. Its links are not
       * covered, they are behind a button you press first — and reporting them buried every
       * real finding on the client area under three hundred lines of noise.
       */
      const inClosedPanel = (el) => {
        const r = el.getBoundingClientRect();
        return r.right < 0 || r.left > window.innerWidth;
      };

      const insideItsScroller = (el) => {
        for (let n = el.parentElement; n; n = n.parentElement) {
          const ox = getComputedStyle(n).overflowX;
          if (ox !== 'auto' && ox !== 'scroll') continue;
          const nr = n.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          return r.left >= nr.left - 1 && r.right <= nr.right + 1;
        }
        return true;
      };

      const controls = [...document.querySelectorAll('a, button, select, input:not([type=hidden]), [role=button]')]
        .filter(vis)
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight;
        })
        .filter((el) => !inClosedPanel(el))
        .filter(insideItsScroller)
        .filter((el) => !el.closest('p, .app__crumbs, .crumbs, .prose, .colophon, .consent'));

      const owns = (el, node) => {
        for (let n = node; n; n = n.parentElement) if (n === el) return true;
        return false;
      };
      const reach = (el, x, y, dx, dy) => {
        for (let d = 1; d <= MIN; d++) {
          const hit = document.elementFromPoint(x + dx * d, y + dy * d);
          if (!hit || !owns(el, hit)) return d - 1;
        }
        return MIN;
      };

      /*
       * An input wrapped in a label is tapped through the label — that is the whole point of
       * wrapping it — so the label is the target being measured, not the 14px box inside it.
       */
      const targetOf = (el) => {
        const lab = el.closest('label');
        return lab && (el.type === 'checkbox' || el.type === 'radio') ? lab : el;
      };

      const boxes = [];
      for (const raw of controls) {
        const el = targetOf(raw);
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const at = document.elementFromPoint(cx, cy);
        if (!at || !owns(el, at)) {
          // Something is on top of it at its own centre.
          const over = at ? name(at) : 'nothing';
          if (!el.closest('.notifs, .cur__ask')) seen('covered', `${name(el)} under ${over}`);
          continue;
        }
        const h = r.height + reach(el, cx, r.top + 0.5, 0, -1) + reach(el, cx, r.bottom - 0.5, 0, 1);
        const w = r.width + reach(el, r.left + 0.5, cy, -1, 0) + reach(el, r.right - 0.5, cy, 1, 0);
        /*
         * One pixel of slack, because elementFromPoint resolves to whole pixels: a box whose
         * origin lands on a fraction — 243.0156, say — measures one short while genuinely
         * being 44. Verified against a real button before allowing it.
         */
        if (w < MIN - 1 || h < MIN - 1) seen('target', `${name(el)} ${Math.round(w)}x${Math.round(h)}`);
        boxes.push({ el, r });
      }

      // ── crowding: two separate targets a thumb cannot tell apart ────────────
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
          const dx = Math.max(0, Math.max(a.r.left - b.r.right, b.r.left - a.r.right));
          const dy = Math.max(0, Math.max(a.r.top - b.r.bottom, b.r.top - a.r.bottom));
          if (dx === 0 && dy === 0) continue; // overlapping is reported as covered
          if (dx < GAP && dy < GAP) {
            seen('crowding', `${name(a.el)} / ${name(b.el)} ${Math.round(Math.max(dx, dy))}px apart`);
            i = boxes.length; // one report per route is enough to act on
            break;
          }
        }
      }

      // ── text below the readable floor ───────────────────────────────────────
      const small = new Set();
      for (const el of document.querySelectorAll('body *')) {
        if (!el.childNodes.length || !vis(el)) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasText) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < TEXT) small.add(`${name(el)} ${size}px`);
      }
      for (const s of [...small].slice(0, 2)) seen('tiny-text', s);

      // ── icons crushed by a flex parent ──────────────────────────────────────
      for (const svg of document.querySelectorAll('svg')) {
        const r = svg.getBoundingClientRect();
        if (r.height > 0 && r.width < r.height * 0.6) {
          seen('crushed', `${name(svg.parentElement)} ${Math.round(r.width)}x${Math.round(r.height)}`);
          break;
        }
      }

      return out;
    },
    { MIN, GAP, TEXT },
  );

let bad = 0;
for (const route of ROUTES) {
  await p.goto(BASE + route.path, { waitUntil: 'networkidle' });
  await p.evaluate(() => {
    // Entrance motion mid-flight measures as a displaced element.
    const st = document.createElement('style');
    st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(st);
  });
  await p.waitForTimeout(200);

  const found = await audit();
  if (!found.length) {
    console.log(`ok    ${route.name}`);
    continue;
  }
  bad++;
  console.log(`FAIL  ${route.name}`);
  for (const f of found) console.log(`        ${f.kind.padEnd(10)} ${f.what}`);
}

console.log(`\n${ROUTES.length - bad}/${ROUTES.length} routes clean at 390px.`);
await browser.close();
process.exit(bad ? 1 : 0);
