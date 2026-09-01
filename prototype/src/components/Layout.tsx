import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { IconGlobe, IconChevron, IconCart, IconSun, IconMoon, IconCoin } from './icons';
import { useLocale, type Locale } from '../lib/locale';
import { useCart } from '../lib/cart';
import { usePrefs } from '../lib/prefs';
import { CURRENCIES, type Currency } from '../lib/catalog';

/**
 * The shell every page sits in.
 *
 * The header carries the four controls the spec calls for in section 6.1 — language, currency,
 * light/dark, and login — plus the cart. Currency and theme both switch in place and persist
 * for the next visit (spec 4.2 and 4.3); neither reloads the page.
 */
export function Layout({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { lines } = useCart();
  const { theme, toggleTheme, currency, setCurrency } = usePrefs();

  return (
    <div className="page">
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>

      <header className="masthead">
        <div className="shell masthead__inner">
          <Link className="masthead__brand" to="/">
            <span className="masthead__mark" aria-hidden="true">
              SWS
            </span>
            <span className="masthead__wordmark">
              <span className="masthead__word">Somion</span>
              <span className="masthead__sub">{t('brand.tagline')}</span>
            </span>
          </Link>

          <nav className="masthead__nav" aria-label={t('nav.hosting')}>
            <NavLink className="masthead__link" to="/hosting">
              {t('nav.hosting')}
            </NavLink>
            <NavLink className="masthead__link" to="/domains">
              {t('nav.domains')}
            </NavLink>
            <NavLink className="masthead__link" to="/account">
              {t('nav.support')}
            </NavLink>
          </nav>

          <div className="masthead__tools">
            <label className="masthead__select">
              <IconGlobe />
              <span className="u-visually-hidden">Language</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <IconChevron size={14} />
            </label>

            {/* Spec 4.2: switches in place, persists, and drives which gateways appear. */}
            <label className="masthead__select">
              <IconCoin />
              <span className="u-visually-hidden">{t('currency.label')}</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <IconChevron size={14} />
            </label>

            {/* Spec 4.3. */}
            <button
              type="button"
              className="masthead__icon-btn"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}
              title={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}
            >
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>

            <NavLink className="masthead__cart" to="/cart">
              <IconCart />
              <span className="masthead__cart-label">{t('nav.cart')}</span>
              {lines.length > 0 && (
                <span className="masthead__count serial" aria-hidden="true">
                  {lines.length}
                </span>
              )}
            </NavLink>
          </div>

          <NavLink className="masthead__login" to="/login">
            {t('nav.login')}
          </NavLink>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="colophon">
        <div className="shell colophon__inner">
          <p className="colophon__rights">{t('footer.rights')}</p>
          <nav className="colophon__links" aria-label={t('footer.terms')}>
            <Link to="/legal/privacy">{t('footer.privacy')}</Link>
            <Link to="/legal/terms">{t('footer.terms')}</Link>
            <Link to="/legal/sla">{t('footer.sla')}</Link>
            <Link to="/legal/refund">{t('footer.refund')}</Link>
            <Link to="/account">{t('footer.contact')}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
