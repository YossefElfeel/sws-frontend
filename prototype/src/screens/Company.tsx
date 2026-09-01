import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import {
  IconCheck,
  IconAlert,
  IconArrow,
  IconServer,
  IconShield,
  IconGlobe,
  IconSupport,
  IconBook,
  IconInfo,
} from '../components/icons';
import { useLocale } from '../lib/locale';
import {
  SYSTEMS,
  INCIDENTS,
  SITES,
  DC_FEATURES,
  POSTS,
  POST_CATEGORIES,
  CONTACT_CHANNELS,
  CONTACT_SUBJECTS,
  MIGRATION_PANELS,
  type SystemState,
} from '../lib/marketing';

/** A plain page: title, lede, then whatever the page is. No category rail. */
function Page({
  title,
  lede,
  crumbs,
  children,
}: {
  title: string;
  lede?: string;
  crumbs?: { label: string; to?: string }[];
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  return (
    <Layout>
      <section className="page-head shell">
        {crumbs && crumbs.length > 0 && (
          <nav className="crumbs" aria-label={t('a11y.breadcrumb')}>
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
                {i < crumbs.length - 1 && (
                  <span className="crumbs__sep" aria-hidden="true">
                    /
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {lede && <p className="section__lede measure">{lede}</p>}
      </section>
      <section className="section shell">{children}</section>
    </Layout>
  );
}

/* ── network status — M-16 ──────────────────────────────────────────────────── */

/*
 * Three tones, not two. Red is for an outage; a slow API and a scheduled maintenance window are
 * not outages, and painting them red is how a status page teaches people to ignore it.
 */
const STATE_TAG: Record<SystemState, string> = {
  operational: 'ok',
  degraded: 'warn',
  maintenance: 'taken',
  down: 'due',
};

/**
 * Network status — M-16.
 *
 * C19 — whether this is an external service or built in-house — is still open. That decision
 * is about where the data comes from, not what the page has to say, so the page is designed
 * against fixtures and the source is swappable.
 *
 * No uptime percentage appears anywhere. None has been verified, and a status page is the one
 * place where an invented "99.9%" is not marketing but a claim someone will hold you to.
 */
export function Status() {
  const { t } = useLocale();

  const worst = SYSTEMS.some((s) => s.state === 'down')
    ? 'down'
    : SYSTEMS.some((s) => s.state === 'degraded')
      ? 'degraded'
      : SYSTEMS.some((s) => s.state === 'maintenance')
        ? 'maintenance'
        : 'operational';

  return (
    <Page title={t('status.title')} lede={t('status.lede')}>
      {/* One line that answers the question the page was opened to ask. */}
      <div className={`headline headline--${STATE_TAG[worst]}`}>
        {worst === 'operational' ? <IconCheck size={26} /> : <IconAlert size={26} />}
        <div>
          <p className="headline__title">{t(`status.all.${worst}` as never)}</p>
          <p className="headline__note">{t('status.checked')}</p>
        </div>
      </div>

      <h2 className="section__title section__title--sm">{t('status.systems')}</h2>
      <ul className="sys">
        {SYSTEMS.map((s) => (
          <li className="sys__row" key={s.id}>
            <span className={`sys__dot sys__dot--${s.state}`} aria-hidden="true" />
            <span className="sys__name">{t(s.labelKey as never)}</span>
            <span className={`tag tag--${STATE_TAG[s.state]}`}>
              {t(`status.state.${s.state}` as never)}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="section__title section__title--sm">{t('status.history')}</h2>
      <ul className="incidents">
        {INCIDENTS.map((i) => (
          <li className="incident" key={i.id}>
            <div className="incident__head">
              <span className={`tag tag--${STATE_TAG[i.state]}`}>
                {t(`status.state.${i.state}` as never)}
              </span>
              <span className="incident__at serial">
                <bdi>{i.at}</bdi>
              </span>
              {i.minutes !== undefined && (
                <span className="incident__len">
                  <span className="serial">{i.minutes}</span> {t('status.minutes')}
                </span>
              )}
            </div>
            <h3 className="incident__title">{t(i.titleKey as never)}</h3>
            <p className="incident__body">{t(i.bodyKey as never)}</p>
          </li>
        ))}
      </ul>

      <div className="notice notice--spaced">
        <IconInfo size={20} />
        <div>
          <h2 className="card__title">{t('status.sub')}</h2>
          <p className="card__body">{t('status.subBody')}</p>
          <Link className="btn btn--md btn--secondary u-mt-16" to="/account/notifications">
            {t('notif.title')}
          </Link>
        </div>
      </div>
    </Page>
  );
}

/* ── about — M-17 ───────────────────────────────────────────────────────────── */

/**
 * About — M-17.
 *
 * PRODUCT.md is explicit that no proof metrics have been verified, so this page has no
 * customer count, no founding-year milestone wall and no testimonials. What it has is the
 * thing that is actually true and actually differentiating: Swiss infrastructure with Egyptian
 * support and pricing, stated as the offer rather than dressed as a legend.
 */
export function About() {
  const { t } = useLocale();

  const stands = [
    { icon: <IconServer size={22} />, k: 'ab.where', b: 'ab.whereBody' },
    { icon: <IconSupport size={22} />, k: 'ab.who', b: 'ab.whoBody' },
    { icon: <IconGlobe size={22} />, k: 'ab.how', b: 'ab.howBody' },
  ];

  return (
    <Page title={t('ab.title')} lede={t('ab.lede')}>
      <div className="prose measure">
        <p>{t('ab.p1')}</p>
        <p>{t('ab.p2')}</p>
      </div>

      <ul className="stands">
        {stands.map((s) => (
          <li className="stand" key={s.k}>
            <span className="stand__icon" aria-hidden="true">
              {s.icon}
            </span>
            <h2 className="stand__title">{t(s.k as never)}</h2>
            <p className="stand__body">{t(s.b as never)}</p>
          </li>
        ))}
      </ul>

      <div className="notice notice--spaced">
        <IconShield size={20} />
        <div>
          <h2 className="card__title">{t('ab.honest')}</h2>
          <p className="card__body">{t('ab.honestBody')}</p>
        </div>
      </div>

      <div className="actions actions--split u-mt-16">
        <Link className="btn btn--lg btn--primary" to="/hosting/shared">
          {t('hero.cta')}
          <IconArrow size={17} />
        </Link>
        <Link className="btn btn--lg btn--secondary" to="/contact">
          {t('ct.title')}
        </Link>
      </div>
    </Page>
  );
}

/* ── data centres — M-19 ────────────────────────────────────────────────────── */

/**
 * Data centres — M-19.
 *
 * The Swiss location is the positioning, so it is stated plainly. What is not stated is any
 * tier rating, certification or uptime figure: none has been verified, and a data-centre page
 * is exactly where an unverified certification does real damage.
 */
export function DataCentres() {
  const { t } = useLocale();

  return (
    <Page title={t('dc.title')} lede={t('dc.lede')}>
      <ul className="sites">
        {SITES.map((s) => (
          <li className={`site${s.primary ? ' site--primary' : ''}`} key={s.id}>
            <span className="site__code serial">{s.code}</span>
            <span className="site__where">
              <span className="site__city">{s.city}</span>
              <span className="site__country">{t(s.countryKey as never)}</span>
            </span>
            {s.primary && <span className="tag tag--ok">{t('dc.primary')}</span>}
          </li>
        ))}
      </ul>

      <ul className="stands">
        {DC_FEATURES.map((f) => (
          <li className="stand" key={f.id}>
            <h2 className="stand__title">{t(f.titleKey as never)}</h2>
            <p className="stand__body">{t(f.bodyKey as never)}</p>
          </li>
        ))}
      </ul>

      {/* The gap is marked rather than filled. A review that sees "—" asks the right question;
          a review that sees an invented tier rating does not. */}
      <div className="notice notice--spaced">
        <IconInfo size={20} />
        <div>
          <h2 className="card__title">{t('dc.pending')}</h2>
          <p className="card__body">{t('dc.pendingBody')}</p>
        </div>
      </div>
    </Page>
  );
}

/* ── contact — M-18 ─────────────────────────────────────────────────────────── */

/** Contact — M-18. The channels come before the form, because most people want one of them. */
export function Contact() {
  const { t } = useLocale();
  const [sent, setSent] = useState(false);

  return (
    <Page title={t('ct.title')} lede={t('ct.lede')}>
      <ul className="channels">
        {CONTACT_CHANNELS.map((c) => (
          <li key={c.id}>
            <Link className="channel" to={c.to}>
              <span className="channel__title">{t(c.titleKey as never)}</span>
              <span className="channel__body">{t(c.bodyKey as never)}</span>
              <IconArrow size={16} />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="section__title section__title--sm">{t('ct.orWrite')}</h2>

      {sent ? (
        <div className="panel panel--pad">
          <p className="calm">
            <IconCheck size={22} />
            <span>
              <strong>{t('ct.doneTitle')}</strong>
              <span className="calm__note">{t('ct.doneNote')}</span>
            </span>
          </p>
        </div>
      ) : (
        <form
          className="panel panel--pad"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div className="field-grid">
            <label className="field-label">
              <span className="eyebrow">{t('checkout.name')}</span>
              <input className="field" required />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('checkout.email')}</span>
              <input className="field" type="email" dir="ltr" required />
            </label>
          </div>
          <label className="field-label">
            <span className="eyebrow">{t('ct.subject')}</span>
            <select className="field" defaultValue={CONTACT_SUBJECTS[0]}>
              {CONTACT_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {t(s as never)}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('tkt.message')}</span>
            <textarea className="field" rows={5} required />
          </label>
          <div className="form__foot">
            <Button size="lg" type="submit">
              {t('tkt.send')}
            </Button>
            <p className="form__note">{t('ct.privacyNote')}</p>
          </div>
        </form>
      )}
    </Page>
  );
}

/* ── site migration — M-15 ──────────────────────────────────────────────────── */

/**
 * Site migration request — M-15.
 *
 * The footer already advertises a Transfer Sites department, so the request had a name before
 * it had a screen. What it asks for is only what a migration actually needs; anything else is
 * a field someone abandons the form over.
 */
export function Migration() {
  const { t } = useLocale();
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <Page title={t('mig.title')}>
        <div className="panel panel--pad">
          <p className="calm">
            <IconCheck size={22} />
            <span>
              <strong>{t('mig.doneTitle')}</strong>
              <span className="calm__note">{t('mig.doneNote')}</span>
            </span>
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title={t('mig.title')} lede={t('mig.lede')}>
      <div className="with-side">
        <div className="dash__main">
          <form
            className="panel panel--pad"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="field-grid">
              <label className="field-label">
                <span className="eyebrow">{t('domain.placeholder')}</span>
                <input className="field serial" dir="ltr" placeholder="example.com" required />
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('mig.currentHost')}</span>
                <input className="field" required />
              </label>
            </div>
            <label className="field-label">
              <span className="eyebrow">{t('mig.panel')}</span>
              <select className="field" defaultValue={MIGRATION_PANELS[0]}>
                {MIGRATION_PANELS.map((p) => (
                  <option key={p} value={p}>
                    {p === 'other' ? t('cancel.reason.other') : p}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('mig.size')}</span>
              <input className="field" placeholder={t('mig.sizeHint')} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('mig.notes')}</span>
              <textarea className="field" rows={4} />
            </label>
            <div className="form__foot">
              <Button size="lg" type="submit">
                {t('mig.send')}
              </Button>
            </div>
          </form>
        </div>

        <div className="dash__side">
          <div className="panel panel--pad">
            <h2 className="card__title">{t('mig.how')}</h2>
            <ol className="steps">
              <li className="steps__item steps__item--done">
                <span className="steps__what">{t('mig.s1')}</span>
              </li>
              <li className="steps__item">
                <span className="steps__what">{t('mig.s2')}</span>
              </li>
              <li className="steps__item">
                <span className="steps__what">{t('mig.s3')}</span>
              </li>
            </ol>
            <p className="hint">{t('mig.downtime')}</p>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ── learning centre — M-21 ─────────────────────────────────────────────────── */

/** Blog index — M-21. */
export function Learn() {
  const { t } = useLocale();
  const [cat, setCat] = useState<(typeof POST_CATEGORIES)[number]>('all');

  const rows = POSTS.filter((p) => cat === 'all' || p.category === cat);

  return (
    <Page title={t('blog.title')} lede={t('blog.lede')}>
      <div className="bar">
        <div className="filters" role="group" aria-label={t('blog.topics')}>
          {POST_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`filters__btn${cat === c ? ' is-active' : ''}`}
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
            >
              {t(c === 'all' ? 'inv.all' : (`blog.cat.${c}` as never))}
            </button>
          ))}
        </div>
      </div>

      <ul className="posts">
        {rows.map((p) => (
          <li key={p.id}>
            <Link className="post" to={`/learn/${p.slug}`}>
              <span className="post__meta">
                <span className="eyebrow">{t(`blog.cat.${p.category}` as never)}</span>
                <span className="post__at serial">
                  <bdi>{p.date}</bdi>
                </span>
                <span className="post__len">
                  <span className="serial">{p.minutes}</span> {t('blog.min')}
                </span>
              </span>
              <span className="post__title">{t(p.titleKey as never)}</span>
              <span className="post__lede">{t(p.ledeKey as never)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

/** A single article — M-21. */
export function LearnPost() {
  const { t } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const post = POSTS.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/learn" replace />;

  const others = POSTS.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <Page
      title={t(post.titleKey as never)}
      crumbs={[
        { label: t('blog.title'), to: '/learn' },
        { label: t(`blog.cat.${post.category}` as never) },
      ]}
    >
      <div className="with-side">
        <div className="dash__main">
          <article className="panel panel--pad prose">
            <p className="post__meta">
              <span className="post__at serial">
                <bdi>{post.date}</bdi>
              </span>
              <span className="post__len">
                <span className="serial">{post.minutes}</span> {t('blog.min')}
              </span>
            </p>
            <p className="lede">{t(post.ledeKey as never)}</p>
            <p>{t(post.bodyKey as never)}</p>
          </article>
        </div>

        <div className="dash__side">
          <aside className="panel panel--pad">
            <h2 className="card__title">
              <IconBook size={17} />
              {t('blog.more')}
            </h2>
            <ul className="kb-side__list">
              {others.map((p) => (
                <li key={p.id}>
                  <Link to={`/learn/${p.slug}`}>{t(p.titleKey as never)}</Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </Page>
  );
}
