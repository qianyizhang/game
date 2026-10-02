import { ENEMY_BY_ID } from '../content/world';
import { CARD_BY_ID } from '../content/cards';
import type { Character, ResolutionFrame } from '../domain/types';
import { Portrait } from './Portrait';
import { statusText } from './statuses';

export function Resolution({ frame, character }: { frame: ResolutionFrame; character: Character }) {
  const { snapshot } = frame;
  return (
    <>
      <p className="eyebrow">
        TURN {snapshot.turn} · {snapshot.energy} ENERGY
      </p>
      <div className="resolution-fighters">
        <div className={`resolution-fighter ${frame.target === 'player' ? 'is-target' : ''}`}>
          <Portrait id={character} />
          <strong>{character === 'silent' ? 'Silent' : 'Ironclad'}</strong>
          <span>
            ♥ {snapshot.player.hp}/{snapshot.player.maxHp} · {snapshot.player.block} Block
          </span>
          <small>{statusText(snapshot.player.status)}</small>
        </div>
        {snapshot.enemies.map((e) => (
          <div
            key={e.id}
            className={`resolution-fighter ${frame.target === e.id ? 'is-target' : ''}`}
          >
            <Portrait id={e.definitionId} />
            <strong>{ENEMY_BY_ID[e.definitionId].name}</strong>
            <span>
              ♥ {e.hp}/{e.maxHp} · {e.block} Block
            </span>
            <small>{statusText(e.status)}</small>
            {e.hp === 0 && <small>{e.powers.rebirthing ? 'Preparing Rebirth' : 'Defeated'}</small>}
          </div>
        ))}
      </div>
      <div className="resolution-explanation" aria-live="polite">
        <strong>{frame.source}</strong>
        <p>{frame.detail}</p>
        {frame.formula && <code>{frame.formula}</code>}
      </div>
      <div className="resolution-hand" aria-label="Hand during resolution">
        {snapshot.hand.map((c) => (
          <span key={c.id}>
            {CARD_BY_ID[c.definitionId].name}
            {c.upgraded ? '+' : ''}
          </span>
        ))}
      </div>
      <p className="muted small">
        Draw {snapshot.draw} · Discard {snapshot.discard} · Exhaust {snapshot.exhaust}
      </p>
    </>
  );
}
