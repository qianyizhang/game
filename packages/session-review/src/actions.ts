import type { TraceEvent } from './contracts.ts';
export interface TraceAction {
  key: string;
  anchor: TraceEvent;
  records: TraceEvent[];
  executions: TraceEvent[];
  results: TraceEvent[];
}
const result = (event: TraceEvent) =>
  /\/(function_call_output|custom_tool_call_output)$/.test(event.sourceType ?? '');
/** A presentation group only: every source record keeps its identity and body. */
export function traceActions(events: TraceEvent[]): TraceAction[] {
  const groups = new Map<string, TraceAction>();
  const byKey = new Map(events.map((event, index) => [event.key, { event, index }]));
  const byCall = new Map<string, string>();
  for (const event of events)
    if (event.callId && !result(event))
      byCall.set(JSON.stringify([event.threadId, event.turnId, event.callId]), event.key);
  for (const event of events) {
    const parent =
      event.parentCall ??
      (event.callId && result(event)
        ? byCall.get(JSON.stringify([event.threadId, event.turnId, event.callId]))
        : undefined);
    const key = parent && byKey.has(parent) ? parent : event.key;
    let group = groups.get(key);
    if (!group) {
      const anchor = byKey.get(key)?.event ?? event;
      group = { key, anchor, records: [], executions: [], results: [] };
      groups.set(key, group);
    }
    group.records.push(event);
    if (event.parentCall || /CommandExecution|McpToolCall/.test(event.sourceType ?? ''))
      group.executions.push(event);
    if (result(event)) group.results.push(event);
  }
  return [...groups.values()].sort(
    (a, b) => (byKey.get(a.key)?.index ?? 0) - (byKey.get(b.key)?.index ?? 0),
  );
}
