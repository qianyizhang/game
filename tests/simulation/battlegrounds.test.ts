import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { bgSession } from '../../src/games/battlegrounds/application/session';
import { botDecision } from '../../src/games/battlegrounds/domain/bots';
import { MINION_BY_ID, RECRUITS } from '../../src/games/battlegrounds/content/minions';
import { supplyTotal } from '../../src/games/battlegrounds/domain/game';
import { POOL_COPIES } from '../../src/games/battlegrounds/domain/recruitment';
import type { BGCommand, HeroId, Unit } from '../../src/games/battlegrounds/domain/types';

it('finishes seeded lobbies using legal commands and conserves every pool after every action', () => {
  mkdirSync('test-results/battlegrounds', { recursive: true });
  const summary = Array.from({ length: 12 }, (_, i) => {
    const seed = `HEARTH-${String(i + 1).padStart(2, '0')}`;
    let session = bgSession.create(seed);
    let refreshes = 0;
    let round = 0;
    for (let step = 0; step < 2000 && !['won', 'lost'].includes(session.state.phase); step++) {
      const run = session.state;
      const player = run.players[0];
      let command: BGCommand;
      if (run.round !== round) {
        round = run.round;
        refreshes = 0;
      }
      if (run.phase === 'hero')
        command = {
          type: 'chooseHero',
          hero: (['forgekeeper', 'quartermaster', 'wildspeaker'] as HeroId[])[i % 3],
        };
      else if (run.phase === 'combat') command = { type: 'nextRound' };
      else {
        const choice = botDecision(run, player, refreshes);
        if (choice) command = choice;
        else {
          const priority = (unit: Unit) => {
            const d = MINION_BY_ID[unit.definitionId];
            return (
              unit.attack +
              (unit.keywords.includes('cleave') ? 20 : 0) +
              (d.deathrattle ? 4 : 0) -
              (d.summonBuff || d.deathGrowth || d.deathDamage || d.extraDeathrattle ? 30 : 0)
            );
          };
          const index = player.board.findIndex(
            (u, j) => j > 0 && priority(u) > priority(player.board[j - 1]),
          );
          command =
            index > 0
              ? { type: 'move', id: player.board[index].id, direction: -1 }
              : { type: 'endRecruit' };
        }
      }
      const result = bgSession.act(session, command);
      if (result.error)
        throw new Error(`${seed} round ${round}: ${JSON.stringify(command)}: ${result.error}`);
      session = result.session;
      if (command.type === 'refresh') refreshes++;
      for (const definition of RECRUITS) {
        expect(supplyTotal(session.state, definition.id), `${seed}: ${definition.id}`).toBe(
          POOL_COPIES[definition.tier],
        );
        expect(session.state.pool[definition.id]).toBeGreaterThanOrEqual(0);
      }
      for (const p of session.state.players) {
        expect(p.board.length).toBeLessThanOrEqual(7);
        expect(p.hand.length).toBeLessThanOrEqual(10);
        expect(p.gold).toBeGreaterThanOrEqual(0);
      }
    }
    expect(['won', 'lost']).toContain(session.state.phase);
    expect(bgSession.decode(bgSession.encode(session))).toEqual(session);
    writeFileSync(`test-results/battlegrounds/${seed}.json`, bgSession.encode(session));
    return {
      seed,
      hero: session.state.players[0].hero,
      outcome: session.state.phase,
      placement: session.state.players[0].placement,
      rounds: session.state.round,
      commands: session.replay.commands.length,
      triples: session.replay.commands.filter((c) => c.type === 'discover').length,
    };
  });
  writeFileSync('test-results/battlegrounds/summary.json', JSON.stringify(summary, null, 2));
  expect(summary.some((row) => row.outcome === 'won')).toBe(true);
  expect(summary.some((row) => row.outcome === 'lost')).toBe(true);
}, 120_000);
