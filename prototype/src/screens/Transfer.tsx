import { HostingLayout } from '../components/HostingLayout';
import { Button } from '../components/Button';
import { IconCheck, IconArrow } from '../components/icons';
import { useLocale } from '../lib/locale';

/**
 * Transfer a domain in — spec 5.1.
 *
 * The three preconditions are stated before the form rather than after a failed submission,
 * because every one of them is set at the losing registrar and cannot be fixed from here.
 */
export function Transfer() {
  const { t } = useLocale();

  return (
    <HostingLayout title={t('transfer.title')} lede={t('transfer.lede')}>
      <div className="split">
        <form className="panel panel--pad" onSubmit={(e) => e.preventDefault()}>
          <label className="field-label">
            <span className="eyebrow">{t('domain.placeholder')}</span>
            <input className="field serial" dir="ltr" placeholder="example.com" required />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('transfer.epp')}</span>
            <input className="field serial" dir="ltr" required />
          </label>
          <div className="actions actions--split">
            <Button size="lg" type="submit">
              {t('transfer.start')}
              <IconArrow size={17} />
            </Button>
          </div>
        </form>

        <div className="panel panel--pad">
          <h2 className="card__title">{t('transfer.req')}</h2>
          <ul className="checklist">
            <li>
              <IconCheck size={16} />
              {t('transfer.req1')}
            </li>
            <li>
              <IconCheck size={16} />
              {t('transfer.req2')}
            </li>
            <li>
              <IconCheck size={16} />
              {t('transfer.req3')}
            </li>
          </ul>
        </div>
      </div>
    </HostingLayout>
  );
}
