import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArtSsl, ArtMail, ArtBuilder } from './illustrations';
import { IconClose, IconCart } from './icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { convert, formatAmount } from '../lib/catalog';
import { PROMOS } from '../lib/marketing';

/**
 * The house ads on the dashboard — one promo at a time, with a dot per promo.
 *
 * Three decisions worth stating, because all three are the opposite of what a promo rail
 * usually does:
 *
 *   It does not advance on its own. The screen above it answers one question — is there
 *   anything I have to do — and an ad that changes under the reader's eye while they are
 *   answering it takes attention from the one thing on the page that is actually owed. The
 *   dots are there to be pressed, not to report a timer.
 *
 *   It can be closed, and closing it means it. A dismiss that reappears on the next
 *   navigation is not a dismiss; this one is remembered for the session, which is as long as
 *   the prototype can honestly remember anything.
 *
 *   It is visibly an ad. Same card shape as everything else on the screen so the layout holds,
 *   but a tinted ground and a drawing, so nobody reads it as a notice about their own account.
 *   The one failure mode that matters here is a customer acting on an advertisement because
 *   they mistook it for a message from billing.
 */
const ART = { ssl: ArtSsl, mail: ArtMail, builder: ArtBuilder };

const KEY = 'sws.promo.closed';

/** Storage throws in a private window, and an ad is the last thing worth breaking a page for. */
function readClosed(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function writeClosed() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* Not remembered, and nothing else changes. */
  }
}

export function PromoRail() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [at, setAt] = useState(0);
  const [closed, setClosed] = useState(readClosed);

  if (closed || PROMOS.length === 0) return null;

  const promo = PROMOS[Math.min(at, PROMOS.length - 1)];
  const Art = ART[promo.art];

  return (
    <section className="promo" aria-label={t('promo.title')}>
      <div className="promo__text">
        {/* The dots sit above the headline rather than under the card, so the control that
            changes the text is next to the text it changes. */}
        {PROMOS.length > 1 && (
          <div className="promo__dots">
            {PROMOS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`promo__dot${i === at ? ' promo__dot--on' : ''}`}
                aria-label={`${t('promo.show')} ${i + 1}`}
                aria-current={i === at}
                onClick={() => setAt(i)}
              />
            ))}
          </div>
        )}

        <h2 className="promo__title">{t(promo.titleKey as never)}</h2>
        <p className="promo__body">{t(promo.bodyKey as never)}</p>

        <div className="promo__foot">
          <Link className="btn btn--md btn--primary" to={promo.to}>
            <IconCart size={15} />
            {t('promo.cta')}
          </Link>
          <p className="promo__price">
            {t('promo.from')}{' '}
            <span className="serial">
              {formatAmount(convert(promo.fromUsdMinor, currency), locale)} {currency}
            </span>{' '}
            / {t('cycle.perMonth')}
          </p>
        </div>
      </div>

      <div className="promo__art" aria-hidden="true">
        <Art />
      </div>

      <button
        type="button"
        className="promo__close"
        onClick={() => {
          setClosed(true);
          writeClosed();
        }}
        aria-label={t('sys.dismiss')}
      >
        <IconClose size={16} />
      </button>
    </section>
  );
}
