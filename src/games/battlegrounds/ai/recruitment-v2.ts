import type { ArenaFrame } from '../application/arena';
import { MINION_BY_ID } from '../content/minions';
import type { RecruitCommand } from '../domain/arena';
import { unitValue } from '../domain/bots';
import type { Player, Unit } from '../domain/types';
import { decideRecruitment, type RecruitmentDecision } from './recruitment-policy';

export const RECRUITMENT_POLICIES = {
  'baseline-v1': { label: 'Classic reference', earlierUpgrades: false, fundReplacement: false },
  'tempo-v1': { label: 'Tempo control', earlierUpgrades: false, fundReplacement: false },
  'tempo-upgrade-v2': { label: 'Earlier upgrades', earlierUpgrades: true, fundReplacement: false },
  'tempo-spend-v2': { label: 'Fund replacements', earlierUpgrades: false, fundReplacement: true },
  'tempo-both-v2': { label: 'Both interventions', earlierUpgrades: true, fundReplacement: true },
} as const;
export type RecruitmentPolicyId = keyof typeof RECRUITMENT_POLICIES;
export interface UnitValueParts {
  attack: number;
  health: number;
  keywords: number;
  deathrattle: number;
  legacyContribution: number;
  tempoTotal: number;
  classicTotal: number;
}
/** Exactly the frozen Tempo unit-value formula. These are heuristic units, not win probabilities. */
export function recruitmentValue(unit: Unit, player: Player): UnitValueParts {
  const attack = unit.attack,
    health = unit.health * 0.8;
  const shield = unit.keywords.includes('shield') ? (unit.attack + unit.health) * 0.55 : 0;
  const poison = unit.keywords.includes('poison') ? 12 : 0;
  const windfury = unit.keywords.includes('windfury') ? unit.attack * 0.4 : 0;
  const keywords = shield + poison + windfury;
  const deathrattle = MINION_BY_ID[unit.definitionId].deathrattle ? 4 : 0;
  const classicTotal = unitValue(unit, player),
    legacyContribution = classicTotal * 0.3;
  return {
    attack,
    health,
    keywords,
    deathrattle,
    legacyContribution,
    tempoTotal: attack + health + shield + poison + windfury + deathrattle + legacyContribution,
    classicTotal,
  };
}
export interface Intervention {
  id: 'upgrade-cadence' | 'fund-replacement';
  enabled: boolean;
  eligible: boolean;
  selected: boolean;
  command: RecruitCommand | null;
  checks: Record<string, boolean>;
}
export interface RecruitmentDiagnostics {
  schema: 'hearth.recruitment-diagnostics.v2';
  policy: RecruitmentPolicyId;
  step: number;
  seat: number;
  round: number;
  context: {
    hp: number;
    gold: number;
    tier: number;
    upgradeCost: number;
    boardSize: number;
    handSize: number;
    refreshes: number;
    cadenceRound: number;
    survivalReserve: number;
  };
  legacyDecision: RecruitmentDecision;
  interventions: Intervention[];
  replacement: {
    sell: string;
    intendedBuy: string;
    improvement: number;
    projectedGold: number;
  } | null;
  unitValues: { id: string; definitionId: string; zone: string; value: UnitValueParts }[];
}
export interface RecruitmentV2Decision extends RecruitmentDecision {
  diagnostics: RecruitmentDiagnostics;
}

/** Two orthogonal, versioned interventions around the unchanged v1 controller. */
export function decideRecruitmentV2(
  frame: ArenaFrame,
  policy: RecruitmentPolicyId,
): RecruitmentV2Decision {
  if (!Object.hasOwn(RECRUITMENT_POLICIES, policy)) throw new Error('Unknown recruitment policy.');
  const factors = RECRUITMENT_POLICIES[policy],
    o = frame.observation,
    p = o.self;
  const legacy = decideRecruitment(frame, policy === 'baseline-v1' ? 'baseline-v1' : 'tempo-v1');
  const signal = o.lobby.find((row) => row.id === o.opponent?.playerId)?.style;
  const survivalReserve = signal === 'tempo-v1' ? 25 : 18;
  const cadenceRound = p.tier * 2;
  const upgrade = frame.actions.find((a) => a.command.type === 'upgrade')?.command ?? null;
  const protectedReasons = [
    'discover-value',
    'deploy-strength',
    'replace-weakest',
    'complete-triple',
  ];
  const cadenceChecks = {
    legalUpgrade: !!upgrade,
    changesLegacyAction: legacy.command.type !== 'upgrade',
    survivalReserve: p.hp > survivalReserve,
    scheduledRound: o.round >= cadenceRound,
    boardReady: p.board.length >= Math.min(5, o.round) || o.round === 2,
    preserveMandatoryPriority: !protectedReasons.includes(legacy.reason),
  };
  const value = (unit: Unit, player = p) => recruitmentValue(unit, player).tempoTotal;
  const weakest = [...p.board].sort((a, b) => value(a) - value(b))[0];
  const projected = { ...p, board: p.board.filter((unit) => unit.id !== weakest?.id) };
  const offer = [...p.shop].sort((a, b) => value(b, projected) - value(a, projected))[0];
  const sell = weakest
    ? (frame.actions.find((a) => a.command.type === 'sell' && a.command.id === weakest.id)
        ?.command ?? null)
    : null;
  const improvement = weakest && offer ? value(offer, projected) - value(weakest) : 0;
  const frozenTriple =
    p.frozen &&
    p.shop.some(
      (unit) =>
        [...p.board, ...p.hand].filter(
          (own) => !own.golden && own.definitionId === unit.definitionId,
        ).length === 2,
    );
  const spendingChecks = {
    legacyWouldFinish: ['finish', 'baseline-order'].includes(legacy.reason),
    twoGold: p.gold === 2,
    fullBoard: p.board.length === 7,
    emptyHand: p.hand.length === 0,
    legalSale: !!sell,
    strongerOffer: !!offer && improvement > 2,
    preserveFrozenTriple: !frozenTriple,
    // Reserve enough actions for sell, buy, deploy and a possible extra play after a triple.
    commandHeadroom: o.turn.actions <= 116,
    // A subsequent upgrade must not consume the gold intended for the purchase.
    preservePurchaseBudget: p.tier === 6 || p.upgradeCost > 3 || p.hp <= survivalReserve,
  };
  const interventions: Intervention[] = [
    {
      id: 'upgrade-cadence',
      enabled: factors.earlierUpgrades,
      eligible: Object.values(cadenceChecks).every(Boolean),
      selected: false,
      command: upgrade,
      checks: cadenceChecks,
    },
    {
      id: 'fund-replacement',
      enabled: factors.fundReplacement,
      eligible: Object.values(spendingChecks).every(Boolean),
      selected: false,
      command: sell,
      checks: spendingChecks,
    },
  ];
  const selected = interventions.find((entry) => entry.enabled && entry.eligible);
  let decision = legacy;
  if (selected) {
    selected.selected = true;
    decision = {
      command: selected.command!,
      reason: `${selected.id}-v2`,
      ...(signal ? { styleSignal: signal } : {}),
    };
  }
  const diagnostics: RecruitmentDiagnostics = {
    schema: 'hearth.recruitment-diagnostics.v2',
    policy,
    step: frame.step,
    seat: p.id,
    round: o.round,
    context: {
      hp: p.hp,
      gold: p.gold,
      tier: p.tier,
      upgradeCost: p.upgradeCost,
      boardSize: p.board.length,
      handSize: p.hand.length,
      refreshes: o.turn.refreshes,
      cadenceRound,
      survivalReserve,
    },
    legacyDecision: legacy,
    interventions,
    replacement:
      weakest && offer
        ? { sell: weakest.id, intendedBuy: offer.id, improvement, projectedGold: p.gold + 1 }
        : null,
    unitValues: (['board', 'hand', 'shop', 'discover'] as const).flatMap((zone) =>
      p[zone].map((unit) => ({
        id: unit.id,
        definitionId: unit.definitionId,
        zone,
        value: recruitmentValue(unit, p),
      })),
    ),
  };
  return { ...decision, diagnostics };
}
