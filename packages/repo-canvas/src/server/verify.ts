import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { APP_URI } from './app-resource.ts';

/** Probe the running endpoint without changing a map or starting a model turn. */
export async function verifyServer(port: number, stdioRepo?: string) {
  const client = new Client({ name: 'repo-canvas-verify', version: '1' });
  const endpoint = new URL(`http://127.0.0.1:${port}/mcp`);
  const timer = setTimeout(() => {
    console.error('FAIL: MCP verification timed out after 30 seconds.');
    process.exit(1);
  }, 30_000);
  try {
    await client.connect(
      stdioRepo
        ? new StdioClientTransport({
            command: process.execPath,
            args: [fileURLToPath(new URL('./stdio.ts', import.meta.url)), '--repo', stdioRepo],
          })
        : new StreamableHTTPClientTransport(endpoint),
    );
    const { tools } = await client.listTools();
    for (const name of ['canvas_open', 'canvas_app', 'canvas_read', 'canvas_reply']) {
      assert(
        tools.some((tool) => tool.name === name),
        `Missing tool: ${name}`,
      );
    }
    assert.partialDeepStrictEqual(tools.find((tool) => tool.name === 'canvas_open')?._meta, {
      ui: { resourceUri: APP_URI },
      'openai/ui': { entrypoints: [{ type: 'thread' }] },
    });
    assert.partialDeepStrictEqual(tools.find((tool) => tool.name === 'canvas_app')?._meta, {
      ui: { visibility: ['app'] },
    });
    const opened = await client.callTool({ name: 'canvas_open', arguments: {} });
    assert(!opened.isError, 'canvas_open returned an error');
    const { contents } = await client.readResource({ uri: APP_URI });
    const resource = contents.find((item) => item.uri === APP_URI);
    assert(resource && 'text' in resource, 'Missing HTML resource');
    assert.equal(resource.mimeType, 'text/html;profile=mcp-app');
    assert.match(resource.text, /name="repo-canvas-mcp-app"/);
    assert.doesNotMatch(resource.text, /<script[^>]+src=|<link[^>]+href=["'][^"']+\.css/);
    console.log(
      JSON.stringify({
        server: 'pass',
        transport: stdioRepo ? 'stdio (Codex-managed process)' : 'streamable-http',
        endpoint: stdioRepo ? undefined : endpoint.href,
        tools: tools.map((tool) => tool.name),
        resource: APP_URI,
        htmlBytes: Buffer.byteLength(resource.text),
        currentChat: 'not tested',
        note: 'This fresh MCP connection does not refresh Codex. If the panel reports unknown MCP server, fully quit and reopen Codex, then return to the same chat and retry.',
      }),
    );
  } finally {
    clearTimeout(timer);
    await client.close();
  }
}
