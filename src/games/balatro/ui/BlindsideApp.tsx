import { blindsidePacks } from '../../../mods/blindside';
import { useState } from 'react';
import { useLocalGame } from '../../../app/useLocalGame';
import { GameShell } from '../../../app/GameShell';
import { blindsideSession } from '../application/session';
import { scoreHand } from '../domain/scoring';
import type { Command } from '../domain/types';
import { Table } from './Table';
import { Inspector } from './Inspector';
import { Collection } from './Collection';
import type { GameId } from '../../../app/GamePicker';
import { Playback } from '../../../shared/Playback';
import { WorkshopTools } from '../../../app/WorkshopTools';
import { BLINDSIDE_SCENARIOS } from '../application/scenario';

type View = 'play' | 'collection' | 'guide';

function Workshop() {
  return (
    <div className="workshop-page">
      <p className="eyebrow">PLAY · UNDERSTAND · CHANGE</p>
      <h1>
        Make it
        <br />
        <em>your game.</em>
      </h1>
      <p className="lead">
        A little laboratory for big card-game ideas. Start with an effect you can see, then follow
        it into the code.
      </p>
      <div className="workshop-grid">
        <article>
          <span className="section-number">01</span>
          <h3>Change one card</h3>
          <p>
            Jokers live in <code>src/games/balatro/content/jokers.ts</code>. Change a number, save,
            and start a fresh run.
          </p>
          <pre>{`joker({\n  id: 'spark',\n  name: 'Spark',\n  description: '+4 mult.',\n  symbol: '✳',\n  onHand: () => ({ mult: 4 }),\n})`}</pre>
          <p className="small muted">
            Keep the description and effect in agreement. Changing rules changes old replay
            outcomes; bump RULES_VERSION before keeping new saves.
          </p>
        </article>
        <article>
          <span className="section-number">02</span>
          <h3>Follow the layers</h3>
          <ul className="layer-list">
            <li>
              <strong>Content</strong>
              <span>What a card does</span>
            </li>
            <li>
              <strong>Domain</strong>
              <span>What is legal, and in what order</span>
            </li>
            <li>
              <strong>Application</strong>
              <span>Commands, replay and persistence</span>
            </li>
            <li>
              <strong>Interface</strong>
              <span>What you see and interact with</span>
            </li>
          </ul>
          <p>
            The rules have no dependency on React. The score inspector reads the same result that
            resolves the actual hand.
          </p>
        </article>
        <article>
          <span className="section-number">03</span>
          <h3>Try a small experiment</h3>
          <p>
            Move an additive Joker after a multiplier. Compare the same hand. Then make a Joker that
            rewards a choice you currently ignore.
          </p>
          <p>
            See <code>docs/guide/modding.md</code> for a worked example, and{' '}
            <code>docs/research/</code> for mechanisms, timing and design questions.
          </p>
        </article>
        <article>
          <span className="section-number">04</span>
          <h3>Three ways to build a strategy</h3>
          <p>
            <strong>Blindside:</strong> poker, ordered scoring and a growing engine.
          </p>
          <p>
            <strong>Slay the Spire:</strong> energy, enemy intent and deck-building across three
            acts.
          </p>
          <p>
            <strong>Last Hearth:</strong> tavern economy, positioning and automatic combat.
          </p>
          <p className="small muted">
            Use Choose game to switch. Each game keeps its own local save.
          </p>
        </article>
      </div>
    </div>
  );
}

export function BlindsideApp({
  onSwitch,
  onChallenges,
}: {
  onSwitch: (id: GameId) => void;
  onChallenges: () => void;
}) {
  const game = useLocalGame(blindsideSession, 'FIRST-LIGHT');
  const run = game.state;
  const [view, setView] = useState<View>('play');
  const [selected, setSelected] = useState<string[]>([]);
  const visibleSelection = selected.filter((id) => run.hand.includes(id));
  const preview =
    run.phase === 'playing' && visibleSelection.length ? scoreHand(run, visibleSelection) : null;
  const dispatch = (command: Command) => {
    const ok = game.dispatch(command);
    if (
      ok &&
      ['play', 'discard', 'useConsumable', 'leaveShop', 'startBlind'].includes(command.type)
    )
      setSelected([]);
    return ok;
  };
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((c) => c !== id)
        : current.length < 5
          ? [...current, id]
          : current,
    );
  return (
    <GameShell
      title="Blindside"
      subtitle="A Balatro study"
      gameId="balatro"
      onSwitch={onSwitch}
      onChallenges={onChallenges}
      controls={{
        ...game,
        restart: (seed) => {
          game.restart(seed);
          setSelected([]);
        },
        importFile: async (file) => {
          const imported = await game.importFile(file);
          if (imported) setSelected([]);
          return imported;
        },
      }}
      tools={
        <WorkshopTools
          packs={blindsidePacks}
          game={game}
          scenarios={BLINDSIDE_SCENARIOS}
          summary={(s) => ({
            Phase: s.phase,
            Ante: s.ante,
            Blind: s.blind + 1,
            Cash: s.cash,
            Score: s.roundScore,
            Cards: s.deck.length,
            Jokers: s.jokers.length,
          })}
        />
      }
      view={view}
      onView={setView}
      defaultSeed="FIRST-LIGHT"
      createSeed={() => `WORKSHOP-${Date.now().toString(36).toUpperCase()}`}
    >
      {(openNewRun) => (
        <>
          {view === 'play' ? (
            <main className="game-layout">
              <div>
                <Playback
                  sequence={`${game.timelineRevision}-${run.seed}-${game.session.replay.commands.reduce((last, c, i) => (c.type === 'play' ? i : last), -1)}`}
                  frames={run.lastScore?.steps ?? []}
                  label="Scoring resolution"
                  render={(step) => (
                    <>
                      <div className="resolution-score">
                        <span>{step.chips}</span> × <span>{Number(step.mult.toFixed(2))}</span>
                      </div>
                      <div className="resolution-explanation">
                        <strong>{step.source}</strong>
                        <p>{step.detail}</p>
                      </div>
                      <p>Scoring effects resolve from left to right.</p>
                    </>
                  )}
                >
                  <Table
                    run={run}
                    selected={visibleSelection}
                    toggle={toggle}
                    dispatch={dispatch}
                    preview={preview}
                    newRun={openNewRun}
                  />
                </Playback>
              </div>
              <Inspector run={run} preview={preview} />
            </main>
          ) : (
            <main className="content-page">
              {view === 'collection' ? <Collection /> : <Workshop />}
            </main>
          )}
          <div className="visually-hidden" role="status" aria-live="polite">
            {run.notice}
          </div>
        </>
      )}
    </GameShell>
  );
}
