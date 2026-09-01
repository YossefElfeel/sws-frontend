import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Locale = 'ar' | 'en';

/**
 * Arabic and English are the two directions the layout has to survive. French and German
 * are content additions on a structure this pair settles; German still governs width, since
 * it runs about 30% longer than English and is what breaks a button first.
 */
const DIRECTION: Record<Locale, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' };

/**
 * A piece of content written in both languages and carried with its data rather than looked
 * up by key. Used for fixtures a person authored — ticket text, their own name — where the
 * pair belongs beside the record it describes, not in a table five hundred lines away.
 */
export type Bi = { ar: string; en: string };

interface LocaleValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (next: Locale) => void;
  t: (key: StringKey) => string;
  /** Read a bilingual value in the current language. */
  bi: (value: Bi) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ar');

  const value = useMemo<LocaleValue>(() => {
    const dir = DIRECTION[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    const t = (key: StringKey) => {
      const entry = STRINGS[key];
      if (!entry) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
        return key;
      }
      return entry[locale];
    };
    const bi = (value: Bi) => value[locale];
    return { locale, dir, setLocale, t, bi };
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
  'action.back': { ar: 'رجوع', en: 'Back' },
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
  'cart.vat': { ar: 'ضريبة القيمة المضافة 14%', en: 'VAT 14%' },
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
  'pay.bank': { ar: 'تحويل بنكي', en: 'Bank Transfer' },
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

  'theme.light': { ar: 'الوضع الفاتح', en: 'Light mode' },
  'theme.dark': { ar: 'الوضع الليلي', en: 'Dark mode' },
  'currency.label': { ar: 'العملة', en: 'Currency' },

  'plan.featured': { ar: 'الأكثر طلبًا', en: 'Featured' },
  'plan.additional': { ar: 'مزايا إضافية', en: 'Additional Features' },
  'plan.orderNow': { ar: 'اطلب الآن', en: 'Order Now' },
  'plan.websites': { ar: 'مواقع', en: 'Websites Hosting' },
  'plan.website': { ar: 'موقع واحد', en: '1 Website Hosting' },
  'plan.websitesDual': { ar: 'موقعان', en: '2 Websites Hosting' },
  'plan.storage': { ar: 'تخزين SSD', en: 'Storage SSD' },
  'plan.bandwidth': { ar: 'باندويدث', en: 'Bandwidth' },
  'plan.subdomains': { ar: 'نطاقات فرعية', en: 'Subdomains' },
  'plan.email': { ar: 'حسابات بريد', en: 'Email Accounts' },
  'plan.freeDomain': { ar: 'دومين مجاني السنة الأولى', en: 'Free Domain for the first year' },
  'plan.unlimited': { ar: 'غير محدود', en: 'Unlimited' },

  'cycle.quarterly': { ar: 'ربع سنوي', en: 'Quarterly' },
  'cycle.semiannually': { ar: 'نصف سنوي', en: 'Semi-Annually' },
  'cycle.biennially': { ar: 'كل سنتين', en: 'Biennially' },
  'cycle.triennially': { ar: 'كل 3 سنوات', en: 'Triennially' },
  'cycle.chooseTitle': { ar: 'اختر دورة الفوترة', en: 'Choose Billing Cycle' },
  'cycle.saveX': { ar: 'وفّر', en: 'Save' },

  'configure.title': { ar: 'تهيئة المنتج', en: 'Configure' },
  'configure.summary': { ar: 'ملخص التهيئة', en: 'Configuration Summary' },
  'configure.addons': { ar: 'الإضافات المتاحة', en: 'Available Addons' },
  'configure.totalDue': { ar: 'الإجمالي المستحق اليوم', en: 'Total Due Today' },
  'configure.free': { ar: 'مجانًا', en: 'FREE' },
  'configure.none': { ar: 'بدون', en: 'None' },

  'addon.ssl.title': { ar: 'احمِ موقعك بشهادة SSL', en: 'Protect your site with SSL' },
  'addon.ssl.body': {
    ar: 'شهادة SSL بتدي زوارك ثقة إن الموقع آمن ومشفّر.',
    en: 'Add SSL to your web hosting to give visitors confidence that your site is safe and secure.',
  },
  'addon.builder.title': { ar: 'منشئ مواقع قوي', en: 'Powerful Website Builder' },
  'addon.builder.body': {
    ar: 'منشئ مواقع بالسحب والإفلات لبناء موقع أو متجر أو مدونة.',
    en: 'Drag and drop website builder to create a website, store or blog.',
  },
  'addon.monitoring.title': { ar: 'مراقبة 360', en: '360 Monitoring' },
  'addon.monitoring.body': {
    ar: 'مراقبة شاملة للخوادم والمواقع مع تنبيهات فورية.',
    en: 'Reliable and comprehensive solution for multi-server and multi-site monitoring.',
  },

  'domainstep.title': { ar: 'اختر دومين', en: 'Choose a Domain' },
  'domainstep.selected': { ar: 'المنتج المختار', en: 'Selected Product' },
  'domainstep.fromCart': { ar: 'دومين من السلة', en: 'Domain From Cart' },
  'domainstep.fromCartBody': { ar: 'استخدم دومين موجود في سلتك.', en: 'Use a domain already in my shopping cart.' },
  'domainstep.register': { ar: 'تسجيل دومين جديد', en: 'Register a New Domain' },
  'domainstep.registerBody': { ar: 'اكتب الدومين اللي عايز تسجله ونتأكد من توفره.', en: 'Type the domain you wish to register below to check availability.' },
  'domainstep.transfer': { ar: 'نقل دومين', en: 'Transfer Domain' },
  'domainstep.transferBody': { ar: 'انقل دومينك من مسجّل آخر.', en: 'Transfer your domain from another registrar.' },
  'domainstep.own': { ar: 'استخدام دومين حالي', en: 'Use Own Domain' },
  'domainstep.ownBody': { ar: 'هستخدم دوميني الحالي وأحدّث الـnameservers.', en: 'I will use my existing domain and update my nameservers.' },
  'domainstep.required': { ar: 'مطلوب', en: 'Required' },
  'domainstep.available': { ar: 'متاح', en: 'is available' },
  'domainstep.unavailable': { ar: 'غير متاح', en: 'is not available' },
  'domainstep.popular': { ar: 'الأكثر شيوعًا', en: 'Most Popular' },
  'domainstep.selectedCount': { ar: 'دومين مختار', en: 'domain(s) selected' },
  'domainstep.use': { ar: 'استخدم', en: 'Use' },

  'domainsconf.title': { ar: 'إعدادات الدومين', en: 'Domains Configuration' },
  'domainsconf.hasHosting': { ar: 'مرتبط باستضافة', en: 'Has Hosting' },
  'domainsconf.dns': { ar: 'إدارة DNS', en: 'DNS Management' },
  'domainsconf.id': { ar: 'حماية بيانات المالك', en: 'ID Protection' },
  'domainsconf.forwarding': { ar: 'تحويل البريد', en: 'Email Forwarding' },

  'cart.promo': { ar: 'كود الخصم', en: 'Promotion' },
  'cart.promoPlaceholder': { ar: 'اكتب كود الخصم لو عندك', en: 'Enter promo code if you have one' },
  'cart.promoApply': { ar: 'تطبيق', en: 'Validate Code' },
  'cart.promoOk': { ar: 'الكود اتطبق.', en: 'Code applied.' },
  'cart.promoBad': { ar: 'الكود ده مش صحيح.', en: 'That code is not valid.' },
  'cart.discount': { ar: 'الخصم', en: 'Discount' },
  'cart.continueShopping': { ar: 'متابعة التسوق', en: 'Continue Shopping' },
  'cart.review': { ar: 'المراجعة والدفع', en: 'Review & Checkout' },
  'cart.placeOrder': { ar: 'تأكيد الطلب', en: 'Place Order' },
  'cart.terms': { ar: 'قرأت ووافقت على شروط الخدمة', en: 'I have read and agree to the Terms of Service' },

  'pay.stripeCard': { ar: 'بطاقة (Stripe)', en: 'Stripe (Card)' },
  'pay.stripeEu': { ar: 'Twint و Klarna', en: 'Stripe (Twint & Klarna)' },
  'pay.wallet': { ar: 'بطاقة ومحفظة إلكترونية (جنيه فقط)', en: 'Card & Mobile Wallet (EGP Only)' },
  'pay.walletNote': { ar: 'متاحة لما تكون العملة المختارة الجنيه المصري.', en: 'Shown when the selected currency is EGP.' },
  'pay.cardNumber': { ar: 'رقم البطاقة', en: 'Card Number' },
  'pay.expiry': { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
  'pay.cvv': { ar: 'CVV / CVC2', en: 'CVV/CVC2' },
  'pay.details': { ar: 'بيانات الدفع', en: 'Payment Details' },
  'pay.secure': { ar: 'ادفع بأمان', en: 'Pay securely with Link' },

  'rail.categories': { ar: 'الفئات', en: 'Categories' },
  'rail.actions': { ar: 'إجراءات', en: 'Actions' },
  'rail.renew': { ar: 'تجديد دومين', en: 'Renew Domains' },
  'rail.register': { ar: 'تسجيل دومين جديد', en: 'Register a New Domain' },
  'rail.transfer': { ar: 'نقل دومين', en: 'Transfer in a Domain' },
  'rail.viewCart': { ar: 'عرض السلة', en: 'View Cart' },

  'fam.shared': { ar: 'استضافة مشتركة (cPanel)', en: 'Shared Hosting (cPanel)' },
  'fam.shared.lede': { ar: 'أربع باقات على cPanel، وسعر التجديد مكتوب على كل واحدة.', en: 'Four cPanel plans, each carrying its renewal price on the card.' },
  'fam.wordpress': { ar: 'استضافة ووردبريس (cPanel)', en: 'WordPress Hosting (cPanel)' },
  'fam.wordpress.lede': { ar: 'ووردبريس مضبوط من الأول: تحديثات تلقائية ونسخة تجريبية وكاش.', en: 'WordPress tuned from the start: automatic updates, a staging site and caching.' },
  'fam.cloud': { ar: 'استضافة سحابية (cPanel)', en: 'Cloud Hosting (cPanel)' },
  'fam.cloud.lede': { ar: 'موارد معزولة على NVMe، مع cPanel ونسخ احتياطي يومي.', en: 'Isolated NVMe resources, with cPanel and daily backups.' },
  'fam.email': { ar: 'استضافة بريد', en: 'Email Hosting' },
  'fam.email.lede': { ar: 'صناديق بريد بمساحة واضحة، وفلترة سبام وفحص فيروسات.', en: 'Mailboxes with a stated size, spam filtering and antivirus scanning.' },
  'fam.vps': { ar: 'خوادم VPS', en: 'VPS Hosting' },
  'fam.vps.lede': { ar: 'مقارنة مباشرة بالمواصفات، مع اختيار نظام التشغيل.', en: 'A direct comparison by specification, with an operating system to choose.' },
  'fam.monitoring': { ar: 'مراقبة المواقع والخوادم', en: 'Site & Server Monitoring' },
  'fam.monitoring.lede': { ar: 'مراقبة مستمرة، وتنبيهات بالبريد والرسائل.', en: 'Continuous monitoring, with email and SMS alerts.' },
  'fam.ssl': { ar: 'شهادات SSL', en: 'SSL Certificates' },
  'fam.ssl.lede': { ar: 'شهادات حسب نوع التحقق: DV و OV و Wildcard.', en: 'Certificates by validation type: DV, OV and Wildcard.' },
  'fam.builder': { ar: 'منشئ المواقع', en: 'Website Builder' },
  'fam.builder.lede': { ar: 'ابنِ موقعك بالسحب والإفلات — جرّبه قبل ما تشتري.', en: 'Build your site by dragging and dropping — try it before you buy.' },

  'ssl.mostOrdered': { ar: 'الأكثر طلبًا', en: 'Most ordered' },
  'vps.os': { ar: 'نظام التشغيل', en: 'Operating system' },
  'vps.compare': { ar: 'مقارنة الخوادم', en: 'Compare servers' },
  'vps.cpu': { ar: 'المعالج', en: 'vCPU' },
  'vps.ram': { ar: 'الذاكرة', en: 'RAM' },
  'vps.disk': { ar: 'التخزين', en: 'Storage' },
  'vps.bw': { ar: 'نقل البيانات', en: 'Bandwidth' },
  'builder.try': { ar: 'جرّبه مجانًا', en: 'Start a free trial' },
  'builder.preview': { ar: 'معاينة القوالب', en: 'Template preview' },
  'builder.previewNote': { ar: 'اختر قالبًا لمعاينته. مجموعة القوالب الحقيقية تُضاف مع اختيار المنتج.', en: 'Pick a template to preview it. The real template set arrives with the product decision.' },
  'monitoring.alerts': { ar: 'إزاي التنبيهات توصلك', en: 'How alerts reach you' },
  'monitoring.alertsBody': { ar: 'تنبيه التوقف بالبريد فورًا، ورسالة نصية في الخطط المدفوعة، وويب هوك في الخطة الأعلى.', en: 'Downtime alerts by email immediately, SMS on the paid plans, and a webhook on the top plan.' },
  'transfer.title': { ar: 'نقل دومين', en: 'Transfer a domain' },
  'transfer.lede': { ar: 'انقل دومينك لسوميون. النقل بيضيف سنة على تاريخ الانتهاء الحالي.', en: 'Move your domain to Somion. A transfer adds a year to the current expiry date.' },
  'transfer.epp': { ar: 'كود النقل (EPP)', en: 'Authorisation code (EPP)' },
  'transfer.start': { ar: 'ابدأ النقل', en: 'Start transfer' },
  'transfer.req': { ar: 'قبل ما تبدأ', en: 'Before you start' },
  'transfer.req1': { ar: 'الدومين مسجَّل من أكثر من 60 يومًا.', en: 'The domain was registered more than 60 days ago.' },
  'transfer.req2': { ar: 'قفل المُسجِّل متوقف.', en: 'The registrar lock is off.' },
  'transfer.req3': { ar: 'معاك كود النقل من المُسجِّل الحالي.', en: 'You have the authorisation code from your current registrar.' },

  'auth.login': { ar: 'تسجيل الدخول', en: 'Log in' },
  'auth.loginLede': { ar: 'ادخل على لوحة حسابك.', en: 'Sign in to your account.' },
  'auth.password': { ar: 'كلمة المرور', en: 'Password' },
  'auth.remember': { ar: 'تذكّرني', en: 'Remember me' },
  'auth.forgot': { ar: 'نسيت كلمة المرور؟', en: 'Forgot your password?' },
  'auth.google': { ar: 'الدخول بحساب Google', en: 'Continue with Google' },
  'auth.noAccount': { ar: 'ملكش حساب؟', en: 'No account yet?' },
  'auth.haveAccount': { ar: 'عندك حساب؟', en: 'Already have an account?' },
  'auth.register': { ar: 'إنشاء حساب', en: 'Create an account' },
  'auth.registerLede': {
    ar: 'محتاجين البيانات دي عشان نطلع فواتيرك ونوصل لك وقت الحاجة.',
    en: 'We need these to issue your invoices and to reach you when it matters.',
  },
  'auth.or': { ar: 'أو', en: 'or' },

  // Names only assistive technology reads. Left in English they are the one part of the
  // interface that never switches language.
  'a11y.language': { ar: 'اللغة', en: 'Language' },
  'a11y.breadcrumb': { ar: 'مسار التنقل', en: 'Breadcrumb' },
  'country.eg': { ar: 'مصر', en: 'Egypt' },
  'country.ch': { ar: 'سويسرا', en: 'Switzerland' },
  'country.sa': { ar: 'السعودية', en: 'Saudi Arabia' },
  'country.ae': { ar: 'الإمارات', en: 'United Arab Emirates' },
  'country.kw': { ar: 'الكويت', en: 'Kuwait' },
  'auth.firstName': { ar: 'الاسم الأول', en: 'First name' },
  'auth.lastName': { ar: 'اسم العائلة', en: 'Last name' },
  'auth.address': { ar: 'العنوان', en: 'Address' },
  'auth.city': { ar: 'المدينة', en: 'City' },
  'auth.postcode': { ar: 'الرمز البريدي', en: 'Postcode' },
  'auth.agree': { ar: 'أوافق على الشروط وسياسة الخصوصية', en: 'I agree to the Terms and the Privacy Policy' },
  'auth.reset': { ar: 'استعادة كلمة المرور', en: 'Reset your password' },
  'auth.resetLede': { ar: 'اكتب بريدك وهنبعتلك رابط تعيين كلمة مرور جديدة.', en: 'Enter your email and we will send you a link to set a new password.' },
  'auth.resetSend': { ar: 'ابعت الرابط', en: 'Send the link' },
  'auth.resetSent': { ar: 'لو البريد ده مسجَّل عندنا، هيوصله رابط خلال دقايق.', en: 'If that address is registered, a link will arrive within a few minutes.' },
  'auth.twofa': { ar: 'التحقق بخطوتين', en: 'Two-factor authentication' },
  'auth.twofaLede': { ar: 'اكتب الكود من تطبيق المصادقة.', en: 'Enter the code from your authenticator app.' },
  'auth.code': { ar: 'الكود', en: 'Code' },
  'auth.verify': { ar: 'تحقق', en: 'Verify' },
  'auth.backup': { ar: 'استخدم كود احتياطي', en: 'Use a backup code' },

  'acc.title': { ar: 'لوحة الحساب', en: 'Client Area' },
  'acc.dashboard': { ar: 'لوحة القيادة', en: 'Dashboard' },
  'acc.services': { ar: 'خدماتي', en: 'My Services' },
  'acc.domains': { ar: 'دوماييناتي', en: 'My Domains' },
  'acc.invoices': { ar: 'الفواتير', en: 'Invoices' },
  'acc.funds': { ar: 'إضافة رصيد', en: 'Add Funds' },
  'acc.methods': { ar: 'طرق الدفع', en: 'Payment Methods' },
  'acc.tickets': { ar: 'تذاكر الدعم', en: 'Support Tickets' },
  'acc.kb': { ar: 'قاعدة المعرفة', en: 'Knowledgebase' },
  'acc.news': { ar: 'الإعلانات', en: 'Announcements' },
  'acc.affiliates': { ar: 'الأفلييت', en: 'Affiliates' },
  'acc.contacts': { ar: 'جهات الاتصال', en: 'Contacts' },
  'acc.security': { ar: 'الحساب والأمان', en: 'Account & Security' },
  'acc.portalHome': { ar: 'الرئيسية', en: 'Portal Home' },


  // ── client area chrome ────────────────────────────────────────────────────
  // The client area is an application, not another page of the site: its own shell, its own
  // navigation, and none of the marketing chrome a signed-in person has already passed.
  'app.workspace': { ar: 'حسابك', en: 'Your account' },
  'app.backToSite': { ar: 'رجوع للموقع', en: 'Back to site' },
  'app.signOut': { ar: 'تسجيل الخروج', en: 'Sign out' },
  'app.notifications': { ar: 'الإشعارات', en: 'Notifications' },
  'app.menu': { ar: 'القائمة', en: 'Menu' },
  'app.closeMenu': { ar: 'إغلاق القائمة', en: 'Close menu' },
  'app.grp.overview': { ar: 'نظرة عامة', en: 'Overview' },
  'app.grp.billing': { ar: 'الفوترة', en: 'Billing' },
  'app.grp.support': { ar: 'الدعم', en: 'Support' },
  'app.grp.account': { ar: 'الحساب', en: 'Account' },

  // ── dashboard ─────────────────────────────────────────────────────────────

  // ── client-area screens ───────────────────────────────────────────────────
  'svc.usage': { ar: 'الاستهلاك', en: 'Usage' },
  'svc.left': { ar: 'متبقّي', en: 'left' },
  'dom.registration': { ar: 'بيانات التسجيل', en: 'Registration' },
  'funds.adding': { ar: 'هتضيف', en: 'Adding' },

  // Empty states. Each says what is missing and what to do about it, because an empty screen
  // that only says "nothing here" leaves someone wondering whether it is broken.
  'empty.filter': { ar: 'جرّب فلتر تاني أو اعرض الكل.', en: 'Try another filter, or show all.' },
  'empty.services': { ar: 'مفيش خدمات في الفلتر ده', en: 'No services match this filter' },
  'empty.domains': { ar: 'لسه مافيش دومينات', en: 'No domains yet' },
  'empty.domainsNote': {
    ar: 'سجّل دومين جديد أو انقل واحد عندك دلوقتي.',
    en: 'Register a new domain, or transfer one you already own.',
  },
  'empty.methods': { ar: 'مفيش طرق دفع محفوظة', en: 'No saved payment methods' },

  'dash.needsYou': { ar: 'محتاج منك حاجة', en: 'Needs you' },
  'dash.allClear': { ar: 'مفيش حاجة مطلوبة منك', en: 'Nothing needs you' },
  'dash.allClearNote': {
    ar: 'كل الفواتير مدفوعة وكل الخدمات شغالة.',
    en: 'Every invoice is paid and every service is running.',
  },
  'dash.dueOn': { ar: 'مستحقة يوم', en: 'Due' },
  'dash.overdueBy': { ar: 'متأخرة', en: 'Overdue' },
  'dash.daysShort': { ar: 'يوم', en: 'days' },
  'dash.credit': { ar: 'رصيدك', en: 'Account credit' },
  'dash.creditNote': {
    ar: 'بيتخصم تلقائيًا من أول فاتورة جاية.',
    en: 'Applied automatically to your next invoice.',
  },
  'dash.renewals': { ar: 'تجديدات قادمة', en: 'Upcoming renewals' },
  'dash.noRenewals': { ar: 'مفيش تجديدات في الـ 60 يوم الجاية.', en: 'No renewals in the next 60 days.' },
  'dash.inDays': { ar: 'خلال', en: 'in' },
  'dash.today': { ar: 'النهارده', en: 'today' },
  'dash.tomorrow': { ar: 'بكرة', en: 'tomorrow' },
  'dash.activity': { ar: 'آخر النشاط', en: 'Recent activity' },
  'dash.quick': { ar: 'إجراءات سريعة', en: 'Quick actions' },
  'dash.viewAll': { ar: 'عرض الكل', en: 'View all' },
  'dash.noTickets': { ar: 'مفيش تذاكر مفتوحة.', en: 'No open tickets.' },
  'dash.of': { ar: 'من', en: 'of' },

  'dash.hello': { ar: 'أهلًا', en: 'Hello' },
  'dash.lede': { ar: 'دي نظرة سريعة على حسابك.', en: 'A quick look at your account.' },
  'dash.unpaid': { ar: 'فواتير غير مدفوعة', en: 'Unpaid invoices' },
  'dash.openTickets': { ar: 'تذاكر مفتوحة', en: 'Open tickets' },
  'dash.dueNote': { ar: 'عندك مستحق دلوقتي', en: 'You have an amount due:' },

  'status.active': { ar: 'يعمل', en: 'Active' },
  'status.pending': { ar: 'قيد التجهيز', en: 'Pending' },
  'status.suspended': { ar: 'موقوف', en: 'Suspended' },
  'status.cancelled': { ar: 'ملغي', en: 'Cancelled' },

  'svc.manage': { ar: 'إدارة', en: 'Manage' },
  'svc.server': { ar: 'بيانات الخادم', en: 'Server information' },
  'svc.hostname': { ar: 'اسم الخادم', en: 'Hostname' },
  'svc.ip': { ar: 'عنوان IP', en: 'IP address' },
  'svc.disk': { ar: 'المساحة المستخدمة', en: 'Disk usage' },
  'svc.bandwidth': { ar: 'نقل البيانات', en: 'Bandwidth usage' },
  'svc.cpanel': { ar: 'ادخل على cPanel', en: 'Log in to cPanel' },
  'svc.billing': { ar: 'تفاصيل الفوترة', en: 'Billing details' },
  'svc.upgrade': { ar: 'ترقية أو تخفيض', en: 'Upgrade or downgrade' },
  'svc.support': { ar: 'دعم متعلق بالخدمة', en: 'Support for this service' },
  'svc.cancel': { ar: 'طلب إلغاء', en: 'Request cancellation' },

  'dom.registered': { ar: 'تاريخ التسجيل', en: 'Registered' },
  'dom.expires': { ar: 'تاريخ الانتهاء', en: 'Expires' },
  'dom.active': { ar: 'ساري', en: 'Active' },
  'dom.expiring': { ar: 'قارب على الانتهاء', en: 'Expiring soon' },
  'dom.expired': { ar: 'منتهي', en: 'Expired' },
  'dom.renew': { ar: 'جدّد', en: 'Renew' },
  'dom.nameservers': { ar: 'خوادم الأسماء', en: 'Nameservers' },
  'dom.ns': { ar: 'خادم أسماء', en: 'Nameserver' },
  'dom.addNs': { ar: 'أضف خادم أسماء', en: 'Add a nameserver' },
  'dom.protection': { ar: 'الحماية', en: 'Protection' },
  'dom.privacy': { ar: 'خصوصية WHOIS', en: 'WHOIS privacy' },
  'dom.privacyNote': { ar: 'بتخفي بياناتك من سجل WHOIS العام.', en: 'Hides your details from the public WHOIS record.' },
  'dom.lock': { ar: 'قفل المُسجِّل', en: 'Registrar lock' },
  'dom.lockNote': { ar: 'بيمنع أي نقل للدومين من غير إذنك.', en: 'Blocks any transfer of the domain without your consent.' },
  'dom.transferOut': { ar: 'نقل الدومين لمُسجِّل آخر', en: 'Transfer to another registrar' },
  'dom.lockedNote': { ar: 'لازم تقفل قفل المُسجِّل الأول قبل ما تقدر تنقل الدومين.', en: 'Turn the registrar lock off before a transfer out is possible.' },
  'dom.dns': { ar: 'سجلات DNS', en: 'DNS records' },
  'dom.type': { ar: 'النوع', en: 'Type' },
  'dom.host': { ar: 'المضيف', en: 'Host' },
  'dom.value': { ar: 'القيمة', en: 'Value' },
  'dom.addRecord': { ar: 'أضف سجل', en: 'Add a record' },

  'inv.all': { ar: 'الكل', en: 'All' },
  'inv.paid': { ar: 'مدفوعة', en: 'Paid' },
  'inv.unpaid': { ar: 'غير مدفوعة', en: 'Unpaid' },
  'inv.overdue': { ar: 'متأخرة', en: 'Overdue' },
  'inv.cancelled': { ar: 'ملغاة', en: 'Cancelled' },
  'inv.none': { ar: 'مفيش فواتير في الحالة دي.', en: 'No invoices with that status.' },
  'inv.due': { ar: 'تاريخ الاستحقاق', en: 'Due date' },
  'inv.view': { ar: 'عرض', en: 'View' },
  'inv.description': { ar: 'البند', en: 'Description' },
  'inv.pdf': { ar: 'تحميل PDF', en: 'Download PDF' },

  'funds.lede': { ar: 'اشحن رصيد يتخصم منه أي فاتورة جاية تلقائيًا.', en: 'Top up a balance that later invoices draw on automatically.' },
  'funds.amount': { ar: 'المبلغ', en: 'Amount' },
  'funds.custom': { ar: 'مبلغ آخر', en: 'Another amount' },
  'funds.add': { ar: 'اشحن الرصيد', en: 'Add funds' },
  'funds.balance': { ar: 'الرصيد الحالي', en: 'Current balance' },
  'funds.balanceNote': { ar: 'الرصيد بيتخصم منه أول ما تتصدر فاتورة جديدة.', en: 'The balance is applied as soon as a new invoice is issued.' },

  'pm.lede': { ar: 'البطاقات المحفوظة للتجديد التلقائي.', en: 'Saved cards used for automatic renewals.' },
  'pm.primary': { ar: 'الأساسية', en: 'Primary' },
  'pm.makePrimary': { ar: 'اجعلها الأساسية', en: 'Make primary' },
  'pm.add': { ar: 'أضف بطاقة', en: 'Add a card' },

  'tkt.all': { ar: 'الكل', en: 'All' },
  'tkt.open': { ar: 'افتح تذكرة', en: 'Open Ticket' },
  'tkt.answered': { ar: 'تم الرد', en: 'Answered' },
  'tkt.closed': { ar: 'مغلقة', en: 'Closed' },
  'tkt.none': { ar: 'مفيش تذاكر.', en: 'No tickets yet.' },
  'tkt.subject': { ar: 'الموضوع', en: 'Subject' },
  'tkt.department': { ar: 'القسم', en: 'Department' },
  'tkt.priority': { ar: 'الأولوية', en: 'Priority' },
  'tkt.updated': { ar: 'آخر تحديث', en: 'Last updated' },
  'tkt.view': { ar: 'عرض', en: 'View' },
  'tkt.submit': { ar: 'إرسال تذكرة', en: 'Submit Ticket' },
  'tkt.chooseDept': { ar: 'اختر قسم الدعم', en: 'Choose a Support Department' },
  'tkt.info': { ar: 'بيانات التذكرة', en: 'Ticket Information' },
  'tkt.details': { ar: 'تفاصيل التذكرة', en: 'Ticket Details' },
  'tkt.message': { ar: 'الرسالة', en: 'Message' },
  'tkt.format': { ar: 'تنسيق', en: 'Formatting' },
  'tkt.tool0': { ar: 'عريض', en: 'Bold' },
  'tkt.tool1': { ar: 'مائل', en: 'Italic' },
  'tkt.tool2': { ar: 'عنوان', en: 'Heading' },
  'tkt.tool3': { ar: 'رابط', en: 'Link' },
  'tkt.tool4': { ar: 'قائمة نقطية', en: 'Bullet list' },
  'tkt.tool5': { ar: 'قائمة مرقّمة', en: 'Numbered list' },
  'tkt.tool6': { ar: 'كود', en: 'Code' },
  'tkt.tool7': { ar: 'اقتباس', en: 'Quote' },
  'tkt.lines': { ar: 'أسطر', en: 'Lines' },
  'tkt.words': { ar: 'كلمات', en: 'Words' },
  'tkt.attachments': { ar: 'المرفقات', en: 'Add Attachments' },
  'tkt.attachNote': { ar: 'الامتدادات المسموحة: jpg, gif, jpeg, png, txt, pdf — بحد أقصى 4 ميجابايت للملف.', en: 'Allowed: jpg, gif, jpeg, png, txt, pdf — up to 4 MB per file.' },
  'tkt.suggestions': { ar: 'مقالات قد تفيدك', en: 'Knowledgebase Suggestions' },
  'tkt.suggestionsNote': { ar: 'بنبحث في قاعدة المعرفة وانت بتكتب الموضوع.', en: 'We search the knowledgebase while you type the subject.' },
  'tkt.suggestionsEmpty': { ar: 'اكتب الموضوع وهتظهر لك اقتراحات.', en: 'Type a subject and suggestions will appear here.' },
  'tkt.send': { ar: 'إرسال', en: 'Send Message' },
  'tkt.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'tkt.reply': { ar: 'رد', en: 'Reply' },
  'tkt.close': { ar: 'إغلاق التذكرة', en: 'Close ticket' },

  'prio.low': { ar: 'منخفضة', en: 'Low' },
  'prio.medium': { ar: 'متوسطة', en: 'Medium' },
  'prio.high': { ar: 'عالية', en: 'High' },

  'dept.admin': { ar: 'الإدارة العامة', en: 'Public Administration' },
  'dept.admin.body': { ar: 'كل الاستفسارات العامة.', en: 'All general enquiries.' },
  'dept.sales': { ar: 'المبيعات والفوترة', en: 'Sales and Billing' },
  'dept.sales.body': { ar: 'أسئلة الشراء والفواتير.', en: 'Questions about purchases and billing.' },
  'dept.tech': { ar: 'الدعم الفني', en: 'Technical Support' },
  'dept.tech.body': { ar: 'فريق فني متاح 24/7.', en: 'Qualified engineers available 24/7.' },
  'dept.transfer': { ar: 'نقل المواقع', en: 'Transfer Sites' },
  'dept.transfer.body': { ar: 'عندك موقع مستضاف في مكان تاني؟ ابعت طلب نقل.', en: 'Hosting a site elsewhere? Submit a transfer request.' },

  'kb.search': { ar: 'ابحث في قاعدة المعرفة', en: 'Search the knowledgebase' },
  'kb.helpful': { ar: 'هل كانت المقالة دي مفيدة؟', en: 'Was this article helpful?' },
  'kb.thanks': { ar: 'شكرًا — رأيك بيساعدنا نحسّن المقالات.', en: 'Thank you — your answer helps us improve these articles.' },
  'kb.yes': { ar: 'نعم', en: 'Yes' },
  'kb.no': { ar: 'لا', en: 'No' },
  'kb.cat.getting-started': { ar: 'البداية', en: 'Getting started' },
  'kb.cat.domains': { ar: 'الدومينات', en: 'Domains' },
  'kb.cat.email': { ar: 'البريد', en: 'Email' },
  'kb.cat.billing': { ar: 'الفوترة', en: 'Billing' },
  'kb.a1.title': { ar: 'إزاي توجّه دومينك لاستضافتك', en: 'How to point your domain at your hosting' },
  'kb.a1.body': { ar: 'غيّر خوادم الأسماء عند المُسجِّل لـ ns1.somion.ch و ns2.somion.ch. التغيير بياخد من ساعة لـ24 ساعة عشان ينتشر.', en: 'Change the nameservers at your registrar to ns1.somion.ch and ns2.somion.ch. The change takes between one and 24 hours to propagate.' },
  'kb.a2.title': { ar: 'أول دخول على cPanel', en: 'Your first cPanel login' },
  'kb.a2.body': { ar: 'من صفحة الخدمة اضغط «ادخل على cPanel» — الدخول تلقائي من غير كلمة مرور تانية.', en: 'From the service page press "Log in to cPanel" — the sign-in is automatic and needs no second password.' },
  'kb.a3.title': { ar: 'إعداد البريد على الموبايل', en: 'Setting up email on your phone' },
  'kb.a3.body': { ar: 'استخدم IMAP على mail.somion.ch، بورت 993 مع SSL للوارد و465 للصادر.', en: 'Use IMAP on mail.somion.ch, port 993 with SSL for incoming and 465 for outgoing.' },
  'kb.a4.title': { ar: 'ليه سعر التجديد مختلف أحيانًا', en: 'Why a renewal price can differ' },
  'kb.a4.body': { ar: 'باقات الاستضافة بتتجدد بنفس السعر. الدومينات بس هي اللي سعر تجديدها ممكن يختلف عن سعر التسجيل، والرقمين معروضين جنب بعض في صفحة الدومينات.', en: 'Hosting plans renew at the same price. Only domains can renew at a different figure from registration, and both numbers are shown side by side on the domains page.' },

  'news.n1.title': { ar: 'صيانة مجدولة على zrh-web07', en: 'Scheduled maintenance on zrh-web07' },
  'news.n1.body': { ar: 'هنعمل ترقية للتخزين يوم 5 سبتمبر من 2 لـ4 فجرًا بتوقيت زيورخ. متوقع توقف أقل من 10 دقايق.', en: 'A storage upgrade runs on 5 September between 02:00 and 04:00 Zurich time. Expected downtime is under 10 minutes.' },
  'news.n2.title': { ar: 'إنستاباي بقت متاحة', en: 'InstaPay is now available' },
  'news.n2.body': { ar: 'تقدر تدفع فواتيرك بإنستاباي دلوقتي، جنب البطاقة والمحافظ والتحويل البنكي.', en: 'You can now pay invoices with InstaPay, alongside cards, wallets and bank transfer.' },

  'aff.lede': { ar: 'شارك رابطك واكسب عمولة على كل اشتراك.', en: 'Share your link and earn a commission on every signup.' },
  'aff.link': { ar: 'رابط الإحالة', en: 'Your referral link' },
  'aff.copy': { ar: 'نسخ', en: 'Copy' },
  'aff.copied': { ar: 'اتنسخ', en: 'Copied' },
  'aff.visits': { ar: 'زيارات', en: 'Visits' },
  'aff.signups': { ar: 'اشتراكات', en: 'Signups' },
  'aff.commission': { ar: 'إجمالي العمولة', en: 'Total commission' },
  'aff.balance': { ar: 'الرصيد المتاح', en: 'Available balance' },
  'aff.withdraw': { ar: 'طلب سحب', en: 'Request a withdrawal' },

  'sec.details': { ar: 'بيانات الحساب', en: 'Account details' },
  'sec.access': { ar: 'الدخول والأمان', en: 'Access and security' },
  'sec.save': { ar: 'حفظ التعديلات', en: 'Save changes' },
  'sec.newPassword': { ar: 'كلمة مرور جديدة', en: 'New password' },
  'sec.changePassword': { ar: 'غيّر كلمة المرور', en: 'Change password' },
  'sec.twofaNote': { ar: 'كود إضافي من تطبيق المصادقة عند كل دخول.', en: 'An extra code from your authenticator app at every sign-in.' },
  'sec.log': { ar: 'سجل الدخول', en: 'Login activity' },
  'sec.ip': { ar: 'عنوان IP', en: 'IP address' },
  'sec.where': { ar: 'المكان', en: 'Location' },
  'sec.ok': { ar: 'ناجح', en: 'Successful' },
  'sec.failed': { ar: 'فاشل', en: 'Failed' },

  'con.lede': { ar: 'جهات اتصال فرعية بصلاحيات محددة على حسابك.', en: 'Sub-accounts with specific permissions on your account.' },
  'con.edit': { ar: 'تعديل', en: 'Edit' },
  'con.add': { ar: 'أضف جهة اتصال', en: 'Add a contact' },
  'perm.invoices': { ar: 'الفواتير', en: 'Invoices' },
  'perm.tickets': { ar: 'التذاكر', en: 'Tickets' },
  'perm.domains': { ar: 'الدومينات', en: 'Domains' },

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
