import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { IconArrow, IconKey, IconCheck } from '../components/icons';
import { useLocale } from '../lib/locale';

/** The countries the spec's billing form offers, named from the string table like everything else. */
const COUNTRIES = ['EG', 'CH', 'SA', 'AE', 'KW'] as const;

/**
 * Authentication — spec section 8.
 *
 * All four screens share one narrow card so the flow between them feels continuous rather
 * than like four separate pages. Login carries the conditional 2FA field the spec describes:
 * it is a separate step here rather than a field that appears in place, because the code
 * arrives after the password is accepted, not alongside it.
 */
function AuthShell({
  title,
  lede,
  children,
  foot,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <Layout>
      <section className="section shell auth">
        <div className="auth__card">
          <h1 className="auth__title">{title}</h1>
          {lede && <p className="auth__lede">{lede}</p>}
          {children}
        </div>
        {foot && <p className="auth__foot">{foot}</p>}
      </section>
    </Layout>
  );
}

export function Login() {
  const { t } = useLocale();
  const navigate = useNavigate();

  return (
    <AuthShell
      title={t('auth.login')}
      lede={t('auth.loginLede')}
      foot={
        <>
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </>
      }
    >
      <form
        className="auth__form"
        onSubmit={(e) => {
          e.preventDefault();
          // The spec makes 2FA conditional on the account, so the password step hands off to
          // the code step rather than asking for both at once.
          navigate('/2fa');
        }}
      >
        <label className="field-label">
          <span className="eyebrow">{t('checkout.email')}</span>
          <input className="field" type="email" autoComplete="email" dir="ltr" required />
        </label>
        <label className="field-label">
          <span className="eyebrow">{t('auth.password')}</span>
          <input className="field" type="password" autoComplete="current-password" required />
        </label>

        <div className="auth__row">
          <label className="agree">
            <input type="checkbox" />
            <span>{t('auth.remember')}</span>
          </label>
          <Link to="/reset">{t('auth.forgot')}</Link>
        </div>

        <Button size="lg" type="submit">
          {t('auth.login')}
          <IconArrow size={17} />
        </Button>
      </form>

      <p className="auth__or">
        <span>{t('auth.or')}</span>
      </p>

      {/* Spec 8.1 lists Google sign-in as optional and still undecided (C20). */}
      <Button size="lg" variant="secondary" onClick={() => navigate('/2fa')}>
        {t('auth.google')}
      </Button>
    </AuthShell>
  );
}

export function Register() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <AuthShell
      title={t('auth.register')}
      lede={t('auth.registerLede')}
      foot={
        <>
          {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
        </>
      }
    >
      <form
        className="auth__form"
        onSubmit={(e) => {
          e.preventDefault();
          navigate('/account');
        }}
      >
        <div className="field-grid">
          <label className="field-label">
            <span className="eyebrow">{t('auth.firstName')}</span>
            <input className="field" type="text" autoComplete="given-name" required />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('auth.lastName')}</span>
            <input className="field" type="text" autoComplete="family-name" required />
          </label>
        </div>

        <label className="field-label">
          <span className="eyebrow">{t('checkout.email')}</span>
          <input className="field" type="email" autoComplete="email" dir="ltr" required />
        </label>
        <label className="field-label">
          <span className="eyebrow">{t('auth.password')}</span>
          <input className="field" type="password" autoComplete="new-password" required />
        </label>
        <label className="field-label">
          <span className="eyebrow">{t('checkout.phone')}</span>
          <input className="field" type="tel" autoComplete="tel" dir="ltr" required />
        </label>

        {/* Spec 8.2: WHMCS needs a billing address, so it is required at registration. */}
        <label className="field-label">
          <span className="eyebrow">{t('auth.address')}</span>
          <input className="field" type="text" autoComplete="street-address" required />
        </label>

        <div className="field-grid">
          <label className="field-label">
            <span className="eyebrow">{t('auth.city')}</span>
            <input className="field" type="text" autoComplete="address-level2" required />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('auth.postcode')}</span>
            <input className="field" type="text" autoComplete="postal-code" dir="ltr" required />
          </label>
          <label className="field-label">
            <span className="eyebrow">{t('checkout.country')}</span>
            <select className="field" defaultValue="EG">
              {COUNTRIES.map((c) => (
                <option value={c} key={c}>
                  {t(`country.${c.toLowerCase()}` as never)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="agree">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>{t('auth.agree')}</span>
        </label>

        <Button size="lg" type="submit" disabled={!agreed}>
          {t('auth.register')}
          <IconArrow size={17} />
        </Button>
      </form>
    </AuthShell>
  );
}

export function ResetPassword() {
  const { t } = useLocale();
  const [sent, setSent] = useState(false);

  return (
    <AuthShell
      title={t('auth.reset')}
      lede={t('auth.resetLede')}
      foot={<Link to="/login">{t('auth.login')}</Link>}
    >
      {sent ? (
        // Deliberately the same message whether or not the address exists, so the form cannot
        // be used to discover which addresses are registered.
        <p className="notice">
          <IconCheck size={20} />
          {t('auth.resetSent')}
        </p>
      ) : (
        <form
          className="auth__form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label className="field-label">
            <span className="eyebrow">{t('checkout.email')}</span>
            <input className="field" type="email" autoComplete="email" dir="ltr" required />
          </label>
          <Button size="lg" type="submit">
            {t('auth.resetSend')}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function TwoFactor() {
  const { t } = useLocale();
  const navigate = useNavigate();

  return (
    <AuthShell
      title={t('auth.twofa')}
      lede={t('auth.twofaLede')}
      foot={<Link to="/login">{t('action.back')}</Link>}
    >
      <form
        className="auth__form"
        onSubmit={(e) => {
          e.preventDefault();
          navigate('/account');
        }}
      >
        <label className="field-label">
          <span className="eyebrow">{t('auth.code')}</span>
          <input
            className="field code-field serial"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            dir="ltr"
            placeholder="000000"
            required
          />
        </label>
        <Button size="lg" type="submit">
          <IconKey size={17} />
          {t('auth.verify')}
        </Button>
      </form>
      <p className="auth__or">
        <span>{t('auth.backup')}</span>
      </p>
    </AuthShell>
  );
}
