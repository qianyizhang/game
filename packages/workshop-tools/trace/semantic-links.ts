import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { TraceEvent } from './contracts.ts';
type Operation = { image: boolean; patchPaths: string[] };
const pathKey = (path: string, cwd?: string) => {
  try {
    if (path.startsWith('file://')) path = fileURLToPath(path);
  } catch {
    return path;
  }
  return cwd ? resolve(cwd, path) : path;
};
/** Inspect syntax only. Never execute recorded scripts or resolve their paths on disk. */
export function semanticOperation(text: string, name: string, cwd?: string): Operation {
  const operation: Operation = { image: /(?:^|[._])view_image$/.test(name), patchPaths: [] };
  const patch = (value: string) => {
    for (const match of value.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm))
      operation.patchPaths.push(pathKey(match[1].trim(), cwd));
  };
  if (/(?:^|[._])apply_patch$/.test(name)) patch(text);
  if (!/(?:^|[.])exec$/.test(name) || text.length > 200000) return operation;
  const file = ts.createSourceFile(
    'trace.js',
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      if (node.expression.name.text === 'view_image') operation.image = true;
      if (
        node.expression.name.text === 'apply_patch' &&
        node.arguments[0] &&
        ts.isStringLiteralLike(node.arguments[0])
      )
        patch(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return operation;
}
/** A closed, unique call interval plus matching operation evidence is required; adjacency alone is insufficient. */
export function linkSemanticActions(events: TraceEvent[], operations: Map<string, Operation>) {
  const calls = events.filter((e) => operations.has(e.key) && e.callId);
  const spans = calls.flatMap((call) => {
    const results = events.filter(
      (e) =>
        e.callId === call.callId &&
        /\/(function_call_output|custom_tool_call_output)$/.test(e.sourceType ?? ''),
    );
    return results.length === 1
      ? [{ call, result: results[0], operation: operations.get(call.key)! }]
      : [];
  });
  for (const event of events) {
    if (event.parentCall || !/\/(ImageView|FileChange)$/.test(event.sourceType ?? '')) continue;
    const candidates = spans.filter(({ call, result, operation }) => {
      if (call.ordinal >= event.ordinal || result.ordinal <= event.ordinal) return false;
      if (event.kind === 'edit')
        return (
          event.paths.length > 0 &&
          event.paths.every((path) => operation.patchPaths.includes(pathKey(path)))
        );
      const images = events.filter(
        (e) =>
          /\/ImageView$/.test(e.sourceType ?? '') &&
          e.ordinal > call.ordinal &&
          e.ordinal < result.ordinal,
      );
      return (
        operation.image &&
        images.length === (result.body?.imageCount ?? result.imageUrls?.length ?? 0)
      );
    });
    if (candidates.length === 1) event.parentCall = candidates[0].call.key;
  }
}
