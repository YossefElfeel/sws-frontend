import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { PLANS, planPrice, formatAmount, type Plan } from '../lib/catalog';
import { specText } from '../lib/specs';

/**
 * Plan cards, following spec 6.2: name, price and cycle, the main feature list, a separator,
 * an "Additional Features" sub-list, and an Order Now button — with the Featured badge on the
 * plan the spec marks (Ultra).
 *
 * Ordering opens Configure rather than dropping straight into the cart, because the spec's
 * flow is product → configure → domain → cart → checkout, and the add-ons and billing cycle
 * are chosen at the configure step.
 */
export function PlanCards({ plans = PLANS }: { plans?: Plan[] }) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const navigate = useNavigate();

  const amount = (n: number | 'unlimited', unitKey: string) =>
    n === 'unlimited' ? (
      <>
        {t('plan.unlimited')} {t(unitKey as never)}
      </>
    ) : (
      <>
        <span className="serial">{n}</span> {t(unitKey as never)}
      </>
    );

  return (
    <ul className="plans">
      {plans.map((plan) => (
        <li key={plan.id} className={`plan${plan.featured ? ' plan--featured' : ''}`}>
          {plan.featured && <span className="plan__flag">{t('plan.featured')}</span>}

          <h3 className="plan__name">{plan.name}</h3>

          <p className="plan__price">
            <span className="plan__amount serial">
              {formatAmount(planPrice(plan, 'monthly', currency), locale)}
            </span>
            <span className="plan__currency">{currency}</span>
          </p>
          <p className="plan__cycle">{t('cycle.monthly')}</p>

          <ul className="plan__specs">
            <li>
              {plan.sites === 'unlimited'
                ? `${t('plan.unlimited')} ${t('plan.websites')}`
                : plan.sites === 1
                  ? t('plan.website')
                  : plan.sites === 2
                    ? t('plan.websitesDual')
                    : `${plan.sites} ${t('plan.websites')}`}
            </li>
            <li>
              {plan.storageGb === 'unlimited' ? (
                <>
                  {t('plan.unlimited')} {t('plan.storage')}
                </>
              ) : (
                <>
                  <span className="serial">{plan.storageGb} GB</span> {t('plan.storage')}
                </>
              )}
            </li>
            <li>
              {plan.bandwidthGb === 'unlimited' ? (
                <>
                  {t('plan.unlimited')} {t('plan.bandwidth')}
                </>
              ) : (
                <>
                  <span className="serial">{plan.bandwidthGb} GB</span> {t('plan.bandwidth')}
                </>
              )}
            </li>
            <li>{amount(plan.subdomains, 'plan.subdomains')}</li>
            <li>{amount(plan.mailboxes, 'plan.email')}</li>
            {plan.freeDomainFirstYear && (
              <li className="plan__perk">{t('plan.freeDomain')}</li>
            )}
          </ul>

          {/* Spec 6.2: a separator, then the additional features beneath it. */}
          <p className="plan__divider">
            <span>{t('plan.additional')}</span>
          </p>

          <ul className="plan__extras">
            {plan.additional.map((f) => (
              <li key={f}>{specText(f, locale)}</li>
            ))}
          </ul>

          <Button
            size="lg"
            variant={plan.featured ? 'primary' : 'secondary'}
            onClick={() => navigate(`/configure/${plan.id}`)}
          >
            {t('plan.orderNow')}
          </Button>
        </li>
      ))}
    </ul>
  );
}
