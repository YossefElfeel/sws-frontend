import { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LocaleProvider } from './lib/locale';
import { PrefsProvider } from './lib/prefs';
import { CartProvider } from './lib/cart';
import { AccountStateProvider } from './lib/accountState';

import { Home } from './screens/Home';
import { Family } from './screens/Family';
import { Domains } from './screens/Domains';
import { Transfer } from './screens/Transfer';
import { Configure } from './screens/Configure';
import { DomainStep } from './screens/DomainStep';
import { DomainAddons } from './screens/DomainAddons';
import { Cart } from './screens/Cart';
import { Checkout } from './screens/Checkout';
import { Confirmation } from './screens/Confirmation';
import { Legal } from './screens/Legal';
import { ErrorPage, CpanelTransition, BannerGallery } from './screens/System';
import { Compare, TldPricing, ProductDetail } from './screens/Compare';
import {
  Status,
  About,
  DataCentres,
  Contact,
  Migration,
  Learn,
  LearnPost,
} from './screens/Company';
import {
  Login,
  Register,
  ResetPassword,
  TwoFactor,
  SetPassword,
  VerifyEmail,
} from './screens/Auth';
import {
  Registrant,
  CardEntry,
  ThreeDSecure,
  BankTransfer,
  WalletTransfer,
  PaymentFailure,
  PendingOrder,
  SessionExpired,
} from './screens/Order';

import { Dashboard } from './screens/account/Dashboard';
import { Services, ServiceDetail, ServicePassword } from './screens/account/Services';
import { MyDomains } from './screens/account/Domains';
import {
  DomainOverview,
  DomainNameservers,
  DomainDns,
  DomainContacts,
  DomainPrivateNs,
  DomainAddonsPage,
  DomainForwarding,
  DomainTransferOut,
} from './screens/account/DomainPages';
import { Invoices, InvoiceDetail, AddFunds, PaymentMethods } from './screens/account/Billing';
import {
  Tickets,
  TicketNew,
  TicketThread,
  Knowledgebase,
  KbArticle,
  NetworkStatus,
} from './screens/account/Support';
import { Announcements, Affiliates, Security, Contacts } from './screens/account/Profile';
import {
  UpgradePlan,
  UpgradeProration,
  UpgradeResult,
  CancelService,
} from './screens/account/Upgrade';
import {
  Renew,
  Transactions,
  PaymentFailed,
  AffiliateWithdraw,
} from './screens/account/Money';
import { NotificationPrefs } from './screens/account/Notifications';

/**
 * A route change is a new page, so it starts at the top of that page — and any horizontal
 * strip on it starts showing what is currently selected.
 *
 * The second half matters because a strip of chips wider than the screen opens at its start,
 * and the selected chip is often not there: the plan comparison defaults to annual, which is
 * fourth of six, so it opened with the active pill off-screen and nothing to say a choice had
 * been made. scrollLeft is set directly rather than through scrollIntoView, which would also
 * move the page.
 */
function OnRouteChange() {
  const { pathname } = useLocation();
  /*
   * The route this effect has already handled. A boolean "is this the first run" does not
   * survive StrictMode, which mounts, unmounts and remounts every effect in development: the
   * first invocation spends the flag and the second one then behaves like a navigation, so
   * focus was taken on page load — the exact thing the guard exists to prevent. Comparing the
   * path is idempotent, so running twice is the same as running once.
   */
  const handled = useRef(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);

    /*
     * A route change was silent. The page scrolled to the top and nothing else happened, so a
     * screen reader went on reading the old screen and a keyboard user's next Tab carried on
     * from wherever the link had been. Both shells already render <main id="main" tabIndex={-1}>
     * with a :focus style, which is the whole mechanism — nothing had ever moved focus to it.
     *
     * Not on the first render: focus belongs where the browser put it when the document loaded,
     * and stealing it on arrival would skip the skip link, which is the one control that exists
     * to be reached first.
     */
    if (handled.current !== pathname) {
      handled.current = pathname;
      document.getElementById('main')?.focus({ preventScroll: true });
    }

    const id = window.setTimeout(() => {
      for (const strip of document.querySelectorAll<HTMLElement>('.filters, .rail__list')) {
        if (strip.scrollWidth <= strip.clientWidth) continue;
        const active = strip.querySelector<HTMLElement>('.is-active, .active');
        if (!active) continue;
        const stripBox = strip.getBoundingClientRect();
        const box = active.getBoundingClientRect();
        if (box.left >= stripBox.left && box.right <= stripBox.right) continue;
        strip.scrollLeft += box.left - stripBox.left - (stripBox.width - box.width) / 2;
      }
    }, 60);

    return () => window.clearTimeout(id);
  }, [pathname]);

  /*
   * One <title> served all 96 routes, so every history entry, every bookmark and every window
   * in a task switcher carried the same name, and the accessible name of the page never
   * changed. The title is read off the screen's own <h1> rather than from a route table: a
   * table is a second place to update when a heading changes, and it would be wrong the first
   * time someone forgot. Runs after the paint that follows the route change, and after the
   * locale effect, so switching language retitles the tab too.
   */
  useEffect(() => {
    const id = window.setTimeout(() => {
      const heading = document.querySelector('main h1')?.textContent?.trim();
      const site = document.documentElement.lang === 'ar' ? 'سوميون' : 'Somion';
      document.title = heading ? `${heading} — ${site}` : document.title;
    }, 0);
    return () => window.clearTimeout(id);
  });

  return null;
}

export function App() {
  return (
    <LocaleProvider>
      <PrefsProvider>
        <CartProvider>
          <AccountStateProvider>
          <HashRouter>
            <OnRouteChange />
            <Routes>
              {/* Marketing — spec 5.1 */}
              <Route path="/" element={<Home />} />
              <Route path="/hosting" element={<Navigate to="/hosting/shared" replace />} />
              <Route path="/hosting/:family" element={<Family />} />
              <Route path="/ssl" element={<Family />} />
              <Route path="/builder" element={<Family />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/domains/pricing" element={<TldPricing />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/migrate" element={<Migration />} />
              <Route path="/status" element={<Status />} />
              <Route path="/about" element={<About />} />
              <Route path="/data-centres" element={<DataCentres />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:slug" element={<LearnPost />} />

              {/* Ordering — spec 5.2 and 7 */}
              <Route path="/configure/:planId" element={<Configure />} />
              <Route path="/domain/:lineId" element={<DomainStep />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/registrant" element={<Registrant />} />
              <Route path="/checkout/card" element={<CardEntry />} />
              <Route path="/checkout/3ds" element={<ThreeDSecure />} />
              <Route path="/checkout/redirect" element={<ThreeDSecure kind="redirect" />} />
              <Route path="/domain/:lineId/addons" element={<DomainAddons />} />
              <Route path="/order/bank" element={<BankTransfer />} />
              <Route path="/order/wallet" element={<WalletTransfer />} />
              <Route path="/order/failed" element={<PaymentFailure />} />
              <Route path="/order/pending" element={<PendingOrder />} />
              <Route path="/confirmation" element={<Confirmation />} />

              {/* Auth — spec 5.3 and 8 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="/2fa" element={<TwoFactor />} />
              <Route path="/reset/new" element={<SetPassword />} />
              <Route path="/verify" element={<VerifyEmail />} />
              <Route path="/expired" element={<SessionExpired />} />

              {/* Client area — spec 5.4 and 9 */}
              <Route path="/account" element={<Dashboard />} />
              <Route path="/account/services" element={<Services />} />
              <Route path="/account/services/:id" element={<ServiceDetail />} />
              <Route path="/account/services/:id/upgrade" element={<UpgradePlan />} />
              <Route path="/account/services/:id/upgrade/review" element={<UpgradeProration />} />
              <Route path="/account/services/:id/upgrade/done" element={<UpgradeResult />} />
              <Route path="/account/services/:id/cancel" element={<CancelService />} />
              <Route path="/account/services/:id/password" element={<ServicePassword />} />
              <Route path="/account/domains" element={<MyDomains />} />
              {/* One domain, eight flat pages behind one rail — C-10 to C-13, C-37 to C-40. */}
              <Route path="/account/domains/:id" element={<DomainOverview />} />
              <Route path="/account/domains/:id/nameservers" element={<DomainNameservers />} />
              <Route path="/account/domains/:id/dns" element={<DomainDns />} />
              <Route path="/account/domains/:id/contacts" element={<DomainContacts />} />
              <Route path="/account/domains/:id/private-ns" element={<DomainPrivateNs />} />
              <Route path="/account/domains/:id/addons" element={<DomainAddonsPage />} />
              <Route path="/account/domains/:id/forwarding" element={<DomainForwarding />} />
              <Route path="/account/domains/:id/transfer-out" element={<DomainTransferOut />} />
              <Route path="/account/invoices" element={<Invoices />} />
              <Route path="/account/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/account/renew/:id" element={<Renew />} />
              <Route path="/account/funds" element={<AddFunds />} />
              <Route path="/account/transactions" element={<Transactions />} />
              <Route path="/account/payment-failed" element={<PaymentFailed />} />
              <Route path="/account/payment-methods" element={<PaymentMethods />} />
              <Route path="/account/tickets" element={<Tickets />} />
              <Route path="/account/tickets/new" element={<TicketNew />} />
              <Route path="/account/tickets/:id" element={<TicketThread />} />
              <Route path="/account/knowledgebase" element={<Knowledgebase />} />
              <Route path="/account/knowledgebase/:slug" element={<KbArticle />} />
              <Route path="/account/announcements" element={<Announcements />} />
              <Route path="/account/status" element={<NetworkStatus />} />
              <Route path="/account/affiliates" element={<Affiliates />} />
              <Route path="/account/affiliates/withdraw" element={<AffiliateWithdraw />} />
              <Route path="/account/notifications" element={<NotificationPrefs />} />
              <Route path="/account/contacts" element={<Contacts />} />
              <Route path="/account/security" element={<Security />} />

              <Route path="/legal/:doc" element={<Legal />} />

              {/* System — spec 5.5 */}
              <Route path="/error/:kind" element={<ErrorPage />} />
              <Route path="/cpanel" element={<CpanelTransition />} />
              <Route path="/system/banners" element={<BannerGallery />} />

              {/*
                A mistyped URL used to be redirected silently to the homepage, which looks
                exactly like a working link that went somewhere else. It is a 404 now, and the
                404 says what to do next.
              */}
              <Route path="*" element={<ErrorPage kind="404" />} />
            </Routes>
          </HashRouter>
          </AccountStateProvider>
        </CartProvider>
      </PrefsProvider>
    </LocaleProvider>
  );
}
