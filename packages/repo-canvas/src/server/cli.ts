import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { apiPlugin } from './api.ts';
import { Repository } from './repository.ts';
import { verifyServer } from './verify.ts';
const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : (args[index + 1] ?? fallback);
};
const root = resolve(option('--repo', process.env.INIT_CWD ?? process.cwd()));
if (args.includes('--verify')) {
  try {
    await verifyServer(
      Number(option('--port', '4317')),
      args.includes('--stdio') ? root : undefined,
    );
  } catch (error) {
    console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
} else if (args.includes('--validate')) {
  const snapshot = new Repository(root).snapshot();
  console.log(
    JSON.stringify({
      valid: true,
      revision: snapshot.revision,
      saved: snapshot.saved,
      modules: snapshot.document.modules.length,
    }),
  );
} else {
  const port = Number(option('--port', '4317'));
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../', import.meta.url)),
    plugins: [react(), apiPlugin(root)],
    server: { host: '127.0.0.1', port, strictPort: true, cors: false, fs: { strict: true } },
  });
  await server.listen();
  console.log(
    `Repo Canvas · ${root}\nOpen Repo Canvas from Codex’s apps menu (canvas_open). Browser editing preview: http://127.0.0.1:${port}.\nMCP bridge: http://127.0.0.1:${port}/mcp · requests are handled by your current chat. No model process is launched.`,
  );
}
