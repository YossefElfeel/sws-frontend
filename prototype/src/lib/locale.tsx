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
    /*
     * index.html carries the Arabic title so the first paint has one, but it stayed Arabic
     * after the switch — the browser tab is part of the page, and an English page announcing
     * itself in Arabic in the tab strip is the one bit of the translation that leaks.
     */
    document.title = t('meta.title');
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
  /* The browser tab. index.html carries the Arabic default so the first paint has a title. */
  'meta.title': {
    ar: 'SWS — استضافة سويسرية بدعم مصري',
    en: 'SWS — Swiss hosting, Egyptian support',
  },
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

  // ── plan change: C-04 to C-06 ─────────────────────────────────────────────

  // ── plan comparison: M-10 ─────────────────────────────────────────────────

  // ── registrant details: O-06 ──────────────────────────────────────────────

  // ── acting on things: what a control says once it has done something ──────
  'save.done': { ar: 'اتحفظ', en: 'Saved' },
  'save.doneNote': {
    ar: 'التغييرات اتسجّلت على حسابك.',
    en: 'Your changes have been recorded.',
  },
  'sec.pwChanged': { ar: 'كلمة المرور اتغيّرت', en: 'Password changed' },
  'con.edited': { ar: 'الجهة اتحدّثت', en: 'Contact updated' },
  'con.none': { ar: 'مفيش جهات اتصال', en: 'No contacts yet' },
  'tkt.sent': { ar: 'الرد اتبعت', en: 'Reply sent' },
  'tkt.closedTitle': { ar: 'التذكرة اتقفلت', en: 'This ticket is closed' },
  'tkt.closedNote': {
    ar: 'لو لسه محتاج حاجة، افتح تذكرة جديدة وهنربطها بدي.',
    en: 'If you still need something, open a new ticket and we will link it to this one.',
  },
  'transfer.doneTitle': { ar: 'طلب النقل اتسجّل', en: 'Transfer started' },
  'transfer.doneBody': {
    ar: 'بعتنا الطلب للجهة المسجِّلة. النقل بياخد من 5 لـ 7 أيام، وهنبعتلك أول ما يخلص.',
    en: 'We have sent the request to the registry. A transfer takes five to seven days, and we write the moment it completes.',
  },

  'inv.pdfPending': { ar: 'الـ PDF لسه مش جاهز', en: 'The PDF is not wired up yet' },
  'inv.pdfPendingNote': {
    ar: 'بيتولّد من السيرفر، وده مربوط بقرار I12 اللي لسه مفتوح. الفاتورة كاملة قدامك هنا وتقدر تطبعها.',
    en: 'It is generated server-side, which is waiting on decision I12. The full invoice is on this page and prints as it stands.',
  },
  'sso.going': { ar: 'بنفتح cPanel…', en: 'Opening cPanel…' },
  'sso.slotTag': { ar: 'واجهة cPanel', en: 'cPanel’s own interface' },
  'sso.slotLabel': { ar: 'مكان واجهة cPanel', en: 'Where cPanel appears' },
  'sso.slotNote': {
    ar: 'من هنا ورايح، الشاشة بتاعت cPanel مش بتاعتنا.',
    en: 'From here on the screen is cPanel’s, not ours.',
  },
  'funds.doneTitle': { ar: 'الرصيد اتشحن', en: 'Balance topped up' },
  'funds.doneNote': {
    ar: 'هيتخصم تلقائيًا من أول فاتورة جاية.',
    en: 'It comes off your next invoice automatically.',
  },
  'dom.epp': { ar: 'كود النقل (EPP)', en: 'Transfer code (EPP)' },
  'dom.eppNote': {
    ar: 'ادّي الكود ده للشركة اللي ناقل ليها. صالح 5 أيام.',
    en: 'Give this to the registrar you are moving to. It is valid for five days.',
  },
  // ── error pages: S-01 ─────────────────────────────────────────────────────
  'err.404.title': { ar: 'الصفحة دي مش موجودة', en: 'This page does not exist' },
  'err.404.body': {
    ar: 'يمكن اللينك قديم أو فيه حرف ناقص. جرّب تدوّر من الرئيسية.',
    en: 'The link may be old, or a letter may be missing. Try searching from the homepage.',
  },
  'err.404.act': { ar: 'روح للرئيسية', en: 'Go to the homepage' },
  'err.500.title': { ar: 'في حاجة وقعت عندنا', en: 'Something broke on our side' },
  'err.500.body': {
    ar: 'المشكلة دي مننا مش منك. اتسجّلت عندنا وفريقنا شايفها.',
    en: 'That one is ours, not yours. It has been logged and our team can see it.',
  },
  'err.500.act': { ar: 'جرّب تاني', en: 'Try again' },
  'err.500.note': {
    ar: 'لو فضلت تتكرر، شوف حالة الشبكة أو افتح تذكرة.',
    en: 'If it keeps happening, check network status or open a ticket.',
  },
  'err.403.title': { ar: 'مالكش صلاحية هنا', en: 'You cannot open this' },
  'err.403.body': {
    ar: 'الصفحة دي بتحتاج حساب أو صلاحية مش موجودة في حسابك الحالي.',
    en: 'This page needs an account, or a permission your current one does not have.',
  },
  'err.403.act': { ar: 'دخول العملاء', en: 'Sign in' },
  'err.maintenance.title': { ar: 'بنعمل صيانة', en: 'We are doing maintenance' },
  'err.maintenance.body': {
    ar: 'الجزء ده واقف مؤقتًا وراجع قريب. مواقعك وبريدك شغالين عادي.',
    en: 'This part is briefly down and will be back shortly. Your sites and mail are unaffected.',
  },
  'err.maintenance.act': { ar: 'شوف حالة الشبكة', en: 'Check network status' },

  // ── cPanel transition: S-03 ───────────────────────────────────────────────
  'sso.title': { ar: 'بنحوّلك على cPanel', en: 'Taking you to cPanel' },
  'sso.body': {
    ar: 'cPanel برنامج تاني بندخّلك عليه من غير ما تكتب باسورد. شكله مختلف عن هنا.',
    en: 'cPanel is a separate program we sign you into without a password. It looks different from here.',
  },
  'sso.n1': { ar: 'الواجهة إنجليزي ومن الشمال لليمين.', en: 'Its interface is English and left-to-right.' },
  'sso.n2': { ar: 'الشكل والخط مختلفين — ده طبيعي.', en: 'The look and the type are different — that is normal.' },
  'sso.n3': { ar: 'اقفل التبويب وارجع هنا في أي وقت.', en: 'Close the tab to come back here whenever you like.' },
  'sso.go': { ar: 'كمّل على cPanel', en: 'Continue to cPanel' },

  // ── banners: S-05 ─────────────────────────────────────────────────────────
  'sys.banners': { ar: 'لافتات النظام', en: 'System banners' },
  'sys.bannersLede': {
    ar: 'أربع درجات، كل واحدة بأرضية وحد وأيقونة — مش باللون لوحده.',
    en: 'Four severities, each with its own ground, border and icon — never colour alone.',
  },
  'sys.dismiss': { ar: 'إخفاء', en: 'Dismiss' },
  'sys.b.info': { ar: 'معلومة', en: 'Something to know' },
  'sys.b.infoBody': {
    ar: 'إنستاباي بقت متاحة كطريقة دفع.',
    en: 'InstaPay is now available as a payment method.',
  },
  'sys.b.success': { ar: 'تمّت', en: 'Done' },
  'sys.b.successBody': { ar: 'إعداداتك اتحفظت.', en: 'Your settings have been saved.' },
  'sys.b.warning': { ar: 'خد بالك', en: 'Worth a look' },
  'sys.b.warningBody': {
    ar: 'مساحتك قربت تخلص على واحدة من خدماتك.',
    en: 'One of your services is close to its storage limit.',
  },
  'sys.b.danger': { ar: 'محتاج تصرّف', en: 'Needs action' },
  'sys.b.dangerBody': {
    ar: 'عندك فاتورة متأخرة، والخدمة بتتوقف لو ما اتدفعتش.',
    en: 'An invoice is overdue, and the service stops if it stays unpaid.',
  },
  'sys.permanent': { ar: 'لافتة ما بتتقفلش', en: 'A banner you cannot close' },
  'sys.permanentBody': {
    ar: 'في إخطارات مش من حق الواحد يسكّتها، فالزرار مش بيتعرض أصلاً بدل ما يتعرض ومايشتغلش.',
    en: 'Some notices are not yours to silence, so the button is simply not offered rather than offered and inert.',
  },
  'sys.severityRule': { ar: 'ليه مش باللون بس', en: 'Why not colour alone' },
  'sys.severityRuleBody': {
    ar: 'واحد من كل اتناشر راجل ما بيفرّقش الأحمر عن الأخضر. الدرجة بتتقال بالأيقونة والحد والأرضية مع بعض، عشان تفضل مفهومة من غير اللون.',
    en: 'Around one man in twelve cannot separate red from green. Severity is carried by icon, border and ground together, so it survives without the colour.',
  },
  'sys.errors': { ar: 'صفحات الأخطاء', en: 'Error pages' },

  // ── cookie consent: S-06 ──────────────────────────────────────────────────
  'cc.title': { ar: 'الكوكيز', en: 'Cookies' },
  'cc.body': {
    ar: 'بنستخدم اللي لازم عشان الموقع يشتغل. أي حاجة تانية بإذنك.',
    en: 'We use what the site needs to work. Anything beyond that is up to you.',
  },
  'cc.essential': { ar: 'أساسية', en: 'Essential' },
  'cc.essentialNote': {
    ar: 'الدخول والسلة واللغة. من غيرها الموقع ما بيشتغلش.',
    en: 'Sign-in, cart and language. The site does not work without them.',
  },
  'cc.always': { ar: 'دايمًا', en: 'Always on' },
  'cc.analytics': { ar: 'تحليلات', en: 'Analytics' },
  'cc.analyticsNote': {
    ar: 'بتساعدنا نعرف الصفحات اللي بتقف مع الناس.',
    en: 'They tell us which pages people get stuck on.',
  },
  'cc.marketing': { ar: 'تسويق', en: 'Marketing' },
  'cc.marketingNote': {
    ar: 'إعلانات مبنية على اللي شفته.',
    en: 'Advertising based on what you have looked at.',
  },
  'cc.rejectAll': { ar: 'الأساسية بس', en: 'Essential only' },
  'cc.acceptAll': { ar: 'اقبل الكل', en: 'Accept all' },
  'cc.saveChoice': { ar: 'احفظ اختياري', en: 'Save my choice' },
  'cc.choose': { ar: 'اختار بنفسك', en: 'Choose what to allow' },
  'cc.less': { ar: 'اخفي التفاصيل', en: 'Hide the detail' },

  // ── currency switch: S-04 and I15 ─────────────────────────────────────────
  'cur.title': { ar: 'تغيير العملة', en: 'Change currency' },
  'cur.now': { ar: 'دلوقتي', en: 'Now' },
  'cur.after': { ar: 'بعد التغيير', en: 'After' },
  'cur.note': {
    ar: 'سلتك ما بتتفضّاش — بس الإجمالي هيتحسب بالعملة الجديدة.',
    en: 'Your cart is not emptied — the total is simply worked out in the new currency.',
  },
  'cur.switch': { ar: 'غيّر العملة', en: 'Change it' },
  'cur.keep': { ar: 'سيبها زي ما هي', en: 'Leave it' },

  'reg.title': { ar: 'بيانات مالك الدومين', en: 'Domain registrant' },
  'reg.lede': {
    ar: 'الجهة المسجِّلة بتطلب البيانات دي وبتتسجّل باسمك.',
    en: 'The registry requires these, and they are recorded against your name.',
  },
  'reg.who': { ar: 'مين المالك', en: 'Who owns it' },
  'reg.org': { ar: 'الشركة (اختياري)', en: 'Organisation (optional)' },
  'reg.where': { ar: 'العنوان', en: 'Address' },
  'reg.ext': { ar: 'الامتداد', en: 'Extension' },
  'reg.extra': { ar: 'مطلوب كمان لـ', en: 'Also required for' },
  'reg.aeNote': {
    ar: 'سجل الإمارات بيطلب إثبات هوية للمالك قبل التسجيل.',
    en: 'The UAE registry requires proof of identity before it will register the name.',
  },
  'reg.saNote': {
    ar: 'السجل السعودي بيطلب إثبات هوية أو سجل تجاري للمالك.',
    en: 'The Saudi registry requires an identity document or a commercial registration.',
  },
  'reg.idType': { ar: 'نوع الإثبات', en: 'Document type' },
  'reg.idPassport': { ar: 'جواز سفر', en: 'Passport' },
  'reg.idNational': { ar: 'بطاقة رقم قومي', en: 'National ID' },
  'reg.idTrade': { ar: 'سجل تجاري', en: 'Commercial registration' },
  'reg.idNumber': { ar: 'رقم الإثبات', en: 'Document number' },
  'reg.why': { ar: 'ليه بنسأل', en: 'Why we ask' },
  'reg.whyBody': {
    ar: 'البيانات دي بتروح للجهة المسجِّلة مش لينا، وبتحدد مين صاحب الدومين قانونًا.',
    en: 'These go to the registry rather than to us, and they decide who legally owns the name.',
  },

  // ── card entry: O-08 ──────────────────────────────────────────────────────
  'card.title': { ar: 'بيانات الكارت', en: 'Card details' },
  'card.details': { ar: 'الكارت', en: 'Your card' },
  'card.slotTag': { ar: 'حقول Stripe', en: 'Stripe fields' },
  'card.slotLabel': { ar: 'مكان حقول الكارت', en: 'Where the card fields render' },
  'card.slotNote': {
    ar: 'الحقول دي بتترسم جوه إطار Stripe، فمش بنرسمها هنا. اللي حوليها بس هو بتاعنا.',
    en: 'These render inside Stripe’s own frame, so we do not draw them. Only what surrounds them is ours.',
  },
  'card.save': { ar: 'احفظ الكارت', en: 'Save this card' },
  'card.saveNote': { ar: 'عشان التجديد يتم لوحده.', en: 'So renewals can pay themselves.' },
  'card.secure': {
    ar: 'رقم الكارت بيروح لـ Stripe مباشرة وما بيعدّيش علينا.',
    en: 'The card number goes straight to Stripe and never passes through us.',
  },
  'card.pay': { ar: 'ادفع', en: 'Pay' },

  // ── 3-D Secure: O-09 ──────────────────────────────────────────────────────
  'tds.title': { ar: 'تأكيد من البنك', en: 'Bank confirmation' },
  'tds.goTitle': { ar: 'بنحوّلك لبنكك', en: 'Taking you to your bank' },
  'tds.goBody': {
    ar: 'البنك هيسألك تأكيد. الصفحة دي بتاعته إحنا ما بنشوفهاش.',
    en: 'Your bank will ask you to confirm. That page is theirs, and we never see it.',
  },
  'tds.slotTag': { ar: 'صفحة البنك', en: 'Your bank’s page' },
  'tds.slotLabel': { ar: 'مكان صفحة البنك', en: 'Where the bank’s page appears' },
  'tds.slotNote': {
    ar: 'شكلها بيختلف من بنك للتاني، وما بنقدرش نغيّره.',
    en: 'It looks different at every bank, and we cannot change it.',
  },
  'tds.go': { ar: 'كمّل عند البنك', en: 'Continue at the bank' },
  'tds.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'tds.dontClose': {
    ar: 'ما تقفلش الصفحة دي لحد ما ترجع.',
    en: 'Leave this page open until you come back.',
  },
  'tds.backTitle': { ar: 'البنك أكّد', en: 'Your bank confirmed' },
  'tds.backBody': { ar: 'فاضل نسجّل الطلب.', en: 'All that is left is recording the order.' },
  'tds.finish': { ar: 'خلّص الطلب', en: 'Finish the order' },

  // ── transfer instructions: O-10 and O-11 ──────────────────────────────────
  'bank.title': { ar: 'تحويل بنكي', en: 'Bank transfer' },
  'bank.lede': {
    ar: 'حوّل المبلغ وسيب الباقي علينا.',
    en: 'Send the amount and leave the rest to us.',
  },
  'wal.title': { ar: 'إنستاباي أو محفظة', en: 'InstaPay or wallet' },
  'wal.lede': {
    ar: 'ابعت المبلغ من تطبيقك، وارفعلنا صورة الإيصال.',
    en: 'Send from your app, then upload the receipt.',
  },
  'bank.reference': { ar: 'رقم المرجع', en: 'Payment reference' },
  'bank.refWarn': {
    ar: 'من غير الرقم ده التحويل ما بيتربطش بطلبك.',
    en: 'Without this, the transfer cannot be matched to your order.',
  },
  'bank.sendTo': { ar: 'ابعت لـ', en: 'Send to' },
  'bank.beneficiary': { ar: 'اسم المستفيد', en: 'Beneficiary' },
  'bank.iban': { ar: 'الآيبان', en: 'IBAN' },
  'bank.swift': { ar: 'السويفت', en: 'SWIFT' },
  'bank.name': { ar: 'البنك', en: 'Bank' },
  'wal.name': { ar: 'الاسم', en: 'Name' },
  'wal.number': { ar: 'الرقم', en: 'Number' },
  'wal.instapay': { ar: 'عنوان إنستاباي', en: 'InstaPay address' },
  'bank.tellUs': { ar: 'قوللنا إنك حوّلت', en: 'Tell us you have sent it' },
  'bank.tellUsBody': {
    ar: 'ارفع الإيصال وهنأكّد أسرع بكتير.',
    en: 'Upload the receipt and we confirm far sooner.',
  },
  'bank.receipt': { ar: 'صورة الإيصال', en: 'Receipt' },
  'bank.confirm': { ar: 'أكّدت التحويل', en: 'I have sent it' },
  'bank.gotIt': { ar: 'وصلنا', en: 'Received' },
  'bank.gotItBody': {
    ar: 'هنراجع التحويل ونفعّل الخدمة أول ما يظهر عندنا.',
    en: 'We will check the transfer and start the service as soon as it lands.',
  },
  'bank.whenTitle': { ar: 'بيحصل إيه', en: 'What happens' },
  'bank.w1': { ar: 'الطلب اتسجّل باسمك.', en: 'The order is recorded in your name.' },
  'bank.w2': { ar: 'التحويل بياخد من يوم لتلاتة.', en: 'A transfer takes one to three days.' },
  'wal.w2': { ar: 'التحويل بيوصل عادةً في نفس اليوم.', en: 'A wallet transfer usually lands the same day.' },
  'bank.w3': { ar: 'الخدمة بتشتغل أول ما نأكّد.', en: 'The service starts the moment we confirm.' },
  'bank.hold': {
    ar: 'الأسعار محجوزة لك 7 أيام.',
    en: 'Your prices are held for seven days.',
  },

  // ── payment failure: O-13 ─────────────────────────────────────────────────
  'pf.title': { ar: 'الدفع ما تمّش', en: 'The payment did not go through' },
  'pf.kept': { ar: 'طلبك زي ما هو', en: 'Your order is untouched' },
  'pf.keptBody': { ar: 'لسه في السلة، عدد البنود:', en: 'Still in your cart, items:' },
  'pf.tryAnother': { ar: 'جرّب طريقة تانية', en: 'Try another way' },
  'pf.unchanged': { ar: 'المبلغ ما اتغيّرش.', en: 'The amount has not changed.' },
  'pf.retry': { ar: 'جرّب الكارت تاني', en: 'Try the card again' },

  // ── pending order: O-14 ───────────────────────────────────────────────────
  'pend.title': { ar: 'الطلب تحت المراجعة', en: 'Order under review' },
  'pend.heading': { ar: 'طلبك موقوف مؤقتًا للمراجعة', en: 'Your order is held for a quick check' },
  'pend.body': {
    ar: 'ده فحص أوتوماتيكي بيحصل لبعض الطلبات. مش معناه إن في مشكلة في الدفع.',
    en: 'This is an automated check that runs on some orders. It does not mean anything went wrong with the payment.',
  },
  'pend.whatNow': { ar: 'اللي بيحصل دلوقتي', en: 'What is happening' },
  'pend.s1': { ar: 'الدفع اتم بنجاح.', en: 'The payment went through.' },
  'pend.s2': { ar: 'فريقنا بيراجع الطلب — عادةً أقل من ساعتين.', en: 'Our team is reviewing it — usually under two hours.' },
  'pend.s3': { ar: 'هنبعتلك إيميل أول ما تتفعّل.', en: 'We email you the moment it is live.' },
  'pend.money': { ar: 'وفلوسك', en: 'And your money' },
  'pend.moneyBody': {
    ar: 'المبلغ اتخصم واتسجّل على حسابك. لو ما وافقناش على الطلب، بيترد بالكامل.',
    en: 'The amount has been taken and recorded against your account. If the order is not approved, it is refunded in full.',
  },
  'pend.ask': { ar: 'اسأل عن الطلب', en: 'Ask about this order' },

  // ── set a new password: A-05 ──────────────────────────────────────────────
  'pw.title': { ar: 'كلمة مرور جديدة', en: 'Set a new password' },
  'pw.lede': { ar: 'اختار واحدة تفتكرها.', en: 'Pick one you will remember.' },
  'pw.len': { ar: '10 حروف على الأقل', en: 'At least 10 characters' },
  'pw.case': { ar: 'حرف كبير وحرف صغير', en: 'An upper and a lower case letter' },
  'pw.num': { ar: 'رقم واحد على الأقل', en: 'At least one number' },
  'pw.again': { ar: 'اكتبها تاني', en: 'Type it again' },
  'pw.mismatch': { ar: 'الاتنين مش زي بعض.', en: 'These two do not match.' },
  'pw.save': { ar: 'احفظ كلمة المرور', en: 'Save the password' },
  'pw.doneTitle': { ar: 'اتغيّرت', en: 'Password changed' },
  'pw.doneLede': { ar: 'تقدر تدخل بيها دلوقتي.', en: 'You can sign in with it now.' },
  'pw.doneNote': {
    ar: 'قفلنا كل الجلسات التانية على حسابك.',
    en: 'We signed out every other session on your account.',
  },

  // ── email verification: A-06 ──────────────────────────────────────────────
  'ver.title': { ar: 'أكّد إيميلك', en: 'Confirm your email' },
  'ver.lede': { ar: 'بعتنالك لينك على:', en: 'We sent a link to:' },
  'ver.resend': { ar: 'ابعت اللينك تاني', en: 'Send the link again' },
  'ver.resent': { ar: 'اتبعت', en: 'Sent' },
  'ver.wrong': { ar: 'الإيميل غلط؟', en: 'Wrong address?' },
  'ver.spam': {
    ar: 'لو ما وصلش في دقيقتين، بص في السبام.',
    en: 'If it has not arrived in two minutes, check your spam folder.',
  },
  'ver.doneTitle': { ar: 'الإيميل اتأكّد', en: 'Email confirmed' },
  'ver.doneLede': { ar: 'حسابك جاهز.', en: 'Your account is ready.' },
  'ver.doneNote': { ar: 'كل حاجة مفتوحة دلوقتي.', en: 'Everything is available now.' },
  'ver.go': { ar: 'روح لحسابك', en: 'Go to your account' },

  // ── session expiry: A-07 ──────────────────────────────────────────────────
  'exp.title': { ar: 'الجلسة انتهت', en: 'Session expired' },
  'exp.heading': { ar: 'سجّلنا خروجك للأمان', en: 'We signed you out for safety' },
  'exp.body': {
    ar: 'عدّى وقت من غير نشاط. ادخل تاني وكمّل من نفس المكان.',
    en: 'There was a stretch with no activity. Sign in again and carry on where you were.',
  },
  'exp.kept': { ar: 'سلتك محفوظة، عدد البنود:', en: 'Your cart is saved, items:' },
  'exp.home': { ar: 'الرئيسية', en: 'Home' },

  'cmp.title': { ar: 'قارن الباقات', en: 'Compare plans' },
  'cmp.lede': {
    ar: 'الفروق الحقيقية بين الأربع باقات، من غير اللي بيتشابه فيهم.',
    en: 'The real differences between the four plans, without the parts they share.',
  },
  'cmp.feature': { ar: 'الميزة', en: 'Feature' },
  'cmp.sites': { ar: 'عدد المواقع', en: 'Websites' },
  'cmp.storage': { ar: 'المساحة', en: 'Storage' },
  'cmp.bandwidth': { ar: 'نقل البيانات', en: 'Bandwidth' },
  'cmp.subdomains': { ar: 'نطاقات فرعية', en: 'Subdomains' },
  'cmp.mailboxes': { ar: 'صناديق بريد', en: 'Mailboxes' },
  'cmp.freeDomain': { ar: 'دومين مجاني أول سنة', en: 'Free domain, first year' },
  'cmp.fairUse': { ar: 'يعني إيه «بلا حدود»', en: 'What "Unlimited" means' },
  'cmp.fairUseBody': {
    ar: 'بلا حدود معناها استخدام عادي لموقع عادي، مش موارد بلا نهاية. التفاصيل في',
    en: 'Unlimited means normal use for a normal site, not infinite resources. The detail is in the',
  },

  // ── TLD pricing: M-12 ─────────────────────────────────────────────────────
  'tld.title': { ar: 'أسعار الدومينات', en: 'Domain pricing' },
  'tld.lede': {
    ar: 'سعر التسجيل والنقل والتجديد لكل امتداد.',
    en: 'Registration, transfer and renewal for every extension.',
  },
  'tld.ext': { ar: 'الامتداد', en: 'Extension' },
  'tld.register': { ar: 'تسجيل', en: 'Register' },
  'tld.transfer': { ar: 'نقل', en: 'Transfer' },
  'tld.renew': { ar: 'تجديد', en: 'Renew' },
  'tld.popular': { ar: 'شائع', en: 'Popular' },
  'tld.jump': { ar: 'أعلى من التسجيل', en: 'higher than year one' },
  'tld.check': { ar: 'شوف متاح', en: 'Check' },
  'tld.none': { ar: 'مفيش امتداد بالاسم ده', en: 'No extension matches' },
  'tld.noneNote': { ar: 'جرّب حروف أقل.', en: 'Try fewer letters.' },
  'tld.vatNote': {
    ar: 'الأسعار من غير ضريبة القيمة المضافة، وبتتحسب على العملة اللي مختارها.',
    en: 'Prices exclude VAT and are shown in the currency you have selected.',
  },
  'rail.pricing': { ar: 'أسعار الدومينات', en: 'Domain pricing' },

  // ── product detail: M-14 ──────────────────────────────────────────────────
  'prod.lede': { ar: 'كل حاجة عن الباقة دي.', en: 'Everything about this plan.' },
  'prod.whatYouGet': { ar: 'بتاخد إيه', en: 'What you get' },
  'prod.freeDomain': { ar: 'الدومين المجاني', en: 'The free domain' },
  'prod.year1': { ar: 'السنة الأولى', en: 'First year' },
  'prod.year2': { ar: 'كل سنة بعد كده', en: 'Every year after' },
  'prod.perYear': { ar: 'سنة', en: 'year' },
  'prod.freeDomainNote': {
    ar: 'بنكتب سعر التجديد هنا عشان ما يبقاش مفاجأة بعد سنة.',
    en: 'We state the renewal price here so it is not a surprise twelve months from now.',
  },

  // ── network status: M-16 ──────────────────────────────────────────────────
  'status.title': { ar: 'حالة الشبكة', en: 'Network status' },
  'status.lede': {
    ar: 'كل نظام وحالته دلوقتي، والأعطال اللي حصلت قبل كده.',
    en: 'Every system as it stands now, and what has gone wrong before.',
  },
  'status.checked': { ar: 'بيتحدّث كل دقيقة.', en: 'Refreshed every minute.' },
  'status.systems': { ar: 'الأنظمة', en: 'Systems' },
  'status.history': { ar: 'الأعطال السابقة', en: 'Past incidents' },
  'status.minutes': { ar: 'دقيقة', en: 'minutes' },
  'status.all.operational': { ar: 'كل حاجة شغالة', en: 'All systems operational' },
  'status.all.degraded': { ar: 'في نظام بيتعب', en: 'One system is degraded' },
  'status.all.maintenance': { ar: 'في صيانة شغالة دلوقتي', en: 'Maintenance in progress' },
  'status.all.down': { ar: 'في نظام واقف', en: 'A system is down' },
  'status.state.operational': { ar: 'شغال', en: 'Operational' },
  'status.state.degraded': { ar: 'بطيء', en: 'Degraded' },
  'status.state.maintenance': { ar: 'صيانة', en: 'Maintenance' },
  'status.state.down': { ar: 'واقف', en: 'Down' },
  'status.sys.web': { ar: 'استضافة المواقع', en: 'Web hosting' },
  'status.sys.mail': { ar: 'البريد', en: 'Email' },
  'status.sys.dns': { ar: 'الـ DNS', en: 'DNS' },
  'status.sys.panel': { ar: 'لوحة التحكم', en: 'Control panel' },
  'status.sys.billing': { ar: 'الفوترة والدفع', en: 'Billing and payments' },
  'status.sys.api': { ar: 'الـ API', en: 'API' },
  'status.inc3': { ar: 'صيانة مجدولة على لوحة التحكم', en: 'Scheduled control-panel maintenance' },
  'status.inc3b': {
    ar: 'ترقية تخزين على zrh-web07. المواقع والبريد ما اتأثروش.',
    en: 'A storage upgrade on zrh-web07. Sites and mail are unaffected.',
  },
  'status.inc2': { ar: 'الـ API كان بطيء', en: 'API responses were slow' },
  'status.inc2b': {
    ar: 'ضغط على قاعدة البيانات خلّى الردود تتأخر. اتظبط بزيادة الاتصالات.',
    en: 'Database contention delayed responses. Resolved by raising the connection pool.',
  },
  'status.inc1': { ar: 'انقطاع قصير في الـ DNS', en: 'Brief DNS outage' },
  'status.inc1b': {
    ar: 'خطأ في إعداد اتنشر على واحد من السيرفرات وترجع تاني في 12 دقيقة.',
    en: 'A configuration error reached one resolver and was rolled back in twelve minutes.',
  },
  'status.sub': { ar: 'عايز تعرف أول بأول', en: 'Want to be told' },
  'status.subBody': {
    ar: 'شغّل إشعارات الخدمات وهنبعتلك أول ما حاجة تحصل.',
    en: 'Turn on service notifications and we will write the moment something happens.',
  },

  // ── about: M-17 ───────────────────────────────────────────────────────────
  'ab.title': { ar: 'مين إحنا', en: 'About us' },
  'ab.lede': {
    ar: 'بنية تحتية سويسرية بدعم وأسعار مصرية.',
    en: 'Swiss infrastructure with Egyptian support and pricing.',
  },
  'ab.p1': {
    ar: 'سوميون بتشغّل مواقع وبريد شركات صغيرة ومتوسطة على سيرفرات في سويسرا، وبتدعمها بفريق في مصر بيتكلم عربي ومصري وبيفهم البنوك والمحافظ اللي بتدفع بيها.',
    en: 'Somion runs the websites and mail of small and mid-sized businesses on servers in Switzerland, supported by a team in Egypt that speaks your language and understands the banks and wallets you actually pay with.',
  },
  'ab.p2': {
    ar: 'الجمع ده مقصود: القوانين والبنية اللي في سويسرا، والقرب والسعر اللي في مصر. مش بنحاول نبقى أرخص واحد، بنحاول نبقى الأوضح.',
    en: 'The combination is the point: Swiss law and Swiss infrastructure, Egyptian proximity and Egyptian pricing. We are not trying to be the cheapest. We are trying to be the clearest.',
  },
  'ab.where': { ar: 'السيرفرات فين', en: 'Where the servers are' },
  'ab.whereBody': {
    ar: 'زيورخ، سويسرا. بياناتك خاضعة للقانون السويسري.',
    en: 'Zürich, Switzerland. Your data sits under Swiss law.',
  },
  'ab.who': { ar: 'مين اللي بيرد', en: 'Who answers' },
  'ab.whoBody': {
    ar: 'فريق في القاهرة، بالعربي وبالإنجليزي، على نفس التوقيت بتاعك.',
    en: 'A team in Cairo, in Arabic and English, in your own working hours.',
  },
  'ab.how': { ar: 'بتدفع إزاي', en: 'How you pay' },
  'ab.howBody': {
    ar: 'بالجنيه أو الفرنك أو الدولار، بالكارت أو إنستاباي أو المحفظة أو التحويل.',
    en: 'In EGP, CHF or USD — by card, InstaPay, wallet or bank transfer.',
  },
  'ab.honest': { ar: 'حاجة إحنا مش بنقولها', en: 'Something we do not claim' },
  'ab.honestBody': {
    ar: 'مش هتلاقي هنا نسبة تشغيل ولا عدد عملاء ولا شهادات. الأرقام دي بتتقال لما تبقى متراجعة وموثّقة، مش عشان تملا مساحة في الصفحة.',
    en: 'You will not find an uptime percentage, a customer count or a badge wall on this page. Those get stated once they have been audited, not because a layout has room for them.',
  },

  // ── data centres: M-19 ────────────────────────────────────────────────────
  'dc.title': { ar: 'مراكز البيانات', en: 'Data centres' },
  'dc.lede': {
    ar: 'فين بالظبط بيشتغل موقعك.',
    en: 'Where your site actually runs.',
  },
  'dc.ch': { ar: 'سويسرا', en: 'Switzerland' },
  'dc.eg': { ar: 'مصر', en: 'Egypt' },
  'dc.primary': { ar: 'الأساسي', en: 'Primary' },
  'dc.power': { ar: 'الكهرباء', en: 'Power' },
  'dc.powerBody': {
    ar: 'تغذية مزدوجة ومولدات احتياطي في الموقع.',
    en: 'Dual feeds, with generators on site.',
  },
  'dc.network': { ar: 'الشبكة', en: 'Network' },
  'dc.networkBody': {
    ar: 'أكتر من مزوّد، والمرور بيتحوّل تلقائيًا لو واحد وقع.',
    en: 'More than one carrier, with traffic rerouted automatically if one drops.',
  },
  'dc.law': { ar: 'القانون', en: 'Jurisdiction' },
  'dc.lawBody': {
    ar: 'البيانات المستضافة في زيورخ خاضعة لقانون حماية البيانات السويسري.',
    en: 'Data hosted in Zürich sits under Swiss data-protection law.',
  },
  'dc.backup': { ar: 'النسخ الاحتياطي', en: 'Backups' },
  'dc.backupBody': {
    ar: 'نسخة يومية، محفوظة في مبنى تاني.',
    en: 'Taken daily, and kept in a separate building.',
  },
  'dc.pending': { ar: 'اللي لسه ما اتأكدش', en: 'Not yet stated' },
  'dc.pendingBody': {
    ar: 'تصنيف المبنى والشهادات هيتكتبوا هنا بعد ما نراجع الوثايق. مش هنكتب رقم قبل ما نشوف ورقته.',
    en: 'Facility tier and certifications will be listed here once the paperwork has been reviewed. We are not printing a number before we have seen the certificate behind it.',
  },

  // ── contact: M-18 ─────────────────────────────────────────────────────────
  'ct.title': { ar: 'كلّمنا', en: 'Contact us' },
  'ct.lede': { ar: 'أسرع طريقة أول، والفورم بعدها.', en: 'The fastest routes first, the form after.' },
  'ct.ticket': { ar: 'افتح تذكرة', en: 'Open a ticket' },
  'ct.ticketBody': { ar: 'ادخل على حسابك وافتح تذكرة — أسرع طريق للرد.', en: 'Sign in to your account and open a ticket — the quickest route to an answer.' },
  'ct.kb': { ar: 'قاعدة المعرفة', en: 'Knowledgebase' },
  'ct.kbBody': { ar: 'أغلب الأسئلة لها إجابة مكتوبة.', en: 'Most questions already have a written answer.' },
  'ct.status': { ar: 'حالة الشبكة', en: 'Network status' },
  'ct.statusBody': { ar: 'لو حاسس إن في حاجة واقفة، ابدأ من هنا.', en: 'If something feels down, start here.' },
  'ct.orWrite': { ar: 'أو اكتبلنا', en: 'Or write to us' },
  'ct.subject': { ar: 'الموضوع', en: 'Subject' },
  'ct.subj.sales': { ar: 'استفسار قبل الشراء', en: 'Before I buy' },
  'ct.subj.billing': { ar: 'فوترة', en: 'Billing' },
  'ct.subj.technical': { ar: 'مشكلة تقنية', en: 'Technical' },
  'ct.subj.migration': { ar: 'نقل موقع', en: 'Moving a site' },
  'ct.subj.other': { ar: 'حاجة تانية', en: 'Something else' },
  'ct.privacyNote': {
    ar: 'بنستخدم بياناتك للرد بس.',
    en: 'We use what you write here only to reply.',
  },
  'ct.doneTitle': { ar: 'وصلتنا', en: 'We have it' },
  'ct.doneNote': { ar: 'هنرد في خلال يوم عمل.', en: 'We will reply within one working day.' },

  // ── migration: M-15 ───────────────────────────────────────────────────────
  'mig.title': { ar: 'انقل موقعك لينا', en: 'Move your site to us' },
  'mig.lede': {
    ar: 'قوللنا الموقع عند مين دلوقتي وإحنا بننقله.',
    en: 'Tell us where the site lives now and we move it.',
  },
  'mig.currentHost': { ar: 'الاستضافة الحالية', en: 'Current host' },
  'mig.panel': { ar: 'لوحة التحكم عندهم', en: 'Their control panel' },
  'mig.size': { ar: 'حجم الموقع تقريبًا', en: 'Roughly how big' },
  'mig.sizeHint': { ar: 'مثلاً 4 جيجا', en: 'e.g. 4 GB' },
  'mig.notes': { ar: 'أي حاجة نعرفها', en: 'Anything we should know' },
  'mig.send': { ar: 'ابعت الطلب', en: 'Send the request' },
  'mig.how': { ar: 'بيحصل إزاي', en: 'How it goes' },
  'mig.s1': { ar: 'بتبعتلنا الطلب.', en: 'You send the request.' },
  'mig.s2': { ar: 'بناخد نسخة ونجهّزها عندنا.', en: 'We copy the site and stage it here.' },
  'mig.s3': { ar: 'بتغيّر الـ DNS وقت ما يناسبك.', en: 'You switch DNS whenever it suits you.' },
  'mig.downtime': {
    ar: 'الموقع القديم بيفضل شغال طول الوقت. التحويل بيحصل لما تقرر إنت.',
    en: 'The old site keeps serving the whole time. The switch happens when you decide.',
  },
  'mig.doneTitle': { ar: 'الطلب وصل', en: 'Request received' },
  'mig.doneNote': {
    ar: 'هنراجعه ونرد عليك بخطة النقل في خلال يوم عمل.',
    en: 'We will review it and come back with a migration plan within one working day.',
  },

  // ── learning centre: M-21 ─────────────────────────────────────────────────
  'blog.title': { ar: 'مركز التعلّم', en: 'Learning centre' },
  'blog.lede': {
    ar: 'شروحات قصيرة للحاجات اللي بتوقّف الناس.',
    en: 'Short guides to the things that actually hold people up.',
  },
  'blog.topics': { ar: 'المواضيع', en: 'Topics' },
  'blog.min': { ar: 'دقيقة قراية', en: 'min read' },
  'blog.more': { ar: 'اقرا كمان', en: 'Read next' },
  'blog.cat.start': { ar: 'البداية', en: 'Getting started' },
  'blog.cat.domains': { ar: 'الدومينات', en: 'Domains' },
  'blog.cat.email': { ar: 'البريد', en: 'Email' },
  'blog.cat.wordpress': { ar: 'ووردبريس', en: 'WordPress' },
  'blog.p5': { ar: 'تختار باقة إزاي من غير ما تدفع زيادة', en: 'Choosing a plan without overpaying' },
  'blog.p5l': {
    ar: 'أغلب المواقع الصغيرة محتاجة أقل بكتير مما بتفتكر.',
    en: 'Most small sites need far less than they think.',
  },
  'blog.p5b': {
    ar: 'ابدأ من عدد المواقع، بعدين المساحة، وسيب نقل البيانات آخر حاجة — هو أقل رقم بيتعدّى فعلاً. لو زوّارك أقل من عشرة آلاف في الشهر، أصغر باقة غالبًا كفاية، والترقية بتاخد دقيقة وبتتحسب بالأيام الفاضلة مش بشهر كامل.',
    en: 'Start from how many sites, then storage, and leave bandwidth last — it is the number least often exceeded. Under ten thousand visits a month the smallest plan is usually enough, and upgrading takes a minute and is charged for the days remaining rather than a whole month.',
  },
  'blog.p4': { ar: 'تنقل موقع من غير ما ينزل', en: 'Moving a site without taking it down' },
  'blog.p4l': {
    ar: 'الترتيب الصح بيخلّي وقت التوقف صفر.',
    en: 'Done in the right order, the downtime is zero.',
  },
  'blog.p4b': {
    ar: 'انسخ الموقع الأول وجهّزه على السيرفر الجديد وجرّبه بالـ IP. سيب الاستضافة القديمة شغالة. آخر خطوة بس هي تغيير الـ DNS، وساعتها الزوار بيتحوّلوا بالتدريج من غير ما حد يشوف صفحة فاضية.',
    en: 'Copy the site first, stage it on the new server and test it by IP. Leave the old host running. Only the last step changes DNS, and visitors then move across gradually without anyone meeting an empty page.',
  },
  'blog.p3': { ar: 'تختار دومين تقدر تعيش بيه', en: 'Picking a domain you can live with' },
  'blog.p3l': {
    ar: 'السعر الأول مش هو السعر.',
    en: 'The first-year price is not the price.',
  },
  'blog.p3b': {
    ar: 'امتدادات كتير بتتباع بجنيهات في السنة الأولى وبتتجدد بأضعافها. بص على عمود التجديد قبل ما تسجّل، واختار اسم تقدر تنطقه في تليفون من غير ما تتهجّاه.',
    en: 'Plenty of extensions sell for pennies in the first year and renew for many times that. Read the renewal column before you register, and pick a name you can say down a phone without spelling it.',
  },
  'blog.p2': { ar: 'بريد بيوصل فعلاً', en: 'Email that actually arrives' },
  'blog.p2l': {
    ar: 'ثلاث سجلات بيفرقوا بين الوصول والسبام.',
    en: 'Three records decide between the inbox and the spam folder.',
  },
  'blog.p2b': {
    ar: 'SPF بيقول مين مسموح له يبعت باسمك، وDKIM بيوقّع الرسالة، وDMARC بيقول للمستقبِل يعمل إيه لما حاجة ما تتطابقش. من غير التلاتة، رسايلك هتتصنّف سبام مهما كان السيرفر كويس.',
    en: 'SPF says who may send as you, DKIM signs the message, and DMARC tells the receiver what to do when something does not match. Without all three, your mail gets filed as spam no matter how good the server is.',
  },
  'blog.p1': { ar: 'ووردبريس أسرع من غير إضافات', en: 'A faster WordPress without plugins' },
  'blog.p1l': {
    ar: 'أكبر مكسب في السرعة مش من إضافة.',
    en: 'The biggest speed win does not come from a plugin.',
  },
  'blog.p1b': {
    ar: 'صوّر الصور بمقاسها الحقيقي، شغّل الكاش على مستوى السيرفر مش الإضافة، واقفل اللي مش مستخدم. تلاتة كده بيعملوا أكتر من أي إضافة تسريع، وما بيضفوش حاجة تقع بعد كده.',
    en: 'Serve images at the size they are displayed, cache at the server rather than in a plugin, and switch off what you are not using. Those three do more than any speed plugin, and add nothing that can break later.',
  },

  'footer.company': { ar: 'الشركة', en: 'Company' },

  'up.title': { ar: 'ترقية أو تخفيض', en: 'Change plan' },
  'up.current': { ar: 'باقتك الحالية', en: 'Your plan' },
  'up.onThis': { ar: 'أنت عليها', en: 'Current plan' },
  'up.step': { ar: 'أعلى', en: 'Step up' },
  'up.stepDown': { ar: 'أقل', en: 'Step down' },
  'up.choose': { ar: 'اختار دي', en: 'Choose' },
  'up.review': { ar: 'مراجعة التغيير', en: 'Review the change' },
  'up.change': { ar: 'التغيير', en: 'The change' },
  'up.from': { ar: 'من', en: 'From' },
  'up.to': { ar: 'إلى', en: 'To' },
  'up.howCounted': { ar: 'الحساب اتعمل إزاي', en: 'How this is worked out' },
  'up.daysLeft': { ar: 'أيام فاضلة في المدة المدفوعة', en: 'Days left in the paid term' },
  'up.credit': { ar: 'قيمة الأيام دي على باقتك الحالية', en: 'Those days on your current plan' },
  'up.charge': { ar: 'قيمة نفس الأيام على الباقة الجديدة', en: 'The same days on the new plan' },
  'up.dueToday': { ar: 'المستحق دلوقتي', en: 'Due today' },
  'up.creditedToday': { ar: 'هيتضاف لرصيدك', en: 'Credited to your balance' },
  'up.roundNote': {
    ar: 'الحساب بالأيام الكاملة، والتقريب لأقرب قرش مرة واحدة في الآخر.',
    en: 'Counted in whole days, and rounded to the nearest cent once, at the end.',
  },
  'up.nextTerm': { ar: 'الفاتورة الجاية بالكامل', en: 'Next full invoice' },
  'up.noRefund': {
    ar: 'التخفيض بيتحوّل رصيد على حسابك، مش مبلغ راجع للكارت.',
    en: 'A downgrade becomes account credit, not money back on the card.',
  },
  'up.confirm': { ar: 'أكّد التغيير', en: 'Confirm the change' },
  'up.done': { ar: 'تم التغيير', en: 'Plan changed' },
  'up.doneTitle': { ar: 'باقتك اتغيّرت', en: 'Your plan has changed' },
  'up.whatNow': { ar: 'وبعدين', en: 'What happens now' },
  'up.effective': { ar: 'سريان التغيير', en: 'Takes effect' },
  'up.effectiveNow': { ar: 'حالًا', en: 'Immediately' },
  'up.invoiced': { ar: 'اتفوتر دلوقتي', en: 'Invoiced today' },
  'up.provisionNote': {
    ar: 'الموارد الجديدة بتتظبط على السيرفر في خلال دقايق. لو المساحة لسه ما بانتش، ده سببه.',
    en: 'The new resources are applied on the server within minutes. If the storage has not appeared yet, that is why.',
  },
  'up.backToService': { ar: 'رجوع للخدمة', en: 'Back to the service' },
  'plan.sites': { ar: 'موقع', en: 'sites' },
  'plan.mailboxes': { ar: 'بريد', en: 'mailboxes' },

  // ── cancellation: C-07 ────────────────────────────────────────────────────
  'cancel.title': { ar: 'طلب إلغاء', en: 'Cancel service' },
  'cancel.when': { ar: 'الإلغاء يبقى إمتى', en: 'When it should stop' },
  'cancel.atEnd': { ar: 'في آخر المدة المدفوعة', en: 'At the end of the paid term' },
  'cancel.atEndNote': {
    ar: 'تفضل شغالة لحد التاريخ ده، والمدة اللي دفعتها ما بتضيعش.',
    en: 'It keeps running until then, and the time you have paid for is not thrown away.',
  },
  'cancel.now': { ar: 'حالًا', en: 'Immediately' },
  'cancel.nowNote': {
    ar: 'بتقف النهارده. الأيام الفاضلة مش بتترد.',
    en: 'It stops today. The remaining days are not refunded.',
  },
  'cancel.why': { ar: 'ليه بتلغي', en: 'Why are you leaving' },
  'cancel.reason': { ar: 'السبب', en: 'Reason' },
  'cancel.pick': { ar: 'اختار سبب', en: 'Pick a reason' },
  'cancel.more': { ar: 'أي تفاصيل تحب تضيفها', en: 'Anything you want to add' },
  'cancel.reason.price': { ar: 'السعر', en: 'Price' },
  'cancel.reason.moving': { ar: 'بنتقل لمكان تاني', en: 'Moving elsewhere' },
  'cancel.reason.unused': { ar: 'مش بستخدمها', en: 'Not using it' },
  'cancel.reason.support': { ar: 'الدعم', en: 'Support' },
  'cancel.reason.technical': { ar: 'مشاكل تقنية', en: 'Technical problems' },
  'cancel.reason.other': { ar: 'سبب تاني', en: 'Something else' },
  'cancel.whatGoes': { ar: 'اللي هيروح', en: 'What you lose' },
  'cancel.loses1': { ar: 'ملفات الموقع وقواعد البيانات', en: 'Site files and databases' },
  'cancel.loses2': { ar: 'كل صناديق البريد ورسايلها', en: 'Every mailbox and its mail' },
  'cancel.loses3': { ar: 'النسخ الاحتياطي بعد 14 يوم من الإيقاف', en: 'Backups, 14 days after it stops' },
  'cancel.understand': { ar: 'فاهم إن ده مش بيترجع', en: 'I understand this cannot be undone' },
  'cancel.request': { ar: 'ابعت طلب الإلغاء', en: 'Request cancellation' },
  'cancel.keep': { ar: 'خليها زي ما هي', en: 'Keep the service' },
  'cancel.doneTitle': { ar: 'وصلنا طلبك', en: 'We have your request' },
  'cancel.stopsOn': { ar: 'هتقف يوم', en: 'Stops on' },
  'cancel.stopsNow': { ar: 'هتقف خلال ساعة.', en: 'It will stop within the hour.' },

  // ── manual renewal: C-08 ──────────────────────────────────────────────────
  'renew.title': { ar: 'تجديد', en: 'Renew' },
  'renew.howLong': { ar: 'المدة', en: 'For how long' },
  'renew.save': { ar: 'وفّر', en: 'Save' },
  'renew.summary': { ar: 'الملخص', en: 'Summary' },
  'renew.term': { ar: 'المدة', en: 'Term' },
  'renew.paidUntil': { ar: 'مدفوعة لحد', en: 'Paid until' },
  'renew.pay': { ar: 'ادفع وجدّد', en: 'Pay and renew' },
  'renew.doneTitle': { ar: 'التجديد اتسجّل', en: 'Renewal recorded' },
  'renew.seeInvoice': { ar: 'شوف الفاتورة', en: 'See the invoice' },

  // ── transactions: C-20 ────────────────────────────────────────────────────
  'txn.title': { ar: 'حركة الحساب', en: 'Transactions' },
  'txn.lede': {
    ar: 'كل فلوس دخلت أو خرجت، ومقابل إيه.',
    en: 'Every amount in or out, and what it was against.',
  },
  'txn.kind': { ar: 'النوع', en: 'Type' },
  'txn.payment': { ar: 'دفعة', en: 'Payment' },
  'txn.refund': { ar: 'استرداد', en: 'Refund' },
  'txn.credit': { ar: 'رصيد', en: 'Credit' },
  'txn.reference': { ar: 'المرجع', en: 'Reference' },
  'txn.none': { ar: 'مفيش حركات في الفلتر ده', en: 'No transactions match this filter' },

  // ── failed payment: C-21 ──────────────────────────────────────────────────
  'fail.title': { ar: 'الدفع ما نجحش', en: 'Payment did not go through' },
  'fail.whatHappened': { ar: 'اللي حصل', en: 'What happened' },
  'fail.reason': { ar: 'السبب', en: 'Reason' },
  'fail.reason.insufficient_funds': { ar: 'الرصيد ما كفاش', en: 'Not enough funds' },
  'fail.reason.expired_card': { ar: 'الكارت منتهي', en: 'Card expired' },
  'fail.reason.declined': { ar: 'البنك رفض العملية', en: 'The bank declined it' },
  'fail.reason.network': { ar: 'العملية ما وصلتش للبنك', en: 'It never reached the bank' },
  'fail.advice.insufficient_funds': {
    ar: 'اشحن الكارت أو ادفع بطريقة تانية — البنك ما بيقولش أكتر من كده.',
    en: 'Top the card up or pay another way — the bank will not say more than this.',
  },
  'fail.advice.expired_card': {
    ar: 'حدّث تاريخ الانتهاء في طرق الدفع وهنحاول تاني.',
    en: 'Update the expiry date in payment methods and we will try again.',
  },
  'fail.advice.declined': {
    ar: 'غالبًا حماية من البنك. كلّمهم أو جرّب كارت تاني.',
    en: 'Usually the bank protecting the card. Call them, or try another card.',
  },
  'fail.advice.network': {
    ar: 'ده عندنا مش عندك. جرّب تاني دلوقتي.',
    en: 'That one is on us, not you. Try again now.',
  },
  'fail.whatNext': { ar: 'اللي جاي', en: 'What happens next' },
  'fail.step1': { ar: 'محاولة', en: 'Attempt' },
  'fail.step2': { ar: 'هنحاول تاني تلقائيًا', en: 'We try again automatically' },
  'fail.step3': { ar: 'الخدمة بتتوقف مؤقتًا', en: 'The service is suspended' },
  'fail.fixIt': { ar: 'اظبطها دلوقتي', en: 'Fix it now' },
  'fail.fixNote': {
    ar: 'ادفع دلوقتي وكل اللي فوق ده ما يحصلش.',
    en: 'Pay now and none of the above happens.',
  },
  'fail.changeMethod': { ar: 'غيّر طريقة الدفع', en: 'Change payment method' },
  'fail.getHelp': { ar: 'محتاج مساعدة', en: 'I need help' },

  // ── affiliate withdrawal: C-30 ────────────────────────────────────────────
  'wd.title': { ar: 'سحب الأرباح', en: 'Withdraw earnings' },
  'wd.howPaid': { ar: 'تستلمها إزاي', en: 'How you get paid' },
  'wd.bank': { ar: 'تحويل بنكي', en: 'Bank transfer' },
  'wd.bankNote': { ar: 'من 3 لـ 5 أيام عمل.', en: 'Three to five working days.' },
  'wd.wallet': { ar: 'محفظة موبايل', en: 'Mobile wallet' },
  'wd.walletNote': { ar: 'مصر بس، خلال يوم عمل.', en: 'Egypt only, within one working day.' },
  'wd.credit': { ar: 'رصيد على حسابك', en: 'Credit on your account' },
  'wd.creditNote': { ar: 'حالًا، وبيتخصم من فواتيرك.', en: 'Immediately, and it pays your invoices.' },
  'wd.iban': { ar: 'الآيبان', en: 'IBAN' },
  'wd.walletNum': { ar: 'رقم المحفظة', en: 'Wallet number' },
  'wd.minimum': { ar: 'الحد الأدنى للسحب', en: 'Minimum withdrawal' },
  'wd.alreadyPaid': { ar: 'اتصرف قبل كده', en: 'Paid out so far' },
  'wd.timing': {
    ar: 'الطلبات بتتراجع كل يوم اتنين.',
    en: 'Requests are reviewed every Monday.',
  },
  'wd.request': { ar: 'اطلب السحب', en: 'Request withdrawal' },
  'wd.belowMin': { ar: 'رصيدك لسه تحت الحد الأدنى.', en: 'Your balance is still below the minimum.' },
  'wd.doneTitle': { ar: 'الطلب اتسجّل', en: 'Request recorded' },
  'wd.doneNote': {
    ar: 'هنراجعه يوم الاتنين الجاي ونبعتلك.',
    en: 'We will review it next Monday and write to you.',
  },

  // ── notifications: C-35 and C-36 ──────────────────────────────────────────
  'notif.title': { ar: 'تفضيلات الإشعارات', en: 'Notification preferences' },
  'notif.lede': {
    ar: 'اختار توصلك إيه وعلى فين.',
    en: 'Choose what reaches you, and where.',
  },
  'notif.about': { ar: 'الموضوع', en: 'About' },
  'notif.email': { ar: 'إيميل', en: 'Email' },
  'notif.sms': { ar: 'رسالة', en: 'SMS' },
  'notif.inApp': { ar: 'داخل الحساب', en: 'In-app' },
  'notif.alwaysOn': { ar: 'دايمًا شغالة', en: 'always on' },
  'notif.where': { ar: 'بتوصل فين', en: 'Where they go' },
  'notif.whereNote': {
    ar: 'العنوان والرقم بيتغيّروا من الحساب والأمان.',
    en: 'The address and number are changed in Account & security.',
  },
  'notif.settings': { ar: 'التفضيلات', en: 'Preferences' },
  'notif.none': { ar: 'مفيش إشعارات.', en: 'Nothing new.' },
  'notif.pref.billing': { ar: 'الفوترة', en: 'Billing' },
  'notif.pref.billingNote': {
    ar: 'فواتير مستحقة، دفعات، ومحاولات دفع فشلت.',
    en: 'Invoices due, payments, and failed charges.',
  },
  'notif.pref.service': { ar: 'الخدمات', en: 'Services' },
  'notif.pref.serviceNote': {
    ar: 'تجديدات قربت، وتغييرات على الباقة.',
    en: 'Renewals coming up, and plan changes.',
  },
  'notif.pref.ticket': { ar: 'الدعم', en: 'Support' },
  'notif.pref.ticketNote': { ar: 'ردود على تذاكرك.', en: 'Replies on your tickets.' },
  'notif.pref.news': { ar: 'الأخبار', en: 'News' },
  'notif.pref.newsNote': { ar: 'صيانة، ومنتجات جديدة.', en: 'Maintenance, and new products.' },
  'notif.invoiceDue': { ar: 'عندك فاتورة مستحقة', en: 'You have an invoice due' },
  'notif.ticketReplied': { ar: 'في رد على تذكرتك', en: 'Your ticket has a reply' },
  'notif.renewalSoon': { ar: 'خدمة بتتجدد قريب', en: 'A service renews soon' },
  'notif.maintenance': { ar: 'صيانة مجدولة', en: 'Scheduled maintenance' },

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
  'empty.kb': { ar: 'مفيش مقالات مطابقة', en: 'No articles match' },
  'empty.kbNote': {
    ar: 'جرّب كلمة تانية، أو افتح تذكرة وهنرد عليك.',
    en: 'Try another word, or open a ticket and we will answer.',
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

  // The qualifier under each count on the dashboard tiles. Every one is two or three words: a
  // caption line in a 170px tile has no room for a sentence, in either language.
  'dash.settled': { ar: 'كله مدفوع', en: 'All paid' },
  'dash.awaiting': { ar: 'في انتظار الرد', en: 'Awaiting reply' },
  'dash.noneOpen': { ar: 'مفيش مفتوح', en: 'None open' },

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
  'tkt.noneFilter': { ar: 'مفيش تذاكر بالفلاتر دي.', en: 'No tickets match these filters.' },
  'tkt.showAll': { ar: 'اعرض كل التذاكر', en: 'Show all tickets' },

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
  'kb.categories': { ar: 'تصنيفات المقالات', en: 'Article categories' },
  'kb.related': { ar: 'مقالات في نفس التصنيف', en: 'More in this category' },
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
  'kb.a5.title': { ar: 'إزاي تنقل دومينك لـ SWS', en: 'How to transfer your domain to SWS' },
  'kb.a5.body': { ar: 'افتح قفل الدومين عند المُسجِّل الحالي، اطلب كود الـEPP، وبعدين ادخل الكود في صفحة نقل الدومين. النقل بياخد من ٥ لـ٧ أيام وبيضيف سنة على مدة الدومين.', en: 'Unlock the domain at your current registrar, ask it for the EPP code, then enter that code on the domain transfer page. A transfer takes five to seven days and adds a year to the domain.' },
  'kb.a6.title': { ar: 'إزاي تقرا فاتورتك', en: 'How to read your invoice' },
  'kb.a6.body': { ar: 'كل بند في الفاتورة بيوضّح الخدمة ودورة الفوترة والمدة اللي بتغطيها. ضريبة القيمة المضافة سطر منفصل، والإجمالي تحتها هو المبلغ اللي هيتخصم فعلًا.', en: 'Each line on an invoice names the service, its billing cycle and the period it covers. VAT is its own line, and the total beneath it is the figure that will actually be charged.' },
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
  'sec.twofaOnNote': { ar: 'مفعّل — هيتطلب منك كود عند كل دخول.', en: 'On — you will be asked for a code at every sign-in.' },
  'sec.twofaStep1': { ar: '١ — امسح الكود ده من تطبيق المصادقة (Google Authenticator أو أي تطبيق تاني).', en: '1 — Scan this code in your authenticator app (Google Authenticator or any other).' },
  'sec.twofaStep2': { ar: '٢ — أو أدخل المفتاح ده يدويًا لو مش قادر تمسح الكود.', en: '2 — Or enter this key by hand if you cannot scan the code.' },
  'sec.twofaStep3': { ar: '٣ — اكتب الكود المكوّن من ٦ أرقام اللي ظهر في التطبيق', en: '3 — Enter the six-digit code your app is showing' },
  'sec.twofaConfirm': { ar: 'فعّل التحقق بخطوتين', en: 'Turn on two-factor' },
  'sec.twofaOn': { ar: 'التحقق بخطوتين اتفعّل', en: 'Two-factor is on' },
  'sec.twofaOff': { ar: 'التحقق بخطوتين اتوقف — حسابك دلوقتي بكلمة المرور بس.', en: 'Two-factor is off — your account is now protected by a password alone.' },
  'sec.qrLabel': { ar: 'مكان رمز QR الخاص بالتحقق بخطوتين', en: 'Slot for the two-factor QR code' },
  'sec.qrTag': { ar: 'رمز QR', en: 'QR code' },
  'sec.qrNote': { ar: 'الرمز بيتولّد في الخادم لكل حساب على حدة، فمش مرسوم هنا.', en: 'The code is minted per account on the server, so it is not drawn here.' },
  'sec.backup': { ar: 'رموز احتياطية', en: 'Backup codes' },
  'sec.backupNote': { ar: 'احفظهم في مكان آمن. كل رمز بيشتغل مرة واحدة، ودول طريقك لو ضاع الموبايل.', en: 'Keep these somewhere safe. Each one works once, and they are your way in if you lose your phone.' },
  'sec.log': { ar: 'سجل الدخول', en: 'Login activity' },
  'sec.ip': { ar: 'عنوان IP', en: 'IP address' },
  'sec.where': { ar: 'المكان', en: 'Location' },
  'sec.ok': { ar: 'ناجح', en: 'Successful' },
  'sec.failed': { ar: 'فاشل', en: 'Failed' },

  'con.lede': { ar: 'جهات اتصال فرعية بصلاحيات محددة على حسابك.', en: 'Sub-accounts with specific permissions on your account.' },
  'con.edit': { ar: 'تعديل', en: 'Edit' },
  'con.add': { ar: 'أضف جهة اتصال', en: 'Add a contact' },
  'perm.invoices': { ar: 'الفواتير', en: 'Invoices' },
  'perm.invoices.note': { ar: 'يشوف الفواتير ويدفعها.', en: 'Can see invoices and pay them.' },
  'perm.tickets': { ar: 'التذاكر', en: 'Tickets' },
  'perm.tickets.note': { ar: 'يفتح تذاكر دعم ويرد عليها.', en: 'Can open support tickets and reply to them.' },
  'perm.domains': { ar: 'الدومينات', en: 'Domains' },
  'perm.domains.note': { ar: 'يعدّل خوادم الأسماء وسجلات DNS.', en: 'Can change nameservers and DNS records.' },
  'con.perms': { ar: 'الصلاحيات', en: 'Permissions' },
  'con.noPerms': { ar: 'من غير صلاحيات — يقدر يدخل بس.', en: 'No permissions — sign-in only.' },
  'con.done': { ar: 'إغلاق', en: 'Done' },


  /* Table toolbars — the search field and filter pills above every client-area table. The
     placeholder is always the plain word; these name the list for a screen reader. */
  'search.services': { ar: 'ابحث في الخدمات', en: 'Search services' },
  'search.domains': { ar: 'ابحث في الدومينات', en: 'Search domains' },
  'search.dns': { ar: 'ابحث في سجلات DNS', en: 'Search DNS records' },
  'search.invoices': { ar: 'ابحث في الفواتير', en: 'Search invoices' },
  'search.txns': { ar: 'ابحث في الحركات', en: 'Search transactions' },
  'search.tickets': { ar: 'ابحث في التذاكر', en: 'Search tickets' },
  'search.log': { ar: 'ابحث في سجل الدخول', en: 'Search login activity' },
  'search.notifs': { ar: 'ابحث في التنبيهات', en: 'Search notifications' },
  'search.contacts': { ar: 'ابحث في جهات الاتصال', en: 'Search contacts' },
  'search.news': { ar: 'ابحث في الإعلانات', en: 'Search announcements' },

  'filter.allStatuses': { ar: 'كل الحالات', en: 'All statuses' },
  'filter.allTypes': { ar: 'كل الأنواع', en: 'All types' },
  'filter.allDepartments': { ar: 'كل الأقسام', en: 'All departments' },
  'filter.allPriorities': { ar: 'كل الأولويات', en: 'All priorities' },
  'filter.allCategories': { ar: 'كل التصنيفات', en: 'All categories' },
  'filter.allChannels': { ar: 'كل القنوات', en: 'All channels' },
  'filter.allPermissions': { ar: 'كل الصلاحيات', en: 'All permissions' },
  'filter.allResults': { ar: 'كل المحاولات', en: 'All attempts' },
  'filter.channel': { ar: 'القناة', en: 'Channel' },
  'filter.result': { ar: 'نتيجة المحاولة', en: 'Result' },
  'filter.recordType': { ar: 'نوع السجل', en: 'Record type' },

  'empty.search': { ar: 'مفيش نتايج للبحث ده', en: 'Nothing matches that search' },
  'empty.searchNote': { ar: 'غيّر كلمة البحث أو ارجع الفلاتر للكل.', en: 'Try different words, or set the filters back to all.' },
  'empty.dns': { ar: 'مفيش سجل مطابق', en: 'No records match' },
  'empty.log': { ar: 'مفيش محاولة دخول مطابقة', en: 'No sign-in matches' },
  'empty.notifs': { ar: 'مفيش تنبيه مطابق', en: 'No notification matches' },
  'empty.news': { ar: 'مفيش إعلان مطابق', en: 'No announcement matches' },
  'empty.contactsFilter': { ar: 'مفيش جهة اتصال مطابقة', en: 'No contact matches' },

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
