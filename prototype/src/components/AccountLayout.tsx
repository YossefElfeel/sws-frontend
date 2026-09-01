import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Layout } from './Layout';
import {
  IconGauge,
  IconServer,
  IconGlobe,
  IconInvoice,
  IconSupport,
  IconBook,
  IconMegaphone,
  IconUsers,
  IconShield,
} from './icons';
import { useLocale } from '../lib/locale';

/**
 * The client-area shell — spec 5.4 and 9.
 *
 * One rail covering every section the spec lists, so a client can reach any of them from any
 * of them. It carries the same header, type and accent as the marketing pages: the build plan
 * names the move between the two halves as where trust is lost, and it only survives if they
 * read as one product.
 */
const SECTIONS = [
  { to: '/account', end: true, icon: <IconGauge size={17} />, key: 'acc.dashboard' },
  { to: '/account/services', icon: <IconServer size={17} />, key: 'acc.services' },
  { to: '/account/domains', icon: <IconGlobe size={17} />, key: 'acc.domains' },
  { to: '/account/invoices', icon: <IconInvoice size={17} />, key: 'acc.invoices' },
  { to: '/account/funds', icon: <IconInvoice size={17} />, key: 'acc.funds' },
  { to: '/account/payment-methods', icon: <IconInvoice size={17} />, key: 'acc.methods' },
  { to: '/account/tickets', icon: <IconSupport size={17} />, key: 'acc.tickets' },
  { to: '/account/knowledgebase', icon: <IconBook size={17} />, key: 'acc.kb' },
  { to: '/account/announcements', icon: <IconMegaphone size={17} />, key: 'acc.news' },
  { to: '/account/affiliates', icon: <IconUsers size={17} />, key: 'acc.affiliates' },
  { to: '/account/contacts', icon: <IconUsers size={17} />, key: 'acc.contacts' },
  { to: '/account/security', icon: <IconShield size={17} />, key: 'acc.security' },
];

export function AccountLayout({
  title,
  lede,
  crumbs,
  children,
}: {
  title: string;
  lede?: string;
  crumbs?: { label: string; to?: string }[];
  children: ReactNode;
}) {
  const { t } = useLocale();

  return (
    <Layout>
      <section className="page-head shell">
        {crumbs && crumbs.length > 0 && (
          <nav className="crumbs" aria-label={t('a11y.breadcrumb')}>
            {crumbs.map((c, i) => (
              <span key={c.label}>
                {c.to ? <NavLink to={c.to}>{c.label}</NavLink> : <span>{c.label}</span>}
                {i < crumbs.length - 1 && (
                  <span className="crumbs__sep" aria-hidden="true">
                    /
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {lede && <p className="section__lede measure">{lede}</p>}
      </section>

      <section className="section shell">
        <div className="with-rail">
          <aside className="rail" aria-label={t('acc.title')}>
            <ul className="rail__list">
              {SECTIONS.map((s) => (
                <li key={s.to}>
                  <NavLink className="rail__link" to={s.to} end={s.end}>
                    {s.icon}
                    {t(s.key as never)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </aside>

          <div className="with-rail__body">{children}</div>
        </div>
      </section>
    </Layout>
  );
}
