import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AccountLayout } from './AccountLayout';
import { RailGroup } from './RailGroup';
import { Tag, DOMAIN_TONE } from './Tag';
import { IconArrow, IconPlus } from './icons';
import { useLocale } from '../lib/locale';
import type { DomainRecord } from '../lib/account';

/** The eight pages a domain has, in the order the reference sidebar lists them. */
const PAGES: { slug: string; key: string }[] = [
  { slug: '', key: 'dom.overview' },
  { slug: 'nameservers', key: 'dom.nameservers' },
  { slug: 'dns', key: 'dom.dns' },
  { slug: 'contacts', key: 'dom.contacts' },
  { slug: 'private-ns', key: 'dom.privateNs' },
  { slug: 'addons', key: 'dom.addons' },
  { slug: 'forwarding', key: 'dom.forwarding' },
  { slug: 'transfer-out', key: 'dom.transferOut' },
];

/**
 * The frame every domain page shares — C-10.
 *
 * A domain has more to manage than one screen holds: four contact records alone are forty
 * fields. So it is eight flat routes with a rail, the same `.with-rail` idiom the hosting
 * categories use, brought inside the application shell. Under 900px the rail is a strip of
 * chips, and the route change scrolls it to the active one.
 *
 * The actions group repeats what the domains list offers, because the person on a domain
 * page is the person about to renew it.
 */
export function DomainPage({
  dom,
  sectionKey,
  children,
}: {
  dom: DomainRecord;
  sectionKey: string;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const base = `/account/domains/${dom.id}`;
  const overview = sectionKey === 'dom.overview';

  return (
    <AccountLayout
      title={dom.name}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.domains'), to: '/account/domains' },
        overview ? { label: dom.name } : { label: dom.name, to: base },
        ...(overview ? [] : [{ label: t(sectionKey as never) }]),
      ]}
      meta={<Tag tone={DOMAIN_TONE[dom.status]}>{t(`dom.${dom.status}` as never)}</Tag>}
      actions={
        <Link className="btn btn--md btn--primary" to={`/account/renew/${dom.id}`}>
          {t('dom.renew')}
        </Link>
      }
    >
      <div className="with-rail with-rail--domain">
        {/*
          The same two menus the hosting rail was split into, for the same reason: the eight
          pages are where you are inside this domain, and the three actions are errands — one of
          them renews this domain, and the other two leave it behind for a different one.

          What is different here is what the split can be made of. In the client area the rail
          keeps no box of its own — the ground is already the recessed tint and the cards are
          what lifts off it — so two panels would be two invisible boxes and would separate
          nothing. The divide is a rule instead, which is furniture rather than merchandise and
          is what this room uses anyway.
        */}
        <div className="rail-stack">
          <aside className="rail rail--domain" aria-label={t('svc.manage')}>
            <RailGroup id="domain-manage" label={t('svc.manage')}>
              {PAGES.map((p) => (
                <li key={p.slug}>
                  <NavLink className="rail__link" to={p.slug ? `${base}/${p.slug}` : base} end={!p.slug}>
                    {t(p.key as never)}
                  </NavLink>
                </li>
              ))}
            </RailGroup>
          </aside>

          <aside className="rail rail--domain" aria-label={t('rail.actions')}>
            <RailGroup id="domain-actions" label={t('rail.actions')}>
              <li>
                <Link className="rail__link" to={`/account/renew/${dom.id}`}>
                  <IconArrow size={15} />
                  {t('dom.renew')}
                </Link>
              </li>
              <li>
                <Link className="rail__link" to="/domains">
                  <IconPlus size={15} />
                  {t('rail.register')}
                </Link>
              </li>
              <li>
                <Link className="rail__link" to="/transfer">
                  <IconArrow size={15} />
                  {t('rail.transfer')}
                </Link>
              </li>
            </RailGroup>
          </aside>
        </div>

        <div className="with-rail__body">{children}</div>
      </div>
    </AccountLayout>
  );
}
