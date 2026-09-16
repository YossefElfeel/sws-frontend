/**
 * The remaining product families — spec 5.1 and 6.3.
 *
 * These pages share one template, and now one presentation: a row of price cards, the shape
 * spec 6.2 sets for shared hosting. What is genuinely SSL's own — grouping by certificate type
 * and a "most ordered" badge — rides on the cards as data rather than as a layout of its own.
 *
 * The spec allowed two exceptions and neither survived the page. Website Builder was to lead
 * with a template preview, and is cards now at the product owner's request. VPS was to be a
 * comparison table because its options are "too technical for cards" — but four servers
 * compared on four numbers are four plans, and the table put their names, their prices and
 * their order buttons in three places no other product on the site keeps them.
 *
 * The 'layout' field that encoded those exceptions went with them. A field every family answers
 * the same way is not a fact about the family, and a union listing a presentation no screen
 * renders sends the next reader looking for a screen that is not there.
 */

export type Family =
  | 'shared'
  | 'wordpress'
  | 'cloud'
  | 'email'
  | 'vps'
  | 'monitoring'
  | 'ssl'
  | 'builder';

export interface FamilyMeta {
  id: Family;
  path: string;
  titleKey: string;
  ledeKey: string;
}

export const FAMILIES: FamilyMeta[] = [
  { id: 'shared', path: '/hosting/shared', titleKey: 'fam.shared', ledeKey: 'fam.shared.lede' },
  { id: 'wordpress', path: '/hosting/wordpress', titleKey: 'fam.wordpress', ledeKey: 'fam.wordpress.lede' },
  { id: 'cloud', path: '/hosting/cloud', titleKey: 'fam.cloud', ledeKey: 'fam.cloud.lede' },
  { id: 'email', path: '/hosting/email', titleKey: 'fam.email', ledeKey: 'fam.email.lede' },
  { id: 'vps', path: '/hosting/vps', titleKey: 'fam.vps', ledeKey: 'fam.vps.lede' },
  { id: 'monitoring', path: '/hosting/monitoring', titleKey: 'fam.monitoring', ledeKey: 'fam.monitoring.lede' },
  { id: 'ssl', path: '/ssl', titleKey: 'fam.ssl', ledeKey: 'fam.ssl.lede' },
  { id: 'builder', path: '/builder', titleKey: 'fam.builder', ledeKey: 'fam.builder.lede' },
];

/** A generic priced offer, used by every family that presents as cards. */
export interface Offer {
  id: string;
  name: string;
  monthlyUsdMinor: number;
  /**
   * The price before a promotion. Set it only while one is running: the card strikes it
   * through, states the payable price and says what percent came off. `monthlyUsdMinor` stays
   * what is actually charged, so nothing downstream of the card has to know about promotions.
   */
  listUsdMinor?: number;
  featured?: boolean;
  /** Badge key, e.g. the spec's "most ordered" on SSL. */
  badgeKey?: string;
  specs: string[];
  extras?: string[];
}

/** WordPress hosting — same shape as shared, tuned for a single stack. */
export const WORDPRESS: Offer[] = [
  { id: 'wp-start', name: 'WP Start', monthlyUsdMinor: 600, specs: ['1 WordPress site', '15 GB SSD', '150 GB bandwidth', 'Automatic core updates'], extras: ['LiteSpeed Cache', 'Staging site', 'Daily backups'] },
  { id: 'wp-grow', name: 'WP Grow', monthlyUsdMinor: 1100, featured: true, specs: ['5 WordPress sites', '40 GB SSD', 'Unlimited bandwidth', 'Automatic core and plugin updates'], extras: ['LiteSpeed Cache', 'Staging site', 'Object cache', 'Free domain, first year'] },
  { id: 'wp-scale', name: 'WP Scale', monthlyUsdMinor: 2400, specs: ['Unlimited WordPress sites', '100 GB SSD', 'Unlimited bandwidth', 'Priority updates'], extras: ['LiteSpeed Cache', 'Staging site', 'Object cache', 'CDN', 'Free domain, first year'] },
];

/** Cloud hosting — resource-isolated, still cPanel. */
export const CLOUD: Offer[] = [
  { id: 'cloud-1', name: 'Cloud 1', monthlyUsdMinor: 1800, specs: ['2 vCPU', '4 GB RAM', '60 GB NVMe', '2 TB bandwidth'], extras: ['cPanel included', 'Daily backups', 'Free SSL'] },
  { id: 'cloud-2', name: 'Cloud 2', monthlyUsdMinor: 3200, featured: true, specs: ['4 vCPU', '8 GB RAM', '120 GB NVMe', '4 TB bandwidth'], extras: ['cPanel included', 'Daily backups', 'Free SSL', 'CDN'] },
  { id: 'cloud-3', name: 'Cloud 3', monthlyUsdMinor: 5600, specs: ['8 vCPU', '16 GB RAM', '240 GB NVMe', 'Unlimited bandwidth'], extras: ['cPanel included', 'Hourly backups', 'Free SSL', 'CDN'] },
];

/** Email hosting — spec 6.3: mailbox count, storage, spam and antivirus. */
export const EMAIL: Offer[] = [
  { id: 'mail-5', name: 'Mail 5', monthlyUsdMinor: 200, specs: ['5 mailboxes', '10 GB per mailbox', 'Spam filtering', 'Antivirus scanning'], extras: ['IMAP and POP3', 'Webmail', 'Mobile sync'] },
  { id: 'mail-25', name: 'Mail 25', monthlyUsdMinor: 700, featured: true, specs: ['25 mailboxes', '25 GB per mailbox', 'Spam filtering', 'Antivirus scanning'], extras: ['IMAP and POP3', 'Webmail', 'Mobile sync', 'Shared calendars'] },
  { id: 'mail-100', name: 'Mail 100', monthlyUsdMinor: 2200, specs: ['100 mailboxes', '50 GB per mailbox', 'Spam filtering', 'Antivirus scanning'], extras: ['IMAP and POP3', 'Webmail', 'Mobile sync', 'Shared calendars', 'Archiving'] },
];

/** Site and server monitoring — spec 6.3: plans plus how alerts reach you. */
export const MONITORING: Offer[] = [
  { id: 'mon-lite', name: 'Lite', monthlyUsdMinor: 0, specs: ['5 monitors', '5 minute checks', 'Email alerts'], extras: ['30 day history'] },
  { id: 'mon-personal', name: 'Personal', monthlyUsdMinor: 199, featured: true, specs: ['25 monitors', '1 minute checks', 'Email and SMS alerts'], extras: ['90 day history', 'Status page'] },
  { id: 'mon-plus', name: 'Plus', monthlyUsdMinor: 299, specs: ['100 monitors', '30 second checks', 'Email, SMS and webhook alerts'], extras: ['1 year history', 'Status page', 'Server metrics'] },
];

/**
 * SSL — spec 6.3: grouped by certificate type, with a most-ordered badge.
 *
 * The wildcard carries a `listUsdMinor`, which is a FIXTURE in the same way the prices around
 * it are: no promotion has been agreed on any product. It is here so the discounted card can
 * be reviewed on a second family as well as on shared hosting, and it is one line to delete.
 */
export const SSL: Offer[] = [
  { id: 'ssl-dv', name: 'RapidSSL (DV)', monthlyUsdMinor: 316, badgeKey: 'ssl.mostOrdered', specs: ['Domain Validated', 'Issued in minutes', 'Single domain'], extras: ['256-bit encryption', 'Browser padlock', 'Reissues included'] },
  { id: 'ssl-ov', name: 'GeoTrust QuickSSL Premium (OV)', monthlyUsdMinor: 658, specs: ['Organisation Validated', 'Issued in 1–3 days', 'Single domain'], extras: ['256-bit encryption', 'Site seal', 'Company vetted'] },
  { id: 'ssl-wild', name: 'RapidSSL Wildcard', monthlyUsdMinor: 1248, listUsdMinor: 1560, featured: true, specs: ['Domain Validated', 'Unlimited subdomains', 'Issued in minutes'], extras: ['256-bit encryption', 'Browser padlock', 'Reissues included'] },
];

/**
 * Website Builder tiers, at the prices the spec's add-on group carries. The page leads with a
 * preview as the spec asks, but a visitor still has to be able to see what it costs — a
 * product page with no price is a page you cannot decide from.
 */
export const BUILDER: Offer[] = [
  {
    id: 'builder-free',
    name: 'Free',
    monthlyUsdMinor: 0,
    specs: ['1 site', 'SWS subdomain', 'Drag and drop editor'],
    extras: ['Mobile-ready templates'],
  },
  {
    id: 'builder-starter',
    name: 'Starter',
    monthlyUsdMinor: 695,
    featured: true,
    specs: ['1 site', 'Your own domain', 'Drag and drop editor', 'No SWS badge'],
    extras: ['Mobile-ready templates', 'Contact forms', 'Basic SEO fields'],
  },
  {
    id: 'builder-pro',
    name: 'Pro',
    monthlyUsdMinor: 1395,
    specs: ['5 sites', 'Your own domain', 'Drag and drop editor', 'Online store'],
    extras: ['Mobile-ready templates', 'Contact forms', 'Basic SEO fields', 'Priority support'],
  },
];

/**
 * VPS — the servers as figures.
 *
 * The row stays the product data rather than the card: Configure reads these four numbers to
 * print the machine it is about to provision, and the cards below are built from the same four,
 * so the pricing page and the order step cannot end up quoting different servers.
 */
export interface VpsRow {
  id: string;
  name: string;
  vcpu: number;
  ramGb: number;
  storageGb: number;
  bandwidthTb: number;
  monthlyUsdMinor: number;
  featured?: boolean;
}

export const VPS: VpsRow[] = [
  { id: 'vps-1', name: 'VPS 1', vcpu: 1, ramGb: 2, storageGb: 40, bandwidthTb: 2, monthlyUsdMinor: 900 },
  { id: 'vps-2', name: 'VPS 2', vcpu: 2, ramGb: 4, storageGb: 80, bandwidthTb: 4, monthlyUsdMinor: 1700, featured: true },
  { id: 'vps-4', name: 'VPS 4', vcpu: 4, ramGb: 8, storageGb: 160, bandwidthTb: 8, monthlyUsdMinor: 3200 },
  { id: 'vps-8', name: 'VPS 8', vcpu: 8, ramGb: 16, storageGb: 320, bandwidthTb: 16, monthlyUsdMinor: 6100 },
];

/**
 * Included with every server. None of it is a claim written to fill out a card: each line is a
 * field the Configure step makes you fill in before the order can be placed.
 */
const VPS_INCLUDED = ['Full root access', 'Choice of operating system', 'Your own nameservers'];

/** The VPS page's cards, derived from the rows above so a server is specified in one place. */
export const VPS_OFFERS: Offer[] = VPS.map((v) => ({
  id: v.id,
  name: v.name,
  monthlyUsdMinor: v.monthlyUsdMinor,
  featured: v.featured,
  specs: [
    `${v.vcpu} vCPU`,
    `${v.ramGb} GB RAM`,
    `${v.storageGb} GB storage`,
    `${v.bandwidthTb} TB bandwidth`,
  ],
  extras: VPS_INCLUDED,
}));

/** Spec 6.3: the OS choice that goes with a VPS order. */
export const VPS_OS = ['Ubuntu 24.04 LTS', 'Debian 12', 'AlmaLinux 9', 'Rocky Linux 9', 'Windows Server 2022'];

export const OFFERS: Partial<Record<Family, Offer[]>> = {
  wordpress: WORDPRESS,
  cloud: CLOUD,
  email: EMAIL,
  vps: VPS_OFFERS,
  monitoring: MONITORING,
  ssl: SSL,
  builder: BUILDER,
};
