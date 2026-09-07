/**
 * Client-area data — spec section 9.
 *
 * Development fixtures shaped like the WHMCS payloads the spec maps in section 10, so the
 * screens can be built and reviewed before the API is wired: GetClientsProducts,
 * GetClientsDomains, GetInvoices, GetTickets, GetKBArticles, GetAnnouncements, GetAffiliates
 * and GetClientsDetails.
 */

import type { Bi } from './locale';
import type { Currency, Cycle } from './catalog';

export type ServiceStatus = 'active' | 'pending' | 'suspended' | 'cancelled';

/** What kind of thing the service is decides which shortcuts and forms its page offers. */
export type ServiceKind = 'cpanel' | 'email' | 'vps';

export interface Service {
  id: string;
  product: string;
  domain: string;
  status: ServiceStatus;
  nextDue: string;
  cycle: string;
  amountUsdMinor: number;
  since: string;
  server: string;
  ip: string;
  diskUsedGb: number;
  diskTotalGb: number;
  bandwidthUsedGb: number;
  bandwidthTotalGb: number;
  kind: ServiceKind;
  /**
   * WHMCS has no per-product auto-renew; a product is invoiced until it is cancelled. The
   * switch exists because the product owner asked for one on services as well as domains, and
   * the screen marks it as needing a developer's confirmation rather than pretending it is free.
   */
  autoRenew: boolean;
  /** A gateway id from catalog GATEWAYS, or a saved-card id from PAYMENT_METHODS_SAVED. */
  paymentMethod: string;
  /** When the usage meters were last read. */
  usageAt: string;
  /** Active add-on options as `${groupId}:${optionId}` against catalog ADDONS. */
  addons: string[];
  /** The site builder is an add-on; the edit link only makes sense once it is on. */
  builder?: boolean;
}

export const SERVICES: Service[] = [
  {
    id: 'svc-8841',
    product: 'Ultra',
    domain: 'atelier-kamal.com',
    status: 'active',
    nextDue: '2026-09-14',
    cycle: 'monthly',
    amountUsdMinor: 1000,
    since: '2026-07-14',
    server: 'ch-zrh-web07',
    ip: '185.42.118.203',
    diskUsedGb: 18.4,
    diskTotalGb: 50,
    bandwidthUsedGb: 412,
    bandwidthTotalGb: 2000,
    kind: 'cpanel',
    autoRenew: true,
    paymentMethod: 'pm1',
    usageAt: '2026-09-07 02:55',
    addons: ['monitoring:personal'],
  },
  {
    id: 'svc-6120',
    product: 'Single',
    domain: 'nadia-shafik.eg',
    status: 'active',
    nextDue: '2026-09-02',
    cycle: 'annually',
    amountUsdMinor: 5500,
    since: '2025-11-02',
    server: 'ch-zrh-web03',
    ip: '185.42.118.91',
    diskUsedGb: 3.1,
    diskTotalGb: 10,
    bandwidthUsedGb: 27,
    bandwidthTotalGb: 100,
    kind: 'cpanel',
    autoRenew: true,
    paymentMethod: 'bank',
    usageAt: '2026-09-07 02:55',
    addons: ['builder:free'],
    builder: true,
  },
  {
    id: 'svc-9033',
    product: 'Mail 25',
    domain: 'sharq-legal.com',
    status: 'pending',
    nextDue: '2026-09-18',
    cycle: 'monthly',
    amountUsdMinor: 700,
    since: '2026-08-30',
    server: 'ch-zrh-mail02',
    ip: '185.42.118.44',
    diskUsedGb: 0,
    diskTotalGb: 25,
    bandwidthUsedGb: 0,
    bandwidthTotalGb: 500,
    kind: 'email',
    autoRenew: false,
    paymentMethod: 'instapay',
    usageAt: '2026-08-30 12:00',
    addons: [],
  },
];

/** The cPanel destinations the service page links to; the transition screen names them. */
export const CPANEL_APPS: { id: string; labelKey: string }[] = [
  { id: 'email', labelKey: 'cp.email' },
  { id: 'forwarders', labelKey: 'cp.forwarders' },
  { id: 'autoresponders', labelKey: 'cp.autoresponders' },
  { id: 'files', labelKey: 'cp.files' },
  { id: 'backups', labelKey: 'cp.backups' },
  { id: 'domains', labelKey: 'cp.domains' },
  { id: 'cron', labelKey: 'cp.cron' },
  { id: 'mysql', labelKey: 'cp.mysql' },
  { id: 'phpmyadmin', labelKey: 'cp.phpmyadmin' },
  { id: 'awstats', labelKey: 'cp.awstats' },
  { id: 'webmail', labelKey: 'cp.webmail' },
  { id: 'builder', labelKey: 'cp.builder' },
];

/** The four WHOIS roles a registry keeps for a domain. */
export type ContactRole = 'registrant' | 'admin' | 'tech' | 'billing';

export interface DomainContact {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface DomainRecord {
  id: string;
  name: string;
  registered: string;
  expires: string;
  status: 'active' | 'expiring' | 'expired';
  autoRenew: boolean;
  /** WHOIS privacy and the "ID protection" add-on are the same fact shown two ways. */
  whoisPrivacy: boolean;
  registrarLock: boolean;
  nameservers: string[];
  /** Our nameservers, or the person's own. */
  useDefaultNs: boolean;
  /** A role absent here uses the account details — WHMCS "use default contact". */
  contacts: Partial<Record<ContactRole, DomainContact>>;
  privateNs: { host: string; ip: string }[];
  forwarding: { id: string; alias: string; to: string }[];
  dnsManagement: boolean;
  emailForwarding: boolean;
  eppCode: string;
}

/** Our nameservers, which a domain uses unless someone points it elsewhere. */
export const DEFAULT_NS = ['ns1.somion.ch', 'ns2.somion.ch'];

export const DOMAINS: DomainRecord[] = [
  {
    id: 'dom-1',
    name: 'atelier-kamal.com',
    registered: '2024-07-14',
    expires: '2027-07-14',
    status: 'active',
    autoRenew: true,
    whoisPrivacy: true,
    registrarLock: true,
    nameservers: DEFAULT_NS,
    useDefaultNs: true,
    contacts: {},
    privateNs: [
      { host: 'ns1.atelier-kamal.com', ip: '185.42.118.203' },
      { host: 'ns2.atelier-kamal.com', ip: '185.42.118.204' },
    ],
    forwarding: [{ id: 'f1', alias: 'hello', to: 'kamal@atelier-kamal.com' }],
    dnsManagement: true,
    emailForwarding: true,
    eppCode: 'SWS-EPP-4417',
  },
  {
    id: 'dom-2',
    name: 'nadia-shafik.eg',
    registered: '2025-11-02',
    expires: '2026-11-02',
    status: 'active',
    autoRenew: true,
    whoisPrivacy: false,
    registrarLock: true,
    nameservers: DEFAULT_NS,
    useDefaultNs: true,
    contacts: {
      admin: {
        firstName: 'Mona',
        lastName: 'Abdelrahman',
        company: '',
        email: 'mona@atelier-kamal.com',
        address1: '22 Al Nagah Street, Maadi',
        address2: '',
        city: 'Cairo',
        state: '',
        postcode: '11728',
        country: 'EG',
        phone: '+20 100 442 8817',
      },
    },
    privateNs: [],
    forwarding: [],
    dnsManagement: true,
    emailForwarding: false,
    eppCode: 'SWS-EPP-6120',
  },
  {
    id: 'dom-3',
    name: 'sharq-legal.com',
    registered: '2023-09-19',
    expires: '2026-09-19',
    status: 'expiring',
    autoRenew: false,
    whoisPrivacy: false,
    registrarLock: false,
    nameservers: ['ns1.othernic.net', 'ns2.othernic.net'],
    useDefaultNs: false,
    contacts: {},
    privateNs: [],
    forwarding: [],
    dnsManagement: false,
    emailForwarding: false,
    eppCode: 'SWS-EPP-9033',
  },
];

export type DnsType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT';
export const DNS_TYPES: DnsType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT'];

export interface DnsRecord {
  id: string;
  type: DnsType;
  host: string;
  value: string;
  ttl: number;
}

/** Spec 9.3: DNS records on the domain management page. */
export const DNS_RECORDS: DnsRecord[] = [
  { id: 'r1', type: 'A', host: '@', value: '185.42.118.203', ttl: 3600 },
  { id: 'r2', type: 'A', host: 'www', value: '185.42.118.203', ttl: 3600 },
  { id: 'r3', type: 'MX', host: '@', value: 'mail.somion.ch', ttl: 3600 },
  { id: 'r4', type: 'TXT', host: '@', value: 'v=spf1 include:somion.ch ~all', ttl: 3600 },
  { id: 'r5', type: 'CNAME', host: 'cdn', value: 'cdn.somion.ch', ttl: 1800 },
];

/** dom-3 is empty on purpose: its nameservers are elsewhere, which is the DNS page's empty state. */
export const DNS_BY_DOMAIN: Record<string, DnsRecord[]> = {
  'dom-1': DNS_RECORDS,
  'dom-2': [
    { id: 'r1', type: 'A', host: '@', value: '185.42.118.91', ttl: 3600 },
    { id: 'r2', type: 'A', host: 'www', value: '185.42.118.91', ttl: 3600 },
    { id: 'r3', type: 'MX', host: '@', value: 'mail.somion.ch', ttl: 3600 },
  ],
  'dom-3': [],
};

export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'cancelled';

/**
 * An invoice line is composed rather than written. The product name and the domain are proper
 * nouns that do not translate; the cycle is a word that does. Baking the three into one
 * English sentence would put "monthly" on an Arabic invoice with nowhere to translate it.
 */
export interface InvoiceLine {
  /** A proper noun, kept as written. */
  product?: string;
  /** A translated label — the domain and add-on lines. One of the two is set. */
  productKey?: string;
  domain?: string;
  cycle?: Cycle;
  /** The period the line pays for. */
  from?: string;
  to?: string;
  amountUsdMinor: number;
  /** Default true; the free add-on lines are not. */
  taxable?: boolean;
  /** An add-on rendered beneath the line above it. */
  sub?: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  due: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  /** Default TAX_RATE. I12 is open: seven markets, seven rates, and the line has to say which. */
  taxRate?: number;
  taxUsdMinor: number;
  /** Account credit applied when the invoice was raised. */
  creditUsdMinor?: number;
  totalUsdMinor: number;
  /** Gateway id from catalog GATEWAYS, so the name is read from the string table. */
  method?: string;
  paidOn?: string;
}

export const INVOICES: Invoice[] = [
  {
    id: 'inv-4417',
    number: 'INV-20260901-4417',
    date: '2026-09-01',
    due: '2026-09-08',
    status: 'unpaid',
    lines: [
      { product: 'Ultra', domain: 'atelier-kamal.com', cycle: 'monthly', from: '2026-09-14', to: '2026-10-13', amountUsdMinor: 1000 },
      { product: '360 Monitoring — Personal', cycle: 'monthly', from: '2026-09-14', to: '2026-10-13', amountUsdMinor: 199 },
    ],
    taxUsdMinor: 168,
    totalUsdMinor: 1367,
  },
  {
    id: 'inv-4310',
    number: 'INV-20260801-4310',
    date: '2026-08-01',
    due: '2026-08-08',
    status: 'paid',
    method: 'stripe-card',
    paidOn: '2026-08-01',
    lines: [
      { product: 'Ultra', domain: 'atelier-kamal.com', cycle: 'monthly', from: '2026-08-14', to: '2026-09-13', amountUsdMinor: 1000 },
      { product: '360 Monitoring — Personal', cycle: 'monthly', from: '2026-08-14', to: '2026-09-13', amountUsdMinor: 199 },
    ],
    taxUsdMinor: 168,
    totalUsdMinor: 1367,
  },
  /**
   * A domain renewal with two free add-ons and account credit applied — the shape the
   * competitor's reference invoice has, and the one that exercises every row the invoice
   * document can show.
   */
  {
    id: 'inv-3950',
    number: 'INV-20260714-3950',
    date: '2026-07-14',
    due: '2026-07-21',
    status: 'paid',
    method: 'stripe-card',
    paidOn: '2026-07-14',
    lines: [
      { productKey: 'inv.line.domainRenewal', domain: 'atelier-kamal.com', from: '2026-07-14', to: '2027-07-14', amountUsdMinor: 1699 },
      { productKey: 'domainsconf.dns', domain: 'atelier-kamal.com', from: '2026-07-14', to: '2027-07-14', amountUsdMinor: 0, taxable: false, sub: true },
      { productKey: 'domainsconf.id', domain: 'atelier-kamal.com', from: '2026-07-14', to: '2027-07-14', amountUsdMinor: 0, taxable: false, sub: true },
    ],
    taxUsdMinor: 238,
    creditUsdMinor: 500,
    totalUsdMinor: 1937,
  },
  {
    id: 'inv-4188',
    number: 'INV-20260701-4188',
    date: '2026-07-01',
    due: '2026-07-08',
    status: 'paid',
    method: 'instapay',
    paidOn: '2026-07-01',
    lines: [{ product: 'Ultra', domain: 'atelier-kamal.com', cycle: 'monthly', from: '2026-07-14', to: '2026-08-13', amountUsdMinor: 1000 }],
    taxUsdMinor: 140,
    totalUsdMinor: 1140,
  },
  {
    id: 'inv-4062',
    number: 'INV-20260601-4062',
    date: '2026-06-01',
    due: '2026-06-08',
    status: 'paid',
    method: 'bank',
    paidOn: '2026-06-01',
    lines: [{ product: 'Single', domain: 'nadia-shafik.eg', cycle: 'annually', from: '2026-06-02', to: '2027-06-01', amountUsdMinor: 5500 }],
    taxUsdMinor: 770,
    totalUsdMinor: 6270,
  },
];

/** Spec 9.5: departments the reference screenshot shows on the open-ticket screen. */
export const DEPARTMENTS = [
  { id: 'admin', nameKey: 'dept.admin', bodyKey: 'dept.admin.body' },
  { id: 'sales', nameKey: 'dept.sales', bodyKey: 'dept.sales.body' },
  { id: 'tech', nameKey: 'dept.tech', bodyKey: 'dept.tech.body' },
  { id: 'transfer', nameKey: 'dept.transfer', bodyKey: 'dept.transfer.body' },
];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export type TicketStatus = 'open' | 'answered' | 'closed';

export interface TicketMessage {
  id: string;
  from: 'client' | 'staff';
  /** People write to support in their own language, so the fixture carries both. */
  author: Bi;
  at: string;
  body: Bi;
  /**
   * Spec 9.5.3 asks for files on a reply, not only on the first message. A screenshot is
   * usually the second thing sent, not the first, so the names travel with the message they
   * were attached to rather than sitting in a list beside the thread.
   */
  attachments?: string[];
}

export interface Ticket {
  id: string;
  ref: string;
  subject: Bi;
  department: string;
  priority: Priority;
  status: TicketStatus;
  updated: string;
  messages: TicketMessage[];
}

export const TICKETS: Ticket[] = [
  {
    id: 'tkt-7741',
    ref: '#7741',
    subject: {
      ar: 'شهادة SSL مش بتتجدد على atelier-kamal.com',
      en: 'SSL certificate not renewing on atelier-kamal.com',
    },
    department: 'tech',
    priority: 'high',
    status: 'answered',
    updated: '2026-08-31',
    messages: [
      {
        id: 'm1',
        from: 'client',
        author: { ar: 'كمال عبدالرحمن', en: 'Kamal Abdelrahman' },
        at: '2026-08-30 14:02',
        body: {
          ar: 'الشهادة خلصت امبارح والتجديد التلقائي ما اشتغلش، والموقع بيطلع تحذير للزوار.',
          en: 'The certificate expired yesterday and the auto-renew did not fire. The site is showing a warning to visitors.',
        },
        // A screenshot is the first thing anyone sends about a browser warning, so the
        // fixture carries one — the attachment row has to be reviewable without waiting for
        // someone to attach a file by hand.
        attachments: ['ssl-warning.png'],
      },
      {
        id: 'm2',
        from: 'staff',
        author: { ar: 'دعم سوميون', en: 'Somion Support' },
        at: '2026-08-31 09:18',
        body: {
          ar: 'التجديد فشل لأن مجلد well-known. كان متحجوب بقاعدة إعادة توجيه. أصدرنا شهادة جديدة يدويًا وعدّلنا القاعدة عشان التجديد الجاي يكمل لوحده.',
          en: 'The renewal failed because the .well-known directory was blocked by a redirect rule. We have issued a new certificate manually and adjusted the rule so the next renewal completes on its own.',
        },
      },
    ],
  },
  {
    id: 'tkt-7688',
    ref: '#7688',
    subject: { ar: 'فاتورة 4310 اتدفعت مرتين', en: 'Invoice 4310 paid twice' },
    department: 'sales',
    priority: 'medium',
    status: 'closed',
    updated: '2026-08-12',
    messages: [
      {
        id: 'm1',
        from: 'client',
        author: { ar: 'كمال عبدالرحمن', en: 'Kamal Abdelrahman' },
        at: '2026-08-11 17:40',
        body: {
          ar: 'اتخصم مني مرتين على نفس الفاتورة.',
          en: 'I was charged twice for the same invoice.',
        },
      },
      {
        id: 'm2',
        from: 'staff',
        author: { ar: 'حسابات سوميون', en: 'Somion Billing' },
        at: '2026-08-12 10:05',
        body: {
          ar: 'اتأكدنا — المبلغ الزيادة اترد وهيظهر في كشف حسابك خلال 3 أيام عمل.',
          en: 'Confirmed — the duplicate charge has been refunded and should appear on your statement within three working days.',
        },
      },
    ],
  },
];

export interface Article {
  id: string;
  slug: string;
  category: string;
  titleKey: string;
  bodyKey: string;
}

export const KB_CATEGORIES = ['getting-started', 'domains', 'email', 'billing'] as const;

export const ARTICLES: Article[] = [
  { id: 'a1', slug: 'point-domain', category: 'domains', titleKey: 'kb.a1.title', bodyKey: 'kb.a1.body' },
  { id: 'a2', slug: 'cpanel-first-login', category: 'getting-started', titleKey: 'kb.a2.title', bodyKey: 'kb.a2.body' },
  { id: 'a3', slug: 'email-on-phone', category: 'email', titleKey: 'kb.a3.title', bodyKey: 'kb.a3.body' },
  { id: 'a4', slug: 'why-renewal-differs', category: 'billing', titleKey: 'kb.a4.title', bodyKey: 'kb.a4.body' },
  /*
   * One article per category made the category strip look right and left it doing nothing —
   * every filter returned the whole of its category, and "more in this category" could never
   * appear because no article ever had a sibling. Two categories carry a second article so
   * both behaviours are reviewable rather than merely present in the markup.
   */
  { id: 'a5', slug: 'transfer-a-domain', category: 'domains', titleKey: 'kb.a5.title', bodyKey: 'kb.a5.body' },
  { id: 'a6', slug: 'read-your-invoice', category: 'billing', titleKey: 'kb.a6.title', bodyKey: 'kb.a6.body' },
];

export interface Announcement {
  id: string;
  date: string;
  titleKey: string;
  bodyKey: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'n1', date: '2026-08-28', titleKey: 'news.n1.title', bodyKey: 'news.n1.body' },
  { id: 'n2', date: '2026-08-05', titleKey: 'news.n2.title', bodyKey: 'news.n2.body' },
];

/** Spec 9.6. */
export const AFFILIATE = {
  link: 'https://sws.somion.ch/?aff=8841',
  visits: 1284,
  signups: 37,
  commissionUsdMinor: 41250,
  paidUsdMinor: 28000,
  balanceUsdMinor: 13250,
};

/** Spec 9.7 login activity log. */
export const LOGIN_LOG = [
  { id: 'l1', at: '2026-09-01 08:12', ip: '156.209.44.18', where: { ar: 'القاهرة، مصر', en: 'Cairo, EG' }, ok: true },
  { id: 'l2', at: '2026-08-29 21:47', ip: '156.209.44.18', where: { ar: 'القاهرة، مصر', en: 'Cairo, EG' }, ok: true },
  { id: 'l3', at: '2026-08-27 03:11', ip: '45.132.192.7', where: { ar: 'غير معروف', en: 'Unknown' }, ok: false },
];

/**
 * Spec 9.7 sub-accounts with specific permissions. The list is the whole vocabulary — a
 * contact can hold any subset of it and nothing outside it, which is what the editor on the
 * contacts screen enumerates.
 */
export const PERMISSIONS = ['invoices', 'tickets', 'domains'] as const;
export type Permission = (typeof PERMISSIONS)[number];

export interface Contact {
  id: string;
  name: Bi;
  email: string;
  permissions: string[];
}

export const CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: { ar: 'منى عبدالرحمن', en: 'Mona Abdelrahman' },
    email: 'mona@atelier-kamal.com',
    permissions: ['invoices', 'tickets'],
  },
  {
    id: 'c2',
    name: { ar: 'طارق فؤاد', en: 'Tarek Fouad' },
    email: 'tarek@atelier-kamal.com',
    permissions: ['tickets'],
  },
];

export interface Account {
  name: Bi;
  company?: Bi;
  email: string;
  phone: string;
  address: Bi;
  city: Bi;
  postcode: string;
  country: string;
  /** The currency the account is billed in. Fixed once money has moved — see BILLING_LOCKED. */
  currency: Currency;
  twoFactor: boolean;
  creditUsdMinor: number;
}

export const ACCOUNT: Account = {
  name: { ar: 'كمال عبدالرحمن', en: 'Kamal Abdelrahman' },
  company: { ar: 'أتيليه كمال', en: 'Atelier Kamal' },
  email: 'kamal@atelier-kamal.com',
  phone: '+20 100 442 8817',
  address: { ar: '22 شارع النجاح، المعادي', en: '22 Al Nagah Street, Maadi' },
  city: { ar: 'القاهرة', en: 'Cairo' },
  postcode: '11728',
  country: 'EG',
  currency: 'USD',
  twoFactor: false,
  // The May top-up less what the July domain renewal drew on.
  creditUsdMinor: 1500,
};

/**
 * The issuer block on an invoice. Name and country only: no street address or registration
 * number has been supplied and none is invented (PRODUCT.md). The tax ID is a marked slot
 * until I12 closes.
 */
export const COMPANY = {
  name: 'Somion Web Services AG',
  countryKey: 'dc.ch',
  taxId: null as string | null,
};

/**
 * Spec 9.7 two-factor enrolment. The real secret is minted per account by the server and
 * shown once; these stand in for it so the enrolment screen can be reviewed. They live here
 * rather than inside the screen so that the day they come from an API, one file changes.
 */
export const TWOFA_SECRET = 'JBSW Y3DP EHPK 3PXP';

export const BACKUP_CODES = [
  '4KQ2-90XF',
  'R7TD-1M8V',
  'B3NC-64WH',
  'Z8YL-27JQ',
  'P5GS-83KD',
  'M2VR-49TB',
];

/** Spec 9.4: saved payment methods. */
export const PAYMENT_METHODS_SAVED = [
  { id: 'pm1', kind: 'Visa', last4: '4242', expiry: '09/29', primary: true },
  { id: 'pm2', kind: 'Mastercard', last4: '8117', expiry: '02/28', primary: false },
];

/* ── transactions — spec 9.4, C-20 ──────────────────────────────────────────── */

export type TxnKind = 'payment' | 'refund' | 'credit';

export interface Txn {
  id: string;
  at: string;
  kind: TxnKind;
  /** Which invoice it settled, when it settled one. */
  invoice?: string;
  gateway: string;
  reference: string;
  /** Signed: money in is positive, money out of the account is negative. */
  amountUsdMinor: number;
}

/**
 * Every row settles against the invoice it names, so an invoice's ledger is a filter over this
 * list and its balance is arithmetic — the duplicate charge and its refund on 4310 are the
 * ones ticket #7688 describes.
 */
export const TRANSACTIONS: Txn[] = [
  {
    id: 'txn-5520',
    at: '2026-08-12',
    kind: 'refund',
    invoice: 'INV-20260801-4310',
    gateway: 'stripe-card',
    reference: 're_3PmE1KD7pM',
    amountUsdMinor: -1367,
  },
  {
    id: 'txn-5513',
    at: '2026-08-11',
    kind: 'payment',
    invoice: 'INV-20260801-4310',
    gateway: 'stripe-card',
    reference: 'ch_3PmD9LB8xZ',
    amountUsdMinor: 1367,
  },
  {
    id: 'txn-5512',
    at: '2026-08-01',
    kind: 'payment',
    invoice: 'INV-20260801-4310',
    gateway: 'stripe-card',
    reference: 'ch_3PkQ2LB8xY',
    amountUsdMinor: 1367,
  },
  {
    id: 'txn-5411',
    at: '2026-07-14',
    kind: 'payment',
    invoice: 'INV-20260714-3950',
    gateway: 'stripe-card',
    reference: 'ch_3PdR7XE2mK',
    amountUsdMinor: 1437,
  },
  {
    id: 'txn-5410',
    at: '2026-07-14',
    kind: 'credit',
    invoice: 'INV-20260714-3950',
    gateway: 'credit',
    reference: 'CR-3950',
    amountUsdMinor: 500,
  },
  {
    id: 'txn-5390',
    at: '2026-07-01',
    kind: 'payment',
    invoice: 'INV-20260701-4188',
    gateway: 'instapay',
    reference: 'IPN-771902',
    amountUsdMinor: 1140,
  },
  {
    id: 'txn-5288',
    at: '2026-06-01',
    kind: 'payment',
    invoice: 'INV-20260601-4062',
    gateway: 'bank',
    reference: 'TRF-98877',
    amountUsdMinor: 6270,
  },
  {
    id: 'txn-5150',
    at: '2026-05-03',
    kind: 'credit',
    gateway: 'bank',
    reference: 'TRF-99013',
    amountUsdMinor: 2000,
  },
];

/** The rows that settled one invoice. */
export function invoiceLedger(inv: Invoice): Txn[] {
  return TRANSACTIONS.filter((x) => x.invoice === inv.number);
}

/**
 * total − credit applied − (payments + refunds). A credit row in the ledger is the same money
 * as creditUsdMinor shown a second way, so it is not counted twice.
 */
export function invoiceBalanceUsdMinor(inv: Invoice): number {
  const settled = invoiceLedger(inv)
    .filter((x) => x.kind !== 'credit')
    .reduce((s, x) => s + x.amountUsdMinor, 0);
  return Math.max(0, inv.totalUsdMinor - (inv.creditUsdMinor ?? 0) - settled);
}

/**
 * The client-area currency locks once money has actually moved: an account that has paid in
 * one currency cannot be re-priced in another from a menu. Switching it is a Sales conversation.
 */
export const BILLING_LOCKED = TRANSACTIONS.some((x) => x.kind === 'payment');

/* ── a failed charge — spec 9.4, C-21 ───────────────────────────────────────── */

/**
 * What the gateway said, kept separate from what we tell the customer. "Card declined" is the
 * only thing an issuer will say; the useful part is what to do next, which depends on why.
 */
export const FAILED_PAYMENT = {
  invoiceId: 'inv-4417',
  invoiceNumber: 'INV-20260901-4417',
  at: '2026-09-01',
  gateway: 'stripe-card',
  last4: '4242',
  /** Maps to a fail.* string, so the advice differs by cause. */
  reason: 'insufficient_funds' as 'insufficient_funds' | 'expired_card' | 'declined' | 'network',
  attempt: 1,
  maxAttempts: 3,
  nextAttempt: '2026-09-04',
  suspendsOn: '2026-09-15',
};

/* ── notifications — spec 9.1, C-35 and C-36 ────────────────────────────────── */

export type NotifKind = 'billing' | 'service' | 'ticket' | 'news';

export interface Notif {
  id: string;
  kind: NotifKind;
  titleKey: string;
  at: string;
  to: string;
  read: boolean;
}

export const NOTIFICATIONS: Notif[] = [
  {
    id: 'n-9',
    kind: 'billing',
    titleKey: 'notif.invoiceDue',
    at: '2026-09-01',
    to: '/account/invoices/inv-4417',
    read: false,
  },
  {
    id: 'n-8',
    kind: 'ticket',
    titleKey: 'notif.ticketReplied',
    at: '2026-08-31',
    to: '/account/tickets/tkt-7741',
    read: false,
  },
  {
    id: 'n-7',
    kind: 'service',
    titleKey: 'notif.renewalSoon',
    at: '2026-08-30',
    to: '/account/services/svc-6120',
    read: true,
  },
  {
    id: 'n-6',
    kind: 'news',
    titleKey: 'notif.maintenance',
    at: '2026-08-28',
    to: '/account/announcements',
    read: true,
  },
];

/** Spec 9.7: each channel is a separate consent, so each is a separate switch. */
export interface NotifPref {
  id: NotifKind;
  labelKey: string;
  noteKey: string;
  email: boolean;
  sms: boolean;
  inApp: boolean;
  /** Billing notices are not optional — you cannot turn off being told you owe money. */
  required?: boolean;
}

export const NOTIF_PREFS: NotifPref[] = [
  {
    id: 'billing',
    labelKey: 'notif.pref.billing',
    noteKey: 'notif.pref.billingNote',
    email: true,
    sms: true,
    inApp: true,
    required: true,
  },
  {
    id: 'service',
    labelKey: 'notif.pref.service',
    noteKey: 'notif.pref.serviceNote',
    email: true,
    sms: false,
    inApp: true,
  },
  {
    id: 'ticket',
    labelKey: 'notif.pref.ticket',
    noteKey: 'notif.pref.ticketNote',
    email: true,
    sms: false,
    inApp: true,
  },
  {
    id: 'news',
    labelKey: 'notif.pref.news',
    noteKey: 'notif.pref.newsNote',
    email: false,
    sms: false,
    inApp: true,
  },
];

/* ── cancellation — spec 9.2, C-07 ──────────────────────────────────────────── */

export const CANCEL_REASONS = [
  'cancel.reason.price',
  'cancel.reason.moving',
  'cancel.reason.unused',
  'cancel.reason.support',
  'cancel.reason.technical',
  'cancel.reason.other',
];
