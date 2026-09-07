import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { DomainPage } from '../../components/DomainRail';
import { Button } from '../../components/Button';
import { Tag, DOMAIN_TONE } from '../../components/Tag';
import { TableToolbar, TableFilter, matches } from '../../components/TableToolbar';
import {
  IconPlus,
  IconTrash,
  IconGlobe,
  IconMail,
  IconInfo,
  IconCheck,
  IconCopy,
  IconArrow,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { useSaved, SavedNote } from '../../lib/saved';
import { useAccountState } from '../../lib/accountState';
import { TLDS, COUNTRIES, convert, formatAmount } from '../../lib/catalog';
import {
  ACCOUNT,
  DEFAULT_NS,
  DNS_TYPES,
  type DomainRecord,
  type DomainContact,
  type ContactRole,
  type DnsType,
} from '../../lib/account';

/*
 * Domain management — spec 9.3, C-10 to C-13 and C-37 to C-40.
 *
 * Eight pages, one domain, one store. Every edit goes through useAccountState so the lock
 * switched off on Transfer-out reads as off on Overview a moment later; nothing here keeps a
 * private copy of the domain.
 */

const ROLES: ContactRole[] = ['registrant', 'admin', 'tech', 'billing'];
const IPV4 = /^(\d{1,3})(\.\d{1,3}){3}$/;

/** The one thing every page starts with: the domain from the route, and a way to say "saved". */
function useDomainPage() {
  const { id } = useParams<{ id: string }>();
  const state = useAccountState();
  const dom = state.domain(id ?? '');
  const saved = useSaved();
  return { dom, ...state, ...saved };
}

/** What "use the account details" means, as a contact record. */
function accountContact(bi: (v: { ar: string; en: string }) => string): DomainContact {
  const [firstName, ...rest] = bi(ACCOUNT.name).split(' ');
  return {
    firstName,
    lastName: rest.join(' '),
    company: ACCOUNT.company ? bi(ACCOUNT.company) : '',
    email: ACCOUNT.email,
    address1: bi(ACCOUNT.address),
    address2: '',
    city: bi(ACCOUNT.city),
    state: '',
    postcode: ACCOUNT.postcode,
    country: ACCOUNT.country,
    phone: ACCOUNT.phone,
  };
}

/* ── overview ───────────────────────────────────────────────────────────────── */

export function DomainOverview() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { dom, updateDomain, saved, mark, clear } = useDomainPage();

  if (!dom) return <Navigate to="/account/domains" replace />;

  const tld = TLDS.find((x) => dom.name.endsWith(x.tld)) ?? TLDS[0];
  const money = (minor: number) => `${formatAmount(convert(minor, currency), locale)} ${currency}`;
  const flip = (patch: Partial<DomainRecord>) => {
    updateDomain(dom.id, patch);
    mark();
  };

  return (
    <DomainPage dom={dom} sectionKey="dom.overview">
      <SavedNote saved={saved} onDismiss={clear} />

      <div className="with-side">
        <div className="dash__main">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dom.registration')}</h2>
            </header>
            <dl className="kv">
              <div><dt>{t('dom.registered')}</dt><dd className="serial"><bdi>{dom.registered}</bdi></dd></div>
              <div><dt>{t('dom.expires')}</dt><dd className="serial"><bdi>{dom.expires}</bdi></dd></div>
              <div><dt>{t('dom.tld')}</dt><dd className="serial"><bdi>{tld.tld}</bdi></dd></div>
              <div>
                <dt>{t('dom.nameservers')}</dt>
                <dd className="serial">
                  {dom.useDefaultNs ? t('dom.nsDefault') : <bdi>{dom.nameservers.join(', ')}</bdi>}
                </dd>
              </div>
              <div>
                <dt>{t('account.status')}</dt>
                <dd>
                  <Tag tone={DOMAIN_TONE[dom.status]}>{t(`dom.${dom.status}` as never)}</Tag>
                </dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dom.renewal')}</h2>
            </header>
            <p className="figure">
              <span className="figure__n serial">{money(tld.renewUsdMinor)}</span>
              <span className="figure__unit">{t('dom.perYear')}</span>
            </p>
            <dl className="kv">
              <div><dt>{t('dom.expires')}</dt><dd className="serial"><bdi>{dom.expires}</bdi></dd></div>
              <div><dt>{t('dom.autoRenew')}</dt><dd>{t(dom.autoRenew ? 'dom.on' : 'dom.off')}</dd></div>
            </dl>
            <div className="acts u-mt-16">
              <Link className="btn btn--md btn--primary" to={`/account/renew/${dom.id}`}>
                {t('dom.renew')}
                <IconArrow size={15} />
              </Link>
            </div>
          </section>
        </div>

        <div className="dash__side">
          <section className="card">
            <header className="card__head">
              <h2 className="card__heading">{t('dom.protection')}</h2>
            </header>
            <div className="form">
              <label className="switch-row">
                <span>
                  <span className="switch-row__label">{t('dom.privacy')}</span>
                  <span className="switch-row__note">{t('dom.privacyNote')}</span>
                </span>
                <input
                  type="checkbox"
                  name="privacy"
                  checked={dom.whoisPrivacy}
                  onChange={(e) => flip({ whoisPrivacy: e.target.checked })}
                />
              </label>

              <label className="switch-row">
                <span>
                  <span className="switch-row__label">{t('dom.lock')}</span>
                  <span className="switch-row__note">{t('dom.lockNote')}</span>
                </span>
                <input
                  type="checkbox"
                  name="lock"
                  checked={dom.registrarLock}
                  onChange={(e) => flip({ registrarLock: e.target.checked })}
                />
              </label>

              <label className="switch-row">
                <span>
                  <span className="switch-row__label">{t('dom.autoRenew')}</span>
                  <span className="switch-row__note">{t('dom.autoRenewNote')}</span>
                </span>
                <input
                  type="checkbox"
                  name="autorenew"
                  checked={dom.autoRenew}
                  onChange={(e) => flip({ autoRenew: e.target.checked })}
                />
              </label>

              {dom.registrarLock && (
                <p className="form__note">
                  {t('dom.lockedNote')}{' '}
                  <Link to={`/account/domains/${dom.id}/transfer-out`}>{t('dom.transferOut')}</Link>
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </DomainPage>
  );
}

/* ── nameservers — C-11 ─────────────────────────────────────────────────────── */

export function DomainNameservers() {
  const { t } = useLocale();
  const { dom, updateDomain, saved, mark, clear } = useDomainPage();
  const [mode, setMode] = useState<'default' | 'custom'>(
    dom && !dom.useDefaultNs ? 'custom' : 'default',
  );
  const [ns, setNs] = useState<string[]>(
    dom && !dom.useDefaultNs ? dom.nameservers : [...DEFAULT_NS],
  );

  if (!dom) return <Navigate to="/account/domains" replace />;

  return (
    <DomainPage dom={dom} sectionKey="dom.nameservers">
      <SavedNote saved={saved} onDismiss={clear} />

      <section className="card">
        <header className="card__head">
          <h2 className="card__heading">{t('dom.nameservers')}</h2>
        </header>
        <ul className="methods">
          {(['default', 'custom'] as const).map((m) => (
            <li key={m}>
              <label className={`method${mode === m ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="nsmode"
                  value={m}
                  checked={mode === m}
                  onChange={() => setMode(m)}
                />
                <span className="method__label">
                  {t(m === 'default' ? 'dom.nsDefault' : 'dom.nsCustom')}
                  <span className="method__note">
                    {m === 'default' ? (
                      <bdi className="serial">{DEFAULT_NS.join(', ')}</bdi>
                    ) : (
                      t('dom.nsCustomNote')
                    )}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        {mode === 'custom' ? (
          <div className="form u-mt-16">
            {ns.map((host, i) => (
              <label className="field-label" key={i}>
                <span className="eyebrow">
                  {t('dom.ns')} {i + 1}
                </span>
                <input
                  className="field serial"
                  dir="ltr"
                  value={host}
                  onChange={(e) =>
                    setNs((rows) => rows.map((r, j) => (j === i ? e.target.value : r)))
                  }
                />
              </label>
            ))}
            <div className="form__foot">
              <Button
                size="md"
                onClick={() => {
                  updateDomain(dom.id, { useDefaultNs: false, nameservers: ns.filter(Boolean) });
                  mark();
                }}
              >
                {t('sec.save')}
              </Button>
              <Button
                size="md"
                variant="secondary"
                disabled={ns.length >= 5}
                onClick={() => setNs((rows) => [...rows, ''])}
              >
                <IconPlus size={15} />
                {t('dom.addNs')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="form u-mt-16">
            <p className="card__body">{t('dom.nsDefaultNote')}</p>
            <dl className="kv">
              {DEFAULT_NS.map((host, i) => (
                <div key={host}>
                  <dt>
                    {t('dom.ns')} {i + 1}
                  </dt>
                  <dd className="serial">
                    <bdi>{host}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="form__foot">
              <Button
                size="md"
                onClick={() => {
                  updateDomain(dom.id, { useDefaultNs: true, nameservers: [...DEFAULT_NS] });
                  mark();
                }}
              >
                {t('sec.save')}
              </Button>
            </div>
          </div>
        )}
      </section>
    </DomainPage>
  );
}

/* ── DNS records — C-12 ─────────────────────────────────────────────────────── */

export function DomainDns() {
  const { t } = useLocale();
  const { dom, dns, setDns, saved, mark, clear } = useDomainPage();
  const [type, setType] = useState<DnsType>('A');
  const [host, setHost] = useState('');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState(3600);
  const [dnsQ, setDnsQ] = useState('');
  const [dnsType, setDnsType] = useState('all');

  if (!dom) return <Navigate to="/account/domains" replace />;
  const rows = dns[dom.id] ?? [];

  // The record types actually present, not every type DNS defines: a filter offering SRV on a
  // zone with no SRV record is four clicks to an empty table.
  const dnsTypes = ['all', ...new Set(rows.map((r) => r.type))];
  const dnsRows = rows.filter(
    (r) => (dnsType === 'all' || r.type === dnsType) && matches(dnsQ, r.type, r.host, r.value),
  );

  return (
    <DomainPage dom={dom} sectionKey="dom.dns">
      <SavedNote saved={saved} onDismiss={clear} />

      {!dom.useDefaultNs && (
        <div className="notice notice--spaced u-mb-16">
          <IconInfo size={20} />
          <div>
            <p className="card__body">
              {t('dom.dnsExternal')}{' '}
              <span className="serial">
                <bdi>{dom.nameservers.join(', ')}</bdi>
              </span>
            </p>
          </div>
        </div>
      )}

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!host.trim() || !value.trim()) return;
          // The toolbar resets with the new row, or a zone filtered to MX would answer Add
          // Record by appending an A record you cannot see.
          setDnsQ('');
          setDnsType('all');
          setDns(dom.id, [
            ...rows,
            { id: `dns-${Date.now()}`, type, host: host.trim(), value: value.trim(), ttl },
          ]);
          setHost('');
          setValue('');
          mark();
        }}
      >
        <header className="card__head">
          <h2 className="card__heading">{t('dom.addRecord')}</h2>
        </header>
        <div className="form">
          <div className="field-grid dns-add">
            <label className="field-label">
              <span className="eyebrow">{t('dom.type')}</span>
              <select className="field" value={type} onChange={(e) => setType(e.target.value as DnsType)}>
                {DNS_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('dom.host')}</span>
              <input
                className="field serial"
                dir="ltr"
                placeholder="@"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('dom.value')}</span>
              <input
                className="field serial"
                dir="ltr"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('dom.ttl')}</span>
              <input
                className="field serial"
                type="number"
                min={60}
                step={60}
                dir="ltr"
                value={ttl}
                onChange={(e) => setTtl(Number(e.target.value) || 3600)}
              />
            </label>
          </div>
          <div className="form__foot">
            <Button type="submit" size="md" variant="secondary">
              <IconPlus size={15} />
              {t('dom.addRecord')}
            </Button>
          </div>
        </div>
      </form>

      {rows.length > 0 ? (
        <section className="card card--flush">
          <header className="card__head card__head--flush">
            <h2 className="card__heading">{t('dom.dns')}</h2>
          </header>
          <TableToolbar
            inset
            value={dnsQ}
            onChange={setDnsQ}
            label={t('search.dns')}
            shown={dnsRows.length}
            total={rows.length}
          >
            <TableFilter
              label={t('filter.recordType')}
              value={dnsType}
              onChange={setDnsType}
              options={dnsTypes.map((ty) => ({
                value: ty,
                label: ty === 'all' ? t('filter.allTypes') : ty,
              }))}
            />
          </TableToolbar>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">{t('dom.type')}</th>
                  <th scope="col">{t('dom.host')}</th>
                  <th scope="col">{t('dom.value')}</th>
                  <th scope="col" className="num">{t('dom.ttl')}</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {dnsRows.map((r) => (
                  <tr key={r.id}>
                    <td><span className="lead serial">{r.type}</span></td>
                    <td className="serial"><bdi>{r.host}</bdi></td>
                    <td className="serial"><bdi>{r.value}</bdi></td>
                    <td className="num">{r.ttl}</td>
                    <td className="num">
                      <Button
                        size="sm"
                        variant="danger"
                        aria-label={`${t('action.remove')} ${r.type} ${r.host}`}
                        onClick={() => {
                          setDns(dom.id, rows.filter((x) => x.id !== r.id));
                          mark();
                        }}
                      >
                        <IconTrash size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* A zone with records but none matching says so inside the card, so the table's
              head stays where it was rather than the card collapsing to a notice. */}
          {dnsRows.length === 0 && (
            <div className="empty empty--inset">
              <p className="empty__title">{t(dnsQ.trim() ? 'empty.search' : 'empty.dns')}</p>
              <p className="empty__note">{t(dnsQ.trim() ? 'empty.searchNote' : 'empty.filter')}</p>
            </div>
          )}
        </section>
      ) : (
        <div className="card empty">
          <IconGlobe size={28} />
          <p className="empty__title">{t('dom.dnsNone')}</p>
          <p className="empty__note">{t('dom.dnsNoneNote')}</p>
        </div>
      )}
    </DomainPage>
  );
}

/* ── contacts — C-37 ────────────────────────────────────────────────────────── */

function ContactForm({
  dom,
  role,
  onSave,
}: {
  dom: DomainRecord;
  role: ContactRole;
  onSave: (contact: DomainContact | undefined) => void;
}) {
  const { t, bi } = useLocale();
  const existing = dom.contacts[role];
  const [mode, setMode] = useState<'account' | 'custom'>(existing ? 'custom' : 'account');
  const [data, setData] = useState<DomainContact>(existing ?? accountContact(bi));

  const field = (key: keyof DomainContact) => ({
    value: data[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setData((d) => ({ ...d, [key]: e.target.value })),
  });

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(mode === 'custom' ? data : undefined);
      }}
    >
      <header className="card__head">
        <h2 className="card__heading">{t(`dom.contact.${role}` as never)}</h2>
      </header>

      <ul className="methods">
        {(['account', 'custom'] as const).map((m) => (
          <li key={m}>
            <label className={`method${mode === m ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name={`${role}-mode`}
                value={m}
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              <span className="method__label">
                {t(m === 'account' ? 'dom.useAccount' : 'dom.custom')}
                <span className="method__note">
                  {t(m === 'account' ? 'dom.useAccountNote' : 'dom.customNote')}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {mode === 'account' ? (
        <dl className="kv u-mt-16">
          <div><dt>{t('checkout.name')}</dt><dd>{bi(ACCOUNT.name)}</dd></div>
          <div><dt>{t('checkout.email')}</dt><dd className="serial"><bdi>{ACCOUNT.email}</bdi></dd></div>
          <div><dt>{t('dom.address1')}</dt><dd>{bi(ACCOUNT.address)}, {bi(ACCOUNT.city)}</dd></div>
          <div><dt>{t('checkout.phone')}</dt><dd className="serial"><bdi>{ACCOUNT.phone}</bdi></dd></div>
        </dl>
      ) : (
        <div className="field-grid u-mt-16">
          <label className="field-label">
            <span className="eyebrow">{t('dom.firstName')}</span>
            <input className="field" required {...field('firstName')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('dom.lastName')}</span>
            <input className="field" required {...field('lastName')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('dom.company')}</span>
            <input className="field" {...field('company')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('checkout.email')}</span>
            <input className="field serial" type="email" dir="ltr" required {...field('email')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('dom.address1')}</span>
            <input className="field" required {...field('address1')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('dom.address2')}</span>
            <input className="field" {...field('address2')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('auth.city')}</span>
            <input className="field" required {...field('city')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('dom.state')}</span>
            <input className="field" {...field('state')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('auth.postcode')}</span>
            <input className="field serial" dir="ltr" required {...field('postcode')} />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('checkout.country')}</span>
            <select className="field" required {...field('country')}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('checkout.phone')}</span>
            <input className="field serial" type="tel" dir="ltr" required {...field('phone')} />
          </label>
        </div>
      )}

      <div className="form__foot">
        <Button type="submit" size="md">
          {t('sec.save')}
        </Button>
      </div>
    </form>
  );
}

export function DomainContacts() {
  const { t } = useLocale();
  const { dom, updateDomain, saved, mark, clear } = useDomainPage();

  if (!dom) return <Navigate to="/account/domains" replace />;

  return (
    <DomainPage dom={dom} sectionKey="dom.contacts">
      <SavedNote saved={saved} onDismiss={clear} />
      <p className="card__body u-mb-16">{t('dom.contactsLede')}</p>
      {ROLES.map((role) => (
        <ContactForm
          key={role}
          dom={dom}
          role={role}
          onSave={(contact) => {
            updateDomain(dom.id, { contacts: { ...dom.contacts, [role]: contact } });
            mark(t('dom.contactsSaved'));
          }}
        />
      ))}
    </DomainPage>
  );
}

/* ── private nameservers — C-38 ─────────────────────────────────────────────── */

export function DomainPrivateNs() {
  const { t } = useLocale();
  const { dom, updateDomain, saved, mark, clear } = useDomainPage();
  const [reg, setReg] = useState({ host: '', ip: '' });
  const [regBad, setRegBad] = useState(false);
  const [mod, setMod] = useState({ host: dom?.privateNs[0]?.host ?? '', ip: '' });
  const [modBad, setModBad] = useState(false);
  const [del, setDel] = useState(dom?.privateNs[0]?.host ?? '');

  if (!dom) return <Navigate to="/account/domains" replace />;
  const list = dom.privateNs;
  const current = list.find((n) => n.host === mod.host);

  return (
    <DomainPage dom={dom} sectionKey="dom.privateNs">
      <SavedNote saved={saved} onDismiss={clear} />
      <p className="card__body u-mb-16">{t('dom.privateNsLede')}</p>

      {list.length > 0 ? (
        <section className="card card--flush">
          <header className="card__head card__head--flush">
            <h2 className="card__heading">{t('dom.privateNs')}</h2>
          </header>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">{t('dom.nsHost')}</th>
                  <th scope="col">{t('dom.nsIp')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((n) => (
                  <tr key={n.host}>
                    <td className="serial"><span className="lead"><bdi>{n.host}</bdi></span></td>
                    <td className="serial"><bdi>{n.ip}</bdi></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="card__body u-mb-16">{t('dom.privateNsNone')}</p>
      )}

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          const ok = /^[a-z0-9-]+$/i.test(reg.host) && IPV4.test(reg.ip);
          setRegBad(!ok);
          if (!ok) return;
          const host = `${reg.host.toLowerCase()}.${dom.name}`;
          updateDomain(dom.id, {
            privateNs: [...list.filter((n) => n.host !== host), { host, ip: reg.ip }],
          });
          setReg({ host: '', ip: '' });
          mark();
        }}
      >
        <header className="card__head">
          <h2 className="card__heading">{t('dom.nsRegister')}</h2>
        </header>
        <div className="form">
          <div className="field-grid">
            <label className="field-label">
              <span className="eyebrow">{t('dom.nsHost')}</span>
              <span className="copy-row">
                <input
                  className="field serial"
                  dir="ltr"
                  placeholder="ns1"
                  required
                  value={reg.host}
                  onChange={(e) => setReg((r) => ({ ...r, host: e.target.value }))}
                />
                <span className="field-affix serial">
                  <bdi>.{dom.name}</bdi>
                </span>
              </span>
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('dom.nsIp')}</span>
              <input
                className="field serial"
                dir="ltr"
                inputMode="decimal"
                placeholder="185.42.118.203"
                required
                value={reg.ip}
                onChange={(e) => setReg((r) => ({ ...r, ip: e.target.value.trim() }))}
              />
            </label>
          </div>
          {regBad && <p className="hint hint--bad">{t('dom.nsIpBad')}</p>}
          <div className="form__foot">
            <Button type="submit" size="md">
              <IconPlus size={15} />
              {t('dom.nsRegister')}
            </Button>
          </div>
        </div>
      </form>

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          const ok = !!current && IPV4.test(mod.ip);
          setModBad(!ok);
          if (!ok) return;
          updateDomain(dom.id, {
            privateNs: list.map((n) => (n.host === mod.host ? { ...n, ip: mod.ip } : n)),
          });
          setMod((m) => ({ ...m, ip: '' }));
          mark();
        }}
      >
        <header className="card__head">
          <h2 className="card__heading">{t('dom.nsModify')}</h2>
        </header>
        <div className="form">
          <div className="field-grid">
            <label className="field-label">
              <span className="eyebrow">{t('dom.nsHost')}</span>
              <select
                className="field"
                value={mod.host}
                onChange={(e) => setMod((m) => ({ ...m, host: e.target.value }))}
              >
                {list.map((n) => (
                  <option key={n.host} value={n.host}>
                    {n.host}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('dom.nsCurrentIp')}</span>
              <input className="field serial" dir="ltr" readOnly value={current?.ip ?? ''} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('dom.nsNewIp')}</span>
              <input
                className="field serial"
                dir="ltr"
                inputMode="decimal"
                required
                value={mod.ip}
                onChange={(e) => setMod((m) => ({ ...m, ip: e.target.value.trim() }))}
              />
            </label>
          </div>
          {modBad && <p className="hint hint--bad">{t('dom.nsIpBad')}</p>}
          <div className="form__foot">
            <Button type="submit" size="md" disabled={list.length === 0}>
              {t('sec.save')}
            </Button>
          </div>
        </div>
      </form>

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!del) return;
          const left = list.filter((n) => n.host !== del);
          updateDomain(dom.id, { privateNs: left });
          setDel(left[0]?.host ?? '');
          setMod((m) => ({ ...m, host: left[0]?.host ?? '' }));
          mark();
        }}
      >
        <header className="card__head">
          <h2 className="card__heading">{t('dom.nsDelete')}</h2>
        </header>
        <div className="form">
          <label className="field-label">
            <span className="eyebrow">{t('dom.nsHost')}</span>
            <select className="field" value={del} onChange={(e) => setDel(e.target.value)}>
              {list.map((n) => (
                <option key={n.host} value={n.host}>
                  {n.host}
                </option>
              ))}
            </select>
          </label>
          <div className="form__foot">
            <Button type="submit" size="md" variant="danger" disabled={list.length === 0}>
              <IconTrash size={15} />
              {t('dom.nsDelete')}
            </Button>
          </div>
        </div>
      </form>
    </DomainPage>
  );
}

/* ── add-ons — C-39 ─────────────────────────────────────────────────────────── */

export function DomainAddonsPage() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { dom, updateDomain, saved, mark, clear } = useDomainPage();

  if (!dom) return <Navigate to="/account/domains" replace />;
  const base = `/account/domains/${dom.id}`;

  const rows: {
    key: string;
    titleKey: string;
    noteKey: string;
    on: boolean;
    patch: Partial<DomainRecord>;
    manage?: string;
  }[] = [
    {
      key: 'dns',
      titleKey: 'domainsconf.dns',
      noteKey: 'domainsconf.dnsNote',
      on: dom.dnsManagement,
      patch: { dnsManagement: !dom.dnsManagement },
      manage: `${base}/dns`,
    },
    {
      key: 'id',
      titleKey: 'domainsconf.id',
      noteKey: 'domainsconf.idNote',
      on: dom.whoisPrivacy,
      patch: { whoisPrivacy: !dom.whoisPrivacy },
    },
    {
      key: 'forwarding',
      titleKey: 'domainsconf.forwarding',
      noteKey: 'domainsconf.forwardingNote',
      on: dom.emailForwarding,
      patch: { emailForwarding: !dom.emailForwarding },
      manage: `${base}/forwarding`,
    },
  ];

  return (
    <DomainPage dom={dom} sectionKey="dom.addons">
      <SavedNote saved={saved} onDismiss={clear} />
      <p className="card__body u-mb-16">{t('dom.addonsLede')}</p>

      {/* The same ruled rows the contacts list wears: name, the facts beside it, the state,
          then the actions at the far end. */}
      <div className="card card--flush">
        {rows.map((r) => (
          <div className="contact" key={r.key}>
            <div className="method-row">
              <span className="addon-row__text">
                <span className="method-row__name">{t(r.titleKey as never)}</span>
                <span className="method-row__exp">{t(r.noteKey as never)}</span>
                <span className="method-row__exp serial">
                  {formatAmount(0, locale)} {currency} / {t('domainsconf.perYear')}
                </span>
              </span>
              <span className="method-row__grow">
                {r.on && (
                  <Tag tone="ok">
                    <IconCheck size={13} />
                    {t('dom.enabled')}
                  </Tag>
                )}
              </span>
              {r.on && r.manage && (
                <Link className="btn btn--sm btn--secondary" to={r.manage}>
                  {t('svc.manage')}
                </Link>
              )}
              <Button
                size="sm"
                variant={r.on ? 'danger' : 'primary'}
                onClick={() => {
                  updateDomain(dom.id, r.patch);
                  mark();
                }}
              >
                {t(r.on ? 'dom.disable' : 'dom.enable')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DomainPage>
  );
}

/* ── email forwarding — C-40 ────────────────────────────────────────────────── */

export function DomainForwarding() {
  const { t } = useLocale();
  const { dom, updateDomain, saved, mark, clear } = useDomainPage();
  const [alias, setAlias] = useState('');
  const [to, setTo] = useState('');

  if (!dom) return <Navigate to="/account/domains" replace />;
  const rules = dom.forwarding;

  return (
    <DomainPage dom={dom} sectionKey="dom.forwarding">
      <SavedNote saved={saved} onDismiss={clear} />
      <p className="card__body u-mb-16">{t('dom.forwardingLede')}</p>

      {!dom.emailForwarding && (
        <div className="notice notice--spaced u-mb-16">
          <IconInfo size={20} />
          <div>
            <p className="card__body">{t('dom.forwardOff')}</p>
            <Link className="btn btn--sm btn--secondary u-mt-16" to={`/account/domains/${dom.id}/addons`}>
              {t('dom.addons')}
            </Link>
          </div>
        </div>
      )}

      {rules.length > 0 ? (
        <section className="card card--flush">
          <header className="card__head card__head--flush">
            <h2 className="card__heading">{t('dom.forwarding')}</h2>
          </header>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">{t('dom.alias')}</th>
                  <th scope="col">{t('dom.forwardTo')}</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td className="serial">
                      <span className="lead">
                        <bdi>
                          {r.alias}@{dom.name}
                        </bdi>
                      </span>
                    </td>
                    <td className="serial"><bdi>{r.to}</bdi></td>
                    <td className="num">
                      <Button
                        size="sm"
                        variant="danger"
                        aria-label={`${t('action.remove')} ${r.alias}`}
                        onClick={() => {
                          updateDomain(dom.id, { forwarding: rules.filter((x) => x.id !== r.id) });
                          mark();
                        }}
                      >
                        <IconTrash size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="card empty">
          <IconMail size={28} />
          <p className="empty__title">{t('dom.forwardNone')}</p>
          <p className="empty__note">{t('dom.forwardNoneNote')}</p>
        </div>
      )}

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!alias.trim() || !to.trim()) return;
          updateDomain(dom.id, {
            forwarding: [
              ...rules,
              { id: `f-${Date.now()}`, alias: alias.trim().toLowerCase(), to: to.trim() },
            ],
          });
          setAlias('');
          setTo('');
          mark();
        }}
      >
        <header className="card__head">
          <h2 className="card__heading">{t('dom.forwardAdd')}</h2>
        </header>
        <div className="form">
          <div className="field-grid">
            <label className="field-label">
              <span className="eyebrow">{t('dom.alias')}</span>
              <span className="copy-row">
                <input
                  className="field serial"
                  dir="ltr"
                  placeholder="hello"
                  required
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                />
                <span className="field-affix serial">
                  <bdi>@{dom.name}</bdi>
                </span>
              </span>
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('dom.forwardTo')}</span>
              <input
                className="field serial"
                type="email"
                dir="ltr"
                required
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <div className="form__foot">
            <Button type="submit" size="md">
              <IconPlus size={15} />
              {t('dom.forwardAdd')}
            </Button>
          </div>
        </div>
      </form>
    </DomainPage>
  );
}

/* ── transfer out — C-13 ────────────────────────────────────────────────────── */

export function DomainTransferOut() {
  const { t } = useLocale();
  const { dom, updateDomain, saved, mark, clear } = useDomainPage();
  const [epp, setEpp] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!dom) return <Navigate to="/account/domains" replace />;
  const lock = dom.registrarLock;

  return (
    <DomainPage dom={dom} sectionKey="dom.transferOut">
      <SavedNote saved={saved} onDismiss={clear} />

      <section className="card">
        <header className="card__head">
          <h2 className="card__heading">{t('dom.transferOut')}</h2>
        </header>
        <p className="card__body">{t('dom.transferOutLede')}</p>

        <div className="form u-mt-16">
          <label className="switch-row">
            <span>
              <span className="switch-row__label">{t('dom.lock')}</span>
              <span className="switch-row__note">{t('dom.lockNote')}</span>
            </span>
            <input
              type="checkbox"
              name="lock"
              checked={lock}
              onChange={(e) => {
                updateDomain(dom.id, { registrarLock: e.target.checked });
                if (e.target.checked) setEpp(false);
                mark();
              }}
            />
          </label>

          {/* Transfer out is only possible with the lock off, so the state is explained
              right here rather than left as a button that silently refuses. */}
          <div className="acts__sep">
            <Button size="md" variant="danger" disabled={lock} onClick={() => setEpp(true)}>
              {t('dom.eppRequest')}
            </Button>
            {lock && <p className="form__note">{t('dom.lockedNote')}</p>}

            {/* Transferring out means handing the EPP code to the gaining registrar, so the
                code is what the button produces. Refusing to show it is how registrars make
                leaving hard, and this product is claiming not to do that. */}
            {epp && !lock && (
              <div className="u-mt-16">
                <p className="ref__label">{t('dom.epp')}</p>
                <p className="ref__code serial">
                  <bdi>{dom.eppCode}</bdi>
                </p>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(dom.eppCode).then(
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
                <p className="form__note">{t('dom.eppNote')}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </DomainPage>
  );
}
