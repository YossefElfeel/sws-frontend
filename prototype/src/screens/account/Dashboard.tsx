import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
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

  const stats = [
    { to: '/account/services', icon: <IconServer size={16} />, n: SERVICES.length, key: 'acc.services', note: `${active} ${t('status.active')}` },
    { to: '/account/domains', icon: <IconGlobe size={16} />, n: DOMAINS.length, key: 'acc.domains' },
    { to: '/account/invoices', icon: <IconInvoice size={16} />, n: unpaid.length, key: 'dash.unpaid', alert: unpaid.length > 0 },
    { to: '/account/tickets', icon: <IconSupport size={16} />, n: openTickets.length, key: 'dash.openTickets' },
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
      {/* Row 1 — the counts, compact enough to read in one pass. */}
      <ul className="stat-row">
        {stats.map((s) => (
          <li key={s.to}>
            <Link className={`stat${s.alert ? ' stat--alert' : ''}`} to={s.to}>
              <span className="stat__icon" aria-hidden="true">
                {s.icon}
              </span>
              <span className="stat__n serial">{s.n}</span>
              <span className="stat__label">{t(s.key as never)}</span>
              {s.note && <span className="stat__note">{s.note}</span>}
            </Link>
          </li>
        ))}
      </ul>

      <div className="dash">
        <div className="dash__main">
          {/* Row 2 — the only thing on this screen that is genuinely owed. */}
          {unpaid.length > 0 ? (
            <section className="card card--urgent">
              <header className="card__head">
                <h2 className="card__heading">
                  <IconAlert size={17} />
                  {t('dash.needsYou')}
                </h2>
              </header>
              <div className="due">
                <p className="due__amount serial">{money(dueTotal)}</p>
                <p className="due__note">
                  {t('dash.dueNote')} ·{' '}
                  {unpaid.map((i) => {
                    const d = daysUntil(i.due);
                    return (
                      <span key={i.id}>
                        {d < 0 ? `${t('dash.overdueBy')} ${-d} ${t('dash.daysShort')}` : `${t('dash.dueOn')} ${i.due}`}
                      </span>
                    );
                  })}
                </p>
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
            </section>
          ) : (
            <section className="card card--calm">
              <p className="calm">
                <IconCheck size={20} />
                <span>
                  <strong>{t('dash.allClear')}</strong>
                  <span className="calm__note">{t('dash.allClearNote')}</span>
                </span>
              </p>
            </section>
          )}

          {/* Row 3 — what is running, as rows rather than a table: three columns of data do
              not need a table's machinery, and rows survive a narrow column. */}
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('acc.services')}</h2>
              <Link className="card__more" to="/account/services">
                {t('dash.viewAll')}
                <IconArrow size={14} />
              </Link>
            </header>
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
                      <span className={`tag tag--${s.status === 'active' ? 'ok' : 'taken'}`}>
                        {t(`status.${s.status}` as never)}
                      </span>
                      <span className="row__date serial">
                        <bdi>{s.nextDue}</bdi>
                      </span>
                    </span>
                    <IconArrow size={15} className="row__go" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('acc.news')}</h2>
              <Link className="card__more" to="/account/announcements">
                {t('dash.viewAll')}
                <IconArrow size={14} />
              </Link>
            </header>
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
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">
                <IconWallet size={17} />
                {t('dash.credit')}
              </h2>
            </header>
            <p className="credit serial">{money(ACCOUNT.creditUsdMinor)}</p>
            <p className="credit__note">{t('dash.creditNote')}</p>
            <Link className="btn btn--sm btn--secondary" to="/account/funds">
              <IconPlus size={14} />
              {t('acc.funds')}
            </Link>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">
                <IconCalendar size={17} />
                {t('dash.renewals')}
              </h2>
            </header>
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
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">
                <IconSupport size={17} />
                {t('acc.tickets')}
              </h2>
              <Link className="card__more" to="/account/tickets">
                {t('dash.viewAll')}
                <IconArrow size={14} />
              </Link>
            </header>
            {openTickets.length > 0 ? (
              <ul className="sched">
                {openTickets.map((x) => (
                  <li key={x.id}>
                    <Link className="sched__item" to={`/account/tickets/${x.id}`}>
                      <span className={`tag tag--${x.status === 'answered' ? 'ok' : 'taken'}`}>
                        {t(`tkt.${x.status}` as never)}
                      </span>
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
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dash.quick')}</h2>
            </header>
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
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}
