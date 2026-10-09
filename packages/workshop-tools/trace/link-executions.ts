import ts from 'typescript';
import { createHash } from 'node:crypto';
import type { TraceEvent } from './contracts.ts';
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
/** Extract literal exec_command arguments without executing any trace code. Dynamic expressions stay unlinked. */
export function commandHashes(text: string, name: string): string[] {
  if (text.length > 200000) return [];
  if (/exec_command$/.test(name)) {
    try {
      const args = JSON.parse(text) as { cmd?: unknown };
      return typeof args.cmd === 'string' ? [hash(args.cmd)] : [];
    } catch {
      return [];
    }
  }
  if (!/(^|[.])exec$/.test(name)) return [];
  const file = ts.createSourceFile(
    'trace.js',
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const found = new Set<string>();
  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'exec_command' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const property of node.arguments[0].properties)
        if (
          ts.isPropertyAssignment(property) &&
          ((ts.isIdentifier(property.name) && property.name.text === 'cmd') ||
            (ts.isStringLiteral(property.name) && property.name.text === 'cmd')) &&
          ts.isStringLiteralLike(property.initializer)
        )
          found.add(hash(property.initializer.text));
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return [...found];
}
export function executionCommand(argv: unknown): string {
  if (typeof argv === 'string') return argv;
  if (!Array.isArray(argv) || !argv.every((arg) => typeof arg === 'string')) return '';
  return argv.length >= 3 && ['-lc', '-c'].includes(String(argv[1]))
    ? String(argv[2])
    : JSON.stringify(argv);
}
export type ExecutionLink = {
  event: TraceEvent;
  commands: string[];
  nativeId?: string;
  startedAt?: number;
};
/** Only unambiguous literal commands begun after a same-turn call, or explicit native call IDs, establish a link. */
export function linkExecutions(records: ExecutionLink[]): void {
  const calls = records.filter(
    ({ event }) =>
      /\/(function_call|custom_tool_call)$/.test(event.sourceType ?? '') && event.callId,
  );
  for (const record of records) {
    if (!record.nativeId) continue;
    const candidates = calls.filter(
      (call) =>
        call.event.threadId === record.event.threadId &&
        call.event.turnId === record.event.turnId &&
        (call.event.sourceLine ?? 0) < (record.event.sourceLine ?? 0) &&
        (record.nativeId === call.event.callId ||
          record.commands.some((cmd) => call.commands.includes(cmd))) &&
        (record.startedAt === undefined ||
          !call.event.timestamp ||
          Date.parse(call.event.timestamp) <= record.startedAt),
    );
    const exact = candidates.filter((call) => call.event.callId === record.nativeId);
    // Known start time chooses the most recent preceding invocation. Without timing, ambiguity remains visible.
    const candidate =
      exact.length === 1
        ? exact[0]
        : record.startedAt !== undefined
          ? candidates.at(-1)
          : candidates.length === 1
            ? candidates[0]
            : undefined;
    if (candidate) record.event.parentCall = candidate.event.key;
  }
}
export function nativeCommandHash(argv: unknown): string[] {
  const cmd = executionCommand(argv);
  return cmd ? [hash(cmd)] : [];
}
