import { arenaFrame, arenaSession } from '../games/battlegrounds/application/arena';
import {
  decideRecruitmentV2,
  RECRUITMENT_POLICIES,
  type RecruitmentPolicyId,
} from '../games/battlegrounds/ai/recruitment-v2';
import {
  recruitmentCases,
  recruitmentSetup,
  type RecruitmentCase,
} from './hearth-recruitment-experiment';

/** Evaluator-only replay reconstruction. Each alternative sees only the same public policy frame. */
export function inspectRecruitment(raw: string, spec: RecruitmentCase) {
  const expected = recruitmentCases(spec.cohort).find((c) => c.id === spec.id);
  if (JSON.stringify(expected) !== JSON.stringify(spec))
    throw new Error('Unknown experiment case.');
  const final = arenaSession.decode(raw);
  const replay = final.replay;
  if (
    replay.seed !== spec.seed ||
    JSON.stringify(replay.commands[0]) !==
      JSON.stringify({ type: 'configure', config: recruitmentSetup(spec) })
  )
    throw new Error('Replay does not match the experiment case.');
  let session = arenaSession.create(replay.seed);
  const steps = [];
  for (const [step, command] of replay.commands.entries()) {
    if (command.type === 'seat' && command.seat === spec.seat) {
      const frame = arenaFrame(session, spec.seat);
      const proposals = Object.fromEntries(
        (Object.keys(RECRUITMENT_POLICIES) as RecruitmentPolicyId[]).map((policy) => [
          policy,
          decideRecruitmentV2(frame, policy),
        ]),
      );
      if (JSON.stringify(proposals[spec.policy].command) !== JSON.stringify(command.action))
        throw new Error(`Controller does not reproduce recorded action at step ${step}.`);
      steps.push({ step, round: frame.observation.round, recorded: command.action, proposals });
    }
    const result = arenaSession.act(session, command);
    if (result.error) throw new Error(result.error);
    session = result.session;
  }
  return {
    schema: 'hearth.recruitment-inspector.v2',
    spec,
    labels: RECRUITMENT_POLICIES,
    placement: final.state.players[spec.seat].placement,
    replay,
    steps,
  };
}
