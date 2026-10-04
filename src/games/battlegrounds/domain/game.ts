import { hashSeed } from '../../../shared/random';
import { HEROES, RECRUITS } from '../content/minions';
import { runBot } from './bots';
import { resolveCombat } from './combat';
import {
  bgLog,
  endRecruitment,
  initialPlayer,
  POOL_COPIES,
  recruitAction,
  returnUnits,
  startRecruitment,
} from './recruitment';
import type { BGCommand, BGState, Player } from './types';

export const BG_VERSION = 5;
export function createBG(seedInput: string): BGState {
  const seed = seedInput.trim().slice(0, 64) || 'HEARTH-01';
  return {
    version: BG_VERSION,
    seed,
    rng: hashSeed(seed),
    nextId: 1,
    phase: 'hero',
    round: 1,
    players: Array.from({ length: 8 }, (_, id) => initialPlayer(id)),
    pool: Object.fromEntries(RECRUITS.map((m) => [m.id, POOL_COPIES[m.tier]])),
    ghost: [],
    ghostTier: 1,
    pairings: [],
    scouting: [],
    opponent: null,
    lastCombat: null,
    matchups: [],
    notice: 'Choose your hero. Seven rivals are ready at the hearth.',
    log: [],
  };
}
function eliminate(run: BGState, player: Player, placement: number) {
  run.ghost = structuredClone(player.board);
  run.ghostTier = player.tier;
  returnUnits(run, [...player.board, ...player.hand, ...player.shop, ...player.discover]);
  player.board = [];
  player.hand = [];
  player.shop = [];
  player.discover = [];
  player.eliminatedRound = run.round;
  player.placement = placement;
  bgLog(run, `${player.name} is eliminated in place ${placement}.`);
}
function combatRound(run: BGState) {
  const alive = run.players.filter((p) => p.hp > 0);
  for (const player of alive) if (player.id !== 0) runBot(run, player);
  for (const player of alive) endRecruitment(player);
  const pairing = run.pairings;
  run.scouting = alive.map((p) => ({
    playerId: p.id,
    round: run.round,
    tier: p.tier,
    board: structuredClone(p.board),
  }));
  run.matchups = [];
  run.lastCombat = null;
  for (let i = 0; i < pairing.length; i += 2) {
    const left = run.players[pairing[i]];
    const right = pairing[i + 1] === undefined ? null : run.players[pairing[i + 1]];
    // Put the human on the left in the visible battle, independent of pairing order.
    const a = right?.id === 0 ? right : left;
    const b = right?.id === 0 ? left : right;
    const result = resolveCombat(
      a.board,
      b?.board ?? run.ghost,
      [a.tier, b?.tier ?? run.ghostTier],
      run.rng,
      a.id === 0,
    );
    run.rng = result.rng;
    a.hp -= result.damage[0];
    if (b) b.hp -= result.damage[1];
    const winner = result.winner === 0 ? a.id : result.winner === 1 ? (b?.id ?? null) : null;
    run.matchups.push({
      left: a.id,
      right: b?.id ?? null,
      winner,
      damage: Math.max(...result.damage),
      ghost: !b,
    });
    if (a.id === 0) {
      run.lastCombat = result;
      run.opponent = b?.id ?? null;
    }
  }
  // A finite-lobby rule for this local study: escalating fatigue after round 15.
  // It also resolves all-zero-attack or endlessly tied warbands without an infinite lobby.
  if (run.round > 15) for (const player of alive) player.hp -= run.round - 15;
  const defeated = alive.filter((p) => p.hp <= 0).sort((a, b) => a.hp - b.hp || b.id - a.id);
  let remaining = alive.length;
  for (const player of defeated) eliminate(run, player, remaining--);
  const survivors = run.players.filter((p) => p.hp > 0);
  if (survivors.length === 1) survivors[0].placement = 1;
  // In a simultaneous final fatigue elimination, the last-ranked player is the winner.
  const human = run.players[0];
  if (human.placement === 1) {
    run.phase = 'won';
    bgLog(run, 'First place. The last hearth belongs to you.');
  } else if (human.hp <= 0) {
    run.phase = 'lost';
    bgLog(
      run,
      `Your lobby ends in place ${human.placement}. Review the last combat to see what happened.`,
    );
  } else {
    run.phase = 'combat';
    bgLog(
      run,
      `Round ${run.round} resolved. ${survivors.length} players remain.${run.round > 15 ? ` Everyone also lost ${run.round - 15} HP to fatigue.` : ''}`,
    );
  }
}
export function transitionBG(
  previous: BGState,
  command: BGCommand,
): { state: BGState; error?: string } {
  const run = structuredClone(previous);
  const reject = (error: string) => ({ state: previous, error });
  if (run.phase === 'won' || run.phase === 'lost') return reject('This lobby is finished.');
  if (command.type === 'chooseHero') {
    if (run.phase !== 'hero' || !HEROES.some((h) => h.id === command.hero))
      return reject('Choose an available hero before recruiting.');
    run.players[0].hero = command.hero;
    startRecruitment(run);
    return { state: run };
  }
  if (command.type === 'nextRound') {
    if (run.phase !== 'combat') return reject('Finish combat before starting the next round.');
    run.round++;
    startRecruitment(run);
    return { state: run };
  }
  if (run.phase !== 'recruit') return reject('Recruitment is not active.');
  if (command.type === 'endRecruit') {
    if (run.players[0].discover.length)
      return reject('Choose your Discover reward before fighting.');
    combatRound(run);
    return { state: run };
  }
  const error = recruitAction(run, run.players[0], command);
  if (error) return reject(error);
  bgLog(
    run,
    command.type === 'freeze'
      ? run.players[0].frozen
        ? 'Shop frozen for next round.'
        : 'Shop unfrozen.'
      : `Recruitment action: ${command.type}.`,
  );
  return { state: run };
}

/** Accounting query for tests and the inspector. Combat snapshots never own pool copies. */
export function supplyTotal(run: BGState, definitionId: string): number {
  return (
    run.pool[definitionId] +
    run.players.reduce(
      (sum, p) =>
        sum +
        [...p.board, ...p.hand, ...p.shop, ...p.discover]
          .filter((u) => u.definitionId === definitionId)
          .reduce((copies, u) => copies + u.copies, 0),
      0,
    )
  );
}
