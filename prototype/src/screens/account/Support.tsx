import { useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Tag, TICKET_TONE, PRIORITY_TONE } from '../../components/Tag';
import {
  StatusHeadline,
  SystemList,
  IncidentList,
  worstOf,
  STATE_TAG,
} from '../../components/StatusBoard';
import {
  IconArrow,
  IconPlus,
  IconBook,
  IconSupport,
  IconCheck,
  IconAlert,
  IconInfo,
  IconPaperclip,
  IconBold,
  IconItalic,
  IconHeading,
  IconLink,
  IconList,
  IconListNumbered,
  IconCode,
  IconQuote,
} from '../../components/icons';
import { TableToolbar, TableFilter, TableCount, matches } from '../../components/TableToolbar';
import { useLocale } from '../../lib/locale';
import { useSaved, SavedNote } from '../../lib/saved';
import {
  TICKETS,
  DEPARTMENTS,
  PRIORITIES,
  ARTICLES,
  KB_CATEGORIES,
  SERVICES,
  type TicketStatus,
} from '../../lib/account';
import { useAccountState } from '../../lib/accountState';
import { SYSTEMS, INCIDENTS } from '../../lib/marketing';
import { Select } from '../../components/Select';

const STATUSES: (TicketStatus | 'all')[] = ['all', 'open', 'answered', 'closed'];

/**
 * Ticket list — spec 9.5.1, which asks for three filters, not one: status, department and
 * priority.
 *
 * All three are selects, matching every other list in the client area: they share the row with
 * a search field, and three pill strips would be eleven pills competing with it for width.
 * Three filters plus a query means an empty result is easy to reach, so the empty state has to
 * offer the way back out rather than only offering a new ticket.
 */
export function Tickets() {
  const { t, bi } = useLocale();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<TicketStatus | 'all'>('all');
  const [dept, setDept] = useState('all');
  const [priority, setPriority] = useState('all');

  // Subjects are authored in both languages, so both are searched: someone reading the Arabic
  // list still remembers the ticket they opened in English.
  const rows = TICKETS.filter(
    (x) =>
      (status === 'all' || x.status === status) &&
      (dept === 'all' || x.department === dept) &&
      (priority === 'all' || x.priority === priority) &&
      matches(q, x.subject.ar, x.subject.en, x.ref, x.updated),
  );

  const narrowed = q.trim() !== '' || status !== 'all' || dept !== 'all' || priority !== 'all';
  const showAll = () => {
    setQ('');
    setStatus('all');
    setDept('all');
    setPriority('all');
  };

  return (
    /* Opening a ticket moves up to the header action, where every other list keeps its one
       primary verb — the toolbar row below is now the search, and only the search. */
    <AccountLayout
      title={t('acc.tickets')}
      actions={
        <Link className="btn btn--md btn--primary" to="/account/tickets/new">
          <IconPlus size={15} />
          {t('tkt.open')}
        </Link>
      }
    >
      <TableToolbar
        value={q}
        onChange={setQ}
        label={t('search.tickets')}
      >
        <TableFilter
          label={t('account.status')}
          value={status}
          onChange={setStatus}
          options={STATUSES.map((s) => ({
            value: s,
            label: t(s === 'all' ? 'filter.allStatuses' : (`tkt.${s}` as never)),
          }))}
        />
        <TableFilter
          label={t('tkt.department')}
          value={dept}
          onChange={setDept}
          options={[
            { value: 'all', label: t('filter.allDepartments') },
            ...DEPARTMENTS.map((d) => ({ value: d.id, label: t(d.nameKey as never) })),
          ]}
        />
        <TableFilter
          label={t('tkt.priority')}
          value={priority}
          onChange={setPriority}
          options={[
            { value: 'all', label: t('filter.allPriorities') },
            ...PRIORITIES.map((p) => ({ value: p, label: t(`prio.${p}` as never) })),
          ]}
        />
      </TableToolbar>

      {rows.length === 0 ? (
        <div className="card empty">
          <IconSupport size={28} />
          <p className="empty__title">
            {t(q.trim() ? 'empty.search' : narrowed ? 'tkt.noneFilter' : 'tkt.none')}
          </p>
          <p className="empty__note">{t(q.trim() ? 'empty.searchNote' : 'empty.filter')}</p>
          <div className="actions actions--split">
            {narrowed && (
              <Button size="lg" variant="secondary" onClick={showAll}>
                {t('tkt.showAll')}
              </Button>
            )}
            <Link className="btn btn--lg btn--primary" to="/account/tickets/new">
              {t('tkt.open')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="card card--flush table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">{t('tkt.subject')}</th>
                <th scope="col">{t('tkt.department')}</th>
                <th scope="col">{t('tkt.priority')}</th>
                <th scope="col">{t('tkt.updated')}</th>
                <th scope="col">{t('account.status')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>
                    <span className="lead">{bi(x.subject)}</span>
                    <span className="data__sub serial"><bdi>{x.ref}</bdi></span>
                  </td>
                  <td>{t(`dept.${x.department}` as never)}</td>
                  <td>
                    <Tag tone={PRIORITY_TONE[x.priority]}>{t(`prio.${x.priority}` as never)}</Tag>
                  </td>
                  <td className="serial"><bdi>{x.updated}</bdi></td>
                  <td>
                    <Tag tone={TICKET_TONE[x.status]}>{t(`tkt.${x.status}` as never)}</Tag>
                  </td>
                  <td className="num">
                    <Link className="btn btn--sm btn--secondary" to={`/account/tickets/${x.id}`}>
                      {t('tkt.view')}
                      <IconArrow size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TableCount shown={rows.length} total={TICKETS.length} />
    </AccountLayout>
  );
}

/**
 * Open a ticket — spec 9.5.2, which asks for this screen to match its reference exactly and
 * in order: department choice, Ticket Information, Ticket Details with a rich-text editor and
 * a line/word count, attachments with the allowed types stated, and a knowledgebase
 * suggestion box that searches while the subject is typed.
 *
 * The suggestion box is the point of the screen: the spec's stated goal is fewer tickets, so
 * the article that would have answered the question has to appear before Send is pressed.
 */
export function TicketNew() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  /*
   * Spec 9.2 asks the service page for a support request "related to this service
   * specifically". Arriving from that button carries the service, so the subject opens
   * already naming the plan and the domain instead of asking the customer to retype what the
   * previous screen already knew. The cursor still lands after the colon, so the sentence is
   * theirs to finish.
   */
  const from = SERVICES.find((s) => s.id === params.get('service'));

  /*
   * The same courtesy for an invoice, and now for two reasons.
   *
   * A payment that went wrong is the worst moment to ask somebody to go and find their
   * invoice number, so the invoice screen sends it. And the invoices list has an Edit item
   * that arrives here too, because an invoice's own lines are not the client's to change —
   * see `dev.invoiceActions`. Either way the subject opens naming the invoice and the
   * department opens on Sales and Billing rather than Technical Support, which is the queue
   * that can actually look at a charge.
   *
   * The lookup goes through account state rather than the INVOICES fixture: an invoice the
   * account has cancelled or taken off its list must not come back here as a live subject.
   */
  const invoiceId = params.get('invoice');
  const { invoice } = useAccountState();
  const about = invoiceId ? invoice(invoiceId) : undefined;

  const [dept, setDept] = useState(about ? 'sales' : 'tech');
  const [subject, setSubject] = useState(
    about
      ? `${t('inv.forInvoice')} ${about.number}: `
      : from
        ? `${from.product} — ${from.domain}: `
        : '',
  );
  const [body, setBody] = useState('');

  const suggestions = useMemo(() => {
    const q = subject.trim().toLowerCase();
    if (q.length < 3) return [];
    return ARTICLES.filter((a) => t(a.titleKey as never).toLowerCase().includes(q)).slice(0, 3);
  }, [subject, t]);

  const lines = body ? body.split('\n').length : 0;
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <AccountLayout
      title={t('tkt.open')}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.tickets'), to: '/account/tickets' },
        { label: t('tkt.submit') },
      ]}
    >
      <h2 className="app__section">{t('tkt.chooseDept')}</h2>
      <ul className="choices">
        {DEPARTMENTS.map((d) => (
          <li key={d.id}>
            <label className={`choice${dept === d.id ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="dept"
                value={d.id}
                checked={dept === d.id}
                onChange={() => setDept(d.id)}
              />
              <span className="choice__title">{t(d.nameKey as never)}</span>
              <span className="choice__body">{t(d.bodyKey as never)}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="with-side">
        {/* The fieldsets below are already cards, one per section. Wrapping them in another
            card framed every group twice — a 24px-padded bordered box inside a 24px-padded
            bordered box, which is a shape that appears nowhere else in the client area. */}
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/account/tickets');
          }}
        >
          <fieldset className="fieldset">
            <legend>{t('tkt.info')}</legend>
            {/* Two by two, not three and a stray: these four read as the pairs they are. */}
            <div className="field-grid field-grid--pairs">
              <label className="field-label">
                <span className="eyebrow">{t('checkout.name')}</span>
                <input className="field" defaultValue="Kamal Abdelrahman" />
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('checkout.email')}</span>
                <input className="field" type="email" dir="ltr" defaultValue="kamal@atelier-kamal.com" />
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('tkt.department')}</span>
                <Select value={dept} onChange={(e) => setDept(e.target.value)}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {t(d.nameKey as never)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('tkt.priority')}</span>
                <Select defaultValue="medium">
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`prio.${p}` as never)}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend>{t('tkt.details')}</legend>
            <label className="field-label">
              <span className="eyebrow">{t('tkt.subject')}</span>
              <input
                className="field"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </label>

            <div className="editor">
              <div className="editor__bar" role="toolbar" aria-label={t('tkt.format')}>
                {/* Each mark inserts the markup it depicts. A toolbar of buttons that do
                    nothing is the most convincing broken thing on a form. */}
                {(
                  [
                    ['bold', <IconBold size={16} />, '**', '**'],
                    ['italic', <IconItalic size={16} />, '_', '_'],
                    ['heading', <IconHeading size={16} />, '## ', ''],
                    ['link', <IconLink size={16} />, '[', '](https://)'],
                    ['list', <IconList size={16} />, '- ', ''],
                    ['numbered', <IconListNumbered size={16} />, '1. ', ''],
                    ['code', <IconCode size={16} />, '`', '`'],
                    ['quote', <IconQuote size={16} />, '> ', ''],
                  ] as const
                ).map(([name, glyph, open, close], i) => (
                  <button
                    type="button"
                    key={name}
                    className="editor__tool"
                    aria-label={t(`tkt.tool${i}` as never)}
                    title={t(`tkt.tool${i}` as never)}
                    onClick={() => setBody((v) => `${v}${open}${close}`)}
                  >
                    {glyph}
                  </button>
                ))}
              </div>
              <label className="u-visually-hidden" htmlFor="tkt-body">
                {t('tkt.message')}
              </label>
              <textarea
                id="tkt-body"
                className="field editor__area"
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              {/* Spec 9.5.2 puts the line and word count at the foot of the editor. */}
              <p className="editor__count serial">
                {t('tkt.lines')}: {lines} · {t('tkt.words')}: {words}
              </p>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend>{t('tkt.attachments')}</legend>
            {/* A legend names the group, not the control inside it, and this fieldset holds
                exactly one control — so the input itself had no name of its own. */}
            <input
              className="field"
              type="file"
              multiple
              aria-label={t('tkt.attachments')}
              accept=".jpg,.gif,.jpeg,.png,.txt,.pdf"
            />
            {/* The reference states 4096MB, which is a typo for the 4096KB WHMCS default. */}
            <p className="hint">{t('tkt.attachNote')}</p>
          </fieldset>

          {/* One footer, one size. This pair used to be a 44px quiet button beside a 52px
              submit — and because the row stretched its items, the one that said `md` rendered
              at 52 anyway. */}
          <div className="form__foot">
            <Button size="md" type="submit">
              {t('tkt.send')}
            </Button>
            <Link className="btn btn--md btn--quiet" to="/account/tickets">
              {t('tkt.cancel')}
            </Link>
          </div>
        </form>

        <Card
          className="kb-side"
          heading={t('tkt.suggestions')}
          icon={<IconBook size={17} />}
          headingId="kb-sug"
        >
          <p className="card__body">{t('tkt.suggestionsNote')}</p>

          {suggestions.length > 0 ? (
            <ul className="kb-side__list">
              {suggestions.map((a) => (
                <li key={a.id}>
                  <Link to={`/account/knowledgebase/${a.slug}`}>{t(a.titleKey as never)}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">{t('tkt.suggestionsEmpty')}</p>
          )}
        </Card>
      </div>
    </AccountLayout>
  );
}

/** Ticket thread — spec 9.5.3: a timeline with distinct sides, reply, and close. */
export function TicketThread() {
  const { t, bi } = useLocale();
  const { id } = useParams<{ id: string }>();
  const tkt = TICKETS.find((x) => x.id === id);

  // A reply that vanishes is worse than no reply box, so what is sent joins the thread.
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [sent, setSent] = useState<typeof TICKETS[number]['messages']>([]);
  // The file input keeps its own value, so clearing our state is not enough to clear the
  // control's own "2 files selected" label after the reply has gone.
  const fileRef = useRef<HTMLInputElement>(null);
  const { saved, mark, clear } = useSaved();

  if (!tkt) return <Navigate to="/account/tickets" replace />;

  const send = () => {
    if (!draft.trim()) return;
    setSent((all) => [
      ...all,
      {
        id: `r-${all.length}`,
        from: 'client' as const,
        author: { ar: 'كمال عبدالرحمن', en: 'Kamal Abdelrahman' },
        at: '2026-09-01 10:24',
        body: { ar: draft, en: draft },
        attachments: files.length > 0 ? files : undefined,
      },
    ]);
    setDraft('');
    setFiles([]);
    if (fileRef.current) fileRef.current.value = '';
    mark(t('tkt.sent'));
  };

  return (
    <AccountLayout
      title={bi(tkt.subject)}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.tickets'), to: '/account/tickets' },
        { label: tkt.ref },
      ]}
    >
      <SavedNote saved={saved} onDismiss={clear} />

      <div className="thread">
        {[...tkt.messages, ...sent].map((m) => (
          <article className={`msg msg--${m.from}`} key={m.id}>
            <header className="msg__head">
              <span className="msg__author">{bi(m.author)}</span>
              <span className="msg__at serial">
                <bdi>{m.at}</bdi>
              </span>
            </header>
            <p className="msg__body" dir="auto">
              {bi(m.body)}
            </p>
            {m.attachments && m.attachments.length > 0 && (
              <ul className="msg__files">
                {m.attachments.map((f) => (
                  <li key={f}>
                    <IconPaperclip size={14} />
                    <bdi className="serial">{f}</bdi>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {tkt.status === 'closed' ? (
        /* Closed is the ticket's own state, not a switch on this screen. The client cannot
           close a ticket — support does — and a thread that is already closed gets no
           composer, because leaving one there and refusing the send is worse than not
           offering it. This screen used to hold its own `closed` flag, which meant #7688
           arrived closed and still offered a reply box. */
        <div className="card empty">
          <IconCheck size={28} />
          <p className="empty__title">{t('tkt.closedTitle')}</p>
          <p className="empty__note">{t('tkt.closedNote')}</p>
          <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
            {t('tkt.open')}
          </Link>
        </div>
      ) : (
        /* A composer, not a form: one field that grows with what is typed, the clip beside
           it, and Send at the end — the shape of every message box the reader already uses.
           Enter sends and shift+enter breaks the line, which is the part that makes it feel
           like a chat rather than look like one. */
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label className="u-visually-hidden" htmlFor="reply">
            {t('tkt.reply')}
          </label>
          <textarea
            id="reply"
            className="composer__input"
            rows={1}
            placeholder={t('tkt.replyPlaceholder')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />

          {files.length > 0 && (
            <ul className="composer__files">
              {files.map((f) => (
                <li key={f}>
                  <IconPaperclip size={13} />
                  <bdi className="serial">{f}</bdi>
                </li>
              ))}
            </ul>
          )}

          <div className="composer__acts">
            <label className="composer__clip">
              <IconPaperclip size={18} />
              <span className="u-visually-hidden">{t('tkt.attachments')}</span>
              <input
                ref={fileRef}
                className="u-visually-hidden"
                type="file"
                multiple
                accept=".jpg,.gif,.jpeg,.png,.txt,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => f.name))}
              />
            </label>
            <p className="composer__hint">{t('tkt.attachNote')}</p>
            <Button type="submit" size="md" disabled={!draft.trim()}>
              {t('tkt.send')}
            </Button>
          </div>
        </form>
      )}
    </AccountLayout>
  );
}

/**
 * Knowledgebase — spec 9.5.4: categories, search, and a helpfulness vote per article.
 *
 * The category filter and the search box narrow the same list rather than replacing one
 * another: someone who has picked "Domains" and then types is still inside Domains, which is
 * what picking a category was for. Each option carries its own count, so an empty category is
 * visible before it is opened.
 *
 * The search here was the one field in the client area that already existed, with a submit
 * button beside it. The button went with the strip: nothing was ever submitted — the list
 * narrows on every keystroke — so it was a button whose only job was to look like search.
 */
export function Knowledgebase() {
  const { t } = useLocale();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');

  // The body is searched as well as the title: what people remember of an article is a phrase
  // out of it — a port number, a nameserver — not the sentence it was titled with.
  const rows = ARTICLES.filter(
    (a) =>
      (cat === 'all' || a.category === cat) &&
      matches(q, t(a.titleKey as never), t(a.bodyKey as never)),
  );

  const countIn = (c: string) => ARTICLES.filter((a) => a.category === c).length;

  return (
    <AccountLayout title={t('acc.kb')}>
      <TableToolbar
        value={q}
        onChange={setQ}
        label={t('kb.search')}
      >
        <TableFilter
          label={t('kb.categories')}
          value={cat}
          onChange={setCat}
          options={[
            { value: 'all', label: `${t('filter.allCategories')} (${ARTICLES.length})` },
            ...KB_CATEGORIES.map((c) => ({
              value: c,
              label: `${t(`kb.cat.${c}` as never)} (${countIn(c)})`,
            })),
          ]}
        />
      </TableToolbar>

      {rows.length > 0 ? (
        <ul className="card card--flush kb-list">
          {rows.map((a) => (
            <li key={a.id}>
              <Link className="kb-item" to={`/account/knowledgebase/${a.slug}`}>
                <span className="kb-item__cat eyebrow">{t(`kb.cat.${a.category}` as never)}</span>
                <span className="kb-item__title">{t(a.titleKey as never)}</span>
                <IconArrow size={16} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        /* A search with no answer is where a ticket gets opened, so that is what it offers. */
        <div className="card empty">
          <IconBook size={28} />
          <p className="empty__title">{t('empty.kb')}</p>
          <p className="empty__note">{t('empty.kbNote')}</p>
          <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
            <IconPlus size={15} />
            {t('tkt.open')}
          </Link>
        </div>
      )}

      <TableCount shown={rows.length} total={ARTICLES.length} />
    </AccountLayout>
  );
}

export function KbArticle() {
  const { t } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const a = ARTICLES.find((x) => x.slug === slug);
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  if (!a) return <Navigate to="/account/knowledgebase" replace />;

  // The point of holding a category on an article is to answer the next question as well as
  // this one, so the siblings are offered here rather than only on the index.
  const related = ARTICLES.filter((x) => x.category === a.category && x.id !== a.id);

  return (
    <AccountLayout
      title={t(a.titleKey as never)}
      crumbs={[
        { label: t('acc.portalHome'), to: '/account' },
        { label: t('acc.kb'), to: '/account/knowledgebase' },
        { label: t(`kb.cat.${a.category}` as never) },
      ]}
    >
      <article className="card prose">
        <p>{t(a.bodyKey as never)}</p>
      </article>

      {/* Spec 9.5.4 asks each article to collect whether it was useful. */}
      <div className="card vote">
        <p className="card__heading">{t('kb.helpful')}</p>
        {voted ? (
          <p className="card__body">{t('kb.thanks')}</p>
        ) : (
          <div className="actions actions--split">
            <Button size="md" variant="secondary" onClick={() => setVoted('yes')}>
              {t('kb.yes')}
            </Button>
            <Button size="md" variant="quiet" onClick={() => setVoted('no')}>
              {t('kb.no')}
            </Button>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <>
          <h2 className="app__section">{t('kb.related')}</h2>
          <ul className="card card--flush kb-list">
            {related.map((r) => (
              <li key={r.id}>
                <Link className="kb-item" to={`/account/knowledgebase/${r.slug}`}>
                  <span className="kb-item__cat eyebrow">{t(`kb.cat.${r.category}` as never)}</span>
                  <span className="kb-item__title">{t(r.titleKey as never)}</span>
                  <IconArrow size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </AccountLayout>
  );
}

/* ── network status inside the client area — C-41 ───────────────────────────── */

type IncidentFilter = 'open' | 'all' | 'resolved' | 'maintenance';

/**
 * The same status the public page shows, where a signed-in person looks for it: under
 * Support, beside the tickets — the spec's own sitemap (5.5) puts it there.
 *
 * The list opens on what is still going on, because that is the question that brought
 * someone here; the resolved history is one choice away. `?state=clear` renders the day
 * nothing is wrong, which is the state the page most needs to be good at.
 *
 * There is no RSS link. No feed exists, and C19 (build the status page or buy one) is still
 * open — a link to a feed that does not exist would be the dead end this prototype gates
 * against. Getting told first is the notification preferences, one link below.
 */
export function NetworkStatus() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const clear = params.get('state') === 'clear';
  const [filter, setFilter] = useState<IncidentFilter>('open');

  const systems = clear ? SYSTEMS.map((s) => ({ ...s, state: 'operational' as const })) : SYSTEMS;
  const incidents = clear ? [] : INCIDENTS;
  const shown = incidents.filter(
    (i) =>
      filter === 'all' ||
      (filter === 'open' && i.minutes === undefined) ||
      (filter === 'resolved' && i.minutes !== undefined) ||
      (filter === 'maintenance' && i.state === 'maintenance'),
  );

  return (
    <AccountLayout title={t('acc.status')} lede={t('status.lede')}>
      <StatusHeadline worst={worstOf(systems)} />

      {/* The two halves of the same question, side by side on a roomy screen: which system,
          and what happened to it. The systems list leads because that is the order the
          questions arrive in — and it leads in the DOM too, so a phone stacks them that way. */}
      <div className="status-pair">
        {/* Six rows of a name and a state is an index, not a table. In the narrow track the
            state sits a glance from the name it belongs to; across the full column it sat the
            better part of a metre away, and the eye had to make that trip six times. */}
        <section className="card card--flush">
          <header className="card__head card__head--flush">
            <h2 className="card__heading">{t('status.systems')}</h2>
          </header>
          <SystemList systems={systems} hrefFor={(sys) => `/account/status/${sys.id}`} />
        </section>

        <div>
          <div className="bar">
            <h2 className="card__heading">{t('status.entries')}</h2>
            {/* A filter over nothing is a control that cannot do anything, so on the day the
                network is clear it is not offered — and neither is a count of nought. */}
            {incidents.length > 0 && (
              <div className="bar__end">
                <TableFilter
                  label={t('status.filter')}
                  value={filter}
                  onChange={setFilter}
                  options={(['open', 'all', 'resolved', 'maintenance'] as IncidentFilter[]).map(
                    (f) => ({ value: f, label: t(`status.filter.${f}` as never) }),
                  )}
                />
              </div>
            )}
          </div>

          {shown.length > 0 ? (
            <IncidentList incidents={shown} />
          ) : (
            <div className="card empty">
              <IconCheck size={28} />
              <p className="empty__title">{t('status.noneTitle')}</p>
              <p className="empty__note">
                {t(incidents.length > 0 ? 'status.noneNote' : 'status.noneClear')}
              </p>
            </div>
          )}

          {/* Under the list it counts, the way every other list in the client area counts
              itself — and not at all on a clear day, when there is nothing to count. */}
          {incidents.length > 0 && <TableCount shown={shown.length} total={incidents.length} />}
        </div>
      </div>

      <div className="notice notice--spaced">
        <IconInfo size={20} />
        <div>
          <h2 className="card__title">{t('status.updates')}</h2>
          <p className="card__body">{t('status.updatesBody')}</p>
          <Link className="btn btn--md btn--secondary u-mt-16" to="/account/notifications">
            {t('notif.title')}
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
}

/**
 * One system, on its own.
 *
 * The index answers "is it me?" and stops there. The two questions that follow it — since
 * when, and has this happened to this system before — had nowhere to be asked, so six rows of
 * a name and a chip were the whole of what the client area knew.
 *
 * What is on this page is only what we actually hold: the state, the timestamp it began, what
 * the system covers in a customer's words, and the incidents that touched it. No uptime
 * percentage, here least of all — a status page is the one screen where an invented 99.9% is
 * not marketing but a number somebody will hold us to.
 */
export function SystemDetail() {
  const { t } = useLocale();
  const { systemId } = useParams();
  const system = SYSTEMS.find((s) => s.id === systemId);

  if (!system) return <Navigate to="/account/status" replace />;

  const history = INCIDENTS.filter((i) => i.systems.includes(system.id));

  return (
    <AccountLayout
      title={t(system.labelKey as never)}
      crumbs={[
        { label: t('acc.status'), to: '/account/status' },
        { label: t(system.labelKey as never) },
      ]}
    >
      {/* The same headline the index wears, saying this system's own state rather than the
          worst of six — and carrying the timestamp instead of the refresh note, because on
          one system the question is when it started, not how often the page reloads. */}
      <div className={`headline headline--${STATE_TAG[system.state]}`}>
        {system.state === 'operational' ? <IconCheck size={26} /> : <IconAlert size={26} />}
        <div>
          <p className="headline__title">{t(`status.state.${system.state}` as never)}</p>
          <p className="headline__note">
            {t('status.since')}{' '}
            <span className="serial">
              <bdi>{system.since}</bdi>
            </span>
          </p>
        </div>
      </div>

      <Card heading={t('status.covers')} icon={<IconInfo size={17} />} className="u-mt-16">
        <p className="card__body">{t(system.noteKey as never)}</p>
      </Card>

      <h2 className="card__heading u-mt-24 u-mb-16">{t('status.systemHistory')}</h2>
      {history.length > 0 ? (
        <IncidentList incidents={history} />
      ) : (
        <div className="card empty">
          <IconCheck size={28} />
          <p className="empty__title">{t('status.systemNone')}</p>
        </div>
      )}
    </AccountLayout>
  );
}
