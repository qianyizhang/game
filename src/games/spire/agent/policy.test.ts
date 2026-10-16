import { describe, expect, it } from 'vitest';
import { spireScenario } from '../application/scenario';
import { transitionSpire } from '../domain/game';
import { adapter } from './adapter';
import example from './example';
import { observe } from './observation';
import { builtins, STRATEGIES } from './policy';
import { project } from './tactics';
import { incoming } from './forecast';

const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT-POLICY-1' };

describe('Spire observation-only strategies', () => {
  it('keeps distinct declared strategies and meters their actual candidate search', () => {
    const run = spireScenario('POLICY-ADOPTION-1-DEV-01', {
      deck: ['strike', 'defend', 'metallicize'],
      enemies: ['jawWorm'],
    });
    run.combat!.enemies[0].intentIndex = 0;
    const view = observe(run);
    const expected = { immediate: 'strike', survival: 'metallicize', growth: 'metallicize' };
    for (const strategy of STRATEGIES) {
      const proposal = builtins[strategy].create(config)(view);
      expect(proposal.command.type).toBe('playCard');
      if (proposal.command.type === 'playCard')
        expect(view.combat!.cards[proposal.command.id].definitionId).toBe(expected[strategy]);
      expect(view.actions).toContainEqual(proposal.command);
      expect(proposal.work).toBeGreaterThanOrEqual(view.actions.length);
      expect(proposal.diagnostics).toMatchObject({ strategy });
    }
  });

  it('completes legal episodes for both characters and all measured Ascensions, then replays exactly', () => {
    for (const character of ['ironclad', 'silent']) {
      for (const ascension of [0, 2, 5]) {
        for (const strategy of STRATEGIES) {
          const setup = { character, ascension };
          let session = adapter.create('POLICY-ADOPTION-1-DEV-01', setup);
          const decide = builtins[strategy].create({ ...config, setup });
          let steps = 0;
          while (steps++ < 3000 && !adapter.terminal(session)) {
            const view = adapter.observe(session),
              proposal = decide(view);
            expect(view.actions).toContainEqual(proposal.command);
            const result = adapter.act(session, proposal.command);
            expect(
              result.error,
              `${character}/${ascension}/${strategy}: ${JSON.stringify(proposal.command)}`,
            ).toBeUndefined();
            session = result.state;
          }
          expect(adapter.terminal(session), `${character}/${ascension}/${strategy}`).toBe(true);
          expect(adapter.restore(adapter.replay(session))).toEqual(session);
          expect(adapter.metrics(session).progress).toBeGreaterThan(0);
        }
      }
    }
  }, 120_000);

  it('resets local extension memory without changing baseline commands', () => {
    const view = adapter.observe(adapter.create('POLICY-ADOPTION-1-DEV-01', {}));
    const choose = example.create(config);
    const first = choose(view);
    expect(first.command).toEqual(builtins.survival.create(config)(view).command);
    expect(choose(view)).not.toEqual(first);
    expect(example.create(config)(view)).toEqual(first);
  });

  it('finishes a Spiker safely behind Block instead of waiting forever on imaginary HP loss', () => {
    for (const strategy of ['survival', 'growth'] as const) {
      const run = spireScenario('PUBLIC-THORNS', { deck: ['strike'], enemies: ['spiker'], hp: 1 });
      run.combat!.player.block = 6;
      run.combat!.enemies[0].hp = 6;
      const proposal = builtins[strategy].create(config)(observe(run));
      expect(proposal.command.type).toBe('playCard');
      const result = transitionSpire(run, proposal.command);
      expect(result.error).toBeUndefined();
      expect(result.state.phase).toBe('won');
      expect(result.state.hp).toBe(1);
    }
  });

  it('uses a useful scaling power instead of ending every redraw with it still in hand', () => {
    for (const definitionId of ['accuracy', 'thousandCuts', 'corruption', 'darkEmbrace']) {
      const run = spireScenario('PUBLIC-SCALING', {
        deck: [definitionId],
        enemies: ['sphericGuardian'],
      });
      for (const strategy of ['survival', 'growth'] as const) {
        const proposal = builtins[strategy].create(config)(observe(run));
        expect(proposal.command.type, `${strategy}/${definitionId}`).toBe('playCard');
        const result = transitionSpire(run, proposal.command);
        expect(result.error).toBeUndefined();
        expect(result.state.combat!.powersPlayed).toHaveLength(1);
      }
    }
  });

  it('models retaliation before Rage and delays Reaper healing until after surviving the attack', () => {
    const guardian = spireScenario('SHARP-HIDE', {
      deck: ['strike'],
      enemies: ['guardian'],
      hp: 3,
    });
    guardian.combat!.enemies[0].hp = 6;
    guardian.combat!.enemies[0].powers = { sharpHide: 3 };
    guardian.combat!.rage = 5;
    const reaper = spireScenario('REAPER-THORNS', { deck: ['reaper'], enemies: ['spiker'], hp: 3 });
    reaper.combat!.enemies[0].hp = 4;
    reaper.combat!.enemies[0].intentIndex = 1;
    for (const run of [guardian, reaper]) {
      const input = observe(run),
        command = input.actions.find((a) => a.type === 'playCard')!;
      const preview = project(input, command)!;
      expect(preview.combat!.player.hp).toBe(0);
      expect(transitionSpire(run, command).state.hp).toBe(0);
      expect(builtins.survival.create(config)(input).command.type).toBe('endTurn');
    }
  });

  it('uses a public Slime split threshold to cancel the displayed Slam instead of merely defending', () => {
    const run = spireScenario('SPLIT-CANCEL', {
      deck: ['strike', 'defend'],
      enemies: ['slimeBoss'],
      hp: 35,
    });
    const c = run.combat!;
    c.energy = 1;
    c.enemies[0].maxHp = 140;
    c.enemies[0].hp = 72;
    c.enemies[0].intentIndex = 2;
    const input = observe(run);
    expect(incoming(input)).toBe(35);
    const command = builtins.survival.create(config)(input).command;
    expect(command.type === 'playCard' && c.cards[command.id].definitionId).toBe('strike');
    const preview = project(input, command)!;
    expect(incoming(preview)).toBe(0);
    const after = transitionSpire(transitionSpire(run, command).state, { type: 'endTurn' }).state;
    expect(after.hp).toBe(35);
  });

  it('stops unknown draws, generation, interruptions and private rebirth instead of guessing their outcomes', () => {
    const run = spireScenario('MODEL-CUTS', { deck: ['impervious'], enemies: ['cultist'] });
    for (const mutate of [
      (view: ReturnType<typeof observe>) => {
        view.combat!.powers.darkEmbrace = 1;
      },
      (view: ReturnType<typeof observe>) => {
        view.combat!.enemies[0].powers.hex = 1;
      },
      (view: ReturnType<typeof observe>) => {
        view.combat!.enemies[0].stasis = true;
      },
      (view: ReturnType<typeof observe>) => {
        view.combat!.enemies[0].powers.timeWarp = 11;
      },
    ]) {
      const input = observe(run);
      mutate(input);
      expect(
        project(
          input,
          input.actions.find((a) => a.type === 'playCard')!,
        ),
      ).toBeNull();
    }
    for (const definitionId of ['shrugItOff', 'bladeDance', 'bouncingFlask']) {
      const input = observe(
        spireScenario('UNKNOWN-EFFECT', { deck: [definitionId], enemies: ['cultist'] }),
      );
      expect(
        project(
          input,
          input.actions.find((a) => a.type === 'playCard')!,
        ),
      ).toBeNull();
    }
    const rebirth = spireScenario('PRIVATE-PHASE', { deck: ['strike'], enemies: ['awakenedOne'] });
    rebirth.combat!.enemies[0].hp = 1;
    const input = observe(rebirth);
    expect(
      project(
        input,
        input.actions.find((a) => a.type === 'playCard')!,
      ),
    ).toBeNull();
  });
  it('breaks persistent Guardian Block instead of spending a hundred turns merely delaying death', () => {
    let run = spireScenario('PERSISTENT-BLOCK', {
      deck: ['strike', 'strike', 'strike', 'defend', 'defend'],
      enemies: ['sphericGuardian'],
    });
    run.combat!.enemies[0].intentIndex = 1;
    const decide = builtins.survival.create(config);
    const first = decide(observe(run)).command;
    expect(first.type === 'playCard' && run.combat!.cards[first.id].definitionId).toBe('strike');
    for (let decisions = 0; decisions < 100 && run.phase === 'combat'; decisions++) {
      const result = transitionSpire(run, decide(observe(run)).command);
      expect(result.error).toBeUndefined();
      run = result.state;
    }
    expect(run.phase).toBe('won');
  });
});
