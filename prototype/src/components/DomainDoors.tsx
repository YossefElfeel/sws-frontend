import { Link, useLocation } from 'react-router-dom';
import { IconCheck } from './icons';
import { useLocale } from '../lib/locale';

/**
 * The three ways to arrive at a domain — spec 6.2, and the same three the order flow offers at
 * its domain step.
 *
 * It is one strip on the two pages that answer the question by staying inside it — the search
 * and the transfer form — rather than two pages that each begin differently. That is the whole
 * point of it: register and transfer are one question with two answers here, and a person who
 * picks the wrong one should be able to see the other and correct themselves without going
 * back. The strip stays put and the page under it changes, which is the same reason a tab bar
 * is a tab bar.
 *
 * They are links rather than tabs because the three answers already had three screens. A
 * selector would have meant rebuilding transfer inside the search page to hold its own third
 * state — two screens doing one job, which is what the rest of this codebase spends its comments
 * arguing against.
 *
 * The one you are on is a `<span>`, not a control. It carries the tick and `aria-current`, and
 * it does nothing when pressed because there is nothing left for it to do: you are there.
 */
const DOORS = [
  { to: '/domains', titleKey: 'domainstep.register', bodyKey: 'domainstep.registerBody' },
  { to: '/transfer', titleKey: 'domainstep.transfer', bodyKey: 'domainstep.transferBody' },
  /*
   * Owning a domain already is not a domain purchase — it is a hosting one, with the nameservers
   * pointed here afterwards. So the third door opens the plans.
   *
   * It is the one door that leads out of the strip. Shared hosting carried it briefly and does
   * not any more (product owner's call): a pricing page is not a third answer to "what do you
   * want to do with a domain", and three domain cards above four plan cards was two sets of
   * cards competing for the top of a page that has one job. So this door is a way out rather
   * than a way across, and nothing marks itself current at the other end.
   */
  { to: '/hosting/shared', titleKey: 'domainstep.own', bodyKey: 'domainstep.ownBody' },
] as const;

export function DomainDoors() {
  const { t } = useLocale();
  const { pathname } = useLocation();

  return (
    <>
      {/* The strip is three links with no visible heading; a screen reader still gets to hear
          what the three are for. */}
      <h2 className="u-visually-hidden">{t('domain.doors')}</h2>
      <ul className="choices choices--doors">
        {DOORS.map((door) => {
          const title = t(door.titleKey as never);
          const body = t(door.bodyKey as never);

          return (
            <li key={door.to}>
              {pathname === door.to ? (
                <span className="choice choice--door is-selected" aria-current="page">
                  <span className="choice__tick" aria-hidden="true">
                    <IconCheck size={13} />
                  </span>
                  <span className="choice__title">{title}</span>
                  <span className="choice__body">{body}</span>
                </span>
              ) : (
                <Link className="choice choice--door" to={door.to}>
                  <span className="choice__title">{title}</span>
                  <span className="choice__body">{body}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
