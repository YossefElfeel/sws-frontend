import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Modal } from './Modal';
import { Banner } from './Banner';
import { Tag } from './Tag';
import { IconGlobe, IconMail, IconShield, IconCheck, IconArrow } from './icons';
import { useLocale } from '../lib/locale';
import { usePrefs } from '../lib/prefs';
import { useSaved, SavedNote } from '../lib/saved';
import { useAccountState } from '../lib/accountState';
import { formatAmount } from '../lib/catalog';
import type { DomainRecord } from '../lib/account';

/**
 * The three add-ons a domain carries — identity protection, DNS, email forwarding — as cards.
 *
 * They are one component and not two because they are shown in two places: on the domain's own
 * Add-ons tab, scoped to the domain in the route, and on the hosting section's Add-ons page,
 * scoped to whichever domain the picker there is pointing at. Two copies of this would be two
 * definitions of what "turn it off" means, and they would not stay the same for long.
 *
 * What each card owes the reader is the same in both places: what the add-on is, whether it is
 * on, the way in to manage it, and the way to switch it off — with the switch-off saying what
 * it costs before it happens rather than after.
 */

interface Addon {
  key: 'id' | 'dns' | 'forwarding';
  titleKey: string;
  noteKey: string;
  icon: ReactNode;
  /** The field on the record this card is the state of. */
  on: (d: DomainRecord) => boolean;
  patch: (on: boolean) => Partial<DomainRecord>;
  /** The screen that manages it, under the domain. Privacy has none, which is why it is optional. */
  manage?: (base: string) => string;
  /** The dialog behind the switch-off: what it does, said before it is done. */
  offTitleKey: string;
  offLedeKey: string;
  /** Louder than a lede, for the one whose cost is somebody's personal data. */
  offWarnKey?: string;
  offWarnNoteKey?: string;
  onDoneKey: string;
  offDoneKey: string;
}

/*
 * Ordered the way the reference orders them: identity first, because it is the one that is
 * about the person rather than about the domain, then the two that have a screen behind them.
 */
const ADDONS: Addon[] = [
  {
    key: 'id',
    titleKey: 'domainsconf.id',
    noteKey: 'domainsconf.idNote',
    icon: <IconShield size={26} />,
    on: (d) => d.whoisPrivacy,
    patch: (on) => ({ whoisPrivacy: on }),
    /* Privacy has no screen of its own: it is a yes or a no, and the switch is all of it. The
       same switch sits in the Protection card on Overview and on Transfer out — see
       IdProtectionSwitch — under this card's name and behind this card's question. */
    offTitleKey: 'domaddon.idOffTitle',
    offLedeKey: 'domaddon.idOffLede',
    offWarnKey: 'domaddon.idOffWarn',
    offWarnNoteKey: 'domaddon.idOffWarnNote',
    onDoneKey: 'domaddon.idOn',
    offDoneKey: 'domaddon.idOff',
  },
  {
    key: 'dns',
    titleKey: 'domainsconf.dns',
    noteKey: 'domainsconf.dnsNote',
    icon: <IconGlobe size={26} />,
    on: (d) => d.dnsManagement,
    patch: (on) => ({ dnsManagement: on }),
    manage: (base) => `${base}/dns`,
    offTitleKey: 'domaddon.dnsOffTitle',
    offLedeKey: 'domaddon.dnsOffLede',
    onDoneKey: 'domaddon.dnsOn',
    offDoneKey: 'domaddon.dnsOff',
  },
  {
    key: 'forwarding',
    titleKey: 'domainsconf.forwarding',
    noteKey: 'domainsconf.forwardingNote',
    icon: <IconMail size={26} />,
    on: (d) => d.emailForwarding,
    patch: (on) => ({ emailForwarding: on }),
    manage: (base) => `${base}/forwarding`,
    offTitleKey: 'domaddon.fwdOffTitle',
    offLedeKey: 'domaddon.fwdOffLede',
    onDoneKey: 'domaddon.fwdOn',
    offDoneKey: 'domaddon.fwdOff',
  },
];

export function DomainAddonCards({ dom }: { dom: DomainRecord }) {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const { updateDomain } = useAccountState();
  const { saved, mark, clear } = useSaved();
  /* Which switch-off is being asked about. One dialog, not three: only one can be open. */
  const [asking, setAsking] = useState<Addon['key'] | null>(null);

  const base = `/account/domains/${dom.id}`;
  const pending = ADDONS.find((a) => a.key === asking);

  const set = (a: Addon, on: boolean) => {
    updateDomain(dom.id, a.patch(on));
    mark(t((on ? a.onDoneKey : a.offDoneKey) as never));
    setAsking(null);
  };

  return (
    <>
      {/* Named, because "Saved" on a page of three switches does not say which one moved. */}
      <SavedNote saved={saved} onDismiss={clear}>
        {t('domaddon.onDomain')}{' '}
        <span className="serial">
          <bdi>{dom.name}</bdi>
        </span>
      </SavedNote>

      {/*
        One card per add-on, because each is a thing you decide about on its own — what it is,
        what it costs, whether it is on, and the one or two ways in. As ruled rows they read as
        a table of settings; as cards they read as the three services they are, which is what
        the reference the product owner is working from shows.

        The three are one object: the same edges, the same inner padding, the heading and the
        glyph in the same place on each, and the button row pinned to the bottom of the card
        rather than to the end of a description that is a different length in every one.
      */}
      <div className="addon-cards">
        {ADDONS.map((a) => {
          const on = a.on(dom);
          return (
            <article className="card addon-card" key={a.key}>
              <span className="addon-card__icon" aria-hidden="true">
                {a.icon}
              </span>
              <h2 className="addon-card__name">{t(a.titleKey as never)}</h2>
              <p className="addon-card__note">{t(a.noteKey as never)}</p>
              <p className="addon-card__price serial">
                {formatAmount(0, locale)} {currency} / {t('domainsconf.perYear')}
              </p>

              {/* The state sits with the buttons it is the state of, above the row it labels. */}
              <p className="addon-card__state">
                {on ? (
                  <Tag tone="ok">
                    <IconCheck size={13} />
                    {t('dom.enabled')}
                  </Tag>
                ) : (
                  <Tag tone="neutral">{t('dom.disabled')}</Tag>
                )}
              </p>

              <div className="addon-card__acts">
                {a.manage && (
                  /*
                   * Reachable whether the add-on is on or off. Off, the screen behind it is what
                   * explains the thing well enough to decide — the DNS records this domain would
                   * carry, the forwards it would honour — and a button that vanishes with the
                   * switch leaves somebody deciding from one sentence.
                   */
                  <Link className="btn btn--md btn--primary" to={a.manage(base)}>
                    {t('svc.manage')}
                    <IconArrow size={15} />
                  </Link>
                )}
                {/*
                  Managing leads, switching off follows. Somebody opening this tab is far more
                  often here to change a record than to turn the add-on off, and the reference
                  orders them the same way.

                  Off asks first and on does not, which is the asymmetry the two acts deserve:
                  switching one on changes nothing anybody has to be warned about, and a
                  confirmation in front of a harmless act only teaches people to press through
                  confirmations. Switching one off publishes a home address, stops answering for
                  a zone, or stops delivering mail.
                */}
                <Button
                  size="md"
                  variant={on ? 'danger' : 'primary'}
                  onClick={() => (on ? setAsking(a.key) : set(a, true))}
                >
                  {t(on ? 'dom.disable' : 'dom.enable')}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {pending && (
        <AddonOffDialog
          addon={pending}
          dom={dom}
          onConfirm={() => set(pending, false)}
          onClose={() => setAsking(null)}
        />
      )}
    </>
  );
}

/**
 * The question in front of a switch-off, apart from the cards so it can be asked wherever the
 * switch is. A warning that one page gave and two others skipped would still publish somebody's
 * home address from two places out of three.
 */
function AddonOffDialog({
  addon,
  dom,
  onConfirm,
  onClose,
}: {
  addon: Addon;
  dom: DomainRecord;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useLocale();

  return (
    <Modal
      open
      onClose={onClose}
      title={t(addon.offTitleKey as never)}
      lede={t(addon.offLedeKey as never)}
      footer={
        <>
          <Button size="md" variant="danger" onClick={onConfirm}>
            {t('dom.disable')}
          </Button>
          <Button size="md" variant="quiet" onClick={onClose}>
            {t('action.cancel')}
          </Button>
        </>
      }
    >
      {/* The domain, in the dialog, because the hosting page's picker means the one being
          switched off is not necessarily the one the reader last looked at. */}
      <p className="card__body">
        {t('domaddon.onDomain')} <span className="serial"><bdi>{dom.name}</bdi></span>
      </p>
      {addon.offWarnKey && (
        <Banner severity="warning" title={t(addon.offWarnKey as never)}>
          {t(addon.offWarnNoteKey as never)}
        </Banner>
      )}
    </Modal>
  );
}

/**
 * ID Protection as a switch row, for the Protection cards on a domain's Overview and Transfer
 * out pages. It is the add-on on the card above, so it carries the card's name and note rather
 * than a second name for the same setting, and it asks the card's question before it goes off.
 * On still does not ask, for the reason the cards give.
 */
export function IdProtectionSwitch({
  dom,
  flip,
}: {
  dom: DomainRecord;
  flip: (patch: Partial<DomainRecord>) => void;
}) {
  const { t } = useLocale();
  const [asking, setAsking] = useState(false);
  const id = ADDONS.find((a) => a.key === 'id')!;

  return (
    <>
      <label className="switch-row">
        <span>
          <span className="switch-row__label">{t(id.titleKey as never)}</span>
          <span className="switch-row__note">{t(id.noteKey as never)}</span>
        </span>
        {/* Controlled by the record, so a switch-off that is asked about and then cancelled
            stays on without being put back. */}
        <input
          type="checkbox"
          name="privacy"
          checked={id.on(dom)}
          onChange={(e) => (e.target.checked ? flip(id.patch(true)) : setAsking(true))}
        />
      </label>
      {asking && (
        <AddonOffDialog
          addon={id}
          dom={dom}
          onConfirm={() => {
            flip(id.patch(false));
            setAsking(false);
          }}
          onClose={() => setAsking(false)}
        />
      )}
    </>
  );
}
