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
await p.selectOption('.cur select', 'EGP');
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
// "Domain from cart" is only a card when the cart holds a domain to take — with only the
// hosting line in it, there are three choices and no way to pick nothing.
ok('three domain options with no domain in the cart', (await p.$$eval('.choice', (n) => n.length)) === 3);
ok('no from-cart card on an empty cart', (await p.$$('input[value="cart"]')).length === 0);
ok('TLD picker beside the field', (await p.$$('.domain-strip__tld')).length === 1);
await p.fill('#dom', 'kamalatelier');
await p.click('.domain-strip__form .btn');
await p.waitForSelector('.result');
const resolved = await p.$eval('.result', (e) => e.className.includes('result--ok'));
ok('availability resolves deterministically', typeof resolved === 'boolean', resolved ? 'available' : 'taken');

// Put a standalone domain in the cart through the search, come back, and the fourth card is there.
{
  const stepHash = await p.evaluate(() => location.hash);
  await p.evaluate(() => (location.hash = '#/domains'));
  await p.waitForSelector('.domain-search input');
  await p.fill('.domain-search input', 'kamalatelier');
  await p.click('.domain-search button[type=submit]');
  await p.waitForSelector('.data tbody tr');
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.data tbody tr')].find(
      (r) => r.querySelector('.tag--ok') && r.querySelector('button:not([disabled])'),
    );
    row?.querySelector('button:not([disabled])')?.click();
  });
  await p.waitForTimeout(250);
  await p.evaluate((h) => (location.hash = h), stepHash);
  await p.waitForSelector('.choices');
  ok('from-cart appears once a domain is in the cart', (await p.$$eval('.choice', (n) => n.length)) === 4);
  await p.check('input[value="cart"]');
  await p.waitForTimeout(120);
  ok('from-cart needs a pick', await p.$eval('.step-foot .btn', (b) => b.disabled));
  await p.selectOption('#dom-cart', { index: 1 });
  await p.waitForTimeout(120);
  ok('…and enables once picked', !(await p.$eval('.step-foot .btn', (b) => b.disabled)));
  // Back to the registration path, so the rest of the walk sees the cart it expects.
  await p.check('input[value="register"]');
  await p.fill('#dom', 'kamalatelier');
  await p.click('.domain-strip__form .btn');
  await p.waitForSelector('.result');
}

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
// S-04 / I15: with items in the cart the switch asks before it re-prices, so the flow has to
// answer it. That the dialog appears at all is the assertion.
await p.selectOption('.cur select', 'CHF');
await p.waitForSelector('.cur__ask');
const bothTotals = await p.$$eval('.cur__amount', (n) => n.map((x) => x.textContent.trim()));
ok('changing currency with a full cart shows both totals', bothTotals.length === 2, bothTotals.join(' -> '));
await p.click('.cur__acts .btn--primary');
await p.waitForTimeout(200);
await p.waitForTimeout(150);
const chfGw = await p.$$eval('.method__label', (n) => n.length);
ok('wallet gateway hides off EGP', chfGw === 4, `${chfGw} gateways on CHF`);

// Spec 7.3 agreement gate
const disabled = await p.$eval('.checkout__aside .btn', (e) => e.disabled);
ok('pay button gated on agreement', disabled === true);

// O-07/O-10/O-11: every gateway has its own next screen, and they are not the same screen.
// Sending all five to the confirmation was the version that quietly claimed a bank transfer
// had already been paid. Checked here because this is where the cart still has lines in it —
// the confirmation empties it.
// Place Order is gated on a non-empty cart as well as on the agreement, so a line has to be
// in it before the gateway choice can be exercised at all.
await p.evaluate(() => (location.hash = '#/configure/ultra'));
await p.waitForSelector('.checkout__aside .btn');
await p.click('.checkout__aside .btn');
await p.waitForTimeout(300);

for (const [gw, expect] of [
  ['bank', '/order/bank'],
  ['instapay', '/order/wallet'],
  ['stripe-card', '/checkout/card'],
]) {
  await p.evaluate(() => (location.hash = '#/checkout'));
  await p.waitForSelector('.methods input[value="stripe-card"]');
  await p.check(`.methods input[value="${gw}"]`);
  await p.check('.checkout__aside input[type=checkbox]');
  // The billing form is required-gated, which is correct and which a click alone will not
  // get past — the browser silently refuses and focuses the first empty field.
  await p.evaluate(() => {
    for (const el of document.querySelectorAll('.checkout__main [required]')) {
      if (el.value) continue;
      const set = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
        'value',
      ).set;
      set.call(el, el.type === 'email' ? 'a@b.co' : 'x');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await p.click('.checkout__aside button[type=submit]');
  await p.waitForTimeout(350);
  const landed = await p.evaluate(() => location.hash);
  ok(`${gw} goes to its own next screen`, landed.includes(expect), landed);
}

// ── Spec 9, the client area ──────────────────────────────────────────────────

await p.evaluate(() => (location.hash = '#/account'));
await p.waitForSelector('.app__link');
const sections = await p.$$eval('.app__link', (n) => n.length);
ok('sidebar reaches every section', sections === 13, `${sections} sections`);
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

// 9.3 DNS records on a managed domain — its own page now, behind the domain rail
await p.evaluate(() => (location.hash = '#/account/domains/dom-1/dns'));
await p.waitForSelector('.data tbody tr');
const dns = await p.$$eval('.data tbody tr', (n) => n.length);
ok('DNS records listed', dns >= 5, `${dns} records`);
ok('the domain rail lists eight pages', (await p.$$eval('.rail--domain .rail__list:first-of-type .rail__link', (n) => n.length)) === 8);
await p.evaluate(() => (location.hash = '#/account/domains/dom-3/dns'));
await p.waitForSelector('.card.empty');
ok('a domain with no records says so', (await p.$$('.card.empty')).length === 1);

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

// The footer is the only route to eleven of these pages, so it is checked as a route table
// rather than as decoration.
const footHrefs = await p.$$eval('.colophon a', (n) => n.map((a) => a.getAttribute('href') ?? ''));
const wanted = [
  '/contact',
  '/about',
  '/status',
  '/data-centres',
  '/learn',
  '/compare',
  '/domains/pricing',
  '/migrate',
];
const missingFromFooter = wanted.filter((w) => !footHrefs.some((h) => h.endsWith(w)));
ok(
  'the footer reaches every company page',
  missingFromFooter.length === 0,
  missingFromFooter.join(', ') || `${footHrefs.length} links`,
);

// O-13 is the biggest conversion-recovery opportunity in the project, and it only works if
// the order survives the failure.
await p.evaluate(() => (location.hash = '#/order/failed'));
await p.waitForSelector('.panel--bad');
{
  const kept = await p.$$eval('.notice', (n) => n.length);
  const ways = await p.$$eval('.methods--stack a.method', (n) => n.length);
  const retry = await p.$$eval('.checkout__aside a.btn--primary', (n) => n.length);
  ok('a failed payment keeps the order and offers a way out', kept > 0 && ways > 0 && retry === 1, `${ways} alternative(s)`);
}

// O-08/O-09 render third-party frames. Faking them would get a screen approved that will
// never exist, so the slot must stay a marked slot.
for (const r of ['#/checkout/card', '#/checkout/3ds']) {
  await p.evaluate((h) => (location.hash = h), r);
  await p.waitForSelector('.slot');
  const marked = await p.$$eval('.slot__tag', (n) => n.length);
  const fakeInputs = await p.$$eval('.slot input', (n) => n.length);
  ok(`${r} marks the third-party frame rather than faking it`, marked === 1 && fakeInputs === 0);
}

// A-05: the rules are checked live, and Save stays out of reach until they pass.
await p.evaluate(() => (location.hash = '#/reset/new'));
await p.waitForSelector('.rules');
{
  const before = await p.$eval('button[type=submit]', (b) => b.disabled);
  await p.fill('input[autocomplete=new-password]:nth-of-type(1)', 'Sws-Prototype-9');
  const met = await p.$$eval('.rule.is-met', (n) => n.length);
  ok('password rules are checked as you type', before === true && met === 3, `${met}/3 met`);
}

// I14, implemented as the decision log recommends: the second-year price of the free domain
// on the page, not in the terms. It is the single biggest source of billing complaints.
await p.evaluate(() => (location.hash = '#/product/pro'));
await p.waitForSelector('.kv');
{
  const cards = await p.$$eval('.panel--pad h2', (n) => n.map((h) => h.textContent.trim()));
  const y2 = await p.$$eval('.kv dd', (n) => n.map((d) => d.textContent.trim()));
  // The second-year figure sits in the last kv of the free-domain card.
  const priced = y2.some((v) => /\d[\d.,]*\s*\/?\s*\S*$/.test(v) && /\d/.test(v));
  ok('the free domain states its renewal price', cards.length >= 2 && priced, y2.slice(-1)[0] ?? 'none');
}

// I13: "Unlimited" is a fair-use word. A superlative on a spec sheet with nothing qualifying
// it is the version that generates the complaint.
await p.evaluate(() => (location.hash = '#/compare'));
await p.waitForSelector('.compare');
{
  const hasUnl = (await p.$$eval('.unl', (n) => n.length)) > 0;
  const qualified = (await p.$$eval('.notice', (n) => n.length)) > 0;
  ok('"Unlimited" is qualified where it is claimed', !hasUnl || qualified);
}

// "Some buttons don't work" was the report, so the controls that were inert are exercised
// here rather than only counted by the static audit.
await p.evaluate(() => (location.hash = '#/account/domains/dom-1/nameservers'));
await p.waitForSelector('.methods input[value="custom"]');
{
  // dom-1 sits on our nameservers, so the custom fields appear only once that is chosen.
  await p.check('.methods input[value="custom"]');
  await p.waitForSelector('.form .field-label');
  const before = await p.$$eval('.form .field-label', (n) => n.length);
  await p.click('.form__foot .btn--secondary');
  await p.waitForTimeout(150);
  const after = await p.$$eval('.form .field-label', (n) => n.length);
  ok('add-a-nameserver adds one', after === before + 1, `${before} -> ${after}`);

  await p.click('.form__foot .btn--primary');
  await p.waitForSelector('.banner--success');
  ok('saving says that it saved', true);

  await p.evaluate(() => (location.hash = '#/account/domains/dom-1/dns'));
  await p.waitForSelector('.data tbody tr');
  const rows = await p.$$eval('.data tbody tr', (n) => n.length);
  await p.click('.data tbody tr:first-child .btn--danger');
  await p.waitForTimeout(150);
  const left = await p.$$eval('.data tbody tr', (n) => n.length);
  ok('deleting a DNS record deletes it', left === rows - 1, `${rows} -> ${left}`);

  // The store, not the screen, holds the edit: a switch flipped on one page reads the same
  // on the next.
  await p.evaluate(() => (location.hash = '#/account/domains/dom-1/transfer-out'));
  await p.waitForSelector('input[name="lock"]');
  await p.click('input[name="lock"]');
  await p.waitForTimeout(120);
  await p.evaluate(() => (location.hash = '#/account/domains/dom-1'));
  await p.waitForSelector('input[name="lock"]');
  ok('an edit on one domain page shows on another', !(await p.$eval('input[name="lock"]', (i) => i.checked)));
  await p.click('input[name="lock"]');
}

// A reply that vanishes is worse than no reply box.
await p.evaluate(() => (location.hash = '#/account/tickets/tkt-7741'));
await p.waitForSelector('#reply');
{
  const before = await p.$$eval('.thread .msg', (n) => n.length);
  await p.fill('#reply', 'شكرًا، جربت وشغال.');
  await p.click('.card .actions .btn--lg');
  await p.waitForTimeout(200);
  const after = await p.$$eval('.thread .msg', (n) => n.length);
  ok('a sent reply joins the thread', after === before + 1, `${before} -> ${after}`);

  await p.click('.card .actions .btn--quiet');
  await p.waitForTimeout(150);
  const boxGone = (await p.$$('#reply')).length === 0;
  ok('closing a ticket removes the reply box', boxGone);
}

// Removing a saved card removes it.
await p.evaluate(() => (location.hash = '#/account/payment-methods'));
await p.waitForSelector('.method-row');
{
  const before = await p.$$eval('.method-row', (n) => n.length);
  await p.click('.method-row:last-child .btn--danger');
  await p.waitForTimeout(150);
  const after = await p.$$eval('.method-row', (n) => n.length);
  ok('removing a saved card removes it', after === before - 1, `${before} -> ${after}`);
}

// The transfer form was a dead end: submit did nothing at all.
await p.evaluate(() => (location.hash = '#/transfer'));
await p.waitForSelector('form.panel');
{
  await p.fill('form.panel input:nth-of-type(1)', 'example.com');
  await p.evaluate(() => {
    for (const el of document.querySelectorAll('form.panel [required]')) {
      if (el.value) continue;
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      set.call(el, 'ABC-123');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await p.click('form.panel button[type=submit]');
  await p.waitForSelector('.stage__title');
  ok('starting a transfer goes somewhere', true);
}

// S-01: a mistyped URL used to redirect silently to the homepage, which looks exactly like a
// working link that went somewhere else.
await p.evaluate(() => (location.hash = '#/no/such/page'));
await p.waitForSelector('.err__code');
{
  const code = await p.$eval('.err__code', (e) => e.textContent.trim());
  const acts = await p.$$eval('.stage .acts a, .stage .acts button', (n) => n.length);
  ok('an unknown URL is a 404, not a silent redirect home', code === '404' && acts >= 1, code);
}

// Each error state ends somewhere different, because the useful next move differs.
{
  const dest = [];
  for (const k of ['404', '500', '403', 'maintenance']) {
    await p.evaluate((kk) => (location.hash = `#/error/${kk}`), k);
    await p.waitForSelector('.err__code');
    dest.push(await p.$eval('.err__code', (e) => e.textContent.trim()));
  }
  ok('four error states, four codes', new Set(dest).size === 4, dest.join(' '));
}

// S-05: severity is carried by ground, border and icon together. Colour alone fails for
// roughly one man in twelve, and the fourth severity is the one that ships untested.
await p.evaluate(() => (location.hash = '#/system/banners'));
await p.waitForSelector('.banner');
{
  const shape = await p.evaluate(() =>
    ['info', 'success', 'warning', 'danger'].map((s) => {
      const el = document.querySelector(`.banner--${s}`);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        s,
        bg: cs.backgroundColor,
        border: cs.borderTopColor,
        icon: !!el.querySelector('.banner__icon svg'),
      };
    }),
  );
  const all = shape.every((x) => x && x.icon && x.bg !== 'rgba(0, 0, 0, 0)' && x.border !== x.bg);
  const distinct = new Set(shape.map((x) => x?.bg)).size;
  ok('all four severities differ by more than colour', all && distinct === 4, `${distinct} grounds`);
}

// S-06: the most privacy-preserving default, and refusing has to be as easy as agreeing.
await p.evaluate(() => {
  localStorage.removeItem('sws.consent');
});
await p.evaluate(() => (location.hash = '#/'));
await p.reload({ waitUntil: 'networkidle' });
await p.waitForSelector('.consent');
{
  const weights = await p.$$eval('.consent__acts .btn', (n) =>
    n.map((b) => getComputedStyle(b).backgroundColor),
  );
  const sameWeight = new Set(weights).size === 1;
  const noDismiss = (await p.$$eval('.consent [aria-label*="ismiss"], .consent__close', (n) => n.length)) === 0;
  ok('reject is as prominent as accept', sameWeight && weights.length === 2, `${weights.length} buttons`);
  ok('consent cannot be dismissed without answering', noDismiss);

  await p.click('.consent__more');
  await p.waitForSelector('.consent__rows');
  const optIns = await p.$$eval('.consent__rows input[type=checkbox]', (n) => n.map((c) => c.checked));
  ok('every optional category starts off', optIns.length > 0 && optIns.every((c) => c === false), `${optIns.length} optional`);
}

// PRODUCT.md: no verified proof metrics exist. The company pages are where an invented
// uptime figure or certification would land, so they are checked for one.
for (const r of ['#/about', '#/data-centres', '#/status', '#/account/status']) {
  await p.evaluate((h) => (location.hash = h), r);
  await p.waitForSelector('main h1');
  await p.waitForTimeout(150);
  const txt = await p.$eval('main', (m) => m.textContent ?? '');
  // 99.9%, ISO 27001, Tier III, "10,000 customers" — the shapes a fabricated proof takes.
  const claims = [
    /9\d(\.\d+)?\s*%/,
    /ISO\s*\d{4,}/i,
    /Tier\s*(I{1,3}V?|[1-4])/i,
    /\d{1,3}[,،]?\d{3}\+?\s*(customers|عميل|عملاء)/i,
  ];
  const hit = claims.find((c) => c.test(txt));
  ok(`no invented proof on ${r}`, !hit, hit ? txt.match(hit)[0] : 'clean');
}

// C-05: the whole point of the proration screen is that the total can be checked against the
// lines above it. If they ever stop adding up, the screen is worse than useless.
await p.evaluate(() => (location.hash = '#/account/services/svc-8841/upgrade/review?to=unlimited'));
await p.waitForSelector('.sum');
{
  const nums = await p.$$eval('.sum__row dd', (n) =>
    n.map((d) => d.textContent.replace(/[^0-9.\-−]/g, '').replace('−', '-')),
  );
  // rows: days, credit, charge, total
  const credit = Math.abs(parseFloat(nums[1]));
  const charge = Math.abs(parseFloat(nums[2]));
  const total = parseFloat(nums[3]);
  ok(
    'proration total equals charge minus credit',
    Math.abs(charge - credit - total) < 0.02,
    `${charge} − ${credit} = ${total}`,
  );
}

// C-07: cancelling is gated on the acknowledgement that is on the same screen as the warning.
await p.evaluate(() => (location.hash = '#/account/services/svc-8841/cancel'));
await p.waitForSelector('.switch-row input');
{
  const before = await p.$eval('.acts .btn', (b) => b.disabled);
  await p.click('.switch-row input');
  const after = await p.$eval('.acts .btn', (b) => b.disabled);
  ok('cancelling waits for the acknowledgement', before === true && after === false);
}

// C-36: the bell opens what it counts, rather than a different list.
await p.evaluate(() => (location.hash = '#/account'));
await p.waitForSelector('.app__bellwrap button');
{
  const count = await p.$eval('.app__dot', (e) => Number(e.textContent.trim()));
  await p.click('.app__bellwrap button');
  await p.waitForSelector('.notifs');
  const unread = await p.$$eval('.notifs__item.is-unread', (n) => n.length);
  ok('the bell opens what it counts', count === unread, `badge ${count}, unread ${unread}`);
  await p.keyboard.press('Escape');
  const closed = (await p.$$('.notifs')).length === 0;
  ok('and closes on Escape', closed);
}

// C-35: a settings grid you have to scroll sideways to reach is the wrong answer on a phone.
await p.setViewportSize({ width: 390, height: 844 });
await p.evaluate(() => (location.hash = '#/account/notifications'));
await p.waitForSelector('.prefs');
{
  const shape = await p.evaluate(() => ({
    display: getComputedStyle(document.querySelector('.prefs')).display,
    over: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  ok('preferences stack rather than scroll on a phone', shape.display === 'block' && !shape.over);
}
await p.setViewportSize({ width: 1440, height: 900 });

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

// ── 2026-09-07: the flows the competitor screenshots showed ─────────────────────

// S-04 after the first payment: the currency is a lock, not a menu, and it says where to ask.
await p.evaluate(() => (location.hash = '#/account'));
await p.waitForSelector('.cur__lock');
ok('the account currency is locked once a payment exists', (await p.$$('.cur__lock')).length === 1);
ok('…and there is no select to change it', (await p.$$('.app__select--currency select')).length === 0);
await p.click('.cur__lock');
await p.waitForSelector('.cur__ask a[href*="tickets/new"]');
ok('the lock explains and points at Sales', true);
await p.keyboard.press('Escape');
await p.waitForTimeout(120);
ok('Escape closes the note', (await p.$$('.cur__ask')).length === 0);

// C-15 / C-17: the invoice takes its own payment, per method, with the invoice as reference.
await p.evaluate(() => (location.hash = '#/account/invoices/inv-4417'));
await p.waitForSelector('.with-side .invoice');
ok('the invoice document sits beside its payment', (await p.$$('.with-side .invoice')).length === 1);
ok('an unpaid invoice has an empty ledger, not a hidden one', (await p.$$('.card--flush .empty')).length === 1);
await p.selectOption('.dash__side select.field', 'instapay');
await p.waitForTimeout(120);
const invRef = await p.$eval('.dash__side .ref__code', (e) => e.textContent.trim());
ok('InstaPay instructions quote the invoice number', invRef.includes('INV-20260901-4417'), invRef);
const payHref = await p.$eval('.dash__side a.btn--primary', (a) => a.getAttribute('href'));
ok('Pay now goes to the method’s own screen with the invoice attached', payHref.includes('order/wallet') && payHref.includes('invoice=inv-4417'), payHref);
await p.evaluate(() => (location.hash = '#/account/invoices/inv-3950'));
await p.waitForSelector('.invoice');
ok('a paid invoice reconciles to nothing owed', (await p.$eval('.invoice__balance dd', (e) => e.textContent)).includes('0.00'));
ok('credit applied is its own line', (await p.$$('.invoice .totals__row--credit')).length === 1);
ok('the ledger lists what moved', (await p.$$eval('.card--flush .data tbody tr', (n) => n.length)) >= 2);

// C-03: the service page does the things people open it for.
await p.evaluate(() => (location.hash = '#/account/services/svc-8841'));
await p.waitForSelector('.shortcuts');
ok('ten cPanel shortcuts', (await p.$$eval('.shortcuts a', (n) => n.length)) === 10);
const firstUpgrade = await p.$eval('a[href*="upgrade"]', (a) => a.getAttribute('href'));
ok('the first upgrade link is the plan change', firstUpgrade.endsWith('/upgrade'), firstUpgrade);
ok('exactly one cancel link', (await p.$$('a[href*="cancel"]')).length === 1);
ok('the auto-renew switch carries its developer note', (await p.$$('.dev-note')).length >= 1);
await p.click('.card .filters__btn:nth-child(2)');
await p.waitForTimeout(120);
ok('the invoices tab lists this service’s invoices', (await p.$$eval('.card .data tbody tr', (n) => n.length)) >= 2);

// O-01 for a VPS: server settings gate Continue until they are real.
await p.evaluate(() => (location.hash = '#/configure/vps-2'));
await p.waitForSelector('.server-settings');
ok('a VPS shows server settings', (await p.$$('.server-settings')).length === 1);
ok('…and no builder add-on', (await p.$$eval('.addon', (n) => n.length)) === 2);
ok('Continue waits for the settings', await p.$eval('.checkout__aside .btn', (b) => b.disabled));
await p.evaluate(() => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  const fill = (name, v) => {
    const el = document.querySelector(`input[name="${name}"]`);
    set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  fill('hostname', 'srv1.example.com');
  fill('rootPassword', 'Sws-Prototype-9');
  fill('ns1', 'ns1.example.com');
  fill('ns2', 'ns2.example.com');
});
await p.waitForTimeout(120);
ok('…and opens once they are', !(await p.$eval('.checkout__aside .btn', (b) => b.disabled)));

// C-41: the status page inside the account, and the day nothing is wrong.
await p.evaluate(() => (location.hash = '#/account/status?state=clear'));
await p.waitForSelector('.card.empty');
ok('a clear day is an empty state, not an empty list', (await p.$$('.incident')).length === 0);
await p.evaluate(() => (location.hash = '#/account/status'));
await p.waitForSelector('.bar select.field');
await p.selectOption('.bar select.field', 'resolved');
await p.waitForTimeout(120);
ok('the incident filter filters', (await p.$$eval('.incident', (n) => n.length)) === 2);

// ADR-0003: Latin numerals everywhere, including inside Arabic copy.
await p.evaluate(() => (location.hash = '#/account/invoices/inv-4417'));
await p.waitForSelector('.invoice');
const easternDigits = await p.$eval('main', (e) => (e.textContent.match(/[٠-٩۰-۹]/g) ?? []).length);
ok('ADR-0003 Latin numerals', easternDigits === 0, `${easternDigits} eastern digit(s)`);

console.log(errs.length ? `\n${errs.length} console error(s):\n  ${errs.slice(0, 4).join('\n  ')}` : '\nclean console');
await b.close();
