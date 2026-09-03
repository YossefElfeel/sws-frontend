import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatRow, type StatItem } from '../../components/Stat';
import { Tag } from '../../components/Tag';
import {
  IconCopy,
  IconPlus,
  IconCheck,
  IconKey,
  IconUsers,
  IconMegaphone,
  IconLink,
  IconGauge,
  IconShield,
  IconCoin,
  IconWallet,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { useSaved, SavedNote } from '../../lib/saved';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount } from '../../lib/catalog';
import {
  ANNOUNCEMENTS,
  AFFILIATE,
  ACCOUNT,
  CONTACTS,
  LOGIN_LOG,
  PERMISSIONS,
  TWOFA_SECRET,
  BACKUP_CODES,
  type Contact,
} from '../../lib/account';

/** Announcements — spec 9.1 and 5.4. */
export function Announcements() {
  const { t } = useLocale();

  return (
    <AccountLayout title={t('acc.news')}>
      {/* One announcement, one card — the same card the rest of the client area is built from.
          These used to be `.news__item--panel`, a marketing panel at 24px corners on a drop
          shadow, so this screen read as a page from a different product to the one beside it. */}
      <div className="cards">
        {ANNOUNCEMENTS.map((n) => (
          <Card heading={t(n.titleKey as never)} icon={<IconMegaphone size={17} />} key={n.id}>
            <p className="news__date serial">
              <bdi>{n.date}</bdi>
            </p>
            <p className="card__body">{t(n.bodyKey as never)}</p>
          </Card>
        ))}
      </div>
    </AccountLayout>
  );
}

/** Affiliates — spec 9.6: referral link, stats, withdrawal request. */
export function Affiliates() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [copied, setCopied] = useState(false);

  // The unit is a separate span, not part of the number: joined into one string it wraps to a
  // second line at this type size and makes two of the four tiles taller than the others.
  const stats: StatItem[] = [
    { label: t('aff.visits'), n: AFFILIATE.visits, icon: <IconGauge size={16} /> },
    { label: t('aff.signups'), n: AFFILIATE.signups, icon: <IconUsers size={16} /> },
    {
      label: t('aff.commission'),
      n: formatAmount(convert(AFFILIATE.commissionUsdMinor, currency), locale),
      unit: currency,
      icon: <IconCoin size={16} />,
    },
    {
      label: t('aff.balance'),
      n: formatAmount(convert(AFFILIATE.balanceUsdMinor, currency), locale),
      unit: currency,
      icon: <IconWallet size={16} />,
    },
  ];

  return (
    <AccountLayout
      title={t('acc.affiliates')}
      lede={t('aff.lede')}
      actions={
        <Link className="btn btn--md btn--primary" to="/account/affiliates/withdraw">
          {t('aff.withdraw')}
        </Link>
      }
    >
      {/* The same four-figure row the dashboard opens with. It used to be `.tiles` — the
          marketing tile, 24px corners on a drop shadow with the figure a step larger — so the
          two screens in the product that open with four counts opened differently. */}
      <StatRow items={stats} />

      <Card heading={t('aff.link')} icon={<IconLink size={17} />}>
        <div className="copy-row">
          <input className="field serial" dir="ltr" readOnly value={AFFILIATE.link} />
          <Button
            size="md"
            variant="secondary"
            onClick={() => {
              // Clipboard access can be refused, so the confirmation only shows on success.
              navigator.clipboard?.writeText(AFFILIATE.link).then(
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
        </div>
      </Card>
    </AccountLayout>
  );
}

/**
 * Account details and security — spec 9.7.
 *
 * Two-factor was a bare switch, which is the one shape this control must not have: flipping
 * it claimed the account was protected while nothing had been enrolled, and spec 8.1 relies
 * on the opposite — the login screen only asks for a code when the account really carries
 * one. So turning it on starts an enrolment that is not finished until a code from the app
 * has been accepted, and the backup codes appear once there is something to back up.
 *
 * The QR itself is a marked slot rather than a drawn square: the secret behind it is minted
 * by the server, and a plausible-looking fake QR is the kind of thing that gets approved in
 * review and then cannot be built.
 */
export function Security() {
  const { t, bi } = useLocale();
  const [twofa, setTwofa] = useState(ACCOUNT.twoFactor);
  const [enrolling, setEnrolling] = useState(false);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { saved, mark, clear } = useSaved();

  return (
    <AccountLayout title={t('acc.security')}>
      <SavedNote saved={saved} onDismiss={clear} />
      <div className="split">
        <Card heading={t('sec.details')} icon={<IconUsers size={17} />}>
          <div className="field-grid">
            <label className="field-label">
              <span className="eyebrow">{t('checkout.name')}</span>
              <input className="field" defaultValue={bi(ACCOUNT.name)} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('checkout.email')}</span>
              <input className="field" type="email" dir="ltr" defaultValue={ACCOUNT.email} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('checkout.phone')}</span>
              <input className="field" type="tel" dir="ltr" defaultValue={ACCOUNT.phone} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('auth.address')}</span>
              <input className="field" defaultValue={bi(ACCOUNT.address)} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('auth.city')}</span>
              <input className="field" defaultValue={bi(ACCOUNT.city)} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('auth.postcode')}</span>
              <input className="field serial" dir="ltr" defaultValue={ACCOUNT.postcode} />
            </label>
          </div>
          <div className="form__foot">
            <Button size="md" onClick={() => mark()}>{t('sec.save')}</Button>
          </div>
        </Card>

        <Card heading={t('sec.access')} icon={<IconShield size={17} />}>
          <div className="stack">
            <label className="field-label">
              <span className="eyebrow">{t('sec.newPassword')}</span>
              <input className="field" type="password" autoComplete="new-password" />
            </label>
            <Button size="md" variant="secondary" onClick={() => mark(t('sec.pwChanged'))}>
              <IconKey size={15} />
              {t('sec.changePassword')}
            </Button>

            <label className="switch-row">
              <span>
                <span className="switch-row__label">{t('auth.twofa')}</span>
                <span className="switch-row__note">
                  {t(twofa ? 'sec.twofaOnNote' : 'sec.twofaNote')}
                </span>
              </span>
              <input
                type="checkbox"
                checked={twofa || enrolling}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEnrolling(true);
                    return;
                  }
                  // Turning it off is a real reduction in protection, so it is stated rather
                  // than done silently.
                  setEnrolling(false);
                  setCode('');
                  if (twofa) {
                    setTwofa(false);
                    mark(t('sec.twofaOff'));
                  }
                }}
              />
            </label>

            {enrolling && !twofa && (
              <div className="enrol">
                <p className="card__body">{t('sec.twofaStep1')}</p>

                <div className="slot" role="img" aria-label={t('sec.qrLabel')}>
                  <span className="slot__tag">{t('sec.qrTag')}</span>
                  <p className="slot__note">{t('sec.qrNote')}</p>
                </div>

                <p className="card__body">{t('sec.twofaStep2')}</p>
                <div className="copy-row">
                  <input className="field serial" dir="ltr" readOnly value={TWOFA_SECRET} />
                  <Button
                    size="md"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard?.writeText(TWOFA_SECRET).then(
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
                </div>

                <label className="field-label">
                  <span className="eyebrow">{t('sec.twofaStep3')}</span>
                  <input
                    className="field serial"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </label>

                <div className="form__foot">
                  <Button
                    size="md"
                    variant="quiet"
                    onClick={() => {
                      setEnrolling(false);
                      setCode('');
                    }}
                  >
                    {t('tkt.cancel')}
                  </Button>
                  {/* Six digits or it is not a code. Enabling the button earlier only moves
                      the refusal one screen later. */}
                  <Button
                    size="md"
                    disabled={code.length < 6}
                    onClick={() => {
                      setTwofa(true);
                      setEnrolling(false);
                      setCode('');
                      mark(t('sec.twofaOn'));
                    }}
                  >
                    {t('sec.twofaConfirm')}
                  </Button>
                </div>
              </div>
            )}

            {twofa && (
              <div className="enrol">
                <h3 className="enrol__heading">{t('sec.backup')}</h3>
                <p className="card__body">{t('sec.backupNote')}</p>
                <ul className="codes">
                  {BACKUP_CODES.map((c) => (
                    <li className="serial" key={c}>
                      <bdi>{c}</bdi>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      <h2 className="app__section">{t('sec.log')}</h2>
      <div className="card card--flush table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">{t('account.date')}</th>
              <th scope="col">{t('sec.ip')}</th>
              <th scope="col">{t('sec.where')}</th>
              <th scope="col">{t('account.status')}</th>
            </tr>
          </thead>
          <tbody>
            {LOGIN_LOG.map((l) => (
              <tr key={l.id}>
                <td className="serial"><bdi>{l.at}</bdi></td>
                <td className="serial"><bdi>{l.ip}</bdi></td>
                <td>{bi(l.where)}</td>
                <td>
                  <Tag tone={l.ok ? 'ok' : 'bad'}>{t(l.ok ? 'sec.ok' : 'sec.failed')}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AccountLayout>
  );
}

/**
 * Contacts and sub-accounts — spec 9.7: each with specific permissions.
 *
 * "With specific permissions" is the whole feature, so the permissions have to be settable.
 * They were read-only tags with an Edit button that only raised a saved toast, and Add minted
 * a contact holding a permission that does not exist in the permission list at all — so the
 * one row a reviewer would create was the one row that rendered a raw key.
 *
 * Editing happens in the row rather than in a dialog, matching how cancellation and the
 * currency switch decide things here: the surrounding rows stay readable while one is being
 * changed, which is what makes "who can see my invoices" answerable at a glance.
 */
export function Contacts() {
  const { t, bi } = useLocale();
  const [rows, setRows] = useState<Contact[]>(CONTACTS);
  const [editing, setEditing] = useState<string | null>(null);
  const { saved, mark, clear } = useSaved();

  const toggle = (id: string, perm: string) =>
    setRows((all) =>
      all.map((c) =>
        c.id === id
          ? {
              ...c,
              permissions: c.permissions.includes(perm)
                ? c.permissions.filter((p) => p !== perm)
                : [...c.permissions, perm],
            }
          : c,
      ),
    );

  const add = () => {
    // A new contact starts with nothing granted and opens straight into its own permission
    // list, because choosing them is the reason for adding one.
    const id = `ct-new-${rows.length}`;
    setRows((all) => [
      ...all,
      {
        id,
        name: { ar: 'جهة جديدة', en: 'New contact' },
        email: 'new@atelier-kamal.com',
        permissions: [],
      },
    ]);
    setEditing(id);
  };

  return (
    <AccountLayout
      title={t('acc.contacts')}
      lede={t('con.lede')}
      actions={
        <Button size="md" variant="secondary" onClick={add}>
          <IconPlus size={15} />
          {t('con.add')}
        </Button>
      }
    >
      <SavedNote saved={saved} onDismiss={clear} />

      {/* One list, one card, hairline-ruled rows — the same shape as the saved cards on Payment
          methods. These were `.pm`: separate shadowed panels floating on the ground, so two
          screens doing the identical job (a list of saved things, each with edit and remove)
          were built out of two different components. */}
      {rows.length > 0 ? (
        <div className="card card--flush">
          {rows.map((c) => (
            <div className="contact" key={c.id}>
              <div className="method-row">
                <span className="method-row__name">{bi(c.name)}</span>
                <span className="method-row__exp serial">
                  <bdi>{c.email}</bdi>
                </span>
                <span className="perm-list">
                  {c.permissions.length > 0 ? (
                    c.permissions.map((p) => (
                      <Tag tone="neutral" key={p}>
                        {t(`perm.${p}` as never)}
                      </Tag>
                    ))
                  ) : (
                    /* A contact with nothing ticked can still sign in, so saying so is
                       kinder than an empty space that reads as "not loaded yet". */
                    <span className="hint">{t('con.noPerms')}</span>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-expanded={editing === c.id}
                  onClick={() => setEditing(editing === c.id ? null : c.id)}
                >
                  {t(editing === c.id ? 'con.done' : 'con.edit')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setRows((all) => all.filter((x) => x.id !== c.id));
                    if (editing === c.id) setEditing(null);
                  }}
                >
                  {t('action.remove')}
                </Button>
              </div>

              {editing === c.id && (
                <fieldset className="perm-edit">
                  <legend className="eyebrow">{t('con.perms')}</legend>
                  <div className="perm-edit__grid">
                    {PERMISSIONS.map((p) => (
                      <label className="perm-edit__row" key={p}>
                        <input
                          type="checkbox"
                          checked={c.permissions.includes(p)}
                          onChange={() => toggle(c.id, p)}
                        />
                        <span>
                          <span className="perm-edit__label">{t(`perm.${p}` as never)}</span>
                          <span className="perm-edit__note">{t(`perm.${p}.note` as never)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="form__foot">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        mark(t('con.edited'));
                      }}
                    >
                      {t('sec.save')}
                    </Button>
                  </div>
                </fieldset>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <IconUsers size={28} />
          <p className="empty__title">{t('con.none')}</p>
          <p className="empty__note">{t('con.lede')}</p>
        </div>
      )}

    </AccountLayout>
  );
}
