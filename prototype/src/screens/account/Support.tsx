import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { AccountLayout } from '../../components/AccountLayout';
import { Button } from '../../components/Button';
import { IconArrow, IconPlus, IconSearch, IconBook, IconSupport, IconCheck } from '../../components/icons';
import { useLocale } from '../../lib/locale';
import { useSaved, SavedNote } from '../../lib/saved';
import {
  TICKETS,
  DEPARTMENTS,
  PRIORITIES,
  ARTICLES,
  type TicketStatus,
} from '../../lib/account';

const STATUSES: (TicketStatus | 'all')[] = ['all', 'open', 'answered', 'closed'];

/** Ticket list — spec 9.5.1: filtered by status, department and priority. */
export function Tickets() {
  const { t, bi } = useLocale();
  const [status, setStatus] = useState<TicketStatus | 'all'>('all');

  const rows = TICKETS.filter((x) => status === 'all' || x.status === status);

  return (
    <AccountLayout title={t('acc.tickets')}>
      <div className="toolbar">
        <div className="filters" role="group" aria-label={t('account.status')}>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`filters__btn${status === s ? ' is-active' : ''}`}
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
            >
              {t(`tkt.${s}` as never)}
            </button>
          ))}
        </div>
        <Link className="btn btn--md btn--primary" to="/account/tickets/new">
          <IconPlus size={15} />
          {t('tkt.open')}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card empty">
          <IconSupport size={28} />
          <p className="empty__title">{t('tkt.none')}</p>
          <p className="empty__note">{t('empty.filter')}</p>
          <Link className="btn btn--lg btn--primary" to="/account/tickets/new">
            {t('tkt.open')}
          </Link>
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
                    <span className={`tag tag--${x.priority === 'high' ? 'due' : 'taken'}`}>
                      {t(`prio.${x.priority}` as never)}
                    </span>
                  </td>
                  <td className="serial"><bdi>{x.updated}</bdi></td>
                  <td>
                    <span className={`tag tag--${x.status === 'closed' ? 'taken' : 'ok'}`}>
                      {t(`tkt.${x.status}` as never)}
                    </span>
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
  const [dept, setDept] = useState('tech');
  const [subject, setSubject] = useState('');
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
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/account/tickets');
          }}
        >
          <fieldset className="fieldset">
            <legend>{t('tkt.info')}</legend>
            <div className="field-grid">
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
                <select className="field" value={dept} onChange={(e) => setDept(e.target.value)}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {t(d.nameKey as never)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                <span className="eyebrow">{t('tkt.priority')}</span>
                <select className="field" defaultValue="medium">
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`prio.${p}` as never)}
                    </option>
                  ))}
                </select>
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
                    ['B', '**', '**'],
                    ['I', '_', '_'],
                    ['H', '## ', ''],
                    ['🔗', '[', '](https://)'],
                    ['•', '- ', ''],
                    ['1.', '1. ', ''],
                    ['</>', '`', '`'],
                    ['❝', '> ', ''],
                  ] as const
                ).map(([mark, open, close], i) => (
                  <button
                    type="button"
                    key={mark}
                    className="editor__tool"
                    aria-label={t(`tkt.tool${i}` as never)}
                    title={t(`tkt.tool${i}` as never)}
                    onClick={() => setBody((v) => `${v}${open}${close}`)}
                  >
                    <bdi>{mark}</bdi>
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
            <input className="field" type="file" multiple accept=".jpg,.gif,.jpeg,.png,.txt,.pdf" />
            {/* The reference states 4096MB, which is a typo for the 4096KB WHMCS default. */}
            <p className="hint">{t('tkt.attachNote')}</p>
          </fieldset>

          <div className="actions">
            <Link className="btn btn--md btn--quiet" to="/account/tickets">
              {t('tkt.cancel')}
            </Link>
            <Button size="lg" type="submit">
              {t('tkt.send')}
            </Button>
          </div>
        </form>

        <aside className="card kb-side" aria-labelledby="kb-sug">
          <h2 className="card__heading" id="kb-sug">
            <IconBook size={17} />
            {t('tkt.suggestions')}
          </h2>
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
        </aside>
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
  const [sent, setSent] = useState<typeof TICKETS[number]['messages']>([]);
  const [closed, setClosed] = useState(false);
  const { saved, mark, clear } = useSaved();

  if (!tkt) return <Navigate to="/account/tickets" replace />;

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
          </article>
        ))}
      </div>

      {closed ? (
        /* A closed ticket has no reply box. Leaving one there and refusing the send is worse
           than not offering it. */
        <div className="card empty">
          <IconCheck size={28} />
          <p className="empty__title">{t('tkt.closedTitle')}</p>
          <p className="empty__note">{t('tkt.closedNote')}</p>
          <Link className="btn btn--md btn--secondary" to="/account/tickets/new">
            {t('tkt.open')}
          </Link>
        </div>
      ) : (
        <div className="card">
          <h2 className="card__heading">{t('tkt.reply')}</h2>
          <label className="u-visually-hidden" htmlFor="reply">
            {t('tkt.reply')}
          </label>
          <textarea
            id="reply"
            className="field"
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="actions">
            <Button size="md" variant="quiet" onClick={() => setClosed(true)}>
              {t('tkt.close')}
            </Button>
            <Button
              size="lg"
              disabled={!draft.trim()}
              onClick={() => {
                setSent((all) => [
                  ...all,
                  {
                    id: `r-${all.length}`,
                    from: 'client' as const,
                    author: { ar: 'كمال عبدالرحمن', en: 'Kamal Abdelrahman' },
                    at: '2026-09-01 10:24',
                    body: { ar: draft, en: draft },
                  },
                ]);
                setDraft('');
                mark(t('tkt.sent'));
              }}
            >
              {t('tkt.send')}
            </Button>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

/** Knowledgebase — spec 9.5.4: categories, search, and a helpfulness vote per article. */
export function Knowledgebase() {
  const { t } = useLocale();
  const [q, setQ] = useState('');

  const rows = ARTICLES.filter((a) =>
    q.trim() ? t(a.titleKey as never).toLowerCase().includes(q.trim().toLowerCase()) : true,
  );

  return (
    <AccountLayout title={t('acc.kb')}>
      <form className="domain-search" onSubmit={(e) => e.preventDefault()}>
        <label className="u-visually-hidden" htmlFor="kbq">
          {t('action.search')}
        </label>
        <input
          id="kbq"
          className="field domain-search__input"
          placeholder={t('kb.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button size="lg" type="submit">
          <IconSearch size={17} />
          {t('action.search')}
        </Button>
      </form>

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
    </AccountLayout>
  );
}

export function KbArticle() {
  const { t } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const a = ARTICLES.find((x) => x.slug === slug);
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);

  if (!a) return <Navigate to="/account/knowledgebase" replace />;

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
    </AccountLayout>
  );
}
