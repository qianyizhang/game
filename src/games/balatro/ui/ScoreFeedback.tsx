import { JOKERS } from '../content/jokers';
import { SUITS, type ScoreStep } from '../domain/types';
import { JokerArt } from './art/jokers';
import { PokerArt } from './art/cards';
import './ScoreFeedback.css';

/** Illustrate a recorded label, never infer which owned instance caused it. */
function SourceArt({ source }: { source: string }) {
  const jokers = JOKERS.filter((joker) => joker.name === source);
  if (jokers.length === 1)
    return (
      <div className="score-source-art">
        <JokerArt id={jokers[0].id} />
      </div>
    );
  const card = /^(A|K|Q|J|10|[2-9]) (spades|hearts|clubs|diamonds)(?: · retrigger)?$/.exec(source);
  const suit = SUITS.find((suit) => suit === card?.[2]);
  if (!card || !suit || jokers.length) return null;
  const ranks: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11 };
  return (
    <div className={`score-source-art score-source-card ${suit}`}>
      <PokerArt rank={ranks[card[1]] ?? Number(card[1])} suit={suit} />
    </div>
  );
}

/** All values and effect wording come from the resolved trace. No scoring or clock here. */
export function ScoreFeedback({ step, previous }: { step: ScoreStep; previous?: ScoreStep }) {
  return (
    <div className="score-feedback">
      <div className="score-source">
        <SourceArt source={step.source} />
        <div className="score-source-copy">
          <span className="score-kicker">This effect</span>
          <h3>{step.source}</h3>
          <p>{step.detail}</p>
        </div>
      </div>
      <div className="score-running" aria-label="Running hand values">
        {(['chips', 'mult', 'cash'] as const).map((kind) => {
          const changed = step[kind] !== (previous?.[kind] ?? 0);
          return (
            <div className={`score-value score-${kind}${changed ? ' is-updated' : ''}`} key={kind}>
              <span className="score-value-label">
                {{ chips: 'Chips', mult: 'Mult', cash: 'Cash earned' }[kind]}
              </span>
              <strong>
                {kind === 'cash' ? '$' : ''}
                {kind === 'mult' ? Number(step.mult.toFixed(2)) : step[kind]}
              </strong>
              <small>{changed ? 'Updated' : 'Unchanged'}</small>
            </div>
          );
        })}
      </div>
      <p className="score-caption">
        Chips × Mult build this hand’s score. Effects resolve left to right.
      </p>
    </div>
  );
}
