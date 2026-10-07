import { isList, objectValue } from '../shared/json';

/** Read receipt-comparison fields only; this is not a replay execution or validity verdict. */
export function replayEnvelope(text: string): Record<string, unknown> & { commands: unknown[] } {
  const value = objectValue(JSON.parse(text));
  if (!isList(value.commands)) throw new Error('Replay commands must be an array.');
  return { ...value, commands: value.commands };
}
