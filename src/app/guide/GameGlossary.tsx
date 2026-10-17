import { useEffect, useState } from 'react';
import { GAME_GUIDES } from './games';
import { canonicalGameId } from '../games';
import { GLOSSARY, GLOSSARY_GROUPS, termHref } from './glossary';
import { TermDiagram } from './TermDiagram';
import './GameGuide.css';
import './Glossary.css';

export default function Glossary() {
  const [initial] = useState(() => {
    const params = new URLSearchParams(location.search);
    const selected = GLOSSARY.find((term) => term.id === params.get('term'));
    return {
      selected,
      group:
        selected?.group ?? canonicalGameId(params.get('group')) ?? params.get('group') ?? 'all',
      search: params.get('q') ?? '',
      game: GAME_GUIDES.find((game) => game.id === canonicalGameId(params.get('game'))),
    };
  });
  const [group, setGroup] = useState(
    GLOSSARY_GROUPS.some((entry) => entry.id === initial.group) ? initial.group : 'all',
  );
  const [search, setSearch] = useState(initial.search);
  const query = search.trim().toLocaleLowerCase();
  const matches = GLOSSARY.filter(
    (term) =>
      (group === 'all' || term.group === group) &&
      (!query ||
        [term.name, term.meaning, term.example, ...term.aliases]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query)),
  );
  useEffect(() => {
    document.title = 'Visual glossary · Card Workshop';
    if (initial.selected) document.getElementById(`term-${initial.selected.id}`)?.focus();
  }, [initial]);
  useEffect(() => {
    const url = new URL(location.href);
    if (group === 'all') url.searchParams.delete('group');
    else url.searchParams.set('group', group);
    if (search) url.searchParams.set('q', search);
    else url.searchParams.delete('q');
    if (search || (initial.selected && group !== initial.selected.group)) {
      url.searchParams.delete('term');
      url.hash = '';
    }
    history.replaceState(null, '', url);
  }, [group, search, initial]);
  return (
    <main className="game-guide glossary">
      <header className="game-guide-masthead">
        <a href={`?guide=games${initial.game ? `&game=${initial.game.id}` : ''}`}>
          ← Illustrated game guide
        </a>
        {initial.game && <a href={`?game=${initial.game.id}`}>Return to {initial.game.name}</a>}
      </header>
      <section className="game-guide-intro" aria-labelledby="glossary-title">
        <p className="eyebrow">THE WORKSHOP / IN PLAIN WORDS</p>
        <h1 id="glossary-title">
          Know the term.
          <br />
          <em>Follow the conversation.</em>
        </h1>
        <p>
          Game mechanics and AI experiments use different kinds of shorthand. Look up a word, see a
          small example, then get back to the discussion.
        </p>
        <div className="glossary-shortcuts" aria-label="Common terms">
          {['block', 'ascension', 'policy', 'rollout', 'calibration'].map((id) => (
            <a key={id} href={termHref(id)}>
              {GLOSSARY.find((term) => term.id === id)?.name} ↗
            </a>
          ))}
        </div>
      </section>
      <details className="glossary-translations">
        <summary>Translate sentences from the linked chat</summary>
        <article>
          <blockquote>
            “Survival spent 47 turns losing to a Spheric Guardian while discounting damage to its
            persistent Block”
          </blockquote>
          <p>
            The <a href={termHref('strategies')}>Survival bot</a> undervalued attacks that removed
            the enemy’s <a href={termHref('block')}>protective Block</a>. The{' '}
            <a href={termHref('spheric-guardian')}>Spheric Guardian</a> keeps that protection across
            turns, so chipping it away matters.
          </p>
        </article>
        <article>
          <blockquote>“earlier upgrades helped Tempo, but Classic still led”</blockquote>
          <p>
            Buying better <a href={termHref('tavern-tier')}>shop access sooner</a> helped the{' '}
            <a href={termHref('hearth-styles')}>Tempo bot</a>. The{' '}
            <a href={termHref('mixed-rivals')}>Classic comparison bot</a> still finished better in
            that study. These are bot styles, not difficulty labels.
          </p>
        </article>
        <article>
          <blockquote>“All 1,440 cases completed and passed four audits.”</blockquote>
          <p>
            The recorded attempts passed their <a href={termHref('audit')}>evidence checks</a>. That
            alone does not say the bots won often or that the difficulty levels were{' '}
            <a href={termHref('calibration')}>well calibrated</a>.
          </p>
        </article>
        <p className="glossary-source">
          Examples quoted from{' '}
          <a href="codex://threads/01a1420e-5f0f-7fb2-a556-740f14d15046">
            Find next AI engine work
          </a>
          . They explain the chat’s wording, rather than report current performance.
        </p>
      </details>
      <section className="glossary-lookup" aria-label="Find a term">
        <div className="glossary-controls">
          <label>
            Search terms and abbreviations
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try Block, A0, rollout, seed…"
            />
          </label>
          <label>
            Topic
            <select
              aria-label="Glossary topic"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option value="all">All topics</option>
              {GLOSSARY_GROUPS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setGroup('all');
              setSearch('');
            }}
          >
            Reset
          </button>
        </div>
        <p role="status">
          {matches.length} {matches.length === 1 ? 'term' : 'terms'}
          {group !== 'all'
            ? ` in ${GLOSSARY_GROUPS.find((entry) => entry.id === group)?.name}`
            : ''}
          .{' '}
          {query
            ? 'Matching definitions are expanded.'
            : 'Choose a topic or open a section to browse.'}
        </p>
      </section>
      {matches.length === 0 ? (
        <div className="glossary-empty">
          <h2>No matching terms</h2>
          <p>Try a shorter word or select All topics.</p>
          {group !== 'all' && <button onClick={() => setGroup('all')}>Search all topics</button>}
        </div>
      ) : (
        <div className="glossary-sections">
          {GLOSSARY_GROUPS.map((entry) => {
            const terms = matches
              .filter((term) => term.group === entry.id)
              .sort((a, b) => a.name.localeCompare(b.name));
            if (!terms.length) return null;
            return (
              <details
                key={entry.id}
                open={Boolean(query) || group !== 'all'}
                className="glossary-section"
              >
                <summary>
                  <span>{entry.name}</span>
                  <small>{terms.length} terms</small>
                </summary>
                <div className="glossary-terms">
                  {terms.map((term) => (
                    <article
                      className="glossary-term"
                      key={term.id}
                      aria-labelledby={`title-${term.id}`}
                    >
                      <div className="glossary-term-heading">
                        <h3 id={`term-${term.id}`} tabIndex={-1}>
                          <span id={`title-${term.id}`}>{term.name}</span>
                        </h3>
                        <a href={termHref(term.id)} aria-label={`Link to ${term.name}`}>
                          #
                        </a>
                      </div>
                      <p>{term.meaning}</p>
                      <p className="glossary-example">
                        <strong>For example</strong>
                        {term.example}
                      </p>
                      {term.visual && <TermDiagram kind={term.visual} />}
                      {term.aliases.length > 0 && (
                        <p className="glossary-aliases">
                          <strong>Look up also:</strong> {term.aliases.join(' · ')}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
      <footer>
        <strong>Same word, different game?</strong>
        <p>
          Terms are grouped by context: a Spire relic, a Cartographer relic and a Night Passage rune
          do different jobs. These explanations describe the workshop versions.
        </p>
        <a href="#glossary-title">Back to top ↑</a>
      </footer>
    </main>
  );
}
