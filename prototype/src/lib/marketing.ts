/**
 * Marketing-page data — spec section 5.1, screens M-10 to M-21.
 *
 * A standing constraint from PRODUCT.md governs this file: no verified proof metrics exist for
 * SWS. So there are no uptime percentages, no customer counts, no certifications and no
 * testimonials in here, and none are invented to fill a layout. Where a page would normally
 * carry one, it carries a marked placeholder instead — `NEEDS_FACT` — so the gap is visible in
 * review rather than shipped as a claim nobody can stand behind.
 */

/** Something the client has to supply before the page can make the claim. */
export const NEEDS_FACT = '—' as const;

/* ── network status: M-16 ───────────────────────────────────────────────────── */
/*
 * C19 (build vs buy) is still open. That decision is about where the data comes from, not what
 * the page has to say, so the page is designed against fixtures and the source is swappable.
 */

export type SystemState = 'operational' | 'degraded' | 'maintenance' | 'down';

export interface SystemRow {
  id: string;
  labelKey: string;
  state: SystemState;
}

export const SYSTEMS: SystemRow[] = [
  { id: 'web', labelKey: 'status.sys.web', state: 'operational' },
  { id: 'mail', labelKey: 'status.sys.mail', state: 'operational' },
  { id: 'dns', labelKey: 'status.sys.dns', state: 'operational' },
  { id: 'panel', labelKey: 'status.sys.panel', state: 'maintenance' },
  { id: 'billing', labelKey: 'status.sys.billing', state: 'operational' },
  { id: 'api', labelKey: 'status.sys.api', state: 'degraded' },
];

export interface Incident {
  id: string;
  at: string;
  state: SystemState;
  titleKey: string;
  bodyKey: string;
  /** Minutes, where the incident has closed. */
  minutes?: number;
}

export const INCIDENTS: Incident[] = [
  {
    id: 'inc-3',
    at: '2026-09-01',
    state: 'maintenance',
    titleKey: 'status.inc3',
    bodyKey: 'status.inc3b',
  },
  {
    id: 'inc-2',
    at: '2026-08-24',
    state: 'degraded',
    titleKey: 'status.inc2',
    bodyKey: 'status.inc2b',
    minutes: 38,
  },
  {
    id: 'inc-1',
    at: '2026-08-11',
    state: 'down',
    titleKey: 'status.inc1',
    bodyKey: 'status.inc1b',
    minutes: 12,
  },
];

/* ── data centres: M-19 ─────────────────────────────────────────────────────── */
/*
 * The Swiss location is the positioning (PRODUCT.md P25), so it is stated plainly. What is not
 * stated is any certification, tier rating or uptime figure: none has been verified, and a
 * data-centre page is exactly where an unverified certification does real damage.
 */

export interface Site {
  id: string;
  city: string;
  country: string;
  countryKey: string;
  /** IATA-style code used in server hostnames, which is where customers actually meet it. */
  code: string;
  primary: boolean;
}

export const SITES: Site[] = [
  { id: 'zrh', city: 'Zürich', country: 'CH', countryKey: 'dc.ch', code: 'ZRH', primary: true },
  { id: 'cai', city: 'Cairo', country: 'EG', countryKey: 'dc.eg', code: 'CAI', primary: false },
];

/** What we can say about the facilities without a certificate to point at. */
export const DC_FEATURES = [
  { id: 'power', titleKey: 'dc.power', bodyKey: 'dc.powerBody' },
  { id: 'network', titleKey: 'dc.network', bodyKey: 'dc.networkBody' },
  { id: 'law', titleKey: 'dc.law', bodyKey: 'dc.lawBody' },
  { id: 'backup', titleKey: 'dc.backup', bodyKey: 'dc.backupBody' },
];

/* ── learning centre: M-21 ──────────────────────────────────────────────────── */

export interface Post {
  id: string;
  slug: string;
  category: 'start' | 'domains' | 'email' | 'wordpress';
  titleKey: string;
  ledeKey: string;
  bodyKey: string;
  date: string;
  minutes: number;
}

export const POSTS: Post[] = [
  {
    id: 'p-5',
    slug: 'choose-a-plan',
    category: 'start',
    titleKey: 'blog.p5',
    ledeKey: 'blog.p5l',
    bodyKey: 'blog.p5b',
    date: '2026-08-26',
    minutes: 6,
  },
  {
    id: 'p-4',
    slug: 'move-a-site',
    category: 'start',
    titleKey: 'blog.p4',
    ledeKey: 'blog.p4l',
    bodyKey: 'blog.p4b',
    date: '2026-08-18',
    minutes: 8,
  },
  {
    id: 'p-3',
    slug: 'pick-a-domain',
    category: 'domains',
    titleKey: 'blog.p3',
    ledeKey: 'blog.p3l',
    bodyKey: 'blog.p3b',
    date: '2026-08-04',
    minutes: 5,
  },
  {
    id: 'p-2',
    slug: 'email-that-arrives',
    category: 'email',
    titleKey: 'blog.p2',
    ledeKey: 'blog.p2l',
    bodyKey: 'blog.p2b',
    date: '2026-07-21',
    minutes: 7,
  },
  {
    id: 'p-1',
    slug: 'faster-wordpress',
    category: 'wordpress',
    titleKey: 'blog.p1',
    ledeKey: 'blog.p1l',
    bodyKey: 'blog.p1b',
    date: '2026-07-09',
    minutes: 9,
  },
];

export const POST_CATEGORIES = ['all', 'start', 'domains', 'email', 'wordpress'] as const;

/* ── contact: M-18 ──────────────────────────────────────────────────────────── */

export const CONTACT_CHANNELS = [
  { id: 'ticket', titleKey: 'ct.ticket', bodyKey: 'ct.ticketBody', to: '/account/tickets/new' },
  { id: 'kb', titleKey: 'ct.kb', bodyKey: 'ct.kbBody', to: '/account/knowledgebase' },
  { id: 'status', titleKey: 'ct.status', bodyKey: 'ct.statusBody', to: '/status' },
];

export const CONTACT_SUBJECTS = [
  'ct.subj.sales',
  'ct.subj.billing',
  'ct.subj.technical',
  'ct.subj.migration',
  'ct.subj.other',
];

/* ── migration request: M-15 ────────────────────────────────────────────────── */

export const MIGRATION_PANELS = ['cPanel', 'Plesk', 'DirectAdmin', 'WordPress', 'other'];
