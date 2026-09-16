import { useState, useEffect, useRef, type ReactNode } from 'react';
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
  IconPulse,
  IconGlobe as IconLang,
} from './icons';
import { CurrencySelect } from './CurrencySelect';
import { CookieConsent } from './CookieConsent';
import { useLocale, type Locale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { ACCOUNT, TICKETS, NOTIFICATIONS } from '../lib/account';
import { useAccountState } from '../lib/accountState';

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
  /* The badge counts what is still owed, so it has to count the editable copy — an invoice
     cancelled two screens ago is not something the sidebar should still be asking about. */
  const { invoices } = useAccountState();
  const unpaid = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length;
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
        // Spec 5.5 puts network status in the client area, beside support — C-41.
        { to: '/account/status', icon: <IconPulse size={17} />, key: 'acc.status' },
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

/**
 * Which navigation groups are open, remembered for as long as the tab is. It lives outside
 * the component because the shell remounts on every navigation, and a group the reader had
 * just closed would otherwise spring open under the very click that used it.
 *
 * `null` is "the reader has not said", which is not the same as "the reader closed all four"
 * — it is what lets the column open every group on arrival and still honour a column closed
 * down to one. A reload starts open again.
 */
let openedGroups: string[] | null = null;

export function AppShell({
  title,
  lede,
  crumbs,
  meta,
  actions,
  bare,
  children,
}: {
  title: string;
  lede?: string;
  crumbs?: { label: string; to?: string }[];
  /** Small facts that belong beside the title — a status tag, a kind. */
  meta?: ReactNode;
  /** Controls that belong to this screen rather than to the shell. */
  actions?: ReactNode;
  /**
   * Set by a screen that draws its own title inside its own frame.
   *
   * The default head is right for a screen made of several cards: it names the place once,
   * above whatever is below it. It is wrong for a screen that is one object — the title ends
   * up a caption floating on the page ground with the object it names sitting apart from it,
   * and the frame below opens with no idea what it holds. Such a screen takes the title into
   * the frame instead, and says so here so the shell does not print it twice.
   */
  bare?: boolean;
  children: ReactNode;
}) {
  const { t, locale, setLocale, bi } = useLocale();
  const { theme, toggleTheme } = usePrefs();
  const groups = useGroups();
  const [open, setOpen] = useState(false);
  // Open on arrival. A column that greets you shut is four labels and no navigation: every
  // reader pays a click before the product has a menu at all, and the one link they came for
  // is behind a guess about which of four words contains it. The groups stay collapsible, so
  // a reader who has finished with billing can shut it and keep it shut.
  const [openGroups, setOpenGroups] = useState<string[]>(
    () => openedGroups ?? groups.map((g) => g.label),
  );
  const [bell, setBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // A panel that opens on a bell has to close on the next thing you do, or it follows you
  // around the app. Escape and any click outside it both count.
  useEffect(() => {
    if (!bell) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBell(false);
    const onDown = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setBell(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [bell]);

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => {
      const next = prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label];
      openedGroups = next;
      return next;
    });

  const name = bi(ACCOUNT.name);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  // Longest match wins, so /account/services/svc-1 resolves to Services rather than to the
  // dashboard's own /account.
  const current = (s: Section) => (s.end ? pathname === s.to : pathname.startsWith(s.to));
  const section = groups
    .flatMap((g) => g.items)
    .filter(current)
    .sort((a, b) => b.to.length - a.to.length)
    .map((s) => t(s.key as never))[0];

  const unread = NOTIFICATIONS.filter((n) => !n.read);

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
              <span className="app__brand-name">Orgtik</span>
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
          {groups.map((g) => {
            const id = `nav-${g.label.split('.').pop()}`;
            const isOpen = openGroups.includes(g.label);
            // A count is the reason to open a section, so a closed section still carries it —
            // collapsing the column must not hide the two things that are waiting.
            const waiting = g.items.reduce((n, s) => n + (s.badge ?? 0), 0);
            return (
              <div
                className={`app__group${isOpen ? ' is-open' : ''}${
                  g.items.some(current) ? ' is-here' : ''
                }`}
                key={g.label}
              >
                <button
                  type="button"
                  className="app__group-label"
                  aria-expanded={isOpen}
                  aria-controls={id}
                  onClick={() => toggleGroup(g.label)}
                >
                  <span className="app__group-text">{t(g.label as never)}</span>
                  {!isOpen && waiting > 0 && (
                    <span className="app__link-badge serial">{waiting}</span>
                  )}
                  <IconChevron size={14} className="app__group-chev" />
                </button>
                {/* Hidden rather than unmounted: the links stay in the document, so the group
                    is one control away and find-in-page still reaches them. */}
                <ul id={id} hidden={!isOpen}>
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
            );
          })}
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

            <CurrencySelect variant="app" />

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

            {/* C-36: the bell opens what it counts. Sending it to the announcements page
                instead — which is a different list — was the old behaviour and it meant the
                count and the destination never agreed. */}
            <div className="app__bellwrap" ref={bellRef}>
              <button
                type="button"
                className="app__icon-btn"
                onClick={() => setBell((v) => !v)}
                aria-label={t('app.notifications')}
                title={t('app.notifications')}
                aria-expanded={bell}
                aria-haspopup="true"
              >
                <IconBell size={18} />
                {unread.length > 0 && (
                  <span className="app__dot serial" aria-hidden="true">
                    {unread.length}
                  </span>
                )}
              </button>

              {bell && (
                <div className="notifs" role="dialog" aria-label={t('app.notifications')}>
                  <div className="notifs__head">
                    <h2 className="notifs__title">{t('app.notifications')}</h2>
                    <Link
                      className="card__more"
                      to="/account/notifications"
                      onClick={() => setBell(false)}
                    >
                      {t('notif.settings')}
                    </Link>
                  </div>

                  {NOTIFICATIONS.length > 0 ? (
                    <ul className="notifs__list">
                      {NOTIFICATIONS.map((n) => (
                        <li key={n.id}>
                          <Link
                            className={`notifs__item${n.read ? '' : ' is-unread'}`}
                            to={n.to}
                            onClick={() => setBell(false)}
                          >
                            <span className="notifs__dot" aria-hidden="true" />
                            <span className="notifs__text">
                              <span className="notifs__label">{t(n.titleKey as never)}</span>
                              <span className="notifs__at serial">
                                <bdi>{n.at}</bdi>
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="notifs__empty">{t('notif.none')}</p>
                  )}
                </div>
              )}
            </div>

            <Link className="app__exit" to="/">
              <IconExternal size={15} />
              <span className="app__exit-label">{t('app.backToSite')}</span>
            </Link>
          </div>
        </header>

        <main id="main" className="app__main" tabIndex={-1} key={pathname}>
          {!bare && (
            <div className="app__head">
              <div>
                <h1 className="app__title">{title}</h1>
                {lede && <p className="app__lede">{lede}</p>}
                {meta && <div className="app__meta">{meta}</div>}
              </div>
              {actions && <div className="app__head-actions">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>

      {/*
        Consent is owed to whoever arrives first, and they do not always arrive through the
        marketing site. This lived only in Layout, so a first-time visitor opening a link from a
        WHMCS notification mail — an invoice, a ticket reply, an expiry notice, which is the
        ordinary way anyone reaches these 42 screens — was never asked. It reads the same stored
        answer as the marketing bar, so answering it in either place answers it in both, and
        neither shows it twice.
      */}
      <CookieConsent />
    </div>
  );
}
