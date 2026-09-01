import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconArrow, IconInvoice, IconPlus, IconCheck } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount, gatewaysFor, GATEWAYS } from '../../lib/catalog';
import {
  INVOICES,
  PAYMENT_METHODS_SAVED,
  ACCOUNT,
  type InvoiceStatus,
  type InvoiceLine,
} from '../../lib/account';

const FILTERS: (InvoiceStatus | 'all')[] = ['all', 'unpaid', 'paid', 'overdue', 'cancelled'];

/** Invoices — spec 9.4: number, date, status, amount, filtered by status. */
export function Invoices() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');

  const rows = INVOICES.filter((i) => filter === 'all' || i.status === filter);

  return (
    <AccountLayout title={t('acc.invoices')}>
      <div className="filters" role="group" aria-label={t('account.status')}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`filters__btn${filter === f ? ' is-active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {t(`inv.${f}` as never)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <p className="empty__line">{t('inv.none')}</p>
        </div>
      ) : (
        <div className="panel table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('account.invoice')}</th>
                <th scope="col">{t('account.date')}</th>
                <th scope="col">{t('inv.due')}</th>
                <th scope="col" className="num">{t('col.amount')}</th>
                <th scope="col">{t('account.status')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => (
                <tr key={inv.id}>
                  <td><span className="lead serial"><bdi>{inv.number}</bdi></span></td>
                  <td className="serial"><bdi>{inv.date}</bdi></td>
                  <td className="serial"><bdi>{inv.due}</bdi></td>
                  <td className="num">
                    {formatAmount(convert(inv.totalUsdMinor, currency), locale)} {currency}
                  </td>
                  <td>
                    <span className={`tag tag--${inv.status === 'paid' ? 'ok' : inv.status === 'cancelled' ? 'taken' : 'due'}`}>
                      {t(`inv.${inv.status}` as never)}
                    </span>
                  </td>
                  <td className="num">
                    <Link className="btn btn--sm btn--secondary" to={`/account/invoices/${inv.id}`}>
                      {t('inv.view')}
                      <IconArrow size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccountLayout>
  );
}

/** Single invoice — spec 9.4: line items, payment method, Pay Now, Download PDF. */
export function InvoiceDetail() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const inv = INVOICES.find((i) => i.id === id);

  if (!inv) return <Navigate to="/account/invoices" replace />;

  const sub = inv.lines.reduce((s, l) => s + l.amountUsdMinor, 0);
  const method = GATEWAYS.find((g) => g.id === inv.method);

  /**
   * The product name and the domain stay as written; only the cycle is a word, so only the
   * cycle is translated. Each Latin run sits in its own <bdi> because otherwise bidi reorders
   * it against the Arabic around it — "360 Monitoring" comes out as "Monitoring 360".
   */
  const lineLabel = (l: InvoiceLine) => (
    <>
      <bdi>{l.product}</bdi>
      {l.domain && (
        <>
          {' — '}
          <bdi>{l.domain}</bdi>
        </>
      )}
      {l.cycle && <> — {t(`cycle.${l.cycle}` as never)}</>}
    </>
  );

  return (
    <AccountLayout
      title={inv.number}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.invoices'), to: '/account/invoices' },
        { label: inv.number },
      ]}
    >
      <div className="panel panel--pad invoice">
        <div className="invoice__head">
          <dl className="kv">
            <div><dt>{t('account.date')}</dt><dd className="serial"><bdi>{inv.date}</bdi></dd></div>
            <div><dt>{t('inv.due')}</dt><dd className="serial"><bdi>{inv.due}</bdi></dd></div>
            <div><dt>{t('account.status')}</dt><dd><span className={`tag tag--${inv.status === 'paid' ? 'ok' : 'due'}`}>{t(`inv.${inv.status}` as never)}</span></dd></div>
            {method && <div><dt>{t('checkout.method')}</dt><dd>{t(method.labelKey as never)}</dd></div>}
          </dl>
        </div>

        <table className="data data--flush">
          <thead>
            <tr>
              <th scope="col">{t('inv.description')}</th>
              <th scope="col" className="num">{t('col.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={`${l.product}-${l.domain ?? ''}`}>
                <td>{lineLabel(l)}</td>
                <td className="num">{formatAmount(convert(l.amountUsdMinor, currency), locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="totals">
          <div className="totals__row">
            <dt>{t('cart.subtotal')}</dt>
            <dd>{formatAmount(convert(sub, currency), locale)}</dd>
          </div>
          <div className="totals__row">
            <dt>{t('cart.vat')}</dt>
            <dd>{formatAmount(convert(inv.taxUsdMinor, currency), locale)}</dd>
          </div>
          <div className="totals__row totals__row--grand">
            <dt>{t('cart.total')}</dt>
            <dd>{formatAmount(convert(inv.totalUsdMinor, currency), locale)} {currency}</dd>
          </div>
        </dl>

        <div className="actions">
          <Button size="md" variant="secondary">
            <IconInvoice size={16} />
            {t('inv.pdf')}
          </Button>
          {inv.status !== 'paid' && <Button size="lg">{t('account.pay')}</Button>}
        </div>
      </div>
    </AccountLayout>
  );
}

/** Add Funds — spec 9.4: top up a balance that later invoices draw on automatically. */
export function AddFunds() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [amount, setAmount] = useState(2000);

  const presets = [1000, 2000, 5000, 10000];

  return (
    <AccountLayout title={t('acc.funds')} lede={t('funds.lede')}>
      <div className="split">
        <div className="panel panel--pad">
          <h2 className="card__title">{t('funds.amount')}</h2>
          <div className="filters">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                className={`filters__btn${amount === p ? ' is-active' : ''}`}
                aria-pressed={amount === p}
                onClick={() => setAmount(p)}
              >
                {formatAmount(convert(p, currency), locale)} {currency}
              </button>
            ))}
          </div>

          <label className="field-label">
            <span className="eyebrow">{t('funds.custom')}</span>
            <input
              className="field serial"
              type="number"
              min={5}
              dir="ltr"
              value={(amount / 100).toFixed(2)}
              onChange={(e) => setAmount(Math.round(Number(e.target.value) * 100))}
            />
          </label>

          <h2 className="card__title">{t('checkout.method')}</h2>
          <ul className="methods">
            {gatewaysFor(currency).map((g, i) => (
              <li key={g.id}>
                <label className={`method${i === 0 ? ' is-selected' : ''}`}>
                  <input type="radio" name="fundsmethod" defaultChecked={i === 0} />
                  <span className="method__label">{t(g.labelKey as never)}</span>
                </label>
              </li>
            ))}
          </ul>

          <Button size="lg">{t('funds.add')}</Button>
        </div>

        <div className="panel panel--pad">
          <h2 className="card__title">{t('funds.balance')}</h2>
          <p className="balance serial">
            {formatAmount(convert(ACCOUNT.creditUsdMinor, currency), locale)} {currency}
          </p>
          <p className="card__body">{t('funds.balanceNote')}</p>
        </div>
      </div>
    </AccountLayout>
  );
}

/** Payment Methods — spec 5.4 and 11: saved cards for recurring billing. */
export function PaymentMethods() {
  const { t } = useLocale();

  return (
    <AccountLayout title={t('acc.methods')} lede={t('pm.lede')}>
      <ul className="cards-list">
        {PAYMENT_METHODS_SAVED.map((m) => (
          <li className="pm" key={m.id}>
            <span className="pm__brand">{m.kind}</span>
            <span className="pm__num serial">
              <bdi>•••• {m.last4}</bdi>
            </span>
            <span className="pm__exp serial">
              <bdi>{m.expiry}</bdi>
            </span>
            {m.primary ? (
              <span className="tag tag--ok">
                <IconCheck size={13} />
                {t('pm.primary')}
              </span>
            ) : (
              <Button size="sm" variant="secondary">
                {t('pm.makePrimary')}
              </Button>
            )}
            <Button size="sm" variant="quiet">
              {t('action.remove')}
            </Button>
          </li>
        ))}
      </ul>

      <div className="actions actions--split">
        <Button size="md" variant="secondary">
          <IconPlus size={15} />
          {t('pm.add')}
        </Button>
      </div>
    </AccountLayout>
  );
}
