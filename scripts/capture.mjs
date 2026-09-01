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

const ROUTES = [
  { name: 'home', path: '#/' },
  { name: 'configure', path: '#/configure/ultra' },
  { name: 'domains', path: '#/domains' },
  { name: 'cart', path: '#/cart' },
  { name: 'checkout', path: '#/checkout' },
  { name: 'confirmation', path: '#/confirmation' },
  { name: 'account', path: '#/account' },
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

  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await fillCart(page);

  for (const route of ROUTES) {
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
    }));

    console.log(
      `${route.name.padEnd(13)} ${vp.name.padEnd(8)} ${String(vp.width).padStart(5)}px  ` +
        `${String(shape.height).padStart(5)}px tall  ` +
        `${shape.overflow ? 'HORIZONTAL OVERFLOW' : 'no h-overflow'}`,
    );
    if (shape.overflow) failed = true;
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

    // Spec 4.3 requires dark mode, so it is evidenced rather than assumed.
    await page.goto(`${BASE}#/`, { waitUntil: 'networkidle' });
    await page.locator('.masthead__icon-btn').click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(OUT, 'home-desktop-dark.png'), fullPage: true });
    await page.locator('.masthead__icon-btn').click();
    console.log('home-en, checkout-en, home-dark  1440px  captured');
  }

  if (errors.length) {
    failed = true;
    console.log(`  ! ${errors.length} console error(s) during ${vp.name}`);
    errors.slice(0, 5).forEach((e) => console.log(`    ${e.slice(0, 140)}`));
  }

  await context.close();
}

await browser.close();
console.log(failed ? '\nFAILED — see above.' : '\nAll routes clean at both viewports.');
process.exit(failed ? 1 : 0);
