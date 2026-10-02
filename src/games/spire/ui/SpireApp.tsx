import { useState } from 'react';
import { GameShell } from '../../../app/GameShell';
import type { GameId } from '../../../app/GamePicker';
import { useLocalGame } from '../../../app/useLocalGame';
import { spireSession } from '../application/session';
import { CARDS } from '../content/cards';
import { ACT_NAMES, POTIONS, RELICS, RELIC_BY_ID } from '../content/world';
import { aliveEnemies } from '../domain/combat';
import { AbilityCard, DeckList } from './Card';
import { Battle } from './Combat';
import { RouteMap } from './Map';
import { Room } from './Rooms';
export function SpireApp({ onSwitch }: { onSwitch: (id: GameId) => void }) {
  const game = useLocalGame(spireSession, 'IRONCLAD-01'),
    run = game.state;
  const [view, setView] = useState<'play' | 'collection' | 'guide'>('play');
  const [target, setTarget] = useState<string | null>(null);
  const [tab, setTab] = useState('Log');
  const [query, setQuery] = useState('');
  const enemies = aliveEnemies(run);
  const targetId = enemies.some((e) => e.id === target) ? target! : enemies[0]?.id;
  return (
    <GameShell
      title="Slay the Spire"
      subtitle="Ironclad · Ascension 0"
      gameId="spire"
      onSwitch={onSwitch}
      controls={game}
      view={view}
      onView={setView}
      defaultSeed="IRONCLAD-01"
    >
      {view === 'collection' ? (
        <main className="content-page">
          <p className="eyebrow">IRONCLAD COLLECTION</p>
          <h2>Strength. Block. Exhaust.</h2>
          <p className="muted">
            {CARDS.filter((c) => !c.token).length} obtainable cards · {RELICS.length} relics ·{' '}
            {Object.keys(POTIONS).length} potions
          </p>
          <input
            aria-label="Search collection"
            placeholder="Search cards and effects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="ability-grid">
            {CARDS.filter((c) =>
              `${c.name} ${c.text} ${c.family}`.toLowerCase().includes(query.toLowerCase()),
            ).map((c) => (
              <AbilityCard key={c.id} definition={c} footnote={`Upgrade: ${c.upgradeText}`} />
            ))}
          </div>
          <h2>Relics</h2>
          <div className="collection-grid">
            {RELICS.map((r) => (
              <article className="catalogue-card" key={r.id}>
                <span className="catalogue-symbol">{r.symbol}</span>
                <h3>{r.name}</h3>
                <p>{r.text}</p>
              </article>
            ))}
          </div>
          <h2>Potions</h2>
          <div className="collection-grid">
            {Object.entries(POTIONS).map(([id, p]) => (
              <article className="catalogue-card" key={id}>
                <h3>{p.name}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </main>
      ) : view === 'guide' ? (
        <main className="content-page workshop-page">
          <p className="eyebrow">ORIGINAL SLAY THE SPIRE</p>
          <h1>Every card is a decision.</h1>
          <div className="workshop-grid">
            <article>
              <h3>The Ironclad</h3>
              <p>
                Begin with 80 HP, 99 gold, five Strikes, four Defends, Bash, and Burning Blood.
                Choose Neow’s blessing, then climb three acts. Burning Blood heals 6 after every
                combat.
              </p>
              <h3>Your turn</h3>
              <p>
                Refill 3 Energy and draw 5 cards. Select a target and play cards. End Turn discards
                your hand; enemies execute their visible intents. Block normally expires at your
                next turn. Potions use no Energy.
              </p>
            </article>
            <article>
              <h3>Cards and timing</h3>
              <p>
                When the draw pile empties, shuffle the discard pile. Exhaust removes a card until
                combat ends. Powers leave the cycle without triggering Exhaust. Ethereal cards
                exhaust if left in hand. The hand limit is 10.
              </p>
              <p>
                Strength adds damage per hit; Weak reduces attack damage by 25%; Vulnerable
                increases it by 50%. Dexterity adds Block from cards, and Frail reduces it by 25%.
                Artifact blocks one debuff application.
              </p>
            </article>
            <article>
              <h3>Build a run</h3>
              <p>
                Follow connected routes through 15 rooms and a boss in each act. Elites grant
                relics. Card rewards are optional. Rest heals 30% Max HP; Smith permanently upgrades
                a card. Shops offer purchases and removal, starting at 75 gold and increasing by 25
                each time.
              </p>
              <p>
                Acts 1 and 2 end with a rare card choice and a boss relic choice. Read the relic’s
                drawback. Ascension 0 restores all HP between acts.
              </p>
            </article>
            <article>
              <h3>This playable edition</h3>
              <p>
                Ironclad, Ascension 0, with 57 obtainable cards, 32 relics, and curated enemies and
                events. Boss route: Slime Boss → The Champ → Donu and Deca. Other characters,
                Ascensions, keys, Act IV, and the remaining original content are not implemented.
              </p>
              <p>
                Original code and illustrations; a local learning project, unaffiliated with Mega
                Crit. Rules sources and deliberate simplifications live in{' '}
                <code>docs/research/slay-the-spire.md</code>. Start modding in{' '}
                <code>src/games/spire/content</code>.
              </p>
            </article>
          </div>
        </main>
      ) : (
        <main className="game-layout">
          <div className="table-area spire-table">
            <div className="round-strip">
              <div>
                <span className="eyebrow">
                  IRONCLAD · ACT {run.act} / 3 · ROOM {Math.max(1, run.row + 1)} / 16
                </span>
                <h2>{ACT_NAMES[run.act - 1]}</h2>
              </div>
              <div className="adventure-resources">
                <span className="health">
                  ♥ {run.hp}/{run.maxHp}
                </span>
                <span>¢ {run.gold}</span>
                <span>▤ {run.deck.length}</span>
              </div>
            </div>
            <div className="relic-rack">
              {run.relics.map((id) => (
                <span key={id} title={RELIC_BY_ID[id].text}>
                  {RELIC_BY_ID[id].symbol} {RELIC_BY_ID[id].name}
                  {run.relicCounters[id] ? ` (${run.relicCounters[id]})` : ''}
                </span>
              ))}
            </div>
            <div className="adventure-notice" role="status">
              {run.notice}
            </div>
            {run.phase === 'map' ? (
              <RouteMap run={run} dispatch={game.dispatch} />
            ) : run.phase === 'combat' ? (
              <Battle run={run} dispatch={game.dispatch} targetId={targetId} onTarget={setTarget} />
            ) : (
              <Room run={run} dispatch={game.dispatch} />
            )}
            <div className="potion-belt">
              <span className="eyebrow">POTIONS {run.potions.length}/3</span>
              {run.potions.map((p, index) => (
                <div key={`${index}-${p}`}>
                  <button
                    title={POTIONS[p].text}
                    disabled={run.phase !== 'combat' || !!run.combat?.choice}
                    onClick={() =>
                      game.dispatch({
                        type: 'potion',
                        index,
                        target: POTIONS[p].target ? targetId : undefined,
                      })
                    }
                  >
                    {POTIONS[p].name}
                  </button>
                  <button
                    aria-label={`Discard ${POTIONS[p].name}`}
                    disabled={['won', 'lost'].includes(run.phase) || !!run.combat?.choice}
                    onClick={() => game.dispatch({ type: 'discardPotion', index })}
                  >
                    ×
                  </button>
                </div>
              ))}
              {!run.potions.length && <small>Empty belt</small>}
            </div>
          </div>
          <aside className="inspector">
            <div className="inspector-tabs">
              {['Log', 'Deck'].map((t) => (
                <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            {tab === 'Deck' ? (
              <>
                <h3>Permanent deck · {run.deck.length}</h3>
                <DeckList run={run} />
              </>
            ) : (
              <>
                <p className="eyebrow">COMBAT & RUN LOG</p>
                <ol className="event-log">
                  {[...run.log].reverse().map((line, i) => (
                    <li key={`${i}-${line}`}>{line}</li>
                  ))}
                </ol>
              </>
            )}
            <div className="inspector-help">
              <strong>Read the next move.</strong>
              <p>
                Enemy intent shows the next action before your Block. Select an enemy to aim
                targeted cards and potions.
              </p>
            </div>
          </aside>
        </main>
      )}
    </GameShell>
  );
}
