import { fileURLToPath } from 'node:url';
import { build } from 'vite';

export const APP_URI = 'ui://repo-canvas/workbench-v2.html';
let resource: Promise<string> | undefined;
/** Deliver one self-contained resource; the iframe makes no network requests. */
export function appResource(): Promise<string> {
  resource ??= (async () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    // Multiple chats can own servers. Keep their builds in memory instead of
    // racing to empty/write the same dist directory.
    const result = await build({
      root,
      configFile: `${root}/vite.config.ts`,
      logLevel: 'error',
      build: { write: false },
    });
    if (Array.isArray(result) || !('output' in result)) throw new Error('Expected one UI bundle');
    const files = new Map(
      result.output.map((item) => [
        item.fileName,
        item.type === 'chunk' ? item.code : Buffer.from(item.source).toString('utf8'),
      ]),
    );
    const read = (path: string) => {
      const content = files.get(path.replace(/^\//, ''));
      if (content === undefined) throw new Error(`Missing UI bundle asset: ${path}`);
      return content;
    };
    const html = read('index.html');
    return html
      .replace('<head>', '<head><meta name="repo-canvas-mcp-app" content="true">')
      .replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g, (_tag, path: string) => {
        const js = read(path);
        return `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`;
      })
      .replace(/<link[^>]*href="([^"]+\.css)"[^>]*>/g, (_tag, path: string) => {
        const css = read(path);
        return `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`;
      });
  })().catch((error: unknown) => {
    resource = undefined;
    throw error;
  });
  return resource;
}
