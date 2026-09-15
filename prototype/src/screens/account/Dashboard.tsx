import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Card } from '../../components/Card';
import { PromoRail } from '../../components/PromoRail';
import { StatRow, type StatItem } from '../../components/Stat';
import { Tag, SERVICE_TONE, TICKET_TONE } from '../../components/Tag';
import { ServiceMeters, ServiceShortcuts } from '../../components/ServiceUsage';
import {
  IconServer,
  IconGlobe,
  IconInvoice,
  IconSupport,
  IconArrow,
  IconAlert,
  IconCheck,
  IconWallet,
  IconCalendar,
  IconPlus,
  IconBook,
  IconMegaphone,
  IconSpark,
  IconGauge,
  IconUsers,
  IconSignOut,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { useAccountState } from '../../lib/accountState';
import { convert, formatAmount } from '../../lib/catalog';
import {
  SERVICES,
  DOMAINS,
  TICKETS,
  ANNOUNCEMENTS,
  ACCOUNT,
  renews,
  invoiceBalanceUsdMinor,
  NEEDS_ATTENTION,
} from '../../lib/account';

/**
 * Dashboard — spec 9.1.
 *
 * An overview screen answers one question: is there anything I have to do. So the screen is
 * ordered by obligation rather than by section — what is owed, then what is running, then what
 * is worth reading, and the screen closes on support. A count is a link in every case, because
 * the reason to show "1 unpaid invoice" is to let someone go and pay it.
 *
 * The body is one grid of paired cards rather than two columns flowing independently; see the
 * note on `.dash--paired` where it is built.
 *
 * "Today" is fixed rather than read from the clock: the fixtures carry dates, and a review
 * build whose contents change with the calendar cannot be compared against yesterday's
 * screenshot.
 */
const TODAY = new Date('2026-09-01T00:00:00Z');

/** Whole days from the fixed today to an ISO date. Negative means it has already passed. */
function daysUntil(iso: string): number {
  const then = new Date(`${iso}T00:00:00Z`).getTime();
  return Math.round((then - TODAY.getTime()) / 86_400_000);
}

/**
 * Who the account belongs to — spec 9.7's details, read-only, at the head of the side column.
 *
 * It is here for one reason that is easy to miss from a design: the client number is the first
 * thing support asks for, and until now it appeared nowhere a signed-in person could read it.
 * Everything else in the card is the posting address, which is the other thing that is wrong
 * exactly when nobody has looked at it — so the card's job is to be glanced at and, on the one
 * day it is wrong, to be one press away from the form that fixes it.
 *
 * Initials rather than a photograph. No avatar is uploaded anywhere in this product, and a
 * stock silhouette standing in for a person is the kind of placeholder that ships.
 */
function IdentityCard() {
  const { t, bi } = useLocale();

  const name = bi(ACCOUNT.name);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => [...word][0])
    .join('');

  return (
    <Card className="ident" heading={t('ident.title')} icon={<IconUsers size={17} />}>
      <div className="ident__who">
        <span className="ident__avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="ident__whom">
          {/* The number is the reason the card exists, so it is the line set in the serial
              face and the line that reads first. */}
          <span className="ident__id serial">
            <bdi>#{ACCOUNT.clientId}</bdi>
          </span>
          <span className="ident__org">{bi(ACCOUNT.company ?? ACCOUNT.name)}</span>
        </span>
      </div>

      {/* An address is one block of text, not six labelled fields: nobody reads their own
          postcode under a heading that says "postcode". */}
      <p className="ident__address">
        <span>{name}</span>
        <span>{bi(ACCOUNT.address)}</span>
        <span>
          <bdi>
            {bi(ACCOUNT.city)} {ACCOUNT.postcode}
          </bdi>
        </span>
        <span>{t(`country.${ACCOUNT.country.toLowerCase()}` as never)}</span>
      </p>

      <div className="ident__actions">
        <Link className="btn btn--sm btn--secondary" to="/account/security">
          {t('ident.update')}
        </Link>
        <Link className="btn btn--sm btn--quiet" to="/login">
          <IconSignOut size={14} />
          {t('app.signOut')}
        </Link>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { t, locale, bi } = useLocale();
  const { currency } = usePrefs();
  /* Cancelling an invoice on the invoices screen has to show up here, so this reads the
     account's editable copy rather than the fixture behind it. */
  const { invoices } = useAccountState();

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  const unpaid = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue');
  const openTickets = TICKETS.filter((x) => x.status !== 'closed');
  /* The balance, not the total — one of the owing invoices is part-paid, and the tile beside
     this one links to the invoice that will ask for the balance. See Invoices(). */
  const dueTotal = unpaid.reduce((s, i) => s + invoiceBalanceUsdMinor(i), 0);
  const active = SERVICES.filter((s) => s.status === 'active').length;

  /*
   * A preview, not the list. Every other card on this screen is capped — five renewals, two
   * announcements — and this one was not, so it rendered whatever the account happened to own.
   * At three services that read as a summary; at ten it is the services page with a dashboard
   * around it, and it left the card beside it stretched to match with 380px of nothing in it.
   *
   * What is wrong comes first. The screen is ordered by obligation, and a preview that shows
   * the five alphabetically-first services on an account with a suspended one is a preview
   * that hides the only row worth opening. "View all" is one press away for the rest.
   */
  /*
   * The primary hosting account — the one the usage card and the shortcuts report on.
   *
   * "Primary" is the first live cPanel product the account holds, in the order the fixtures
   * list them. It is not a field WHMCS stores, and the day an account holds two it is a guess
   * dressed as a fact — which is why both cards print the domain they are about rather than
   * leaving the reader to assume. A VPS is excluded: it has no cPanel behind it, so the ten
   * shortcuts would all lead somewhere that is not there.
   */
  const primary = SERVICES.find((s) => s.status === 'active' && s.kind === 'cpanel');
  const servicePreview = [
    ...SERVICES.filter((s) => NEEDS_ATTENTION.includes(s.status)),
    ...SERVICES.filter((s) => !NEEDS_ATTENTION.includes(s.status)),
  ].slice(0, 5);

  // Nearest first, and only what is close enough to act on.
  const renewals = [
    ...SERVICES.filter((s) => renews(s.status)).map((s) => ({ id: s.id, label: s.product, sub: s.domain, on: s.nextDue, to: `/account/services/${s.id}` })),
    ...DOMAINS.map((d) => ({ id: d.id, label: d.name, sub: t('acc.domains'), on: d.expires, to: `/account/domains/${d.id}` })),
  ]
    .map((r) => ({ ...r, days: daysUntil(r.on) }))
    .filter((r) => r.days >= 0 && r.days <= 60)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  /*
   * Every tile carries the same four parts — a category glyph, the count, the label and one
   * qualifier line — because a count on its own says how many and never says whether it
   * matters. Three services is fine; three services with one suspended is not, and a tile that
   * hides the difference is a tile nobody trusts. The shared anatomy is also what makes the
   * four the same height honestly, rather than by padding three of them out to match a fourth.
   */
  const expiring = DOMAINS.filter((d) => d.status !== 'active').length;
  const answered = openTickets.filter((x) => x.status === 'answered').length;

  /*
   * A qualifier names the exception, never the healthy remainder. "2 Active" under a count of
   * three is technically true and says nothing — the reader has to do the subtraction to find
   * out that one service is pending. So when anything is off, the note reports what is off and
   * how many, worst status first, and only an account where everything runs gets the green
   * count back.
   */
  const stalled = SERVICES.filter((s) => s.status !== 'active');
  // Worst first, and the order is what it costs the reader to ignore it: a site that is off,
  // then a charge that failed, then a term that lapsed, then a queue, then bookkeeping.
  const worst = (['suspended', 'failed', 'expired', 'pending', 'cancelled'] as const).find((k) =>
    stalled.some((s) => s.status === k),
  );

  const stats: StatItem[] = [
    {
      to: '/account/services',
      icon: <IconServer size={16} />,
      n: SERVICES.length,
      label: t('acc.services'),
      note: worst
        ? `${stalled.filter((s) => s.status === worst).length} ${t(`status.${worst}` as never)}`
        : `${active} ${t('status.active')}`,
      tone: worst ? 'warn' : 'ok',
    },
    {
      to: '/account/domains',
      icon: <IconGlobe size={16} />,
      n: DOMAINS.length,
      label: t('acc.domains'),
      note: expiring > 0 ? `${expiring} ${t('dom.expiring')}` : `${DOMAINS.length} ${t('dom.active')}`,
      tone: expiring > 0 ? 'warn' : 'ok',
    },
    {
      to: '/account/invoices',
      icon: <IconInvoice size={16} />,
      n: unpaid.length,
      label: t('dash.unpaid'),
      // What is owed, not how many envelopes it arrived in — the amount is what decides
      // whether this is worth opening now.
      note: unpaid.length > 0 ? money(dueTotal) : t('dash.settled'),
      tone: unpaid.length > 0 ? 'bad' : 'ok',
      alert: unpaid.length > 0,
    },
    {
      to: '/account/tickets',
      icon: <IconSupport size={16} />,
      n: openTickets.length,
      label: t('dash.openTickets'),
      note:
        openTickets.length === 0
          ? t('dash.noneOpen')
          : answered > 0
            ? `${answered} ${t('tkt.answered')}`
            : t('dash.awaiting'),
      tone: openTickets.length === 0 || answered > 0 ? 'ok' : 'warn',
    },
  ];

  const when = (days: number) =>
    days === 0 ? t('dash.today') : days === 1 ? t('dash.tomorrow') : `${t('dash.inDays')} ${days} ${t('dash.daysShort')}`;

  return (
    <AccountLayout
      title={`${t('dash.hello')} ${bi(ACCOUNT.name).split(' ')[0]}`}
      lede={t('dash.lede')}
      actions={
        <Link className="btn btn--md btn--secondary" to="/hosting">
          <IconPlus size={15} />
          {t('action.orderService')}
        </Link>
      }
    >
      {/* Row 1 — the counts. One component, shared with Affiliates, so the two screens that
          open with four figures open with the same four-figure object. */}
      <StatRow items={stats} />

      {/* Row 2 — the house ads, under the counts and above everything that is owed. It is the
          one thing on the screen that is selling rather than reporting, so it sits below the
          figures a person came for and can be closed outright. */}
      <PromoRail />

      {/*
       * Row 3 onward — the body, as ONE grid rather than two independent columns.
       *
       * It used to be two: a `.dash__main` stack and a `.dash__side` stack, each flowing at its
       * own pace. They agreed on the first card's top edge and never again — by the second row
       * the two columns were 50px out, by the fourth 160px, and every horizontal rule on the
       * screen sat at a different height from the one beside it. Nothing was broken; it just
       * looked like nobody had lined it up, because nobody had.
       *
       * The cards are the grid's own children now, so both columns share row tracks and every
       * pair starts and ends on the same two lines. Two things follow, and both are constraints
       * rather than details:
       *
       *   The columns have to carry the same number of cards, which is why the tickets card
       *   moved out of the side column. Four and four.
       *
       *   A row is as tall as its taller card, so the pairing is also a height decision: the
       *   two long lists are put opposite each other and the two short ones opposite each
       *   other. Paired the other way round, the same eight cards leave 180px of nothing inside
       *   the ticket card — a card is either full or it looks like it failed to load.
       */}
      <div className="dash dash--paired">
        {/* Pair 1 — the only thing on this screen that is genuinely owed, beside who owes it. */}
        {unpaid.length > 0 ? (
          <Card tone="urgent" heading={t('dash.needsYou')} icon={<IconAlert size={17} />}>
            <div className="due">
              <div className="due__text">
                <p className="due__amount serial">{money(dueTotal)}</p>
                <p className="due__note">
                  <IconAlert size={14} />
                  <span>
                    {t('dash.dueNote')} ·{' '}
                    {unpaid.map((i) => {
                      const d = daysUntil(i.due);
                      return (
                        <span key={i.id}>
                          {d < 0 ? `${t('dash.overdueBy')} ${-d} ${t('dash.daysShort')}` : `${t('dash.dueOn')} ${i.due}`}
                        </span>
                      );
                    })}
                  </span>
                </p>
              </div>
              <div className="due__actions">
                <Link className="btn btn--md btn--primary" to={`/account/invoices/${unpaid[0].id}`}>
                  {t('account.pay')}
                  <IconArrow size={15} />
                </Link>
                <Link className="btn btn--md btn--quiet" to="/account/invoices">
                  {t('dash.viewAll')}
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card tone="calm">
            <p className="calm">
              <IconCheck size={20} />
              <span>
                <strong>{t('dash.allClear')}</strong>
                <span className="calm__note">{t('dash.allClearNote')}</span>
              </span>
            </p>
          </Card>
        )}

        <IdentityCard />

        {/* Pair 2 — what is running, and what is sitting in the account to pay for it. The
            services read as rows rather than a table: three columns of data do not need a
            table's machinery, and rows survive a narrow column. */}
        <Card
          heading={t('acc.services')}
          icon={<IconServer size={17} />}
          action={
            <Link className="card__more" to="/account/services">
              {t('dash.viewAll')}
              <IconArrow size={14} />
            </Link>
          }
        >
          <ul className="rows">
            {servicePreview.map((s) => (
              <li key={s.id}>
                <Link className="row" to={`/account/services/${s.id}`}>
                  <span className={`row__dot row__dot--${s.status === 'active' ? 'ok' : 'wait'}`} aria-hidden="true" />
                  <span className="row__text">
                    <span className="row__title">{s.product}</span>
                    <span className="row__sub serial">
                      <bdi>{s.domain}</bdi>
                    </span>
                  </span>
                  <span className="row__meta">
                    <Tag tone={SERVICE_TONE[s.status]}>{t(`status.${s.status}` as never)}</Tag>
                    <span className="row__date serial">
                      <bdi>{s.nextDue}</bdi>
                    </span>
                  </span>
                  <IconArrow size={15} className="row__go" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card heading={t('dash.credit')} icon={<IconWallet size={17} />}>
          <p className="credit serial">{money(ACCOUNT.creditUsdMinor)}</p>
          <p className="credit__note">{t('dash.creditNote')}</p>
          <Link className="btn btn--sm btn--secondary" to="/account/funds">
            <IconPlus size={14} />
            {t('acc.funds')}
          </Link>
        </Card>

        {/*
         * Pair 3 — the site itself: how much room is left on it, and the tools you open on it.
         *
         * Both belonged only to the service page, which is one click past the card above that
         * names the service. "Have I run out of space" and "where is the file manager" are the
         * two questions this screen was sending people away to answer, and both are answerable
         * here in the room a pair of cards already had.
         *
         * They report ONE service — the primary hosting account, named on both cards — rather
         * than a total across the account. A disk bar summed over three products is a number
         * with no action attached to it: you cannot clear space on "72% of everything". The
         * shortcuts have to belong to one domain anyway, because each carries that domain in
         * its link.
         *
         * Absent when there is no live cPanel service to report on. A meter at zero over a
         * product the account does not have reads as a broken card, not as an empty one.
         */}
        {primary && (
          <>
            <Card
              heading={t('svc.usage')}
              icon={<IconGauge size={17} />}
              action={
                <Link className="card__more" to={`/account/services/${primary.id}`}>
                  {t('svc.manage')}
                  <IconArrow size={14} />
                </Link>
              }
            >
              <p className="card__lede">
                <bdi>{primary.domain}</bdi>
              </p>
              <ServiceMeters svc={primary} />
              <p className="form__note">
                {t('svc.usageAt')}{' '}
                <span className="serial">
                  <bdi>{primary.usageAt}</bdi>
                </span>
              </p>
            </Card>

            <Card heading={t('svc.shortcuts')} icon={<IconSpark size={17} />}>
              <p className="card__lede">
                <bdi>{primary.domain}</bdi>
              </p>
              <ServiceShortcuts domain={primary.domain} />
            </Card>
          </>
        )}

        {/* Pair 4 — the two long reads: what has been announced, and what falls due. */}
        <Card
          heading={t('acc.news')}
          icon={<IconMegaphone size={17} />}
          action={
            <Link className="card__more" to="/account/announcements">
              {t('dash.viewAll')}
              <IconArrow size={14} />
            </Link>
          }
        >
          <ul className="feed">
            {ANNOUNCEMENTS.map((n) => (
              <li className="feed__item" key={n.id}>
                <p className="feed__date serial">
                  <bdi>{n.date}</bdi>
                </p>
                <h3 className="feed__title">{t(n.titleKey as never)}</h3>
                <p className="feed__body">{t(n.bodyKey as never)}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card heading={t('dash.renewals')} icon={<IconCalendar size={17} />}>
          {renewals.length > 0 ? (
            <ul className="sched">
              {renewals.map((r) => (
                <li key={r.id}>
                  <Link className="sched__item" to={r.to}>
                    <span className="sched__when">{when(r.days)}</span>
                    <span className="sched__what">
                      <span className="sched__label">{r.label}</span>
                      <span className="sched__sub">{r.sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card__body">{t('dash.noRenewals')}</p>
          )}
        </Card>

        {/* Pair 5 — the screen ends on support: what is already open with us, beside the
            door that opens the next one. */}
        <Card
          heading={t('acc.tickets')}
          icon={<IconSupport size={17} />}
          action={
            <Link className="card__more" to="/account/tickets">
              {t('dash.viewAll')}
              <IconArrow size={14} />
            </Link>
          }
        >
          {openTickets.length > 0 ? (
            <ul className="sched">
              {openTickets.map((x) => (
                <li key={x.id}>
                  <Link className="sched__item" to={`/account/tickets/${x.id}`}>
                    <Tag tone={TICKET_TONE[x.status]}>{t(`tkt.${x.status}` as never)}</Tag>
                    <span className="sched__what">
                      <span className="sched__label">{bi(x.subject)}</span>
                      <span className="sched__sub serial">
                        <bdi>{x.ref}</bdi>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card__body">{t('dash.noTickets')}</p>
          )}
        </Card>

        <Card heading={t('dash.quick')} icon={<IconSpark size={17} />}>
          <ul className="quick">
            <li>
              <Link className="quick__item" to="/domains">
                <IconGlobe size={16} />
                {t('rail.register')}
              </Link>
            </li>
            <li>
              <Link className="quick__item" to="/account/tickets/new">
                <IconSupport size={16} />
                {t('tkt.open')}
              </Link>
            </li>
            <li>
              <Link className="quick__item" to="/account/knowledgebase">
                <IconBook size={16} />
                {t('acc.kb')}
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </AccountLayout>
  );
}
