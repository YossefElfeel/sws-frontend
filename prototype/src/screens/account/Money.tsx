import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Tag } from '../../components/Tag';
import { Button } from '../../components/Button';
import {
  IconCheck,
  IconAlert,
  IconWallet,
  IconInvoice,
  IconCalendar,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import {
  convert,
  formatAmount,
  CYCLES,
  CYCLE_META,
  gatewaysFor,
  GATEWAYS,
  type Cycle,
} from '../../lib/catalog';
import {
  SERVICES,
  DOMAINS,
  TRANSACTIONS,
  FAILED_PAYMENT,
  INVOICES,
  AFFILIATE,
  type TxnKind,
} from '../../lib/account';

/**
 * Manual renewal (C-08, spec 9.2 and 9.3).
 *
 * One screen for both services and domains, because the decision is the same one: how long,
 * and pay how. The term picker leads with what each term saves, since that is the only reason
 * to choose a longer one — and the saving is the spec's own table, not a number invented here.
 */
export function Renew() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();

  const svc = SERVICES.find((s) => s.id === id);
  const dom = DOMAINS.find((d) => d.id === id);
  const [cycle, setCycle] = useState<Cycle>('annually');
  const [done, setDone] = useState(false);

  if (!svc && !dom) return <Navigate to="/account/services" replace />;

  const name = svc ? svc.product : dom!.name;
  const sub = svc ? svc.domain : t('acc.domains');
  const monthly = svc ? svc.amountUsdMinor / CYCLE_META[svc.cycle as Cycle].months : 1200;
  const backTo = svc ? `/account/services/${svc.id}` : `/account/domains/${dom!.id}`;
  const until = svc ? svc.nextDue : dom!.expires;

  const priceFor = (c: Cycle) =>
    Math.round(monthly * CYCLE_META[c].months * (1 - CYCLE_META[c].save / 100));
  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  if (done) {
    return (
      <AccountLayout title={t('renew.title')}>
        <div className="card card--calm">
          <p className="calm">
            <IconCheck size={22} />
            <span>
              <strong>{t('renew.doneTitle')}</strong>
              <span className="calm__note">
                {name} — {t(`cycle.${cycle}` as never)}
              </span>
            </span>
          </p>
        </div>
        <div className="form__foot">
          <Link className="btn btn--md btn--primary" to="/account/invoices">
            {t('renew.seeInvoice')}
          </Link>
          <Link className="btn btn--md btn--secondary" to={backTo}>
            {t('action.back')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title={t('renew.title')}
      lede={`${name} — ${sub}`}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: name, to: backTo },
        { label: t('renew.title') },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('renew.howLong')}</h2>
            </header>
            <ul className="terms">
              {CYCLES.map((c) => (
                <li key={c}>
                  <label className={`term${cycle === c ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="cycle"
                      checked={cycle === c}
                      onChange={() => setCycle(c)}
                    />
                    <span className="term__name">{t(`cycle.${c}` as never)}</span>
                    <span className="term__price serial">{money(priceFor(c))}</span>
                    {CYCLE_META[c].save > 0 && (
                      <Tag tone="ok">
                        {t('renew.save')} {CYCLE_META[c].save}%
                      </Tag>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('checkout.method')}</h2>
            </header>
            <ul className="methods">
              {gatewaysFor(currency).map((g, i) => (
                <li key={g.id}>
                  <label className={`method${i === 0 ? ' is-selected' : ''}`}>
                    <input type="radio" name="renewmethod" defaultChecked={i === 0} />
                    <span className="method__label">{t(g.labelKey as never)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">
                <IconCalendar size={17} />
                {t('renew.summary')}
              </h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(priceFor(cycle))}</span>
            </p>
            <dl className="kv">
              <div>
                <dt>{t('renew.term')}</dt>
                <dd>{t(`cycle.${cycle}` as never)}</dd>
              </div>
              <div>
                <dt>{t('renew.paidUntil')}</dt>
                <dd className="serial">
                  <bdi>{until}</bdi>
                </dd>
              </div>
            </dl>
            <div className="acts u-mt-16">
              <Button size="md" onClick={() => setDone(true)}>
                {t('renew.pay')}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}

/** Transaction history (C-20, spec 9.4): what money actually moved, and against what. */
export function Transactions() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [kind, setKind] = useState<TxnKind | 'all'>('all');

  const rows = TRANSACTIONS.filter((x) => kind === 'all' || x.kind === kind);
  const money = (minor: number) => `${formatAmount(convert(Math.abs(minor), currency), locale)} ${currency}`;

  return (
    <AccountLayout title={t('txn.title')} lede={t('txn.lede')}>
      <div className="bar">
        <div className="filters" role="group" aria-label={t('txn.kind')}>
          {(['all', 'payment', 'refund', 'credit'] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={`filters__btn${kind === k ? ' is-active' : ''}`}
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              {t(k === 'all' ? 'inv.all' : (`txn.${k}` as never))}
            </button>
          ))}
        </div>
        <p className="bar__count">
          <span className="serial">{rows.length}</span> {t('dash.of')}{' '}
          <span className="serial">{TRANSACTIONS.length}</span>
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="card card--flush table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('account.date')}</th>
                <th scope="col">{t('txn.kind')}</th>
                <th scope="col">{t('account.invoice')}</th>
                <th scope="col">{t('checkout.method')}</th>
                <th scope="col">{t('txn.reference')}</th>
                <th scope="col" className="num">{t('col.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => {
                const g = GATEWAYS.find((gg) => gg.id === x.gateway);
                return (
                  <tr key={x.id}>
                    <td className="serial"><bdi>{x.at}</bdi></td>
                    <td>
                      <Tag tone="neutral">{t(`txn.${x.kind}` as never)}</Tag>
                    </td>
                    <td className="serial">
                      {x.invoice ? <bdi>{x.invoice}</bdi> : <span className="muted">—</span>}
                    </td>
                    <td>{g ? t(g.labelKey as never) : x.gateway}</td>
                    <td className="serial"><bdi>{x.reference}</bdi></td>
                    {/* Sign carries the direction, so a refund does not read as a payment. */}
                    <td className={`num${x.amountUsdMinor < 0 ? ' is-out' : ''}`}>
                      <bdi>
                        {x.amountUsdMinor < 0 ? '−' : ''}
                        {money(x.amountUsdMinor)}
                      </bdi>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty">
          <IconWallet size={28} />
          <p className="empty__title">{t('txn.none')}</p>
          <p className="empty__note">{t('empty.filter')}</p>
        </div>
      )}
    </AccountLayout>
  );
}

/**
 * Failed payment recovery (C-21, spec 9.4).
 *
 * Dunning goes wrong when it is only a scold. What someone needs is four facts: what failed,
 * why as far as the gateway said, what happens next and when, and how to fix it now. The
 * suspension date is stated plainly rather than implied — a vague "your service may be
 * affected" is what makes people call support instead of paying.
 */
export function PaymentFailed() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const f = FAILED_PAYMENT;
  const inv = INVOICES.find((i) => i.id === f.invoiceId);
  const gateway = GATEWAYS.find((g) => g.id === f.gateway);

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  return (
    <AccountLayout
      title={t('fail.title')}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.invoices'), to: '/account/invoices' },
        { label: t('fail.title') },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card card--urgent">
            <header className="card__head">
              <h2 className="card__heading">
                <IconAlert size={17} />
                {t('fail.whatHappened')}
              </h2>
            </header>
            <dl className="kv">
              <div>
                <dt>{t('account.invoice')}</dt>
                <dd className="serial"><bdi>{f.invoiceNumber}</bdi></dd>
              </div>
              <div>
                <dt>{t('checkout.method')}</dt>
                <dd>
                  {gateway ? t(gateway.labelKey as never) : f.gateway} ····{' '}
                  <span className="serial">{f.last4}</span>
                </dd>
              </div>
              <div>
                <dt>{t('fail.reason')}</dt>
                <dd>{t(`fail.reason.${f.reason}` as never)}</dd>
              </div>
              <div>
                <dt>{t('account.date')}</dt>
                <dd className="serial"><bdi>{f.at}</bdi></dd>
              </div>
            </dl>
            <p className="form__note">{t(`fail.advice.${f.reason}` as never)}</p>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('fail.whatNext')}</h2>
            </header>
            {/* A schedule, not a threat: three dated steps, the last one the consequence. */}
            <ol className="steps">
              <li className="steps__item steps__item--done">
                <span className="steps__when serial"><bdi>{f.at}</bdi></span>
                <span className="steps__what">
                  {t('fail.step1')} <span className="serial">{f.attempt}</span> {t('dash.of')}{' '}
                  <span className="serial">{f.maxAttempts}</span>
                </span>
              </li>
              <li className="steps__item">
                <span className="steps__when serial"><bdi>{f.nextAttempt}</bdi></span>
                <span className="steps__what">{t('fail.step2')}</span>
              </li>
              <li className="steps__item steps__item--bad">
                <span className="steps__when serial"><bdi>{f.suspendsOn}</bdi></span>
                <span className="steps__what">{t('fail.step3')}</span>
              </li>
            </ol>
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('fail.fixIt')}</h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(inv?.totalUsdMinor ?? 0)}</span>
            </p>
            <p className="credit__note">{t('fail.fixNote')}</p>
            <div className="acts">
              <Link className="btn btn--md btn--primary" to={`/account/invoices/${f.invoiceId}`}>
                {t('account.pay')}
              </Link>
              <Link className="btn btn--md btn--secondary" to="/account/payment-methods">
                {t('fail.changeMethod')}
              </Link>
              <div className="acts__sep">
                <Link className="btn btn--md btn--quiet" to="/account/tickets/new">
                  {t('fail.getHelp')}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}

/**
 * Affiliate withdrawal (C-30, spec 9.6).
 *
 * The threshold is the thing that decides whether this screen can do anything at all, so it is
 * stated at the top rather than discovered by a disabled button.
 */
export function AffiliateWithdraw() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [method, setMethod] = useState('bank');
  const [done, setDone] = useState(false);

  const MIN = 5000;
  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;
  const eligible = AFFILIATE.balanceUsdMinor >= MIN;

  if (done) {
    return (
      <AccountLayout title={t('wd.title')}>
        <div className="card card--calm">
          <p className="calm">
            <IconCheck size={22} />
            <span>
              <strong>{t('wd.doneTitle')}</strong>
              <span className="calm__note">{t('wd.doneNote')}</span>
            </span>
          </p>
        </div>
        <div className="form__foot">
          <Link className="btn btn--md btn--secondary" to="/account/affiliates">
            {t('action.back')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      title={t('wd.title')}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.affiliates'), to: '/account/affiliates' },
        { label: t('wd.title') },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('wd.howPaid')}</h2>
            </header>
            <div className="methods">
              {(['bank', 'wallet', 'credit'] as const).map((m) => (
                <label className={`method${method === m ? ' is-selected' : ''}`} key={m}>
                  <input
                    type="radio"
                    name="wd"
                    checked={method === m}
                    onChange={() => setMethod(m)}
                  />
                  <span className="method__label">
                    {t(`wd.${m}` as never)}
                    <span className="method__note">{t(`wd.${m}Note` as never)}</span>
                  </span>
                </label>
              ))}
            </div>

            {method !== 'credit' && (
              <div className="form u-mt-16">
                <label className="field-label">
                  <span className="eyebrow">{t(method === 'bank' ? 'wd.iban' : 'wd.walletNum')}</span>
                  <input className="field serial" dir="ltr" />
                </label>
              </div>
            )}
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">
                <IconWallet size={17} />
                {t('aff.balance')}
              </h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(AFFILIATE.balanceUsdMinor)}</span>
            </p>
            <dl className="kv">
              <div>
                <dt>{t('wd.minimum')}</dt>
                <dd className="serial">{money(MIN)}</dd>
              </div>
              <div>
                <dt>{t('wd.alreadyPaid')}</dt>
                <dd className="serial">{money(AFFILIATE.paidUsdMinor)}</dd>
              </div>
            </dl>
            <p className="form__note">{t('wd.timing')}</p>
            <div className="acts u-mt-16">
              <Button size="md" disabled={!eligible} onClick={() => setDone(true)}>
                {t('wd.request')}
              </Button>
              {!eligible && <p className="form__note">{t('wd.belowMin')}</p>}
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}

/** A small link out of Add Funds and the invoice list, so history is reachable. */
export function TransactionsLink() {
  const { t } = useLocale();
  return (
    <Link className="btn btn--md btn--secondary" to="/account/transactions">
      <IconInvoice size={15} />
      {t('txn.title')}
    </Link>
  );
}
