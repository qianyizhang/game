/** Observable actions only. Unknown payloads and private reasoning never enter the bundle. */
export const READ_THREAD_ADAPTER = {
  name: 'ReadThreadExportAdapter',
  format: 'read_thread',
  version: 1,
};
const asText = (value) =>
  typeof value === 'string' ? value : JSON.stringify(value ?? '', null, 2);
const excluded = new Set(['reasoning', 'inAppBrowserContext', 'browserContext']);
export const eventKey = (ref) =>
  JSON.stringify([ref.thread ?? ref.threadId, ref.turn ?? ref.turnId, ref.event ?? ref.id]);
export function normalizeThread(page, role = 'Agent') {
  if (page.schemaVersion !== 1 || !page.thread?.id || !Array.isArray(page.turns))
    throw new Error('Expected a schemaVersion 1 read_thread export.');
  if (page.page?.hasMore)
    throw new Error('Export is paginated; collect all turns before building.');
  const coverage = {
    totalItems: 0,
    normalizedItems: 0,
    unsupportedItems: [],
    excludedItems: [],
    truncatedItems: 0,
    displayTruncatedItems: 0,
  };
  const recordOmission = (list, item, base) => {
    const type = item.type ?? '(missing type)';
    let group = list.find((x) => x.type === type);
    if (!group) list.push((group = { type: item.type ?? '(missing type)', count: 0, refs: [] }));
    group.count++;
    group.refs.push({
      thread: base.threadId,
      turn: base.turnId,
      event: base.id,
      ordinal: base.ordinal,
    });
  };
  const cleanUser = (content) =>
    (content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .replace(/<in-app-browser-context\b[\s\S]*?<\/in-app-browser-context>/g, '')
      .replace(/^\s*## My request:\s*/m, '')
      .trim();
  const thread = {
    id: page.thread.id,
    title: page.thread.title || role,
    role,
    source: { ...READ_THREAD_ADAPTER, rawSchemaVersion: page.schemaVersion },
  };
  const turnIds = new Set();
  const turns = [...page.turns]
    .sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0))
    .map((turn) => {
      if (!turn.id || turnIds.has(turn.id) || !Array.isArray(turn.items))
        throw new Error('Missing or duplicate turn identity / items');
      turnIds.add(turn.id);
      const events = [],
        ids = new Set();
      for (const [index, item] of turn.items.entries()) {
        const base = {
          id: item.id ?? `${turn.id}:item:${index + 1}`,
          threadId: thread.id,
          turnId: turn.id,
          ordinal: index + 1,
          role,
          status: item.status ?? '',
          paths: [],
          relatedThreads: [],
          sourceType: item.type,
          sourceTruncated: Boolean(item.truncated || item.textTruncated || item.contentTruncated),
        };
        if (ids.has(base.id)) throw new Error(`Duplicate event identity: ${turn.id} / ${base.id}`);
        ids.add(base.id);
        coverage.totalItems++;
        let event;
        switch (item.type) {
          case 'userMessage':
            event = {
              kind: 'request',
              title: 'User request',
              text: cleanUser(item.content),
              role: 'User',
            };
            break;
          case 'agentMessage':
            event = {
              kind: 'message',
              title: item.phase === 'final_answer' ? 'Completion report' : 'Progress / review',
              text: asText(item.text),
            };
            break;
          case 'commandExecution':
            event = {
              kind: 'command',
              title: (item.command ?? '').split('\n')[0].slice(0, 180),
              text: asText(item.command),
              output: asText(item.output?.text ?? '(Output not included)'),
              exitCode: item.exitCode,
              durationMs: item.durationMs,
              sourceTruncated: Boolean(
                base.sourceTruncated || item.commandTruncated || item.output?.truncated,
              ),
            };
            break;
          case 'fileChange':
            event = {
              kind: 'edit',
              title: 'Recorded file changes',
              text: (item.changes ?? [])
                .map((c) => `${c.path}\n${c.diff?.text ?? '(No diff included)'}`)
                .join('\n\n'),
              paths: (item.changes ?? []).map((c) => c.path),
              sourceTruncated:
                base.sourceTruncated || (item.changes ?? []).some((c) => c.diff?.truncated),
            };
            break;
          case 'imageView':
            event = {
              kind: 'image',
              title: 'Inspected image',
              text: asText(item.path),
              paths: item.path ? [item.path] : [],
            };
            break;
          case 'webSearch':
            event = {
              kind: 'reference',
              title: 'Reference lookup',
              text: asText(item.action ?? item.query),
            };
            break;
          case 'subAgentActivity':
            event = {
              kind: 'delegation',
              title: `Agent ${item.kind}`,
              text: `${item.agentPath ?? ''}\n${item.agentThreadId ?? ''}`,
              relatedThreads: [
                ...new Set(
                  [
                    item.agentThreadId,
                    ...(item.agentThreadIds ?? []),
                    ...(item.receiverThreadIds ?? []),
                  ].filter(Boolean),
                ),
              ],
            };
            break;
          case 'collabAgentToolCall':
            event = {
              kind: 'delegation',
              title: item.tool ?? 'Collaboration',
              text: asText(item.prompt ?? '(Prompt not included)'),
              relatedThreads: [...new Set(item.receiverThreadIds ?? [])],
            };
            break;
          default:
            recordOmission(
              excluded.has(item.type) ? coverage.excludedItems : coverage.unsupportedItems,
              item,
              base,
            );
            continue;
        }
        const normalized = {
          ...base,
          ...event,
          preview: event.text.slice(0, 1200),
          displayTruncated: event.text.length > 1200 || (event.output?.length ?? 0) > 1200,
        };
        normalized.key = eventKey(normalized);
        coverage.normalizedItems++;
        if (normalized.sourceTruncated) coverage.truncatedItems++;
        if (normalized.displayTruncated) coverage.displayTruncatedItems++;
        events.push(normalized);
      }
      return {
        id: turn.id,
        threadId: thread.id,
        startedAt: turn.startedAt,
        completedAt: turn.completedAt,
        events,
      };
    });
  return { ...thread, coverage, turns };
}
export function scriptJSON(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
