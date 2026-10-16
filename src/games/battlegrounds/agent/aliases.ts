import type { ArenaObservation } from '../application/arena';
import type { RecruitCommand } from '../domain/arena';

/** Evaluator-owned bindings. Native IDs are allocated globally and reveal rival activity. */
export interface AliasMemory {
  bindings: Record<string, string>;
  next: number;
}
export const emptyAliases = (): AliasMemory => ({ bindings: {}, next: 1 });

/** Register only entities encountered in the permitted view, in visible collection order. */
export function aliasView(view: ArenaObservation, previous: AliasMemory) {
  const memory = structuredClone(previous);
  const alias = (native: string) => (memory.bindings[native] ??= `entity-${memory.next++}`);
  const observation = structuredClone(view);
  const p = observation.self;
  for (const collection of [p.board, p.hand, p.shop, p.discover])
    for (const unit of collection) unit.id = alias(unit.id);
  if (p.tavern) {
    if (p.tavern.offer) p.tavern.offer.id = alias(p.tavern.offer.id);
    for (const spell of p.tavern.hand) spell.id = alias(spell.id);
  }
  for (const unit of observation.opponent?.board ?? []) unit.id = alias(unit.id);
  return { observation, memory };
}

/** Commands must refer exclusively to entities registered from the visible view. */
export function aliasCommand(command: RecruitCommand, memory: AliasMemory): RecruitCommand {
  const result = structuredClone(command);
  const visible = (id: string) => {
    const alias = memory.bindings[id];
    if (!alias) throw new Error('Command references an entity outside the permitted view.');
    return alias;
  };
  if ('id' in result) result.id = visible(result.id);
  if ('target' in result && result.target !== undefined) result.target = visible(result.target);
  return result;
}
