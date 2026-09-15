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
import { CPANEL_APPS } from '../lib/account';
import { APP_ICON } from '../components/ServiceUsage';

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
                {/* A 404 is reached signed-out at least as often as signed-in, so the exit
                    is a public page rather than a client-area screen. */}
                <Link className="btn btn--md btn--secondary" to="/contact">
                  {t('ct.title')}
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
                {/* 403 means the account cannot reach this — sending it to a client-area
                    form would land on the same wall. */}
                <Link className="btn btn--md btn--secondary" to="/contact">
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
 * cPanel transition — S-03, and a page for each of the panel's tools.
 *
 * cPanel is entirely outside our control: different typeface, different density, English-only
 * in places, and left-to-right whatever the reader's language. Dropping someone into it with
 * no warning is the moment the product stops feeling like one product.
 *
 * So this screen does the one useful thing available: it says what is about to change, and
 * how to get back. It is a half-second interstitial, not a wall.
 *
 * Named with a tool — /cpanel/files — it is that tool's page rather than one page that ten
 * shortcuts all arrive at. The shortcut lists on the dashboard and the service page are ten
 * links each, and ten links landing on the same screen under the same heading are, to the
 * reader, one link drawn ten times. So the tool's name is the heading, its glyph is the mark,
 * and the line under it says what the tool is for — the last chance to catch somebody who is
 * about to open the wrong one. cPanel still draws the tool itself; that part is not ours.
 */
export function CpanelTransition() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const { app: named } = useParams<{ app: string }>();
  const [going, setGoing] = useState(false);
  const domain = params.get('domain') ?? 'atelier-kamal.com';
  /* The path names the tool. The query still does too, for any link made before it did. */
  const app = CPANEL_APPS.find((a) => a.id === (named ?? params.get('app')));

  return (
    <Layout>
      <section className="section shell">
        <div className="stage">
          <span className="stage__mark" aria-hidden="true">
            {app?.id && APP_ICON[app.id] ? APP_ICON[app.id](28) : <IconServer size={28} />}
          </span>
          <h1 className="stage__title">{app ? t(app.labelKey as never) : t('sso.title')}</h1>
          <p className="stage__body">{app ? t(app.noteKey as never) : t('sso.body')}</p>

          <p className="sso__domain serial">
            <bdi>{domain}</bdi>
          </p>

          {/* On a tool's page the heading is the tool, so the sentence about cPanel moves down
              here. It is the second thing to know, not the first. */}
          {app && (
            <p className="card__body">{t('sso.handoff')}</p>
          )}

          {/*
            Domains is the one name both panels use, and they mean different things by it.
            Somebody who came looking for the domain they renew with us is then one press from
            the right list rather than one trip through the wrong panel.
          */}
          {app?.id === 'domains' && (
            <p className="card__body">
              {t('cp.domainsElse')} <Link to="/account/domains">{t('cp.domainsElseLink')}</Link>
            </p>
          )}

          {/* Naming the differences in advance is what keeps them from reading as a fault. */}
          <ul className="sso__notes">
            <li>{t('sso.n1')}</li>
            <li>{t('sso.n2')}</li>
            <li>{t('sso.n3')}</li>
          </ul>

          {going ? (
            /* cPanel is not ours to draw, so the handoff ends at a marked slot rather than at
               an invented control panel. */
            <div className="slot slot--tall" role="group" aria-label={t('sso.slotLabel')}>
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
