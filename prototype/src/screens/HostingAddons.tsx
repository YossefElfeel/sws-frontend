import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HostingLayout } from '../components/HostingLayout';
import { DomainAddonCards } from '../components/DomainAddonCards';
import { Select } from '../components/Select';
import { useLocale } from '../lib/locale';
import { useAccountState } from '../lib/accountState';

/**
 * The add-ons tab — the three extra services that ride on a domain.
 *
 * Identity protection, DNS management and email forwarding each have a tab of their own under
 * a single domain already. This page is the other way round: one place that answers "which of
 * my domains has privacy on?" without opening three domains in turn to find out.
 *
 * Which is why the picker is at the top and not a heading. The cards below are the same three
 * cards the domain's own tab shows, from the same component, acting on the same record — the
 * switch thrown here reads as thrown there a moment later.
 */
export function HostingAddons() {
  const { t } = useLocale();
  const { domains } = useAccountState();
  const [picked, setPicked] = useState(domains[0]?.id ?? '');

  /* Falls back rather than blanking: a domain can leave the list while its id is still held. */
  const dom = domains.find((d) => d.id === picked) ?? domains[0];

  return (
    <HostingLayout
      title={t('rail.addons')}
      lede={t('hostaddon.lede')}
      crumbs={[{ label: t('nav.hosting'), to: '/hosting/shared' }, { label: t('rail.addons') }]}
    >
      {dom ? (
        <>
          <label className="field-label addon-pick">
            <span className="eyebrow">{t('hostaddon.pick')}</span>
            {/*
              The page's own direction, not the value's. The extension pickers are dir="ltr"
              because ".com" is a fragment that bidi will smudge against whatever sits beside
              it; a domain name is a whole strong-LTR run and needs no help reading. Forcing
              LTR on a field this wide only moves the value to the far end of the row from the
              label that names it, and puts the chevron on the wrong side of an Arabic page.
            */}
            <Select value={dom.id} onChange={(e) => setPicked(e.target.value)}>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </label>

          <DomainAddonCards dom={dom} />

          {/* The rest of what a domain carries is a press away. Without it this page is three
              switches with no way down into the thing they belong to. */}
          <p className="section__lede u-mt-16">
            {t('hostaddon.more')}{' '}
            <Link to={`/account/domains/${dom.id}`}>{t('hostaddon.openDomain')}</Link>
          </p>
        </>
      ) : (
        <p className="section__lede">
          {t('hostaddon.none')} <Link to="/domains">{t('rail.register')}</Link>
        </p>
      )}
    </HostingLayout>
  );
}
