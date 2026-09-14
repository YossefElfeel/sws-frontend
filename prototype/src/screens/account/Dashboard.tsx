import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Card } from '../../components/Card';
import { PromoRail } from '../../components/PromoRail';
import { StatRow, type StatItem } from '../../components/Stat';
import { Tag, SERVICE_TONE, TICKET_TONE } from '../../components/Tag';
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
  IconUsers,
  IconSignOut,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount } from '../../lib/catalog';
import {
  SERVICES,
  DOMAINS,
  INVOICES,
  TICKETS,
  ANNOUNCEMENTS,
  ACCOUNT,
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

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  const unpaid = INVOICES.filter((i) => i.status === 'unpaid' || i.status === 'overdue');
  const openTickets = TICKETS.filter((x) => x.status !== 'closed');
  const dueTotal = unpaid.reduce((s, i) => s + i.totalUsdMinor, 0);
  const active = SERVICES.filter((s) => s.status === 'active').length;

  // Nearest first, and only what is close enough to act on.
  const renewals = [
    ...SERVICES.map((s) => ({ id: s.id, label: s.product, sub: s.domain, on: s.nextDue, to: `/account/services/${s.id}` })),
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
  const worst = (['suspended', 'pending', 'cancelled'] as const).find((k) =>
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
            {SERVICES.map((s) => (
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

        {/* Pair 3 — the two long reads: what has been announced, and what falls due. */}
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

        {/* Pair 4 — the screen ends on support: what is already open with us, beside the
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
