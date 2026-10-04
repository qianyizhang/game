import { Scouting } from './Scouting';
import { hearthPacks } from '../../../mods/hearth';
import { useState } from 'react';
import { GameShell } from '../../../app/GameShell';
import type { GameId } from '../../../app/GamePicker';
import { useLocalGame } from '../../../app/useLocalGame';
import { WorkshopTools } from '../../../app/WorkshopTools';
import { HEARTH_SCENARIOS } from '../application/scenario';
import { bgSession } from '../application/session';
import { HEROES, MINIONS, MINION_BY_ID } from '../content/minions';
import { makeUnit } from '../domain/units';
import { POOL_COPIES } from '../domain/recruitment';
import { MinionCard, minionKeywordText } from './MinionCard';
import { CombatPlayer } from './CombatPlayer';

export function BattlegroundsApp({
  onSwitch,
  onChallenges,
}: {
  onSwitch: (id: GameId) => void;
  onChallenges: () => void;
}) {
  const game = useLocalGame(bgSession, 'HEARTH-01');
  const run = game.state;
  const player = run.players[0];
  const [view, setView] = useState<'play' | 'collection' | 'guide'>('play');
  const [tab, setTab] = useState('Lobby');
  const [selected, setSelected] = useState<string | null>(null);
  const [position, setPosition] = useState(7);
  const [query, setQuery] = useState('');
  const [tribe, setTribe] = useState('all');
  const target = player.board.find((u) => u.id === selected) ?? player.board[0];
  const hero = HEROES.find((h) => h.id === player.hero)!;
  const terminal = run.phase === 'won' || run.phase === 'lost';
  const pending = player.discover.length > 0;
  return (
    <GameShell
      title="Last Hearth"
      subtitle="A Battlegrounds study"
      gameId="battlegrounds"
      onSwitch={onSwitch}
      onChallenges={onChallenges}
      controls={game}
      tools={
        <WorkshopTools
          packs={hearthPacks}
          game={game}
          scenarios={HEARTH_SCENARIOS}
          summary={(s) => ({
            Phase: s.phase,
            Round: s.round,
            HP: s.players[0].hp,
            Tier: s.players[0].tier,
            Gold: s.players[0].gold,
            Board: s.players[0].board.length,
            Players: s.players.filter((p) => p.hp > 0).length,
          })}
        />
      }
      view={view}
      onView={setView}
      defaultSeed="HEARTH-01"
    >
      {view === 'collection' ? (
        <main className="content-page">
          <p className="eyebrow">THE LAST HEARTH COLLECTION</p>
          <h2>Build a warband with a plan.</h2>
          <p className="muted">
            {MINIONS.filter((m) => !m.token).length} recruits across six tiers,{' '}
            {MINIONS.filter((m) => m.token).length} summoned tokens, and {HEROES.length} heroes.
            Golden minions double base stats and bonuses, and summon golden tokens.
          </p>
          <div className="collection-controls">
            <input
              aria-label="Search collection"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search effects and minions…"
            />
            <select
              aria-label="Filter tribe"
              value={tribe}
              onChange={(e) => setTribe(e.target.value)}
            >
              {['all', 'beast', 'mech', 'demon', 'elemental', 'neutral'].map((t) => (
                <option value={t} key={t}>
                  {t === 'all' ? 'All tribes' : t}
                </option>
              ))}
            </select>
          </div>
          <div className="minion-catalogue">
            {MINIONS.filter(
              (m) =>
                (tribe === 'all' || m.tribe === tribe || m.tribe === 'all') &&
                `${m.name} ${m.text}`.toLowerCase().includes(query.toLowerCase()),
            ).map((m) => (
              <MinionCard
                key={m.id}
                unit={makeUnit(m.id, m.id)}
                footnote={
                  m.token ? 'Summoned only' : `${POOL_COPIES[m.tier]} copies in the shared pool`
                }
              />
            ))}
          </div>
        </main>
      ) : view === 'guide' ? (
        <main className="content-page workshop-page">
          <p className="eyebrow">RULES & WORKSHOP</p>
          <h1>
            Recruit a plan.
            <br />
            <em>Watch it unfold.</em>
          </h1>
          <div className="workshop-grid">
            <article>
              <h3>The tavern economy</h3>
              <p>
                Buy for 3 gold, sell a deployed minion for 1, refresh for 1, freeze for free. Gold
                resets each round, growing from 3 to 10. Upgrading unlocks higher-tier offers on
                future refreshes and increases shop size. Upgrade costs fall by 1 each new round.
                Frozen offers stay while empty slots refill; refreshing clears the freeze.
              </p>
              <p>
                All eight players draw from a finite shared pool. Offers reserve copies. Selling,
                refreshing, unchosen Discover options, and elimination return those copies. Golden
                minions contain three copies; tokens contain none.
              </p>
            </article>
            <article>
              <h3>Triples and positioning</h3>
              <p>
                Three non-golden copies across hand and board automatically become one golden minion
                in hand, preserving buffs. Playing it grants a free choice from the next tier
                (maximum 6). Battlecries happen on play; deathrattles happen in combat.
              </p>
              <p>
                Seven board slots, ten hand slots. Place support minions behind attackers, use Taunt
                to protect them, and aim Cleave through enemy formations. Golden bonuses double and
                summons become golden tokens; Windfury still means two swings.
              </p>
            </article>
            <article>
              <h3>Automatic combat</h3>
              <p>
                The larger warband attacks first; ties use seeded randomness. Eligible minions
                rotate left to right; newly summoned minions join the rotation. Attacks alternate
                sides, with random targets constrained by Taunt. Damage is simultaneous.
              </p>
              <p>
                All dead minions leave both boards before death triggers resolve, attacking side
                first. Deathrattles then Reborn resolve at each minion’s position. Summons stop at
                seven slots. Combat-only wounds, buffs and summons never change the tavern warband.
              </p>
            </article>
            <article>
              <h3>Finish the lobby</h3>
              <p>
                A winner deals tavern tier plus the tiers of surviving minions as hero damage.
                Eliminated players return their pool copies. An odd remaining field faces a snapshot
                of the latest eliminated warband.
              </p>
              <p>
                After round 15, all remaining heroes also lose escalating fatigue HP each round,
                bounding the local game. Simultaneous eliminations rank by remaining HP, then stable
                player order. Reach first place to win.
              </p>
            </article>
            <article>
              <h3>Make a new minion</h3>
              <p>
                Open <code>src/games/battlegrounds/content/minions.ts</code>. Edit stats, keywords,
                battlecries, deathrattles or named hooks. Catalogue and pool registration follow the
                data.
              </p>
              <p>
                New timing belongs in <code>domain/combat.ts</code> or{' '}
                <code>domain/recruitment.ts</code>, with examples proving the intended interaction.
                Bump the rules version when replay meaning changes.
              </p>
            </article>
            <article>
              <h3>Know the boundaries</h3>
              <p>
                This is a curated foundational Battlegrounds study. There are no seasonal systems,
                spells, real-time recruiting timer or network opponents. Bots use the same legal
                recruitment commands and shared supply. Combat replays are inspectable and
                reproducible.
              </p>
            </article>
          </div>
        </main>
      ) : (
        <main className="game-layout">
          <div className="table-area hearth-table">
            <div className="round-strip">
              <div>
                <span className="eyebrow">
                  ROUND {run.round} · {run.players.filter((p) => p.hp > 0).length} / 8 REMAIN
                </span>
                <h2>Last Hearth</h2>
              </div>
              <div className="adventure-resources">
                <span className="health">♥ {Math.max(0, player.hp)}</span>
                <span>¢ {player.gold}</span>
                <span>★ {player.tier}</span>
              </div>
            </div>
            <div className="adventure-notice" role="status">
              {run.notice}
            </div>
            {run.phase === 'hero' && (
              <section className="choice-panel hero-selection">
                <p className="eyebrow">EIGHT PLAYERS. ONE LAST HEARTH.</p>
                <h1>Who will lead your warband?</h1>
                <p className="muted">
                  Choose a hero, recruit a team, and outlast seven local rivals.
                </p>
                <div className="hero-choices">
                  {HEROES.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => game.dispatch({ type: 'chooseHero', hero: h.id })}
                    >
                      <span>{h.symbol}</span>
                      <h3>{h.name}</h3>
                      <p>{h.text}</p>
                      <strong>Choose hero →</strong>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {run.phase === 'recruit' && (
              <>
                <Scouting run={run} />
                <div className="tavern-tools">
                  <div>
                    <span className="eyebrow">{hero.name}</span>
                    <p>{hero.text}</p>
                  </div>
                  <button
                    disabled={
                      pending ||
                      player.powerUsed ||
                      player.gold < hero.cost ||
                      hero.ability.type === 'income'
                    }
                    onClick={() => game.dispatch({ type: 'power', target: target?.id })}
                  >
                    {hero.ability.type === 'income'
                      ? 'Passive active'
                      : player.powerUsed
                        ? 'Power used'
                        : `Hero power · ${hero.cost} gold`}
                  </button>
                </div>
                {pending ? (
                  <section className="discover-panel">
                    <p className="eyebrow">A GOLDEN OPPORTUNITY</p>
                    <h2>Discover one minion. It costs nothing.</h2>
                    <div className="tavern-offers">
                      {player.discover.map((unit) => (
                        <MinionCard
                          key={unit.id}
                          unit={unit}
                          onClick={() => game.dispatch({ type: 'discover', id: unit.id })}
                          footnote="Choose this reward"
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className={`tavern ${player.frozen ? 'frozen' : ''}`}>
                    <div className="tavern-header">
                      <div>
                        <p className="eyebrow">THE TAVERN · TIER {player.tier}</p>
                        <h2>
                          {player.frozen ? 'Keeping these on ice.' : 'A good team starts here.'}
                        </h2>
                      </div>
                      <div>
                        <button
                          disabled={player.gold < 1}
                          onClick={() => game.dispatch({ type: 'refresh' })}
                        >
                          ↻ Refresh · 1
                        </button>
                        <button
                          aria-pressed={player.frozen}
                          onClick={() => game.dispatch({ type: 'freeze' })}
                        >
                          {player.frozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </div>
                    </div>
                    <div className="tavern-offers">
                      {player.shop.map((unit) => (
                        <MinionCard
                          key={unit.id}
                          unit={unit}
                          disabled={player.gold < 3 || player.hand.length >= 10}
                          onClick={() => game.dispatch({ type: 'buy', id: unit.id })}
                          footnote="Recruit · 3 gold"
                        />
                      ))}
                      {!player.shop.length && (
                        <p className="empty">No minions on offer. Refresh to find more.</p>
                      )}
                    </div>
                    <button
                      className="upgrade-tavern"
                      disabled={player.tier === 6 || player.gold < player.upgradeCost}
                      onClick={() => game.dispatch({ type: 'upgrade' })}
                    >
                      {player.tier === 6
                        ? 'Maximum tavern tier'
                        : `Upgrade to tier ${player.tier + 1} · ${player.upgradeCost} gold`}
                    </button>
                  </section>
                )}
                <section className="warband-panel">
                  <div className="inventory-header">
                    <span className="eyebrow">YOUR WARBAND · {player.board.length}/7</span>
                    <span>Attack order → · select a target for buffs</span>
                  </div>
                  <div className="warband">
                    {player.board.map((unit, index) => (
                      <div className="warband-slot" key={unit.id}>
                        <MinionCard
                          unit={unit}
                          compact
                          selected={target?.id === unit.id}
                          onClick={() => setSelected(unit.id)}
                        />
                        <div className="unit-controls">
                          <button
                            aria-label={`Move minion ${index + 1} left`}
                            disabled={index === 0 || pending}
                            onClick={() =>
                              game.dispatch({ type: 'move', id: unit.id, direction: -1 })
                            }
                          >
                            ←
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => game.dispatch({ type: 'sell', id: unit.id })}
                          >
                            Sell · 1
                          </button>
                          <button
                            aria-label={`Move minion ${index + 1} right`}
                            disabled={index === player.board.length - 1 || pending}
                            onClick={() =>
                              game.dispatch({ type: 'move', id: unit.id, direction: 1 })
                            }
                          >
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: 7 - player.board.length }, (_, i) => (
                      <div className="empty-minion" key={i}>
                        +<small>SLOT {player.board.length + i + 1}</small>
                      </div>
                    ))}
                  </div>
                  {target && (
                    <div className="selected-minion-detail">
                      <strong>
                        {MINION_BY_ID[target.definitionId].name}
                        {target.golden ? ' · Golden' : ''}
                      </strong>
                      <span>
                        {MINION_BY_ID[target.definitionId].text}
                        {target.golden ? ' Double stats and bonuses; summons golden tokens.' : ''}
                      </span>
                      {target.keywords.length > 0 && (
                        <span>Active keywords: {minionKeywordText(target)}</span>
                      )}
                    </div>
                  )}
                  <div className="hand-header">
                    <span className="eyebrow">IN HAND · {player.hand.length}/10</span>
                    <label>
                      Play position{' '}
                      <select
                        aria-label="Play position"
                        value={position}
                        onChange={(e) => setPosition(Number(e.target.value))}
                      >
                        <option value={7}>Rightmost</option>
                        {player.board.map((_, i) => (
                          <option key={i} value={i}>
                            Position {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="recruit-hand">
                    {player.hand.map((unit) => (
                      <MinionCard
                        unit={unit}
                        key={unit.id}
                        disabled={pending || player.board.length >= 7}
                        onClick={() =>
                          game.dispatch({
                            type: 'play',
                            id: unit.id,
                            position: Math.min(position, player.board.length),
                            target: target?.id,
                          })
                        }
                        footnote={
                          unit.tripleReward
                            ? 'Play → Discover a higher-tier minion'
                            : 'Click to deploy'
                        }
                      />
                    ))}
                    {!player.hand.length && (
                      <p className="muted small">
                        Buy a minion, then click it here to put it on the board.
                      </p>
                    )}
                  </div>
                </section>
                <div className="recruit-footer">
                  <p className="muted small">
                    Unused gold is lost when the next round begins. Your permanent warband returns
                    after combat.
                  </p>
                  <button
                    className="primary"
                    disabled={pending}
                    onClick={() => game.dispatch({ type: 'endRecruit' })}
                  >
                    Ready · fight →
                  </button>
                </div>
              </>
            )}
            {(run.phase === 'combat' || terminal) && (
              <>
                {terminal && (
                  <section className="lobby-ending">
                    <p className="eyebrow">
                      {run.phase === 'won'
                        ? 'THE LAST HEARTH IS YOURS'
                        : 'A WAR STORY TO LEARN FROM'}
                    </p>
                    <h1>
                      {run.phase === 'won' ? 'First place.' : `You placed #${player.placement}.`}
                    </h1>
                    <p>
                      {run.phase === 'won'
                        ? 'Your warband outlasted the lobby.'
                        : 'Inspect the final combat, then try a new composition.'}
                    </p>
                  </section>
                )}
                {run.lastCombat && (
                  <CombatPlayer
                    result={run.lastCombat}
                    opponent={
                      run.opponent === null ? 'the ghost warband' : run.players[run.opponent].name
                    }
                  />
                )}
                {!terminal && (
                  <button
                    className="primary next-recruit"
                    onClick={() => game.dispatch({ type: 'nextRound' })}
                  >
                    Return to tavern · round {run.round + 1} →
                  </button>
                )}
                {terminal && (
                  <p className="muted small">
                    Use New run for a fresh lobby. Export saves the full action history.
                  </p>
                )}
              </>
            )}
            <p className="seed-note">
              SEED {run.seed} · Finite shared supply · Separate combat snapshots
            </p>
          </div>
          <aside className="inspector">
            <p className="eyebrow">THE LOBBY, EXPLAINED</p>
            <div className="tabs inspector-tabs">
              {['Lobby', 'Log', 'Pool'].map((label) => (
                <button
                  className={label === tab ? 'active' : ''}
                  key={label}
                  onClick={() => setTab(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === 'Lobby' ? (
              <>
                <h3>Eight seats at the hearth.</h3>
                <div className="lobby-list">
                  {[...run.players]
                    .sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0) || b.hp - a.hp)
                    .map((p) => (
                      <div
                        className={`${p.id === 0 ? 'you' : ''} ${p.hp <= 0 ? 'eliminated' : ''}`}
                        key={p.id}
                      >
                        <span>{HEROES.find((h) => h.id === p.hero)!.symbol}</span>
                        <div>
                          <strong>
                            {p.name}
                            {p.id === 0 ? ' (you)' : ''}
                          </strong>
                          <small>
                            {p.placement
                              ? `Place ${p.placement}`
                              : `Tier ${p.tier} · ${p.board.length} minions`}
                          </small>
                        </div>
                        <b>{Math.max(0, p.hp)} ♥</b>
                      </div>
                    ))}
                </div>
                <h4>Last round</h4>
                {run.matchups.map((m, i) => (
                  <p className="match-result" key={i}>
                    {run.players[m.left].name} vs{' '}
                    {m.right === null ? 'Ghost' : run.players[m.right].name}
                    <br />
                    {m.winner === null
                      ? m.ghost && m.damage
                        ? 'Ghost won'
                        : 'Tie'
                      : `${run.players[m.winner].name} won`}{' '}
                    · {m.damage} damage
                  </p>
                ))}
                {run.round > 15 && (
                  <p className="small muted">
                    Fatigue: {run.round - 15} HP per hero this round, increasing each round.
                  </p>
                )}
              </>
            ) : tab === 'Log' ? (
              <>
                <h3>Recruitment notebook</h3>
                <ol className="run-log">
                  {run.log
                    .slice()
                    .reverse()
                    .map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                </ol>
              </>
            ) : (
              <>
                <h3>Shared minion supply</h3>
                <p className="muted small">
                  Available copies, excluding offers, hands, boards and pending Discover options.
                  Every player uses this same pool.
                </p>
                <div className="pool-list">
                  {Object.entries(run.pool).map(([id, count]) => (
                    <div key={id}>
                      <span>{MINION_BY_ID[id].name}</span>
                      <b>
                        {count}/{POOL_COPIES[MINION_BY_ID[id].tier]}
                      </b>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </main>
      )}
    </GameShell>
  );
}
