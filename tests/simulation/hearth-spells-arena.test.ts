import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { arenaSession, arenaFrame } from '../../src/games/battlegrounds/application/arena';
import { activeSeat, mixedRivalsConfig } from '../../src/games/battlegrounds/domain/arena';
import { HEROES, RECRUITS } from '../../src/games/battlegrounds/content/minions';
import { decideSpellRecruitment } from '../../src/games/battlegrounds/ai/spell-policy';
import { supplyTotal } from '../../src/games/battlegrounds/domain/game';
import { handSize } from '../../src/games/battlegrounds/domain/spells';
import { POOL_COPIES } from '../../src/games/battlegrounds/domain/recruitment';

it('completes a v2 mixed lobby for each hero, preserving supply and exact journals', () => {
  const root = 'test-results/tavern-spells-arena-playtest';
  mkdirSync(root, { recursive: true });
  const summary = HEROES.map((hero, index) => {
    const seed = `SPELLS-ARENA-${index + 1}`,
      config = mixedRivalsConfig(seed, hero.id, 'hidden');
    config.firstSeat = index;
    let session = arenaSession.act(arenaSession.create(seed), {
      type: 'configure',
      config,
    }).session;
    for (let step = 0; step < 6000 && !['won', 'lost'].includes(session.state.phase); step++) {
      const state = session.state,
        seat = activeSeat(state);
      const command =
        state.phase === 'combat'
          ? { type: 'nextRound' as const }
          : {
              type: 'seat' as const,
              seat: seat!,
              action: decideSpellRecruitment(arenaFrame(session, seat!), config.seats[seat!].style)
                .command,
            };
      const result = arenaSession.act(session, command);
      expect(result.error, `${seed} step ${step}: ${JSON.stringify(command)}`).toBeUndefined();
      session = result.session;
      for (const definition of RECRUITS) {
        expect(supplyTotal(session.state, definition.id), `${seed}: ${definition.id}`).toBe(
          POOL_COPIES[definition.tier],
        );
        expect(session.state.pool[definition.id]).toBeGreaterThanOrEqual(0);
      }
      for (const player of session.state.players) {
        expect(handSize(player)).toBeLessThanOrEqual(10);
        expect(player.board.length).toBeLessThanOrEqual(7);
        expect(player.gold).toBeGreaterThanOrEqual(0);
      }
    }
    expect(['won', 'lost']).toContain(session.state.phase);
    expect([...session.state.players.map((p) => p.placement)].sort()).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(arenaSession.decode(arenaSession.encode(session))).toEqual(session);
    writeFileSync(`${root}/${seed}.json`, arenaSession.encode(session));
    return {
      seed,
      hero: hero.id,
      commands: session.replay.commands.length,
      rounds: session.state.round,
      placements: session.state.players.map((p) => p.placement),
      spellsCast: session.replay.commands.filter(
        (c) => c.type === 'seat' && c.action.type === 'castSpell',
      ).length,
    };
  });
  expect(summary.every((row) => row.spellsCast > 0)).toBe(true);
  writeFileSync(`${root}/summary.json`, JSON.stringify(summary, null, 2));
}, 120_000);
