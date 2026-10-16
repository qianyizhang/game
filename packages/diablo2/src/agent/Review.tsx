import { useEffect, useRef } from 'react';
import { PolicyReview } from '../../../../src/shared/policy/Review';
import type { Json } from '../../../../src/shared/policy/types';
import { DIFFICULTIES } from '../domain/difficulty';
import { knownCell, visibleActor } from '../domain/maps';
import { currentWorld } from '../domain/world';
import { render, TILE, VIEW_HEIGHT, VIEW_WIDTH } from '../ui/render';
import { adapter, builtins, type EpisodeState } from './adapter';
import { emptyAliases, observe, terrainRows } from './observation';
import { createReviewSeeker } from './review-seek';
import './review.css';

/** The native canvas is passive and further restricted to the policy sensor.
 * Unknown terrain stays opaque even where native rendering dims adjacent tiles. */
function RecordedField({ state: { session, input } }: { state: EpisodeState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current || session.state.location !== 'field') return;
    const source = session.state;
    const original = currentWorld(source);
    const permitted = {
      ...original,
      enemies: original.enemies.filter((value) => visibleActor(original, source.player, value)),
      drops: original.drops.filter((value) => knownCell(original, value)),
      hazards: original.hazards.filter((value) => visibleActor(original, source.player, value)),
      projectiles: original.projectiles.filter((value) =>
        visibleActor(original, source.player, value),
      ),
      allies: original.allies.filter((value) => visibleActor(original, source.player, value)),
    };
    const view = { ...source, worlds: { ...source.worlds, [source.region]: permitted } };
    const camera = render(canvas.current, view, session.replay.content, false);
    const context = canvas.current.getContext('2d');
    if (!context) return;
    context.fillStyle = '#0d1214';
    terrainRows(input.region).forEach((row, y) =>
      [...row].forEach((tile, x) => {
        if (tile === '?')
          context.fillRect((x - camera.x) * TILE, (y - camera.y) * TILE, TILE + 1, TILE + 1);
      }),
    );
  }, [session, input]);
  return input.location === 'field' ? (
    <canvas
      ref={canvas}
      width={VIEW_WIDTH}
      height={VIEW_HEIGHT}
      aria-label="Recorded field, known terrain only"
    />
  ) : (
    <p>Lantern Refuge · safe town</p>
  );
}

function Board({ state }: { state: EpisodeState }) {
  const input = state.input;
  const player = input.player;
  const hero = input.definitions.heroes.find((definition) => definition.id === input.hero)!;
  return (
    <section className="emberwake-policy-board" aria-label="Recorded Emberwake journey">
      <header>
        <h2>{input.location === 'town' ? 'Lantern Refuge' : input.region.name}</h2>
        <p>
          {hero.name} · {hero.className} ·{' '}
          {DIFFICULTIES[state.session.state.difficulty ?? 'standard'].label} · Tick {input.tick} ·{' '}
          {input.status}
        </p>
        <p>
          Life {player.hp}/{input.stats.maxHp} · Mana {player.mana}/{input.stats.maxMana} · Level{' '}
          {player.level} · {player.gold} gold
        </p>
      </header>
      <RecordedField state={state} />
      <p>
        Reconstructed permitted view at this replay boundary. Exact original policy knowledge is
        retained below. Replay units count requested ticks and commands; executed tick time can stop
        earlier on death.
      </p>
      <section aria-label="Visible enemies">
        <h3>Visible enemies · {input.enemies.filter((enemy) => enemy.hp > 0).length}</h3>
        {input.enemies
          .filter((enemy) => enemy.hp > 0)
          .map((enemy) => (
            <p key={enemy.uid}>
              {input.definitions.monsters.find((definition) => definition.id === enemy.kind)
                ?.name ?? enemy.kind}{' '}
              · {enemy.hp}/{enemy.maxHp} life{enemy.warded ? ' · warded' : ''}
            </p>
          ))}
      </section>
      <section aria-label="Discovered objectives">
        <h3>Discovered objectives</h3>
        {input.markers.map((marker) => (
          <p key={`${marker.kind}-${marker.id}`}>
            {marker.kind} · {marker.id} · {marker.active ? 'active' : 'inactive'}
          </p>
        ))}
        {!input.markers.length && <p>No field markers discovered here.</p>}
      </section>
    </section>
  );
}
const factories = Object.values(builtins);
const nativeSeek = createReviewSeeker();
const seek = (replay: Json, cursor: number): EpisodeState => {
  const session = nativeSeek(replay, cursor);
  const aliases = emptyAliases();
  return { session, aliases, input: observe(session, aliases) };
};
const renderState = (state: EpisodeState) => <Board state={state} />;
export default function EmberwakeReview() {
  return (
    <PolicyReview
      title="Emberwake"
      gameHref="/?game=diablo2"
      adapter={adapter}
      factories={factories}
      seek={seek}
      renderState={renderState}
    />
  );
}
