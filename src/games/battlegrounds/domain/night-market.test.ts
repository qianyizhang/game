import { describe, expect, it } from 'vitest';
import { bgSession } from '../application/session';
import { resolveCombat } from './combat';
import { BG_VERSION, createBG } from './game';
import { endRecruitment, recruitAction } from './recruitment';
import { makeUnit } from './units';

describe('Night Market recruitment and combat combinations', () => {
  it('stacks permanent Mech summon support with the Rivet Mouse battlecry without buffing non-Mechs', () => {
    const run = createBG('MARKET-MECHS');
    const player = run.players[0];
    player.board = [
      makeUnit('coilserpent', 'coil'),
      makeUnit('lanternengine', 'engine', true),
      makeUnit('imp', 'imp'),
    ];
    player.hand = [makeUnit('rivetmouse', 'mouse')];
    expect(recruitAction(run, player, { type: 'play', id: 'mouse', position: 3 })).toBeUndefined();
    expect(player.board[3]).toMatchObject({ attack: 10, maxHealth: 8 });
    expect(player.board[0]).toMatchObject({ attack: 4, maxHealth: 6 });
    expect(player.board[1]).toMatchObject({ attack: 14, maxHealth: 21 });
    expect(player.board[2]).toMatchObject({ attack: 3, maxHealth: 3 });
  });
  it('gives a golden Apothecary a required other-minion target and doubles its permanent buff', () => {
    const run = createBG('MARKET-TARGET');
    const player = run.players[0];
    player.board = [makeUnit('glassimp', 'glass')];
    player.hand = [makeUnit('streetapothecary', 'doctor', true)];
    expect(
      recruitAction(run, player, { type: 'play', id: 'doctor', position: 1, target: 'missing' }),
    ).toBeTruthy();
    expect(player.hand).toHaveLength(1);
    expect(
      recruitAction(run, player, { type: 'play', id: 'doctor', position: 1, target: 'glass' }),
    ).toBeUndefined();
    expect(player.board[0]).toMatchObject({ attack: 6, maxHealth: 7, keywords: ['shield'] });
  });
  it('chooses each menagerie target once, leaving neutral supports unbuffed', () => {
    const player = createBG('MARKET-MENAGERIE').players[0];
    player.board = [
      makeUnit('amalgam', 'all'),
      makeUnit('rivetmouse', 'mouse'),
      makeUnit('wickimp', 'imp'),
      makeUnit('spark', 'spark'),
      makeUnit('maskmerchant', 'merchant', true),
    ];
    endRecruitment(player);
    expect(player.board.map((m) => [m.attack, m.maxHealth])).toEqual([
      [11, 9],
      [6, 4],
      [5, 5],
      [6, 4],
      [8, 14],
    ]);
  });
  it('repeats the golden Manta deathrattle through the Auctioneer and buffs summoned tokens only in combat', () => {
    const manta = makeUnit('clockworkmanta', 'manta', true);
    manta.health = 1;
    manta.keywords = [];
    const left = [
      manta,
      makeUnit('twilightauctioneer', 'auctioneer'),
      makeUnit('lanternengine', 'engine'),
    ];
    const before = structuredClone(left);
    const enemy = makeUnit('colossus', 'enemy');
    enemy.attack = 100;
    enemy.health = enemy.maxHealth = 100;
    const combat = resolveCombat(left, [enemy], [6, 6], 1);
    const summons = combat.frames.filter(
      (f) => f.text.includes('Scrapling') && f.text.includes('summon'),
    );
    expect(summons).toHaveLength(4);
    expect(summons.at(-1)!.boards[0].filter((m) => m.definitionId === 'scrap')).toHaveLength(4);
    expect(
      summons
        .at(-1)!
        .boards[0].filter((m) => m.definitionId === 'scrap')
        .every((m) => m.attack === 7 && m.maxHealth === 7),
    ).toBe(true);
    expect(left).toEqual(before);
  });
  it('separates version 3 lobbies from the larger finite pool', () => {
    expect(BG_VERSION).toBe(6);
    const session = bgSession.create('MARKET-LOBBY');
    expect(bgSession.decode(bgSession.encode(session))).toEqual(session);
    expect(() => bgSession.decode(JSON.stringify({ ...session.replay, version: 3 }))).toThrow(
      /version/i,
    );
  });
});
