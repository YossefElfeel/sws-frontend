import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import {
  IconCheck,
  IconAlert,
  IconArrow,
  IconCopy,
  IconShield,
  IconInfo,
  IconExternal,
  IconClose,
} from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart } from '../lib/cart';
import { convert, formatAmount, gatewaysFor, GATEWAYS } from '../lib/catalog';

/** A fixed reference so the screenshots of these screens do not change between runs. */
const REF = 'SWS-26090114';

/** The ordering steps sit outside the app shell and outside the category rail. */
function OrderPage({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{title}</h1>
        {lede && <p className="section__lede measure">{lede}</p>}
      </section>
      <section className="section shell">{children}</section>
    </Layout>
  );
}

/**
 * Domain registrant details — O-06.
 *
 * Most extensions want a name and an address. Some registries want more, and .ae and .sa are
 * the two the spec names. The extra fields appear only for the extensions that require them,
 * with the registry named — an unexplained mandatory field on a checkout is a field people
 * abandon the order over.
 */
export function Registrant() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [tld, setTld] = useState('.com');

  const needsExtra = tld === '.ae' || tld === '.sa';

  return (
    <OrderPage title={t('reg.title')} lede={t('reg.lede')}>
      <form
        className="checkout"
        onSubmit={(e) => {
          e.preventDefault();
          navigate('/checkout');
        }}
      >
        <div className="checkout__main">
          <fieldset className="fieldset">
            <legend>{t('reg.who')}</legend>
            <div className="field-grid">
              <label className="field-label">
                <span className="eyebrow">{t('checkout.name')}</span>
                <input className="field" required />
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('reg.org')}</span>
                <input className="field" />
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('checkout.email')}</span>
                <input className="field" type="email" dir="ltr" required />
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('checkout.phone')}</span>
                <input className="field" type="tel" dir="ltr" required />
              </label>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend>{t('reg.where')}</legend>
            <label className="field-label">
              <span className="eyebrow">{t('auth.address')}</span>
              <input className="field" required />
            </label>
            <div className="field-grid">
              <label className="field-label">
                <span className="eyebrow">{t('auth.city')}</span>
                <input className="field" required />
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('auth.postcode')}</span>
                <input className="field serial" dir="ltr" required />
              </label>
            </div>
          </fieldset>

          {/* The extension picker is here only so the conditional block can be reviewed; in
              the real flow it comes from the domain already in the cart. */}
          <fieldset className="fieldset">
            <legend>{t('reg.ext')}</legend>
            <div className="methods">
              {['.com', '.ae', '.sa'].map((x) => (
                <label className={`method${tld === x ? ' is-selected' : ''}`} key={x}>
                  <input type="radio" name="tld" checked={tld === x} onChange={() => setTld(x)} />
                  <span className="method__label serial">
                    <bdi>{x}</bdi>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {needsExtra && (
            <fieldset className="fieldset fieldset--extra">
              <legend>
                {t('reg.extra')} <bdi>{tld}</bdi>
              </legend>
              {/* Naming the registry is what turns a mandatory field from an obstacle into a
                  requirement someone can act on. */}
              <p className="hint">{t(tld === '.ae' ? 'reg.aeNote' : 'reg.saNote')}</p>
              <div className="field-grid">
                <label className="field-label">
                  <span className="eyebrow">{t('reg.idType')}</span>
                  <select className="field">
                    <option>{t('reg.idPassport')}</option>
                    <option>{t('reg.idNational')}</option>
                    <option>{t('reg.idTrade')}</option>
                  </select>
                </label>
                <label className="field-label">
                  <span className="eyebrow">{t('reg.idNumber')}</span>
                  <input className="field serial" dir="ltr" required />
                </label>
              </div>
            </fieldset>
          )}
        </div>

        <aside className="checkout__aside">
          <div>
            <h2 className="card__title">{t('reg.why')}</h2>
            <p className="card__body">{t('reg.whyBody')}</p>
            <div className="acts u-mt-16">
              <Button size="lg" type="submit">
                {t('action.continue')}
                <IconArrow size={17} />
              </Button>
              <Link className="btn btn--md btn--quiet" to="/cart">
                {t('action.back')}
              </Link>
            </div>
          </div>
        </aside>
      </form>
    </OrderPage>
  );
}

/**
 * Card entry — O-08.
 *
 * The card fields belong to Stripe and render inside its iframe, so this screen does not draw
 * them. What it draws is everything around them, which is the part that is ours: the frame,
 * the amount being charged, the reassurance, and the errors that arrive from outside the
 * iframe. The slot is marked as a slot rather than mocked up as fake inputs — a screenshot of
 * invented card fields would be reviewed as though it were the real thing.
 */
export function CardEntry() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { total } = useCart();
  const navigate = useNavigate();

  return (
    <OrderPage title={t('card.title')}>
      <div className="checkout">
        <div className="checkout__main">
          <div className="panel panel--pad">
            <h2 className="card__title">{t('card.details')}</h2>

            <div className="slot" role="group" aria-label={t('card.slotLabel')}>
              <span className="slot__tag">{t('card.slotTag')}</span>
              <p className="slot__note">{t('card.slotNote')}</p>
            </div>

            <label className="switch-row u-mt-16">
              <span>
                <span className="switch-row__label">{t('card.save')}</span>
                <span className="switch-row__note">{t('card.saveNote')}</span>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
          </div>

          <div className="notice notice--spaced">
            <IconShield size={20} />
            <div>
              <p className="card__body">{t('card.secure')}</p>
            </div>
          </div>
        </div>

        <aside className="checkout__aside">
          <div>
            <h2 className="card__title">{t('cart.due')}</h2>
            <p className="figure">
              <span className="figure__n serial">
                {formatAmount(convert(total, currency), locale)} {currency}
              </span>
            </p>
            <div className="acts u-mt-16">
              <Button size="lg" onClick={() => navigate('/checkout/3ds')}>
                {t('card.pay')}
              </Button>
              <Link className="btn btn--md btn--quiet" to="/checkout">
                {t('action.back')}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </OrderPage>
  );
}

/**
 * 3-D Secure — O-09.
 *
 * The challenge itself is a page the bank hosts; we never see it and cannot style it. So this
 * screen is the two moments either side of it: the handoff, which has to say where you are
 * going and that the tab is expected, and the return, which has to say what came back.
 *
 * ?state=return renders the second moment.
 */
export function ThreeDSecure() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const returning = params.get('state') === 'return';

  return (
    <OrderPage title={t('tds.title')}>
      <div className="stage">
        {returning ? (
          <>
            <span className="stage__mark stage__mark--ok" aria-hidden="true">
              <IconCheck size={28} />
            </span>
            <h2 className="stage__title">{t('tds.backTitle')}</h2>
            <p className="stage__body">{t('tds.backBody')}</p>
            <div className="acts u-mt-16">
              <Button size="lg" onClick={() => navigate('/confirmation')}>
                {t('tds.finish')}
                <IconArrow size={17} />
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="stage__mark" aria-hidden="true">
              <IconShield size={28} />
            </span>
            <h2 className="stage__title">{t('tds.goTitle')}</h2>
            <p className="stage__body">{t('tds.goBody')}</p>

            {/* The bank's page is not ours to draw, and pretending otherwise in a review build
                is how a reviewer ends up approving a screen that will never exist. */}
            <div className="slot slot--tall" role="img" aria-label={t('tds.slotLabel')}>
              <span className="slot__tag">{t('tds.slotTag')}</span>
              <p className="slot__note">{t('tds.slotNote')}</p>
            </div>

            <div className="acts u-mt-16">
              <Button size="lg" onClick={() => navigate('/checkout/3ds?state=return')}>
                <IconExternal size={17} />
                {t('tds.go')}
              </Button>
              <Link className="btn btn--md btn--quiet" to="/order/failed">
                {t('tds.cancel')}
              </Link>
            </div>
            <p className="hint u-mt-16">{t('tds.dontClose')}</p>
          </>
        )}
      </div>
    </OrderPage>
  );
}

/**
 * Bank transfer and wallet instructions — O-10 and O-11.
 *
 * One screen, because the instruction is the same shape: send this amount, to this account,
 * quoting this reference, then tell us. The reference is the whole screen — a transfer that
 * arrives without one becomes a support ticket and a delayed order — so it is the largest
 * thing on the page and it is copyable.
 *
 * B1/B2 are open on the wallet gateway. The launch approach the register recommends is a
 * manual transfer with a receipt upload, which is what this builds.
 */
export function TransferInstructions({ kind }: { kind: 'bank' | 'wallet' }) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { total } = useCart();
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const rows =
    kind === 'bank'
      ? [
          { k: 'bank.beneficiary', v: 'Somion Web Services AG' },
          { k: 'bank.iban', v: 'CH93 0076 2011 6238 5295 7' },
          { k: 'bank.swift', v: 'POFICHBEXXX' },
          { k: 'bank.name', v: 'PostFinance AG, Bern' },
        ]
      : [
          { k: 'wal.name', v: 'Somion Egypt' },
          { k: 'wal.number', v: '+20 100 442 8817' },
          { k: 'wal.instapay', v: 'somion@instapay' },
        ];

  if (sent) {
    return (
      <OrderPage title={t(kind === 'bank' ? 'bank.title' : 'wal.title')}>
        <div className="stage">
          <span className="stage__mark stage__mark--ok" aria-hidden="true">
            <IconCheck size={28} />
          </span>
          <h2 className="stage__title">{t('bank.gotIt')}</h2>
          <p className="stage__body">{t('bank.gotItBody')}</p>
          <div className="acts u-mt-16">
            <Link className="btn btn--lg btn--primary" to="/account/invoices">
              {t('acc.invoices')}
            </Link>
          </div>
        </div>
      </OrderPage>
    );
  }

  return (
    <OrderPage
      title={t(kind === 'bank' ? 'bank.title' : 'wal.title')}
      lede={t(kind === 'bank' ? 'bank.lede' : 'wal.lede')}
    >
      <div className="checkout">
        <div className="checkout__main">
          {/* The reference is what connects the money to the order. It is the biggest thing on
              the screen because a transfer without it is a support ticket. */}
          <div className="panel panel--pad ref">
            <p className="ref__label">{t('bank.reference')}</p>
            <p className="ref__code serial">
              <bdi>{REF}</bdi>
            </p>
            <Button
              size="md"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(REF).then(
                  () => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  },
                  () => setCopied(false),
                );
              }}
            >
              {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
              {t(copied ? 'aff.copied' : 'aff.copy')}
            </Button>
            <p className="ref__warn">
              <IconAlert size={15} />
              {t('bank.refWarn')}
            </p>
          </div>

          <div className="panel panel--pad">
            <h2 className="card__title">{t('bank.sendTo')}</h2>
            <dl className="kv">
              {rows.map((r) => (
                <div key={r.k}>
                  <dt>{t(r.k as never)}</dt>
                  <dd className="serial">
                    <bdi>{r.v}</bdi>
                  </dd>
                </div>
              ))}
              <div>
                <dt>{t('col.amount')}</dt>
                <dd className="serial">
                  {formatAmount(convert(total, currency), locale)} {currency}
                </dd>
              </div>
            </dl>
          </div>

          <form
            className="panel panel--pad"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <h2 className="card__title">{t('bank.tellUs')}</h2>
            <p className="card__body">{t('bank.tellUsBody')}</p>
            <label className="field-label u-mt-16">
              <span className="eyebrow">{t('bank.receipt')}</span>
              <input className="field" type="file" accept=".jpg,.jpeg,.png,.pdf" />
            </label>
            <div className="form__foot">
              <Button size="lg" type="submit">
                {t('bank.confirm')}
              </Button>
            </div>
          </form>
        </div>

        <aside className="checkout__aside">
          <div>
            <h2 className="card__title">{t('bank.whenTitle')}</h2>
            <ol className="steps">
              <li className="steps__item steps__item--done">
                <span className="steps__what">{t('bank.w1')}</span>
              </li>
              <li className="steps__item">
                <span className="steps__what">
                  {t(kind === 'bank' ? 'bank.w2' : 'wal.w2')}
                </span>
              </li>
              <li className="steps__item">
                <span className="steps__what">{t('bank.w3')}</span>
              </li>
            </ol>
            <p className="hint">{t('bank.hold')}</p>
          </div>
        </aside>
      </div>
    </OrderPage>
  );
}

/**
 * Payment failure — O-13.
 *
 * The register calls this the single biggest conversion-recovery opportunity in the project,
 * and the reason is that the default behaviour throws the order away. Nothing here is lost:
 * the cart is intact, the amount is unchanged, and the next action is one tap on a different
 * method. The cause is named, because "please try again" against an expired card is advice
 * that cannot work.
 */
export function PaymentFailure() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { lines, total } = useCart();
  const [params] = useSearchParams();

  const reason = params.get('reason') ?? 'declined';
  const others = gatewaysFor(currency).filter((g) => g.id !== 'stripe-card');

  return (
    <OrderPage title={t('pf.title')}>
      <div className="checkout">
        <div className="checkout__main">
          <div className="panel panel--pad panel--bad">
            <h2 className="card__title">
              <IconAlert size={18} />
              {t(`fail.reason.${reason}` as never)}
            </h2>
            <p className="card__body">{t(`fail.advice.${reason}` as never)}</p>
          </div>

          {/* Saying the order is intact is the single most useful sentence on this screen. */}
          <div className="notice notice--spaced">
            <IconCheck size={20} />
            <div>
              <h2 className="card__title">{t('pf.kept')}</h2>
              <p className="card__body">
                {t('pf.keptBody')} <span className="serial">{lines.length}</span>
              </p>
            </div>
          </div>

          <div className="panel panel--pad">
            <h2 className="card__title">{t('pf.tryAnother')}</h2>
            {/* A list of ways out of a failure is read one at a time, so it is a column
                rather than a wrapping row that breaks into uneven pairs. */}
            <ul className="methods methods--stack">
              {others.map((g) => (
                <li key={g.id}>
                  <Link className="method" to="/checkout">
                    <span className="method__label">{t(g.labelKey as never)}</span>
                    <IconArrow size={15} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="checkout__aside">
          <div>
            <h2 className="card__title">{t('cart.due')}</h2>
            <p className="figure">
              <span className="figure__n serial">
                {formatAmount(convert(total, currency), locale)} {currency}
              </span>
            </p>
            <p className="credit__note">{t('pf.unchanged')}</p>
            <div className="acts">
              <Link className="btn btn--lg btn--primary" to="/checkout/card">
                {t('pf.retry')}
              </Link>
              <Link className="btn btn--md btn--secondary" to="/cart">
                {t('cart.review')}
              </Link>
              <div className="acts__sep">
                <Link className="btn btn--md btn--quiet" to="/account/tickets/new">
                  {t('fail.getHelp')}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </OrderPage>
  );
}

/**
 * Pending order / fraud review — O-14.
 *
 * WHMCS holds orders on its own and tells the customer nothing, which turns a routine
 * automated check into a silence people read as a failed payment. The whole value of this
 * screen is saying the four things the silence leaves out: it is held, the money is taken but
 * not lost, roughly how long, and whether anything is needed from you.
 */
export function PendingOrder() {
  const { t } = useLocale();

  return (
    <OrderPage title={t('pend.title')}>
      <div className="checkout">
        <div className="checkout__main">
          <div className="stage stage--flush">
            <span className="stage__mark stage__mark--wait" aria-hidden="true">
              <IconShield size={28} />
            </span>
            <h2 className="stage__title">{t('pend.heading')}</h2>
            <p className="stage__body">{t('pend.body')}</p>
          </div>

          <div className="panel panel--pad">
            <h2 className="card__title">{t('pend.whatNow')}</h2>
            <ol className="steps">
              <li className="steps__item steps__item--done">
                <span className="steps__what">{t('pend.s1')}</span>
              </li>
              <li className="steps__item">
                <span className="steps__what">{t('pend.s2')}</span>
              </li>
              <li className="steps__item">
                <span className="steps__what">{t('pend.s3')}</span>
              </li>
            </ol>
          </div>

          <div className="notice notice--spaced">
            <IconInfo size={20} />
            <div>
              <h2 className="card__title">{t('pend.money')}</h2>
              <p className="card__body">{t('pend.moneyBody')}</p>
            </div>
          </div>
        </div>

        <aside className="checkout__aside">
          <div>
            <h2 className="card__title">{t('bank.reference')}</h2>
            <p className="ref__code serial">
              <bdi>{REF}</bdi>
            </p>
            <div className="acts u-mt-16">
              <Link className="btn btn--md btn--secondary" to="/account/invoices">
                {t('acc.invoices')}
              </Link>
              <Link className="btn btn--md btn--quiet" to="/account/tickets/new">
                {t('pend.ask')}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </OrderPage>
  );
}

/** A convenience so both transfer routes read the same way in App.tsx. */
export function BankTransfer() {
  return <TransferInstructions kind="bank" />;
}

export function WalletTransfer() {
  return <TransferInstructions kind="wallet" />;
}

/** Named so the gateway list in Checkout can reach the right instruction screen. */
export function gatewayDestination(id: string): string {
  const g = GATEWAYS.find((x) => x.id === id);
  if (!g) return '/checkout/card';
  if (g.id === 'bank') return '/order/bank';
  if (g.id === 'instapay' || g.id === 'wallet-egp') return '/order/wallet';
  return '/checkout/card';
}

/** Session expiry — A-07. Kept here because it is the ordering flow that loses the most. */
export function SessionExpired() {
  const { t } = useLocale();
  const { lines } = useCart();

  return (
    <OrderPage title={t('exp.title')}>
      <div className="stage">
        <span className="stage__mark stage__mark--wait" aria-hidden="true">
          <IconClose size={28} />
        </span>
        <h2 className="stage__title">{t('exp.heading')}</h2>
        <p className="stage__body">{t('exp.body')}</p>

        {/* What survives the expiry is the thing worth saying, not the expiry itself. */}
        {lines.length > 0 && (
          <p className="stage__kept">
            <IconCheck size={16} />
            {t('exp.kept')} <span className="serial">{lines.length}</span>
          </p>
        )}

        <div className="acts u-mt-16">
          <Link className="btn btn--lg btn--primary" to="/login">
            {t('nav.login')}
            <IconArrow size={17} />
          </Link>
          <Link className="btn btn--md btn--quiet" to="/">
            {t('exp.home')}
          </Link>
        </div>
      </div>
    </OrderPage>
  );
}
