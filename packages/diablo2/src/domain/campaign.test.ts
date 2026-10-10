import { describe, expect, it } from 'vitest';
import { playCampaign } from './campaign-policy';
import { exportSession, importSession } from '../application/session';
describe('Emberwake legal-command campaign', () => {
  for (const hero of ['barbarian', 'sorceress', 'necromancer'])
    it(`${hero} can clear four acts, build a character, and reconstruct the ending`, () => {
      const { session, deaths } = playCampaign(hero);
      expect(session.state.status).toBe('victory');
      expect(session.state.worlds).toHaveLength(4);
      expect(session.state.worlds.every((w) => w.bossDefeated && w.seals.every(Boolean))).toBe(
        true,
      );
      expect(session.state.player.level).toBeGreaterThan(3);
      expect(
        session.state.player.skills[
          session.replay.content.heroes.find((h) => h.id === hero)!.skills[1]
        ],
      ).toBeGreaterThan(0);
      expect(deaths).toBeLessThanOrEqual(12);
      expect(importSession(exportSession(session)).state).toEqual(session.state);
    }, 60000);
});
