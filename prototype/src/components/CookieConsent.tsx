import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { useLocale } from '../lib/locale';

/**
 * Cookie consent — S-06.
 *
 * Required for the EU and Swiss markets, and the register asks for the most privacy-preserving
 * default. That is what this is: everything optional starts off, and nothing optional is set
 * until someone turns it on.
 *
 * The two things this deliberately does not do, both of which are illegal under GDPR and
 * nFADP and both of which are near-universal on hosting sites:
 *
 *   - Reject is exactly as prominent as Accept. A greyed-out "manage preferences" beside a
 *     bright "accept all" is a dark pattern with a legal name — consent obtained that way is
 *     not freely given.
 *   - There is no way to dismiss this without answering it. A close button that silently
 *     counts as consent is the other half of the same trick.
 *
 * The choice is remembered so it is asked once, and it survives a refusal to write storage.
 */
const KEY = 'sws.consent';

type Consent = { analytics: boolean; marketing: boolean };

function read(): Consent | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    // A browser refusing storage is a browser that has already answered the question.
    return null;
  }
}

function write(c: Consent) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* Nothing to do — the preference simply is not remembered. */
  }
}

export function CookieConsent() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (read() === null) setOpen(true);
  }, []);

  if (!open) return null;

  const decide = (c: Consent) => {
    write(c);
    setOpen(false);
  };

  return (
    <div
      className="consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
    >
      <div className="consent__inner shell">
        <div className="consent__text">
          <p className="consent__title" id="consent-title">
            {t('cc.title')}
          </p>
          <p className="consent__body">
            {t('cc.body')} <Link to="/legal/privacy">{t('footer.privacy')}</Link>
          </p>
        </div>

        {detail && (
          <div className="consent__rows">
            {/* Essential cookies are not a choice, and saying so is more honest than showing a
                switch that is on and locked with no explanation. */}
            <div className="consent__row">
              <span>
                <span className="consent__name">{t('cc.essential')}</span>
                <span className="consent__note">{t('cc.essentialNote')}</span>
              </span>
              <span className="tag tag--taken">{t('cc.always')}</span>
            </div>

            <label className="consent__row">
              <span>
                <span className="consent__name">{t('cc.analytics')}</span>
                <span className="consent__note">{t('cc.analyticsNote')}</span>
              </span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
            </label>

            <label className="consent__row">
              <span>
                <span className="consent__name">{t('cc.marketing')}</span>
                <span className="consent__note">{t('cc.marketingNote')}</span>
              </span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
            </label>
          </div>
        )}

        <div className="consent__acts">
          {/* Same size, same weight, same prominence. Refusing has to be as easy as agreeing. */}
          <Button
            size="md"
            variant="secondary"
            onClick={() => decide({ analytics: false, marketing: false })}
          >
            {t('cc.rejectAll')}
          </Button>

          {/* Both secondary, deliberately. A filled Accept beside an outlined Reject is the
              same dark pattern in a quieter register — the eye is still being pushed. */}
          {detail ? (
            <Button size="md" variant="secondary" onClick={() => decide({ analytics, marketing })}>
              {t('cc.saveChoice')}
            </Button>
          ) : (
            <Button
              size="md"
              variant="secondary"
              onClick={() => decide({ analytics: true, marketing: true })}
            >
              {t('cc.acceptAll')}
            </Button>
          )}

          <button type="button" className="consent__more" onClick={() => setDetail((v) => !v)}>
            {t(detail ? 'cc.less' : 'cc.choose')}
          </button>
        </div>
      </div>
    </div>
  );
}
