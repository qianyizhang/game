import { useState } from 'react';
import type { ChallengeBoardProps } from '../../../app/ChallengePlayer';
import type { Command, RunState } from '../domain/types';
import { JOKER_BY_ID } from '../content/jokers';
import { JokerArt } from './Artwork';
import { PlayingCard } from './Card';
import { Playback } from '../../../shared/Playback';

export function BlindsideChallengeBoard({
  state,
  dispatch,
  finished,
}: ChallengeBoardProps<RunState, Command>) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      {!!state.lastScore && (
        <Playback
          key={state.handsPlayed}
          frames={state.lastScore.steps}
          label="Your scoring resolution"
          render={(step) => (
            <div className="resolution-explanation">
              <strong>{step.source}</strong>
              <p>{step.detail}</p>
              <span>
                {step.chips} chips × {step.mult} Mult
              </span>
            </div>
          )}
        >
          <p className="challenge-score">{state.lastScore.total} points</p>
        </Playback>
      )}
      {!finished && (
        <section className="challenge-table" aria-label="Blindside puzzle table">
          <div className="inventory-header">
            <span className="eyebrow">YOUR JOKERS · RESOLVE LEFT TO RIGHT</span>
            <strong>$25</strong>
          </div>
          <div className="joker-rack">
            {state.jokers.map((joker, index) => {
              const definition = JOKER_BY_ID[joker.definitionId];
              return (
                <article className="owned-joker" key={joker.id}>
                  <JokerArt id={definition.id} />
                  <h3>{definition.name}</h3>
                  <p>{definition.description}</p>
                  <div className="challenge-actions">
                    <button
                      aria-label={`Move ${definition.name} left`}
                      disabled={!index}
                      onClick={() => dispatch({ type: 'moveJoker', id: joker.id, direction: -1 })}
                    >
                      ←
                    </button>
                    <button
                      aria-label={`Move ${definition.name} right`}
                      disabled={index === state.jokers.length - 1}
                      onClick={() => dispatch({ type: 'moveJoker', id: joker.id, direction: 1 })}
                    >
                      →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <p>Choose exactly one card. Its score is revealed when you play.</p>
          <div className="challenge-hand">
            {state.hand.map((id) => (
              <PlayingCard
                key={id}
                card={state.deck.find((card) => card.id === id)!}
                selected={selected === id}
                onClick={() => setSelected(selected === id ? null : id)}
              />
            ))}
          </div>
          <button
            className="primary"
            disabled={!selected}
            onClick={() => selected && dispatch({ type: 'play', cards: [selected] })}
          >
            Play selected card
          </button>
        </section>
      )}
    </>
  );
}
