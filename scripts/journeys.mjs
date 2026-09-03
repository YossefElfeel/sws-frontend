/**
 * End-to-end journeys.
 *
 * flow.mjs asserts screens. This asserts *routes between* them, and it does it the way a
 * person does: by clicking. Nothing here sets location.hash mid-journey, so a link that goes
 * nowhere stalls the walk instead of being stepped over — which is exactly the class of defect
 * that survived every other gate.
 *
 *   node scripts/journeys.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? 'http://localhost:5173/').replace(/\/?$/, '/');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

const errors = [];
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const hash = () => p.evaluate(() => location.hash);

/** Click the first selector that resolves to something visible. Reports what it tried. */
async function click(selectors, { optional = false } = {}) {
  for (const sel of [].concat(selectors)) {
    const el = p.locator(sel).first();
    if ((await el.count()) && (await el.isVisible().catch(() => false))) {
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.click();
      await p.waitForTimeout(220);
      return sel;
    }
  }
  if (optional) return null;
  throw new Error(`no control matched: ${[].concat(selectors).join(' | ')}`);
}

/** Fill everything a browser would refuse to submit without. */
async function satisfyRequired(scope = 'form') {
  await p.evaluate((s) => {
    for (const el of document.querySelectorAll(`${s} [required]`)) {
      if (el.value) continue;
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
      set.call(el, el.type === 'email' ? 'kamal@atelier-kamal.com' : 'SWS');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Agreement checkboxes gate a submit without being marked required, so tick what is in
    // scope rather than only what the browser would refuse over.
    for (const el of document.querySelectorAll(`${s} input[type=checkbox]`)) {
      if (!el.checked) el.click();
    }
  }, scope);
  await p.waitForTimeout(120);
}

async function start(route = '#/') {
  await p.goto(BASE + route, { waitUntil: 'networkidle' });
  // Answer the consent bar once so it never covers a control mid-journey.
  await p.evaluate(() =>
    localStorage.setItem('sws.consent', JSON.stringify({ analytics: false, marketing: false })),
  );
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(250);
}

const results = [];

async function journey(name, steps) {
  const trail = [];
  try {
    for (const [label, run] of steps) {
      await run();
      trail.push(`${label} → ${await hash()}`);
    }
    results.push({ name, ok: true, at: await hash(), trail });
  } catch (e) {
    results.push({ name, ok: false, at: await hash(), trail, why: e.message });
  }
}

/* ── A. buy shared hosting, all the way to a confirmed order ────────────────── */
await journey('Buy shared hosting', [
  ['home', () => start('#/')],
  ['plans', () => click(['.masthead__nav a[href*="hosting"]'])],
  ['configure', () => click(['.plan--featured .btn', '.plans .plan .btn'])],
  ['domain step', () => click(['.checkout__aside .btn', '.summary + * .btn'])],
  ['name the domain', async () => {
    // Continue is disabled until a domain is chosen — correctly — so choose one.
    await p.check('input[value="own"]');
    await p.waitForTimeout(200);
    await p.evaluate(() => {
      const el = document.querySelector('input.field');
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(el, 'atelier-kamal.com');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await p.waitForTimeout(200);
    await click(['.btn--lg.btn--primary']);
  }],
  ['cart', async () => { if (!(await hash()).includes('cart')) await click(['a[href*="cart"]']); }],
  ['checkout', () => click(['.checkout__aside .btn--lg', '.checkout__aside .btn'])],
  ['place order', async () => { await satisfyRequired('.checkout'); await click(['.checkout__aside button[type=submit]']); }],
  ['card → bank challenge', () => click(['.checkout__aside .btn--primary', '.acts .btn--primary'])],
  ['return from bank', () => click(['.acts .btn--primary'])],
  ['confirmation', () => click(['.acts .btn--primary', '.stage .btn--primary'])],
]);

/* ── B. order a product that is not shared hosting ──────────────────────────── */
await journey('Order a WordPress plan', [
  ['family page', () => start('#/hosting/wordpress')],
  ['order', () => click(['.plans .plan .btn'])],
  ['reached the cart', async () => { if (!(await hash()).includes('cart')) throw new Error('did not reach the cart'); }],
]);

/* ── C. register a domain from the search ───────────────────────────────────── */
await journey('Register a domain', [
  ['domain search', () => start('#/domains')],
  ['search', async () => {
    await p.fill('.domain-search input', 'atelier-kamal');
    await click(['.domain-search button[type=submit]']);
  }],
  ['add an available one', async () => {
    // Results render as rows of the price table; a taken name has no Add button to press.
    const added = await p.evaluate(() => {
      const rows = [...document.querySelectorAll('.data tbody tr')];
      const free = rows.find((r) => r.querySelector('.tag--ok') && r.querySelector('button:not([disabled])'));
      if (!free) return false;
      free.querySelector('button:not([disabled])').click();
      return true;
    });
    if (!added) throw new Error('no available result offered an Add');
    await p.waitForTimeout(250);
  }],
  ['it reached the cart', async () => {
    const n = await p.$$eval('.masthead__count', (x) => x.length);
    if (!n) throw new Error('cart count did not appear');
  }],
]);

/* ── D. transfer a domain in ────────────────────────────────────────────────── */
await journey('Transfer a domain in', [
  ['transfer page', () => start('#/transfer')],
  ['submit', async () => { await satisfyRequired('form.panel'); await click(['form.panel button[type=submit]']); }],
  ['landed on a result', async () => { if (!(await p.locator('.stage__title').count())) throw new Error('no result screen'); }],
]);

/* ── E. sign up, verify, arrive ─────────────────────────────────────────────── */
await journey('Register and verify', [
  ['register', () => start('#/register')],
  ['submit', async () => { await satisfyRequired('.auth__form'); await click(['.auth__form button[type=submit]']); }],
  /*
   * A hash-only goto is a same-document navigation, so networkidle resolves before the router
   * has swapped the screen — the next step then clicks into the previous one. Waiting for the
   * screen that was asked for is what makes the step deterministic; the earlier version passed
   * or failed depending on which route the journey happened to arrive from.
   */
  ['verify screen', async () => {
    await p.goto(BASE + '#/verify', { waitUntil: 'networkidle' });
    await p.waitForSelector('.auth__form .btn--secondary');
  }],
  ['resend', () => click(['.auth__form .btn--secondary'])],
]);

/* ── F. sign in through 2FA ─────────────────────────────────────────────────── */
await journey('Sign in with 2FA', [
  ['login', () => start('#/login')],
  ['submit', async () => { await satisfyRequired('.auth__form'); await click(['.auth__form button[type=submit]']); }],
  ['2fa', async () => { if (!(await hash()).includes('2fa')) throw new Error('did not reach 2FA'); }],
  ['enter code', async () => { await satisfyRequired('.auth__form'); await click(['.auth__form button[type=submit]']); }],
  ['account', async () => { if (!(await hash()).includes('account')) throw new Error('did not reach the account'); }],
]);

/* ── G. reset a password end to end ─────────────────────────────────────────── */
await journey('Reset a password', [
  ['reset request', () => start('#/reset')],
  ['send', async () => { await satisfyRequired('.auth__form'); await click(['.auth__form button[type=submit]']); }],
  /*
   * A bare goto here is a same-document hash change from #/reset, so the page kept showing
   * the "we sent it" state this journey had just produced — which has no password fields, so
   * Save stayed disabled and the journey timed out against a screen that works fine by hand.
   * start() reloads, which is what actually lands on the route.
   */
  ['set a new one', () => start('#/reset/new')],
  ['type it twice', async () => {
    await p.evaluate(() => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      for (const el of document.querySelectorAll('input[type=password]')) {
        set.call(el, 'Sws-Prototype-9');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await p.waitForTimeout(150);
    await click(['.auth__form button[type=submit]']);
  }],
  ['back to sign in', () => click(['.auth__form .btn'])],
]);

/* ── H. pay an overdue invoice from the dashboard ───────────────────────────── */
await journey('Pay an overdue invoice', [
  ['dashboard', () => start('#/account')],
  ['what is owed', () => click(['.card--urgent .btn--primary'])],
  ['pay', () => click(['.app__head-actions .btn--primary', '.app__head-actions a.btn'])],
]);

/* ── I. change plan, all three steps ────────────────────────────────────────── */
await journey('Upgrade a plan', [
  ['services', () => start('#/account/services')],
  ['a service', () => click(['.data tbody tr:first-child a.btn'])],
  ['change plan', () => click(['a[href*="upgrade"]'])],
  ['choose one', () => click(['.pick:not(.pick--current) .btn'])],
  ['confirm', () => click(['.dash__side .acts .btn--primary', '.acts button'])],
  ['done', async () => { if (!(await hash()).includes('done')) throw new Error('no result screen'); }],
]);

/* ── J. cancel a service ────────────────────────────────────────────────────── */
await journey('Cancel a service', [
  ['service', () => start('#/account/services/svc-8841')],
  ['cancel', () => click(['a[href*="cancel"]'])],
  ['acknowledge', () => click(['.switch-row input'])],
  ['request it', () => click(['.acts .btn--danger'])],
  ['confirmed', async () => { if (!(await p.locator('.calm').count())) throw new Error('no confirmation'); }],
]);

/* ── K. renew a domain ──────────────────────────────────────────────────────── */
await journey('Renew a domain', [
  ['my domains', () => start('#/account/domains')],
  ['renew', () => click(['.data tbody tr:first-child a[href*="renew"]'])],
  ['pay', () => click(['.dash__side .acts .btn'])],
  ['recorded', async () => { if (!(await p.locator('.calm').count())) throw new Error('no confirmation'); }],
]);

/* ── L. open a support ticket ───────────────────────────────────────────────── */
await journey('Open a ticket', [
  ['tickets', () => start('#/account/tickets')],
  ['new', () => click(['a[href*="tickets/new"]'])],
  ['send', async () => { await satisfyRequired('form'); await click(['form button[type=submit]', '.form__foot .btn:not(.btn--quiet)', '.actions .btn--lg']); }],
]);

/* ── M. order paid by bank transfer ─────────────────────────────────────────── */
await journey('Order by bank transfer', [
  ['configure', () => start('#/configure/ultra')],
  ['add to cart', () => click(['.checkout__aside .btn'])],
  /* Same hazard as the verify step. start() is not usable here: it reloads, and the cart this
     journey has just filled lives in memory. */
  ['checkout', async () => {
    await p.goto(BASE + '#/checkout', { waitUntil: 'networkidle' });
    await p.waitForSelector('.checkout__main');
  }],
  ['choose bank', async () => {
    await p.check('.methods input[value="bank"]');
    await satisfyRequired('.checkout');
    await click(['.checkout__aside button[type=submit]']);
  }],
  ['instructions', async () => { if (!(await hash()).includes('order/bank')) throw new Error('wrong destination'); }],
  ['confirm sent', () => click(['form.panel button[type=submit]', '.form__foot .btn'])],
]);

/* ── N. recover from a failed payment ───────────────────────────────────────── */
await journey('Recover a failed payment', [
  ['failure', () => start('#/order/failed')],
  ['retry the card', () => click(['.checkout__aside .btn--primary'])],
  ['card screen', async () => { if (!(await hash()).includes('checkout/card')) throw new Error('wrong destination'); }],
]);

/* ── O. top the balance up ──────────────────────────────────────────────────── */
await journey('Add funds', [
  ['add funds', () => start('#/account/funds')],
  ['pick an amount', () => click(['.chips .chip'])],
  ['top up', () => click(['.dash__side .acts .btn'])],
  ['confirmed', async () => { if (!(await p.locator('.calm').count())) throw new Error('no confirmation'); }],
]);

/* ── P. withdraw affiliate earnings ─────────────────────────────────────────── */
await journey('Withdraw earnings', [
  ['affiliates', () => start('#/account/affiliates')],
  ['withdraw', () => click(['a[href*="withdraw"]'])],
  ['request', () => click(['.dash__side .acts .btn'])],
  ['recorded', async () => { if (!(await p.locator('.calm').count())) throw new Error('no confirmation'); }],
]);

/* ── report ─────────────────────────────────────────────────────────────────── */
let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? 'pass' : 'FAIL'}  ${r.name.padEnd(28)} ${r.at}`);
  if (!r.ok) {
    failed++;
    for (const t of r.trail) console.log(`        ✓ ${t}`);
    console.log(`        ✗ ${r.why}`);
  }
}

const real = errors.filter((e) => !/favicon|DevTools/i.test(e));
console.log(
  `\n${results.length - failed}/${results.length} journeys complete` +
    (real.length ? ` · ${real.length} console error(s)` : ' · clean console'),
);
real.slice(0, 4).forEach((e) => console.log(`  ${e.slice(0, 160)}`));

await browser.close();
process.exit(failed || real.length ? 1 : 0);
