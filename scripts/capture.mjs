/**
 * Review captures for the SWS front end.
 *
 * Walks every route at desktop and mobile and writes one full-page PNG per pair into
 * .impeccable/review/. Entrance motion is disabled before the shutter: an element still
 * mid-animation photographs as a missing element and gets "fixed" into a regression.
 *
 * Usage: node scripts/capture.mjs [baseUrl]
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:5173/';
const OUT = join(process.cwd(), '.impeccable', 'review');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

/**
 * Every route in App.tsx, in the order a person meets them: marketing, then the funnel, then
 * the door, then the client area. A route missing from this list is a route nobody has looked at.
 */
const ROUTES = [
  // Marketing — spec 5.1
  { name: 'home', path: '#/' },
  { name: 'hosting-shared', path: '#/hosting/shared' },
  { name: 'hosting-wordpress', path: '#/hosting/wordpress' },
  { name: 'hosting-cloud', path: '#/hosting/cloud' },
  { name: 'hosting-vps', path: '#/hosting/vps' },
  { name: 'hosting-email', path: '#/hosting/email' },
  { name: 'hosting-monitoring', path: '#/hosting/monitoring' },
  { name: 'ssl', path: '#/ssl' },
  { name: 'builder', path: '#/builder' },
  { name: 'domains', path: '#/domains' },
  { name: 'transfer', path: '#/transfer' },

  // Ordering — spec 5.2 and 7
  { name: 'configure', path: '#/configure/ultra' },
  { name: 'cart', path: '#/cart' },
  { name: 'checkout', path: '#/checkout' },
  { name: 'confirmation', path: '#/confirmation' },

  // Auth — spec 5.3 and 8
  { name: 'login', path: '#/login' },
  { name: 'register', path: '#/register' },
  { name: 'reset', path: '#/reset' },
  { name: 'twofactor', path: '#/2fa' },

  // Client area — spec 5.4 and 9
  { name: 'account', path: '#/account' },
  { name: 'acc-services', path: '#/account/services' },
  { name: 'acc-service', path: '#/account/services/svc-8841' },
  { name: 'acc-domains', path: '#/account/domains' },
  { name: 'acc-domain', path: '#/account/domains/dom-1' },
  { name: 'acc-invoices', path: '#/account/invoices' },
  { name: 'acc-invoice', path: '#/account/invoices/inv-4417' },
  { name: 'acc-funds', path: '#/account/funds' },
  { name: 'acc-payment-methods', path: '#/account/payment-methods' },
  { name: 'acc-tickets', path: '#/account/tickets' },
  { name: 'acc-ticket-new', path: '#/account/tickets/new' },
  { name: 'acc-ticket', path: '#/account/tickets/tkt-7741' },
  { name: 'acc-kb', path: '#/account/knowledgebase' },
  { name: 'acc-kb-article', path: '#/account/knowledgebase/point-domain' },
  { name: 'acc-announcements', path: '#/account/announcements' },
  { name: 'acc-affiliates', path: '#/account/affiliates' },
  { name: 'acc-contacts', path: '#/account/contacts' },
  { name: 'acc-security', path: '#/account/security' },
  { name: 'acc-upgrade', path: '#/account/services/svc-8841/upgrade' },
  { name: 'acc-upgrade-review', path: '#/account/services/svc-8841/upgrade/review?to=unlimited' },
  { name: 'acc-upgrade-done', path: '#/account/services/svc-8841/upgrade/done?to=unlimited' },
  { name: 'acc-cancel', path: '#/account/services/svc-8841/cancel' },
  { name: 'acc-renew', path: '#/account/renew/svc-8841' },
  { name: 'acc-transactions', path: '#/account/transactions' },
  { name: 'acc-payment-failed', path: '#/account/payment-failed' },
  { name: 'acc-withdraw', path: '#/account/affiliates/withdraw' },
  { name: 'acc-notifications', path: '#/account/notifications' },
  { name: 'compare', path: '#/compare' },
  { name: 'product', path: '#/product/ultra' },
  { name: 'tld-pricing', path: '#/domains/pricing' },
  { name: 'migrate', path: '#/migrate' },
  { name: 'status', path: '#/status' },
  { name: 'about', path: '#/about' },
  { name: 'data-centres', path: '#/data-centres' },
  { name: 'contact', path: '#/contact' },
  { name: 'learn', path: '#/learn' },
  { name: 'learn-post', path: '#/learn/move-a-site' },
  { name: 'registrant', path: '#/checkout/registrant' },
  { name: 'card-entry', path: '#/checkout/card' },
  { name: '3ds-go', path: '#/checkout/3ds' },
  { name: '3ds-back', path: '#/checkout/3ds?state=return' },
  { name: 'bank-transfer', path: '#/order/bank' },
  { name: 'wallet-transfer', path: '#/order/wallet' },
  { name: 'payment-failed-order', path: '#/order/failed' },
  { name: 'order-pending', path: '#/order/pending' },
  { name: 'set-password', path: '#/reset/new' },
  { name: 'verify-email', path: '#/verify' },
  { name: 'verify-done', path: '#/verify?state=done' },
  { name: 'session-expired', path: '#/expired' },
  { name: 'err-404', path: '#/error/404' },
  { name: 'err-500', path: '#/error/500' },
  { name: 'err-403', path: '#/error/403' },
  { name: 'err-maintenance', path: '#/error/maintenance' },
  { name: 'cpanel-sso', path: '#/cpanel' },
  { name: 'sys-banners', path: '#/system/banners' },
  { name: 'not-found', path: '#/no/such/page' },

  { name: 'legal', path: '#/legal/privacy' },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failed = false;

/** Order two plans, so the cart-dependent routes have real lines on them. */
async function fillCart(page) {
  // Walk the real ordering flow rather than injecting state, so the cart holds a line that
  // actually went through configure and the domain step.
  await page.goto(`${BASE}#/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.plan .btn', { state: 'visible' });
  await page.locator('.plan--featured .btn').click();
  await page.waitForSelector('.cycles');
  await page.locator('.checkout__aside .btn').click();
  await page.waitForSelector('.choices');
  await page.fill('#dom', 'kamalatelier');
  await page.locator('.domain-strip__form .btn').click();
  await page.waitForTimeout(250);
  await page.locator('.step-foot .btn').click();
  await page.waitForTimeout(350);
}

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    // The product ships light only; a runner inheriting a dark OS preference would
    // photograph a theme this build does not have.
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  // Errors are attributed to the route that was loading when they fired. Across 39 routes a
  // single pooled list tells you something broke but not where, which is the same as nothing.
  let errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await fillCart(page);

  for (const route of ROUTES) {
    errors = [];
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('main', { state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);

    await page.screenshot({
      path: join(OUT, `${route.name}-${vp.name}.png`),
      fullPage: true,
    });

    const shape = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      height: document.documentElement.scrollHeight,
      // An empty main is a route that resolved but rendered nothing — the exact failure a
      // full-page screenshot hides behind a header and a footer.
      empty: (document.querySelector('main')?.textContent ?? '').trim().length < 20,
    }));

    /*
     * Naming the culprit rather than only flagging the page. Both edges are probed: in RTL an
     * element that escapes does so past the left, and a right-only check reports nothing at
     * all while the page scrolls sideways.
     */
    if (shape.overflow) {
      const who = await page.evaluate(() =>
        [...document.querySelectorAll('*')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > window.innerWidth + 1 || r.left < -1;
          })
          .slice(0, 6)
          .map((el) => `${el.tagName}.${String(el.className).slice(0, 28)} r=${Math.round(el.getBoundingClientRect().right)} w=${Math.round(el.getBoundingClientRect().width)}`),
      );
      console.log('   OVERFLOW BY:', who.join(' | '));
    }

    const flags = [
      shape.overflow ? 'HORIZONTAL OVERFLOW' : '',
      shape.empty ? 'EMPTY MAIN' : '',
      errors.length ? `${errors.length} console error(s)` : '',
    ].filter(Boolean);

    console.log(
      `${route.name.padEnd(20)} ${vp.name.padEnd(8)} ${String(shape.height).padStart(5)}px tall  ` +
        (flags.length ? flags.join(' · ') : 'ok'),
    );
    errors.slice(0, 3).forEach((e) => console.log(`    ${e.slice(0, 160)}`));

    if (flags.length) failed = true;
  }

  // The English rendering is the same layout read the other way, not a mirror of it.
  if (vp.name === 'desktop') {
    await page.goto(`${BASE}#/`, { waitUntil: 'networkidle' });
    await page.selectOption('.masthead__select:nth-of-type(1) select', 'en');
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(OUT, 'home-desktop-en.png'), fullPage: true });

    await page.goto(`${BASE}#/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(OUT, 'checkout-desktop-en.png'), fullPage: true });

    // The client area is where the bilingual fixtures live, so it is photographed both ways.
    for (const [name, path] of [
      ['account', '#/account'],
      ['acc-ticket', '#/account/tickets/tkt-7741'],
      ['acc-security', '#/account/security'],
    ]) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(OUT, `${name}-desktop-en.png`), fullPage: true });
    }

    // Spec 4.3 requires dark mode, so it is evidenced rather than assumed.
    await page.goto(`${BASE}#/`, { waitUntil: 'networkidle' });
    await page.locator('.masthead__icon-btn').click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(OUT, 'home-desktop-dark.png'), fullPage: true });
    await page.locator('.masthead__icon-btn').click();
    console.log('en captures (home, checkout, account, ticket, security) + home-dark  1440px');
  }

  await context.close();
}

await browser.close();
console.log(failed ? '\nFAILED — see above.' : '\nAll routes clean at both viewports.');
process.exit(failed ? 1 : 0);
