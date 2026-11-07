import type { Plugin } from 'vite';
import { repositoryRoot } from '../io.ts';
import { snapshotHistory, currentArtwork } from './history.ts';
import { historyHtml } from './history-page.ts';
import {
  historyDocument,
  historyState,
  historyPreview,
  readHistory,
  removalPlan,
  useRevision,
  removeRevision,
  attemptRemovalPlan,
  removeAttempt,
} from './history-store.ts';

/** Local explicit actions only. The dev server's existing loopback binding remains in force. */
export function artHistoryPlugin(root = repositoryRoot): Plugin {
  return {
    name: 'card-workshop-art-history',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith('/__art/')) {
          next();
          return;
        }
        void (async () => {
          const host = request.headers.host ?? '';
          if (!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(host))
            throw new Error('Art history is available only on loopback');
          const json = (value: unknown) => {
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify(value));
          };
          response.setHeader('cache-control', 'no-store');
          if (request.method === 'GET') {
            if (url.pathname === '/__art/') {
              response.setHeader('content-type', 'text/html');
              response.end(historyHtml());
            } else if (url.pathname === '/__art/api/state') json(historyState(root));
            else if (url.pathname === '/__art/api/artwork') {
              const version = url.searchParams.get('version') ?? '';
              const revision = url.searchParams.get('revision');
              const asset = url.searchParams.get('asset');
              if (revision !== null && asset === null)
                json(historyPreview(root, version, revision));
              else if (asset !== null && revision === null) {
                const state = readHistory(root);
                if (state.version !== version)
                  throw new Error('History changed. Reload before viewing artwork.');
                if (!state.history.assets.some((item) => item.id === asset))
                  throw new Error('Unknown asset');
                const current = await currentArtwork(asset);
                if (readHistory(root).version !== version)
                  throw new Error('History changed. Reload before viewing artwork.');
                json({ kind: 'image', url: current[asset], animated: false });
              } else throw new Error('Choose one asset or revision');
            } else if (url.pathname === '/__art/api/removal')
              json(
                url.searchParams.get('kind') === 'attempt'
                  ? attemptRemovalPlan(root, url.searchParams.get('revision') ?? '')
                  : removalPlan(root, url.searchParams.get('revision') ?? ''),
              );
            else if (url.pathname === '/__art/api/file') {
              const file = url.searchParams.get('file') ?? '';
              if (
                !readHistory(root).history.attempts.some((attempt) => attempt.files.includes(file))
              )
                throw new Error('File is not registered in an attempt');
              json(historyDocument(root, file));
            } else {
              response.statusCode = 404;
              json({ error: 'Unknown art history route' });
            }
            return;
          }
          if (
            request.method !== 'POST' ||
            request.headers.origin !== `http://${host}` ||
            request.headers['content-type'] !== 'application/json'
          )
            throw new Error('Writes require a same-origin JSON request');
          let body = '';
          for await (const chunk of request) {
            body += String(chunk);
            if (body.length > 65536) throw new Error('Request is too large');
          }
          const value: unknown = JSON.parse(body);
          if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new Error('Invalid action');
          const input = value as Record<string, unknown>;
          if (typeof input.version !== 'string') throw new Error('Missing history version');
          if (url.pathname === '/__art/api/snapshot' && typeof input.asset === 'string') {
            json(await snapshotHistory(root, input.version, input.asset));
            return;
          }
          if (
            url.pathname === '/__art/api/use' &&
            typeof input.asset === 'string' &&
            (typeof input.revision === 'string' || input.revision === null)
          )
            useRevision(root, input.version, input.asset, input.revision);
          else if (url.pathname === '/__art/api/remove' && typeof input.revision === 'string') {
            if (input.kind === 'attempt') removeAttempt(root, input.version, input.revision);
            else removeRevision(root, input.version, input.revision);
          } else throw new Error('Unknown art history action');
          json({ saved: true });
        })().catch((error: unknown) => {
          response.statusCode = 409;
          response.setHeader('content-type', 'application/json');
          response.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Art history action failed',
            }),
          );
        });
      });
    },
  };
}
