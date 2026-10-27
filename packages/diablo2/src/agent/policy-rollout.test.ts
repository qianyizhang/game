import { describe, expect, it } from 'vitest';
import { adapter } from './adapter';
import { builtins, STRATEGIES, type Strategy } from './policy';

const config = { setup: {}, options: {}, policySeed: 'INDEPENDENT-POLICY-1' };
function run(hero: string, strategy: Strategy) {
  let state = adapter.create('POLICY-ADOPTION-1-DEV-01', { hero, difficulty: 'relaxed' });
  const decide = builtins[strategy].create(config);
  const counts: Record<string, number> = {};
  for (let turn = 0; turn < 4000 && !adapter.terminal(state); turn++) {
    const input = adapter.observe(state),
      proposal = decide(input);
    expect(input.actions).toContainEqual(proposal.command);
    expect(Number.isSafeInteger(proposal.work) && proposal.work >= input.actions.length).toBe(true);
    const key =
      proposal.command.type === 'cast' ? `cast:${proposal.command.skill}` : proposal.command.type;
    counts[key] = (counts[key] ?? 0) + 1;
    const result = adapter.act(state, proposal.command);
    expect(
      result.error,
      `${hero}/${strategy}: ${JSON.stringify(proposal.command)}`,
    ).toBeUndefined();
    state = result.state;
  }
  return { state, counts };
}

describe('Emberwake public policy progression', () => {
  it('plays bounded progression witnesses on Relaxed for all heroes and priorities using offered actions', () => {
    for (const hero of ['barbarian', 'sorceress', 'necromancer']) {
      const used = new Set<string>();
      for (const strategy of STRATEGIES) {
        const { state, counts } = run(hero, strategy);
        // Relaxed functional progression witnesses; no win or Standard/Severe calibration claim.
        expect(adapter.metrics(state).bosses).toBeGreaterThanOrEqual(1);
        expect(adapter.metrics(state).regions).toBeGreaterThanOrEqual(5);
        expect(['playing', 'dead', 'victory']).toContain(state.input.status);
        for (const key of Object.keys(counts)) used.add(key);
      }
      const skills = adapter.observe(adapter.create('POLICY-SKILLS', { hero })).definitions
        .heroes[0].skills;
      for (const skill of skills) expect(used.has(`cast:${skill}`), `${hero}/${skill}`).toBe(true);
    }
  }, 120000);
});
