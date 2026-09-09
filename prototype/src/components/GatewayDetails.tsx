import { IconExternal, IconShield } from './icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { formatAmount, type Gateway } from '../lib/catalog';
import { PAYMENT_METHODS_SAVED } from '../lib/account';

/**
 * What a payment method needs to say once it is chosen — spec 11, O-07.
 *
 * Three shapes, and they are not interchangeable: a card is entered here, a redirect leaves
 * for the provider's page and comes back, a transfer is money sent by hand that has to carry
 * a reference. The panel changes with the choice rather than being one form with the wrong
 * fields for four of five methods — which was the version that showed card boxes to someone
 * paying by bank transfer.
 *
 * `compact` is the invoice sidebar: no card boxes, because the card is entered on the next
 * screen, only what the person needs to know before pressing Pay.
 */
export function GatewayDetails({
  gateway,
  amountMinor,
  reference,
  compact = false,
}: {
  gateway: Gateway;
  /** Minor units in the active currency — already converted, like every cart figure. */
  amountMinor?: number;
  reference?: string;
  compact?: boolean;
}) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const primary = PAYMENT_METHODS_SAVED.find((m) => m.primary);

  return (
    <div className="pay-details" data-flow={gateway.flow}>
      <p className="card__body">{t(gateway.instructionsKey as never)}</p>

      {gateway.flow === 'inline' &&
        (compact ? (
          primary && (
            <p className="hint">
              {t('pay.savedCard')}:{' '}
              <span className="serial">
                <bdi>
                  {primary.kind} •••• {primary.last4}
                </bdi>
              </span>
            </p>
          )
        ) : (
          <>
            <p className="secure-note">
              <IconShield size={16} />
              {t('pay.secure')}
            </p>
            {/*
              The card number, expiry and CVC belong to Stripe and render inside its iframe, so
              this panel does not draw them. It drew them until now — three inputs with real
              placeholders — which is the exact thing DESIGN.md forbids and for the exact reason
              it gives: a screenshot of invented card fields gets reviewed as though it were the
              real screen. Marked as a slot, matching CardEntry in screens/Order.tsx, which had
              this right already.
            */}
            <div className="slot" role="group" aria-label={t('card.slotLabel')}>
              <span className="slot__tag">{t('card.slotTag')}</span>
              <p className="slot__note">{t('card.slotNote')}</p>
            </div>
          </>
        ))}

      {gateway.flow === 'redirect' && (
        <p className="hint pay-details__redirect">
          <IconExternal size={15} />
          {t('pay.redirectBack')}
        </p>
      )}

      {gateway.flow === 'manual' && (
        <>
          <dl className="kv">
            {gateway.details?.map((row) => (
              <div key={row.labelKey}>
                <dt>{t(row.labelKey as never)}</dt>
                <dd className="serial">
                  <bdi>{row.value}</bdi>
                </dd>
              </div>
            ))}
            {amountMinor !== undefined && (
              <div>
                <dt>{t('col.amount')}</dt>
                <dd className="serial">
                  {formatAmount(amountMinor, locale)} {currency}
                </dd>
              </div>
            )}
          </dl>

          {/* The reference is what ties the money to the order; without it a transfer is a
              support ticket. It is either known now or promised for the next screen. */}
          {reference ? (
            <div className="u-mt-16">
              <p className="ref__label">{t('pay.reference')}</p>
              <p className="ref__code serial">
                <bdi>{reference}</bdi>
              </p>
            </div>
          ) : (
            <p className="hint">{t('pay.refLater')}</p>
          )}

          {gateway.afterKey && <p className="form__note">{t(gateway.afterKey as never)}</p>}
        </>
      )}
    </div>
  );
}
