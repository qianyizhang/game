import { useEffect, useRef, useState } from 'react';
import { ChallengePlayer } from './ChallengePlayer';
import { jokerOrderChallenge } from '../games/balatro/application/challenges';
import { poisonChallenge } from '../games/spire/application/challenges';
import { positioningChallenge } from '../games/battlegrounds/application/challenges';
import { BlindsideChallengeBoard } from '../games/balatro/ui/ChallengeBoard';
import { SpireChallengeBoard } from '../games/spire/ui/ChallengeBoard';
import { HearthChallengeBoard } from '../games/battlegrounds/ui/ChallengeBoard';
import { attemptResult, challengeKey, decodeChallenge, type Challenge } from '../shared/challenges';
import { readChallengeArchive } from './useChallengeProgress';
import './challenges.css';
import './challenge-art.css';
import { ChallengeArt, ChallengeSymbol } from '../shared/art/ChallengeArt';
import { ChallengeStatus } from './ChallengeArtwork';

const SELECTION = 'card-workshop.challenge-selection';
const catalogue = [
  { definition: jokerOrderChallenge, readStatus: () => status(jokerOrderChallenge) },
  { definition: poisonChallenge, readStatus: () => status(poisonChallenge) },
  { definition: positioningChallenge, readStatus: () => status(positioningChallenge) },
];
function status<S extends { seed: string }, C>(definition: Challenge<S, C>) {
  try {
    const raw = readChallengeArchive(challengeKey(definition));
    if (!raw) return { label: 'New puzzle', action: 'Start puzzle', cleared: false };
    const progress = decodeChallenge(definition, raw);
    const result = attemptResult(definition, progress.current);
    const cleared = Boolean(
      progress.cleared ||
      result.status === 'cleared' ||
      (progress.previous && attemptResult(definition, progress.previous).status === 'cleared'),
    );
    return {
      label: cleared ? 'Cleared' : result.status === 'active' ? 'In progress' : 'Not yet',
      action: result.status === 'active' ? 'Resume attempt' : 'Review attempt',
      cleared,
    };
  } catch {
    return { label: 'Saved progress needs attention', action: 'Open puzzle', cleared: false };
  }
}
export default function Challenges({ onExit }: { onExit: () => void }) {
  const [selected, setSelected] = useState(() => {
    try {
      const id = localStorage.getItem(SELECTION);
      return catalogue.some(({ definition }) => definition.id === id) ? id : null;
    } catch {
      return null;
    }
  });
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!selected) title.current?.focus();
  }, [selected]);
  const entries = selected
    ? []
    : catalogue.map(({ definition, readStatus }) => ({ definition, progress: readStatus() }));
  const choose = (id: string | null) => {
    setSelected(id);
    try {
      if (id) localStorage.setItem(SELECTION, id);
      else localStorage.removeItem(SELECTION);
    } catch {
      /* The active puzzle still opens. */
    }
  };
  const theme =
    selected === poisonChallenge.id
      ? 'spire-theme'
      : selected === positioningChallenge.id
        ? 'battlegrounds-theme'
        : '';
  const back = () => choose(null);
  return (
    <div className={`challenge-workspace ${theme}`}>
      <nav className="challenge-topbar" aria-label="Challenge navigation">
        <button onClick={onExit}>← Return to my run</button>
        <strong>
          CARD WORKSHOP <span>/ CHALLENGES</span>
        </strong>
        <span>LOCAL PLAY · SAVED SEPARATELY</span>
      </nav>
      <main className="challenge-main">
        {!selected && (
          <>
            <header className="challenge-library-heading">
              <p className="eyebrow">THREE TABLES. THREE TURNING POINTS.</p>
              <h1 ref={title} tabIndex={-1}>
                Find the better move.
              </h1>
              <p>
                Short tactical puzzles for players who know the basics. Commit a choice, inspect
                what happened, then try another line.
              </p>
              <p className="muted">
                Your normal runs and practice branches stay where you left them.
              </p>
              <p className="challenge-library-progress">
                {entries.filter((entry) => entry.progress.cleared).length} of {catalogue.length}{' '}
                cleared
              </p>
            </header>
            <div className="challenge-catalogue">
              {entries.map(({ definition, progress }, index) => (
                <article
                  className={`challenge-tile challenge-tile-${definition.game}`}
                  key={definition.id}
                >
                  <div className="challenge-tile-top">
                    <span className="challenge-number">0{index + 1}</span>
                    <span>{definition.gameName}</span>
                  </div>
                  <ChallengeArt id={definition.id} />
                  <h2>{definition.title}</h2>
                  <p>{definition.objective}</p>
                  <div className="challenge-tile-bottom">
                    <span className={`challenge-progress${progress.cleared ? ' is-cleared' : ''}`}>
                      <ChallengeStatus label={progress.label} />
                    </span>
                    <button
                      aria-label={`Open ${definition.title}`}
                      onClick={() => choose(definition.id)}
                    >
                      {progress.action} →
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <section className="challenge-how">
              <div>
                <ChallengeSymbol kind="choice" />
                <strong>01 · Make a choice</strong>
                <p>A prepared position and a concrete goal. Ask for a hint when you want one.</p>
              </div>
              <div>
                <ChallengeSymbol kind="resolve" />
                <strong>02 · See the consequence</strong>
                <p>Read the scoring or combat events behind your result.</p>
              </div>
              <div>
                <ChallengeSymbol kind="retry" />
                <strong>03 · Try another line</strong>
                <p>Retry the same position, or branch before a decision and compare attempts.</p>
              </div>
            </section>
          </>
        )}
        {selected === jokerOrderChallenge.id && (
          <ChallengePlayer
            key={selected}
            definition={jokerOrderChallenge}
            onExit={back}
            renderBoard={(props) => <BlindsideChallengeBoard {...props} />}
          />
        )}
        {selected === poisonChallenge.id && (
          <ChallengePlayer
            key={selected}
            definition={poisonChallenge}
            onExit={back}
            renderBoard={(props) => <SpireChallengeBoard {...props} />}
          />
        )}
        {selected === positioningChallenge.id && (
          <ChallengePlayer
            key={selected}
            definition={positioningChallenge}
            onExit={back}
            renderBoard={(props) => <HearthChallengeBoard {...props} />}
          />
        )}
      </main>
    </div>
  );
}
