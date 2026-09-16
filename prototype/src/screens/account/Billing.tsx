import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { ConfirmButton } from '../../components/ConfirmButton';
import { Card } from '../../components/Card';
import { Tag, INVOICE_TONE, REFUND_TONE } from '../../components/Tag';
import { DevNote } from '../../components/DevNote';
import { GatewayDetails } from '../../components/GatewayDetails';
import {
  IconArrow,
  IconInvoice,
  IconPlus,
  IconCheck,
  IconWallet,
  IconAlert,
  IconShield,
  IconCoin,
  IconSupport,
  IconClose,
  IconInfo,
  IconTrash,
  IconEye,
} from '../../components/icons';
import { RowMenu, type RowMenuItem } from '../../components/RowMenu';
import { TableToolbar, TableFilter, TableCount, matches } from '../../components/TableToolbar';
import { useLocale } from '../../lib/locale';
import { useSaved, SavedNote } from '../../lib/saved';
import { usePrefs } from '../../lib/prefs';
import { useAccountState } from '../../lib/accountState';
import {
  convert,
  formatAmount,
  gatewaysFor,
  GATEWAYS,
  COUNTRIES,
  TAX_RATE,
} from '../../lib/catalog';
import {
  PAYMENT_METHODS_SAVED,
  ACCOUNT,
  COMPANY,
  invoiceLedger,
  invoiceBalanceUsdMinor,
  refundFor,
  FAILED_PAYMENT,
  type Invoice,
  type InvoiceStatus,
  type InvoiceLine,
  type Refund,
} from '../../lib/account';
import { gatewayDestination } from '../Order';
import { Select } from '../../components/Select';

const FILTERS: (InvoiceStatus | 'all')[] = ['all', 'unpaid', 'paid', 'overdue', 'cancelled'];

/**
 * "Paid" and "paid, and then some of it came back" are two different things wearing one word in
 * a list. The chip is also how the refund section gets found: a state nobody can reach from the
 * screen above it is a state nobody reviews.
 */
function RefundTag({ inv }: { inv: Invoice }) {
  const { t } = useLocale();
  const refund = refundFor(inv);
  if (!refund) return null;
  return <Tag tone={REFUND_TONE[refund.status]}>{t('inv.refundTag')}</Tag>;
}

/** Invoices — spec 9.4: number, date, status, amount, filtered by status. */
export function Invoices() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { invoices, updateInvoice, removeInvoice } = useAccountState();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');
  const { saved, mark, clear } = useSaved(6000);
  /*
   * One banner for three different things — a PDF that is not wired up, an invoice cancelled,
   * an invoice taken off the list — so the body has to travel with the title rather than sit
   * under it as a constant. The two are always set together, by `say`.
   */
  const [note, setNote] = useState<string | null>(null);
  const say = (title: string, body: string) => {
    setNote(body);
    mark(title);
  };

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  // An invoice is looked up by its number or by what it was for, so the line items are part of
  // the haystack: "the one with the .eg domain on it" is how people describe an invoice.
  const rows = invoices.filter(
    (i) =>
      (filter === 'all' || i.status === filter) &&
      matches(q, i.number, i.date, i.due, ...i.lines.map((l) => `${l.product} ${l.domain ?? ''}`)),
  );
  const owing = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue');
  /*
   * What is owed, not what was billed.
   *
   * These used to be one number, because every unpaid fixture was untouched. One of them
   * carries a part payment now, so the totals add up to more than the debt — and the figure
   * this card prints is the one the Pay button beside it will ask for, which is the balance.
   * The payment screens have always read `invoiceBalanceUsdMinor`; this is the card agreeing
   * with them rather than with the column.
   */
  const owed = owing.reduce((s, i) => s + invoiceBalanceUsdMinor(i), 0);

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
      <SavedNote saved={saved} onDismiss={clear}>
        {note ? t(note as never) : undefined}
      </SavedNote>

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
                {/* Named for a screen reader, and `data__own` so the hidden label has a
                    positioned ancestor to resolve against — see `.data__own`. */}
                <th scope="col" className="data__own">
                  <span className="u-visually-hidden">{t('inv.rowMenu')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((inv) => {
                const balance = invoiceBalanceUsdMinor(inv);
                return (
                  <tr key={inv.id}>
                    <td className="data__own">
                      {/* The row's own button is in the menu now, so the number carries the
                          link — and `.data__link::after` stretches it over the whole cell, so
                          the target is the cell rather than the serial alone. The services
                          list reads the same way. */}
                      <Link className="lead serial data__link" to={`/account/invoices/${inv.id}`}>
                        <bdi>{inv.number}</bdi>
                      </Link>
                    </td>
                    <td className="serial"><bdi>{inv.date}</bdi></td>
                    <td className="serial"><bdi>{inv.due}</bdi></td>
                    <td className="num">
                      <span className="serial">{money(inv.totalUsdMinor)}</span>
                      {/* A part payment splits the total from the debt, and this column is
                          headed "amount" — so what is still owed is named under it rather than
                          left for the reader to work out from a ledger two screens away. */}
                      {balance > 0 && balance !== inv.totalUsdMinor && (
                        <span className="data__sub">
                          {t('inv.balanceDue')} <span className="serial">{money(balance)}</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="tags">
                        <Tag tone={INVOICE_TONE[inv.status]}>{t(`inv.${inv.status}` as never)}</Tag>
                        <RefundTag inv={inv} />
                      </p>
                    </td>
                    <td className="data__own">
                      <RowMenu
                        label={`${t('inv.rowMenu')} — ${inv.number}`}
                        items={invoiceRowItems(inv, t, {
                          pdf: () => say(t('inv.pdfPending'), 'inv.pdfPendingNote'),
                          cancel: () => {
                            updateInvoice(inv.id, { status: 'cancelled' });
                            say(t('inv.cancelledMsg'), 'inv.cancelledMsgNote');
                          },
                          remove: () => {
                            removeInvoice(inv.id);
                            say(t('inv.removedMsg'), 'inv.removedMsgNote');
                          },
                        })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TableCount shown={rows.length} total={invoices.length} />

      {rows.length > 0 && <DevNote>{t('dev.invoiceActions')}</DevNote>}
    </AccountLayout>
  );
}

/**
 * Where the money got to — C-15 extended.
 *
 * The ledger already carries the refund: a row, on the day it moved, the same width as every
 * other row. That is bookkeeping, and bookkeeping answers "was it done". Somebody who is owed
 * money is asking a different question — "where is it now" — and the answer to that one is a
 * state, an amount and a date somebody else controls. A row cannot hold those, so the refund
 * gets a section of its own above the ledger it is also a line in.
 *
 * The last step is deliberately not a promise. We know the day it left us; the day it lands is
 * the bank's, and the step says whose date it is rather than quietly adopting it as ours.
 */
function RefundStatus({ refund }: { refund: Refund }) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;
  const gateway = GATEWAYS.find((g) => g.id === refund.gateway);
  const declined = refund.status === 'declined';
  const done = refund.status === 'completed';

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__heading">
          <IconCoin size={17} />
          {t('inv.refund')}
        </h2>
        <Tag tone={REFUND_TONE[refund.status]}>{t(`inv.refund.${refund.status}` as never)}</Tag>
      </header>

      {/* The amount is what the section is for, so it is set in the one figure size this client
          area gives money — the same as a balance, because it is the same kind of number. */}
      <p className="figure">
        <span className="figure__n serial">{money(refund.amountUsdMinor)}</span>
        <span className="figure__unit">{t('inv.refundAmount')}</span>
      </p>
      <p className="credit__note">{t(`inv.refundNote.${refund.status}` as never)}</p>

      <ol className="steps">
        <li className="steps__item steps__item--done">
          <span className="steps__when serial">
            <bdi>{refund.requestedOn}</bdi>
          </span>
          <span className="steps__what">{t('inv.refundStep.requested')}</span>
        </li>
        {refund.decidedOn && (
          <li className={`steps__item ${declined ? 'steps__item--bad' : 'steps__item--done'}`}>
            <span className="steps__when serial">
              <bdi>{refund.decidedOn}</bdi>
            </span>
            <span className="steps__what">
              {t(declined ? 'inv.refundStep.declined' : 'inv.refundStep.approved')}
            </span>
          </li>
        )}
        {refund.sentOn && (
          <li className="steps__item steps__item--done">
            <span className="steps__when serial">
              <bdi>{refund.sentOn}</bdi>
            </span>
            <span className="steps__what">{t('inv.refundStep.sent')}</span>
          </li>
        )}
        {refund.expectedBy && !declined && (
          <li className={`steps__item${done ? ' steps__item--done' : ''}`}>
            <span className="steps__when serial">
              <bdi>{refund.expectedBy}</bdi>
            </span>
            <span className="steps__what">{t('inv.refundStep.expected')}</span>
          </li>
        )}
      </ol>
      {refund.expectedBy && !declined && (
        <p className="form__note">{t('inv.refundStep.expectedNote')}</p>
      )}

      <dl className="kv">
        <div>
          <dt>{t('inv.refundReason')}</dt>
          <dd>{t(refund.reasonKey as never)}</dd>
        </div>
        <div>
          <dt>{t('inv.refundTo')}</dt>
          <dd>
            {gateway ? t(gateway.labelKey as never) : refund.gateway}
            {refund.last4 && (
              <>
                {' '}···· <span className="serial">{refund.last4}</span>
              </>
            )}
          </dd>
        </div>
        {refund.reference && (
          <div>
            <dt>{t('txn.reference')}</dt>
            <dd className="serial">
              <bdi>{refund.reference}</bdi>
            </dd>
          </div>
        )}
      </dl>

      {/* A refund almost always came out of a conversation, and the conversation is where the
          rest of the explanation is. Sending someone to search the ticket list for it again is
          how a settled matter gets opened twice. */}
      {refund.ticketId && (
        <div className="form__foot">
          <Link className="btn btn--md btn--secondary" to={`/account/tickets/${refund.ticketId}`}>
            {t('inv.refundOpenTicket')}
            <IconArrow size={15} />
          </Link>
        </div>
      )}
    </section>
  );
}

/**
 * The way out when the money does not behave — spec 9.4, C-21.
 *
 * A payment page that only knows how to succeed leaves the one person who most needs help with
 * nothing to press: the charge failed, or it left their account and the invoice still says
 * unpaid, and the screen carries on offering them the button that just did not work. The route
 * to a human sits on the invoice, beside the paying, and takes the invoice number with it —
 * nobody should have to retype a number the screen they came from already knew.
 *
 * Where this invoice is the one that actually failed, the recovery screen is offered first: it
 * knows what the gateway said and when we try again, which is the answer before a ticket is.
 */
function PaymentHelp({ inv, unpaid }: { inv: Invoice; unpaid: boolean }) {
  const { t } = useLocale();
  const failed = FAILED_PAYMENT.invoiceId === inv.id;

  return (
    <section className="card">
      <header className="card__head">
        <h2 className="card__heading">
          <IconSupport size={17} />
          {t(unpaid ? 'inv.trouble' : 'inv.troubleSettled')}
        </h2>
      </header>
      <p className="credit__note">{t(unpaid ? 'inv.troubleNote' : 'inv.troubleSettledNote')}</p>
      <div className="acts">
        {unpaid && failed && (
          <Link className="btn btn--md btn--secondary" to="/account/payment-failed">
            {t('inv.troubleFailed')}
          </Link>
        )}
        <Link className="btn btn--md btn--quiet" to={`/account/tickets/new?invoice=${inv.id}`}>
          {t('inv.troubleAsk')}
          <IconArrow size={15} />
        </Link>
      </div>
    </section>
  );
}

/**
 * View, the PDF, edit, cancel, remove — the row's own five.
 *
 * Opening the invoice used to be a button of its own beside the menu, and a column of them
 * is a column the table pays for on every row — including the settled ones, where reading it
 * is the only thing left to do. The services list already answers this by leading its menu
 * with View and keeping one handle per row; the invoices list now reads the same way, and the
 * number cell carries the one-press route so opening an invoice is still one press.
 *
 * What an invoice offers below that depends on what it is. A settled one has nothing to edit
 * and nothing to cancel, and offering either would be handing a dead end to someone who came
 * for the record. A withdrawn one has nothing to pay and nothing to change, and is the only
 * kind the account may take off its own list — an invoice that is still owed cannot be tidied
 * away, or the list stops being the answer to "what do I owe".
 *
 * Neither of the two that take something away happens on one press: `confirmLabel` makes the
 * menu ask again, in place.
 */
function invoiceRowItems(
  inv: Invoice,
  t: (key: never) => string,
  act: { pdf: () => void; cancel: () => void; remove: () => void },
): RowMenuItem[] {
  const items: RowMenuItem[] = [
    {
      id: 'view',
      label: t('inv.view' as never),
      icon: <IconEye size={16} />,
      to: `/account/invoices/${inv.id}`,
    },
    {
      id: 'pdf',
      label: t('inv.pdf' as never),
      icon: <IconInvoice size={16} />,
      onSelect: act.pdf,
    },
  ];

  if (inv.status === 'unpaid' || inv.status === 'overdue') {
    items.push(
      {
        id: 'cancel',
        label: t('inv.cancelInvoice' as never),
        confirmLabel: t('inv.cancelConfirm' as never),
        icon: <IconClose size={16} />,
        onSelect: act.cancel,
        danger: true,
      },
    );
  }

  if (inv.status === 'cancelled') {
    items.push({
      id: 'remove',
      label: t('inv.deleteInvoice' as never),
      confirmLabel: t('inv.deleteConfirm' as never),
      icon: <IconTrash size={16} />,
      onSelect: act.remove,
      danger: true,
    });
  }

  return items;
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
  const { invoice } = useAccountState();
  const inv = invoice(id ?? '');
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
  /*
   * Three endings, not two.
   *
   * `unpaid` used to be "neither paid nor cancelled", which put the cancelled invoices in the
   * same branch as the settled ones — and that branch says "Paid in full". Nothing had been
   * paid on a withdrawn renewal and nothing ever would be, so the one state the client area
   * had no fixture for was also the one it described wrongly. Each of the three now says its
   * own thing.
   */
  const voided = inv.status === 'cancelled';
  const unpaid = !voided && inv.status !== 'paid';
  const ledger = invoiceLedger(inv);
  const refund = refundFor(inv);
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
        /* C-16 is blocked on I12 and the PDF is generated server-side, so the button reports
           why rather than doing nothing at all. Paying is not up here beside it: the payment
           card owns that, and one Pay now is the whole point of it being there. */
        <Button size="md" variant="secondary" onClick={() => mark(t('inv.pdfPending'))}>
          <IconInvoice size={15} />
          {t('inv.pdf')}
        </Button>
      }
    >
      <SavedNote saved={saved} onDismiss={clear}>
        {t('inv.pdfPendingNote')}
      </SavedNote>

      <div className="invoice-detail invoice-detail--act-first">
        {/*
          The document, what came back out of it and what was paid against it are one column;
          the payment card is the other. They start level, which is the whole point of the
          pairing — the amount owed is read beside the amount billed, not a screen below it.
        */}
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

          {refund && <RefundStatus refund={refund} />}

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
              <div className="empty empty--inset">
                <IconWallet size={28} />
                {/* "No payments yet" and "once you pay, the transaction appears here" are both
                    about a payment that is still coming. On a withdrawn invoice none is, and the
                    wait is the wrong thing to describe. */}
                <p className="empty__title">
                  {t(voided ? 'inv.noPaymentsVoid' : 'inv.noPayments')}
                </p>
                <p className="empty__note">
                  {t(voided ? 'inv.noPaymentsVoidNote' : 'inv.noPaymentsNote')}
                </p>
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
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {gateways.map((g) => (
                    <option key={g.id} value={g.id}>
                      {t(g.labelKey as never)}
                    </option>
                  ))}
                </Select>
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
          ) : voided ? (
            /* Calm, not urgent: a cancelled invoice asks nothing of the reader. It carries the
               dates it was raised and fell due, because those are the only facts it has — and
               no payment method, since no method was ever used on it. */
            <section className="card card--calm">
              <header className="card__head">
                <h2 className="card__heading">
                  <IconClose size={17} />
                  {t('inv.void')}
                </h2>
              </header>
              <p className="credit__note">{t('inv.voidNote')}</p>
              <dl className="kv">
                <div>
                  <dt>{t('account.date')}</dt>
                  <dd className="serial"><bdi>{inv.date}</bdi></dd>
                </div>
                <div>
                  <dt>{t('inv.due')}</dt>
                  <dd className="serial"><bdi>{inv.due}</bdi></dd>
                </div>
              </dl>
              <div className="acts u-mt-16">
                <Button size="md" variant="secondary" onClick={() => mark(t('inv.pdfPending'))}>
                  <IconInvoice size={15} />
                  {t('inv.pdf')}
                </Button>
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

          <PaymentHelp inv={inv} unpaid={unpaid} />
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
            {/*
              The field leads; the presets follow it. The presets used to come first, which made
              them the offer and left the field as the exception — it was labelled "another
              amount" — when the amount an account actually wants is the ordinary case and the
              four figures are the shortcut into it. The card heading labels the field, so the
              field carries its own label for a screen reader only rather than saying it twice.
            */}
            <div className="form">
              <label className="field-label">
                <span className="u-visually-hidden">{t('funds.amount')}</span>
                <input
                  className="field serial"
                  type="number"
                  min={5}
                  dir="ltr"
                  value={(amount / 100).toFixed(2)}
                  onChange={(e) => setAmount(Math.round(Number(e.target.value) * 100))}
                />
              </label>

              <div className="field-label">
                <span className="eyebrow">{t('funds.quick')}</span>
                <div className="chips" role="group" aria-label={t('funds.quick')}>
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
              </div>
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
  const [params] = useSearchParams();

  /*
   * `?added=1` is how the card-setup flow reports back, and `&primary=1` whether the card
   * arrived as the primary one. The card has to be in the list when it does: a flow that ends
   * on a list that looks exactly as it did before reads as a flow that silently failed. There
   * is no server here to have saved anything, so the prototype shows the card one would have.
   */
  const added = params.get('added') === '1';
  const addedPrimary = added && params.get('primary') === '1';
  const [note, setNote] = useState(added);
  const [cards, setCards] = useState(() =>
    added
      ? [
          { id: 'pm-new', kind: 'Visa', last4: '1881', expiry: '11/30', primary: addedPrimary },
          ...PAYMENT_METHODS_SAVED.map((m) => ({ ...m, primary: m.primary && !addedPrimary })),
        ]
      : PAYMENT_METHODS_SAVED,
  );

  // The add screen says something different about the primary switch for the first card on an
  // account, and it cannot see this list — so the list tells it on the way in.
  const addTo = `/account/payment-methods/new${cards.length === 0 ? '?first=1' : ''}`;

  return (
    <AccountLayout
      title={t('acc.methods')}
      lede={t('pm.lede')}
      actions={
        <Link className="btn btn--md btn--secondary" to={addTo}>
          <IconPlus size={15} />
          {t('pm.add')}
        </Link>
      }
    >
      <SavedNote saved={note ? t('pm.addedTitle') : null} onDismiss={() => setNote(false)}>
        {t('pm.addedNote')}
      </SavedNote>

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
        /* An empty list is the one state that most needs the way out of it, and the way out
           used to be only in the page header. */
        <div className="card empty">
          <IconInvoice size={28} />
          <p className="empty__title">{t('empty.methods')}</p>
          <p className="empty__note">{t('pm.lede')}</p>
          <Link className="btn btn--md btn--secondary" to={addTo}>
            <IconPlus size={15} />
            {t('pm.add')}
          </Link>
        </div>
      )}
    </AccountLayout>
  );
}

/**
 * Add a card — the account-side half of spec 5.4.
 *
 * Saving a card is not a purchase, and it used to be treated as one: the button on the card
 * list pointed at the checkout's payment screen, so adding a card asked for a bank
 * confirmation of `0.00`, offered a "save this card" toggle for the one flow where saving is
 * the entire point, put the cart behind its Back button, and finished on a confirmation for an
 * order nobody had placed.
 *
 * This is the same Stripe slot with the checkout's arithmetic taken out and the one decision
 * that does belong here put in: whether the renewals move to this card. The trip to the bank
 * stays — a card kept for future renewals needs the same confirmation a payment does — so the
 * button goes to 3-D Secure in setup mode, which knows to come back to the list.
 */
/**
 * Which method to keep on file — the step that was missing.
 *
 * Add opened the card form directly, so the only method an account could keep was a card. The
 * Egyptian wallet is tokenisable and was unreachable; two of the five gateways this product
 * already supports were not offered at all.
 *
 * The list is `storable`, not every gateway. A bank transfer and an InstaPay send are somebody
 * moving money by hand and cannot be repeated on our say-so, so offering to "save" one would
 * promise an auto-renewal that will never run — the one failure on this screen a customer
 * discovers when a service stops. They are named underneath instead, because a customer who
 * pays by InstaPay every month looks for them here first and an absence with no reason reads
 * as a missing feature.
 *
 * Where it goes next is the gateway's own flow: inline collects the card here, redirect is
 * authorised at the provider and lands back on the list.
 */
export function AddPaymentMethod() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const first = params.get('first') === '1';
  const storable = GATEWAYS.filter((g) => g.storable);
  const [choice, setChoice] = useState(storable[0]?.id ?? '');

  return (
    <AccountLayout
      title={t('pm.choose')}
      lede={t('pm.chooseLede')}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.methods'), to: '/account/payment-methods' },
        { label: t('pm.choose') },
      ]}
    >
      <Card>
        <ul className="methods">
          {storable.map((g) => (
            <li key={g.id}>
              <label className={`method${choice === g.id ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="pm-kind"
                  value={g.id}
                  checked={choice === g.id}
                  onChange={() => setChoice(g.id)}
                />
                <span className="method__label">
                  {t(g.labelKey as never)}
                  <span className="method__note">{t(g.noteKey as never)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="form__foot">
          <Button
            size="md"
            onClick={() => {
              const g = GATEWAYS.find((x) => x.id === choice);
              if (!g) return;
              navigate(
                g.flow === 'inline'
                  ? `/account/payment-methods/new/card${first ? '?first=1' : ''}`
                  : `/checkout/redirect?gateway=${g.id}&setup=${g.id}`,
              );
            }}
          >
            {t('pm.continue')}
            <IconArrow size={15} />
          </Button>
        </div>
      </Card>

      <div className="notice notice--spaced">
        <IconInfo size={20} />
        <div>
          <h2 className="card__title">{t('pm.manualTitle')}</h2>
          <p className="card__body">{t('pm.manualNote')}</p>
        </div>
      </div>
    </AccountLayout>
  );
}

export function AddCard() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // The first card on an account is its primary one whether or not anybody asks. The switch
  // says so rather than offering a choice with one answer, and cannot be turned off into a
  // state — an account with a card and no primary card — that renewals have no way to read.
  // `?first=1` is the list saying it had nothing in it, which is a thing only the list knows.
  const first = params.get('first') === '1' || PAYMENT_METHODS_SAVED.length === 0;
  const [primary, setPrimary] = useState(first);

  return (
    <AccountLayout
      title={t('pm.add')}
      lede={t('pm.addLede')}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.methods'), to: '/account/payment-methods' },
        { label: t('pm.add') },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('card.details')}</h2>
            </header>

            {/* Stripe's fields, and the reason this is a marked space rather than a drawing of
                three inputs, are the same here as at the checkout — see CardEntry in Order. */}
            <div className="slot" role="group" aria-label={t('card.slotLabel')}>
              <span className="slot__tag">{t('card.slotTag')}</span>
              <p className="slot__note">{t('card.slotNote')}</p>
            </div>

            {/* The first card on an account is its primary one either way, so there is nothing
                to decide and no switch: a control locked to its only answer is the kind of
                dead thing that makes a person doubt the rest of the screen. It is said as a
                fact instead, and the card still leaves here as the primary one. */}
            {first ? (
              <p className="hint">{t('pm.addPrimaryFirst')}</p>
            ) : (
              <label className="switch-row u-mt-16">
                <span>
                  <span className="switch-row__label">{t('pm.addPrimary')}</span>
                  <span className="switch-row__note">{t('pm.addPrimaryNote')}</span>
                </span>
                <input
                  type="checkbox"
                  checked={primary}
                  onChange={(e) => setPrimary(e.target.checked)}
                />
              </label>
            )}
          </section>

          <div className="notice notice--spaced">
            <IconShield size={20} />
            <div>
              <p className="card__body">{t('card.secure')}</p>
            </div>
          </div>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">
                <IconAlert size={17} />
                {t('pm.addVerify')}
              </h2>
            </header>

            {/* Where the checkout puts the amount due. Nothing is due, and a `0.00` standing in
                for it reads as a total that failed to load — so the panel carries the one money
                fact that is true of saving a card: the bank may briefly hold a little of it. */}
            <p className="card__body">{t('pm.addVerifyNote')}</p>

            <div className="acts u-mt-16">
              <Button
                size="md"
                onClick={() => navigate(`/checkout/3ds?setup=card${primary ? '&primary=1' : ''}`)}
              >
                {t('pm.addSubmit')}
              </Button>
              <Link className="btn btn--md btn--quiet" to="/account/payment-methods">
                {t('action.back')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}
