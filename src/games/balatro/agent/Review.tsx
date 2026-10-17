import { blindsideSession } from '../application/session';
import { PolicyReview } from '../../../shared/policy/Review';
import type { Json } from '../../../shared/policy/types';
import { adapter, type EpisodeState } from './adapter';
import { builtins } from './policy';
import { JOKER_BY_ID } from '../content/jokers';
import { CONSUMABLE_BY_ID } from '../content/consumables';
import { currentBoss } from '../content/blinds';
import { PlayingCard } from '../ui/Card';

/** Passive game presentation: no live session hooks, commands, selection or persistence. */
function Board({ state: { state: run } }: { state: EpisodeState }) {
  const cards = new Map(run.deck.map((card) => [card.id, card]));
  return (
    <section className="policy-review-board" aria-label="Recorded Blindside table">
      <h2>
        Ante {run.ante} · {['Small Blind', 'Big Blind', currentBoss(run).name][run.blind]} ·{' '}
        {run.phase}
      </h2>
      <dl>
        <div>
          <dt>Score / target</dt>
          <dd>
            {run.roundScore.toLocaleString()} / {run.target.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt>Cash</dt>
          <dd>${run.cash}</dd>
        </div>
        <div>
          <dt>Hands / discards left</dt>
          <dd>
            {run.handsLeft} / {run.discardsLeft}
          </dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{run.difficulty ?? 'standard'}</dd>
        </div>
      </dl>
      <h3>Jokers · resolve left to right</h3>
      {run.jokers.length ? (
        <ol className="policy-review-jokers">
          {run.jokers.map((owned) => (
            <li key={owned.id}>
              <strong>{JOKER_BY_ID[owned.definitionId].name}</strong>
              <small>{JOKER_BY_ID[owned.definitionId].description}</small>
              {owned.growth ? <small>Growth {owned.growth}</small> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p>No Jokers owned.</p>
      )}
      <div className="policy-cards">
        {run.hand.map((id) => (
          <PlayingCard key={id} card={cards.get(id)!} disabled />
        ))}
      </div>
      {run.shop.length > 0 && (
        <>
          <h3>Shop offers</h3>
          <ul>
            {run.shop.map((offer) => (
              <li key={offer.id}>
                {offer.kind === 'joker'
                  ? JOKER_BY_ID[offer.definitionId].name
                  : CONSUMABLE_BY_ID[offer.definitionId].name}{' '}
                · ${offer.price}
              </li>
            ))}
          </ul>
        </>
      )}
      {run.pack && (
        <p>
          Open pack · {run.pack.choices.length} choices · {run.pack.remaining} selections left
        </p>
      )}
      {run.consumables.length > 0 && (
        <p>
          Consumables:{' '}
          {run.consumables.map((item) => CONSUMABLE_BY_ID[item.definitionId].name).join(', ')}
        </p>
      )}
      {run.lastScore && <p>Previous hand: {run.lastScore.total.toLocaleString()} points</p>}
    </section>
  );
}
function seek(replay: Json, cursor: number) {
  return blindsideSession.at(adapter.restore(replay), cursor);
}
const factories = Object.values(builtins);
const renderState = (state: EpisodeState) => <Board state={state} />;
export default function BlindsideReview() {
  return (
    <PolicyReview
      title="Blindside"
      gameHref="/?game=balatro"
      adapter={adapter}
      factories={factories}
      seek={seek}
      renderState={renderState}
    />
  );
}
