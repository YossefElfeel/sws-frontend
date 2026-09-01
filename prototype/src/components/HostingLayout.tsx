import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Layout } from './Layout';
import { IconCart, IconArrow } from './icons';
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
  children,
}: {
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  const { t } = useLocale();

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{title}</h1>
        {lede && <p className="section__lede measure">{lede}</p>}
      </section>

      <section className="section shell">
        <div className="with-rail">
          <aside className="rail" aria-label={t('rail.categories')}>
            <p className="rail__head">{t('rail.categories')}</p>
            <ul className="rail__list">
              {FAMILIES.map((f) => (
                <li key={f.id}>
                  <NavLink className="rail__link" to={f.path}>
                    {t(f.titleKey as never)}
                  </NavLink>
                </li>
              ))}
            </ul>

            <p className="rail__head">{t('rail.actions')}</p>
            <ul className="rail__list">
              <li>
                <Link className="rail__link" to="/account/domains">
                  <IconArrow size={15} />
                  {t('rail.renew')}
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
            </ul>
          </aside>

          <div className="with-rail__body">{children}</div>
        </div>
      </section>
    </Layout>
  );
}
