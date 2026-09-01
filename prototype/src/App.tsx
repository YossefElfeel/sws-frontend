import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LocaleProvider } from './lib/locale';
import { CartProvider } from './lib/cart';
import { Home } from './screens/Home';
import { Domains } from './screens/Domains';
import { Cart } from './screens/Cart';
import { Checkout } from './screens/Checkout';
import { Confirmation } from './screens/Confirmation';
import { Account } from './screens/Account';
import { Legal } from './screens/Legal';

/** A route change is a new leaf, so it starts at the top of the leaf. */
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
      <CartProvider>
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hosting" element={<Home />} />
            <Route path="/domains" element={<Domains />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/account" element={<Account />} />
            <Route path="/legal/:doc" element={<Legal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </CartProvider>
    </LocaleProvider>
  );
}
