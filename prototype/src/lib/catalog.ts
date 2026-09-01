/**
 * Product catalogue.
 *
 * WHMCS is the system of record for pricing — roughly 1200 price fields across 8 currencies.
 * This module is shaped like the payload a build-time sync would deliver, so swapping it for
 * the real feed is a change of source, not a rewrite. Values here are development fixtures.
 */

export type Currency = 'EGP' | 'USD' | 'EUR' | 'CHF';
export type Cycle = 'monthly' | 'annually';

export interface Plan {
  id: string;
  family: 'shared' | 'wordpress' | 'cloud' | 'vps';
  name: string;
  sites: number | 'unmetered';
  storageGb: number;
  bandwidthTb: number | 'unmetered';
  mailboxes: number | 'unmetered';
  /** Minor units per cycle, so a column of prices can add up without float drift. */
  price: Record<Currency, Record<Cycle, number>>;
  freeDomain: boolean;
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EGP: 'EGP',
  USD: 'USD',
  EUR: 'EUR',
  CHF: 'CHF',
};

export const PLANS: Plan[] = [
  {
    id: 'single',
    family: 'shared',
    name: 'Single',
    sites: 1,
    storageGb: 10,
    bandwidthTb: 1,
    mailboxes: 10,
    price: {
      EGP: { monthly: 25000, annually: 250000 },
      USD: { monthly: 520, annually: 5200 },
      EUR: { monthly: 480, annually: 4800 },
      CHF: { monthly: 460, annually: 4600 },
    },
    freeDomain: false,
  },
  {
    id: 'double',
    family: 'shared',
    name: 'Double',
    sites: 2,
    storageGb: 25,
    bandwidthTb: 2,
    mailboxes: 25,
    price: {
      EGP: { monthly: 39000, annually: 390000 },
      USD: { monthly: 810, annually: 8100 },
      EUR: { monthly: 750, annually: 7500 },
      CHF: { monthly: 720, annually: 7200 },
    },
    freeDomain: true,
  },
  {
    id: 'business',
    family: 'shared',
    name: 'Business',
    sites: 5,
    storageGb: 60,
    bandwidthTb: 5,
    mailboxes: 100,
    price: {
      EGP: { monthly: 69000, annually: 690000 },
      USD: { monthly: 1430, annually: 14300 },
      EUR: { monthly: 1320, annually: 13200 },
      CHF: { monthly: 1270, annually: 12700 },
    },
    freeDomain: true,
  },
  {
    id: 'unlimited',
    family: 'shared',
    name: 'Unlimited',
    sites: 'unmetered',
    storageGb: 150,
    bandwidthTb: 'unmetered',
    mailboxes: 'unmetered',
    price: {
      EGP: { monthly: 129000, annually: 1290000 },
      USD: { monthly: 2680, annually: 26800 },
      EUR: { monthly: 2480, annually: 24800 },
      CHF: { monthly: 2380, annually: 23800 },
    },
    freeDomain: true,
  },
];

export interface Tld {
  tld: string;
  register: Record<Currency, number>;
  renew: Record<Currency, number>;
}

export const TLDS: Tld[] = [
  { tld: '.com', register: { EGP: 34000, USD: 700, EUR: 650, CHF: 620 }, renew: { EGP: 41000, USD: 850, EUR: 790, CHF: 760 } },
  { tld: '.net', register: { EGP: 42000, USD: 870, EUR: 810, CHF: 780 }, renew: { EGP: 47000, USD: 980, EUR: 900, CHF: 870 } },
  { tld: '.org', register: { EGP: 39000, USD: 810, EUR: 750, CHF: 720 }, renew: { EGP: 44000, USD: 910, EUR: 840, CHF: 810 } },
  { tld: '.ch',  register: { EGP: 52000, USD: 1080, EUR: 1000, CHF: 960 }, renew: { EGP: 52000, USD: 1080, EUR: 1000, CHF: 960 } },
  { tld: '.eg',  register: { EGP: 28000, USD: 580, EUR: 540, CHF: 520 }, renew: { EGP: 33000, USD: 690, EUR: 640, CHF: 610 } },
  { tld: '.io',  register: { EGP: 156000, USD: 3240, EUR: 3000, CHF: 2880 }, renew: { EGP: 172000, USD: 3570, EUR: 3300, CHF: 3170 } },
];

/** Payment methods that exist in a real flow. Nothing is advertised that cannot be paid with. */
export const PAYMENT_METHODS = [
  { id: 'card', labelKey: 'pay.card' },
  { id: 'vodafone', labelKey: 'pay.vodafone' },
  { id: 'etisalat', labelKey: 'pay.etisalat' },
  { id: 'orange', labelKey: 'pay.orange' },
  { id: 'wepay', labelKey: 'pay.wepay' },
  { id: 'instapay', labelKey: 'pay.instapay' },
  { id: 'transfer', labelKey: 'pay.transfer' },
] as const;

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
