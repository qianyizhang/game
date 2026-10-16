import { PolicyReview } from '../../../shared/policy/Review';
import type { Json } from '../../../shared/policy/types';
import { ACT_NAMES, POTIONS, RELIC_BY_ID } from '../content/world';
import { DeckList } from '../ui/Card';
import { Battle } from '../ui/Combat';
import { RouteMap } from '../ui/Map';
import { Resolution } from '../ui/Resolution';
import { Room } from '../ui/Rooms';
import { PotionArt, RelicArt } from '../ui/WorldItemArt';
import { adapter, at, builtins, type EpisodeState } from './adapter';
import './review.css';

// Passive native components receive no command boundary or live session handle.
const noCommand = () => undefined;
const noTarget = () => undefined;
function Board({ state: { state: run } }: { state: EpisodeState }) {
  return (
    <section className="spire-theme spire-policy-board" aria-label="Recorded Spire table">
      <div className="table-area spire-table">
        <header className="round-strip">
          <div>
            <p className="eyebrow">
              {run.character} · Ascension {run.ascension} · Act {run.act} · Floor{' '}
              {Math.max(1, run.row + 1)} · {run.phase}
            </p>
            <h2>{ACT_NAMES[run.act - 1]}</h2>
          </div>
          <div className="adventure-resources">
            <span className="health">
              ♥ {run.hp}/{run.maxHp} HP
            </span>
            <span>{run.gold} gold</span>
            <span>{run.deck.length} cards</span>
          </div>
        </header>
        <div className="relic-rack">
          {run.relics.map((id) => (
            <span key={id} title={RELIC_BY_ID[id].text}>
              <RelicArt id={id} /> {RELIC_BY_ID[id].name}
              {run.relicCounters[id] ? ` (${run.relicCounters[id]})` : ''}
            </span>
          ))}
        </div>
        <p className="adventure-notice">{run.notice}</p>
        {run.phase === 'map' ? (
          <RouteMap run={run} dispatch={noCommand} readOnly />
        ) : run.phase === 'combat' ? (
          <Battle run={run} dispatch={noCommand} onTarget={noTarget} readOnly />
        ) : run.phase === 'won' || run.phase === 'lost' ? (
          <h3>{run.phase === 'won' ? 'Victory' : 'Defeat'} · recorded final state</h3>
        ) : (
          <fieldset disabled className="spire-recorded-choices">
            <legend>Recorded choices · use decision navigation to continue</legend>
            <Room run={run} dispatch={noCommand} />
          </fieldset>
        )}
        <div className="potion-belt">
          <span className="eyebrow">POTIONS {run.potions.length}/3</span>
          {run.potions.map((potion, index) => (
            <span key={`${index}-${potion}`} title={POTIONS[potion].text}>
              <PotionArt id={potion} /> {POTIONS[potion].name}
            </span>
          ))}
          {!run.potions.length && <small>Empty belt</small>}
        </div>
        {run.resolution.frames.length > 0 && (
          <details>
            <summary>Last command resolution · {run.resolution.frames.length} events</summary>
            {run.resolution.frames.map((frame, index) => (
              <details key={index}>
                <summary>
                  Event {index + 1} · {frame.source} · {frame.detail}
                </summary>
                <Resolution frame={frame} character={run.character} />
              </details>
            ))}
          </details>
        )}
        <details>
          <summary>Permanent deck · {run.deck.length} cards</summary>
          <DeckList run={run} />
        </details>
        <details>
          <summary>Recorded run log</summary>
          <ol className="event-log">
            {[...run.log].reverse().map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
        </details>
      </div>
    </section>
  );
}
function seek(replay: Json, cursor: number) {
  return at(adapter.restore(replay), cursor);
}
const factories = Object.values(builtins);
const renderState = (state: EpisodeState) => (
  <Board key={state.replay.commands.length} state={state} />
);
export default function SpireReview() {
  return (
    <PolicyReview
      title="Spire"
      gameHref="/?game=spire"
      adapter={adapter}
      factories={factories}
      seek={seek}
      renderState={renderState}
    />
  );
}
