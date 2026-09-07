import { useState, type ReactNode } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { DevNote } from '../../components/DevNote';
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
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { useCart } from '../../lib/cart';
import { useSaved, SavedNote } from '../../lib/saved';
import { useAccountState } from '../../lib/accountState';
import { convert, formatAmount, ADDONS, GATEWAYS } from '../../lib/catalog';
import {
  INVOICES,
  PAYMENT_METHODS_SAVED,
  CPANEL_APPS,
  type ServiceStatus,
} from '../../lib/account';

/** The statuses a service can be filtered to, matching invoices and tickets. */
const STATUSES: (ServiceStatus | 'all')[] = ['all', 'active', 'pending', 'suspended'];

/** My Services — spec 9.2: plan, linked domain, status, next renewal. */
export function Services() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { services } = useAccountState();
  const [status, setStatus] = useState<ServiceStatus | 'all'>('all');

  const rows = services.filter((s) => status === 'all' || s.status === status);

  return (
    <AccountLayout
      title={t('acc.services')}
      actions={
        <Link className="btn btn--md btn--secondary" to="/hosting">
          {t('action.order')}
        </Link>
      }
    >
      <div className="bar">
        <div className="filters" role="group" aria-label={t('account.status')}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`filters__btn${status === s ? ' is-active' : ''}`}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {t(s === 'all' ? 'inv.all' : (`status.${s}` as never))}
            </button>
          ))}
        </div>
        <p className="bar__count">
          <span className="serial">{rows.length}</span> {t('dash.of')}{' '}
          <span className="serial">{services.length}</span>
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="card card--flush table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('col.item')}</th>
                <th scope="col">{t('col.term')}</th>
                <th scope="col">{t('account.nextdue')}</th>
                <th scope="col" className="num">{t('col.amount')}</th>
                <th scope="col">{t('account.status')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="lead">{s.product}</span>
                    <span className="data__sub serial"><bdi>{s.domain}</bdi></span>
                  </td>
                  <td>{t(`cycle.${s.cycle}` as never)}</td>
                  <td className="serial"><bdi>{s.nextDue}</bdi></td>
                  <td className="num">
                    {formatAmount(convert(s.amountUsdMinor, currency), locale)} {currency}
                  </td>
                  <td>
                    <span className={`tag tag--${s.status === 'active' ? 'ok' : 'taken'}`}>
                      {t(`status.${s.status}` as never)}
                    </span>
                  </td>
                  <td className="num">
                    <Link className="btn btn--sm btn--secondary" to={`/account/services/${s.id}`}>
                      {t('svc.manage')}
                      <IconArrow size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* A filter that matches nothing says so, rather than showing an empty table frame. */
        <div className="card empty">
          <IconServer size={28} />
          <p className="empty__title">{t('empty.services')}</p>
          <p className="empty__note">{t('empty.filter')}</p>
        </div>
      )}
    </AccountLayout>
  );
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

type BillingTab = 'details' | 'invoices' | 'domain';

/**
 * Service details — spec 9.2, C-03: server information, a direct cPanel login, billing
 * details, upgrade/downgrade, cancellation, and related support — and, since the reference
 * screenshots, the things a person opens this screen to do without leaving it: the ten
 * cPanel shortcuts, a mailbox created in two fields, an add-on bought from a list, and the
 * invoices and domain that belong to this one service under a chip strip.
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
  const { service, updateService, domains } = useAccountState();
  const { add } = useCart();
  const navigate = useNavigate();
  const svc = service(id ?? '');
  const { saved, mark, clear } = useSaved();

  const [tab, setTab] = useState<BillingTab>('details');
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

  const invoices = INVOICES.filter((i) =>
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
          <span className={`tag tag--${svc.status === 'active' ? 'ok' : 'taken'}`}>
            {t(`status.${svc.status}` as never)}
          </span>
          <span className="app__meta-note">{t(`svc.kind.${svc.kind}` as never)}</span>
        </>
      }
      actions={
        <Link className="btn btn--md btn--primary" to={`/cpanel?domain=${svc.domain}`}>
          <IconExternal size={15} />
          {t('svc.cpanel')}
        </Link>
      }
    >
      <SavedNote saved={saved} onDismiss={clear} />

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

          {svc.kind !== 'vps' && (
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

          {svc.kind !== 'vps' && (
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
                  <span className="tag tag--ok" key={a}>
                    <IconCheck size={13} />
                    {a}
                  </span>
                ))}
              </p>
            ) : (
              <p className="card__body">{t('svc.addonsNone')}</p>
            )}
            <div className="form u-mt-16">
              <label className="field-label">
                <span className="eyebrow">{t('svc.addonPick')}</span>
                <select className="field" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">{t('svc.addonPick')}</option>
                  {purchasable.map((p) => (
                    <option key={p.key} value={p.key}>
                      {t(p.group.titleKey as never)} — {p.opt.label} · {money(p.opt.priceUsdMinor)} /
                      {p.opt.per === 'year' ? 'yr' : 'mo'}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form__foot">
                <Button size="md" disabled={!pick} onClick={buyAddon}>
                  {t('svc.addonBuy')}
                  <IconArrow size={15} />
                </Button>
              </div>
            </div>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.billing')}</h2>
            </header>
            <div className="bar">
              <div className="filters" role="group" aria-label={t('svc.billing')}>
                {(['details', 'invoices', 'domain'] as BillingTab[]).map((k) => (
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

            {tab === 'details' && (
              <dl className="kv">
                <div><dt>{t('account.since')}</dt><dd className="serial"><bdi>{svc.since}</bdi></dd></div>
                <div><dt>{t('col.amount')}</dt><dd className="serial">{money(svc.amountUsdMinor)}</dd></div>
                <div><dt>{t('col.term')}</dt><dd>{t(`cycle.${svc.cycle}` as never)}</dd></div>
                <div><dt>{t('account.nextdue')}</dt><dd className="serial"><bdi>{svc.nextDue}</bdi></dd></div>
                <div><dt>{t('svc.paymentMethod')}</dt><dd className="serial"><bdi>{paymentLabel}</bdi></dd></div>
                <div><dt>{t('svc.autoRenew')}</dt><dd>{t(svc.autoRenew ? 'dom.on' : 'dom.off')}</dd></div>
              </dl>
            )}

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
                            <span className={`tag tag--${inv.status === 'paid' ? 'ok' : 'due'}`}>
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
                        <span className={`tag tag--${dom.status === 'active' ? 'ok' : 'due'}`}>
                          {t(`dom.${dom.status}` as never)}
                        </span>
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
              <div><dt>{t('account.nextdue')}</dt><dd className="serial"><bdi>{svc.nextDue}</bdi></dd></div>
              <div><dt>{t('svc.paymentMethod')}</dt><dd className="serial"><bdi>{paymentLabel}</bdi></dd></div>
            </dl>

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
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('svc.manage')}</h2>
            </header>
            <div className="acts">
              <Link className="btn btn--md btn--secondary" to={`/account/services/${svc.id}/upgrade`}>
                {t('svc.upgrade')}
              </Link>
              {svc.kind !== 'vps' && (
                <Link className="btn btn--md btn--secondary" to={`/cpanel?domain=${svc.domain}&app=webmail`}>
                  <IconMail size={15} />
                  {t('svc.webmail')}
                </Link>
              )}
              <Link className="btn btn--md btn--secondary" to={`/account/services/${svc.id}/password`}>
                <IconKey size={15} />
                {t('svc.password')}
              </Link>
              {svc.builder && (
                <Link className="btn btn--md btn--secondary" to={`/cpanel?domain=${svc.domain}&app=builder`}>
                  <IconExternal size={15} />
                  {t('svc.builder')}
                </Link>
              )}
              <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
                <IconSupport size={15} />
                {t('svc.support')}
              </Link>
              {/* Cancellation is a request, not a button that ends the service instantly —
                  and it is set apart so it is never the one you meant to hit. */}
              <div className="acts__sep">
                <Link className="btn btn--md btn--danger" to={`/account/services/${svc.id}/cancel`}>
                  {t('svc.cancel')}
                </Link>
              </div>
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
