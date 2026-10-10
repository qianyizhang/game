export {
  arenaSessionV1 as arenaSession,
  arenaFrame,
} from '../../games/battlegrounds/application/arena';
export { decideRecruitment } from '../../games/battlegrounds/ai/recruitment-policy';
export {
  decideRecruitmentV2,
  RECRUITMENT_POLICIES,
} from '../../games/battlegrounds/ai/recruitment-v2';
export {
  RECRUITMENT_PLAN,
  recruitmentCases,
  recruitmentSetup,
  runRecruitmentEpisode,
  compareRecruitmentReports,
} from './recruitment-experiment';
export { inspectRecruitment } from './recruitment-inspector';
