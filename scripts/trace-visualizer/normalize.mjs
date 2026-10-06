/** Keep visible actions, never private reasoning or ambient app context. */
export function normalizeThread(page, role = 'Agent') {
  if (page.schemaVersion !== 1 || !page.thread?.id || !Array.isArray(page.turns))
    throw new Error('Expected a schemaVersion 1 read_thread export.');
  if (page.page?.hasMore)
    throw new Error('Export is paginated; collect all turns before building.');
  const clip = (value, max = 16000) => {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '', null, 2);
    return { text: text.slice(0, max), truncated: text.length >= max };
  };
  const cleanUser = (content) =>
    (content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .replace(/<in-app-browser-context\b[\s\S]*?<\/in-app-browser-context>/g, '')
      .replace(/^\s*## My request:\s*/m, '')
      .trim();
  const thread = { id: page.thread.id, title: page.thread.title || role, role };
  const turns = [...page.turns]
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((turn) => {
      const events = [];
      for (const [index, item] of turn.items.entries()) {
        const base = {
          id: item.id,
          threadId: thread.id,
          turnId: turn.id,
          ordinal: index + 1,
          role,
          status: item.status ?? '',
          paths: [],
          truncated: false,
        };
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
              ...clip(item.text),
            };
            break;
          case 'commandExecution':
            event = {
              kind: 'command',
              title: (item.command ?? '').split('\n')[0].slice(0, 180),
              ...clip(item.command),
              output: clip(item.output?.text ?? '(Output not included)').text,
              exitCode: item.exitCode,
              durationMs: item.durationMs,
              truncated: Boolean(
                item.commandTruncated ||
                item.output?.truncated ||
                clip(item.command).truncated ||
                clip(item.output?.text).truncated,
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
              truncated: (item.changes ?? []).some((c) => c.diff?.truncated),
            };
            break;
          case 'imageView':
            event = {
              kind: 'image',
              title: 'Inspected image',
              text: item.path,
              paths: [item.path],
            };
            break;
          case 'webSearch':
            event = {
              kind: 'reference',
              title: 'Reference lookup',
              ...clip(item.action ?? item.query),
            };
            break;
          case 'subAgentActivity':
            event = {
              kind: 'delegation',
              title: `Agent ${item.kind}`,
              text: `${item.agentPath ?? ''}\n${item.agentThreadId ?? ''}`,
              relatedThread: item.agentThreadId,
            };
            break;
          case 'collabAgentToolCall':
            event = {
              kind: 'delegation',
              title: item.tool,
              ...clip(item.prompt ?? item),
              relatedThread: item.receiverThreadIds?.[0],
            };
            break;
          default:
            continue;
        }
        events.push({ ...base, ...event });
      }
      return {
        id: turn.id,
        threadId: thread.id,
        startedAt: turn.startedAt,
        completedAt: turn.completedAt,
        events,
      };
    });
  return { ...thread, turns };
}

export function scriptJSON(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
