import { Button } from './Button';
import { IconCheck, IconServer, IconMail, IconGauge } from './icons';
import { useLocale } from '../lib/locale';
import { useCart } from '../lib/cart';
import { formatAmount, type Plan } from '../lib/catalog';

/**
 * Pricing cards.
 *
 * One card carries the recommended flag. The renewal figure sits on the card itself rather
 * than in the terms — a first-year price with the real price hidden below the fold is the
 * single most common way a hosting invoice surprises someone, and it is the thing this
 * product is trying not to do.
 */
export function PlanCards({
  plans,
  featured,
  onOrder,
  ordered,
}: {
  plans: Plan[];
  featured?: string;
  onOrder: (planId: string) => void;
  ordered: Set<string>;
}) {
  const { t, locale } = useLocale();
  const { currency, cycle } = useCart();

  return (
    <ul className="plans">
      {plans.map((plan) => {
        const isFeatured = plan.id === featured;
        const isOrdered = ordered.has(plan.id);

        // Arabic agreement: singular at 1, dual at 2, plural at 3–10. English collapses all
        // of that to one plural, which is how a single key ends up reading as translated.
        const sites =
          plan.sites === 'unmetered'
            ? t('res.unmetered')
            : plan.sites === 1
              ? t('res.site')
              : plan.sites === 2
                ? t('res.sites.dual')
                : `${plan.sites} ${t('res.sites.plural')}`;

        return (
          <li key={plan.id} className={`plan${isFeatured ? ' plan--featured' : ''}`}>
            {isFeatured && <span className="plan__flag">{t('plan.recommended')}</span>}

            <h3 className="plan__name">{plan.name}</h3>

            <p className="plan__price">
              <span className="plan__amount serial">
                {formatAmount(plan.price[currency][cycle], locale)}
              </span>
              <span className="plan__currency">{currency}</span>
              <span className="plan__cycle">
                / {t(cycle === 'monthly' ? 'cycle.perMonth' : 'cycle.perYear')}
              </span>
            </p>

            {/* Renewal on the card, not in the terms. */}
            <p className="plan__renewal">{t('plan.renewalSame')}</p>

            <ul className="plan__specs">
              <li>
                <IconServer size={17} />
                {sites}
              </li>
              <li>
                <IconGauge size={17} />
                <span className="serial">{plan.storageGb} GB</span> {t('res.storage')}
              </li>
              <li>
                <IconGauge size={17} />
                {plan.bandwidthTb === 'unmetered' ? (
                  t('res.unmetered')
                ) : (
                  <>
                    <span className="serial">{plan.bandwidthTb} {t('res.tb')}</span>{' '}
                    {t('res.bandwidth')}
                  </>
                )}
              </li>
              <li>
                <IconMail size={17} />
                {plan.mailboxes === 'unmetered' ? (
                  t('res.unmetered')
                ) : (
                  <>
                    <span className="serial">{plan.mailboxes}</span> {t('res.mail')}
                  </>
                )}
              </li>
              {plan.freeDomain && (
                <li className="plan__perk">
                  <IconCheck size={17} />
                  {t('res.freedomain')}
                </li>
              )}
            </ul>

            <Button
              size="lg"
              variant={isFeatured ? 'primary' : 'secondary'}
              disabled={isOrdered}
              onClick={() => onOrder(plan.id)}
              aria-label={`${isOrdered ? t('action.ordered') : t('action.order')} — ${plan.name}`}
            >
              {isOrdered && <IconCheck size={17} />}
              {isOrdered ? t('action.ordered') : t('action.order')}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

/** Billing-cycle switch. */
export function CycleSwitch() {
  const { t } = useLocale();
  const { cycle, setCycle } = useCart();

  return (
    <div className="cycle" role="group" aria-label={t('col.term')}>
      {(['monthly', 'annually'] as const).map((c) => (
        <button
          key={c}
          type="button"
          className={`cycle__option${cycle === c ? ' is-active' : ''}`}
          aria-pressed={cycle === c}
          onClick={() => setCycle(c)}
        >
          {t(c === 'monthly' ? 'cycle.monthly' : 'cycle.annually')}
        </button>
      ))}
      <span className="cycle__save">{t('cycle.save')}</span>
    </div>
  );
}
