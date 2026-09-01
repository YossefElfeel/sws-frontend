import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { IconInfo } from '../components/icons';
import { useLocale } from '../lib/locale';

/**
 * Legal pages.
 *
 * The live site has none — no privacy policy, no terms, no SLA, no refund policy — while
 * selling into Switzerland and the EU. These routes exist so the compliance work has
 * somewhere to land, and each states plainly that its text is pending rather than carrying
 * invented policy language, which would be worse than an empty page.
 */
const PAGES = {
  privacy: 'footer.privacy',
  terms: 'footer.terms',
  sla: 'footer.sla',
  refund: 'footer.refund',
} as const;

export function Legal() {
  const { t } = useLocale();
  const { doc } = useParams<{ doc: string }>();
  const key = doc && doc in PAGES ? PAGES[doc as keyof typeof PAGES] : 'footer.terms';

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t(key)}</h1>
      </section>

      <section className="section shell">
        <div className="notice">
          <IconInfo size={22} />
          <p className="measure">{t('legal.pending')}</p>
        </div>

        <div className="pending-lines eyebrow">
          <span>{t('legal.processors')}</span>
          <span>{t('legal.counsel')}</span>
          <span>{t('legal.owner')}</span>
        </div>
      </section>
    </Layout>
  );
}
