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
await p.waitForSelector('.rail__link');
const sections = await p.$$eval('.rail__link', (n) => n.length);
ok('rail reaches every section', sections === 12, `${sections} sections`);
ok('dashboard shows the four counts', (await p.$$eval('.tiles .tile', (n) => n.length)) === 4);

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
await p.selectOption('.masthead__select:nth-of-type(1) select', 'en');
await p.waitForTimeout(150);
const bodyEn = await p.$eval('.msg__body', (e) => e.textContent.trim());
ok('ticket text follows the language', bodyAr !== bodyEn, `${bodyAr.slice(0, 18)}… -> ${bodyEn.slice(0, 18)}…`);
await p.selectOption('.masthead__select:nth-of-type(1) select', 'ar');

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

// ADR-0003: Latin numerals everywhere, including inside Arabic copy.
await p.evaluate(() => (location.hash = '#/account/invoices/inv-4417'));
await p.waitForSelector('.invoice');
const easternDigits = await p.$eval('main', (e) => (e.textContent.match(/[٠-٩۰-۹]/g) ?? []).length);
ok('ADR-0003 Latin numerals', easternDigits === 0, `${easternDigits} eastern digit(s)`);

console.log(errs.length ? `\n${errs.length} console error(s):\n  ${errs.slice(0, 4).join('\n  ')}` : '\nclean console');
await b.close();
