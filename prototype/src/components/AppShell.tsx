import { useState, type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  IconGauge,
  IconServer,
  IconGlobe,
  IconInvoice,
  IconWallet,
  IconSupport,
  IconBook,
  IconMegaphone,
  IconUsers,
  IconShield,
  IconBell,
  IconMenu,
  IconClose,
  IconSignOut,
  IconExternal,
  IconSun,
  IconMoon,
  IconChevron,
  IconCoin,
  IconGlobe as IconLang,
} from './icons';
import { useLocale, type Locale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { CURRENCIES, type Currency } from '../lib/catalog';
import { ACCOUNT, INVOICES, TICKETS } from '../lib/account';

/**
 * The client-area application shell — spec 5.4 and 9.
 *
 * This is deliberately not the marketing Layout. Someone reading this screen has already
 * signed in, so the marketing header would offer them a "Client login" button, a shopping
 * cart and a category nav they have finished with, and the footer would offer legal pages
 * under a page they are working in. An application answers a different question — "where am
 * I and what needs me" — so it gets application chrome: a standing navigation column, a bar
 * that names the current place, and a body that is the work.
 *
 * The two halves still share one type scale, one accent and one set of tokens, which is what
 * the build plan asks for. What changes is the furniture, not the voice.
 *
 * The document scrolls rather than an inner pane: the sidebar is sticky and full-height, which
 * reads as an app while keeping the page linkable, printable and photographable end to end.
 */

interface Section {
  to: string;
  end?: boolean;
  icon: ReactNode;
  key: string;
  /** Rendered beside the label when there is something waiting in that section. */
  badge?: number;
}

/**
 * Twelve flat links is a list to read, not a structure to navigate. Grouped, it is four short
 * decisions — and the groups match how the spec itself sections 9.
 */
function useGroups(): { label: string; items: Section[] }[] {
  const unpaid = INVOICES.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length;
  const openTickets = TICKETS.filter((x) => x.status !== 'closed').length;

  return [
    {
      label: 'app.grp.overview',
      items: [
        { to: '/account', end: true, icon: <IconGauge size={17} />, key: 'acc.dashboard' },
        { to: '/account/services', icon: <IconServer size={17} />, key: 'acc.services' },
        { to: '/account/domains', icon: <IconGlobe size={17} />, key: 'acc.domains' },
      ],
    },
    {
      label: 'app.grp.billing',
      items: [
        { to: '/account/invoices', icon: <IconInvoice size={17} />, key: 'acc.invoices', badge: unpaid },
        { to: '/account/funds', icon: <IconWallet size={17} />, key: 'acc.funds' },
        { to: '/account/payment-methods', icon: <IconCoin size={17} />, key: 'acc.methods' },
      ],
    },
    {
      label: 'app.grp.support',
      items: [
        { to: '/account/tickets', icon: <IconSupport size={17} />, key: 'acc.tickets', badge: openTickets },
        { to: '/account/knowledgebase', icon: <IconBook size={17} />, key: 'acc.kb' },
        { to: '/account/announcements', icon: <IconMegaphone size={17} />, key: 'acc.news' },
      ],
    },
    {
      label: 'app.grp.account',
      items: [
        { to: '/account/affiliates', icon: <IconUsers size={17} />, key: 'acc.affiliates' },
        { to: '/account/contacts', icon: <IconUsers size={17} />, key: 'acc.contacts' },
        { to: '/account/security', icon: <IconShield size={17} />, key: 'acc.security' },
      ],
    },
  ];
}

export function AppShell({
  title,
  lede,
  crumbs,
  actions,
  children,
}: {
  title: string;
  lede?: string;
  crumbs?: { label: string; to?: string }[];
  /** Controls that belong to this screen rather than to the shell. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { t, locale, setLocale, bi } = useLocale();
  const { theme, toggleTheme, currency, setCurrency } = usePrefs();
  const groups = useGroups();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const name = bi(ACCOUNT.name);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  // Longest match wins, so /account/services/svc-1 resolves to Services rather than to the
  // dashboard's own /account.
  const section = groups
    .flatMap((g) => g.items)
    .filter((s) => (s.end ? pathname === s.to : pathname.startsWith(s.to)))
    .sort((a, b) => b.to.length - a.to.length)
    .map((s) => t(s.key as never))[0];

  const alerts =
    INVOICES.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length +
    TICKETS.filter((x) => x.status === 'answered').length;

  return (
    <div className={`app${open ? ' app--open' : ''}`}>
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>

      {/* The scrim only exists while the drawer is open, so it cannot swallow taps otherwise. */}
      {open && <button className="app__scrim" aria-label={t('app.closeMenu')} onClick={() => setOpen(false)} />}

      <aside className="app__side" aria-label={t('acc.title')}>
        <div className="app__brand">
          <Link className="app__brand-link" to="/account">
            <span className="app__mark" aria-hidden="true">
              SWS
            </span>
            <span className="app__brand-text">
              <span className="app__brand-name">Somion</span>
              <span className="app__brand-sub">{t('app.workspace')}</span>
            </span>
          </Link>
          <button
            type="button"
            className="app__side-close"
            onClick={() => setOpen(false)}
            aria-label={t('app.closeMenu')}
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="app__nav">
          {groups.map((g) => (
            <div className="app__group" key={g.label}>
              <p className="app__group-label">{t(g.label as never)}</p>
              <ul>
                {g.items.map((s) => (
                  <li key={s.to}>
                    <NavLink
                      className="app__link"
                      to={s.to}
                      end={s.end}
                      onClick={() => setOpen(false)}
                    >
                      <span className="app__link-icon" aria-hidden="true">
                        {s.icon}
                      </span>
                      <span className="app__link-label">{t(s.key as never)}</span>
                      {s.badge ? (
                        <span className="app__link-badge serial">{s.badge}</span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="app__user">
          <span className="app__avatar" aria-hidden="true">
            {initials}
          </span>
          <span className="app__user-text">
            <span className="app__user-name">{name}</span>
            <span className="app__user-mail">
              <bdi>{ACCOUNT.email}</bdi>
            </span>
          </span>
          <Link className="app__signout" to="/login" aria-label={t('app.signOut')} title={t('app.signOut')}>
            <IconSignOut size={17} />
          </Link>
        </div>
      </aside>

      <div className="app__body">
        <header className="app__bar">
          <button
            type="button"
            className="app__menu"
            onClick={() => setOpen(true)}
            aria-label={t('app.menu')}
            aria-expanded={open}
          >
            <IconMenu size={20} />
          </button>

          {/*
            The bar names where you are in the application. On a detail screen that is the
            trail; on a section screen it is the section, taken from the navigation rather
            than from the title — the dashboard's title is a greeting, and echoing it here
            would print the same words twice within sixty pixels.
          */}
          <div className="app__where">
            {crumbs && crumbs.length > 0 ? (
              <nav className="app__crumbs" aria-label={t('a11y.breadcrumb')}>
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`}>
                    {c.to ? <NavLink to={c.to}>{c.label}</NavLink> : <span>{c.label}</span>}
                    {i < crumbs.length - 1 && (
                      <span className="app__crumbs-sep" aria-hidden="true">
                        /
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            ) : (
              <span className="app__where-title">{section ?? title}</span>
            )}
          </div>

          <div className="app__tools">
            <label className="app__select">
              <IconLang size={16} />
              <span className="u-visually-hidden">{t('a11y.language')}</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <IconChevron size={13} />
            </label>

            <label className="app__select app__select--currency">
              <span className="u-visually-hidden">{t('currency.label')}</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <IconChevron size={13} />
            </label>

            <button
              type="button"
              className="app__icon-btn"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}
              title={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}
            >
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>

            <NavLink
              className="app__icon-btn app__bell"
              to="/account/announcements"
              aria-label={t('app.notifications')}
              title={t('app.notifications')}
            >
              <IconBell size={18} />
              {alerts > 0 && (
                <span className="app__dot serial" aria-hidden="true">
                  {alerts}
                </span>
              )}
            </NavLink>

            <Link className="app__exit" to="/">
              <IconExternal size={15} />
              <span className="app__exit-label">{t('app.backToSite')}</span>
            </Link>
          </div>
        </header>

        <main id="main" className="app__main" tabIndex={-1} key={pathname}>
          <div className="app__head">
            <div>
              <h1 className="app__title">{title}</h1>
              {lede && <p className="app__lede">{lede}</p>}
            </div>
            {actions && <div className="app__head-actions">{actions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
