import { Link } from 'react-router-dom';
import { HostingLayout } from '../components/HostingLayout';
import { IconShield, IconSpark, IconPulse, IconArrow } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { convert, formatAmount, ADDONS } from '../lib/catalog';

/**
 * The add-ons a hosting plan can carry — spec 7.2's third step, given a page of its own.
 *
 * Until now the only place these three were described was inside the order flow, at the step
 * after somebody had already chosen a plan. That is the wrong moment to meet them for the
 * first time: a person deciding between Single and Ultra wants to know a certificate is
 * fifteen dollars a year before they are three screens into buying something, not after.
 *
 * So the rail gets a page that says what each one is, what it starts at, and where to go for
 * it — and every card leads somewhere that already sells the thing, rather than to a switch
 * this page has no plan to attach to.
 */

/** Where each add-on is actually sold. All three are pages the site already has. */
const DESTINATION: Record<string, { to: string; icon: JSX.Element }> = {
  ssl: { to: '/ssl', icon: <IconShield size={26} /> },
  builder: { to: '/builder', icon: <IconSpark size={26} /> },
  monitoring: { to: '/hosting/monitoring', icon: <IconPulse size={26} /> },
};

export function HostingAddons() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();

  return (
    <HostingLayout
      title={t('rail.addons')}
      lede={t('hostaddon.lede')}
      crumbs={[
        { label: t('nav.hosting'), to: '/hosting/shared' },
        { label: t('rail.addons') },
      ]}
    >
      <div className="addon-cards">
        {ADDONS.map((group) => {
          const dest = DESTINATION[group.id];
          /*
           * "From" is the cheapest option somebody actually pays for. Every group opens with a
           * `none` at zero and two of the three carry a free tier as well, so the lowest price
           * in the list is 0.00 for all three — a price row that says free three times, under
           * three products two of which are not.
           */
          const paid = group.options.filter((o) => o.id !== 'none' && o.priceUsdMinor > 0);
          const from = paid.reduce(
            (low, o) => (o.priceUsdMinor < low.priceUsdMinor ? o : low),
            paid[0],
          );
          const free = group.options.some((o) => o.id !== 'none' && o.priceUsdMinor === 0);

          return (
            <article className="card addon-card" key={group.id}>
              <span className="addon-card__icon" aria-hidden="true">
                {dest.icon}
              </span>
              <h2 className="addon-card__name">{t(group.titleKey as never)}</h2>
              <p className="addon-card__note">{t(group.bodyKey as never)}</p>
              <p className="addon-card__price serial">
                {t('hostaddon.from')}{' '}
                <bdi>
                  {formatAmount(convert(from.priceUsdMinor, currency), locale)} {currency}
                </bdi>{' '}
                {t(from.per === 'year' ? 'dom.perYear' : 'cycle.perMonth')}
              </p>

              {/* A free tier is a reason to look, so it is said on the card rather than found
                  two screens in. It is not the price, which is why it is not in the price. */}
              <p className="addon-card__state">
                {free && <span className="tag tag--ok">{t('hostaddon.freeTier')}</span>}
              </p>

              <div className="addon-card__acts">
                <Link className="btn btn--md btn--primary" to={dest.to}>
                  {t('hostaddon.see')}
                  <IconArrow size={15} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* The other half of the answer: these attach to a plan, and the plans are one press
          away. Without it the page is a shop window with no door back into the shop. */}
      <p className="section__lede u-mt-16">
        {t('hostaddon.withPlan')}{' '}
        <Link to="/hosting/shared">{t('hostaddon.seePlans')}</Link>
      </p>
    </HostingLayout>
  );
}
