export {
  arenaSessionV1 as arenaSession,
  arenaFrame,
} from '../../../src/games/battlegrounds/application/arena';
export { decideRecruitment } from '../../../src/games/battlegrounds/ai/recruitment-policy';
export {
  decideRecruitmentV2,
  RECRUITMENT_POLICIES,
} from '../../../src/games/battlegrounds/ai/recruitment-v2';
export {
  RECRUITMENT_PLAN,
  recruitmentCases,
  recruitmentSetup,
  runRecruitmentEpisode,
  compareRecruitmentReports,
} from '../../../src/games/battlegrounds/experiments/recruitment-experiment';
export { inspectRecruitment } from '../../../src/games/battlegrounds/experiments/recruitment-inspector';
