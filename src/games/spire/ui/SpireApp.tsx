import { RelicArt, PotionArt } from './WorldItemArt';
import { spirePacks } from '../../../mods/spire';
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
import { Playback } from '../../../shared/Playback';
import { Resolution } from './Resolution';
import { WorkshopTools } from '../../../app/WorkshopTools';
import { SPIRE_SCENARIOS } from '../application/scenario';
export function SpireApp({
  onSwitch,
  onChallenges,
}: {
  onSwitch: (id: GameId) => void;
  onChallenges: () => void;
}) {
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
      subtitle={`${run.character === 'silent' ? 'Silent' : 'Ironclad'} · Ascension ${run.ascension}`}
      gameId="spire"
      onSwitch={onSwitch}
      onChallenges={onChallenges}
      controls={game}
      tools={
        <WorkshopTools
          packs={spirePacks}
          game={game}
          scenarios={SPIRE_SCENARIOS}
          summary={(s) => ({
            Character: s.character,
            Ascension: s.ascension,
            Phase: s.phase,
            Act: s.act,
            Room: s.row + 1,
            HP: s.hp,
            Gold: s.gold,
            Cards: s.deck.length,
            Relics: s.relics.length,
          })}
        />
      }
      view={view}
      onView={setView}
      defaultSeed="IRONCLAD-01"
    >
      {view === 'collection' ? (
        <main className="content-page">
          <p className="eyebrow">TWO CHARACTERS · TWO WAYS TO CLIMB</p>
          <h2>Strength and steel. Poison and precision.</h2>
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
                <RelicArt id={r.id} />
                <h3>{r.name}</h3>
                <p>{r.text}</p>
              </article>
            ))}
          </div>
          <h2>Potions</h2>
          <div className="collection-grid">
            {Object.entries(POTIONS).map(([id, p]) => (
              <article className="catalogue-card" key={id}>
                <PotionArt id={id} />
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
              <h3>The Silent</h3>
              <p>
                Begin with 70 HP, five Strikes, five Defends, Survivor and Neutralize. Ring of the
                Snake draws two extra cards on the first turn. Build around Poison, Shivs, discard
                triggers or Dexterity.
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
                Artifact blocks one debuff application. Poison deals HP damage at the start of each
                enemy turn, then loses one stack. Blur preserves Block for the next turn. Manual
                discards can trigger Reflex and Tactician; end-turn cleanup does not.
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
                drawback. Ascensions accumulate: more elites at A1, normal/elite/boss attack
                increases at A2/A3/A4, and only 75% of missing HP restored between acts at A5. All
                levels are available immediately.
              </p>
            </article>
            <article>
              <h3>This playable edition</h3>
              <p>
                Ironclad and Silent, Ascensions 0–5, curated card pools and all nine Act I–III boss
                encounters. One boss is chosen per act and revealed on the map. Higher Ascensions,
                other characters, keys, Act IV and the remaining original content are not
                implemented.
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
                  {run.character.toUpperCase()} · A{run.ascension} · ACT {run.act} / 3 · ROOM{' '}
                  {Math.max(1, run.row + 1)} / 16
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
                  <RelicArt id={id} /> {RELIC_BY_ID[id].name}
                  {run.relicCounters[id] ? ` (${run.relicCounters[id]})` : ''}
                </span>
              ))}
            </div>
            <div className="adventure-notice" role="status">
              {run.notice}
            </div>
            <Playback
              key={`${game.timelineRevision}-${run.seed}-${run.resolution.sequence}`}
              frames={run.resolution.frames}
              label="Combat resolution"
              render={(frame) => <Resolution frame={frame} character={run.character} />}
            >
              {run.phase === 'map' ? (
                <RouteMap run={run} dispatch={game.dispatch} />
              ) : run.phase === 'combat' ? (
                <Battle
                  run={run}
                  dispatch={game.dispatch}
                  targetId={targetId}
                  onTarget={setTarget}
                />
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
                      <PotionArt id={p} /> {POTIONS[p].name}
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
            </Playback>
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
