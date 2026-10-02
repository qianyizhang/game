import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  attemptResult,
  challengeDecisions,
  encodeChallenge,
  type Challenge,
} from '../shared/challenges';
import { downloadJSON } from './useLocalGame';
import { ChallengeArt, ChallengeSymbol } from '../shared/art/ChallengeArt';
import { useChallengeProgress } from './useChallengeProgress';

export interface ChallengeBoardProps<S, C> {
  state: S;
  dispatch: (command: C) => boolean;
  finished: boolean;
}
export function ChallengePlayer<S extends { seed: string }, C>({
  definition,
  renderBoard,
  onExit,
}: {
  definition: Challenge<S, C>;
  renderBoard: (props: ChallengeBoardProps<S, C>) => ReactNode;
  onExit: () => void;
}) {
  const {
    progress,
    error,
    saveStatus,
    revision,
    dispatch,
    retry,
    importFile,
    showHint,
    endAttempt,
  } = useChallengeProgress(definition);
  const file = useRef<HTMLInputElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const reviewTitle = useRef<HTMLHeadingElement>(null);
  const result = attemptResult(definition, progress.current);
  const finished = result.status !== 'active';
  useEffect(() => {
    (finished ? reviewTitle : title).current?.focus();
  }, [finished, revision]);
  const previousResult = progress.previous ? attemptResult(definition, progress.previous) : null;
  const decisions = useMemo(
    () => (finished ? challengeDecisions(definition, progress.current) : []),
    [definition, finished, progress.current],
  );
  return (
    <article className="challenge-player">
      <header className="challenge-brief">
        <div className="challenge-breadcrumb">
          <button onClick={onExit}>← All challenges</button>
          <span>{definition.gameName} · Tactical puzzle</span>
        </div>
        <ChallengeArt id={definition.id} />
        <p className="eyebrow">ONE POSITION · ONE DECISION TO UNDERSTAND</p>
        <h1 ref={title} tabIndex={-1}>
          {definition.title}
        </h1>
        <p className="challenge-goal">
          <span>YOUR GOAL</span>
          {definition.objective}
        </p>
        <p>{definition.introduction}</p>
        <p className="challenge-constraints">{definition.constraints}</p>
        <div className="challenge-actions">
          {!finished && (
            <button disabled={progress.current.hints >= definition.hints.length} onClick={showHint}>
              <ChallengeSymbol kind="hint" />
              {progress.current.hints === definition.hints.length
                ? 'All hints shown'
                : progress.current.hints
                  ? 'Show next hint'
                  : 'Show a hint'}{' '}
              · {progress.current.hints}/{definition.hints.length}
            </button>
          )}
          {!finished && <button onClick={endAttempt}>End attempt & review</button>}
          <button
            onClick={() =>
              downloadJSON(encodeChallenge(progress), `${definition.id}-attempts.json`)
            }
          >
            Export attempts
          </button>
          <button onClick={() => file.current?.click()}>Import attempts</button>
          <span className="challenge-save-status" role="status">
            {saveStatus}
          </span>
        </div>
        <input
          ref={file}
          className="visually-hidden"
          aria-label="Import challenge attempts"
          type="file"
          accept=".json,application/json"
          onChange={async (event) => {
            const input = event.currentTarget;
            const selected = input.files?.[0];
            if (!selected) return;
            await importFile(selected);
            input.value = '';
          }}
        />
        {!!progress.current.hints && (
          <ol className="challenge-hints">
            {definition.hints.slice(0, progress.current.hints).map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ol>
        )}
      </header>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {finished && (
        <section className={`challenge-review ${result.status}`} aria-label="Decision review">
          <div className="challenge-review-heading">
            <div className="challenge-review-title">
              <ChallengeSymbol kind={result.status === 'cleared' ? 'cleared' : 'retry'} />
              <div>
                <p className="eyebrow">ATTEMPT REVIEW</p>
                <h2 ref={reviewTitle} tabIndex={-1}>
                  {result.status === 'cleared' ? 'Challenge cleared' : 'Not yet'}
                </h2>
              </div>
            </div>
            <span>
              {progress.current.hints} / {definition.hints.length} hints used
            </span>
          </div>
          <p>{result.summary}</p>
          <div className="table-scroll">
            <table className="challenge-comparison">
              <caption>
                {previousResult ? 'Your attempts · same starting position and seed' : 'Your result'}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col">This attempt</th>
                  {previousResult && <th scope="col">Previous attempt</th>}
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.metrics).map(([label, value]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{value}</td>
                    {previousResult && <td>{previousResult.metrics[label] ?? '—'}</td>}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Hints used</th>
                  <td>{progress.current.hints}</td>
                  {progress.previous && <td>{progress.previous.hints}</td>}
                </tr>
              </tbody>
            </table>
          </div>
          <h3>Why the order matters</h3>
          <p>{definition.explanation}</p>
          <div className="challenge-actions">
            <button className="primary" onClick={() => retry()}>
              <ChallengeSymbol kind="retry" />
              Try another choice
            </button>
            <button onClick={onExit}>Choose another challenge</button>
          </div>
          <p className="small muted">
            Retry keeps this result for comparison. You have seen the explanation; a retry is
            practice, not an unseen test.
          </p>
        </section>
      )}
      <div className="challenge-board" key={revision}>
        {renderBoard({ state: progress.current.session.state, dispatch, finished })}
      </div>
      {finished && (
        <section className="challenge-decisions" aria-label="Your decisions">
          <h2>Your decisions, resolved</h2>
          <p>
            Each event below comes from the game rules. Retry from a decision to keep everything
            before it.
          </p>
          {!decisions.length && <p>No actions were committed in this attempt.</p>}
          <ol>
            {decisions.map((decision) => (
              <li key={decision.step}>
                <details open={decisions.length === 1}>
                  <summary>
                    {decision.step + 1}. {decision.label}
                  </summary>
                  <ul>
                    {decision.events.map((event, index) => (
                      <li key={index}>{event}</li>
                    ))}
                  </ul>
                </details>
                <button
                  aria-label={`Try again before decision ${decision.step + 1}`}
                  onClick={() => retry(decision.step)}
                >
                  Try from here
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
      {!finished && previousResult && (
        <aside className="challenge-previous">
          <strong>
            Previous attempt: {previousResult.status === 'cleared' ? 'cleared' : 'not yet'}
          </strong>
          <p>{previousResult.summary}</p>
          <span>Complete this attempt to compare results.</span>
        </aside>
      )}
    </article>
  );
}
