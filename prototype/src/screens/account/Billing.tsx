import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { ConfirmButton } from '../../components/ConfirmButton';
import { Card } from '../../components/Card';
import { Tag, INVOICE_TONE } from '../../components/Tag';
import { DevNote } from '../../components/DevNote';
import { GatewayDetails } from '../../components/GatewayDetails';
import {
  IconArrow,
  IconInvoice,
  IconPlus,
  IconCheck,
  IconWallet,
  IconAlert,
} from '../../components/icons';
import { TableToolbar, TableFilter, matches } from '../../components/TableToolbar';
import { useLocale } from '../../lib/locale';
import { useSaved, SavedNote } from '../../lib/saved';
import { usePrefs } from '../../lib/prefs';
import {
  convert,
  formatAmount,
  gatewaysFor,
  GATEWAYS,
  COUNTRIES,
  TAX_RATE,
} from '../../lib/catalog';
import {
  INVOICES,
  PAYMENT_METHODS_SAVED,
  ACCOUNT,
  COMPANY,
  invoiceLedger,
  invoiceBalanceUsdMinor,
  type InvoiceStatus,
  type InvoiceLine,
} from '../../lib/account';
import { gatewayDestination } from '../Order';

const FILTERS: (InvoiceStatus | 'all')[] = ['all', 'unpaid', 'paid', 'overdue', 'cancelled'];

/** Invoices — spec 9.4: number, date, status, amount, filtered by status. */
export function Invoices() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');

  // An invoice is looked up by its number or by what it was for, so the line items are part of
  // the haystack: "the one with the .eg domain on it" is how people describe an invoice.
  const rows = INVOICES.filter(
    (i) =>
      (filter === 'all' || i.status === filter) &&
      matches(q, i.number, i.date, i.due, ...i.lines.map((l) => `${l.product} ${l.domain ?? ''}`)),
  );
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
        <Card
          tone="urgent"
          heading={t('dash.needsYou')}
          icon={<IconAlert size={17} />}
          className="u-mb-16"
        >
          <div className="due">
            <div className="due__text">
              <p className="due__amount serial">
                {formatAmount(convert(owed, currency), locale)} {currency}
              </p>
              <p className="due__note">
                <IconAlert size={14} />
                <span>{t('dash.dueNote')}</span>
              </p>
            </div>
            <div className="due__actions">
              <Link className="btn btn--md btn--primary" to={`/account/invoices/${owing[0].id}`}>
                {t('account.pay')}
                <IconArrow size={15} />
              </Link>
            </div>
          </div>
        </Card>
      )}

      <TableToolbar
        value={q}
        onChange={setQ}
        label={t('search.invoices')}
        shown={rows.length}
        total={INVOICES.length}
      >
        <TableFilter
          label={t('account.status')}
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((f) => ({
            value: f,
            label: t(f === 'all' ? 'filter.allStatuses' : (`inv.${f}` as never)),
          }))}
        />
      </TableToolbar>

      {rows.length === 0 ? (
        <div className="card empty">
          <IconInvoice size={28} />
          <p className="empty__title">{t(q.trim() ? 'empty.search' : 'inv.none')}</p>
          <p className="empty__note">{t(q.trim() ? 'empty.searchNote' : 'empty.filter')}</p>
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
                    <Tag tone={INVOICE_TONE[inv.status]}>{t(`inv.${inv.status}` as never)}</Tag>
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
 * Single invoice — spec 9.4, C-15, and the paying of it, C-17.
 *
 * The document keeps a document's measure rather than filling the app's width: an invoice is
 * a thing you read, print and file, and a full-bleed one reads as a report. Beside it sits
 * the one thing a document cannot do — take the payment. The sidebar names what is still
 * owed, offers the methods the currency allows, says what each one involves before Pay is
 * pressed, and sends the person to that method's own next screen with this invoice attached.
 *
 * Under the lines, the ledger: what money actually moved against this invoice and when. The
 * balance is arithmetic over it, so a "paid" invoice with a balance would be a fixture error
 * that shows, not one that hides.
 */
export function InvoiceDetail() {
  const { t, locale, bi } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  const inv = INVOICES.find((i) => i.id === id);
  const { saved, mark, clear } = useSaved(6000);

  const gateways = gatewaysFor(currency);
  const [method, setMethod] = useState(
    inv?.method && gateways.some((g) => g.id === inv.method) ? inv.method : gateways[0]?.id ?? 'stripe-card',
  );
  const [useCredit, setUseCredit] = useState(false);

  // The EGP wallet leaves the list when the currency does; the choice follows.
  useEffect(() => {
    if (!gateways.some((g) => g.id === method)) setMethod(gateways[0]?.id ?? 'stripe-card');
  }, [gateways, method]);

  if (!inv) return <Navigate to="/account/invoices" replace />;

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;
  const sub = inv.lines.reduce((s, l) => s + l.amountUsdMinor, 0);
  const rate = Math.round((inv.taxRate ?? TAX_RATE) * 100);
  const paidWith = GATEWAYS.find((g) => g.id === inv.method);
  const unpaid = inv.status !== 'paid' && inv.status !== 'cancelled';
  const ledger = invoiceLedger(inv);
  const balance = invoiceBalanceUsdMinor(inv);
  const creditUsable = Math.min(ACCOUNT.creditUsdMinor, balance);
  const balanceShown = useCredit ? balance - creditUsable : balance;
  const chosen = gateways.find((g) => g.id === method) ?? gateways[0];
  const dest = gatewayDestination(method);
  // The credit choice travels with the invoice, so the next screen asks for the figure shown here.
  const payHref = `${dest}${dest.includes('?') ? '&' : '?'}invoice=${inv.id}${useCredit ? '&credit=1' : ''}`;
  const country = COUNTRIES.find((c) => c.code === ACCOUNT.country)?.label ?? ACCOUNT.country;

  /**
   * The product name and the domain stay as written; only the cycle is a word, so only the
   * cycle is translated. Each Latin run sits in its own <bdi> because otherwise bidi reorders
   * it against the Arabic around it — "360 Monitoring" comes out as "Monitoring 360".
   */
  const lineLabel = (l: InvoiceLine) => (
    <>
      {l.productKey ? t(l.productKey as never) : <bdi>{l.product}</bdi>}
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
            <Link className="btn btn--md btn--primary" to={payHref}>
              {t('account.pay')}
            </Link>
          )}
        </>
      }
    >
      <SavedNote saved={saved} onDismiss={clear}>
        {t('inv.pdfPendingNote')}
      </SavedNote>

      <div className="with-side">
        <div className="dash__main">
          <article className="card invoice">
            <div className="invoice__head">
              <p className="eyebrow">{t('account.invoice')}</p>
              <p className="invoice__number">
                <span className="serial">
                  <bdi>{inv.number}</bdi>
                </span>{' '}
                <Tag tone={INVOICE_TONE[inv.status]}>{t(`inv.${inv.status}` as never)}</Tag>
              </p>
              <dl className="kv">
                <div><dt>{t('account.date')}</dt><dd className="serial"><bdi>{inv.date}</bdi></dd></div>
                <div><dt>{t('inv.due')}</dt><dd className="serial"><bdi>{inv.due}</bdi></dd></div>
                {inv.paidOn && (
                  <div><dt>{t('inv.paidOn')}</dt><dd className="serial"><bdi>{inv.paidOn}</bdi></dd></div>
                )}
                {paidWith && (
                  <div>
                    <dt>{t('checkout.method')}</dt>
                    <dd>{t(paidWith.labelKey as never)}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Who owes and who is owed. The issuer carries only what has been confirmed. */}
            <div className="parties">
              <div>
                <p className="eyebrow">{t('inv.invoicedTo')}</p>
                <p className="lead">{bi(ACCOUNT.name)}</p>
                {ACCOUNT.company && <p>{bi(ACCOUNT.company)}</p>}
                <p>{bi(ACCOUNT.address)}</p>
                <p>
                  {bi(ACCOUNT.city)} <span className="serial">{ACCOUNT.postcode}</span>
                </p>
                <p>{country}</p>
                <p className="serial">
                  <bdi>{ACCOUNT.email}</bdi>
                </p>
              </div>
              <div>
                <p className="eyebrow">{t('inv.issuedBy')}</p>
                <p className="lead">
                  <bdi>{COMPANY.name}</bdi>
                </p>
                <p>{t(COMPANY.countryKey as never)}</p>
                {COMPANY.taxId ? (
                  <p className="serial">
                    <bdi>{COMPANY.taxId}</bdi>
                  </p>
                ) : (
                  <DevNote>{t('dev.taxId')}</DevNote>
                )}
              </div>
            </div>

            {/* Three columns and a date range: on a phone the table scrolls inside the
                document rather than widening it. */}
            <div className="table-scroll">
              <table className="data data--flush">
                <thead>
                  <tr>
                    <th scope="col">{t('inv.description')}</th>
                    <th scope="col">{t('inv.period')}</th>
                    <th scope="col" className="num">{t('col.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lines.map((l, i) => (
                    <tr key={`${l.product ?? l.productKey}-${i}`} className={l.sub ? 'is-sub' : undefined}>
                      <td>
                        {lineLabel(l)}
                        {l.taxable !== false && <sup>*</sup>}
                      </td>
                      <td className="serial">
                        {l.from && (
                          <bdi>
                            {l.from} – {l.to}
                          </bdi>
                        )}
                      </td>
                      <td className="num">{formatAmount(convert(l.amountUsdMinor, currency), locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="form__note">
              * {t('inv.taxNote')} <span className="serial">{rate}%</span>
            </p>

            <dl className="totals">
              <div className="totals__row">
                <dt>{t('cart.subtotal')}</dt>
                <dd>{formatAmount(convert(sub, currency), locale)}</dd>
              </div>
              <div className="totals__row">
                <dt>
                  {t('inv.tax')} <span className="serial">{rate}%</span>
                </dt>
                <dd>{formatAmount(convert(inv.taxUsdMinor, currency), locale)}</dd>
              </div>
              {inv.creditUsdMinor ? (
                <div className="totals__row totals__row--credit">
                  <dt>{t('inv.creditApplied')}</dt>
                  <dd>−{formatAmount(convert(inv.creditUsdMinor, currency), locale)}</dd>
                </div>
              ) : null}
              <div className="totals__row totals__row--grand">
                <dt>{t('cart.total')}</dt>
                <dd>{money(inv.totalUsdMinor)}</dd>
              </div>
            </dl>
          </article>

          <section className="card card--flush">
            <header className="card__head card__head--flush">
              <h2 className="card__heading">{t('inv.ledger')}</h2>
            </header>
            {ledger.length > 0 ? (
              <div className="table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">{t('account.date')}</th>
                      <th scope="col">{t('txn.kind')}</th>
                      <th scope="col">{t('checkout.method')}</th>
                      <th scope="col">{t('txn.reference')}</th>
                      <th scope="col" className="num">{t('col.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((x) => {
                      const g = GATEWAYS.find((gg) => gg.id === x.gateway);
                      return (
                        <tr key={x.id}>
                          <td className="serial"><bdi>{x.at}</bdi></td>
                          <td>
                            <Tag tone={x.kind === 'refund' ? 'bad' : x.kind === 'credit' ? 'neutral' : 'ok'}>
                              {t(`txn.${x.kind}` as never)}
                            </Tag>
                          </td>
                          <td>{g ? t(g.labelKey as never) : x.gateway === 'credit' ? t('pay.credit') : x.gateway}</td>
                          <td className="serial"><bdi>{x.reference}</bdi></td>
                          <td className={`num${x.amountUsdMinor < 0 ? ' is-out' : ''}`}>
                            <bdi>
                              {x.amountUsdMinor < 0 ? '−' : ''}
                              {money(Math.abs(x.amountUsdMinor))}
                            </bdi>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">
                <IconWallet size={28} />
                <p className="empty__title">{t('inv.noPayments')}</p>
                <p className="empty__note">{t('inv.noPaymentsNote')}</p>
              </div>
            )}
            <dl className="totals invoice__balance">
              <div className="totals__row totals__row--grand">
                <dt>{t('inv.balanceDue')}</dt>
                <dd>{money(balance)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="dash__side">
          {unpaid ? (
            <section className="card">
              <header className="card__head">
                <h2 className="card__heading">{t('inv.balanceDue')}</h2>
              </header>
              <p className="figure">
                <span className="figure__n serial">{money(balanceShown)}</span>
              </p>

              {/* C-17 use-credit: the balance the person owes is the one the switch leaves. */}
              {ACCOUNT.creditUsdMinor > 0 && (
                <label className="switch-row">
                  <span>
                    <span className="switch-row__label">{t('inv.useCredit')}</span>
                    <span className="switch-row__note">
                      {t('inv.useCreditNote')}{' '}
                      <span className="serial">{money(ACCOUNT.creditUsdMinor)}</span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    name="usecredit"
                    checked={useCredit}
                    onChange={(e) => setUseCredit(e.target.checked)}
                  />
                </label>
              )}

              <label className="field-label u-mt-16">
                <span className="eyebrow">{t('checkout.method')}</span>
                <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {gateways.map((g) => (
                    <option key={g.id} value={g.id}>
                      {t(g.labelKey as never)}
                    </option>
                  ))}
                </select>
              </label>

              {chosen && (
                <div className="u-mt-16">
                  <GatewayDetails
                    gateway={chosen}
                    compact
                    reference={inv.number}
                    amountMinor={convert(balanceShown, currency)}
                  />
                </div>
              )}

              <div className="acts u-mt-16">
                <Link className="btn btn--md btn--primary" to={payHref}>
                  {t('account.pay')}
                  <IconArrow size={15} />
                </Link>
              </div>
            </section>
          ) : (
            <section className="card card--calm">
              <header className="card__head">
                <h2 className="card__heading">
                  <IconCheck size={17} />
                  {t('inv.paidInFull')}
                </h2>
              </header>
              <dl className="kv">
                {inv.paidOn && (
                  <div><dt>{t('inv.paidOn')}</dt><dd className="serial"><bdi>{inv.paidOn}</bdi></dd></div>
                )}
                {paidWith && (
                  <div><dt>{t('checkout.method')}</dt><dd>{t(paidWith.labelKey as never)}</dd></div>
                )}
              </dl>
              <div className="acts u-mt-16">
                <Button size="md" variant="secondary" onClick={() => mark(t('inv.pdfPending'))}>
                  <IconInvoice size={15} />
                  {t('inv.pdf')}
                </Button>
              </div>
            </section>
          )}
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
  const [added, setAdded] = useState(false);
  const gateways = gatewaysFor(currency);
  const [method, setMethod] = useState(gateways[0]?.id ?? 'stripe-card');

  useEffect(() => {
    if (!gateways.some((g) => g.id === method)) setMethod(gateways[0]?.id ?? 'stripe-card');
  }, [gateways, method]);

  const presets = [1000, 2000, 5000, 10000];
  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;
  const chosen = gateways.find((g) => g.id === method);

  if (added) {
    return (
      <AccountLayout title={t('acc.funds')}>
        <div className="card card--calm">
          <p className="calm">
            <IconCheck size={22} />
            <span>
              <strong>{t('funds.doneTitle')}</strong>
              <span className="calm__note">
                {money(amount)} — {t('funds.doneNote')}
              </span>
            </span>
          </p>
        </div>
        <div className="form__foot">
          <Link className="btn btn--md btn--primary" to="/account/invoices">
            {t('acc.invoices')}
          </Link>
          <Link className="btn btn--md btn--secondary" to="/account">
            {t('acc.dashboard')}
          </Link>
        </div>
      </AccountLayout>
    );
  }

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
              {gateways.map((g) => (
                <li key={g.id}>
                  <label className={`method${method === g.id ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="fundsmethod"
                      value={g.id}
                      checked={method === g.id}
                      onChange={() => setMethod(g.id)}
                    />
                    <span className="method__label">
                      {t(g.labelKey as never)}
                      <span className="method__note">{t(g.noteKey as never)}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {chosen && (
              <div className="u-mt-16">
                <GatewayDetails gateway={chosen} compact amountMinor={convert(amount, currency)} />
              </div>
            )}
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
              <Button size="md" disabled={amount < 500} onClick={() => setAdded(true)}>
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
                  <Tag tone="ok">
                    <IconCheck size={13} />
                    {t('pm.primary')}
                  </Tag>
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
              <ConfirmButton
                label={`${t('action.remove')} ${m.kind} ${m.last4}`}
                onConfirm={() => setCards((all) => all.filter((x) => x.id !== m.id))}
              >
                {t('action.remove')}
              </ConfirmButton>
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
