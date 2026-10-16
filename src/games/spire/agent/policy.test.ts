import { describe, expect, it } from 'vitest';
import { spireScenario } from '../application/scenario';
import { transitionSpire } from '../domain/game';
import { adapter } from './adapter';
import example from './example';
import { observe } from './observation';
import { builtins, STRATEGIES } from './policy';
import { project } from './tactics';
import { incoming, turnLoss } from './forecast';

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
      for (const ascension of [0, 3, 5]) {
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
    for (const definitionId of [
      'shrugItOff',
      'bladeDance',
      'bouncingFlask',
      'secondWind',
      'fiendFire',
    ]) {
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
  it('blocks held Burns before a nonattacking intent instead of wasting available energy', () => {
    const run = spireScenario('PUBLIC-HELD-BURNS', {
      deck: ['defend', 'burn', 'burn', 'burn'],
      upgrades: ['burn'],
      enemies: ['hexaghost'],
      hp: 40,
    });
    run.combat!.enemies[0].intentIndex = 4;
    run.combat!.energy = 1;
    const input = observe(run);
    expect(incoming(input)).toBe(0);
    expect(turnLoss(input)).toBe(12);
    const ignored = transitionSpire(run, { type: 'endTurn' }).state;
    const proposal = builtins.survival.create(config)(input);
    expect(proposal.command.type).toBe('playCard');
    if (proposal.command.type !== 'playCard') throw new Error('Expected held defense');
    expect(input.combat!.cards[proposal.command.id].definitionId).toBe('defend');
    const defended = transitionSpire(run, proposal.command);
    expect(defended.error).toBeUndefined();
    const resolved = transitionSpire(defended.state, { type: 'endTurn' }).state;
    expect(ignored.hp).toBe(28);
    expect(resolved.hp).toBe(33);
  });

  it('keeps direct Regret loss separate from Burn Block and later passive Block', () => {
    const run = spireScenario('PUBLIC-HAND-ORDER', {
      deck: ['defend', 'burn', 'regret'],
      relics: ['orichalcum'],
      enemies: ['hexaghost'],
      hp: 40,
    });
    run.combat!.enemies[0].intentIndex = 4;
    const input = observe(run);
    expect(turnLoss(input)).toBe(5);
    expect(transitionSpire(run, { type: 'endTurn' }).state.hp).toBe(35);
    const command = input.actions.find((c) => c.type === 'playCard')!;
    const defended = transitionSpire(run, command).state;
    expect(turnLoss(observe(defended))).toBe(2);
    expect(transitionSpire(defended, { type: 'endTurn' }).state.hp).toBe(38);
  });

  it('preserves energy on a lethal stasis hit without valuing a debuff on the defeated target', () => {
    const run = spireScenario('PUBLIC-STASIS-ENERGY', {
      deck: ['bash', 'strike', 'demonForm'],
      enemies: ['bronzeAutomaton', 'bronzeOrb'],
    });
    const c = run.combat!,
      orb = c.enemies[1];
    const stolen = c.hand.find((id) => c.cards[id].definitionId === 'demonForm')!;
    c.hand = c.hand.filter((id) => id !== stolen);
    orb.stasisCard = stolen;
    orb.hp = 6;
    orb.block = 0;
    c.enemies[0].intentIndex = 4;
    c.energy = 4;
    const input = observe(run),
      proposal = builtins.survival.create(config)(input);
    expect(proposal.command.type).toBe('playCard');
    if (proposal.command.type !== 'playCard') throw new Error('Expected cheap lethal hit');
    expect(input.combat!.cards[proposal.command.id].definitionId).toBe('strike');
    expect(proposal.command.target).toBe(orb.id);
    expect(input.combat!.cards).not.toHaveProperty(stolen);
    const result = transitionSpire(run, proposal.command);
    expect(result.error).toBeUndefined();
    expect(result.state.combat!.energy).toBe(3);
    expect(result.state.combat!.hand).toContain(stolen);
    expect(observe(result.state).actions).toContainEqual({ type: 'playCard', id: stolen });
  });
  it('takes a native winning hit before held Burns could ever trigger', () => {
    const run = spireScenario('PUBLIC-WIN-BEFORE-BURN', {
      deck: ['hemokinesis', 'burn'],
      enemies: ['cultist'],
      hp: 3,
    });
    run.combat!.enemies[0].hp = 6;
    run.combat!.enemies[0].intentIndex = 0;
    const input = observe(run);
    for (const strategy of ['survival', 'growth'] as const) {
      const command = builtins[strategy].create(config)(input).command;
      expect(command.type).toBe('playCard');
      const preview = project(input, command)!;
      expect(turnLoss(preview)).toBe(0);
      const result = transitionSpire(run, command);
      expect(result.error).toBeUndefined();
      expect(result.state.phase).toBe('won');
      expect(result.state.hp).toBe(1);
    }
  });

  it('retains Block potions when the only forecast damage bypasses Block', () => {
    const run = spireScenario('PUBLIC-DIRECT-COST', {
      deck: ['regret', 'wound', 'wound', 'wound', 'wound'],
      enemies: ['cultist'],
      hp: 40,
    });
    run.combat!.enemies[0].intentIndex = 0;
    run.potions = ['block'];
    const input = observe(run),
      proposal = builtins.survival.create(config)(input);
    expect(proposal.command).toEqual({ type: 'endTurn' });
    const ordinary = transitionSpire(run, proposal.command).state;
    const consumed = transitionSpire(run, { type: 'potion', index: 0 }).state;
    const afterPotion = transitionSpire(consumed, { type: 'endTurn' }).state;
    expect(ordinary.hp).toBe(35);
    expect(afterPotion.hp).toBe(35);
    expect(ordinary.potions).toEqual(['block']);
    expect(afterPotion.potions).toEqual([]);
  });

  it('skips rewards whose restrictive conditions the public deck cannot support', () => {
    for (const card of ['clash', 'entrench']) {
      const run = spireScenario('PUBLIC-UNSUPPORTED-REWARD', {
        deck: ['strike', 'defend', 'defend', 'bash'],
        enemies: ['cultist'],
      });
      run.phase = 'reward';
      run.combat = null;
      run.reward = [card];
      const input = observe(run),
        command = builtins.survival.create(config)(input).command;
      expect(command).toEqual({ type: 'takeReward', card: null });
      const result = transitionSpire(run, command);
      expect(result.error).toBeUndefined();
      expect(result.state.deck.map((c) => c.definitionId)).not.toContain(card);
    }
  });
  it('builds an unready Ironclad damage plan while preserving health and character scope', () => {
    for (const test of [
      { character: 'ironclad', deck: ['strike', 'defend', 'bash'], hp: 0.9, expected: 'fight' },
      {
        character: 'ironclad',
        deck: ['cleave', 'ironWave', 'carnage', 'inflame'],
        hp: 0.9,
        expected: 'event',
      },
      { character: 'ironclad', deck: ['strike', 'defend', 'bash'], hp: 0.5, expected: 'event' },
      { character: 'silent', deck: ['strike', 'defend', 'bash'], hp: 0.9, expected: 'event' },
    ]) {
      const run = spireScenario('PUBLIC-DAMAGE-READINESS', {
        character: test.character,
        deck: test.deck,
        enemies: ['cultist'],
      });
      run.phase = 'map';
      run.combat = null;
      run.currentNode = null;
      run.hp = run.maxHp * test.hp;
      run.map = (['fight', 'event'] as const).map((kind, lane) => ({
        id: kind,
        row: 0,
        lane,
        kind,
        next: [],
        visited: false,
        encounter: ['cultist'],
      }));
      const command = builtins.survival.create(config)(observe(run)).command;
      expect(command).toEqual({ type: 'chooseNode', id: test.expected });
      expect(transitionSpire(run, command).error).toBeUndefined();
    }
  });
  it('declines a redundant power and respects campfire relic restrictions', () => {
    const run = spireScenario('PUBLIC-CURATED-DECK', {
      deck: ['demonForm', 'demonForm', 'strike', 'defend'],
      enemies: ['cultist'],
      hp: 40,
    });
    run.phase = 'reward';
    run.combat = null;
    run.reward = ['demonForm'];
    const reward = builtins.survival.create(config)(observe(run)).command;
    expect(reward).toEqual({ type: 'takeReward', card: null });
    const skipped = transitionSpire(run, reward);
    expect(skipped.error).toBeUndefined();
    expect(skipped.state.deck).toEqual(run.deck);
    for (const restricted of [false, true]) {
      const camp = structuredClone(skipped.state);
      camp.phase = 'rest';
      camp.relics.push('coffeeDripper');
      if (restricted) camp.relics.push('fusionHammer');
      const input = observe(camp),
        command = builtins.survival.create(config)(input).command;
      expect(input.actions).toContainEqual(command);
      expect(command.type).toBe('rest');
      if (command.type !== 'rest') throw new Error('Expected campfire command');
      expect(command.choice).toBe(restricted ? 'leave' : 'upgrade');
      const result = transitionSpire(camp, command);
      expect(result.error).toBeUndefined();
      expect(result.state.hp).toBe(camp.hp);
      expect(result.state.deck.filter((card) => card.upgraded)).toHaveLength(restricted ? 0 : 1);
    }
  });

  it('spends gold through affordable offers or ordinary curse removal', () => {
    for (const price of [75, 1000]) {
      const run = spireScenario('PUBLIC-CURATED-SHOP', {
        deck: ['strike', 'defend', 'regret'],
        enemies: ['cultist'],
      });
      run.phase = 'shop';
      run.combat = null;
      run.gold = 80;
      run.shop = [{ id: 'quality-offer', kind: 'card', definitionId: 'demonForm', price }];
      const input = observe(run),
        command = builtins.survival.create(config)(input).command;
      expect(input.actions).toContainEqual(command);
      expect(command.type).toBe(price === 75 ? 'buy' : 'removeCard');
      const result = transitionSpire(run, command);
      expect(result.error).toBeUndefined();
      expect(result.state.gold).toBe(5);
      expect(result.state.deck.some((card) => card.definitionId === 'demonForm')).toBe(
        price === 75,
      );
      expect(result.state.deck.some((card) => card.definitionId === 'regret')).toBe(price === 75);
    }
  });
  it('combines announced debuffs and allied Strength in native enemy order', () => {
    for (const [artifact, expected] of [
      [0, 20],
      [1, 20],
      [2, 14],
    ]) {
      const run = spireScenario('PUBLIC-SEQUENTIAL-DEBUFF', {
        deck: ['defend'],
        enemies: ['collector', 'torchHead', 'torchHead'],
        hp: 60,
      });
      run.combat!.enemies[0].intentIndex = 3;
      run.combat!.player.status.artifact = artifact;
      const input = observe(run),
        original = JSON.stringify(input);
      expect(incoming(input)).toBe(expected);
      expect(JSON.stringify(input)).toBe(original);
      expect(run.hp - transitionSpire(run, { type: 'endTurn' }).state.hp).toBe(expected);
    }
    for (const enemies of [
      ['donu', 'deca'],
      ['deca', 'donu'],
    ]) {
      const run = spireScenario('PUBLIC-SEQUENTIAL-BUFF', { deck: ['defend'], enemies, hp: 60 });
      const expected = enemies[0] === 'donu' ? 26 : 20;
      expect(incoming(observe(run))).toBe(expected);
      expect(run.hp - transitionSpire(run, { type: 'endTurn' }).state.hp).toBe(expected);
    }
    const poisoned = spireScenario('PUBLIC-CONSTRICT-POISON', {
      deck: ['defend'],
      enemies: ['donu', 'deca'],
      hp: 60,
    });
    poisoned.combat!.enemies[0].status.poison = poisoned.combat!.enemies[0].hp;
    poisoned.combat!.enemies[0].powers.constrict = 3;
    expect(incoming(observe(poisoned))).toBe(23);
    expect(poisoned.hp - transitionSpire(poisoned, { type: 'endTurn' }).state.hp).toBe(23);
  });

  it('blocks the Collector minions after accounting for the preceding public debuff', () => {
    const run = spireScenario('PUBLIC-SEQUENTIAL-BLOCK', {
      deck: ['defend'],
      enemies: ['collector', 'torchHead', 'torchHead'],
      hp: 40,
    });
    const c = run.combat!;
    c.enemies[0].intentIndex = 3;
    c.player.block = 14;
    c.energy = 1;
    const input = observe(run),
      command = builtins.survival.create(config)(input).command;
    expect(turnLoss(input)).toBe(6);
    expect(command.type).toBe('playCard');
    const defended = transitionSpire(run, command);
    expect(defended.error).toBeUndefined();
    expect(transitionSpire(defended.state, { type: 'endTurn' }).state.hp).toBe(39);
    expect(transitionSpire(run, { type: 'endTurn' }).state.hp).toBe(34);
  });
});
