import { PolicyReview } from '../../../shared/policy/Review';
import type { Json } from '../../../shared/policy/types';
import { ROOM_SIZE, sameCell, threshold } from '../../../shared/layout/layout';
import { chamber, ENEMIES, RELICS } from '../domain/content';
import { DIFFICULTIES } from '../domain/game';
import { adapter, at, builtins, type EpisodeState } from './adapter';
import '../ui/styles.css';
import './review.css';

/** Passive native tile styling receives only the reconstructed permitted view. */
function Board({ state }: { state: EpisodeState }) {
  const input = state.input;
  const room = input.room;
  const exits = input.frontiers.filter((frontier) => frontier.room === room.id);
  return (
    <section
      className="dc-app cartographer-policy-board"
      aria-label="Recorded Cartographer expedition"
    >
      <header>
        <p className="dc-eyebrow">
          RECORDED PERMITTED VIEW ·{' '}
          {DIFFICULTIES[state.session.state.difficulty ?? 'standard'].label}
        </p>
        <h2>{chamber(room.template).name}</h2>
        <p>
          Turn {input.turn} · {input.phase} · {input.status} · Life {input.player.hp}/
          {input.player.maxHp} · Focus {input.player.focus} · {input.cleared.length} rooms cleared ·
          Threat {input.threat}
        </p>
      </header>
      <div className="dc-board" role="group" aria-label="Recorded tactical room">
        {Array.from({ length: ROOM_SIZE * ROOM_SIZE }, (_, index) => {
          const x = room.x * ROOM_SIZE + (index % ROOM_SIZE);
          const y = room.y * ROOM_SIZE + Math.floor(index / ROOM_SIZE);
          const point = { x, y };
          const tile = input.tiles[y][x];
          const hero = sameCell(input.player, point);
          const enemy = input.enemies.find(
            (candidate) => candidate.hp > 0 && sameCell(candidate, point),
          );
          const danger = input.enemies.filter(
            (candidate) =>
              candidate.intent.kind === 'attack' &&
              candidate.intent.cells.some((cell) => sameCell(cell, point)),
          );
          const door = exits.find((frontier) =>
            sameCell(threshold(room, frontier.direction), point),
          );
          const label = `${x},${y}: ${hero ? 'Keeper' : enemy ? `${ENEMIES[enemy.kind].name}, ${enemy.hp} life` : door ? `${door.direction} doorway` : tile === '#' ? 'wall' : tile === '~' ? 'water' : 'floor'}${danger.length ? `; threatened for ${danger.reduce((sum, value) => sum + value.intent.damage, 0)}` : ''}`;
          return (
            <div
              key={index}
              role="img"
              aria-label={label}
              title={label}
              className={`dc-tile ${tile === '#' ? 'wall' : tile === '~' ? 'water' : 'floor'} ${hero ? 'hero' : ''} ${enemy ? 'enemy' : ''} ${danger.length ? 'danger' : ''} ${door ? 'door' : ''}`}
            >
              <span>
                {hero
                  ? '◈'
                  : enemy
                    ? ENEMIES[enemy.kind].symbol
                    : door
                      ? '↗'
                      : tile === '~'
                        ? '≈'
                        : ''}
              </span>
              {enemy && <small>{enemy.hp}</small>}
              {danger.length > 0 && <b className="dc-danger-dot">!</b>}
            </div>
          );
        })}
      </div>
      <p>
        ◈ Keeper · ! Announced attack · ≈ Water · ↗ Unexplored doorway. Reconstructed presentation;
        exact original policy input remains authoritative below.
      </p>
      <section aria-label="Recorded enemy intentions">
        <h3>Announced enemy intentions</h3>
        {input.enemies
          .filter((enemy) => enemy.hp > 0)
          .map((enemy) => (
            <p key={enemy.id}>
              {ENEMIES[enemy.kind].name} · {enemy.hp} life · {enemy.intent.kind}
              {enemy.intent.kind === 'attack' ? ` for ${enemy.intent.damage}` : ''}
            </p>
          ))}
        {!input.enemies.length && <p>No living enemies in this room.</p>}
      </section>
      {input.draft && (
        <section aria-label="Recorded room draft">
          <h3>Room draft</h3>
          {input.offers.map((id) => (
            <p key={id}>
              {chamber(id).name} · {chamber(id).description}
            </p>
          ))}
        </section>
      )}
      {input.relicOffers.length > 0 && (
        <section aria-label="Recorded relic offers">
          <h3>Relic offers</h3>
          {input.relicOffers.map((id) => (
            <p key={id}>{RELICS.find((relic) => relic.id === id)?.name}</p>
          ))}
        </section>
      )}
      <section aria-label="Recorded placed rooms">
        <h3>Placed rooms</h3>
        {input.layout.rooms.map((placed) => (
          <p key={placed.id}>
            {chamber(placed.template).name} · {placed.id}
            {input.cleared.includes(placed.id) ? ' · cleared' : ''}
          </p>
        ))}
      </section>
    </section>
  );
}
const factories = Object.values(builtins);
const seek = (replay: Json, cursor: number) => at(adapter.restore(replay), cursor);
const renderState = (state: EpisodeState) => <Board state={state} />;
export default function CartographerReview() {
  return (
    <PolicyReview
      title="Dungeon Cartographer"
      gameHref="/?game=cartographer"
      adapter={adapter}
      factories={factories}
      seek={seek}
      renderState={renderState}
    />
  );
}
