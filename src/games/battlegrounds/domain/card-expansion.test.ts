import { describe, expect, it } from 'vitest';
import { bgSession } from '../application/session';
import { resolveCombat } from './combat';
import { createBG, supplyTotal, transitionBG } from './game';
import { endRecruitment, POOL_COPIES, recruitAction } from './recruitment';
import { makeUnit } from './units';

describe('expanded Hearth recruits', () => {
  it.each([false, true])('pays the Lantern Keeper battlecry once, golden=%s', (golden) => {
    const run = transitionBG(createBG('NEW-RECRUITS'), {
      type: 'chooseHero',
      hero: 'forgekeeper',
    }).state;
    const keeper = makeUnit('lanternkeeper', 'keeper', golden);
    run.pool.lanternkeeper -= keeper.copies;
    const player = run.players[0];
    player.hand = [keeper];
    const before = player.gold;
    expect(
      recruitAction(run, player, { type: 'play', id: keeper.id, position: 0 }),
    ).toBeUndefined();
    expect(player.gold).toBe(before + (golden ? 2 : 1));
    expect(recruitAction(run, player, { type: 'play', id: keeper.id, position: 0 })).toBeTruthy();
    expect(player.gold).toBe(before + (golden ? 2 : 1));
    expect(supplyTotal(run, 'lanternkeeper')).toBe(POOL_COPIES[2]);
  });
  it('combines permanent elemental summon and end-of-recruitment health', () => {
    const run = createBG('ELEMENTAL-GROWTH');
    const player = run.players[0];
    const weaver = makeUnit('mistweaver', 'weaver', true);
    const tide = makeUnit('tidewisp', 'tide');
    player.board = [weaver];
    player.hand = [tide, makeUnit('imp', 'demon')];
    expect(recruitAction(run, player, { type: 'play', id: 'tide', position: 1 })).toBeUndefined();
    expect(tide.maxHealth).toBe(11);
    expect(recruitAction(run, player, { type: 'play', id: 'demon', position: 2 })).toBeUndefined();
    expect(player.board[2].maxHealth).toBe(3);
    endRecruitment(player);
    expect(tide.maxHealth).toBe(12);
    expect(weaver.maxHealth).toBe(14);
  });
  it('limits Cinder Witch to other Demons, including all-tribe recruits', () => {
    const run = createBG('DEMON-BATTLECRY');
    const player = run.players[0];
    player.board = [makeUnit('imp', 'imp'), makeUnit('amalgam', 'all'), makeUnit('cub', 'beast')];
    player.hand = [makeUnit('cinderwitch', 'witch', true)];
    expect(recruitAction(run, player, { type: 'play', id: 'witch', position: 3 })).toBeUndefined();
    expect(player.board.map((u) => u.attack)).toEqual([7, 11, 1, 6]);
  });
  it('resolves a golden Stag deathrattle with tribe filtering without changing recruitment stats', () => {
    const stag = makeUnit('thornstag', 'stag', true);
    stag.health = 1;
    const left = [stag, makeUnit('cub', 'cub'), makeUnit('imp', 'imp')];
    const right = [makeUnit('colossus', 'enemy')];
    const before = structuredClone(left);
    const combat = resolveCombat(left, right, [3, 6], 1);
    const frame = combat.frames.find((f) => f.text === 'Thorn Stag: Deathrattle buffs survivors.');
    expect(frame).toBeDefined();
    expect(frame!.boards[0].find((u) => u.id === 'cub')).toMatchObject({ attack: 3, maxHealth: 5 });
    expect(frame!.boards[0].find((u) => u.id === 'imp')).toMatchObject({ attack: 3, maxHealth: 3 });
    expect(left).toEqual(before);
  });
  it('keeps Moon Moth support active for a reborn Toad, without repeating Reborn', () => {
    const toad = makeUnit('bogtoad', 'toad');
    const moth = makeUnit('moonmoth', 'moth');
    const enemy = makeUnit('colossus', 'enemy');
    enemy.attack = 1;
    enemy.health = 100;
    enemy.maxHealth = 100;
    const combat = resolveCombat([toad, moth], [enemy], [5, 6], 1);
    const returns = combat.frames.filter((f) => f.text === 'Bog Toad returns with Reborn.');
    expect(returns).toHaveLength(1);
    expect(returns[0].boards[0].find((u) => u.definitionId === 'bogtoad')).toMatchObject({
      attack: 3,
      health: 3,
      keywords: [],
    });
  });
  it('separates v1 recruitment replays from the enlarged shared pool', () => {
    const session = bgSession.create('EXPANDED-POOL');
    expect(bgSession.key).not.toBe('card-workshop.last-hearth.v1');
    expect(bgSession.decode(bgSession.encode(session))).toEqual(session);
    expect(() => bgSession.decode(JSON.stringify({ ...session.replay, version: 1 }))).toThrow(
      /version/i,
    );
  });
});
