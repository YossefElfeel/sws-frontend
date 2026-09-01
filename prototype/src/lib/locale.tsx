import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Locale = 'ar' | 'en';

/**
 * Arabic and English are the two directions the layout has to survive. French and German
 * are content additions on a structure this pair settles; German still governs width, since
 * it runs about 30% longer than English and is what breaks a button first.
 */
const DIRECTION: Record<Locale, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' };

interface LocaleValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (next: Locale) => void;
  t: (key: StringKey) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ar');

  const value = useMemo<LocaleValue>(() => {
    const dir = DIRECTION[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    return { locale, dir, setLocale, t: (key) => STRINGS[key][locale] };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}

type StringKey = keyof typeof STRINGS;

/**
 * Copy is written in each language rather than translated into it. Nothing here asserts a
 * statistic, certification, customer count, or uptime figure, because none has been verified
 * — see PRODUCT.md, "Evidence on Hand". Where a page would normally publish such a number,
 * it says something true instead.
 */
export const STRINGS = {
  'brand.tagline': { ar: 'خدمات الويب', en: 'Web Services' },

  'hero.announce': {
    ar: 'استضافة سريعة وآمنة — والتجديد بنفس السعر.',
    en: 'Fast, secure hosting — and renewal at the same price.',
  },
  'hero.title1': { ar: 'استضافة على بنية', en: 'Swiss infrastructure,' },
  'hero.title2': { ar: 'سويسرية بدعم مصري.', en: 'Egyptian support.' },
  'hero.lede': {
    ar: 'خوادم في سويسرا، ودعم بالعربي، ودفع بالمحافظ المصرية. السعر معلن بالكامل — اللي بتشوفه هو اللي بتدفعه، السنة الأولى وكل سنة بعدها.',
    en: 'Servers in Switzerland, support in Arabic, and payment with Egyptian wallets. The price is stated in full — what you see is what you pay, the first year and every year after it.',
  },
  'hero.cta': { ar: 'شوف الباقات', en: 'See the plans' },
  'hero.cta2': { ar: 'ابحث عن نطاق', en: 'Find a domain' },

  'feat.title': { ar: 'ليه سوميون', en: 'Why Somion' },
  'feat.lede': {
    ar: 'مفيش أرقام كبيرة ولا وعود عامة — دي الحاجات اللي نقدر نثبتها.',
    en: 'No headline statistics and no vague promises — these are the things we can actually show.',
  },
  'feat.infra.title': { ar: 'بنية سويسرية', en: 'Swiss infrastructure' },
  'feat.infra.body': {
    ar: 'خوادم NVMe في مراكز بيانات سويسرية، مع نسخ احتياطي يومي واستعادة بضغطة.',
    en: 'NVMe servers in Swiss data centres, with daily backups and one-click restore.',
  },
  'feat.support.title': { ar: 'دعم بالعربي', en: 'Support in Arabic' },
  'feat.support.body': {
    ar: 'فريق بيرد بالعربي والإنجليزي، وبيفهم الفرق بين مشكلة DNS ومشكلة استضافة.',
    en: 'A team that answers in Arabic and English, and knows a DNS problem from a hosting one.',
  },
  'feat.secure.title': { ar: 'شهادة SSL مجانية', en: 'Free SSL, always' },
  'feat.secure.body': {
    ar: 'شهادة على كل نطاق، بتتجدد لوحدها، من غير بند إضافي في الفاتورة.',
    en: 'A certificate on every domain, renewed automatically, with no extra line on the invoice.',
  },
  'feat.billing.title': { ar: 'فوترة واضحة', en: 'Billing you can read' },
  'feat.billing.body': {
    ar: 'الضريبة بند مستقل، وسعر التجديد مكتوب على الباقة نفسها مش في الشروط.',
    en: 'VAT is its own line, and the renewal price sits on the plan itself — not in the terms.',
  },

  'plan.recommended': { ar: 'الأكثر اختيارًا', en: 'Most chosen' },
  'plan.renewalSame': { ar: 'التجديد بنفس السعر', en: 'Renews at the same price' },
  'cycle.perMonth': { ar: 'شهر', en: 'month' },
  'cycle.perYear': { ar: 'سنة', en: 'year' },

  'brand.name': { ar: 'سوميون لخدمات الويب', en: 'Somion Web Services' },

  skip: { ar: 'تخطَّ إلى المحتوى', en: 'Skip to content' },

  'nav.hosting': { ar: 'الاستضافة', en: 'Hosting' },
  'nav.domains': { ar: 'النطاقات', en: 'Domains' },
  'nav.support': { ar: 'الدعم', en: 'Support' },
  'nav.login': { ar: 'دخول العملاء', en: 'Client login' },
  'nav.cart': { ar: 'السلة', en: 'Cart' },

  'statement.label': { ar: 'كشف حساب', en: 'Statement' },
  'statement.period': { ar: 'الفترة', en: 'Period' },
  'statement.issued': { ar: 'صدر في', en: 'Issued' },
  'statement.currency': { ar: 'العملة', en: 'Currency' },
  overprint: { ar: 'نسخة العميل', en: 'Customer copy' },

  // The two halves are set in different scripts in both locales. The position is that the
  // offer is both halves at once, and a page that says so in one language has restated the
  // claim rather than shown it.
  'offer.line1': { ar: 'استضافة على بنية سويسرية.', en: 'Swiss infrastructure.' },
  'offer.line2': { ar: 'Egyptian support and billing.', en: 'دعم ومحاسبة بالمصري.' },
  'offer.sub': {
    ar: 'كل باقة بندٌ في كشف واحد: سعر ثابت، دورة معلومة، وقسيمة تحتفظ بها.',
    en: 'Every plan is a line on one statement: a fixed price, a known cycle, and a counterfoil you keep.',
  },

  'col.item': { ar: 'البند', en: 'Item' },
  'col.resources': { ar: 'الموارد', en: 'Resources' },
  'col.term': { ar: 'الدورة', en: 'Term' },
  'col.amount': { ar: 'المبلغ', en: 'Amount' },
  'col.order': { ar: 'الطلب', en: 'Order' },

  'action.order': { ar: 'اطلب', en: 'Order' },
  'action.ordered': { ar: 'في الطلب', en: 'On order' },
  'action.counterfoil': { ar: 'الكعب', en: 'Counterfoil' },
  'action.continue': { ar: 'متابعة', en: 'Continue' },
  'action.checkout': { ar: 'إتمام الطلب', en: 'Complete order' },
  'action.remove': { ar: 'إزالة', en: 'Remove' },
  'action.search': { ar: 'ابحث', en: 'Search' },
  'action.add': { ar: 'أضف', en: 'Add' },

  'cycle.monthly': { ar: 'شهريًا', en: 'Monthly' },
  'cycle.annually': { ar: 'سنويًا', en: 'Annually' },
  'cycle.save': { ar: 'شهران مجانًا', en: 'Two months free' },

  'res.site': { ar: 'موقع واحد', en: '1 site' },
  'res.sites.dual': { ar: 'موقعان', en: '2 sites' },
  'res.sites.plural': { ar: 'مواقع', en: 'sites' },
  'res.sites.many': { ar: 'موقعًا', en: 'sites' },
  'res.storage': { ar: 'تخزين SSD', en: 'SSD storage' },
  'res.unmetered': { ar: 'غير محدود', en: 'Unmetered' },
  'res.bandwidth': { ar: 'نقل بيانات', en: 'Bandwidth' },
  'res.mail': { ar: 'صناديق بريد', en: 'Mailboxes' },
  'res.freedomain': { ar: 'نطاق مجاني السنة الأولى', en: 'Free domain, first year' },
  'res.tb': { ar: 'تيرابايت', en: 'TB' },

  'hosting.title': { ar: 'استضافة مشتركة', en: 'Shared hosting' },
  'hosting.lede': {
    ar: 'أربع باقات، وسعر التجديد مكتوب على كل واحدة منها.',
    en: 'Four plans, each carrying its renewal price on the card.',
  },

  'domain.title': { ar: 'ابحث عن نطاق', en: 'Find a domain' },
  'domain.placeholder': { ar: 'اسم النطاق', en: 'Your domain name' },
  'domain.available': { ar: 'متاح', en: 'Available' },
  'domain.taken': { ar: 'محجوز', en: 'Taken' },
  'domain.register': { ar: 'التسجيل', en: 'Register' },
  'domain.renew': { ar: 'التجديد', en: 'Renewal' },
  'domain.tldtitle': { ar: 'أسعار النطاقات', en: 'Domain pricing' },
  'domain.hint': {
    ar: 'سعر التجديد معروض جنب سعر التسجيل، لأنه الرقم اللي هتدفعه كل سنة بعد الأولى.',
    en: 'Renewal sits beside registration, because it is the figure you pay every year after the first.',
  },

  'cart.title': { ar: 'السلة', en: 'Cart' },
  'cart.empty': { ar: 'السلة فاضية.', en: 'Your cart is empty.' },
  'cart.empty.cta': { ar: 'تصفّح الباقات', en: 'Browse plans' },
  'cart.subtotal': { ar: 'المجموع قبل الضريبة', en: 'Subtotal' },
  'cart.vat': { ar: 'ضريبة القيمة المضافة ١٤٪', en: 'VAT 14%' },
  'cart.total': { ar: 'الإجمالي', en: 'Total' },
  'cart.due': { ar: 'المستحق الآن', en: 'Due now' },

  'checkout.title': { ar: 'الدفع', en: 'Checkout' },
  'checkout.billing': { ar: 'بيانات الفوترة', en: 'Billing details' },
  'checkout.method': { ar: 'طريقة الدفع', en: 'Payment method' },
  'checkout.name': { ar: 'الاسم الكامل', en: 'Full name' },
  'checkout.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'checkout.phone': { ar: 'رقم الهاتف', en: 'Phone' },
  'checkout.country': { ar: 'الدولة', en: 'Country' },
  'checkout.summary': { ar: 'ملخص الطلب', en: 'Order summary' },
  'pay.card': { ar: 'بطاقة ائتمان', en: 'Card' },
  'pay.vodafone': { ar: 'فودافون كاش', en: 'Vodafone Cash' },
  'pay.etisalat': { ar: 'اتصالات كاش', en: 'Etisalat Cash' },
  'pay.orange': { ar: 'أورنج كاش', en: 'Orange Cash' },
  'pay.wepay': { ar: 'WE Pay', en: 'WE Pay' },
  'pay.instapay': { ar: 'إنستاباي', en: 'InstaPay' },
  'pay.transfer': { ar: 'تحويل بنكي', en: 'Bank transfer' },

  'confirm.title': { ar: 'تم استلام طلبك', en: 'Order received' },
  'confirm.lede': {
    ar: 'دي نسختك من الكشف. احتفظ بالرقم — هو نفسه اللي هيظهر في لوحة حسابك وفي كل فاتورة.',
    en: 'This is your copy of the statement. Keep the number — it is the same one that appears in your account and on every invoice.',
  },
  'confirm.account': { ar: 'اذهب إلى لوحة الحساب', en: 'Go to my account' },

  'account.title': { ar: 'لوحة الحساب', en: 'Account' },
  'account.services': { ar: 'الخدمات', en: 'Services' },
  'account.invoices': { ar: 'الفواتير', en: 'Invoices' },
  'account.nextdue': { ar: 'التجديد القادم', en: 'Next renewal' },
  'account.status': { ar: 'الحالة', en: 'Status' },
  'account.active': { ar: 'يعمل', en: 'Active' },
  'account.since': { ar: 'يعمل منذ', en: 'Running for' },
  'account.days': { ar: 'يومًا', en: 'days' },
  'account.paid': { ar: 'مدفوعة', en: 'Paid' },
  'account.unpaid': { ar: 'غير مدفوعة', en: 'Unpaid' },
  'account.invoice': { ar: 'فاتورة', en: 'Invoice' },
  'account.pay': { ar: 'ادفع الآن', en: 'Pay now' },
  'account.date': { ar: 'التاريخ', en: 'Date' },

  'legal.pending': {
    ar: 'نص الصفحة دي تحت الإعداد. مش هيتنشر نص قانوني قبل جرد معالجي البيانات الفرعيين ومراجعة قانونية — نص مخترع أسوأ من صفحة فاضية.',
    en: 'This text is being prepared. No legal wording will be published before the sub-processor inventory and a legal review — invented policy language is worse than an empty page.',
  },
  'legal.processors': { ar: 'جرد معالجي البيانات', en: 'Sub-processor inventory' },
  'legal.counsel': { ar: 'المراجعة القانونية', en: 'Legal review' },
  'legal.owner': { ar: 'مالك المحتوى', en: 'Content owner' },

  'footer.privacy': { ar: 'سياسة الخصوصية', en: 'Privacy policy' },
  'footer.terms': { ar: 'الشروط والأحكام', en: 'Terms' },
  'footer.sla': { ar: 'اتفاقية مستوى الخدمة', en: 'Service level agreement' },
  'footer.refund': { ar: 'سياسة الاسترداد', en: 'Refund policy' },
  'footer.contact': { ar: 'اتصل بنا', en: 'Contact' },
  'footer.rights': {
    ar: 'سوميون لخدمات الويب · بنية سويسرية، دعم ومحاسبة مصرية.',
    en: 'Somion Web Services · Swiss infrastructure, Egyptian support and billing.',
  },
} as const;
