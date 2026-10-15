import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ancestors,
  parseDocument,
  rootOf,
  type Architecture,
  type Module,
  type Snapshot,
} from '../model/document';
import { download, request, type Session } from './api';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import { SideChat } from './SideChat';
import { hosted } from './host';

export function App() {
  const [session, setSession] = useState<Session | null>(null),
    [document, setDocument] = useState<Architecture | null>(null);
  const [scope, setScope] = useState('repo'),
    [selection, setSelection] = useState<string | null>(null),
    [query, setQuery] = useState('');
  const [panel, setPanel] = useState<'inspect' | 'chat' | null>(hosted ? 'chat' : null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false),
    [conflict, setConflict] = useState(false),
    [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false),
    [newName, setNewName] = useState('');
  const [history, setHistory] = useState<Architecture[]>([]);
  const documentRef = useRef(document);
  documentRef.current = document;
  const state = useRef({ dirty, revision: session?.revision });
  state.current = { dirty, revision: session?.revision };
  const load = useCallback(async (recover = false) => {
    try {
      const data = await request<Session>('state');
      data.document = parseDocument(data.document);
      if (recover) {
        try {
          const transferred = hosted ? await request<unknown>('draft_read', data.token) : null;
          const raw = transferred
            ? JSON.stringify(transferred)
            : sessionStorage.getItem(`repo-canvas:draft:${data.repo}`);
          if (raw) {
            const draft = JSON.parse(raw) as {
              document: unknown;
              revision: string;
              scope: string;
              selection: string | null;
            };
            const restored = parseDocument(draft.document);
            if (
              typeof draft.revision === 'string' &&
              JSON.stringify(restored) !== JSON.stringify(data.document)
            ) {
              setSession({ ...data, revision: draft.revision });
              setDocument(restored);
              setScope(
                restored.modules.some((m) => m.id === draft.scope)
                  ? draft.scope
                  : rootOf(restored).id,
              );
              setSelection(
                restored.modules.some((m) => m.id === draft.selection) ? draft.selection : null,
              );
              setDirty(true);
              setConflict(data.revision !== draft.revision);
              setNotice('Restored your unsaved draft in this tab.');
              return;
            }
          }
        } catch {
          /* A corrupt cache must not prevent loading the authoritative map. */
        }
      }
      setSession(data);
      setDocument(data.document);
      setScope(rootOf(data.document).id);
      setSelection(null);
      setDirty(false);
      setConflict(false);
      setHistory([]);
      setError('');
    } catch (error) {
      setError(String(error));
    }
  }, []);
  useEffect(() => {
    void load(true);
  }, [load]);
  useEffect(() => {
    if (!session || !document) return;
    try {
      const key = `repo-canvas:draft:${session.repo}`;
      if (dirty)
        sessionStorage.setItem(
          key,
          JSON.stringify({ document, revision: session.revision, scope, selection }),
        );
      else sessionStorage.removeItem(key);
    } catch {
      /* Persistence still works when browser storage is unavailable. */
    }
  }, [session, document, dirty, scope, selection]);
  useEffect(() => {
    if (!session || !document) return;
    const timer = setTimeout(
      () => {
        void request('draft_write', session.token, {
          draft: dirty ? { document, revision: session.revision, scope, selection } : null,
        }).catch(() => {
          /* Local draft remains intact if the bridge disconnects. */
        });
      },
      dirty ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [session, document, dirty, scope, selection]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (state.current.dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      const revision = state.current.revision;
      void request<Session>('state')
        .then((data) => {
          setSession((previous) =>
            previous && previous.token !== data.token
              ? { ...previous, token: data.token, plugin: data.plugin }
              : previous,
          );
          if (revision !== state.current.revision) return;
          if (!state.current.revision || data.revision === state.current.revision) return;
          if (state.current.dirty) {
            setConflict(true);
            return;
          }
          data.document = parseDocument(data.document);
          setSession(data);
          setDocument(data.document);
          setHistory([]);
          setConflict(false);
          setScope((id) =>
            data.document.modules.some((m) => m.id === id) ? id : rootOf(data.document).id,
          );
          setSelection((id) => (data.document.modules.some((m) => m.id === id) ? id : null));
          setNotice('Updated from the shared repo document.');
        })
        .catch((error: unknown) => setError(String(error)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  function replaceDraft(next: Architecture) {
    setDocument(next);
    setScope((id) => (next.modules.some((m) => m.id === id) ? id : rootOf(next).id));
    setSelection((id) => (next.modules.some((m) => m.id === id) ? id : null));
    setDirty(true);
  }
  function edit(next: Architecture) {
    if (!document) return;
    setHistory((h) => [...h.slice(-39), document]);
    replaceDraft(next);
    setNotice('');
  }
  async function save() {
    if (!session || !document) return;
    setSaving(true);
    setError('');
    try {
      const snapshot = await request<Snapshot>('save', session.token, {
        document: parseDocument(document),
        revision: session.revision,
      });
      state.current.revision = snapshot.revision;
      setSession({ ...session, ...snapshot });
      if (documentRef.current === document) {
        setDocument(snapshot.document);
        setDirty(false);
      }
      setConflict(false);
      setNotice('Saved to .repo-canvas/architecture.json');
    } catch (error) {
      setError(String(error));
    } finally {
      setSaving(false);
    }
  }
  function enter(id: string) {
    setScope(id);
    setSelection(null);
    setQuery('');
  }
  const file = useRef<HTMLInputElement>(null);
  if (!session || !document)
    return (
      <div className="loading">
        <div className="brand-mark">▧</div>
        <h1>Repo Canvas</h1>
        <p>{error || 'Opening the repository…'}</p>
        {error && <button onClick={() => void load()}>Retry</button>}
      </div>
    );
  const current = document.modules.find((m) => m.id === scope) ?? rootOf(document);
  const inspected = document.modules.find((m) => m.id === selection) ?? current;
  const matches = query
    ? document.modules
        .filter((m) =>
          `${m.name} ${m.summary} ${m.sources.join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 30)
    : [];
  function tree(m: Module, depth = 0): React.ReactNode {
    const activePath = ancestors(document!, scope).map((n) => n.id);
    const children = document!.modules.filter((n) => n.parent === m.id);
    return (
      <div key={m.id}>
        <button
          className={`tree-item ${m.id === scope ? 'active' : ''}`}
          style={{ paddingLeft: 12 + depth * 15 }}
          onClick={() => enter(m.id)}
          title={m.summary}
        >
          <span>{children.length ? (activePath.includes(m.id) ? '⌄' : '›') : '·'}</span>
          <span>{m.name}</span>
          <small>{children.length || ''}</small>
        </button>
        {activePath.includes(m.id) && children.map((child) => tree(child, depth + 1))}
      </div>
    );
  }
  return (
    <div className={`workbench ${panel ? 'with-panel' : ''}`}>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">▧</span>
          <div>
            <strong>Repo Canvas</strong>
            <small>ARCHITECTURE WORKBENCH</small>
          </div>
        </div>
        <div className="repo-name" title={session.repo}>
          ⌘ <strong>{document.title}</strong>
          <span>{hosted ? 'MCP APP' : 'LOCAL PREVIEW'}</span>
        </div>
        <div className="header-actions">
          <span className={`save-state ${dirty ? 'unsaved' : ''}`}>
            {dirty
              ? '● Draft changes'
              : session.saved
                ? '✓ Shared document'
                : 'Directory starting map'}
          </span>
          <button className="primary" disabled={saving || conflict} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save map'}
          </button>
        </div>
      </header>
      <nav className="hierarchy">
        <div className="panel-eyebrow">
          EXPLORER <span>⊞</span>
        </div>
        <label className="search">
          <span>⌕</span>
          <input
            aria-label="Find module"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a module…"
          />
        </label>
        <div className="tree">
          {query ? (
            matches.length ? (
              matches.map((m) => (
                <button
                  className="tree-item"
                  key={m.id}
                  onClick={() => {
                    enter(m.parent ?? m.id);
                    setSelection(m.id);
                  }}
                >
                  <span>◇</span>
                  <span>
                    {m.name}
                    <small>{m.parent ?? 'root'}</small>
                  </span>
                </button>
              ))
            ) : (
              <p className="muted">No matching modules.</p>
            )
          ) : (
            tree(rootOf(document))
          )}
        </div>
        <div className="hierarchy-bottom">
          <strong>{hosted ? 'MCP host session' : 'Standalone preview'}</strong>
          <p>
            {hosted
              ? 'Side chat uses this host session. Review proposals, then save to share the map.'
              : 'Edits save to this checkout. Open the app in a connected MCP host to use side chat.'}
          </p>
          <code className="checkout-path" title={session.repo}>
            {session.repo}
          </code>
          <code>
            .repo-canvas/
            <br />
            architecture.json
          </code>
        </div>
      </nav>
      <main className="main">
        <div className="canvas-toolbar">
          <div className="breadcrumbs">
            {ancestors(document, scope).map((m, i) => (
              <span key={m.id}>
                {i > 0 && <i>/</i>}
                <button onClick={() => enter(m.id)}>{m.name}</button>
              </span>
            ))}
          </div>
          <div className="toolbar-actions">
            <button
              title="Undo last draft edit"
              disabled={!history.length}
              onClick={() => {
                replaceDraft(history.at(-1)!);
                setHistory(history.slice(0, -1));
              }}
            >
              ↶
            </button>
            <button onClick={() => setAdding(true)}>+ Module</button>
            <button
              className={panel === 'inspect' ? 'active' : ''}
              onClick={() => setPanel(panel === 'inspect' ? null : 'inspect')}
            >
              Inspect
            </button>
            <button
              className={panel === 'chat' ? 'active' : ''}
              onClick={() => setPanel(panel === 'chat' ? null : 'chat')}
            >
              ✳ Side chat
            </button>
          </div>
        </div>
        {(error || conflict || notice) && (
          <div
            className={`status-banner ${error || conflict ? 'warning' : ''}`}
            role={error || conflict ? 'alert' : 'status'}
          >
            <span>
              {conflict
                ? 'The repo document changed while you have draft edits. Export your draft before reloading.'
                : error || notice}
            </span>
            {conflict && <button onClick={() => download(document)}>Export draft</button>}
            <button
              onClick={() => {
                setError('');
                setNotice('');
              }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}
        <div className="scope-heading">
          <div>
            <span className="eyebrow">
              {current.parent === null ? 'REPOSITORY OVERVIEW' : 'INSIDE MODULE'}
            </span>
            <h1>
              {current.name}
              <span>{document.modules.filter((m) => m.parent === scope).length} modules</span>
            </h1>
          </div>
          <p>{current.summary}</p>
        </div>
        <Canvas
          edit={edit}
          key={scope}
          document={document}
          scope={scope}
          selection={selection}
          select={(id) => {
            setSelection(id);
            if (id && panel !== 'chat') setPanel('inspect');
          }}
          enter={enter}
          move={(id, x, y) =>
            edit({
              ...document,
              modules: document.modules.map((m) => (m.id === id ? { ...m, x, y } : m)),
            })
          }
        />
        <footer className="app-footer">
          <span>
            {document.modules.length} modules <i>·</i> {document.connections.length} relationships{' '}
            <i>·</i> {document.annotations.length} annotations
          </span>
          <div>
            <button onClick={() => download(document)}>Export</button>
            <button onClick={() => file.current?.click()}>Import</button>
            <button
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm(
                    'Discard your unsaved draft and reload the shared document? Export first to keep it.',
                  )
                )
                  void load();
              }}
            >
              Reload
            </button>
          </div>
        </footer>
      </main>
      {panel === 'inspect' && (
        <Inspector
          key={inspected.id}
          document={document}
          module={inspected}
          token={session.token}
          edit={edit}
          enter={enter}
        />
      )}
      <div className={panel === 'chat' ? 'chat-slot' : 'chat-slot hidden'}>
        <SideChat
          document={document}
          scope={scope}
          selection={selection}
          token={session.token}
          apply={edit}
        />
      </div>
      <input
        ref={file}
        className="hidden"
        type="file"
        accept="application/json,.json"
        aria-label="Import architecture"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected)
            void selected
              .text()
              .then((raw) => {
                const next = parseDocument(JSON.parse(raw) as unknown);
                edit(next);
                enter(rootOf(next).id);
              })
              .catch((error: unknown) => setError(String(error)));
          e.target.value = '';
        }}
      />
      {adding && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Add module">
          <form
            className="add-modal"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              const id = crypto.randomUUID(),
                count = document.modules.filter((m) => m.parent === scope).length;
              edit({
                ...document,
                modules: [
                  ...document.modules,
                  {
                    id,
                    parent: scope,
                    name: newName.trim(),
                    summary: 'Describe this module’s responsibility.',
                    kind: 'module',
                    sources: [],
                    x: 70 + (count % 3) * 300,
                    y: 85 + Math.floor(count / 3) * 190,
                  },
                ],
              });
              setSelection(id);
              setPanel('inspect');
              setAdding(false);
              setNewName('');
            }}
          >
            <span className="eyebrow">INSIDE {current.name}</span>
            <h2>Create a module</h2>
            <label>
              Module name
              <input
                autoFocus
                maxLength={200}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Replay engine"
              />
            </label>
            <footer>
              <button type="button" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!newName.trim()}>
                Create module
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
