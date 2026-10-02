import { afterEach, it, expect, vi } from 'vitest';
import { spirePacks } from './spire';
import { blindsidePacks } from './blindside';
import { hearthPacks } from './hearth';
afterEach(() => {
  vi.doUnmock('./spire');
  vi.doUnmock('./blindside');
  vi.doUnmock('./hearth');
  vi.resetModules();
});
it('activates the Spire example card, enemy and relic through normal rules', async () => {
  vi.resetModules();
  vi.doMock('./spire', () => ({ spirePacks: spirePacks.map((p) => ({ ...p, enabled: true })) }));
  const { spireScenario } = await import('../games/spire/application/scenario');
  const { transitionSpire } = await import('../games/spire/domain/game');
  const { spireSession } = await import('../games/spire/application/session');
  const r = spireScenario('MOD', {
    deck: ['workshop:riposte'],
    relics: ['workshop:practiceShield'],
    enemies: ['workshop:sparringPartner'],
  });
  expect(r.combat!.player.block).toBe(3);
  const after = transitionSpire(r, {
    type: 'playCard',
    id: r.combat!.hand[0],
    target: r.combat!.enemies[0].id,
  });
  expect(after.error).toBeUndefined();
  expect(after.state.combat!.player.block).toBe(7);
  expect(after.state.combat!.enemies[0].hp).toBe(45);
  expect(spireSession.rules.content).toHaveLength(2);
});
it('runs a typed Joker hook in authoritative scoring', async () => {
  vi.resetModules();
  vi.doMock('./blindside', () => ({
    blindsidePacks: blindsidePacks.map((p) => ({ ...p, enabled: true })),
  }));
  const { blindsideScenario } = await import('../games/balatro/application/scenario');
  const { scoreHand } = await import('../games/balatro/domain/scoring');
  const r = blindsideScenario('MOD', { jokers: [blindsidePacks[0].content.jokers[0].id] });
  const withMod = scoreHand(r, [r.hand[0]]);
  r.jokers = [];
  const without = scoreHand(r, [r.hand[0]]);
  expect(withMod.mult - without.mult).toBe(9);
});
it('uses custom recruit supply, end-turn growth and a declarative hero power', async () => {
  vi.resetModules();
  vi.doMock('./hearth', () => ({ hearthPacks: hearthPacks.map((p) => ({ ...p, enabled: true })) }));
  const { hearthScenario } = await import('../games/battlegrounds/application/scenario');
  const { transitionBG, supplyTotal } = await import('../games/battlegrounds/domain/game');
  const { endRecruitment, POOL_COPIES } = await import('../games/battlegrounds/domain/recruitment');
  const hero = hearthPacks[0].content.heroes[0],
    minion = hearthPacks[0].content.minions[0];
  const r = hearthScenario('MOD', { hero: hero.id, board: [minion.id], tier: 2 });
  const after = transitionBG(r, { type: 'power' }).state;
  expect(after.players[0].board[0].health).toBe(minion.health + 1);
  endRecruitment(after.players[0]);
  expect(after.players[0].board[0].health).toBe(minion.health + 2);
  expect(supplyTotal(after, minion.id)).toBe(POOL_COPIES[minion.tier]);
});
