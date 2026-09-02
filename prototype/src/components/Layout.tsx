import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { IconGlobe, IconChevron, IconCart, IconSun, IconMoon } from './icons';
import { CurrencySelect } from './CurrencySelect';
import { CookieConsent } from './CookieConsent';
import { useLocale, type Locale } from '../lib/locale';
import { useCart } from '../lib/cart';
import { usePrefs } from '../lib/prefs';

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
  const { theme, toggleTheme } = usePrefs();

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
            {/*
              This pointed at /account/knowledgebase, which renders inside the signed-in shell
              — so "Support" took a logged-out visitor into the client area complete with a
              sidebar, a notification bell and the account holder's name. The public site
              answers a public question with a public page; the client-area knowledgebase is
              reached from inside the account, where it belongs.
            */}
            <NavLink className="masthead__link" to="/contact">
              {t('nav.support')}
            </NavLink>
          </nav>

          <div className="masthead__tools">
            <label className="masthead__select">
              <IconGlobe />
              <span className="u-visually-hidden">{t('a11y.language')}</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <IconChevron size={14} />
            </label>

            {/* Spec 4.2, and the open half of I15 — see CurrencySelect. */}
            <CurrencySelect variant="masthead" />

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
        <div className="shell">
          <div className="colophon__cols">
            <nav className="colophon__col" aria-labelledby="f-prod">
              <p className="colophon__head" id="f-prod">
                {t('nav.hosting')}
              </p>
              <Link to="/hosting/shared">{t('fam.shared')}</Link>
              <Link to="/hosting/wordpress">{t('fam.wordpress')}</Link>
              <Link to="/hosting/vps">{t('fam.vps')}</Link>
              <Link to="/compare">{t('cmp.title')}</Link>
            </nav>

            <nav className="colophon__col" aria-labelledby="f-dom">
              <p className="colophon__head" id="f-dom">
                {t('nav.domains')}
              </p>
              <Link to="/domains">{t('rail.register')}</Link>
              <Link to="/domains/pricing">{t('tld.title')}</Link>
              <Link to="/transfer">{t('rail.transfer')}</Link>
              <Link to="/migrate">{t('mig.title')}</Link>
            </nav>

            <nav className="colophon__col" aria-labelledby="f-co">
              <p className="colophon__head" id="f-co">
                {t('footer.company')}
              </p>
              <Link to="/about">{t('ab.title')}</Link>
              <Link to="/data-centres">{t('dc.title')}</Link>
              <Link to="/learn">{t('blog.title')}</Link>
            </nav>

            <nav className="colophon__col" aria-labelledby="f-help">
              <p className="colophon__head" id="f-help">
                {t('nav.support')}
              </p>
              {/*
                The knowledgebase and the ticket form live inside the account, so the public
                footer offers the door to them rather than a link that walks a signed-out
                visitor into someone else's dashboard. Network status moves up from the
                company column: it is what people actually want when something is wrong.
              */}
              <Link to="/contact">{t('ct.title')}</Link>
              <Link to="/status">{t('status.title')}</Link>
              <Link to="/login">{t('nav.login')}</Link>
            </nav>
          </div>

          <div className="colophon__inner">
            <p className="colophon__rights">{t('footer.rights')}</p>
            <nav className="colophon__links" aria-label={t('footer.terms')}>
              <Link to="/legal/privacy">{t('footer.privacy')}</Link>
              <Link to="/legal/terms">{t('footer.terms')}</Link>
              <Link to="/legal/sla">{t('footer.sla')}</Link>
              <Link to="/legal/refund">{t('footer.refund')}</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* S-06. Rendered last so it sits above the page without a stacking-context fight. */}
      <CookieConsent />
    </div>
  );
}
