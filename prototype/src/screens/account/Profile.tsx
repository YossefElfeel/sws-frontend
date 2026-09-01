import { useState } from 'react';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconCopy, IconPlus, IconCheck, IconKey } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount } from '../../lib/catalog';
import { ANNOUNCEMENTS, AFFILIATE, ACCOUNT, CONTACTS, LOGIN_LOG } from '../../lib/account';

/** Announcements — spec 9.1 and 5.4. */
export function Announcements() {
  const { t } = useLocale();

  return (
    <AccountLayout title={t('acc.news')}>
      <ul className="news">
        {ANNOUNCEMENTS.map((n) => (
          <li className="news__item news__item--panel" key={n.id}>
            <p className="news__date serial">
              <bdi>{n.date}</bdi>
            </p>
            <h2 className="card__title">{t(n.titleKey as never)}</h2>
            <p className="card__body">{t(n.bodyKey as never)}</p>
          </li>
        ))}
      </ul>
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
  const stats = [
    { key: 'aff.visits', v: String(AFFILIATE.visits) },
    { key: 'aff.signups', v: String(AFFILIATE.signups) },
    {
      key: 'aff.commission',
      v: formatAmount(convert(AFFILIATE.commissionUsdMinor, currency), locale),
      unit: currency,
    },
    {
      key: 'aff.balance',
      v: formatAmount(convert(AFFILIATE.balanceUsdMinor, currency), locale),
      unit: currency,
    },
  ];

  return (
    <AccountLayout title={t('acc.affiliates')} lede={t('aff.lede')}>
      <div className="panel panel--pad">
        <h2 className="card__title">{t('aff.link')}</h2>
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
      </div>

      <ul className="tiles">
        {stats.map((s) => (
          <li key={s.key}>
            <span className="tile tile--static">
              <span className="tile__n serial">
                {s.v}
                {s.unit && <span className="tile__unit">{s.unit}</span>}
              </span>
              <span className="tile__label">{t(s.key as never)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="actions actions--split">
        <Button size="md" disabled={AFFILIATE.balanceUsdMinor === 0}>
          {t('aff.withdraw')}
        </Button>
      </div>
    </AccountLayout>
  );
}

/** Account details and security — spec 9.7. */
export function Security() {
  const { t, bi } = useLocale();
  const [twofa, setTwofa] = useState(ACCOUNT.twoFactor);

  return (
    <AccountLayout title={t('acc.security')}>
      <div className="split">
        <div className="panel panel--pad">
          <h2 className="card__title">{t('sec.details')}</h2>
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
          <div className="actions actions--split">
            <Button size="md">{t('sec.save')}</Button>
          </div>
        </div>

        <div className="panel panel--pad">
          <h2 className="card__title">{t('sec.access')}</h2>
          <div className="stack">
            <label className="field-label">
              <span className="eyebrow">{t('sec.newPassword')}</span>
              <input className="field" type="password" autoComplete="new-password" />
            </label>
            <Button size="md" variant="secondary">
              <IconKey size={15} />
              {t('sec.changePassword')}
            </Button>

            <label className="switch-row">
              <span>
                <span className="switch-row__label">{t('auth.twofa')}</span>
                <span className="switch-row__note">{t('sec.twofaNote')}</span>
              </span>
              <input type="checkbox" checked={twofa} onChange={(e) => setTwofa(e.target.checked)} />
            </label>
          </div>
        </div>
      </div>

      <h2 className="section__title section__title--sm">{t('sec.log')}</h2>
      <div className="panel table-scroll">
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
                  <span className={`tag tag--${l.ok ? 'ok' : 'due'}`}>
                    {t(l.ok ? 'sec.ok' : 'sec.failed')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AccountLayout>
  );
}

/** Contacts and sub-accounts — spec 9.7: each with specific permissions. */
export function Contacts() {
  const { t, bi } = useLocale();

  return (
    <AccountLayout title={t('acc.contacts')} lede={t('con.lede')}>
      <ul className="cards-list">
        {CONTACTS.map((c) => (
          <li className="pm" key={c.id}>
            <span className="pm__brand">{bi(c.name)}</span>
            <span className="pm__num serial">
              <bdi>{c.email}</bdi>
            </span>
            <span className="perm-list">
              {c.permissions.map((p) => (
                <span className="tag tag--taken" key={p}>
                  {t(`perm.${p}` as never)}
                </span>
              ))}
            </span>
            <Button size="sm" variant="secondary">
              {t('con.edit')}
            </Button>
            <Button size="sm" variant="quiet">
              {t('action.remove')}
            </Button>
          </li>
        ))}
      </ul>

      <div className="actions actions--split">
        <Button size="md" variant="secondary">
          <IconPlus size={15} />
          {t('con.add')}
        </Button>
      </div>
    </AccountLayout>
  );
}
