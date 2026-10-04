import { expect, it } from 'vitest';
import { arenaSession } from '../games/battlegrounds/application/arena';
import { decideRecruitment } from '../games/battlegrounds/ai/recruitment-policy';
import { runArenaEpisode } from './hearth-arena-experiment';
import {
  compareRecruitmentReports,
  recruitmentCases,
  recruitmentSetup,
  runRecruitmentEpisode,
  type RecruitmentReport,
} from './hearth-recruitment-experiment';
import { inspectRecruitment } from './hearth-recruitment-inspector';

// Statistics fixtures deliberately omit gameplay; real replay validity is covered separately.
function fixtures(): RecruitmentReport[] {
  return recruitmentCases('evaluation').map((spec) => {
    const config = recruitmentSetup(spec),
      place = {
        'baseline-v1': 3,
        'tempo-v1': 6,
        'tempo-upgrade-v2': 4,
        'tempo-spend-v2': 5,
        'tempo-both-v2': 2,
      }[spec.policy];
    const placements = Array.from({ length: 8 }, (_, i) => ((i - spec.seat + 8) % 8) + 1);
    [placements[spec.seat], placements[(spec.seat + place - 1) % 8]] = [place, 1];
    return {
      spec,
      seed: spec.seed,
      focalSeat: spec.seat,
      config,
      status: 'complete',
      placements,
      survivalRounds: Array(8).fill(10),
      rounds: 10,
      commands: 1,
      decisionMs: 0,
      replayVerified: true,
      replay: JSON.stringify({
        ...arenaSession.create(spec.seed).replay,
        commands: [{ type: 'configure', config }],
      }),
      metrics: { turns: [], upgrades: [], changedChoices: 0, interventions: {} },
    } satisfies RecruitmentReport;
  });
}
it('freezes fresh, hero-balanced, seat-rotated development and reserved grids', () => {
  const dev = recruitmentCases('development'),
    evals = recruitmentCases('evaluation');
  expect(dev).toHaveLength(400);
  expect(evals).toHaveLength(800);
  expect(dev.filter((c) => evals.some((e) => e.seed === c.seed)).length).toBe(0);
  for (const cases of [dev, evals]) {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    for (const hero of new Set(cases.map((c) => c.hero)))
      expect(cases.filter((c) => c.hero === hero)).toHaveLength(cases.length / 5);
    for (let seat = 0; seat < 8; seat++)
      for (const population of ['classic', 'mixed']) {
        const spec = cases.find((c) => c.seat === seat && c.population === population)!;
        const config = recruitmentSetup(spec);
        expect(config.seats[seat].hero).toBe(spec.hero);
        expect(config.visibilitySeat).toBe(seat);
        if (population === 'classic')
          expect(
            config.seats.filter((_, i) => i !== seat).every((s) => s.style === 'baseline-v1'),
          ).toBe(true);
      }
  }
});
it('computes factorial effects and uncertainty over five blocks, not 40 independent seats', () => {
  const result = compareRecruitmentReports(fixtures(), 'evaluation');
  expect(result.includedLobbies).toBe(800);
  expect(result.negativeControlPairs).toBe(240);
  expect(result.excluded).toEqual([]);
  for (const stratum of result.strata) {
    expect(stratum.upgradeEffect).toEqual({ mean: 2.5, blocks: 5, standardError: 0 });
    expect(stratum.spendingEffect.mean).toBe(1.5);
    expect(stratum.interaction.mean).toBe(1);
    expect(stratum.policies[0]).toMatchObject({ lobbies: 40, meanPlacement: 3, topFour: 40 });
  }
});
it('excludes complete blocks for missing, duplicate, failed, tampered and leaking cases', () => {
  for (const failure of ['missing', 'duplicate', 'failed', 'config', 'labels', 'placement']) {
    const rows = fixtures();
    if (failure === 'missing') rows.shift();
    if (failure === 'duplicate') rows[0] = rows[1];
    if (failure === 'failed') rows[0].replayVerified = false;
    if (failure === 'config') rows[0].config.visibilitySeat = 7;
    if (failure === 'labels') {
      const r = rows.find((r) => r.spec.visibility === 'disclosed')!;
      const replay = JSON.parse(r.replay);
      replay.commands.push({ type: 'nextRound' });
      r.replay = JSON.stringify(replay);
    }
    if (failure === 'placement') rows[0].placements[0] = 9;
    const result = compareRecruitmentReports(rows, 'evaluation');
    expect(result.includedLobbies, failure).toBe(640);
    expect(result.excluded).toHaveLength(1);
  }
  const rows = fixtures(),
    foreign = structuredClone(rows[0]);
  foreign.spec.seed = 'FOREIGN';
  rows.push(foreign);
  expect(compareRecruitmentReports(rows, 'evaluation').unexpected).toEqual([foreign.spec.id]);
});
it('preserves v1 gameplay under injected control and reconstructs v2 proposals from accepted commands', () => {
  const spec = recruitmentCases('development')[0],
    config = recruitmentSetup(spec);
  const original = runArenaEpisode(spec.seed, config, spec.seat),
    injected = runArenaEpisode(spec.seed, config, spec.seat, { decide: decideRecruitment });
  expect(injected.replay).toBe(original.replay);
  const control = runRecruitmentEpisode(spec);
  expect(control.replay).toBe(original.replay);
  const candidate = runRecruitmentEpisode(recruitmentCases('development')[4]);
  expect(candidate.status).toBe('complete');
  expect(candidate.replayVerified).toBe(true);
  expect(candidate.metrics.changedChoices).toBeGreaterThan(0);
  const viewer = inspectRecruitment(candidate.replay, candidate.spec);
  expect(viewer.steps.length).toBeGreaterThan(10);
  expect(
    viewer.steps.every((s) => s.proposals[candidate.spec.policy].command.type === s.recorded.type),
  ).toBe(true);
  expect(() =>
    inspectRecruitment(candidate.replay, { ...candidate.spec, seed: 'TAMPER' }),
  ).toThrow();
  const bad = JSON.parse(candidate.replay);
  bad.commands[0].config.visibility = 'disclosed';
  expect(() => inspectRecruitment(JSON.stringify(bad), candidate.spec)).toThrow();
}, 20000);
