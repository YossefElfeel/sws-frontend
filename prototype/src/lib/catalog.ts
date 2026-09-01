/**
 * Product catalogue — values taken from the UI/UX spec, not invented.
 *
 * Plan names, prices, resource figures, billing cycles, add-ons and payment gateways all come
 * from SWS_UIUX_Spec sections 6.2, 7.2 and 11. WHMCS remains the system of record in
 * production (spec section 10 maps each screen to its API action); this module is shaped like
 * the payload that sync would deliver, so replacing it is a change of source, not a rewrite.
 */

/** Spec 4.2. Seven currencies, switchable without a full page reload. */
export const CURRENCIES = ['USD', 'AED', 'CHF', 'EGP', 'EUR', 'KWD', 'SAR'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Rates against USD, used to present the spec's USD prices in the other six. */
const RATE: Record<Currency, number> = {
  USD: 1,
  AED: 3.67,
  CHF: 0.88,
  EGP: 48.5,
  EUR: 0.92,
  KWD: 0.31,
  SAR: 3.75,
};

/** Spec 7.2. Six cycles, with the saving shown on the longer options. */
export const CYCLES = [
  'monthly',
  'quarterly',
  'semiannually',
  'annually',
  'biennially',
  'triennially',
] as const;
export type Cycle = (typeof CYCLES)[number];

/** Months per cycle, and the discount the spec shows against paying monthly. */
export const CYCLE_META: Record<Cycle, { months: number; save: number }> = {
  monthly: { months: 1, save: 0 },
  quarterly: { months: 3, save: 0 },
  semiannually: { months: 6, save: 5 },
  annually: { months: 12, save: 8 },
  biennially: { months: 24, save: 17 },
  triennially: { months: 36, save: 22 },
};

export interface Plan {
  id: string;
  /** Spec 6.2 plan names. */
  name: string;
  featured: boolean;
  sites: number | 'unlimited';
  storageGb: number | 'unlimited';
  bandwidthGb: number | 'unlimited';
  subdomains: number | 'unlimited';
  mailboxes: number | 'unlimited';
  freeDomainFirstYear: boolean;
  /** Monthly price in USD minor units, exactly as the spec states it. */
  monthlyUsdMinor: number;
  /** Spec 6.2 "Additional Features", below the separator on the card. */
  additional: string[];
}

/** Spec 6.2, the Shared Hosting plan table and the reference screenshot beside it. */
export const PLANS: Plan[] = [
  {
    id: 'single',
    name: 'Single',
    featured: false,
    sites: 1,
    storageGb: 10,
    bandwidthGb: 100,
    subdomains: 10,
    mailboxes: 10,
    freeDomainFirstYear: false,
    monthlyUsdMinor: 500,
    additional: [
      '1 GB RAM',
      'Cloud Linux Servers',
      'Softaculous Installer',
      'Free Virus Scanner',
      'Free Immunify 360',
      '24/7 Support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    featured: false,
    sites: 3,
    storageGb: 20,
    bandwidthGb: 150,
    subdomains: 100,
    mailboxes: 100,
    freeDomainFirstYear: true,
    monthlyUsdMinor: 750,
    additional: [
      '1.5 GB RAM',
      'LiteSpeed Cache',
      'Softaculous Installer',
      'Free Virus Scanner',
      'Enhanced DDOS protection',
      'Free Immunify 360',
      '24/7 Support',
    ],
  },
  {
    // Spec 6.2: the Featured badge sits on Ultra.
    id: 'ultra',
    name: 'Ultra',
    featured: true,
    sites: 100,
    storageGb: 50,
    bandwidthGb: 'unlimited',
    subdomains: 'unlimited',
    mailboxes: 'unlimited',
    freeDomainFirstYear: false,
    monthlyUsdMinor: 1000,
    additional: ['2 GB RAM', 'LiteSpeed Cache', 'CDN', '24/7 Support'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    featured: false,
    sites: 'unlimited',
    storageGb: 'unlimited',
    bandwidthGb: 'unlimited',
    subdomains: 'unlimited',
    mailboxes: 'unlimited',
    freeDomainFirstYear: true,
    monthlyUsdMinor: 2000,
    additional: ['3 GB RAM', 'CDN', 'LiteSpeed Cache', '24/7 Support'],
  },
];

/** Price for a plan on a cycle, in the requested currency, as minor units. */
/**
 * The least a thing needs to be to sit in the cart: a name, an identity and a monthly price.
 * Shared-hosting Plans satisfy it, and so does every other family's Offer — which is what
 * lets "Order now" mean the same thing on every product page.
 */
export interface Priced {
  id: string;
  name: string;
  monthlyUsdMinor: number;
}

export function planPrice(plan: Priced, cycle: Cycle, currency: Currency): number {
  const { months, save } = CYCLE_META[cycle];
  const gross = plan.monthlyUsdMinor * months;
  const net = Math.round(gross * (1 - save / 100));
  return Math.round(net * RATE[currency]);
}

/** Spec 7.2. Add-ons offered during Configure Product. */
export interface AddonOption {
  id: string;
  label: string;
  /** USD minor units. 0 is free. */
  priceUsdMinor: number;
  per: 'year' | 'month' | 'once';
}

export interface AddonGroup {
  id: string;
  titleKey: string;
  bodyKey: string;
  options: AddonOption[];
}

export const ADDONS: AddonGroup[] = [
  {
    id: 'ssl',
    titleKey: 'addon.ssl.title',
    bodyKey: 'addon.ssl.body',
    options: [
      { id: 'none', label: 'None', priceUsdMinor: 0, per: 'once' },
      { id: 'rapidssl', label: 'RapidSSL', priceUsdMinor: 3795, per: 'year' },
      { id: 'rapidssl-wild', label: 'RapidSSL Wildcard', priceUsdMinor: 14980, per: 'year' },
      { id: 'geotrust', label: 'GeoTrust QuickSSL Premium', priceUsdMinor: 7900, per: 'year' },
      { id: 'geotrust-wild', label: 'GeoTrust QuickSSL Premium Wildcard', priceUsdMinor: 27900, per: 'year' },
      { id: 'digicert', label: 'DigiCert Secure Site', priceUsdMinor: 44880, per: 'year' },
      { id: 'digicert-pro', label: 'DigiCert Secure Site Pro', priceUsdMinor: 171800, per: 'year' },
    ],
  },
  {
    id: 'builder',
    titleKey: 'addon.builder.title',
    bodyKey: 'addon.builder.body',
    options: [
      { id: 'none', label: 'None', priceUsdMinor: 0, per: 'once' },
      { id: 'free', label: 'Free', priceUsdMinor: 0, per: 'month' },
      { id: 'starter', label: 'Starter', priceUsdMinor: 695, per: 'month' },
      { id: 'pro', label: 'Pro', priceUsdMinor: 1395, per: 'month' },
    ],
  },
  {
    id: 'monitoring',
    titleKey: 'addon.monitoring.title',
    bodyKey: 'addon.monitoring.body',
    options: [
      { id: 'none', label: 'None', priceUsdMinor: 0, per: 'once' },
      { id: 'lite', label: 'Lite', priceUsdMinor: 0, per: 'month' },
      { id: 'personal', label: 'Personal', priceUsdMinor: 199, per: 'month' },
      { id: 'plus', label: 'Plus', priceUsdMinor: 299, per: 'month' },
    ],
  },
];

/**
 * Spec 11. Exactly five gateways, in this order.
 *
 * "Card & Mobile Wallet" is EGP-only and the spec requires it to hide automatically when the
 * selected currency is not EGP — the same logic that governs currency across the site.
 */
export interface Gateway {
  id: string;
  labelKey: string;
  marks: string[];
  egpOnly?: boolean;
}

export const GATEWAYS: Gateway[] = [
  { id: 'stripe-card', labelKey: 'pay.stripeCard', marks: ['Stripe'] },
  { id: 'stripe-eu', labelKey: 'pay.stripeEu', marks: ['TWINT', 'Klarna'] },
  { id: 'wallet-egp', labelKey: 'pay.wallet', marks: ['Mastercard', 'VISA', 'Meeza'], egpOnly: true },
  { id: 'instapay', labelKey: 'pay.instapay', marks: ['InstaPay'] },
  { id: 'bank', labelKey: 'pay.bank', marks: [] },
];

export function gatewaysFor(currency: Currency): Gateway[] {
  return GATEWAYS.filter((g) => !g.egpOnly || currency === 'EGP');
}

/** Spec 6.4. Featured TLDs, and the full table with register / transfer / renew. */
export interface Tld {
  tld: string;
  registerUsdMinor: number;
  transferUsdMinor: number;
  renewUsdMinor: number;
  featured?: boolean;
}

export const TLDS: Tld[] = [
  { tld: '.com', registerUsdMinor: 1499, transferUsdMinor: 1499, renewUsdMinor: 1699, featured: true },
  { tld: '.shop', registerUsdMinor: 199, transferUsdMinor: 3299, renewUsdMinor: 3499, featured: true },
  { tld: '.blog', registerUsdMinor: 699, transferUsdMinor: 2999, renewUsdMinor: 3199, featured: true },
  { tld: '.tech', registerUsdMinor: 899, transferUsdMinor: 4999, renewUsdMinor: 5299, featured: true },
  { tld: '.app', registerUsdMinor: 2099, transferUsdMinor: 2099, renewUsdMinor: 2299 },
  { tld: '.org', registerUsdMinor: 999, transferUsdMinor: 1399, renewUsdMinor: 1499 },
  { tld: '.zone', registerUsdMinor: 1799, transferUsdMinor: 3799, renewUsdMinor: 3999 },
  { tld: '.fit', registerUsdMinor: 3699, transferUsdMinor: 3699, renewUsdMinor: 3899 },
  { tld: '.ch', registerUsdMinor: 1299, transferUsdMinor: 1299, renewUsdMinor: 1299 },
  { tld: '.eg', registerUsdMinor: 899, transferUsdMinor: 999, renewUsdMinor: 1099 },
];

/** Spec screenshots show tax at 14.00% on the order summary. */
export const TAX_RATE = 0.14;

export function convert(usdMinor: number, currency: Currency): number {
  return Math.round(usdMinor * RATE[currency]);
}

export function formatAmount(minor: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function statementSerial(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const leaf = String(
    (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) % 10000,
  ).padStart(4, '0');
  return `SWS-${y}${m}${d}-${leaf}`;
}
