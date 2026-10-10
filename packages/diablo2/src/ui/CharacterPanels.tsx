import type { Attribute, Command, Content, Item, State } from '../domain/types';
import { stats } from '../domain/stats';
interface Props {
  state: State;
  content: Content;
  send: (command: Command) => void;
}
function itemSummary(item: Item): string {
  return [
    item.damage ? `${item.damage} damage` : null,
    item.armor ? `${item.armor} armor` : null,
    item.vitality ? `+${item.vitality} vitality` : null,
    item.energy ? `+${item.energy} energy` : null,
    item.resist ? `+${item.resist}% resist` : null,
    item.leech ? `${item.leech}% melee leech` : null,
    `${item.runes}/${item.sockets} sockets`,
  ]
    .filter(Boolean)
    .join(' · ');
}
export function InventoryPanel({ state, send }: Props) {
  const p = state.player;
  const gearCard = (item: Item, source: 'bag' | 'gear' | 'stash') => (
    <article className={`ew-item ${item.rarity}`} key={item.uid}>
      <strong>{item.name}</strong>
      <small>
        {item.rarity} {item.slot} · {item.width}×{item.height}
        {item.requiredStrength ? ` · requires ${item.requiredStrength} STR` : ''}
      </small>
      <p>{itemSummary(item)}</p>
      <div>
        {source === 'bag' ? (
          <>
            <button onClick={() => send({ type: 'equip', uid: item.uid })}>Equip</button>
            {state.location === 'town' ? (
              <>
                <button onClick={() => send({ type: 'sell', uid: item.uid })}>
                  Sell · {item.value}g
                </button>
                <button onClick={() => send({ type: 'stash', uid: item.uid })}>Stash</button>
              </>
            ) : (
              <button onClick={() => send({ type: 'drop', uid: item.uid })}>Drop</button>
            )}
          </>
        ) : source === 'stash' ? (
          <button onClick={() => send({ type: 'withdraw', uid: item.uid })}>Withdraw</button>
        ) : state.location === 'town' ? (
          <button
            disabled={p.runes === 0 || item.runes >= item.sockets}
            onClick={() => send({ type: 'socket', uid: item.uid })}
          >
            Socket ember rune
          </button>
        ) : null}
      </div>
    </article>
  );
  return (
    <>
      <p>
        {p.gold} gold · {p.runes} ember runes · 8×4 inventory.{' '}
        {state.location === 'town'
          ? 'Quartermaster and stash available.'
          : 'Return to the refuge to sell, stash, or socket.'}
      </p>
      <h3>Equipped</h3>
      <div className="ew-items">
        {Object.values(p.equipment).map((item) => gearCard(item, 'gear'))}
      </div>
      <h3>Backpack</h3>
      <div className="ew-bag" aria-label="8 by 4 backpack">
        {Array.from({ length: 32 }, (_, cell) => (
          <span
            key={cell}
            style={{ gridColumn: (cell % 8) + 1, gridRow: Math.floor(cell / 8) + 1 }}
          />
        ))}
        {p.inventory.map((item) => (
          <button
            title={item.name + ' · ' + itemSummary(item)}
            className={item.rarity}
            key={item.uid}
            style={{
              gridColumn: `${(item.cell % 8) + 1} / span ${item.width}`,
              gridRow: `${Math.floor(item.cell / 8) + 1} / span ${item.height}`,
            }}
            onClick={() => send({ type: 'equip', uid: item.uid })}
          >
            {item.slot === 'weapon' ? '⚔' : item.slot === 'armor' ? '◇' : '✧'}
            <small>{item.name}</small>
          </button>
        ))}
      </div>
      <div className="ew-items">
        {p.inventory.map((item) => gearCard(item, 'bag'))}
        {p.inventory.length === 0 && (
          <p>Your backpack is empty. Walk over dropped loot to collect it.</p>
        )}
      </div>
      {state.location === 'town' && (
        <>
          <h3>Personal stash · {p.stash.length}/64</h3>
          <div className="ew-items">
            {p.stash.map((item) => gearCard(item, 'stash'))}
            {!p.stash.length && <p>Your stash is empty.</p>}
          </div>
        </>
      )}
    </>
  );
}
const attributes: Attribute[] = ['strength', 'dexterity', 'vitality', 'energy'];
export function CharacterPanel({ state, content: pack, send }: Props) {
  const p = state.player,
    s = stats(state, pack),
    h = pack.heroes.find((h) => h.id === state.hero)!;
  return (
    <>
      <p>
        Level {p.level} · {s.damage} basic damage · {s.armor} armor · {s.resist}% elemental
        resistance
      </p>
      <h3>Attributes · {p.statPoints} points available</h3>
      <div className="ew-attributes">
        {attributes.map((a) => (
          <div key={a}>
            <strong>{a}</strong>
            <span>{p.attributes[a]}</span>
            <small>
              {a === 'strength'
                ? 'Physical damage and gear requirements'
                : a === 'dexterity'
                  ? 'Attack speed and armor'
                  : a === 'vitality'
                    ? '5 life per point'
                    : '3 mana per point and spell damage'}
            </small>
            <button
              aria-label={`Increase ${a}`}
              disabled={!p.statPoints}
              onClick={() => send({ type: 'attribute', attribute: a })}
            >
              +
            </button>
          </div>
        ))}
      </div>
      <h3>Skills · {p.skillPoints} points available</h3>
      <div className="ew-skill-tree">
        {h.skills.map((id) => {
          const skill = pack.skills.find((s) => s.id === id)!;
          return (
            <article key={id}>
              <strong>
                {skill.name} <span>Rank {p.skills[id] ?? 0}/10</span>
              </strong>
              <p>{skill.description}</p>
              <small>
                Level {skill.level} · {skill.mana} mana · {(skill.cooldown / 10).toFixed(1)}s
                recovery · {skill.element}
              </small>
              <button
                disabled={!p.skillPoints || p.level < skill.level || (p.skills[id] ?? 0) >= 10}
                onClick={() => send({ type: 'learn', skill: id })}
              >
                Invest skill point
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
