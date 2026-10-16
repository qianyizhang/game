import { arenaFrame, type ArenaObservation, type ArenaSession } from '../application/arena';
import type { RecruitCommand } from '../domain/arena';
import { aliasCommand, aliasView, type AliasMemory } from './aliases';

/** Same native command grammar; entity IDs/targets use first-seen opaque aliases. */
export type PolicyCommand = RecruitCommand;
export interface Observation {
  schema: 'hearth-policy-observation-1';
  observation: Omit<ArenaObservation, 'schema'> & { schema: 'hearth.arena-policy-view.v1' };
  actions: { id: string; command: PolicyCommand }[];
}

/** No native frame.step: its global journal count discloses hidden rival actions. */
export function observe(session: ArenaSession, aliases: AliasMemory) {
  const frame = arenaFrame(session, 0);
  const { observation: view, memory } = aliasView(frame.observation, aliases);
  const observation: Observation = {
    schema: 'hearth-policy-observation-1',
    observation: {
      schema: 'hearth.arena-policy-view.v1',
      rulesVersion: view.rulesVersion,
      arenaVersion: view.arenaVersion,
      content: view.content,
      phase: view.phase,
      round: view.round,
      self: view.self,
      lobby: view.lobby.map(({ id, name, hero, hp, tier, placement }) => ({
        id,
        name,
        hero,
        hp,
        tier,
        placement,
      })),
      opponent: view.opponent,
      lastCombat: view.lastCombat,
      activeSeat: view.activeSeat,
      recruitmentOrder: view.recruitmentOrder,
      turn: view.turn,
    },
    actions: frame.actions.map(({ id, command }) => ({
      id,
      command: aliasCommand(command, memory),
    })),
  };
  return { input: observation, aliases: memory };
}
