import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { HostingLayout } from '../components/HostingLayout';
import { PlanCards, PlanPrice, PlanExtras } from '../components/PlanCards';
import { Button } from '../components/Button';
import { IconCheck, IconServer } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { convert, discountPercent } from '../lib/catalog';
import { specText } from '../lib/specs';
import { FAMILIES, OFFERS, type Offer } from '../lib/products';

/**
 * Every hosting category page — spec 6.2 and 6.3.
 *
 * One route serves them all because the spec says they share a template, and they now share
 * the presentation too: every family is a row of price cards.
 *
 * VPS was the last holdout — a six-column comparison table, on the spec's reasoning that its
 * options are too technical for cards. What that produced was a page nobody arrived expecting:
 * the plan name in a first column, the price five columns along it, a button in a seventh, and
 * none of it where the same reader had just met them on shared hosting, WordPress or cloud.
 * The comparison survives the move — four servers, four specification lines, read down the row
 * instead of across it — and the parts that make a price list decidable come back with it: the
 * price at card size, the featured server visibly marked, one full-width button per plan.
 *
 * Website Builder went the same way earlier: spec 6.3 asks it to lead with a template preview,
 * and it did — a drawn wireframe beside a card offering a free trial. Both are gone at the
 * product owner's request. The drawing was the reason to keep it and the reason to drop it:
 * with no template set decided, it previewed nothing, and a preview of nothing at the head of
 * a pricing page is a promise the product cannot keep yet.
 */
export function Family() {
  const { t } = useLocale();
  const { family } = useParams<{ family: string }>();
  const { pathname } = useLocation();
  // /ssl and /builder are top-level routes in the spec's sitemap rather than children of
  // /hosting, so the family is read from the path when there is no route parameter.
  const meta = FAMILIES.find((f) => f.id === family) ?? FAMILIES.find((f) => f.path === pathname);

  if (!meta) return <Navigate to="/hosting/shared" replace />;

  const title = t(meta.titleKey as never);
  const lede = t(meta.ledeKey as never);

  return (
    <HostingLayout title={title} lede={lede}>
      {meta.id === 'shared' ? (
        <PlanCards />
      ) : (
        <OfferCards offers={OFFERS[meta.id] ?? []} configure={meta.id === 'vps'} />
      )}
      {meta.id === 'monitoring' && <AlertsNote />}
    </HostingLayout>
  );
}

/**
 * The card grid every family but shared hosting renders through.
 *
 * `configure` is what VPS needs and nothing else here does: a server cannot be provisioned
 * without a hostname, a root password and an operating system, so its Order button opens
 * Configure the way shared hosting's does. Dropping a VPS straight into the cart would sell a
 * machine with no name and no way in.
 */
function OfferCards({ offers, configure = false }: { offers: Offer[]; configure?: boolean }) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { add } = useCart();
  const navigate = useNavigate();

  /**
   * Most of these are single-price products, so ordering puts the line in the cart and takes
   * you there — sending them to Configure, as this button used to, meant "Order now" visibly
   * did nothing. A family that has something left to decide goes to Configure instead: shared
   * hosting for its cycles and add-ons (spec 7.2), VPS for the settings its server is built
   * from.
   */
  const order = (o: Offer) => {
    if (configure) {
      navigate(`/configure/${o.id}`);
      return;
    }
    add({ plan: o, cycle: 'monthly', addons: {} });
    navigate('/cart');
  };

  return (
    <div className="plans-frame">
      <ul className="plans">
        {offers.map((o) => (
          <li key={o.id} className={`plan${o.featured ? ' plan--featured' : ''}`}>
            {(o.featured || o.badgeKey) && (
              <span className="plan__flag">{t((o.badgeKey ?? 'plan.featured') as never)}</span>
            )}

            <h3 className="plan__name">{o.name}</h3>

            <PlanPrice
              amount={convert(o.monthlyUsdMinor, currency)}
              was={o.listUsdMinor === undefined ? null : convert(o.listUsdMinor, currency)}
              percent={discountPercent(o)}
              currency={currency}
              freeLabel={o.monthlyUsdMinor === 0 ? t('configure.free') : undefined}
            />
            <p className="plan__cycle">{t('cycle.monthly')}</p>

            <ul className="plan__specs">
              {o.specs.map((sp) => (
                <li key={sp}>
                  <IconCheck size={16} />
                  {specText(sp, locale)}
                </li>
              ))}
            </ul>

            <PlanExtras items={o.extras ?? []} />

            <Button
              size="lg"
              variant={o.featured ? 'primary' : 'secondary'}
              onClick={() => order(o)}
            >
              {t('plan.orderNow')}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Spec 6.3: monitoring plans are only half the page; how alerts arrive is the other half. */
function AlertsNote() {
  const { t } = useLocale();
  return (
    <div className="notice notice--spaced">
      <IconServer size={22} />
      <div>
        <h2 className="card__title">{t('monitoring.alerts')}</h2>
        <p className="card__body">{t('monitoring.alertsBody')}</p>
      </div>
    </div>
  );
}
