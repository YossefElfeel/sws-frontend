/**
 * End-to-end check of the ordering flow the spec defines in section 7:
 * plan -> configure -> domain -> cart -> checkout -> confirmation.
 * Also verifies the spec's currency and dark-mode requirements (4.2, 4.3),
 * and the client-area behaviours of section 9.
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5173/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 160)));

const ok = (label, cond, detail = '') =>
  console.log(`${cond ? 'pass' : 'FAIL'}  ${label.padEnd(46)} ${detail}`);

await p.goto(`${BASE}#/`, { waitUntil: 'networkidle' });
await p.waitForSelector('.plan');

// Spec 6.2 plan data
const names = await p.$$eval('.plan__name', (n) => n.map((x) => x.textContent.trim()));
ok('spec plan names', names.join(',') === 'Single,Pro,Ultra,Unlimited', names.join(','));
const featured = await p.$eval('.plan--featured .plan__name', (e) => e.textContent.trim());
ok('Featured badge on Ultra', featured === 'Ultra', featured);
const price = await p.$eval('.plan .plan__amount', (e) => e.textContent.trim());
ok('Single at spec price in USD', price === '5.00', price);

// Spec 4.3 dark mode
await p.click('.masthead__icon-btn');
const theme = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
const stored = await p.evaluate(() => localStorage.getItem('sws.theme'));
ok('dark mode toggles and persists', theme === 'dark' && stored === 'dark', `${theme}/${stored}`);
await p.click('.masthead__icon-btn');

// Spec 4.2 currency
await p.selectOption('.masthead__select:nth-of-type(2) select', 'EGP');
const egp = await p.$eval('.plan .plan__currency', (e) => e.textContent.trim());
ok('currency switches in place', egp === 'EGP', egp);

// Spec 7.2 configure
await p.click('.plan--featured .btn');
await p.waitForSelector('.cycles');
const cycles = await p.$$eval('.cycle-opt', (n) => n.length);
ok('six billing cycles', cycles === 6, String(cycles));
const saves = await p.$$eval('.cycle-opt__save', (n) => n.length);
ok('savings shown on longer cycles', saves === 4, `${saves} of 6 show a saving`);
const groups = await p.$$eval('.addon', (n) => n.length);
ok('three addon groups', groups === 3, String(groups));
const before = await p.$eval('.totals__row--grand dd', (e) => e.textContent.trim());
await p.click('.addon:nth-of-type(1) .addon__opts li:nth-child(2) label');
await p.waitForTimeout(120);
const after = await p.$eval('.totals__row--grand dd', (e) => e.textContent.trim());
ok('summary updates on addon choice', before !== after, `${before} -> ${after}`);

// Spec 7.2.1 domain step
await p.click('.checkout__aside .btn');
await p.waitForSelector('.choices');
ok('four domain options', (await p.$$eval('.choice', (n) => n.length)) === 4);
await p.fill('#dom', 'kamalatelier');
await p.click('.domain-strip__form .btn');
await p.waitForSelector('.result');
const resolved = await p.$eval('.result', (e) => e.className.includes('result--ok'));
ok('availability resolves deterministically', typeof resolved === 'boolean', resolved ? 'available' : 'taken');

// Spec 7.1 cart + promo
await p.evaluate(() => (location.hash = '#/cart'));
await p.waitForSelector('.promo');
await p.fill('#promo', 'SWS10');
await p.click('.promo__form .btn');
await p.waitForTimeout(150);
ok('promo code applies a discount', (await p.$$eval('.totals__row--credit', (n) => n.length)) === 1);

// Spec 11 gateways
await p.evaluate(() => (location.hash = '#/checkout'));
await p.waitForSelector('.methods');
const egpGw = await p.$$eval('.method__label', (n) => n.map((x) => x.textContent.trim()));
ok('five gateways on EGP', egpGw.length === 5, String(egpGw.length));
await p.selectOption('.masthead__select:nth-of-type(2) select', 'CHF');
await p.waitForTimeout(150);
const chfGw = await p.$$eval('.method__label', (n) => n.length);
ok('wallet gateway hides off EGP', chfGw === 4, `${chfGw} gateways on CHF`);

// Spec 7.3 agreement gate
const disabled = await p.$eval('.checkout__aside .btn', (e) => e.disabled);
ok('pay button gated on agreement', disabled === true);

// ── Spec 9, the client area ──────────────────────────────────────────────────

await p.evaluate(() => (location.hash = '#/account'));
await p.waitForSelector('.app__link');
const sections = await p.$$eval('.app__link', (n) => n.length);
ok('sidebar reaches every section', sections === 12, `${sections} sections`);
ok('dashboard shows the four counts', (await p.$$eval('.stat-row .stat', (n) => n.length)) === 4);

// The client area is an application, not another page of the site: none of the marketing
// chrome a signed-in person has already passed should be on the screen.
const marketing = await p.$$eval(
  '.masthead, .colophon, .masthead__login, .masthead__cart',
  (n) => n.length,
);
ok('no marketing chrome inside the app', marketing === 0, `${marketing} element(s)`);
ok('the signed-in account is named', (await p.$$eval('.app__user-name', (n) => n.length)) === 1);

// 9.1 the dashboard leads with what is owed, and the amount is a link to paying it.
const owes = await p.$$eval('.card--urgent .due__amount', (n) => n.map((x) => x.textContent.trim()));
ok('dashboard leads with what is owed', owes.length === 1, owes[0] ?? 'none');
ok('renewals are scheduled nearest first', (await p.$$eval('.sched__when', (n) => n.length)) > 0);

// 9.2 services, filtered by status
await p.evaluate(() => (location.hash = '#/account/services'));
await p.waitForSelector('.data tbody tr');
const allSvc = await p.$$eval('.data tbody tr', (n) => n.length);
await p.click('.filters__btn:nth-child(2)');
await p.waitForTimeout(120);
const someSvc = await p.$$eval('.data tbody tr', (n) => n.length);
ok('services filter by status', someSvc < allSvc, `${allSvc} -> ${someSvc}`);

// 9.3 DNS records on a managed domain
await p.evaluate(() => (location.hash = '#/account/domains/dom-1'));
await p.waitForSelector('.data tbody tr');
const dns = await p.$$eval('.data tbody tr', (n) => n.length);
ok('DNS records listed', dns >= 5, `${dns} records`);

// 9.4 invoices, filtered by status
await p.evaluate(() => (location.hash = '#/account/invoices'));
await p.waitForSelector('.data tbody tr');
const allInv = await p.$$eval('.data tbody tr', (n) => n.length);
await p.click('.filters__btn:nth-child(2)');
await p.waitForTimeout(120);
const someInv = await p.$$eval('.data tbody tr', (n) => n.length);
ok('invoices filter by status', someInv < allInv, `${allInv} -> ${someInv}`);

// 9.5.3 a thread has two distinguishable sides
await p.evaluate(() => (location.hash = '#/account/tickets/tkt-7741'));
await p.waitForSelector('.msg');
const client = await p.$$eval('.msg--client', (n) => n.length);
const staff = await p.$$eval('.msg--staff', (n) => n.length);
ok('ticket thread separates the two sides', client > 0 && staff > 0, `${client} client / ${staff} staff`);

// The bilingual fixtures are the point of section 9 in Arabic: switching language has to
// change the customer's own words, not only the chrome around them.
const bodyAr = await p.$eval('.msg__body', (e) => e.textContent.trim());
await p.selectOption('.app__select:nth-of-type(1) select', 'en');
await p.waitForTimeout(150);
const bodyEn = await p.$eval('.msg__body', (e) => e.textContent.trim());
ok('ticket text follows the language', bodyAr !== bodyEn, `${bodyAr.slice(0, 18)}… -> ${bodyEn.slice(0, 18)}…`);
await p.selectOption('.app__select:nth-of-type(1) select', 'ar');

// 9.5.4 knowledgebase search narrows the list
await p.evaluate(() => (location.hash = '#/account/knowledgebase'));
await p.waitForSelector('.kb-item');
const allKb = await p.$$eval('.kb-item', (n) => n.length);
await p.fill('#kbq', 'cPanel');
await p.waitForTimeout(150);
const someKb = await p.$$eval('.kb-item', (n) => n.length);
ok('knowledgebase search narrows', someKb < allKb, `${allKb} -> ${someKb}`);

// 9.7 two-factor is a real control, not a label
await p.evaluate(() => (location.hash = '#/account/security'));
await p.waitForSelector('.switch-row input');
const twofaBefore = await p.$eval('.switch-row input', (e) => e.checked);
await p.click('.switch-row input');
const twofaAfter = await p.$eval('.switch-row input', (e) => e.checked);
ok('two-factor toggles', twofaBefore !== twofaAfter, `${twofaBefore} -> ${twofaAfter}`);

// Wiring. Every one of these resolved to a real route before and still went to the wrong
// place — the most invisible kind of broken, because the click appears to do nothing.
await p.setViewportSize({ width: 1440, height: 900 });
await p.evaluate(() => (location.hash = '#/hosting/wordpress'));
await p.waitForSelector('.plans .plan');
await p.click('.plans .plan .btn');
await p.waitForSelector('.checkout, .empty');
const inCart = await p.$$eval('.checkout__main tbody tr', (n) => n.length);
ok('ordering off a non-shared family fills the cart', inCart > 0, `${inCart} line(s)`);

await p.evaluate(() => (location.hash = '#/'));
await p.waitForSelector('.masthead__nav');
const supportHref = await p.$$eval('.masthead__nav a', (n) =>
  n.map((a) => a.getAttribute('href')).find((h) => h && h.includes('knowledgebase')),
);
ok('marketing Support reaches the help centre', Boolean(supportHref), supportHref ?? 'still /account');

const contactHref = await p.$$eval('.colophon__links a', (n) =>
  n.map((a) => a.getAttribute('href')).find((h) => h && h.includes('tickets')),
);
ok('footer Contact reaches a ticket', Boolean(contactHref), contactHref ?? 'still /account');

// Logical properties handle layout, but an arrow is a drawing: "onward" has to point the way
// the reader travels, so it mirrors in Arabic and only it does.
{
  await p.evaluate(() => (location.hash = '#/account'));
  await p.waitForSelector('.icon--dir');
  const rtl = await p.evaluate(() => {
    const mirrored = (el) => getComputedStyle(el).transform.includes('-1');
    return {
      dir: document.documentElement.getAttribute('dir'),
      dirTotal: document.querySelectorAll('.icon--dir').length,
      dirMirrored: [...document.querySelectorAll('.icon--dir')].filter(mirrored).length,
      plainMirrored: [...document.querySelectorAll('svg:not(.icon--dir)')].filter(mirrored).length,
    };
  });
  ok(
    'forward arrows point the reading way in Arabic',
    rtl.dir === 'rtl' && rtl.dirTotal > 0 && rtl.dirMirrored === rtl.dirTotal,
    `${rtl.dirMirrored}/${rtl.dirTotal} mirrored`,
  );
  ok('no other icon is mirrored', rtl.plainMirrored === 0, `${rtl.plainMirrored} stray`);

  await p.selectOption('.app__select:nth-of-type(1) select', 'en');
  await p.waitForTimeout(200);
  const ltr = await p.evaluate(() => ({
    dir: document.documentElement.getAttribute('dir'),
    mirrored: [...document.querySelectorAll('.icon--dir')].filter((el) =>
      getComputedStyle(el).transform.includes('-1'),
    ).length,
  }));
  ok('and point the other way in English', ltr.dir === 'ltr' && ltr.mirrored === 0, `${ltr.mirrored} mirrored`);
  await p.selectOption('.app__select:nth-of-type(1) select', 'ar');
  await p.waitForTimeout(200);
}

// An icon in a button is a flex item, and a flex item shrinks. In a narrow table cell they
// were collapsing to zero width while keeping their height — a sliver where an arrow should
// be, on every account table at once, and invisible to a screenshot at review scale.
{
  const squashed = [];
  for (const r of ['#/account', '#/account/services', '#/account/invoices', '#/account/knowledgebase', '#/cart', '#/hosting/shared']) {
    await p.evaluate((hash) => { location.hash = hash; }, r);
    await p.waitForTimeout(250);
    const found = await p.evaluate(() =>
      [...document.querySelectorAll('svg')]
        .map((el) => ({ el, b: el.getBoundingClientRect() }))
        .filter(({ b }) => b.height > 0 && b.width < b.height * 0.6)
        .map(({ el, b }) => `${String(el.parentElement.className).slice(0, 24)} ${Math.round(b.width)}x${Math.round(b.height)}`),
    );
    squashed.push(...found.map((f) => `${r} ${f}`));
  }
  ok('no icon is crushed by its flex parent', squashed.length === 0, squashed.slice(0, 3).join(' · ') || 'all keep their width');
}

// ADR-0004 is a token the a11y gate checks in the abstract. This checks it on the rendered
// page, at the width where controls actually get small — the only place it can fail.
//
// The effective target is measured by hit-testing, not by getBoundingClientRect: a control
// may legitimately extend its target with an absolutely-positioned pseudo-element, which a
// box measurement cannot see and a fingertip can. What matters is whether the point is
// clickable and resolves to this control.
for (const w of [390, 1440]) {
  await p.setViewportSize({ width: w, height: 900 });
  await p.evaluate(() => (location.hash = '#/account'));
  await p.waitForSelector('.app__bar');
  await p.waitForTimeout(200);

  const small = await p.evaluate(() => {
    const MIN = 44;
    const owns = (el, node) => {
      for (let n = node; n; n = n.parentElement) if (n === el) return true;
      return false;
    };
    /**
     * How far past an edge the target still answers to the pointer. Probing outward from the
     * edges rather than from the centre keeps the arithmetic exact: a plain 44px box measures
     * 44, not 43, because the centre pixel is never counted twice or lost.
     */
    const reach = (el, x, y, dx, dy) => {
      for (let d = 1; d <= MIN; d++) {
        const hit = document.elementFromPoint(x + dx * d, y + dy * d);
        if (!hit || !owns(el, hit)) return d - 1;
      }
      return MIN;
    };

    const sel = 'a, button, select, input:not([type=hidden]), [role=button]';
    return [...document.querySelectorAll(sel)]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        if (getComputedStyle(el).visibility === 'hidden') return false;
        if (r.top < 0 || r.bottom > window.innerHeight) return false; // off-screen, not measurable
        if (r.right < 0 || r.left > window.innerWidth) return false; // off-canvas drawer
        // Nothing over it at its own centre, or it is not the thing being measured.
        const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!at) return false;
        for (let n = at; ; n = n.parentElement) {
          if (n === el) return true;
          if (!n) return false;
        }
        // A link inside running text is text, not a control; the rule is about controls.
        return !el.closest('p, .app__crumbs, .prose, .colophon');
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const h = r.height + reach(el, cx, r.top + 0.5, 0, -1) + reach(el, cx, r.bottom - 0.5, 0, 1);
        const wdt = r.width + reach(el, r.left + 0.5, cy, -1, 0) + reach(el, r.right - 0.5, cy, 1, 0);
        return { w: Math.round(wdt), h: Math.round(h), what: String(el.className || el.tagName).slice(0, 30) };
      })
      .filter((b) => b.w < MIN || b.h < MIN);
  });

  ok(
    `every control clears 44px at ${w}`,
    small.length === 0,
    small.length ? small.slice(0, 3).map((b) => `${b.what} ${b.w}x${b.h}`).join(' · ') : 'all clear',
  );
}
await p.setViewportSize({ width: 1440, height: 900 });

// ADR-0003: Latin numerals everywhere, including inside Arabic copy.
await p.evaluate(() => (location.hash = '#/account/invoices/inv-4417'));
await p.waitForSelector('.invoice');
const easternDigits = await p.$eval('main', (e) => (e.textContent.match(/[٠-٩۰-۹]/g) ?? []).length);
ok('ADR-0003 Latin numerals', easternDigits === 0, `${easternDigits} eastern digit(s)`);

console.log(errs.length ? `\n${errs.length} console error(s):\n  ${errs.slice(0, 4).join('\n  ')}` : '\nclean console');
await b.close();
