import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Banner, type Severity } from '../components/Banner';
import {
  IconSearch,
  IconArrow,
  IconExternal,
  IconServer,
  IconSupport,
  IconAlert,
} from '../components/icons';
import { useLocale } from '../lib/locale';

/**
 * Error pages — S-01.
 *
 * One template, four states. What separates them is not the illustration but the answer to
 * "is this my fault, and what do I do now" — so each carries a different next action rather
 * than the same "go home" button under a different number.
 *
 * The status code is present but small. It matters to whoever you forward the page to; it is
 * not what the person reading it needs first.
 */
type ErrKind = '404' | '500' | '403' | 'maintenance';

const KINDS: Record<ErrKind, { code: string; sev: Severity }> = {
  '404': { code: '404', sev: 'info' },
  '500': { code: '500', sev: 'danger' },
  '403': { code: '403', sev: 'warning' },
  maintenance: { code: '503', sev: 'info' },
};

export function ErrorPage({ kind: fixed }: { kind?: ErrKind }) {
  const { t } = useLocale();
  const { kind: routed } = useParams<{ kind: string }>();
  const raw = fixed ?? routed ?? '404';
  const kind: ErrKind = (['404', '500', '403', 'maintenance'] as const).includes(raw as ErrKind)
    ? (raw as ErrKind)
    : '404';

  const meta = KINDS[kind];

  return (
    <Layout>
      <section className="section shell">
        <div className="stage">
          <p className="err__code serial">
            <bdi>{meta.code}</bdi>
          </p>
          <h1 className="stage__title">{t(`err.${kind}.title` as never)}</h1>
          <p className="stage__body">{t(`err.${kind}.body` as never)}</p>

          {/* Each state ends somewhere different, because the useful next move is different. */}
          <div className="acts u-mt-16">
            {kind === '404' && (
              <>
                <Link className="btn btn--lg btn--primary" to="/">
                  <IconSearch size={17} />
                  {t('err.404.act')}
                </Link>
                <Link className="btn btn--md btn--secondary" to="/account/knowledgebase">
                  {t('acc.kb')}
                </Link>
              </>
            )}

            {kind === '500' && (
              <>
                <Button size="lg" onClick={() => window.location.reload()}>
                  {t('err.500.act')}
                </Button>
                <Link className="btn btn--md btn--secondary" to="/status">
                  {t('status.title')}
                </Link>
              </>
            )}

            {kind === '403' && (
              <>
                <Link className="btn btn--lg btn--primary" to="/login">
                  {t('err.403.act')}
                </Link>
                <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
                  {t('fail.getHelp')}
                </Link>
              </>
            )}

            {kind === 'maintenance' && (
              <>
                <Link className="btn btn--lg btn--primary" to="/status">
                  {t('err.maintenance.act')}
                </Link>
                <Link className="btn btn--md btn--quiet" to="/">
                  {t('exp.home')}
                </Link>
              </>
            )}
          </div>

          {kind === '500' && <p className="hint u-mt-16">{t('err.500.note')}</p>}
        </div>
      </section>
    </Layout>
  );
}

/**
 * cPanel transition — S-03.
 *
 * cPanel is entirely outside our control: different typeface, different density, English-only
 * in places, and left-to-right whatever the reader's language. Dropping someone into it with
 * no warning is the moment the product stops feeling like one product.
 *
 * So this screen does the one useful thing available: it says what is about to change, and
 * how to get back. It is a half-second interstitial, not a wall.
 */
export function CpanelTransition() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const [going, setGoing] = useState(false);
  const domain = params.get('domain') ?? 'atelier-kamal.com';

  return (
    <Layout>
      <section className="section shell">
        <div className="stage">
          <span className="stage__mark" aria-hidden="true">
            <IconServer size={28} />
          </span>
          <h1 className="stage__title">{t('sso.title')}</h1>
          <p className="stage__body">{t('sso.body')}</p>

          <p className="sso__domain serial">
            <bdi>{domain}</bdi>
          </p>

          {/* Naming the differences in advance is what keeps them from reading as a fault. */}
          <ul className="sso__notes">
            <li>{t('sso.n1')}</li>
            <li>{t('sso.n2')}</li>
            <li>{t('sso.n3')}</li>
          </ul>

          {going ? (
            /* cPanel is not ours to draw, so the handoff ends at a marked slot rather than at
               an invented control panel. */
            <div className="slot slot--tall" role="img" aria-label={t('sso.slotLabel')}>
              <span className="slot__tag">{t('sso.slotTag')}</span>
              <p className="slot__note">{t('sso.slotNote')}</p>
            </div>
          ) : null}

          <div className="acts u-mt-16">
            <Button size="lg" disabled={going} onClick={() => setGoing(true)}>
              <IconExternal size={17} />
              {t(going ? 'sso.going' : 'sso.go')}
            </Button>
            <Link className="btn btn--md btn--quiet" to="/account/services">
              {t('action.back')}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

/**
 * The banner gallery — S-05.
 *
 * A shared component with four severities needs one place where all four are visible at once,
 * or the fourth one ships untested. This is that place, and it is also where the dismissable
 * and permanent variants are compared side by side.
 */
const SEVERITIES: Severity[] = ['info', 'success', 'warning', 'danger'];

export function BannerGallery() {
  const { t } = useLocale();
  const [gone, setGone] = useState<string[]>([]);

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t('sys.banners')}</h1>
        <p className="section__lede measure">{t('sys.bannersLede')}</p>
      </section>

      <section className="section shell">
        <div className="stack">
          {SEVERITIES.map((s) => (
            <Banner
              key={s}
              severity={s}
              title={t(`sys.b.${s}` as never)}
              onDismiss={gone.includes(s) ? undefined : () => setGone((g) => [...g, s])}
              action={
                s === 'danger' ? (
                  <Link className="btn btn--sm btn--secondary" to="/account/invoices">
                    {t('account.pay')}
                  </Link>
                ) : undefined
              }
            >
              {t(`sys.b.${s}Body` as never)}
            </Banner>
          ))}

          {/* A banner with no dismiss is not a broken banner — some notices are not yours to
              silence, and the component says so by not offering the button. */}
          <Banner severity="warning" title={t('sys.permanent')}>
            {t('sys.permanentBody')}
          </Banner>
        </div>

        <div className="notice notice--spaced">
          <IconAlert size={20} />
          <div>
            <h2 className="card__title">{t('sys.severityRule')}</h2>
            <p className="card__body">{t('sys.severityRuleBody')}</p>
          </div>
        </div>

        <div className="actions actions--split u-mt-16">
          <Link className="btn btn--md btn--secondary" to="/error/404">
            {t('sys.errors')}
          </Link>
          <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
            <IconSupport size={15} />
            {t('tkt.open')}
          </Link>
          <Link className="btn btn--md btn--secondary" to="/cpanel">
            {t('sso.title')}
            <IconArrow size={15} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
