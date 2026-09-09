import { useState } from 'react';
import { Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { IconArrow, IconCheck } from '../components/icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useCart, DOMAIN_ADDON_KEY, type DomainAddon } from '../lib/cart';
import { formatAmount } from '../lib/catalog';

const ADDONS: DomainAddon[] = ['dns', 'idprotect', 'forwarding'];

const NOTE_KEY: Record<DomainAddon, string> = {
  dns: 'domainsconf.dnsNote',
  idprotect: 'domainsconf.idNote',
  forwarding: 'domainsconf.forwardingNote',
};

/**
 * Domains configuration — spec 7, O-03.
 *
 * The step between choosing a domain and the cart, for the domains that are being registered
 * or transferred: three add-ons, all free, each a switch. A domain the person already owns
 * skips this screen, because there is nothing of ours to configure on it.
 *
 * Free is still a choice. WHMCS lists these as products with a price of zero, and the invoice
 * later shows them as lines — so what is switched on here is what the invoice will say.
 */
export function DomainAddons() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { lines, update } = useCart();
  const navigate = useNavigate();
  const { lineId } = useParams<{ lineId: string }>();

  const line = lines.find((l) => l.id === lineId);
  const [addons, setAddons] = useState<DomainAddon[]>(line?.domain?.addons ?? []);

  if (!line?.domain || (line.domain.action !== 'register' && line.domain.action !== 'transfer')) {
    return <Navigate to="/cart" replace />;
  }
  const domain = line.domain;

  const toggle = (a: DomainAddon, on: boolean) =>
    setAddons((prev) => (on ? [...prev.filter((x) => x !== a), a] : prev.filter((x) => x !== a)));

  return (
    <Layout>
      <section className="page-head shell">
        <h1 className="page-title">{t('domainsconf.title')}</h1>
        <p className="pair">
          <span className="pair__key">{t('nav.domains')}</span>
          <span className="pair__val serial">
            <bdi>{domain.name}</bdi>
          </span>
          <span className="tag tag--ok">
            <IconCheck size={13} />
            {t('domainsconf.hasHosting')}
          </span>
        </p>
      </section>

      <section className="section shell">
        <div className="panel panel--pad">
          <p className="card__body">{t('domainsconf.lede')}</p>
          <div className="form u-mt-16">
            {ADDONS.map((a) => (
              <label className="switch-row" key={a}>
                <span>
                  <span className="switch-row__label">{t(DOMAIN_ADDON_KEY[a] as never)}</span>
                  <span className="switch-row__note">
                    {t(NOTE_KEY[a] as never)} ·{' '}
                    <span className="serial">
                      {formatAmount(0, locale)} {currency}
                    </span>{' '}
                    / {t('domainsconf.perYear')}
                  </span>
                </span>
                <input
                  type="checkbox"
                  name={a}
                  checked={addons.includes(a)}
                  onChange={(e) => toggle(a, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="step-foot">
          <p className="step-foot__count">
            <span className="serial">{addons.length}</span> {t('domainstep.selectedCount')}
          </p>
          <span className="step-foot__acts">
            <Link className="btn btn--md btn--quiet" to={`/domain/${line.id}`}>
              {t('action.back')}
            </Link>
            <Button
              size="lg"
              onClick={() => {
                update(line.id, { domain: { ...domain, addons } });
                navigate('/cart');
              }}
            >
              {t('action.continue')}
              <IconArrow size={17} />
            </Button>
          </span>
        </div>
      </section>
    </Layout>
  );
}
