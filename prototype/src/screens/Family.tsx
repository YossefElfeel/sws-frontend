import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { HostingLayout } from '../components/HostingLayout';
import { PlanCards } from '../components/PlanCards';
import { Button } from '../components/Button';
import { IconCheck, IconServer } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { convert, formatAmount } from '../lib/catalog';
import { specText } from '../lib/specs';
import { FAMILIES, OFFERS, VPS, VPS_OS, type Offer } from '../lib/products';

/**
 * Every hosting category page — spec 6.2 and 6.3.
 *
 * One route serves them all because the spec says they share a template. What differs is the
 * presentation the spec asks for per family: cards for the plan-shaped families, a comparison
 * table for VPS because its options are too technical for cards, and a preview-led page for
 * Website Builder.
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
      {meta.id === 'shared' && <PlanCards />}
      {meta.layout === 'cards' && meta.id !== 'shared' && <OfferCards offers={OFFERS[meta.id] ?? []} />}
      {meta.id === 'vps' && <VpsTable />}
      {/* Spec 6.3: the preview leads, the tiers follow underneath it. */}
      {meta.id === 'builder' && (
        <>
          <BuilderPreview />
          <OfferCards offers={OFFERS.builder ?? []} />
        </>
      )}
      {meta.id === 'monitoring' && <AlertsNote />}
    </HostingLayout>
  );
}

/** The generic card grid for every family the spec presents as cards. */
function OfferCards({ offers }: { offers: Offer[] }) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const navigate = useNavigate();

  return (
    <ul className="plans">
      {offers.map((o) => (
        <li key={o.id} className={`plan${o.featured ? ' plan--featured' : ''}`}>
          {(o.featured || o.badgeKey) && (
            <span className="plan__flag">{t((o.badgeKey ?? 'plan.featured') as never)}</span>
          )}

          <h3 className="plan__name">{o.name}</h3>

          <p className="plan__price">
            <span className="plan__amount serial">
              {o.monthlyUsdMinor === 0
                ? t('configure.free')
                : formatAmount(convert(o.monthlyUsdMinor, currency), locale)}
            </span>
            {o.monthlyUsdMinor > 0 && <span className="plan__currency">{currency}</span>}
          </p>
          <p className="plan__cycle">{t('cycle.monthly')}</p>

          <ul className="plan__specs">
            {o.specs.map((sp) => (
              <li key={sp}>
                <IconCheck size={16} />
                {specText(sp, locale)}
              </li>
            ))}
          </ul>

          {o.extras && o.extras.length > 0 && (
            <>
              <p className="plan__divider">
                <span>{t('plan.additional')}</span>
              </p>
              <ul className="plan__extras">
                {o.extras.map((e) => (
                  <li key={e}>{specText(e, locale)}</li>
                ))}
              </ul>
            </>
          )}

          <Button
            size="lg"
            variant={o.featured ? 'primary' : 'secondary'}
            onClick={() => navigate('/cart')}
          >
            {t('plan.orderNow')}
          </Button>
        </li>
      ))}
    </ul>
  );
}

/** Spec 6.3: VPS compares on specification, so it is a table rather than four cards. */
function VpsTable() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const navigate = useNavigate();

  return (
    <>
      <div className="panel table-scroll">
        <table className="data">
          <caption className="u-visually-hidden">{t('vps.compare')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('col.item')}</th>
              <th scope="col" className="num">{t('vps.cpu')}</th>
              <th scope="col" className="num">{t('vps.ram')}</th>
              <th scope="col" className="num">{t('vps.disk')}</th>
              <th scope="col" className="num">{t('vps.bw')}</th>
              <th scope="col" className="num">{t('col.amount')}</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {VPS.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="lead">{row.name}</span>
                  {row.featured && <span className="tag tag--ok">{t('plan.featured')}</span>}
                </td>
                <td className="num">{row.vcpu}</td>
                <td className="num">{row.ramGb} GB</td>
                <td className="num">{row.storageGb} GB</td>
                <td className="num">{row.bandwidthTb} TB</td>
                <td className="num">
                  {formatAmount(convert(row.monthlyUsdMinor, currency), locale)} {currency}
                </td>
                <td className="num">
                  <Button
                    size="sm"
                    variant={row.featured ? 'primary' : 'secondary'}
                    onClick={() => navigate('/cart')}
                  >
                    {t('plan.orderNow')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <fieldset className="fieldset os-choice">
        <legend>{t('vps.os')}</legend>
        <div className="methods">
          {VPS_OS.map((os, i) => (
            <label className={`method${i === 0 ? ' is-selected' : ''}`} key={os}>
              <input type="radio" name="os" defaultChecked={i === 0} />
              <span className="method__label">{os}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

/** Spec 6.3: Website Builder leads with a preview, not a price list. */
function BuilderPreview() {
  const { t } = useLocale();
  const navigate = useNavigate();

  return (
    <div className="builder">
      <div className="builder__frame" role="img" aria-label={t('builder.preview')}>
        <span className="builder__bar" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="builder__canvas" aria-hidden="true">
          <span className="builder__block builder__block--hero" />
          <span className="builder__row">
            <span className="builder__block" />
            <span className="builder__block" />
            <span className="builder__block" />
          </span>
          <span className="builder__block builder__block--wide" />
        </span>
      </div>

      <div className="builder__side">
        <h2 className="card__title">{t('builder.preview')}</h2>
        <p className="card__body">{t('builder.previewNote')}</p>
        <Button size="lg" onClick={() => navigate('/cart')}>
          {t('builder.try')}
        </Button>
      </div>
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
