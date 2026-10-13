import { hosted, hostTool } from './host';
import type { Snapshot } from '../model/document';
export type Session = Snapshot & { token: string; plugin: string };
export async function request<T>(
  path: string,
  token?: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  if (hosted) {
    const url = new URL(path, 'http://canvas/');
    const action =
      path === 'state'
        ? method === 'PUT'
          ? 'save'
          : 'state'
        : url.pathname === '/source'
          ? 'source'
          : url.pathname === '/chat'
            ? method === 'POST'
              ? 'send'
              : 'chat'
            : path === 'chat/cancel'
              ? 'cancel'
              : path === 'draft'
                ? method === 'PUT'
                  ? 'draft_write'
                  : 'draft_read'
                : '';
    if (!action) throw new Error('Unknown canvas operation');
    return hostTool<T>(action, {
      ...Object.fromEntries(url.searchParams),
      ...(body && typeof body === 'object' ? body : {}),
    });
  }
  const response = await fetch(`/api/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Repo-Canvas-Token': token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status})`);
  return result;
}
export function download(value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'architecture.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
