import { useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconCheck, IconArrow, IconAlert, IconServer } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount, PLANS, type Cycle } from '../../lib/catalog';
import { SERVICES } from '../../lib/account';
import { prorate } from '../../lib/proration';

/** The same fixed date the dashboard counts from, so both screens agree. */
const TODAY = '2026-09-01';

/** The plan a service is currently on, matched by the product name the fixture carries. */
function currentPlan(product: string) {
  return PLANS.find((p) => p.name === product);
}

/**
 * Upgrade — plan selection (C-04, spec 9.2).
 *
 * The plan you are on is marked and cannot be chosen again, and every other plan says whether
 * taking it is a step up or down before you commit to reading the price. Downgrades are not
 * hidden: a plan you can leave is part of the offer, and hiding it only makes people open a
 * ticket to ask.
 */
export function UpgradePlan() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const svc = SERVICES.find((s) => s.id === id);

  if (!svc) return <Navigate to="/account/services" replace />;
  const from = currentPlan(svc.product);

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  return (
    <AccountLayout
      title={t('up.title')}
      lede={`${svc.product} — ${svc.domain}`}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.services'), to: '/account/services' },
        { label: svc.product, to: `/account/services/${svc.id}` },
        { label: t('up.title') },
      ]}
    >
      <ul className="plan-grid">
        {PLANS.map((p) => {
          const isCurrent = from?.id === p.id;
          const dir =
            !from || isCurrent ? null : p.monthlyUsdMinor > from.monthlyUsdMinor ? 'up' : 'down';

          return (
            <li key={p.id}>
              <div className={`pick${isCurrent ? ' pick--current' : ''}`}>
                <div className="pick__head">
                  <h2 className="pick__name">{p.name}</h2>
                  {isCurrent ? (
                    <span className="tag tag--taken">{t('up.current')}</span>
                  ) : (
                    <span className={`tag tag--${dir === 'up' ? 'ok' : 'due'}`}>
                      {t(dir === 'up' ? 'up.step' : 'up.stepDown')}
                    </span>
                  )}
                </div>

                <p className="pick__price">
                  <span className="serial">{money(p.monthlyUsdMinor)}</span>
                  <span className="pick__cycle">{t('cycle.monthly')}</span>
                </p>

                <ul className="pick__specs">
                  <li>
                    <IconCheck size={15} />
                    {p.sites === 'unlimited' ? t('plan.unlimited') : p.sites} {t('plan.sites')}
                  </li>
                  <li>
                    <IconCheck size={15} />
                    {p.storageGb === 'unlimited' ? t('plan.unlimited') : `${p.storageGb} GB`}{' '}
                    {t('plan.storage')}
                  </li>
                  <li>
                    <IconCheck size={15} />
                    {p.mailboxes === 'unlimited' ? t('plan.unlimited') : p.mailboxes}{' '}
                    {t('plan.mailboxes')}
                  </li>
                </ul>

                <Button
                  size="md"
                  variant={dir === 'up' ? 'primary' : 'secondary'}
                  disabled={isCurrent}
                  onClick={() => navigate(`/account/services/${svc.id}/upgrade/review?to=${p.id}`)}
                >
                  {isCurrent ? t('up.onThis') : t('up.choose')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </AccountLayout>
  );
}

/**
 * Upgrade — proration (C-05, spec 9.2).
 *
 * This is the screen the whole flow exists for. Showing one number — "you owe $4.83" — is what
 * makes a mid-cycle change feel like a trick, so every part of the arithmetic is on the page:
 * the days already paid for, what they are worth on the plan being left, what the same days
 * cost on the plan being taken, and the difference. The next full invoice is stated too,
 * because the today figure is the one people mistake for the new price.
 */
export function UpgradeProration() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const svc = SERVICES.find((s) => s.id === id);
  const to = PLANS.find((p) => p.id === params.get('to'));
  const from = svc && currentPlan(svc.product);

  if (!svc || !to || !from) return <Navigate to="/account/services" replace />;

  const p = prorate(from, to, svc.cycle as Cycle, TODAY, svc.nextDue);
  const money = (minor: number) => `${formatAmount(convert(Math.abs(minor), currency), locale)} ${currency}`;
  const owes = p.dueUsdMinor > 0;

  return (
    <AccountLayout
      title={t('up.review')}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.services'), to: '/account/services' },
        { label: svc.product, to: `/account/services/${svc.id}` },
        { label: t('up.review') },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('up.change')}</h2>
            </header>
            <div className="swap">
              <span className="swap__side">
                <span className="swap__label">{t('up.from')}</span>
                <span className="swap__plan">{from.name}</span>
                <span className="swap__price serial">{money(from.monthlyUsdMinor)}</span>
              </span>
              <IconArrow size={20} />
              <span className="swap__side swap__side--to">
                <span className="swap__label">{t('up.to')}</span>
                <span className="swap__plan">{to.name}</span>
                <span className="swap__price serial">{money(to.monthlyUsdMinor)}</span>
              </span>
            </div>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('up.howCounted')}</h2>
            </header>

            {/* Every step is shown because the total is only trustworthy if it can be checked. */}
            <dl className="sum">
              <div className="sum__row">
                <dt>{t('up.daysLeft')}</dt>
                <dd className="serial">
                  {p.daysLeft} {t('dash.of')} {p.daysInTerm} {t('dash.daysShort')}
                </dd>
              </div>
              <div className="sum__row">
                <dt>{t('up.credit')}</dt>
                <dd className="serial"><bdi>−{money(p.creditUsdMinor)}</bdi></dd>
              </div>
              <div className="sum__row">
                <dt>{t('up.charge')}</dt>
                <dd className="serial"><bdi>+{money(p.chargeUsdMinor)}</bdi></dd>
              </div>
              <div className="sum__row sum__row--total">
                <dt>{owes ? t('up.dueToday') : t('up.creditedToday')}</dt>
                <dd className="serial">{money(p.dueUsdMinor)}</dd>
              </div>
            </dl>

            <p className="form__note">{t('up.roundNote')}</p>
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{owes ? t('up.dueToday') : t('up.creditedToday')}</h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(p.dueUsdMinor)}</span>
            </p>

            {/* The figure people mistake for the new price is the one above, so the real one
                is stated immediately under it. */}
            <dl className="kv">
              <div>
                <dt>{t('up.nextTerm')}</dt>
                <dd className="serial">{money(p.nextTermUsdMinor)}</dd>
              </div>
              <div>
                <dt>{t('account.nextdue')}</dt>
                <dd className="serial">
                  <bdi>{svc.nextDue}</bdi>
                </dd>
              </div>
            </dl>

            {!owes && <p className="form__note">{t('up.noRefund')}</p>}

            <div className="acts u-mt-16">
              <Button
                size="md"
                onClick={() => navigate(`/account/services/${svc.id}/upgrade/done?to=${to.id}`)}
              >
                {t('up.confirm')}
              </Button>
              <Link className="btn btn--md btn--quiet" to={`/account/services/${svc.id}/upgrade`}>
                {t('action.back')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}

/**
 * Upgrade — result (C-06, spec 9.2).
 *
 * A confirmation that says only "success" leaves the two questions people actually have: is it
 * live now, and what happens to the money. Both are answered here.
 */
export function UpgradeResult() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();

  const svc = SERVICES.find((s) => s.id === id);
  const to = PLANS.find((p) => p.id === params.get('to'));
  const from = svc && currentPlan(svc.product);

  if (!svc || !to || !from) return <Navigate to="/account/services" replace />;

  const p = prorate(from, to, svc.cycle as Cycle, TODAY, svc.nextDue);
  const money = (minor: number) => `${formatAmount(convert(Math.abs(minor), currency), locale)} ${currency}`;
  const owes = p.dueUsdMinor > 0;

  return (
    <AccountLayout title={t('up.done')}>
      <div className="card card--calm">
        <p className="calm">
          <IconCheck size={22} />
          <span>
            <strong>{t('up.doneTitle')}</strong>
            <span className="calm__note">
              {to.name} — <bdi>{svc.domain}</bdi>
            </span>
          </span>
        </p>
      </div>

      <section className="card u-mt-16">
        <header className="card__head">
          <h2 className="card__heading">{t('up.whatNow')}</h2>
        </header>
        <dl className="kv">
          <div>
            <dt>{t('up.effective')}</dt>
            <dd>{t('up.effectiveNow')}</dd>
          </div>
          <div>
            <dt>{owes ? t('up.invoiced') : t('up.creditedToday')}</dt>
            <dd className="serial">{money(p.dueUsdMinor)}</dd>
          </div>
          <div>
            <dt>{t('up.nextTerm')}</dt>
            <dd className="serial">{money(p.nextTermUsdMinor)}</dd>
          </div>
          <div>
            <dt>{t('account.nextdue')}</dt>
            <dd className="serial">
              <bdi>{svc.nextDue}</bdi>
            </dd>
          </div>
        </dl>

        {/* Resources move on the server, and saying so beats a support ticket asking why the
            new storage has not appeared yet. */}
        <div className="notice notice--spaced">
          <IconServer size={20} />
          <div>
            <p className="card__body">{t('up.provisionNote')}</p>
          </div>
        </div>

        <div className="form__foot">
          <Link className="btn btn--md btn--primary" to={`/account/services/${svc.id}`}>
            {t('up.backToService')}
          </Link>
          {owes && (
            <Link className="btn btn--md btn--secondary" to="/account/invoices">
              {t('acc.invoices')}
            </Link>
          )}
        </div>
      </section>
    </AccountLayout>
  );
}

/**
 * Cancellation (C-07, spec 9.2).
 *
 * Two decisions, and they are not the same decision: when it stops, and why. "At the end of
 * the term" is preselected because it is what almost everyone means and it is the one that
 * does not throw away time already paid for. What happens to the data is stated before the
 * button, not in a confirmation dialog after it.
 */
export function CancelService() {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const svc = SERVICES.find((s) => s.id === id);
  const [when, setWhen] = useState<'end' | 'now'>('end');
  const [reason, setReason] = useState('');
  const [sure, setSure] = useState(false);
  const [sent, setSent] = useState(false);

  if (!svc) return <Navigate to="/account/services" replace />;

  if (sent) {
    return (
      <AccountLayout title={t('cancel.title')}>
        <div className="card card--calm">
          <p className="calm">
            <IconCheck size={22} />
            <span>
              <strong>{t('cancel.doneTitle')}</strong>
              <span className="calm__note">
                {when === 'end' ? `${t('cancel.stopsOn')} ${svc.nextDue}` : t('cancel.stopsNow')}
              </span>
            </span>
          </p>
        </div>
        <div className="form__foot">
          <Link className="btn btn--md btn--secondary" to={`/account/services/${svc.id}`}>
            {t('up.backToService')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title={t('cancel.title')}
      lede={`${svc.product} — ${svc.domain}`}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.services'), to: '/account/services' },
        { label: svc.product, to: `/account/services/${svc.id}` },
        { label: t('cancel.title') },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('cancel.when')}</h2>
            </header>
            <div className="methods">
              <label className={`method${when === 'end' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="when"
                  checked={when === 'end'}
                  onChange={() => setWhen('end')}
                />
                <span className="method__label">
                  {t('cancel.atEnd')}
                  <span className="method__note">
                    {t('cancel.stopsOn')} <bdi>{svc.nextDue}</bdi> — {t('cancel.atEndNote')}
                  </span>
                </span>
              </label>
              <label className={`method${when === 'now' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="when"
                  checked={when === 'now'}
                  onChange={() => setWhen('now')}
                />
                <span className="method__label">
                  {t('cancel.now')}
                  <span className="method__note">{t('cancel.nowNote')}</span>
                </span>
              </label>
            </div>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('cancel.why')}</h2>
            </header>
            <div className="form">
              <label className="field-label">
                <span className="eyebrow">{t('cancel.reason')}</span>
                <select
                  className="field"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">{t('cancel.pick')}</option>
                  {[
                    'cancel.reason.price',
                    'cancel.reason.moving',
                    'cancel.reason.unused',
                    'cancel.reason.support',
                    'cancel.reason.technical',
                    'cancel.reason.other',
                  ].map((r) => (
                    <option key={r} value={r}>
                      {t(r as never)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('cancel.more')}</span>
                <textarea className="field" rows={3} />
              </label>
            </div>
          </section>
        </div>

        <div className="dash__side">
          <section className="card card--urgent">
            <header className="card__head">
              <h2 className="card__heading">
                <IconAlert size={17} />
                {t('cancel.whatGoes')}
              </h2>
            </header>
            <ul className="checklist checklist--warn">
              <li>{t('cancel.loses1')}</li>
              <li>{t('cancel.loses2')}</li>
              <li>{t('cancel.loses3')}</li>
            </ul>

            <label className="switch-row u-mt-16">
              <span>
                <span className="switch-row__label">{t('cancel.understand')}</span>
              </span>
              <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} />
            </label>

            <div className="acts u-mt-16">
              {/* Gated on the acknowledgement, not on a second dialog: the consequence is on
                  this screen, so the confirmation belongs on this screen too. */}
              <Button size="md" variant="danger" disabled={!sure} onClick={() => setSent(true)}>
                {t('cancel.request')}
              </Button>
              <Link className="btn btn--md btn--quiet" to={`/account/services/${svc.id}`}>
                {t('cancel.keep')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}
