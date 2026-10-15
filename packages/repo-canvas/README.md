# Repo Canvas

A local architecture workbench that runs as an MCP App inside the current Codex conversation. Inspired by MeVisLab's nested module networks: named modules, visible ports, directional relationships, module inspectors and progressively disclosed internals. The map describes architecture; it does not execute a dataflow network.

## Run in Codex

From the workspace root, select the pinned runtime with `nvm use`, then register the server that Codex starts automatically:

```sh
codex mcp add repo_canvas -- "$(command -v node)" "$PWD/packages/repo-canvas/src/server/stdio.ts" --repo /absolute/path/to/repository
```

Open **Repo Canvas** from Codex’s apps menu, or ask Codex to call `canvas_open`. Codex owns the stdio server lifecycle, as it does for Saul; no manually running localhost server is required. This is a tool/UI server, not another Codex agent or model process. The absolute Node and script paths avoid reliance on the desktop's shell PATH; re-register after moving the checkout or removing that Node version. Dependencies are declared in this workspace. The package has its own Vite entry and stylesheet and imports no game or workshop UI.

For an optional standalone editing preview, run `npm run repo:canvas -- --repo /absolute/path/to/repository`. `--port 4318` selects another loopback port. Side chat is only available in the hosted MCP App. Save preview changes before opening the hosted app: separate server processes share the saved architecture file, not temporary drafts or pending discussions.

The first view groups tracked and non-ignored text files by directory, bounded to 180 directories, four levels, and twelve source references per group. This is labelled a directory starting map, not semantic architecture or import analysis. Ask Codex to refine it using source evidence. A curated saved map takes precedence over discovery. The canvas never launches a model or Codex agent process.

## Work with native Codex chat

1. Use **Save map** to create `.repo-canvas/architecture.json` in the target repository.
2. Ask native Codex chat to read and edit that document. The explorer shows the document path. Keep module IDs stable and preserve unrelated annotations and layout.
3. The canvas polls the document every three seconds. External changes reload automatically when there is no local draft. With draft edits, it reports a conflict; export the draft, then reload and reconcile.
4. Validate agent-authored documents from this checkout:

```sh
node packages/repo-canvas/src/server/cli.ts --repo /absolute/path/to/repository --validate
```

The shared-file workflow is available alongside the MCP bridge below. Codex can inspect and change exactly the same versioned JSON as the person. Save deliberately; draft changes are cached in this browser tab and recovered after reload, while the shared file changes only on Save. The architecture file can be tracked in Git. Conversation history remains in native Codex chat.

## Design

The scoped [Little Clarity adaptation](../../docs/engineering/repo-canvas-design.md) records
source attribution, semantic colors, density choices and responsive interaction rules.
It applies only to Repo Canvas. **Map actions** contains module creation, Undo,
Export, Import and Reload; source-path editing and suggested questions are disclosed
on demand. Checkout, host mode and draft state stay visible in the header.

## Canvas interaction

- Click a module to inspect; double-click or use **Enter module** to enter its internal network. Breadcrumbs and the explorer navigate back. Focus a card and press Right Arrow to enter.
- Drag a module to move it; drag empty canvas or scroll to pan. Use the zoom controls, Command/Ctrl + scroll, or **Fit view**.
- Hover or focus a card for an explanation; Escape closes its tooltip. The inspector exposes full responsibilities, editable source paths, source overlays, relationships and anchored notes.
- Create a module within the current scope. Drag its output port near another module’s input: the line snaps within 28 screen pixels, then opens a relationship editor. Add a verb label and explanation; click a line or label to inspect or edit it later. Keyboard users can activate an output port and then an input port. Escape cancels an unfinished wire. Connections follow moved modules. The inspector also supports linking modules across scopes. Undo restores the previous draft edit (up to 40 edits). Export/import exchanges validated documents.
- Connections between deeper modules project onto their visible ancestors. The inspector retains the exact endpoints. This is an architectural dependency view, not a flattened drawing.

## Hosted MCP App and direct side chat

Use the automatically started stdio registration above for Codex. An optional standalone preview also exposes Streamable HTTP MCP at `http://127.0.0.1:4317/mcp`. Only use HTTP registration if you manage that server's uptime yourself:

```sh
codex mcp add repo_canvas --url http://127.0.0.1:4317/mcp
```

Registration updates configuration; it does not prove that an already-open chat has loaded the server. After registration or tool-catalog changes, fully quit and reopen Codex, return to the same chat, and open **Repo Canvas** from the apps menu or call `canvas_open`. Merely closing a window or pressing the panel's **Try again** can retain the old connection. Its tool metadata links `ui://repo-canvas/workbench-v2.html`, a self-contained React/CSS resource served as `text/html;profile=mcp-app` with a thread entrypoint and fullscreen presentation.

The app follows the same standard bridge as Saul: `ui/initialize`, `tools/call`, and `ui/message` over parent-frame JSON-RPC. All hosted map/source/discussion operations use the app-only `canvas_app` tool. The iframe needs no external scripts, fetches, API keys or model access; its CSP has empty network and resource domain lists. The server builds and caches the resource on first read; restart it after source changes.

1. Select a module, open **Side chat**, type a question and click **Send to chat**.
2. The app captures your unsaved map, selection and discussion, then sends a user message with that request ID directly into the owning Codex conversation using `ui/message`.
3. That conversation uses `canvas_read`, inspects source as needed, then calls `canvas_reply` with its answer and optional complete map proposal. No second agent or direct LLM call is launched.
4. Review the proposal, **Apply to draft**, then **Save map**. Apply is disabled when the map changed since the request. Closing a pending request rejects late replies; it does not interrupt the main chat.

Hosts without message capability report that limitation explicitly. The ordinary localhost preview disables sending; it never offers a copy/paste handoff or falls back to a separate agent. An unacknowledged message is not automatically retried because delivery may already have occurred.

Each server process retains one exchange per app/browser instance (up to 20), and its most recently edited draft for recovery within that process. This temporary recovery copy does not overwrite the saved map. A conflicting saved revision is still reported. Server restarts clear temporary state; the browser also retains its original tab draft when storage is available. Native chat remains the durable conversation. Separate stdio processes and standalone previews share only the saved file. Local clients share access to this trusted-repository MCP server; app-only visibility is a host workflow boundary, not authentication against other processes of the same OS user. For HTTP previews, run one port per repository.

References: [OpenAI MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui), [Codex MCP configuration](https://developers.openai.com/codex/mcp).

## Troubleshoot “Couldn’t display Repo Canvas”

Check the automatically started stdio server without a localhost dependency:

```sh
npm run repo:canvas -- --verify --stdio --repo /absolute/path/to/repository
```

For a running HTTP preview instead, omit `--stdio`; use `--port 4318` if that is the configured port. This read-only probe checks initialization, all four tools, app entrypoint metadata, `canvas_open`, and the self-contained HTML resource. It never starts a model or sends a chat message. Its result deliberately separates **server: pass** from **currentChat: not tested**.

For layer-by-layer diagnosis, server lifecycle guidance, bridge caveats and the verified incident resolution, see [MCP Apps in Codex](../../docs/engineering/mcp-apps.md). A missing HTTP listener requires restoring the service; an unknown-server error in a chat requires refreshing its registration. These are separate failures.

## Document and local server contract

`src/server/operations.ts` owns map, source, draft and discussion operations for both
HTTP and MCP. The UI requests named operations; `src/model/operations.ts` maps them
to the existing HTTP routes. Authentication, session metadata and response envelopes
remain in each transport adapter.

`src/model/document.ts` owns the version 1 schema and runtime validation. Exactly one root and an acyclic parent hierarchy are required. Relationships and annotations reference existing module IDs. Source references are repo-relative. Renderer layout is per parent scope. Structural edits, source paths, text lengths and finite coordinates are validated before persistence and on load.

The local API provides `GET /api/state`, `PUT /api/state`, `GET /api/source?path=…`, `GET /api/chat?canvasId=…`, `POST /api/chat`, and `POST /api/chat/cancel`, `GET/PUT /api/draft` for temporary draft recovery, plus `/mcp` for agent and app tools. State returns a SHA-256 revision; saves require the current revision and write via a temporary file plus rename. The document is the persistent authority. No second database or canvas store exists. A same-origin session token guards browser source reads and mutations; the MCP endpoint accepts local clients without this browser token, with the same Host/Origin checks; the service binds only to `127.0.0.1` and rejects foreign origins/hosts. Source previews resolve real paths within the repo and are limited to tracked and non-ignored text files under 500 KB, showing at most 40,000 characters. This is a local developer tool for trusted repositories, not a multi-user hosted service.

`GET /api/state` also supplies a fresh directory starting map if no document exists. Malformed saved documents produce an explicit error and are never replaced automatically. The revision check detects stale saves, but does not lock out arbitrary simultaneous filesystem writers between checking and renaming.

## Checks

- `npm run typecheck --workspace @card-workshop/repo-canvas`
- `npm run test --workspace @card-workshop/repo-canvas`
- `npm run build --workspace @card-workshop/repo-canvas` builds the UI. The hosted app uses the stdio server; the standalone preview uses the local CLI. Built files alone do not provide repository operations.
- `npx playwright test --config packages/repo-canvas/playwright.config.ts` runs the disposable-repo browser journey with the existing startup guard. On macOS, request approved execution outside the restricted sandbox from the first launch.

The package participates in root formatting, typed lint, workspace typechecking, application tests, build and maintenance inventory. Root `npm run check` is the ordinary completion gate. The browser journey renders the actual self-contained resource in an isolated MCP Apps host, forwards real SDK tool calls, records direct `ui/message` delivery, and verifies proposal review, stale protection, source previews and persistence. It does not by itself establish that the installed Codex host has refreshed its tool catalog or rendered the app.
