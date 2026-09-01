import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import {
  IconArrow,
  IconInvoice,
  IconPlus,
  IconCheck,
  IconWallet,
  IconAlert,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { useSaved, SavedNote } from '../../lib/saved';
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
  const owing = INVOICES.filter((i) => i.status === 'unpaid' || i.status === 'overdue');
  const owed = owing.reduce((s, i) => s + i.totalUsdMinor, 0);

  return (
    <AccountLayout
      title={t('acc.invoices')}
      actions={
        <>
          <Link className="btn btn--md btn--secondary" to="/account/transactions">
            {t('txn.title')}
          </Link>
          <Link className="btn btn--md btn--secondary" to="/account/funds">
            <IconWallet size={15} />
            {t('acc.funds')}
          </Link>
        </>
      }
    >
      {/* What is owed belongs above the list of everything ever billed, not inside it. */}
      {owing.length > 0 && (
        <section className="card card--urgent u-mb-16">
          <div className="due">
            <p className="due__amount serial">
              {formatAmount(convert(owed, currency), locale)} {currency}
            </p>
            <p className="due__note">
              <IconAlert size={14} /> {t('dash.dueNote')}
            </p>
            <div className="due__actions">
              <Link className="btn btn--md btn--primary" to={`/account/invoices/${owing[0].id}`}>
                {t('account.pay')}
                <IconArrow size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="bar">
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
        <p className="bar__count">
          <span className="serial">{rows.length}</span> {t('dash.of')}{' '}
          <span className="serial">{INVOICES.length}</span>
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card empty">
          <IconInvoice size={28} />
          <p className="empty__title">{t('inv.none')}</p>
          <p className="empty__note">{t('empty.filter')}</p>
        </div>
      ) : (
        <div className="card card--flush table-scroll">
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

/**
 * Single invoice — spec 9.4: line items, payment method, Pay Now, Download PDF.
 *
 * This one screen keeps a document's measure rather than filling the app's width: an invoice
 * is a thing you read, print and file, and a full-bleed one reads as a report.
 */
export function InvoiceDetail() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const inv = INVOICES.find((i) => i.id === id);
  const { saved, mark, clear } = useSaved(6000);

  if (!inv) return <Navigate to="/account/invoices" replace />;

  const sub = inv.lines.reduce((s, l) => s + l.amountUsdMinor, 0);
  const method = GATEWAYS.find((g) => g.id === inv.method);
  const unpaid = inv.status !== 'paid' && inv.status !== 'cancelled';

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
      actions={
        <>
          {/* C-16 is blocked on I12 and the PDF is generated server-side, so the button
              reports why rather than doing nothing at all. */}
          <Button size="md" variant="secondary" onClick={() => mark(t('inv.pdfPending'))}>
            <IconInvoice size={15} />
            {t('inv.pdf')}
          </Button>
          {unpaid && (
            <Link className="btn btn--md btn--primary" to="/checkout/card">
              {t('account.pay')}
            </Link>
          )}
        </>
      }
    >
      <SavedNote saved={saved} onDismiss={clear}>
        {t('inv.pdfPendingNote')}
      </SavedNote>

      <div className="card invoice">
        <div className="invoice__head">
          <dl className="kv">
            <div><dt>{t('account.date')}</dt><dd className="serial"><bdi>{inv.date}</bdi></dd></div>
            <div><dt>{t('inv.due')}</dt><dd className="serial"><bdi>{inv.due}</bdi></dd></div>
            <div>
              <dt>{t('account.status')}</dt>
              <dd>
                <span className={`tag tag--${inv.status === 'paid' ? 'ok' : 'due'}`}>
                  {t(`inv.${inv.status}` as never)}
                </span>
              </dd>
            </div>
            {method && (
              <div>
                <dt>{t('checkout.method')}</dt>
                <dd>{t(method.labelKey as never)}</dd>
              </div>
            )}
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
            <dd>
              {formatAmount(convert(inv.totalUsdMinor, currency), locale)} {currency}
            </dd>
          </div>
        </dl>
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
  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  return (
    <AccountLayout title={t('acc.funds')} lede={t('funds.lede')}>
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('funds.amount')}</h2>
            </header>
            <div className="form">
              <div className="chips" role="group" aria-label={t('funds.amount')}>
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`chip${amount === p ? ' is-active' : ''}`}
                    aria-pressed={amount === p}
                    onClick={() => setAmount(p)}
                  >
                    {money(p)}
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
            </div>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('checkout.method')}</h2>
            </header>
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
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">
                <IconWallet size={17} />
                {t('funds.balance')}
              </h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(ACCOUNT.creditUsdMinor)}</span>
            </p>
            <p className="credit__note">{t('funds.balanceNote')}</p>

            {/* The amount being added is restated where the button is, so nobody confirms a
                figure they set four fields ago and can no longer see. */}
            <dl className="kv">
              <div>
                <dt>{t('funds.adding')}</dt>
                <dd className="serial">{money(amount)}</dd>
              </div>
            </dl>
            <div className="acts u-mt-16">
              <Button size="md" disabled={amount < 500}>
                {t('funds.add')}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}

/** Payment Methods — spec 5.4 and 11: saved cards for recurring billing. */
export function PaymentMethods() {
  const { t } = useLocale();
  const [cards, setCards] = useState(PAYMENT_METHODS_SAVED);

  return (
    <AccountLayout
      title={t('acc.methods')}
      lede={t('pm.lede')}
      actions={
        <Link className="btn btn--md btn--secondary" to="/checkout/card">
          <IconPlus size={15} />
          {t('pm.add')}
        </Link>
      }
    >
      {cards.length > 0 ? (
        <div className="card card--flush">
          {cards.map((m) => (
            <div className="method-row" key={m.id}>
              <span className="method-row__mark" aria-hidden="true">
                {m.kind.slice(0, 4).toUpperCase()}
              </span>
              <span>
                <span className="method-row__num serial">
                  <bdi>•••• {m.last4}</bdi>
                </span>
                <span className="method-row__exp serial u-block">
                  <bdi>{m.expiry}</bdi>
                </span>
              </span>
              <span className="method-row__grow">
                {m.primary && (
                  <span className="tag tag--ok">
                    <IconCheck size={13} />
                    {t('pm.primary')}
                  </span>
                )}
              </span>
              {!m.primary && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setCards((all) => all.map((x) => ({ ...x, primary: x.id === m.id })))
                  }
                >
                  {t('pm.makePrimary')}
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                aria-label={`${t('action.remove')} ${m.kind} ${m.last4}`}
                onClick={() => setCards((all) => all.filter((x) => x.id !== m.id))}
              >
                {t('action.remove')}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <IconInvoice size={28} />
          <p className="empty__title">{t('empty.methods')}</p>
          <p className="empty__note">{t('pm.lede')}</p>
        </div>
      )}
    </AccountLayout>
  );
}
