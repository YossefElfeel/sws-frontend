import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ArtHosting } from '../components/illustrations';
import { PlanCards } from '../components/PlanCards';
import { Button } from '../components/Button';
import { IconSpark, IconShield, IconSupport, IconServer, IconGauge } from '../components/icons';
import { useLocale } from '../lib/locale';

/**
 * Homepage.
 *
 * There is no statistics band. The live site publishes "1+ Million Active Websites" and
 * "500K Global Servers" with no documented source, and half a million servers is not
 * plausible for a company selling four shared-hosting plans. Nothing here replaces those
 * numbers with invented ones either: the page earns attention on what it can actually show —
 * the plans, the prices, and the renewal figure stated up front.
 */
export function Home() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const features = [
    { icon: <IconServer size={26} />, title: t('feat.infra.title'), body: t('feat.infra.body') },
    { icon: <IconSupport size={26} />, title: t('feat.support.title'), body: t('feat.support.body') },
    { icon: <IconShield size={26} />, title: t('feat.secure.title'), body: t('feat.secure.body') },
    { icon: <IconGauge size={26} />, title: t('feat.billing.title'), body: t('feat.billing.body') },
  ];

  return (
    <Layout>
      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="announce">
            <IconSpark size={17} />
            {t('hero.announce')}
          </p>

          <h1 className="hero__title" id="hero-title">
            {t('hero.title1')} <span className="hero__accent">{t('hero.title2')}</span>
          </h1>

          <p className="hero__lede measure">{t('hero.lede')}</p>

          <div className="hero__actions">
            <Button size="lg" onClick={() => navigate('/hosting')}>
              {t('hero.cta')}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/domains')}>
              {t('hero.cta2')}
            </Button>
          </div>
        </div>

        <ArtHosting className="hero__art" />
      </section>

      {/* A band: the ground changes, so the section reads as its own thing rather than as
          more of the hero. The band is full width and the content inside it is not, which is
          why this one section wraps a .shell instead of being one. */}
      <section className="section section--band" aria-labelledby="feat-title">
        <div className="shell">
          <div className="section__head">
            <div>
              <h2 className="section__title" id="feat-title">
                {t('feat.title')}
              </h2>
              <p className="section__lede measure">{t('feat.lede')}</p>
            </div>
          </div>

          <ul className="features">
            {features.map((f) => (
              <li className="card card--lifted" key={f.title}>
                <span className="card__tile" aria-hidden="true">
                  {f.icon}
                </span>
                <h3 className="card__title">{f.title}</h3>
                <p className="card__body">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section shell" id="pricing" aria-labelledby="price-title">
        <div className="section__head">
          <div>
            <h2 className="section__title" id="price-title">
              {t('hosting.title')}
            </h2>
            <p className="section__lede measure">{t('hosting.lede')}</p>
          </div>
        </div>

        <PlanCards />
      </section>
    </Layout>
  );
}
