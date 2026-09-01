import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LocaleProvider } from './lib/locale';
import { PrefsProvider } from './lib/prefs';
import { CartProvider } from './lib/cart';

import { Home } from './screens/Home';
import { Family } from './screens/Family';
import { Domains } from './screens/Domains';
import { Transfer } from './screens/Transfer';
import { Configure } from './screens/Configure';
import { DomainStep } from './screens/DomainStep';
import { Cart } from './screens/Cart';
import { Checkout } from './screens/Checkout';
import { Confirmation } from './screens/Confirmation';
import { Legal } from './screens/Legal';
import { Login, Register, ResetPassword, TwoFactor } from './screens/Auth';

import { Dashboard } from './screens/account/Dashboard';
import { Services, ServiceDetail } from './screens/account/Services';
import { MyDomains, DomainManage } from './screens/account/Domains';
import { Invoices, InvoiceDetail, AddFunds, PaymentMethods } from './screens/account/Billing';
import {
  Tickets,
  TicketNew,
  TicketThread,
  Knowledgebase,
  KbArticle,
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

/** A route change is a new page, so it starts at the top of that page. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <LocaleProvider>
      <PrefsProvider>
        <CartProvider>
          <HashRouter>
            <ScrollToTop />
            <Routes>
              {/* Marketing — spec 5.1 */}
              <Route path="/" element={<Home />} />
              <Route path="/hosting" element={<Navigate to="/hosting/shared" replace />} />
              <Route path="/hosting/:family" element={<Family />} />
              <Route path="/ssl" element={<Family />} />
              <Route path="/builder" element={<Family />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/transfer" element={<Transfer />} />

              {/* Ordering — spec 5.2 and 7 */}
              <Route path="/configure/:planId" element={<Configure />} />
              <Route path="/domain/:lineId" element={<DomainStep />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/confirmation" element={<Confirmation />} />

              {/* Auth — spec 5.3 and 8 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="/2fa" element={<TwoFactor />} />

              {/* Client area — spec 5.4 and 9 */}
              <Route path="/account" element={<Dashboard />} />
              <Route path="/account/services" element={<Services />} />
              <Route path="/account/services/:id" element={<ServiceDetail />} />
              <Route path="/account/services/:id/upgrade" element={<UpgradePlan />} />
              <Route path="/account/services/:id/upgrade/review" element={<UpgradeProration />} />
              <Route path="/account/services/:id/upgrade/done" element={<UpgradeResult />} />
              <Route path="/account/services/:id/cancel" element={<CancelService />} />
              <Route path="/account/domains" element={<MyDomains />} />
              <Route path="/account/domains/:id" element={<DomainManage />} />
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
              <Route path="/account/affiliates" element={<Affiliates />} />
              <Route path="/account/affiliates/withdraw" element={<AffiliateWithdraw />} />
              <Route path="/account/notifications" element={<NotificationPrefs />} />
              <Route path="/account/contacts" element={<Contacts />} />
              <Route path="/account/security" element={<Security />} />

              <Route path="/legal/:doc" element={<Legal />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </CartProvider>
      </PrefsProvider>
    </LocaleProvider>
  );
}
