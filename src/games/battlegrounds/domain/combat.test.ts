import { describe, expect, it } from 'vitest';
import { resolveCombat } from './combat';
import { buff, makeUnit } from './units';

describe('Battlegrounds combat resolution', () => {
  it('exchanges simultaneous damage and never mutates recruitment units', () => {
    const a = [makeUnit('imp', 'a')];
    const b = [makeUnit('imp', 'b')];
    const before = structuredClone([a, b]);
    const result = resolveCombat(a, b, [1, 1], 1);
    expect(result.winner).toBeNull();
    expect(result.boards).toEqual([[], []]);
    expect([a, b]).toEqual(before);
    expect(resolveCombat(a, b, [1, 1], 1)).toEqual(result);
  });
  it('targets Taunt even with weaker unprotected targets and starts the larger board', () => {
    const a = makeUnit('imp', 'a');
    buff(a, 10, 20);
    const result = resolveCombat(
      [a, makeUnit('egg', 'filler1'), makeUnit('egg', 'filler2')],
      [makeUnit('cub', 'easy'), makeUnit('squire', 'taunt')],
      [1, 1],
      2,
    );
    const first = result.frames.find((f) => f.attacker);
    expect(first?.attacker).toBe('a');
    expect(first?.target).toBe('taunt');
  });
  it('Divine Shield prevents both damage and Poisonous lethality', () => {
    const result = resolveCombat(
      [makeUnit('amalgam', 'poison')],
      [makeUnit('colossus', 'shield')],
      [6, 6],
      3,
    );
    expect(result.winner).toBe(1);
    expect(result.boards[1][0].health).toBe(8);
    expect(result.boards[1][0].keywords).not.toContain('shield');
  });
  it('Cleave damages both adjacent minions; only the primary target retaliates', () => {
    const attacker = makeUnit('hydra', 'hydra');
    buff(attacker, 10, 20);
    const result = resolveCombat(
      [attacker, makeUnit('egg', 'x'), makeUnit('egg', 'y'), makeUnit('egg', 'z')],
      [makeUnit('imp', 'left'), makeUnit('squire', 'center'), makeUnit('imp', 'right')],
      [4, 1],
      4,
    );
    const first = result.frames.find((f) => f.attacker)!;
    expect(first.boards[1].every((u) => u.health <= 0)).toBe(true);
    expect(first.boards[0][0].health).toBe(24);
    expect(result.winner).toBe(0);
  });
  it('resolves both sides’ death summons before deciding a winner', () => {
    const result = resolveCombat([makeUnit('stray', 'a')], [makeUnit('stray', 'b')], [1, 1], 5);
    expect(
      result.frames.some(
        (f) => f.boards[0][0]?.definitionId === 'cub' && f.boards[1][0]?.definitionId === 'cub',
      ),
    ).toBe(true);
    expect(result.winner).toBeNull();
  });
  it('late summons join one current sweep without catching up on earlier attack counts', () => {
    const stray = makeUnit('stray', 'stray');
    stray.attack = 1;
    stray.health = 4;
    stray.maxHealth = 4;
    stray.keywords = ['taunt'];
    const friend = makeUnit('imp', 'friend');
    friend.attack = 1;
    friend.health = 100;
    const enemy = makeUnit('imp', 'enemy');
    enemy.attack = 1;
    enemy.health = 100;
    const result = resolveCombat([stray, friend], [enemy], [1, 1], 11);
    const attacks = result.frames.filter((f) => f.attacker && f.attacker !== 'enemy');
    const tokenIndex = attacks.findIndex((f) => f.attacker?.startsWith('combat-0-'));
    expect(tokenIndex).toBeGreaterThan(1);
    expect(attacks[tokenIndex + 1].attacker).toBe('friend');
  });
  it('Reborn loses buffs, keeps base/golden stats and returns only once at 1 HP', () => {
    const phoenix = makeUnit('phoenix', 'phoenix');
    buff(phoenix, 4, 7);
    const enemy = makeUnit('imp', 'enemy');
    buff(enemy, 100, 100);
    const result = resolveCombat([phoenix], [enemy], [5, 1], 6);
    const frames = result.frames.filter((f) => f.text.includes('returns with Reborn'));
    expect(frames).toHaveLength(1);
    const revived = frames[0].boards[0][0];
    expect(revived.attack).toBe(5);
    expect(revived.health).toBe(1);
    expect(revived.keywords).not.toContain('reborn');
  });
  it('deathrattle repetition respects the seven-minion board cap', () => {
    const left = [
      makeUnit('rat', 'rat'),
      makeUnit('baron', 'baron', true),
      ...Array.from({ length: 5 }, (_, i) => makeUnit('egg', `egg${i}`)),
    ];
    const right = [makeUnit('imp', 'enemy')];
    buff(right[0], 40, 100);
    const result = resolveCombat(left, right, [5, 1], 7);
    expect(result.frames.every((f) => f.boards.every((board) => board.length <= 7))).toBe(true);
    expect(result.frames.some((f) => f.text.includes('board is full'))).toBe(true);
  });
  it('zero-attack boards terminate as a stalemate with no hero damage', () => {
    const result = resolveCombat([makeUnit('egg', 'a')], [makeUnit('egg', 'b')], [5, 5], 8);
    expect(result.stalemate).toBe(true);
    expect(result.attacks).toBe(0);
    expect(result.damage).toEqual([0, 0]);
  });
  it('hero damage is tavern tier plus surviving minion tiers', () => {
    const result = resolveCombat([makeUnit('colossus', 'a')], [], [6, 1], 9);
    expect(result.damage).toEqual([0, 12]);
  });
});
