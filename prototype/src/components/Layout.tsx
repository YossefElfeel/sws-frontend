import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { IconGlobe, IconChevron, IconCart } from './icons';
import { useLocale, type Locale } from '../lib/locale';
import { useCart } from '../lib/cart';

/**
 * The shell every page sits in: sticky header, plotted ground, footer.
 *
 * The same shell wraps the marketing pages and the account pages on purpose. The build plan
 * names the move between those two halves as the moment trust is lost, and it is only
 * survivable if both read as one company rather than two systems bolted together.
 */
export function Layout({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { lines } = useCart();

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
            <label className="masthead__locale">
              <IconGlobe />
              <span className="u-visually-hidden">Language</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <IconChevron size={14} />
            </label>

            <NavLink className="masthead__cart" to="/cart">
              <IconCart />
              <span>{t('nav.cart')}</span>
              {lines.length > 0 && (
                <span className="masthead__count serial" aria-hidden="true">
                  {lines.length}
                </span>
              )}
            </NavLink>
          </div>

          <NavLink className="masthead__login" to="/account">
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
