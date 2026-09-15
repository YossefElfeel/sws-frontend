import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Layout } from './Layout';
import { RailGroup } from './RailGroup';
import { IconCart, IconArrow, IconPlus } from './icons';
import { useLocale } from '../lib/locale';
import { FAMILIES } from '../lib/products';

/**
 * The hosting category shell — spec 6.2.
 *
 * A side menu listing every hosting category, plus an Actions block (renew a domain, register
 * a new one, transfer, view cart). The menu is direction-aware by virtue of logical
 * properties, which is what the spec means by "right/left according to language direction".
 */
export function HostingLayout({
  title,
  lede,
  crumbs,
  children,
}: {
  title: string;
  lede?: string;
  /** A trail, for the pages that sit under a category rather than beside one. */
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
              <span key={`${c.label}-${i}`}>
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
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
          {/*
            Two menus, not one menu with two headings.

            The categories are where you are — eight pages, one of them the one you are reading.
            The actions are things you go and do, and three of the four leave this section of the
            site entirely. In a single panel the twelve links read as one list that happened to
            have a label in the middle of it, and the reader had nothing but that label telling
            them the second half was a different kind of thing. Two panels say it before the
            labels are read at all.

            Each is its own landmark too, so the categories and the actions are two things to a
            screen reader as well as to an eye — which the one panel labelled "Categories", with
            the actions inside it, was not.
          */}
          <div className="rail-stack">
            <aside className="rail" aria-label={t('rail.categories')}>
              <RailGroup id="hosting-categories" label={t('rail.categories')}>
                {FAMILIES.map((f) => (
                  <li key={f.id}>
                    <NavLink className="rail__link" to={f.path}>
                      {t(f.titleKey as never)}
                    </NavLink>
                  </li>
                ))}
              </RailGroup>
            </aside>

            <aside className="rail" aria-label={t('rail.actions')}>
              <RailGroup id="hosting-actions" label={t('rail.actions')}>
                {/*
                  First, and a NavLink rather than a Link. It is the one action that stays in
                  this section — the other three leave it — so it is the one the rail can mark
                  as where you are, and a reader who followed it should not have to guess which
                  of the twelve links they are standing on.
                */}
                <li>
                  <NavLink className="rail__link" to="/hosting/addons">
                    <IconPlus size={15} />
                    {t('rail.addons')}
                  </NavLink>
                </li>
                <li>
                  <Link className="rail__link" to="/domains/pricing">
                    <IconArrow size={15} />
                    {t('rail.pricing')}
                  </Link>
                </li>
                <li>
                  <Link className="rail__link" to="/domains">
                    <IconArrow size={15} />
                    {t('rail.register')}
                  </Link>
                </li>
                <li>
                  <Link className="rail__link" to="/transfer">
                    <IconArrow size={15} />
                    {t('rail.transfer')}
                  </Link>
                </li>
                <li>
                  <Link className="rail__link" to="/cart">
                    <IconCart size={15} />
                    {t('rail.viewCart')}
                  </Link>
                </li>
              </RailGroup>
            </aside>
          </div>

          <div className="with-rail__body">{children}</div>
        </div>
      </section>
    </Layout>
  );
}
