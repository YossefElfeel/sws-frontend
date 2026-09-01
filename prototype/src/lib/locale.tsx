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
    const t = (key: StringKey) => {
      const entry = STRINGS[key];
      if (!entry) {
        if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
        return key;
      }
      return entry[locale];
    };
    return { locale, dir, setLocale, t };
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
  'cycle.triennially': { ar: 'كل ٣ سنوات', en: 'Triennially' },
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
