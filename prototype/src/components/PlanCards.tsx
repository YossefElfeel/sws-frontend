import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { IconChevron } from './icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import {
  PLANS,
  planPrice,
  planListPrice,
  discountPercent,
  formatAmount,
  type Plan,
} from '../lib/catalog';
import { specText } from '../lib/specs';

/**
 * The price block on a product card, shared by shared-hosting Plans and every other family's
 * Offers — the two card types quote money in one shape or they quote it in two.
 *
 * Three parts when a promotion is running, and all three are needed: the old figure struck
 * through, the payable figure, and the percentage. A strike with no percentage leaves the
 * reader doing arithmetic on two prices in a currency they may have just switched to; a
 * percentage with no old figure asks them to take the saving on trust. The struck figure
 * carries a visually-hidden label, because a line through a number is a visual convention and
 * a screen reader announcing two prices in a row otherwise reads as a mistake.
 */
export function PlanPrice({
  amount,
  was,
  percent,
  currency,
  freeLabel,
}: {
  /** Payable, already converted, in the display currency's minor units. */
  amount: number;
  /** The same figure before the promotion, or null when there is none. */
  was?: number | null;
  /** Whole percent off, or null. */
  percent?: number | null;
  currency: string;
  /** Shown instead of a figure when the thing costs nothing. */
  freeLabel?: string;
}) {
  const { t, locale } = useLocale();
  const off = was != null && percent != null && percent > 0;

  return (
    <p className={`plan__price${off ? ' plan__price--off' : ''}`}>
      {off && (
        <s className="plan__was serial">
          <span className="u-visually-hidden">{t('plan.was')} </span>
          {formatAmount(was, locale)}
        </s>
      )}

      <span className="plan__amount serial">
        {freeLabel ?? formatAmount(amount, locale)}
      </span>
      {freeLabel === undefined && <span className="plan__currency">{currency}</span>}

      {off && (
        <span className="plan__save">
          {t('plan.save')} <span className="serial">{percent}%</span>
        </span>
      )}
    </p>
  );
}

/**
 * The "Additional Features" block — spec 6.2's separator and the list beneath it, with the
 * list behind a disclosure.
 *
 * The list was the tallest thing on the card and the least read: a person comparing four plans
 * compares the name, the price and the specification, and meets seven lines of "24/7 Support"
 * four times over on the way to the button. Closed, the card opens at the height of the
 * comparison; open, nothing is lost.
 *
 * The separator is the control rather than a control sitting under the separator — one line
 * instead of two, and the thing that names the section is the thing that opens it.
 */
export function PlanExtras({ items }: { items: string[] }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const id = useId();

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="plan__divider plan__divider--button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {t('plan.additional')}
          <IconChevron size={14} className={open ? 'plan__chevron plan__chevron--up' : 'plan__chevron'} />
        </span>
      </button>

      <ul className="plan__extras" id={id} hidden={!open}>
        {items.map((f) => (
          <li key={f}>{specText(f, locale)}</li>
        ))}
      </ul>
    </>
  );
}

/**
 * Plan cards, following spec 6.2: name, price and cycle, the main feature list, a separator,
 * an "Additional Features" sub-list, and an Order Now button — with the Featured badge on the
 * plan the spec marks (Ultra).
 *
 * Ordering opens Configure rather than dropping straight into the cart, because the spec's
 * flow is product → configure → domain → cart → checkout, and the add-ons and billing cycle
 * are chosen at the configure step.
 *
 * The grid sizes itself from the space it is in rather than from the window — see the
 * container query on `.plans-frame`. On this page the cards sit beside a 240px rail inside a
 * 1200px shell, which left four of them 196px wide apiece: a price list nobody could read
 * because the breakpoint was measuring a window the cards were not in.
 */
export function PlanCards({ plans = PLANS }: { plans?: Plan[] }) {
  const { t } = useLocale();
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
    <div className="plans-frame">
      <ul className="plans">
        {plans.map((plan) => (
          <li key={plan.id} className={`plan${plan.featured ? ' plan--featured' : ''}`}>
            {plan.featured && <span className="plan__flag">{t('plan.featured')}</span>}

            <h3 className="plan__name">{plan.name}</h3>

            <PlanPrice
              amount={planPrice(plan, 'monthly', currency)}
              was={planListPrice(plan, 'monthly', currency)}
              percent={discountPercent(plan)}
              currency={currency}
            />
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

            <PlanExtras items={plan.additional} />

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
    </div>
  );
}
