import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { parseChat } from '../model/document.ts';
import { Repository } from './repository.ts';
import { CanvasBridge } from './bridge.ts';
import { serveMcp } from './mcp.ts';

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk as Uint8Array);
    size += bytes.length;
    if (size > 2_000_000) throw new Error('Request exceeds 2 MB');
    chunks.push(bytes);
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString());
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as Record<string, unknown>;
}
function json(res: ServerResponse, value: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(value));
}
export function apiPlugin(root: string): Plugin {
  const repository = new Repository(root),
    token = randomBytes(24).toString('hex');
  const bridge = new CanvasBridge();
  return {
    name: 'repo-canvas-local-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/') && req.url !== '/mcp') {
          next();
          return;
        }
        void (async () => {
          const host = req.headers.host ?? '';
          if (
            !/^127\.0\.0\.1:\d+$/.test(host) ||
            (req.headers.origin && req.headers.origin !== `http://${host}`) ||
            req.headers['sec-fetch-site'] === 'cross-site'
          ) {
            json(res, { error: 'Only same-origin loopback requests are allowed' }, 403);
            return;
          }
          const url = new URL(req.url!, `http://${host}`);
          if (url.pathname === '/mcp') {
            await serveMcp(
              req,
              res,
              req.method === 'POST' ? await body(req) : undefined,
              bridge,
              repository,
            );
            return;
          }
          if (req.method === 'GET' && url.pathname === '/api/state') {
            json(res, { ...repository.snapshot(), token, plugin: 'Current Codex chat via MCP' });
            return;
          }
          if (req.headers['x-repo-canvas-token'] !== token) {
            json(res, { error: 'Missing local session token' }, 403);
            return;
          }
          if (url.pathname === '/api/draft') {
            json(
              res,
              req.method === 'PUT' ? bridge.storeDraft((await body(req)).draft) : bridge.draft(),
            );
            return;
          }
          if (req.method === 'GET' && url.pathname === '/api/source') {
            json(res, repository.source(url.searchParams.get('path')));
            return;
          }
          if (req.method === 'PUT' && url.pathname === '/api/state') {
            const data = await body(req);
            json(res, repository.save(data.document, String(data.revision)));
            return;
          }
          if (req.method === 'GET' && url.pathname === '/api/chat') {
            json(res, bridge.current(url.searchParams.get('canvasId')));
            return;
          }
          if (req.method === 'POST' && url.pathname === '/api/chat/cancel') {
            const data = await body(req);
            json(res, bridge.cancel(data.canvasId, data.id));
            return;
          }
          if (req.method === 'POST' && url.pathname === '/api/chat') {
            const data = await body(req);
            json(res, bridge.enqueue(data.canvasId, parseChat(data)));
            return;
          }
          json(res, { error: 'Unknown route' }, 404);
        })().catch((error: unknown) =>
          json(
            res,
            { error: error instanceof Error ? error.message : String(error) },
            error instanceof Error && error.message.startsWith('Conflict:') ? 409 : 400,
          ),
        );
      });
    },
  };
}
