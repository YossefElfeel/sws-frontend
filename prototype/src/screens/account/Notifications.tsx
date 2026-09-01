import { useState } from 'react';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconBell, IconMail, IconInfo } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { NOTIF_PREFS, ACCOUNT, type NotifPref } from '../../lib/account';

/**
 * Notification preferences (C-35, spec 9.7).
 *
 * A grid rather than a stack of switches: the question is not "do you want notifications" but
 * "which of these, on which channel", and a grid is the only shape where both axes are
 * visible at once.
 *
 * Billing notices cannot be turned off. That is stated on the row rather than shown as a
 * switch that silently refuses — a disabled control with no reason beside it reads as a bug.
 */
const CHANNELS = [
  { id: 'email', labelKey: 'notif.email', icon: <IconMail size={15} /> },
  { id: 'sms', labelKey: 'notif.sms', icon: <IconInfo size={15} /> },
  { id: 'inApp', labelKey: 'notif.inApp', icon: <IconBell size={15} /> },
] as const;

export function NotificationPrefs() {
  const { t } = useLocale();
  const [prefs, setPrefs] = useState<NotifPref[]>(NOTIF_PREFS);

  const toggle = (id: string, channel: 'email' | 'sms' | 'inApp') =>
    setPrefs((rows) =>
      rows.map((r) => (r.id === id && !r.required ? { ...r, [channel]: !r[channel] } : r)),
    );

  return (
    <AccountLayout title={t('notif.title')} lede={t('notif.lede')}>
      <div className="card card--flush table-scroll">
        <table className="data prefs">
          <thead>
            <tr>
              <th scope="col">{t('notif.about')}</th>
              {CHANNELS.map((c) => (
                <th scope="col" className="num" key={c.id}>
                  <span className="prefs__ch">
                    {c.icon}
                    {t(c.labelKey as never)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prefs.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="lead">{t(r.labelKey as never)}</span>
                  <span className="data__sub">
                    {t(r.noteKey as never)}
                    {r.required && <> — {t('notif.alwaysOn')}</>}
                  </span>
                </td>
                {CHANNELS.map((c) => (
                  <td className="num" key={c.id} data-ch={t(c.labelKey as never)}>
                    <label className="tick">
                      <span className="u-visually-hidden">
                        {t(r.labelKey as never)} — {t(c.labelKey as never)}
                      </span>
                      <input
                        type="checkbox"
                        checked={r[c.id]}
                        disabled={r.required}
                        onChange={() => toggle(r.id, c.id)}
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card u-mt-16">
        <header className="card__head">
          <h2 className="card__heading">{t('notif.where')}</h2>
        </header>
        <dl className="kv">
          <div>
            <dt>{t('checkout.email')}</dt>
            <dd className="serial">
              <bdi>{ACCOUNT.email}</bdi>
            </dd>
          </div>
          <div>
            <dt>{t('checkout.phone')}</dt>
            <dd className="serial">
              <bdi>{ACCOUNT.phone}</bdi>
            </dd>
          </div>
        </dl>
        <p className="form__note">{t('notif.whereNote')}</p>
        <div className="form__foot">
          <Button size="md">{t('sec.save')}</Button>
        </div>
      </section>
    </AccountLayout>
  );
}
