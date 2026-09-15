import { useState, type ReactNode } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { DevNote } from '../../components/DevNote';
import { Tag, SERVICE_TONE, DOMAIN_TONE, INVOICE_TONE } from '../../components/Tag';
import { StatRow, type StatItem } from '../../components/Stat';
import { TableToolbar, TableFilter, TableSort, matches } from '../../components/TableToolbar';
import { TablePager, PAGE_SIZE } from '../../components/TablePager';
import { RowMenu, type RowMenuItem } from '../../components/RowMenu';
import { UsageChart } from '../../components/UsageChart';
import { VPS_METRICS, SAMPLED_AT } from '../../lib/telemetry';
import {
  IconArrow,
  IconExternal,
  IconServer,
  IconSupport,
  IconMail,
  IconGlobe,
  IconGauge,
  IconFolder,
  IconDatabase,
  IconArchive,
  IconClock,
  IconCheck,
  IconKey,
  IconAlert,
  IconPlus,
  IconEye,
  IconPencil,
  IconTrash,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { useCart } from '../../lib/cart';
import { useSaved, SavedNote } from '../../lib/saved';
import { useAccountState } from '../../lib/accountState';
import { convert, formatAmount, ADDONS, GATEWAYS } from '../../lib/catalog';
import {
  PAYMENT_METHODS_SAVED,
  CPANEL_APPS,
  NEEDS_ATTENTION,
  renews,
  type Service,
  type ServiceStatus,
} from '../../lib/account';
import { Select } from '../../components/Select';

/**
 * What the list can be narrowed to. `attention` is not a status WHMCS stores — it is the three
 * that are asking something of the reader, offered as one choice, because "show me what is
 * broken" is the question this screen gets asked and answering it three times is not an answer.
 */
type StatusFilter = ServiceStatus | 'all' | 'attention';

const STATUSES: StatusFilter[] = [
  'all',
  'attention',
  'active',
  'pending',
  'suspended',
  'failed',
  'expired',
  'cancelled',
];

/** Sorting keys — spec C-02 lists sort among this screen's states, and none was ever built. */
const SORTS = ['renewal', 'name', 'amount'] as const;
type SortKey = (typeof SORTS)[number];

/**
 * The rate a price is charged at, so the amount column can say "10.00 USD per month" and the
 * Term column beside it can go. Two columns were carrying one sentence between them, and the
 * half that read as a category — "Monthly" — was the half that told you least.
 */
const PER: Record<string, string> = {
  monthly: 'per.monthly',
  quarterly: 'per.quarterly',
  semiannually: 'per.semiannually',
  annually: 'per.annually',
  biennially: 'per.biennially',
  triennially: 'per.triennially',
};

/** The two states the row switch can move between. Everything else it can only report. */
const SWITCHABLE: ServiceStatus[] = ['active', 'suspended'];

/** My Services — spec 9.2 and C-02: plan, linked domain, price, status, next renewal. */
export function Services() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { services, updateService } = useAccountState();
  const { saved, mark, clear } = useSaved();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('renewal');
  const [desc, setDesc] = useState(false);
  const [page, setPage] = useState(1);

  // Narrowing the list always returns to the first page. Staying on page three of a list that
  // is now one page long is the classic way a table appears to have lost everything.
  const narrow =
    <T,>(set: (next: T) => void) =>
    (next: T) => {
      set(next);
      setPage(1);
    };

  const counts = {
    all: services.length,
    active: services.filter((s) => s.status === 'active').length,
    pending: services.filter((s) => s.status === 'pending').length,
    attention: services.filter((s) => NEEDS_ATTENTION.includes(s.status)).length,
  };

  // The plan name and the domain are the two things anyone knows a service by, and the domain
  // is the one they will type — it is what the service is called in every other conversation.
  const matched = services.filter(
    (s) => inFilter(s.status, status) && matches(q, s.product, s.domain, s.nextDue),
  );

  const sorted = [...matched].sort((a, b) => compare(a, b, sort, desc, locale));

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // A switch flipped on the last row of a filtered page can empty that page under the reader.
  const here = Math.min(page, pages);
  const rows = sorted.slice((here - 1) * PAGE_SIZE, here * PAGE_SIZE);

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  /*
   * Four counts, and each one is the filter it counts. A tile that reports "3 need attention"
   * and then makes you go and find them in a select is a tile that did half its job; pressing
   * it shows those three, and `aria-pressed` says which of the four the table is currently
   * showing, so the row doubles as where-am-I.
   *
   * No qualifier lines here, unlike the dashboard's four. There, a count needs a note because
   * "3 services" does not say whether any of them is in trouble. Here the label already names
   * the state being counted, so a note could only repeat it.
   */
  const tiles: StatItem[] = [
    {
      n: counts.all,
      label: t('svc.all'),
      icon: <IconServer size={16} />,
      onSelect: () => narrow(setStatus)('all'),
      pressed: status === 'all',
    },
    {
      n: counts.active,
      label: t('status.active'),
      icon: <IconCheck size={16} />,
      onSelect: () => narrow(setStatus)('active'),
      pressed: status === 'active',
    },
    {
      n: counts.pending,
      label: t('status.pending'),
      icon: <IconClock size={16} />,
      onSelect: () => narrow(setStatus)('pending'),
      pressed: status === 'pending',
    },
    {
      n: counts.attention,
      label: t('svc.attention'),
      icon: <IconAlert size={16} />,
      onSelect: () => narrow(setStatus)('attention'),
      pressed: status === 'attention',
      alert: counts.attention > 0,
    },
  ];

  return (
    <AccountLayout
      title={t('acc.services')}
      actions={
        <Link className="btn btn--md btn--primary" to="/hosting">
          <IconPlus size={15} />
          {t('svc.add')}
        </Link>
      }
    >
      <SavedNote saved={saved} onDismiss={clear} />

      <StatRow items={tiles} />

      <TableToolbar value={q} onChange={narrow(setQ)} label={t('search.services')}>
        <TableFilter
          label={t('account.status')}
          value={status}
          onChange={narrow(setStatus)}
          options={STATUSES.map((s) => ({
            value: s,
            label: t(
              s === 'all'
                ? 'filter.allStatuses'
                : s === 'attention'
                  ? 'filter.attention'
                  : (`status.${s}` as never),
            ),
          }))}
        />
        <TableSort
          value={sort}
          onChange={narrow(setSort)}
          desc={desc}
          onDesc={narrow(setDesc)}
          options={SORTS.map((s) => ({ value: s, label: t(`sort.${s}` as never) }))}
        />
      </TableToolbar>

      {rows.length > 0 ? (
        <>
          <div className="card card--flush table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">{t('col.item')}</th>
                  <th scope="col">{t('account.nextdue')}</th>
                  <th scope="col" className="num">{t('col.amount')}</th>
                  <th scope="col">{t('account.status')}</th>
                  <th scope="col">{t('col.running')}</th>
                  <th scope="col" className="data__own">
                    <span className="u-visually-hidden">{t('svc.rowMenu')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const on = s.status === 'active';
                  const canSwitch = SWITCHABLE.includes(s.status);
                  const runLabel = t(canSwitch ? (on ? 'svc.runOn' : 'svc.runOff') : 'svc.runLocked');

                  return (
                    <tr key={s.id}>
                      <td className="data__own">
                        {/* The link stretches over its whole cell — see `.data__link::after`.
                            A plan name is four characters wide in places ("Pro", "Mail 5"),
                            and a 23px target is under the bar in every guideline there is. */}
                        <Link className="lead data__link" to={`/account/services/${s.id}`}>
                          {s.product}
                        </Link>
                        <span className="data__sub serial">
                          <bdi>{s.domain}</bdi>
                        </span>
                      </td>
                      {/* A service that has ended has no next renewal, and the date it carries
                          is the day it stopped — printing it here would dress the end of
                          something up as a future. */}
                      <td className="serial data__own">
                        {renews(s.status) ? (
                          <bdi>{s.nextDue}</bdi>
                        ) : (
                          /* A dash reads as "not applicable" to anyone who can see it and as
                             a cell that failed to load to anyone who cannot. */
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="u-visually-hidden">{t('svc.noRenewal')}</span>
                          </>
                        )}
                      </td>
                      <td className="num">
                        <span className="serial">{money(s.amountUsdMinor)}</span>
                        <span className="data__sub">{t((PER[s.cycle] ?? `cycle.${s.cycle}`) as never)}</span>
                      </td>
                      <td>
                        <Tag tone={SERVICE_TONE[s.status]}>{t(`status.${s.status}` as never)}</Tag>
                      </td>
                      <td>
                        {/* The row is named inside the switch's own label, so a column of ten
                            of them does not read as "Running, Running, Running". */}
                        <label className="switch-cell">
                          <span className="u-visually-hidden">
                            {runLabel} — {s.product}, {s.domain}
                          </span>
                          <input
                            type="checkbox"
                            className="switch"
                            checked={on}
                            disabled={!canSwitch}
                            title={runLabel}
                            onChange={(e) => {
                              const next = e.target.checked;
                              updateService(s.id, { status: next ? 'active' : 'suspended' });
                              mark(t(next ? 'svc.startedMsg' : 'svc.stoppedMsg'));
                            }}
                          />
                        </label>
                      </td>
                      <td className="num">
                        <RowMenu label={`${t('svc.rowMenu')} — ${s.product}`} items={rowItems(s, t)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Three empty lists, not one. Owning no services, filtering them all away and
           mistyping a search are different problems, and only the first one wants to be sold
           something. */
        <div className="card empty">
          <IconServer size={28} />
          <p className="empty__title">
            {t(
              services.length === 0
                ? 'empty.servicesNone'
                : q.trim()
                  ? 'empty.search'
                  : 'empty.services',
            )}
          </p>
          <p className="empty__note">
            {t(
              services.length === 0
                ? 'empty.servicesNoneNote'
                : q.trim()
                  ? 'empty.searchNote'
                  : 'empty.filter',
            )}
          </p>
          {services.length === 0 && (
            <Link className="btn btn--md btn--primary u-mt-16" to="/hosting">
              <IconPlus size={15} />
              {t('svc.add')}
            </Link>
          )}
        </div>
      )}

      {/* Outside the branch above, so it is still mounted when the list comes back empty —
          `role="status"` announces while it is on the page, and a count that unmounted itself
          on an empty result would go quiet at the one moment it has something to say. */}
      <TablePager page={here} onPage={setPage} matched={sorted.length} total={services.length} />

      {rows.length > 0 && <DevNote>{t('dev.suspend')}</DevNote>}
    </AccountLayout>
  );
}

/** Does this status belong in the current view? `attention` spans three of them. */
function inFilter(status: ServiceStatus, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'attention') return NEEDS_ATTENTION.includes(status);
  return status === filter;
}

/**
 * Sorting, with two decisions worth stating.
 *
 * A service that has ended sorts last under Renewal date whichever way the direction points.
 * It has no next renewal, and the date it carries is the day it stopped — pulling those to the
 * top of "soonest first" would answer a question nobody asked.
 *
 * Price sorts on the amount as it is written in the column, not on a monthly equivalent. The
 * equivalent is the comparison that means more — 55.00 a year is cheaper per month than 10.00 a
 * month — but it would leave the visible column out of order, and a column that is not in the
 * order you just asked for reads as broken, whatever the arithmetic behind it. The cycle is
 * printed under every amount, so what is being compared is on screen.
 */
function compare(a: Service, b: Service, key: SortKey, desc: boolean, locale: string): number {
  const sign = desc ? -1 : 1;

  if (key === 'name') {
    return sign * (a.product.localeCompare(b.product, locale) || a.domain.localeCompare(b.domain));
  }

  if (key === 'amount') {
    return (
      sign * (a.amountUsdMinor - b.amountUsdMinor) || a.product.localeCompare(b.product, locale)
    );
  }

  if (renews(a.status) !== renews(b.status)) return renews(a.status) ? -1 : 1;
  // ISO dates, so string order is date order.
  return sign * a.nextDue.localeCompare(b.nextDue) || a.product.localeCompare(b.product, locale);
}

/**
 * View, edit, cancel — the row's own three.
 *
 * A service that has expired or been cancelled keeps only the first. There is no plan to change
 * on a term that has ended and nothing left to cancel, and a menu offering both would be
 * offering two dead ends to a reader who came looking for the record.
 */
function rowItems(s: Service, t: (key: never) => string): RowMenuItem[] {
  const items: RowMenuItem[] = [
    {
      id: 'view',
      label: t('svc.view' as never),
      icon: <IconEye size={16} />,
      to: `/account/services/${s.id}`,
    },
  ];

  if (renews(s.status)) {
    items.push(
      {
        id: 'edit',
        label: t('svc.edit' as never),
        icon: <IconPencil size={16} />,
        to: `/account/services/${s.id}/upgrade`,
      },
      {
        id: 'cancel',
        label: t('svc.cancel' as never),
        icon: <IconTrash size={16} />,
        to: `/account/services/${s.id}/cancel`,
        danger: true,
      },
    );
  }

  return items;
}

/** One icon per cPanel destination; the label carries the meaning, the icon the shape. */
const APP_ICON: Record<string, ReactNode> = {
  email: <IconMail size={17} />,
  forwarders: <IconArrow size={17} />,
  autoresponders: <IconMail size={17} />,
  files: <IconFolder size={17} />,
  backups: <IconArchive size={17} />,
  domains: <IconGlobe size={17} />,
  cron: <IconClock size={17} />,
  mysql: <IconDatabase size={17} />,
  phpmyadmin: <IconDatabase size={17} />,
  awstats: <IconGauge size={17} />,
};

type RelatedTab = 'invoices' | 'domain';

/**
 * Service details — spec 9.2, C-03: server information, a direct cPanel login, billing
 * details, upgrade/downgrade, cancellation, and related support — and, since the reference
 * screenshots, the things a person opens this screen to do without leaving it: the ten
 * cPanel shortcuts, a mailbox created in two fields, an add-on bought from a list, and the
 * invoices and domain that belong to this one service under a chip strip.
 *
 * Billing details are stated once, in the side column, beside the renewal amount and the
 * auto-renew switch that act on them. The same six rows were also printed at the foot of the
 * page, which left a reader checking two places against each other to be sure they agreed.
 *
 * cPanel is the reason most people open this screen, so it is the header action rather than a
 * button at the bottom of a card. Usage reads as what is left rather than what is gone: the
 * number someone needs before buying more storage is the remainder.
 *
 * Auto-renew on a service is the product owner's ask, and WHMCS has no field for it; the
 * switch is real here and marked as needing a developer's hook, which is the honest state.
 */
export function ServiceDetail() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { id } = useParams<{ id: string }>();
  /* `allInvoices` rather than `invoices`: the name is taken below by the ones that belong to
     this service, and the tab has to follow a cancellation made on the invoices screen. */
  const { service, updateService, domains, invoices: allInvoices } = useAccountState();
  const { add } = useCart();
  const navigate = useNavigate();
  const svc = service(id ?? '');
  const { saved, mark, clear } = useSaved();
  /*
   * An expired or cancelled service is a record, not a machine. Everything on this screen that
   * acts on a running service — the cPanel login, the shortcuts, the new mailbox, the add-on
   * purchase, auto-renew, the plan change, the password, the cancellation — acts on something
   * that is not there, and offering it is how a client area teaches people not to trust it.
   * So the page keeps what is still true of the record and drops what is not, and says why at
   * the top rather than leaving the reader to notice the absences.
   */
  const live = svc ? renews(svc.status) : true;

  const [tab, setTab] = useState<RelatedTab>('invoices');
  const [mailName, setMailName] = useState('');
  const [mailPw, setMailPw] = useState('');
  const [mailBad, setMailBad] = useState(false);
  const [pick, setPick] = useState('');

  if (!svc) return <Navigate to="/account/services" replace />;

  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;

  const bars = [
    { key: 'svc.disk', used: svc.diskUsedGb, total: svc.diskTotalGb, unit: 'GB' },
    { key: 'svc.bandwidth', used: svc.bandwidthUsedGb, total: svc.bandwidthTotalGb, unit: 'GB' },
  ];

  const apps = CPANEL_APPS.filter((a) => a.id !== 'webmail' && a.id !== 'builder').slice(
    0,
    svc.kind === 'email' ? 3 : 10,
  );

  const groups = svc.kind === 'vps' ? ADDONS.filter((g) => g.id !== 'builder') : ADDONS;
  const activeAddons = svc.addons.map((key) => {
    const [gid, oid] = key.split(':');
    const g = ADDONS.find((x) => x.id === gid);
    const o = g?.options.find((x) => x.id === oid);
    return g && o ? `${t(g.titleKey as never)} — ${o.label}` : key;
  });
  const purchasable = groups.flatMap((g) =>
    g.options
      .filter((o) => o.id !== 'none' && !svc.addons.includes(`${g.id}:${o.id}`))
      .map((o) => ({ key: `${g.id}:${o.id}`, group: g, opt: o })),
  );

  const card = PAYMENT_METHODS_SAVED.find((m) => m.id === svc.paymentMethod);
  const gateway = GATEWAYS.find((g) => g.id === svc.paymentMethod);
  const paymentLabel = card
    ? `${card.kind} •••• ${card.last4}`
    : gateway
      ? t(gateway.labelKey as never)
      : svc.paymentMethod;

  const invoices = allInvoices.filter((i) =>
    i.lines.some((l) => l.product === svc.product && l.domain === svc.domain),
  );
  const dom = domains.find((d) => d.name === svc.domain);

  const createMailbox = () => {
    const ok = /^[a-z0-9._-]{1,64}$/i.test(mailName) && mailPw.length >= 10;
    setMailBad(!ok);
    if (!ok) return;
    mark(t('svc.mailCreated'));
    setMailName('');
    setMailPw('');
  };

  const buyAddon = () => {
    const item = purchasable.find((p) => p.key === pick);
    if (!item) return;
    add({
      plan: {
        id: `addon-${item.key}`,
        name: `${t(item.group.titleKey as never)} — ${item.opt.label}`,
        monthlyUsdMinor:
          item.opt.per === 'year' ? Math.round(item.opt.priceUsdMinor / 12) : item.opt.priceUsdMinor,
        fixedUsdMinor: item.opt.priceUsdMinor,
      },
      cycle: item.opt.per === 'year' ? 'annually' : 'monthly',
      addons: {},
      domain: { name: svc.domain, action: 'own', years: 1 },
    });
    navigate('/cart');
  };

  return (
    <AccountLayout
      title={svc.product}
      lede={svc.domain}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.services'), to: '/account/services' },
        { label: svc.product },
      ]}
      meta={
        <>
          <Tag tone={SERVICE_TONE[svc.status]}>{t(`status.${svc.status}` as never)}</Tag>
          <span className="app__meta-note">{t(`svc.kind.${svc.kind}` as never)}</span>
        </>
      }
      actions={
        live ? (
          <Link className="btn btn--md btn--primary" to={`/cpanel?domain=${svc.domain}`}>
            <IconExternal size={15} />
            {t('svc.cpanel')}
          </Link>
        ) : undefined
      }
    >
      <SavedNote saved={saved} onDismiss={clear} />

      {!live && (
        <div className="u-mb-16">
          <Banner severity="info" title={t(`svc.over.${svc.status}` as never)}>
            {t('svc.overNote')}{' '}
            <span className="serial">
              <bdi>{svc.nextDue}</bdi>
            </span>
          </Banner>
        </div>
      )}

      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.usage')}</h2>
            </header>
            <div className="meters">
              {bars.map((b) => {
                const pct = Math.min(100, (b.used / b.total) * 100);
                const left = Math.round((b.total - b.used) * 10) / 10;
                return (
                  <div className="meter" key={b.key}>
                    <p className="meter__head">
                      <span>{t(b.key as never)}</span>
                      <span>
                        <span className="meter__left serial">
                          {left} {b.unit}
                        </span>{' '}
                        {t('svc.left')}
                      </span>
                    </p>
                    <span
                      className="meter__track"
                      role="img"
                      aria-label={`${t(b.key as never)}: ${b.used} ${t('dash.of')} ${b.total} ${b.unit}`}
                    >
                      <span
                        className={`meter__fill${pct >= 90 ? ' meter__fill--full' : pct >= 75 ? ' meter__fill--high' : ''}`}
                        style={{ inlineSize: `${pct}%` }}
                      />
                    </span>
                    <p className="meter__head">
                      <span className="serial">
                        {b.used} {t('dash.of')} {b.total} {b.unit}
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="form__note">
              {t('svc.usageAt')}{' '}
              <span className="serial">
                <bdi>{svc.usageAt}</bdi>
              </span>
            </p>
          </section>

          {/*
            The graphs, and only on a machine that is running. A cPanel account has no processor
            of its own to report on, and a stopped VPS has nothing to draw but four flat lines —
            which reads as a broken chart rather than as an idle server.
          */}
          {live && svc.kind === 'vps' && (
            <section className="card">
              <header className="card__head">
                <h2 className="card__heading">{t('vpsm.title')}</h2>
              </header>
              <div className="charts">
                {VPS_METRICS.map((m) => (
                  <UsageChart key={m.id} metric={m} />
                ))}
              </div>
              <p className="form__note">
                {t('vpsm.note')} {t('svc.usageAt')}{' '}
                <span className="serial">
                  <bdi>{SAMPLED_AT}</bdi>
                </span>
              </p>
            </section>
          )}

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.server')}</h2>
            </header>
            <dl className="kv">
              <div><dt>{t('svc.hostname')}</dt><dd className="serial"><bdi>{svc.server}</bdi></dd></div>
              <div><dt>{t('svc.ip')}</dt><dd className="serial"><bdi>{svc.ip}</bdi></dd></div>
              <div><dt>{t('account.since')}</dt><dd className="serial"><bdi>{svc.since}</bdi></dd></div>
            </dl>
          </section>

          {live && svc.kind !== 'vps' && (
            <section className="card">
              <header className="card__head">
                <h2 className="card__heading">{t('svc.shortcuts')}</h2>
              </header>
              <ul className="shortcuts">
                {apps.map((a) => (
                  <li key={a.id}>
                    <Link className="quick__item" to={`/cpanel?domain=${svc.domain}&app=${a.id}`}>
                      {APP_ICON[a.id]}
                      {t(a.labelKey as never)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {live && svc.kind !== 'vps' && (
            <form
              className="card"
              onSubmit={(e) => {
                e.preventDefault();
                createMailbox();
              }}
            >
              <header className="card__head">
                <h2 className="card__heading">{t('svc.mailNew')}</h2>
              </header>
              <div className="form">
                <div className="field-grid">
                  <label className="field-label">
                    <span className="eyebrow">{t('svc.mailName')}</span>
                    <span className="copy-row">
                      <input
                        className="field serial"
                        name="local"
                        dir="ltr"
                        autoComplete="off"
                        required
                        value={mailName}
                        onChange={(e) => {
                          setMailName(e.target.value);
                          setMailBad(false);
                        }}
                      />
                      <span className="field-affix serial">
                        <bdi>@{svc.domain}</bdi>
                      </span>
                    </span>
                  </label>
                  <label className="field-label">
                    <span className="eyebrow">{t('svc.mailPassword')}</span>
                    <input
                      className="field"
                      name="mailpw"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={mailPw}
                      onChange={(e) => {
                        setMailPw(e.target.value);
                        setMailBad(false);
                      }}
                    />
                  </label>
                </div>
                {mailBad && <p className="hint hint--bad">{t('svc.mailBad')}</p>}
                <div className="form__foot">
                  <Button type="submit" size="md">
                    {t('svc.mailCreate')}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.addons')}</h2>
            </header>
            {activeAddons.length > 0 ? (
              <p className="tags">
                {activeAddons.map((a) => (
                  <Tag tone="ok" key={a}>
                    <IconCheck size={13} />
                    {a}
                  </Tag>
                ))}
              </p>
            ) : (
              <p className="card__body">{t('svc.addonsNone')}</p>
            )}
            {live && (
              <div className="form u-mt-16">
                <label className="field-label">
                  <span className="eyebrow">{t('svc.addonPick')}</span>
                  <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                    <option value="">{t('svc.addonPick')}</option>
                    {purchasable.map((p) => (
                      <option key={p.key} value={p.key}>
                        {t(p.group.titleKey as never)} — {p.opt.label} ·{' '}
                        {money(p.opt.priceUsdMinor)} /{p.opt.per === 'year' ? 'yr' : 'mo'}
                      </option>
                    ))}
                  </Select>
                </label>
                <div className="form__foot">
                  <Button size="md" disabled={!pick} onClick={buyAddon}>
                    {t('svc.addonBuy')}
                    <IconArrow size={15} />
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Billing details belong to the side column, and they are stated there once. What
              belongs here is what the side column does not carry: the invoices this one
              service has produced, and the domain it is attached to. */}
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.related')}</h2>
            </header>
            <div className="bar">
              <div className="filters" role="group" aria-label={t('svc.related')}>
                {(['invoices', 'domain'] as RelatedTab[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`filters__btn${tab === k ? ' is-active' : ''}`}
                    aria-pressed={tab === k}
                    onClick={() => setTab(k)}
                  >
                    {t(`svc.tab.${k}` as never)}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'invoices' &&
              (invoices.length > 0 ? (
                <div className="table-scroll">
                  <table className="data">
                    <thead>
                      <tr>
                        <th scope="col">{t('account.invoice')}</th>
                        <th scope="col">{t('account.date')}</th>
                        <th scope="col" className="num">{t('col.amount')}</th>
                        <th scope="col">{t('account.status')}</th>
                        <th scope="col" />
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><span className="lead serial"><bdi>{inv.number}</bdi></span></td>
                          <td className="serial"><bdi>{inv.date}</bdi></td>
                          <td className="num">{money(inv.totalUsdMinor)}</td>
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
              ) : (
                <div className="empty">
                  <p className="empty__title">{t('svc.noInvoices')}</p>
                </div>
              ))}

            {tab === 'domain' &&
              (dom ? (
                <>
                  <dl className="kv">
                    <div><dt>{t('col.item')}</dt><dd className="serial"><bdi>{dom.name}</bdi></dd></div>
                    <div><dt>{t('dom.expires')}</dt><dd className="serial"><bdi>{dom.expires}</bdi></dd></div>
                    <div>
                      <dt>{t('account.status')}</dt>
                      <dd>
                        <Tag tone={DOMAIN_TONE[dom.status]}>{t(`dom.${dom.status}` as never)}</Tag>
                      </dd>
                    </div>
                  </dl>
                  <div className="form__foot">
                    <Link className="btn btn--md btn--secondary" to={`/account/domains/${dom.id}`}>
                      {t('svc.manageDomain')}
                      <IconArrow size={15} />
                    </Link>
                  </div>
                </>
              ) : (
                <p className="card__body">{t('svc.noDomain')}</p>
              ))}
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.billing')}</h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(svc.amountUsdMinor)}</span>
              <span className="figure__unit">{t(`cycle.${svc.cycle}` as never)}</span>
            </p>
            <dl className="kv">
              <div><dt>{t(live ? 'account.nextdue' : 'svc.ended')}</dt><dd className="serial"><bdi>{svc.nextDue}</bdi></dd></div>
              <div><dt>{t('svc.paymentMethod')}</dt><dd className="serial"><bdi>{paymentLabel}</bdi></dd></div>
            </dl>

            {/* Nothing to renew once the term is over, so the switch goes rather than sitting
                there off and unexplained. */}
            {live && (
              <>
                <label className="switch-row">
                  <span>
                    <span className="switch-row__label">{t('svc.autoRenew')}</span>
                    <span className="switch-row__note">
                      {t(svc.autoRenew ? 'svc.autoRenewOn' : 'svc.autoRenewOff')}{' '}
                      <span className="serial">
                        <bdi>{svc.nextDue}</bdi>
                      </span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    name="autorenew"
                    checked={svc.autoRenew}
                    onChange={(e) => {
                      updateService(svc.id, { autoRenew: e.target.checked });
                      mark(t(e.target.checked ? 'svc.autoRenewOnMsg' : 'svc.autoRenewOffMsg'));
                    }}
                  />
                </label>
                <DevNote>{t('dev.autoRenew')}</DevNote>
              </>
            )}
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.manage')}</h2>
            </header>
            {/* Only Support survives an ending. A question about a service that has stopped
                is the most likely question there is; everything else here acts on a machine
                that is no longer running. */}
            <div className="acts">
              {live && (
                <Link
                  className="btn btn--md btn--secondary"
                  to={`/account/services/${svc.id}/upgrade`}
                >
                  {t('svc.upgrade')}
                </Link>
              )}
              {live && svc.kind !== 'vps' && (
                <Link className="btn btn--md btn--secondary" to={`/cpanel?domain=${svc.domain}&app=webmail`}>
                  <IconMail size={15} />
                  {t('svc.webmail')}
                </Link>
              )}
              {live && (
                <Link
                  className="btn btn--md btn--secondary"
                  to={`/account/services/${svc.id}/password`}
                >
                  <IconKey size={15} />
                  {t('svc.password')}
                </Link>
              )}
              {live && svc.builder && (
                <Link className="btn btn--md btn--secondary" to={`/cpanel?domain=${svc.domain}&app=builder`}>
                  <IconExternal size={15} />
                  {t('svc.builder')}
                </Link>
              )}
              {/* Spec 9.2: support "related to this service specifically" — the service
                  travels with the link so the ticket form opens knowing which one. */}
              <Link
                className="btn btn--md btn--secondary"
                to={`/account/tickets/new?service=${svc.id}`}
              >
                <IconSupport size={15} />
                {t('svc.support')}
              </Link>
              {/* Cancellation is a request, not a button that ends the service instantly —
                  and it is set apart so it is never the one you meant to hit. */}
              {live && (
                <div className="acts__sep">
                  <Link className="btn btn--md btn--danger" to={`/account/services/${svc.id}/cancel`}>
                    {t('svc.cancel')}
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AccountLayout>
  );
}

/**
 * Change the service's password — C-42. This is the cPanel account's password, not the
 * client-area login; the lede says so, because the two are confused often enough to be a
 * support category. The rules are the register screen's, shown as what is still missing.
 */
export function ServicePassword() {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const { service } = useAccountState();
  const svc = service(id ?? '');
  const { saved, mark, clear } = useSaved();
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');

  if (!svc) return <Navigate to="/account/services" replace />;

  const rules = [
    { k: 'pw.len', ok: pw.length >= 10 },
    { k: 'pw.case', ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { k: 'pw.num', ok: /\d/.test(pw) },
  ];
  const strong = rules.every((r) => r.ok);
  const matches = pw.length > 0 && pw === again;

  return (
    <AccountLayout
      title={t('svc.password')}
      lede={t('svc.pwLede')}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.services'), to: '/account/services' },
        { label: svc.product, to: `/account/services/${svc.id}` },
        { label: t('svc.password') },
      ]}
    >
      <SavedNote saved={saved} onDismiss={clear} />

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!strong || !matches) return;
          mark(t('sec.pwChanged'));
          setPw('');
          setAgain('');
        }}
      >
        <div className="form">
          <label className="field-label">
            <span className="eyebrow">{t('sec.newPassword')}</span>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </label>
          <ul className="rules">
            {rules.map((r) => (
              <li key={r.k} className={`rule${r.ok ? ' is-met' : ''}`}>
                <IconCheck size={14} />
                {t(r.k as never)}
              </li>
            ))}
          </ul>
          <label className="field-label">
            <span className="eyebrow">{t('pw.again')}</span>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              required
              value={again}
              onChange={(e) => setAgain(e.target.value)}
            />
          </label>
          {again.length > 0 && !matches && <p className="hint hint--bad">{t('svc.pwMismatch')}</p>}
          <div className="form__foot">
            <Button type="submit" size="md" disabled={!strong || !matches}>
              {t('sec.changePassword')}
            </Button>
            <Link className="btn btn--md btn--quiet" to={`/account/services/${svc.id}`}>
              {t('up.backToService')}
            </Link>
          </div>
        </div>
      </form>
    </AccountLayout>
  );
}
