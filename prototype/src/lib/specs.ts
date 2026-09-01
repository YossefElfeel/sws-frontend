import type { Locale } from './locale';

/**
 * Arabic for the short spec lines on plan cards.
 *
 * These phrases repeat across families — the same "LiteSpeed Cache" sits on six cards — so
 * they are translated once here and looked up by their English text, rather than each plan
 * carrying its own pair of keys into the string table. It keeps the product data readable as
 * product data and means adding a plan is one line, not three.
 *
 * Latin stays Latin where the term is the product's own name: cPanel, LiteSpeed, Softaculous,
 * NVMe, SSD, vCPU, RAM, IMAP. Translating those would make the page harder to read, not easier.
 * Numerals stay Latin everywhere, per ADR-0003.
 */
const AR: Record<string, string> = {
  // Sites
  '1 WordPress site': 'موقع ووردبريس واحد',
  '5 WordPress sites': '5 مواقع ووردبريس',
  'Unlimited WordPress sites': 'مواقع ووردبريس بلا حدود',
  'Unlimited subdomains': 'نطاقات فرعية بلا حدود',

  // Storage
  '15 GB SSD': '15 جيجابايت SSD',
  '40 GB SSD': '40 جيجابايت SSD',
  '100 GB SSD': '100 جيجابايت SSD',
  '60 GB NVMe': '60 جيجابايت NVMe',
  '120 GB NVMe': '120 جيجابايت NVMe',
  '240 GB NVMe': '240 جيجابايت NVMe',

  // Memory and processor
  '1 GB RAM': '1 جيجابايت RAM',
  '1.5 GB RAM': '1.5 جيجابايت RAM',
  '2 GB RAM': '2 جيجابايت RAM',
  '3 GB RAM': '3 جيجابايت RAM',
  '4 GB RAM': '4 جيجابايت RAM',
  '8 GB RAM': '8 جيجابايت RAM',
  '16 GB RAM': '16 جيجابايت RAM',
  '2 vCPU': '2 vCPU',
  '4 vCPU': '4 vCPU',
  '8 vCPU': '8 vCPU',

  // Transfer
  '150 GB bandwidth': '150 جيجابايت نقل بيانات',
  '2 TB bandwidth': '2 تيرابايت نقل بيانات',
  '4 TB bandwidth': '4 تيرابايت نقل بيانات',
  'Unlimited bandwidth': 'نقل بيانات بلا حدود',

  // Mail
  '5 mailboxes': '5 صناديق بريد',
  '25 mailboxes': '25 صندوق بريد',
  '100 mailboxes': '100 صندوق بريد',
  '10 GB per mailbox': '10 جيجابايت لكل صندوق',
  '25 GB per mailbox': '25 جيجابايت لكل صندوق',
  '50 GB per mailbox': '50 جيجابايت لكل صندوق',
  'Spam filtering': 'فلترة السبام',
  'Antivirus scanning': 'فحص ضد الفيروسات',
  'IMAP and POP3': 'IMAP وPOP3',
  Webmail: 'Webmail',
  'Mobile sync': 'مزامنة مع الموبايل',
  'Shared calendars': 'تقويمات مشتركة',
  Archiving: 'أرشفة الرسائل',

  // Monitoring
  '5 monitors': '5 أهداف مراقبة',
  '25 monitors': '25 هدف مراقبة',
  '100 monitors': '100 هدف مراقبة',
  '5 minute checks': 'فحص كل 5 دقائق',
  '1 minute checks': 'فحص كل دقيقة',
  '30 second checks': 'فحص كل 30 ثانية',
  'Email alerts': 'تنبيهات بالبريد',
  'Email and SMS alerts': 'تنبيهات بالبريد والرسائل',
  'Email, SMS and webhook alerts': 'تنبيهات بالبريد والرسائل وWebhook',
  '30 day history': 'سجل 30 يوم',
  '90 day history': 'سجل 90 يوم',
  '1 year history': 'سجل سنة',
  'Status page': 'صفحة الحالة',
  'Server metrics': 'قياسات الخادم',

  // WordPress and platform
  'Automatic core updates': 'تحديث تلقائي للنواة',
  'Automatic core and plugin updates': 'تحديث تلقائي للنواة والإضافات',
  'Priority updates': 'تحديثات بأولوية',
  'LiteSpeed Cache': 'LiteSpeed Cache',
  'Object cache': 'Object Cache',
  'Staging site': 'نسخة تجريبية',
  'Softaculous Installer': 'مثبّت Softaculous',
  'Cloud Linux Servers': 'خوادم Cloud Linux',
  'cPanel included': 'cPanel مشمول',
  CDN: 'CDN',

  // Backups, security, support
  'Daily backups': 'نسخ احتياطي يومي',
  'Hourly backups': 'نسخ احتياطي كل ساعة',
  'Free SSL': 'SSL مجاني',
  'Free Virus Scanner': 'فاحص فيروسات مجاني',
  'Free Immunify 360': 'Immunify 360 مجانًا',
  'Enhanced DDOS protection': 'حماية موسّعة من DDOS',
  '24/7 Support': 'دعم 24/7',
  'Free domain, first year': 'دومين مجاني أول سنة',

  // Website builder
  '1 site': 'موقع واحد',
  '5 sites': '5 مواقع',
  'SWS subdomain': 'نطاق فرعي من SWS',
  'Your own domain': 'دومينك الخاص',
  'Drag and drop editor': 'محرر بالسحب والإفلات',
  'No SWS badge': 'من غير شارة SWS',
  'Online store': 'متجر إلكتروني',
  'Mobile-ready templates': 'قوالب متجاوبة مع الموبايل',
  'Contact forms': 'نماذج تواصل',
  'Basic SEO fields': 'حقول SEO أساسية',
  'Priority support': 'دعم بأولوية',

  // SSL certificates
  'Domain Validated': 'التحقق من الدومين',
  'Organisation Validated': 'التحقق من المؤسسة',
  'Company vetted': 'التحقق من الشركة',
  'Single domain': 'دومين واحد',
  'Issued in minutes': 'يصدر خلال دقائق',
  'Issued in 1–3 days': 'يصدر خلال 1–3 أيام',
  '256-bit encryption': 'تشفير 256-bit',
  'Browser padlock': 'قفل الأمان في المتصفح',
  'Site seal': 'ختم الموقع',
  'Reissues included': 'إعادة الإصدار مشمولة',
};

/**
 * A spec line in the reader's language.
 *
 * An untranslated phrase falls back to the English rather than to a key, because a card
 * showing one English line among Arabic ones is a smaller failure than a card showing
 * `spec.wp_scale_3`. The dev warning is what gets it fixed.
 */
export function specText(en: string, locale: Locale): string {
  if (locale === 'en') return en;
  const ar = AR[en];
  if (!ar) {
    if (import.meta.env.DEV) console.warn(`[i18n] no Arabic for spec line: ${en}`);
    return en;
  }
  return ar;
}
