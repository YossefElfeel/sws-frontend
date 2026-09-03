import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Card } from '../../components/Card';
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
 * ordered by obligation rather than by section — what is owed, then what renews next, then
 * what is running, then what is merely news. A count is a link in every case, because the
 * reason to show "1 unpaid invoice" is to let someone go and pay it.
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
          {t('action.order')}
        </Link>
      }
    >
      {/* Row 1 — the counts. One component, shared with Affiliates, so the two screens that
          open with four figures open with the same four-figure object. */}
      <StatRow items={stats} />

      <div className="dash">
        <div className="dash__main">
          {/* Row 2 — the only thing on this screen that is genuinely owed. */}
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

          {/* Row 3 — what is running, as rows rather than a table: three columns of data do
              not need a table's machinery, and rows survive a narrow column. */}
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
        </div>

        <div className="dash__side">
          <Card heading={t('dash.credit')} icon={<IconWallet size={17} />}>
            <p className="credit serial">{money(ACCOUNT.creditUsdMinor)}</p>
            <p className="credit__note">{t('dash.creditNote')}</p>
            <Link className="btn btn--sm btn--secondary" to="/account/funds">
              <IconPlus size={14} />
              {t('acc.funds')}
            </Link>
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
      </div>
    </AccountLayout>
  );
}
