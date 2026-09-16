import { useState, useRef, useEffect, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { ConfirmButton } from '../../components/ConfirmButton';
import { Card } from '../../components/Card';
import { StatRow, type StatItem } from '../../components/Stat';
import { Tag } from '../../components/Tag';
import { TableToolbar, TableFilter, TableCount, matches } from '../../components/TableToolbar';
import {
  IconCopy,
  IconPlus,
  IconCheck,
  IconKey,
  IconUsers,
  IconMegaphone,
  IconLink,
  IconGauge,
  IconShield,
  IconCoin,
  IconWallet,
} from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { useSaved, useDirty, SavedNote } from '../../lib/saved';
import { usePrefs } from '../../lib/prefs';
import { convert, formatAmount } from '../../lib/catalog';
import {
  ANNOUNCEMENTS,
  AFFILIATE,
  ACCOUNT,
  CONTACTS,
  LOGIN_LOG,
  PERMISSIONS,
  TWOFA_SECRET,
  BACKUP_CODES,
  type Contact,
} from '../../lib/account';

/** Announcements — spec 9.1 and 5.4. */
export function Announcements() {
  const { t } = useLocale();
  const [q, setQ] = useState('');

  // Announcements are read for one thing — a server name, a date, a payment method that
  // changed — so the body is searched alongside the headline.
  const rows = ANNOUNCEMENTS.filter((n) =>
    matches(q, t(n.titleKey as never), t(n.bodyKey as never), n.date),
  );

  return (
    <AccountLayout title={t('acc.news')}>
      {/* No filter: two dates and four words of category would be a control with nothing to
          choose between. The search alone is the toolbar here. */}
      <TableToolbar
        value={q}
        onChange={setQ}
        label={t('search.news')}
      />

      {/* One announcement, one card — the same card the rest of the client area is built from.
          These used to be `.news__item--panel`, a marketing panel at 24px corners on a drop
          shadow, so this screen read as a page from a different product to the one beside it. */}
      {rows.length > 0 ? (
        <div className="cards">
          {rows.map((n) => (
            <Card heading={t(n.titleKey as never)} icon={<IconMegaphone size={17} />} key={n.id}>
              <p className="news__date serial">
                <bdi>{n.date}</bdi>
              </p>
              <p className="card__body">{t(n.bodyKey as never)}</p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <IconMegaphone size={28} />
          <p className="empty__title">{t('empty.news')}</p>
          <p className="empty__note">{t('empty.searchNote')}</p>
        </div>
      )}

      <TableCount shown={rows.length} total={ANNOUNCEMENTS.length} />
    </AccountLayout>
  );
}

/** Affiliates — spec 9.6: referral link, stats, withdrawal request. */
export function Affiliates() {
  const { t, locale } = useLocale();
  const { currency } = usePrefs();
  const [copied, setCopied] = useState(false);

  // The unit is a separate span, not part of the number: joined into one string it wraps to a
  // second line at this type size and makes two of the four tiles taller than the others.
  const stats: StatItem[] = [
    { label: t('aff.visits'), n: AFFILIATE.visits, icon: <IconGauge size={16} /> },
    { label: t('aff.signups'), n: AFFILIATE.signups, icon: <IconUsers size={16} /> },
    {
      label: t('aff.commission'),
      n: formatAmount(convert(AFFILIATE.commissionUsdMinor, currency), locale),
      unit: currency,
      icon: <IconCoin size={16} />,
    },
    {
      label: t('aff.balance'),
      n: formatAmount(convert(AFFILIATE.balanceUsdMinor, currency), locale),
      unit: currency,
      icon: <IconWallet size={16} />,
    },
  ];

  return (
    <AccountLayout
      title={t('acc.affiliates')}
      lede={t('aff.lede')}
      actions={
        <Link className="btn btn--md btn--primary" to="/account/affiliates/withdraw">
          {t('aff.withdraw')}
        </Link>
      }
    >
      {/* The same four-figure row the dashboard opens with. It used to be `.tiles` — the
          marketing tile, 24px corners on a drop shadow with the figure a step larger — so the
          two screens in the product that open with four counts opened differently. */}
      <StatRow items={stats} />

      <Card heading={t('aff.link')} icon={<IconLink size={17} />}>
        <div className="copy-row">
          {/* The Card heading says what this is, but a heading is not a label: read on its own
              the field announced only its value. */}
          <input
            className="field serial"
            dir="ltr"
            readOnly
            aria-label={t('aff.link')}
            value={AFFILIATE.link}
          />
          <Button
            size="md"
            variant="secondary"
            onClick={() => {
              // Clipboard access can be refused, so the confirmation only shows on success.
              navigator.clipboard?.writeText(AFFILIATE.link).then(
                () => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                },
                () => setCopied(false),
              );
            }}
          >
            {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
            {t(copied ? 'aff.copied' : 'aff.copy')}
          </Button>
        </div>
      </Card>
    </AccountLayout>
  );
}

/**
 * Account details and security — spec 9.7.
 *
 * Two-factor was a bare switch, which is the one shape this control must not have: flipping
 * it claimed the account was protected while nothing had been enrolled, and spec 8.1 relies
 * on the opposite — the login screen only asks for a code when the account really carries
 * one. So turning it on starts an enrolment that is not finished until a code from the app
 * has been accepted, and the backup codes appear once there is something to back up.
 *
 * The QR itself is a marked slot rather than a drawn square: the secret behind it is minted
 * by the server, and a plausible-looking fake QR is the kind of thing that gets approved in
 * review and then cannot be built.
 */
export function Security() {
  const { t, bi } = useLocale();
  const [twofa, setTwofa] = useState(ACCOUNT.twoFactor);
  const [enrolling, setEnrolling] = useState(false);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [logQ, setLogQ] = useState('');
  const [logResult, setLogResult] = useState<'all' | 'ok' | 'failed'>('all');
  const { saved, mark, clear } = useSaved();
  const details = useDirty<HTMLDivElement>();

  // This log is read for one reason — "was that me?" — so the filter that matters is the
  // failed attempts, and the search is an IP address someone is checking against their own.
  const logRows = LOGIN_LOG.filter(
    (l) =>
      (logResult === 'all' || (logResult === 'ok') === l.ok) &&
      matches(logQ, l.at, l.ip, l.where.ar, l.where.en),
  );

  return (
    <AccountLayout title={t('acc.security')}>
      <SavedNote saved={saved} onDismiss={clear} />
      <div className="split">
        <Card heading={t('sec.details')} icon={<IconUsers size={17} />}>
          <div className="field-grid" ref={details.ref}>
            <label className="field-label">
              <span className="eyebrow">{t('checkout.name')}</span>
              <input className="field" defaultValue={bi(ACCOUNT.name)} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('checkout.email')}</span>
              <input className="field" type="email" dir="ltr" defaultValue={ACCOUNT.email} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('checkout.phone')}</span>
              <input className="field" type="tel" dir="ltr" defaultValue={ACCOUNT.phone} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('auth.address')}</span>
              <input className="field" defaultValue={bi(ACCOUNT.address)} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('auth.city')}</span>
              <input className="field" defaultValue={bi(ACCOUNT.city)} />
            </label>
            <label className="field-label">
              <span className="eyebrow">{t('auth.postcode')}</span>
              <input className="field serial" dir="ltr" defaultValue={ACCOUNT.postcode} />
            </label>
          </div>
          <div className="form__foot">
            <Button
              size="md"
              disabled={!details.dirty}
              onClick={() => {
                mark();
                details.settle();
              }}
            >
              {t('sec.save')}
            </Button>
          </div>
        </Card>

        <Card heading={t('sec.access')} icon={<IconShield size={17} />}>
          <div className="stack">
            <label className="field-label">
              <span className="eyebrow">{t('sec.newPassword')}</span>
              <input className="field" type="password" autoComplete="new-password" />
            </label>
            <Button size="md" variant="secondary" onClick={() => mark(t('sec.pwChanged'))}>
              <IconKey size={15} />
              {t('sec.changePassword')}
            </Button>

            <label className="switch-row">
              <span>
                <span className="switch-row__label">{t('auth.twofa')}</span>
                <span className="switch-row__note">
                  {t(twofa ? 'sec.twofaOnNote' : 'sec.twofaNote')}
                </span>
              </span>
              <input
                type="checkbox"
                checked={twofa || enrolling}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEnrolling(true);
                    return;
                  }
                  // Turning it off is a real reduction in protection, so it is stated rather
                  // than done silently.
                  setEnrolling(false);
                  setCode('');
                  if (twofa) {
                    setTwofa(false);
                    mark(t('sec.twofaOff'));
                  }
                }}
              />
            </label>

            {enrolling && !twofa && (
              <div className="enrol">
                <p className="card__body">{t('sec.twofaStep1')}</p>

                <div className="slot" role="group" aria-label={t('sec.qrLabel')}>
                  <span className="slot__tag">{t('sec.qrTag')}</span>
                  <p className="slot__note">{t('sec.qrNote')}</p>
                </div>

                <p className="card__body">{t('sec.twofaStep2')}</p>
                <div className="copy-row">
                  <input
                    className="field serial"
                    dir="ltr"
                    readOnly
                    aria-label={t('sec.twofaStep2')}
                    value={TWOFA_SECRET}
                  />
                  <Button
                    size="md"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard?.writeText(TWOFA_SECRET).then(
                        () => {
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 2000);
                        },
                        () => setCopied(false),
                      );
                    }}
                  >
                    {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                    {t(copied ? 'aff.copied' : 'aff.copy')}
                  </Button>
                </div>

                <label className="field-label">
                  <span className="eyebrow">{t('sec.twofaStep3')}</span>
                  <input
                    className="field serial"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </label>

                <div className="form__foot">
                  <Button
                    size="md"
                    variant="quiet"
                    onClick={() => {
                      setEnrolling(false);
                      setCode('');
                    }}
                  >
                    {t('tkt.cancel')}
                  </Button>
                  {/* Six digits or it is not a code. Enabling the button earlier only moves
                      the refusal one screen later. */}
                  <Button
                    size="md"
                    disabled={code.length < 6}
                    onClick={() => {
                      setTwofa(true);
                      setEnrolling(false);
                      setCode('');
                      mark(t('sec.twofaOn'));
                    }}
                  >
                    {t('sec.twofaConfirm')}
                  </Button>
                </div>
              </div>
            )}

            {twofa && (
              <div className="enrol">
                <h3 className="enrol__heading">{t('sec.backup')}</h3>
                <p className="card__body">{t('sec.backupNote')}</p>
                <ul className="codes">
                  {BACKUP_CODES.map((c) => (
                    <li className="serial" key={c}>
                      <bdi>{c}</bdi>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      <h2 className="app__section">{t('sec.log')}</h2>
      <TableToolbar
        value={logQ}
        onChange={setLogQ}
        label={t('search.log')}
      >
        <TableFilter
          label={t('filter.result')}
          value={logResult}
          onChange={setLogResult}
          options={[
            { value: 'all' as const, label: t('filter.allResults') },
            { value: 'ok' as const, label: t('sec.ok') },
            { value: 'failed' as const, label: t('sec.failed') },
          ]}
        />
      </TableToolbar>
      <div className="card card--flush table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">{t('account.date')}</th>
              <th scope="col">{t('sec.ip')}</th>
              <th scope="col">{t('sec.where')}</th>
              <th scope="col">{t('account.status')}</th>
            </tr>
          </thead>
          <tbody>
            {logRows.map((l) => (
              <tr key={l.id}>
                <td className="serial"><bdi>{l.at}</bdi></td>
                <td className="serial"><bdi>{l.ip}</bdi></td>
                <td>{bi(l.where)}</td>
                <td>
                  <Tag tone={l.ok ? 'ok' : 'bad'}>{t(l.ok ? 'sec.ok' : 'sec.failed')}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logRows.length === 0 && (
          <div className="empty empty--inset">
            <p className="empty__title">{t(logQ.trim() ? 'empty.search' : 'empty.log')}</p>
            <p className="empty__note">{t(logQ.trim() ? 'empty.searchNote' : 'empty.filter')}</p>
          </div>
        )}
      </div>

      <TableCount shown={logRows.length} total={LOGIN_LOG.length} />
    </AccountLayout>
  );
}

/**
 * The monogram on a contact row: one letter from each of the first two words.
 *
 * Two Arabic letters set side by side join into a ligature and read as a word: منى
 * عبدالرحمن gives م and ع, which run together as مع — the preposition "with". A zero-width
 * non-joiner between them keeps each letter in its isolated form, so a monogram stays a
 * monogram. It changes nothing in Latin, where the letters never joined.
 *
 * The uppercasing is for the Latin half alone — a contact named "New contact" gives "Nc"
 * without it. Arabic script carries no case mapping at all, so the same call passes م and ط
 * through untouched rather than needing a branch that asks which language a name is in.
 */
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('\u200C');
}

/**
 * What a contact is, while it is being written: a name, the address it signs in with, and what
 * it is allowed to do.
 *
 * Held as a draft rather than written straight into the list, because both the add form and the
 * row editor need somewhere to keep a half-typed address — somewhere it can be abandoned. An
 * editor that writes through on every keystroke has no cancel; an Add that writes through on
 * the first click puts a person in the list who does not exist yet.
 */
interface Draft {
  name: string;
  email: string;
  permissions: string[];
}

const BLANK: Draft = { name: '', email: '', permissions: [] };

/**
 * A name, an @, and a dot in what comes after it.
 *
 * `type="email"` alone accepts `mona@atelier`, which is a real address on an office network
 * and is never the one someone meant to type here. The browser's own check is kept as well,
 * for the empty field and for the keyboard it raises on a phone.
 */
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** What is wrong with the address — the one field whose answer is not simply "blank". */
type Wrong = 'shape' | 'taken' | null;

/**
 * The questions a contact is made of, asked the same way whether one is being created or
 * changed.
 *
 * Two copies of this form would be two places for "Invoices" to drift apart, and the
 * permission switches are the screen's whole subject — spec 9.7 is "sub-accounts with specific
 * permissions", so choosing them is not a second step that happens after the person exists.
 */
function ContactFields({
  draft,
  onChange,
  wrong,
  nameRef,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  wrong: Wrong;
  nameRef?: RefObject<HTMLInputElement>;
}) {
  const { t } = useLocale();

  return (
    <>
      <div className="field-grid">
        <label className="field-label">
          <span className="eyebrow">{t('checkout.name')}</span>
          <input
            ref={nameRef}
            className="field"
            required
            autoComplete="off"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="field-label">
          <span className="eyebrow">{t('checkout.email')}</span>
          {/* `dir="ltr"`: an address is Latin whichever language the page is in, and left to
              the paragraph's direction its dot and its @ land at the wrong end as it is typed. */}
          <input
            className="field"
            type="email"
            dir="ltr"
            required
            autoComplete="off"
            aria-invalid={wrong ? true : undefined}
            value={draft.email}
            onChange={(e) => onChange({ ...draft, email: e.target.value })}
          />
        </label>
      </div>

      <fieldset className="perm-edit">
        <legend className="eyebrow perm-edit__legend">{t('con.perms')}</legend>
        {/* Switches, not bare platform checkboxes. Granting a permission is the same act as
            the registrar lock, auto-renew and two-factor switches elsewhere in the account —
            one label, one note, one thing turned on — and this was the only one of them still
            drawing the browser's box. */}
        <div className="perm-edit__grid">
          {PERMISSIONS.map((p) => (
            <label className="switch-row" key={p}>
              <span>
                <span className="switch-row__label">{t(`perm.${p}` as never)}</span>
                <span className="switch-row__note">{t(`perm.${p}.note` as never)}</span>
              </span>
              <input
                type="checkbox"
                checked={draft.permissions.includes(p)}
                onChange={() =>
                  onChange({
                    ...draft,
                    permissions: draft.permissions.includes(p)
                      ? draft.permissions.filter((x) => x !== p)
                      : [...draft.permissions, p],
                  })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

/**
 * Contacts and sub-accounts — spec 9.7: each with specific permissions.
 *
 * "With specific permissions" is the whole feature, so the permissions have to be settable —
 * and a contact is a person, so the person has to be settable too. Add used to mint a row
 * called "New contact" at new@atelier-kamal.com the instant it was pressed, and then offered
 * no way to say who that was: the name and the address were the two things on the row that
 * nothing on the screen could change. A reviewer who added a contact got a placeholder wearing
 * permissions they had chosen for someone else.
 *
 * So Add opens a form, and the list takes a row when that form is submitted. The editor holds
 * the name and the address beside the switches, and both are drafts — Save commits, Cancel
 * leaves the row as it was. The address is what a sub-account signs in with, so it is checked
 * for shape and for being free before either one is accepted.
 *
 * Editing happens in the row rather than in a dialog, matching how cancellation and the
 * currency switch decide things here: the surrounding rows stay readable while one is being
 * changed, which is what makes "who can see my invoices" answerable at a glance.
 */
export function Contacts() {
  const { t, bi } = useLocale();
  const [rows, setRows] = useState<Contact[]>(CONTACTS);
  const [q, setQ] = useState('');
  const [permFilter, setPermFilter] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [wrong, setWrong] = useState<Wrong>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  /*
   * Ids are React's keys here, so they have to be issued once and never again. `rows.length`
   * handed the same one out twice — add, remove, add, and the third row arrives wearing the
   * removed row's identity, which React reads as the row that was already there.
   */
  const made = useRef(0);
  const { saved, mark, clear } = useSaved();

  /* The form opens focused: it opened because someone asked for it, and the first thing it
     wants is the name they pressed the button to type. */
  useEffect(() => {
    if (adding) nameRef.current?.focus();
  }, [adding]);

  // "Who can see my invoices" is the question this screen exists to answer, so the permission
  // is the filter — a list narrowed to one permission is that question, answered.
  //
  // The row being edited stays in the list whatever the filter says. Its own editor is what
  // changes the permission the filter reads, so turning a switch off would otherwise close the
  // editor over it and take the unsaved name and address down with it.
  const shown = rows.filter(
    (c) =>
      c.id === editing ||
      ((permFilter === 'all' || c.permissions.includes(permFilter)) &&
        matches(q, c.name.ar, c.name.en, c.email)),
  );

  /**
   * The two ways an address can be refused. `self` is the row being edited, which is allowed
   * to keep the address it already holds — a contact is identified by its address, so every
   * other row's is taken.
   */
  const wrongWith = (d: Draft, self?: string): Wrong => {
    if (!emailOk(d.email)) return 'shape';
    const mail = d.email.trim().toLowerCase();
    return rows.some((c) => c.id !== self && c.email.toLowerCase() === mail) ? 'taken' : null;
  };

  /*
   * A name typed once is the same string in both languages, because a person's name is not
   * translated — the same reasoning a ticket reply is stored under.
   *
   * The seeded rows do carry a real pair, though: منى عبدالرحمن and Mona Abdelrahman. Saving an
   * editor that was opened in Arabic and left the name alone must not flatten the English half
   * that a reviewer cannot see from there, so an untouched name is kept rather than rewritten.
   */
  const named = (d: Draft, from?: Contact) =>
    from && d.name.trim() === bi(from.name)
      ? from.name
      : { ar: d.name.trim(), en: d.name.trim() };

  const openAdd = () => {
    setEditing(null);
    setWrong(null);
    setDraft(BLANK);
    setAdding(true);
    nameRef.current?.focus();
  };

  const openEdit = (c: Contact) => {
    setAdding(false);
    setWrong(null);
    setEditing(c.id);
    setDraft({ name: bi(c.name), email: c.email, permissions: [...c.permissions] });
  };

  const create = () => {
    const bad = wrongWith(draft);
    if (bad) {
      setWrong(bad);
      return;
    }
    // The toolbar is cleared with the row: a contact added while the list is narrowed to
    // "invoices", or to a search, would be added where it cannot be seen.
    setQ('');
    setPermFilter('all');
    setRows((all) => [
      ...all,
      {
        id: `ct-${made.current++}`,
        name: named(draft),
        email: draft.email.trim(),
        permissions: draft.permissions,
      },
    ]);
    setAdding(false);
    setDraft(BLANK);
    mark(t('con.added'));
  };

  const save = (c: Contact) => {
    const bad = wrongWith(draft, c.id);
    if (bad) {
      setWrong(bad);
      return;
    }
    setRows((all) =>
      all.map((x) =>
        x.id === c.id
          ? {
              ...x,
              name: named(draft, c),
              email: draft.email.trim(),
              permissions: draft.permissions,
            }
          : x,
      ),
    );
    setEditing(null);
    mark(t('con.edited'));
  };

  /* One draft and one message between the two forms: they are never open at the same time. A
     keystroke clears the complaint, because the complaint was about what was there before it. */
  const edit = (d: Draft) => {
    setDraft(d);
    setWrong(null);
  };

  const badNote = wrong && (
    <p className="hint hint--bad">{t(wrong === 'taken' ? 'con.mailTaken' : 'con.mailBad')}</p>
  );

  return (
    /*
     * `bare`: the shell's own title block is off, because this screen is one object and the
     * title belongs to it. See the frame head below.
     */
    <AccountLayout title={t('acc.contacts')} bare>
      <SavedNote saved={saved} onDismiss={clear} />

      <section className="frame">
        {/*
         * The title, what the thing is, and the one act the screen offers — inside the frame
         * that holds them. It used to sit on the page ground above a separate card, so the
         * screen read as a caption with an unrelated box under it, and the box opened with no
         * word for what it listed. Named from the inside, the frame is one object: this is the
         * contacts list, here is how to add to it, here it is.
         */}
        <header className="frame__head">
          <span className="frame__mark" aria-hidden="true">
            <IconUsers size={22} />
          </span>
          <div className="frame__text">
            <h1 className="frame__title">{t('acc.contacts')}</h1>
            <p className="frame__lede">{t('con.lede')}</p>
          </div>
          <div className="frame__actions">
            <Button size="md" onClick={openAdd}>
              <IconPlus size={15} />
              {t('con.add')}
            </Button>
          </div>
        </header>

        {/* A search over nothing is a control with nothing to narrow, so an account with no
            contacts yet gets the head and the invitation, not a toolbar. */}
        {rows.length > 0 && (
          <TableToolbar
            inset
            value={q}
            onChange={setQ}
            label={t('search.contacts')}
          >
            <TableFilter
              label={t('con.perms')}
              value={permFilter}
              onChange={setPermFilter}
              options={[
                { value: 'all', label: t('filter.allPermissions') },
                ...PERMISSIONS.map((p) => ({ value: p, label: t(`perm.${p}` as never) })),
              ]}
            />
          </TableToolbar>
        )}

        {/* The contact takes shape where it is going to live — above the list it is joining,
            inside the frame, rather than in a dialog laid over the list you are adding to. */}
        {adding && (
          <form
            className="contact-new"
            aria-label={t('con.new')}
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <h2 className="contact-new__title">{t('con.new')}</h2>
            <p className="contact-new__note">{t('con.newNote')}</p>
            <ContactFields draft={draft} onChange={edit} wrong={wrong} nameRef={nameRef} />
            {badNote}
            <div className="contact-edit__foot">
              <Button type="submit" size="md">
                {t('con.create')}
              </Button>
              <Button
                type="button"
                size="md"
                variant="quiet"
                onClick={() => {
                  setAdding(false);
                  setWrong(null);
                }}
              >
                {t('action.cancel')}
              </Button>
            </div>
          </form>
        )}

        {/* A list of people is a list, so it is a <ul>: its length is announced, and the rows
            are items rather than a run of anonymous divs. */}
        {shown.length > 0 && (
          <ul className="contacts">
            {shown.map((c) => (
              <li className={`contact${editing === c.id ? ' is-open' : ''}`} key={c.id}>
                <div className="contact__row">
                  {/* The initial is decoration over the name beside it, not information of its
                      own, so it is hidden rather than read out twice. */}
                  <span className="contact__avatar" aria-hidden="true">
                    {initials(bi(c.name))}
                  </span>
                  <span className="contact__id">
                    <span className="contact__name">{bi(c.name)}</span>
                    <span className="contact__mail serial">
                      <bdi>{c.email}</bdi>
                    </span>
                  </span>
                  <span className="perm-list">
                    {c.permissions.length > 0 ? (
                      c.permissions.map((p) => (
                        <Tag tone="neutral" key={p}>
                          {t(`perm.${p}` as never)}
                        </Tag>
                      ))
                    ) : (
                      /* A contact with nothing ticked can still sign in, so saying so is
                         kinder than an empty space that reads as "not loaded yet". */
                      <span className="contact__none">{t('con.noPerms')}</span>
                    )}
                  </span>
                  <span className="contact__acts">
                    {/* Cancel, not Done: the editor under this button holds a draft now, and
                        leaving by the button that opened it throws that draft away. "Done" is
                        the word for keeping it. */}
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-expanded={editing === c.id}
                      onClick={() => (editing === c.id ? setEditing(null) : openEdit(c))}
                    >
                      {t(editing === c.id ? 'action.cancel' : 'con.edit')}
                    </Button>
                    {/* `c.name` is a two-language pair, so this label read "Remove
                        [object Object]" — on the one control in the client area where knowing
                        which row you just armed is the whole point of the label. */}
                    <ConfirmButton
                      label={`${t('action.remove')} ${bi(c.name)}`}
                      onConfirm={() => {
                        setRows((all) => all.filter((x) => x.id !== c.id));
                        if (editing === c.id) setEditing(null);
                      }}
                    >
                      {t('action.remove')}
                    </ConfirmButton>
                  </span>
                </div>

                {editing === c.id && (
                  <form
                    className="contact-edit"
                    onSubmit={(e) => {
                      e.preventDefault();
                      save(c);
                    }}
                  >
                    <ContactFields draft={draft} onChange={edit} wrong={wrong} />
                    {badNote}
                    <div className="contact-edit__foot">
                      <Button type="submit" size="sm">
                        {t('sec.save')}
                      </Button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Inside the frame rather than instead of it, so the head that names what is missing
            and the button that fixes it stay on screen with the notice. It steps aside for the
            add form: a frame holding a half-written contact is not an empty one. */}
        {shown.length === 0 && !adding && (
          <div className="empty empty--inset">
            <IconUsers size={28} />
            <p className="empty__title">
              {t(rows.length === 0 ? 'con.none' : 'empty.contactsFilter')}
            </p>
            <p className="empty__note">
              {t(rows.length === 0 ? 'con.lede' : 'empty.searchNote')}
            </p>
          </div>
        )}

        {/* The toolbar is inside the frame, so the count it answers is too — the frame's foot
            rather than a line floating under it. */}
        {rows.length > 0 && <TableCount shown={shown.length} total={rows.length} inset />}
      </section>
    </AccountLayout>
  );
}
