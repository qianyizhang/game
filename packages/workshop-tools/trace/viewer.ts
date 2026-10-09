import { traceActions, type TraceAction } from './actions.ts';
import { presentedText, type TextMode } from './presentation.ts';
import type { buildCase } from './build.ts';
import type { EvidenceRef, ResolvedRef, TraceEvent } from './contracts.ts';
type TraceData = Awaited<ReturnType<typeof buildCase>> & { sessionTrace?: boolean };
type Revision = TraceData['stages'][number];
type Artifact = TraceData['artifacts'][number];
type Assessment = Revision['assessments'][number];
// The builder inserts its validated, escaped payload before this runtime.
declare const DATA: TraceData;
function required<T extends HTMLElement>(id: string, kind: { new (): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof kind)) throw new Error(`Missing viewer element: ${id}`);
  return element;
}
const elements = {
  title: required('title', HTMLElement),
  subtitle: required('subtitle', HTMLElement),
  'coverage-summary': required('coverage-summary', HTMLElement),
  conversation: required('conversation', HTMLElement),
  'conversation-thread': required('conversation-thread', HTMLSelectElement),
  'conversation-search': required('conversation-search', HTMLInputElement),
  'conversation-count': required('conversation-count', HTMLElement),
  'conversation-list': required('conversation-list', HTMLElement),
  'conversation-pager': required('conversation-pager', HTMLElement),
  'conversation-prev': required('conversation-prev', HTMLButtonElement),
  'conversation-next': required('conversation-next', HTMLButtonElement),
  'turn-detail': required('turn-detail', HTMLElement),
  'turn-title': required('turn-title', HTMLElement),
  'turn-kind': required('turn-kind', HTMLSelectElement),
  'raw-text': required('raw-text', HTMLInputElement),
  'show-review': required('show-review', HTMLInputElement),
  'event-order': required('event-order', HTMLSelectElement),
  'turn-meta': required('turn-meta', HTMLElement),
  'turn-pair': required('turn-pair', HTMLElement),
  'turn-work': required('turn-work', HTMLElement),
  'turn-back': required('turn-back', HTMLButtonElement),
  'turn-earlier': required('turn-earlier', HTMLButtonElement),
  'turn-later': required('turn-later', HTMLButtonElement),
  process: required('process', HTMLElement),
  'process-search': required('process-search', HTMLInputElement),
  'process-subject': required('process-subject', HTMLSelectElement),
  'process-lessons': required('process-lessons', HTMLSelectElement),
  'process-count': required('process-count', HTMLElement),
  'process-list': required('process-list', HTMLElement),
  'export-learning': required('export-learning', HTMLButtonElement),
  story: required('story', HTMLElement),
  steps: required('steps', HTMLElement),
  'stage-status': required('stage-status', HTMLElement),
  'step-count': required('step-count', HTMLElement),
  'stage-title': required('stage-title', HTMLElement),
  question: required('question', HTMLElement),
  ownership: required('ownership', HTMLElement),
  change: required('change', HTMLElement),
  finding: required('finding', HTMLElement),
  'story-assessments': required('story-assessments', HTMLElement),
  lesson: required('lesson', HTMLElement),
  'episode-limits': required('episode-limits', HTMLElement),
  signals: required('signals', HTMLElement),
  facts: required('facts', HTMLElement),
  'episode-evidence': required('episode-evidence', HTMLElement),
  'story-subject': required('story-subject', HTMLSelectElement),
  'story-images': required('story-images', HTMLElement),
  quote: required('quote', HTMLElement),
  anchor: required('anchor', HTMLElement),
  'show-events': required('show-events', HTMLButtonElement),
  'show-source': required('show-source', HTMLButtonElement),
  'open-chat': required('open-chat', HTMLAnchorElement),
  prev: required('prev', HTMLButtonElement),
  next: required('next', HTMLButtonElement),
  compare: required('compare', HTMLElement),
  subject: required('subject', HTMLSelectElement),
  angle: required('angle', HTMLSelectElement),
  before: required('before', HTMLSelectElement),
  after: required('after', HTMLSelectElement),
  'compare-images': required('compare-images', HTMLElement),
  'compare-status': required('compare-status', HTMLElement),
  'criterion-matrix': required('criterion-matrix', HTMLElement),
  events: required('events', HTMLElement),
  'episode-filter': required('episode-filter', HTMLSelectElement),
  'thread-filter': required('thread-filter', HTMLSelectElement),
  'role-filter': required('role-filter', HTMLSelectElement),
  'turn-filter': required('turn-filter', HTMLSelectElement),
  'turn-slider': required('turn-slider', HTMLInputElement),
  'turn-position': required('turn-position', HTMLElement),
  'action-earlier': required('action-earlier', HTMLButtonElement),
  'action-later': required('action-later', HTMLButtonElement),
  'all-turns': required('all-turns', HTMLButtonElement),
  kind: required('kind', HTMLSelectElement),
  search: required('search', HTMLInputElement),
  'event-count': required('event-count', HTMLElement),
  'event-list': required('event-list', HTMLElement),
  'event-prev': required('event-prev', HTMLButtonElement),
  'event-page': required('event-page', HTMLElement),
  'event-next': required('event-next', HTMLButtonElement),
  'action-context': required('action-context', HTMLElement),
  sources: required('sources', HTMLElement),
  'source-stage': required('source-stage', HTMLSelectElement),
  'source-file': required('source-file', HTMLSelectElement),
  'source-mode': required('source-mode', HTMLSelectElement),
  'source-meta': required('source-meta', HTMLElement),
  'source-code': required('source-code', HTMLElement),
  threads: required('threads', HTMLElement),
  outcome: required('outcome', HTMLElement),
  'coverage-details': required('coverage-details', HTMLElement),
  collection: required('collection', HTMLElement),
  documents: required('documents', HTMLElement),
  'evidence-drawer': required('evidence-drawer', HTMLElement),
  'drawer-title': required('drawer-title', HTMLElement),
  'close-drawer': required('close-drawer', HTMLButtonElement),
  'drawer-content': required('drawer-content', HTMLElement),
  'drawer-artifact': required('drawer-artifact', HTMLElement),
};
const $ = <K extends keyof typeof elements>(id: K) => elements[id];
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};
const turns = DATA.threads.flatMap((t) => t.turns);
const events = turns.flatMap((t) => t.events);
const threadMap = new Map(DATA.threads.map((t) => [t.id, t]));
const threadIndex = new Map(DATA.threads.map((t, index) => [t.id, index]));
const turnIndex = new Map(
  turns.map((turn) => [
    JSON.stringify([turn.threadId, turn.id]),
    (threadMap.get(turn.threadId)?.turns.indexOf(turn) ?? 0) + 1,
  ]),
);
const isReview = (event: TraceEvent) =>
  event.kind === 'auto-review' || threadMap.get(event.threadId)?.purpose === 'auto-review';
const visibleEvent = (event: TraceEvent) => $('show-review').checked || !isReview(event);
const sessionRole = (id: string) =>
  threadMap.get(id)?.purpose === 'auto-review'
    ? 'Auto-review'
    : DATA.sessionTrace
      ? id === DATA.threads[0].id
        ? 'Main'
        : 'Subagent'
      : (threadMap.get(id)?.role ?? 'Session');
const sessionLabel = (id: string) => `${sessionRole(id)} · ${id.slice(0, 8)}`;
const eventMap = new Map(events.map((e) => [e.key, e]));
const actions = traceActions(events);
const actionMap = new Map(
  actions.flatMap((action) => action.records.map((e) => [e.key, action] as const)),
);
let matchingActions: TraceAction[] = [];
const matchesAgent = (id: string, value: string) =>
  value === 'all' ||
  (value === '__reviews__' ? threadMap.get(id)?.purpose === 'auto-review' : id === value);
const refKey = (r: EvidenceRef) => JSON.stringify([r.thread, r.turn, r.event]);
const artifactMap = new Map(DATA.artifacts.map((a) => [a.id, a]));
function artifactById(id: string): Artifact {
  const artifact = artifactMap.get(id);
  if (!artifact) throw new Error(`Missing artifact: ${id}`);
  return artifact;
}
let selectedEvent: string | null = null;
let selectedTurn: string | null = null;
let conversationPage = 0;
let textMode: TextMode = 'rendered';
const surfaceUpdates = new WeakMap<HTMLElement, () => void>();
let selectedAssessment: string | null = null;
let drawerReturnFocus: Element | null = null;
let stage = 0,
  page = 0;
const pageSize = 35;
const params = new URLSearchParams(location.hash.slice(1));
const requested = params.has('episode')
  ? DATA.stages.findIndex((s) => s.id === params.get('episode'))
  : Number(params.get('stage') ?? 0);
if (Number.isInteger(requested) && requested >= 0 && requested < DATA.stages.length)
  stage = requested;
$('title').textContent = DATA.title;
$('subtitle').textContent = DATA.subtitle ?? '';
function option(select: HTMLSelectElement, value: string | number, label: string) {
  const o = node('option', label);
  o.value = String(value);
  select.append(o);
}
function tab(name: string | undefined) {
  if (!['conversation', 'process', 'story', 'compare', 'events', 'sources'].includes(name ?? ''))
    name = DATA.sessionTrace ? 'conversation' : 'story';
  if (DATA.sessionTrace && ['process', 'story', 'compare'].includes(name ?? ''))
    name = 'conversation';
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-tab]'))
    b.setAttribute('aria-pressed', String(b.dataset.tab === name));
  for (const id of ['conversation', 'process', 'story', 'compare', 'events', 'sources'] as const)
    $(id).hidden = id !== name;
  if (name === 'conversation') renderConversation();
  if (name === 'process') renderProcess();
  if (name === 'events') {
    renderEvents(selectedEvent);
    renderActionContext();
  }
  saveLocation(name);
}
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tab]'))
  button.onclick = () => {
    if (button.dataset.tab === 'compare') {
      $('subject').value = $('story-subject').value;
      compareOptions();
      $('after').value = String(stage);
      renderCompare();
    }
    tab(button.dataset.tab);
  };
function imageFigure(s: Revision | undefined, subject: string, angle: string, label: string) {
  const f = node('figure');
  const box = node('div', undefined, 'image-box');
  const capture = s?.captures.find((c) => c.subject === subject && c.angle === angle);
  if (capture) {
    const img = node('img');
    img.src = capture.url;
    img.alt = `${subject}, ${angle}, ${s?.title ?? 'Unknown revision'}`;
    img.loading = 'lazy';
    img.onerror = () => {
      box.replaceChildren(node('p', 'Capture unavailable at this path.'));
    };
    box.append(img);
  } else box.append(node('p', `No retained ${angle} capture of ${subject} for this revision.`));
  f.append(box);
  const caption = node('figcaption');
  caption.append(
    node('div', label, 'caption-label'),
    node('div', s?.title ?? 'No earlier capture', 'caption-title'),
  );
  if (s) {
    caption.append(node('p', s.status, 'small'));
    const artifact = artifactMap.get(`${s.id}:${subject}`);
    if (artifact) {
      const b = node('button', 'Artifact identity');
      b.onclick = () => openArtifact(artifact);
      caption.append(b);
    }
  }
  if (capture) {
    const link = node('a', 'Open full capture ↗');
    link.href = capture.url;
    link.target = '_blank';
    link.rel = 'noopener';
    caption.append(link, node('p', capture.path, 'provenance'));
  }
  f.append(caption);
  return f;
}
function saveLocation(view?: string) {
  const q = new URLSearchParams({
    episode: DATA.stages[stage].id,
    stage: String(stage),
    view:
      view ??
      document.querySelector<HTMLButtonElement>('[data-tab][aria-pressed="true"]')?.dataset.tab ??
      'story',
  });
  if (selectedEvent) q.set('event', selectedEvent);
  if (selectedAssessment) q.set('assessment', selectedAssessment);
  q.set('thread', $('conversation-thread').value);
  if (selectedTurn) q.set('turn', selectedTurn);
  if (textMode === 'raw') q.set('text', 'raw');
  if ($('show-review').checked) q.set('reviews', 'show');
  if (DATA.sessionTrace) q.set('session', $('thread-filter').value);
  q.set('order', $('event-order').value);
  for (const [id, key] of [
    ['thread-filter', 'session'],
    ['turn-filter', 'actionTurn'],
    ['kind', 'kind'],
    ['episode-filter', 'scope'],
    ['role-filter', 'evidenceRole'],
  ] as const)
    if ($(id).value !== 'all') q.set(key, $(id).value);
  if ($('search').value) q.set('search', $('search').value);
  if ($('turn-kind').value !== 'all') q.set('type', $('turn-kind').value);
  if ($('conversation-search').value) q.set('query', $('conversation-search').value);
  if (conversationPage) q.set('turnPage', String(conversationPage));
  if ($('process-search').value) q.set('find', $('process-search').value);
  if ($('process-subject').value !== 'all') q.set('subject', $('process-subject').value);
  if ($('process-lessons').value === 'lessons') q.set('lessons', 'true');
  history.replaceState(null, '', '#' + q.toString());
}
function closeDrawer() {
  $('evidence-drawer').hidden = true;
  document.body.classList.remove('drawer-open');
  selectedAssessment = null;
  selectedEvent = null;
  if (drawerReturnFocus instanceof HTMLElement && drawerReturnFocus.isConnected)
    drawerReturnFocus.focus();
}
function drawer(
  title: string,
  artifact = artifactMap.get(`${DATA.stages[stage].id}:${$('story-subject').value}`),
) {
  if ($('evidence-drawer').hidden) drawerReturnFocus = document.activeElement;
  $('drawer-title').textContent = title;
  $('drawer-content').replaceChildren();
  $('drawer-artifact').replaceChildren();
  if (artifact) {
    const capture = artifact.captures.find((c) => c.angle === 'hero') ?? artifact.captures[0];
    $('drawer-artifact').append(node('p', `Selected artifact · ${artifact.subject}`, 'small'));
    if (capture) {
      const img = node('img');
      img.src = capture.url;
      img.alt = `${artifact.subject}, ${DATA.stages[artifact.stageIndex].title}`;
      $('drawer-artifact').append(img);
    } else
      $('drawer-artifact').append(node('p', 'No retained capture for this artifact.', 'small'));
    $('drawer-artifact').append(node('p', DATA.stages[artifact.stageIndex].title, 'small'));
  }
  $('evidence-drawer').hidden = false;
  document.body.classList.add('drawer-open');
  $('drawer-title').focus({ preventScroll: true });
  return $('drawer-content');
}
function recordURL(e: TraceEvent, endpoint: string) {
  return (
    endpoint +
    '?' +
    new URLSearchParams({
      session: DATA.threads[0].id,
      event: e.key,
      revision: e.body?.sources.map((source) => source.sha256).join('.') ?? '',
    }).toString()
  );
}
function recordText(e: TraceEvent, field: 'text' | 'output' = 'text') {
  const box = node('div', undefined, 'record-surface');
  const content = node('div', undefined, 'record-scroll');
  const controls = node('div', undefined, 'body-pager');
  const status = node('span', undefined, 'small');
  status.setAttribute('role', 'status');
  const previous = node('button', '← Previous text block'),
    next = node('button', 'Next text block →');
  controls.append(previous, status, next);
  controls.hidden = true;
  box.append(content, controls);
  let value = field === 'text' ? e.text : (e.output ?? '');
  const total = field === 'text' ? e.body?.textLength : e.body?.outputLength;
  const paint = () =>
    content.replaceChildren(presentedText(value, field === 'text' ? e.kind : 'command', textMode));
  surfaceUpdates.set(box, paint);
  paint();
  if (!e.body || total === undefined || total <= value.length) return box;
  const offsets = [0];
  let blockIndex = 0,
    nextOffset = 0,
    loading = false;
  async function load() {
    loading = true;
    box.setAttribute('aria-busy', 'true');
    previous.disabled = next.disabled = true;
    try {
      const response = await fetch(
        recordURL(e, '/trace-record') +
          '&' +
          new URLSearchParams({ field, offset: String(offsets[blockIndex]) }).toString(),
      );
      if (!response.ok) throw new Error(await response.text());
      const block = (await response.json()) as {
        text: string;
        offset: number;
        nextOffset: number;
        total: number;
      };
      value = block.text;
      nextOffset = block.nextOffset;
      paint();
      content.scrollTop = 0;
      status.textContent = `${block.offset + 1}–${block.nextOffset} / ${block.total}`;
      status.title =
        'Character range in this record. Large records are loaded in blocks to keep memory bounded.';
      controls.hidden = block.total <= 65536;
      previous.disabled = blockIndex === 0;
      next.disabled = nextOffset >= block.total;
    } catch (error) {
      controls.hidden = false;
      status.textContent = error instanceof Error ? error.message : String(error);
      const retry = node('button', 'Retry loading');
      retry.onclick = () => {
        retry.remove();
        void load();
      };
      content.replaceChildren(retry);
    } finally {
      loading = false;
      box.removeAttribute('aria-busy');
    }
  }
  previous.onclick = () => {
    if (!loading) {
      blockIndex--;
      void load();
    }
  };
  next.onclick = () => {
    if (!loading) {
      offsets[++blockIndex] = nextOffset;
      void load();
    }
  };
  // Closed records stay cheap; opening or scrolling to one loads its complete first block.
  const observer = new IntersectionObserver(
    (entries) => {
      if (!box.isConnected) {
        observer.disconnect();
        return;
      }
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void load();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(box);
  return box;
}
$('show-review').onchange = () => {
  page = 0;
  conversationPage = 0;
  closeDrawer();
  selectedEvent = null;
  if (!$('show-review').checked && $('kind').value === 'auto-review') $('kind').value = 'all';
  if (selectedTurn && !turns.some((t) => t.id === selectedTurn && t.events.some(visibleEvent)))
    selectedTurn = null;
  refreshAgents();
  refreshTurns();
  renderCoverage();
  renderConversation();
  renderEvents();
  renderActionContext();
  saveLocation();
};
$('raw-text').onchange = () => {
  textMode = $('raw-text').checked ? 'raw' : 'rendered';
  for (const box of document.querySelectorAll<HTMLElement>('.record-surface'))
    surfaceUpdates.get(box)?.();
  renderConversationOverviewText();
  saveLocation();
};
function renderConversationOverviewText() {
  if (!$('conversation').hidden && !selectedTurn) renderConversation();
}

function eventDetails(e: TraceEvent, open = false) {
  const d = node('details');
  d.open = open;
  d.append(node('summary', e.title));
  if (e.sourceTruncated)
    d.append(
      node('p', 'Source truncated upstream. Expanding cannot recover omitted text.', 'warning'),
    );
  if (e.paths.length) d.append(node('p', e.paths.join(' · '), 'provenance'));
  if (!DATA.sessionTrace && e.exitCode !== undefined && e.exitCode !== null)
    d.append(
      node(
        'p',
        `Recorded exit code: ${e.exitCode}${e.durationMs !== undefined ? ' · ' + e.durationMs + ' ms' : ''}`,
        e.exitCode ? 'warning' : 'small',
      ),
    );
  if (e.text !== 'Recorded tool result') d.append(recordText(e));
  for (const url of e.imageUrls ?? []) {
    if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(url)) continue;
    const image = node('img');
    image.src = url;
    image.alt = 'Image retained in this trace record';
    image.loading = 'lazy';
    image.style.maxWidth = '100%';
    d.append(image);
  }
  if (e.body?.imageCount) {
    const images = node('details');
    images.append(node('summary', `Recorded images (${e.body.imageCount})`));
    images.addEventListener('toggle', () => {
      if (!images.open || images.childElementCount > 1) return;
      for (let i = 0; i < (e.body?.imageCount ?? 0); i++) {
        const image = node('img');
        image.src = recordURL(e, '/trace-image') + '&image=' + i;
        image.alt = 'Image retained in this trace record';
        image.loading = 'lazy';
        image.style.maxWidth = '100%';
        image.onerror = () =>
          image.replaceWith(
            node('p', 'Image unavailable; reopen the trace if the source changed.', 'small'),
          );
        images.append(image);
      }
    });
    d.append(images);
  }
  const provenance = node('details');
  provenance.append(node('summary', 'Source & identity'));
  if (e.sourcePath)
    provenance.append(
      node(
        'p',
        `${e.sourcePath}:${e.sourceLine ?? '?'}${e.timestamp ? '\nRecorded at: ' + e.timestamp : ''}${e.callId ? '\nTool call: ' + e.callId : ''}`,
        'provenance',
      ),
    );
  if (e.output !== undefined) d.append(recordText(e, 'output'));
  if (e.relatedThreads.length) {
    d.append(node('h3', 'Related threads'));
    for (const id of e.relatedThreads) {
      const th = DATA.threads.find((t) => t.id === id),
        a = node('a', `${th?.role ?? 'Uncollected thread'} · ${id}`);
      a.href = `codex://threads/${encodeURIComponent(id)}`;
      d.append(a, node('br'));
    }
  }
  provenance.append(
    node(
      'p',
      `${e.threadId} / ${e.turnId} / ${e.id}\nSource type: ${e.sourceType} · ordinal ${e.ordinal}`,
      'provenance',
    ),
  );
  const link = node('a', 'Open source chat ↗');
  link.href = `codex://threads/${encodeURIComponent(e.threadId)}`;
  provenance.append(link);
  if (!DATA.sessionTrace) d.append(provenance);
  return d;
}
function evidenceButton(r: EvidenceRef | ResolvedRef) {
  const e = eventMap.get('key' in r ? r.key : refKey(r)),
    b = node('button', undefined, 'evidence-row');
  if (!e) throw new Error(`Missing evidence event: ${refKey(r)}`);
  b.dataset.eventKey = e.key;
  b.setAttribute('aria-pressed', String(selectedEvent === e.key));
  b.append(
    node('span', (r.roles ?? [r.role]).join(' · '), 'kind'),
    node('span', `${e.role} · ${e.kind === 'command' ? 'Command & output' : e.title}`, 'small'),
    node('span', e.preview.slice(0, 190), 'excerpt'),
  );
  b.onclick = () => openEvent(e.key);
  return b;
}
function openEvent(key: string) {
  if (DATA.sessionTrace) {
    openRaw(key);
    return;
  }
  if (eventMap.has(key) && isReview(eventMap.get(key)!)) $('show-review').checked = true;
  const e = eventMap.get(key);
  if (!e) return;
  selectedEvent = key;
  selectedAssessment = null;
  const box = drawer(`${e.kind} · ${e.role}`);
  if (!DATA.sessionTrace) box.append(node('p', `Episode: ${DATA.stages[stage].title}`, 'small'));
  box.append(eventDetails(e, true));
  const actions = node('div', undefined, 'actions'),
    raw = node('button', 'Open exact recorded action');
  raw.onclick = () => openRaw(key);
  actions.append(raw);
  const s = DATA.stages[stage];
  if (s.sources.length) {
    const source = node('button', 'Retained source / diff');
    source.onclick = () => openSourceEvidence(s);
    actions.append(source);
  }
  box.append(actions);
  saveLocation();
  document
    .querySelectorAll<HTMLElement>('[data-event-key]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.eventKey === key)));
}
function resetEventFilters() {
  for (const id of [
    'turn-filter',
    'thread-filter',
    'episode-filter',
    'role-filter',
    'kind',
  ] as const)
    $(id).value = 'all';
  $('search').value = '';
  page = 0;
}
function openRaw(key: string, reset = true) {
  if (reset) resetEventFilters();
  closeDrawer();
  selectedEvent = key;
  if (eventMap.has(key) && isReview(eventMap.get(key)!)) $('show-review').checked = true;
  renderEvents(key);
  renderActionContext();
  tab('events');
  const row = document.getElementById(
    `record-${encodeURIComponent(actionMap.get(key)?.key ?? key)}`,
  );
  row?.scrollIntoView({ block: 'center' });
}
function renderActionContext() {
  if (DATA.sessionTrace) {
    renderMinimap();
    return;
  }
  const s = DATA.stages[stage],
    subject = $('story-subject').value;
  $('action-context').replaceChildren(
    node('h3', s.title),
    node('p', 'Current episode · artifact context', 'small'),
    imageFigure(s, subject, 'hero', 'Current revision'),
  );
  const back = node('button', 'Return to episode');
  back.onclick = () => tab('story');
  $('action-context').append(back);
}
function renderEpisode() {
  const s = DATA.stages[stage];
  $('ownership').replaceChildren(node('h3', 'Ownership / handoff'));
  for (const a of s.actors) {
    const th = DATA.threads.find((t) => t.id === a.threadId);
    $('ownership').append(
      node(
        'p',
        `${a.role.replaceAll('_', ' ')} · ${th?.role ?? 'Uncollected thread'}: ${a.contribution ?? 'Contribution unspecified.'}`,
      ),
    );
  }
  if (!s.actors.length)
    $('ownership').append(node('p', 'Ownership not recorded for this episode.'));
  if (new Set(s.evidence.map((r) => r.thread)).size > 1)
    $('ownership').append(
      node(
        'p',
        'Concurrent / exact interleaving unavailable. Evidence is grouped by role, not global time.',
        'small',
      ),
    );
  const f = s.facts;
  $('facts').textContent =
    `${f.commands} commands · ${f.fileEdits} patch records · ${f.imageInspections} image inspections · ${f.verificationCommands} verification commands · ${f.changedFiles.length} paths in patches · ${f.relatedThreads.length} related threads`;
  $('episode-limits').textContent = (s.limits ?? []).join(' ');
  $('episode-evidence').replaceChildren(...s.evidence.slice(0, 6).map(evidenceButton));
  if (s.evidence.length > 6) {
    const more = node('details');
    more.append(node('summary', `Show ${s.evidence.length - 6} more episode records`));
    const list = node('div', undefined, 'evidence-list');
    list.append(...s.evidence.slice(6).map(evidenceButton));
    more.append(list);
    $('episode-evidence').append(more);
  }
  if (!s.evidence.length)
    $('episode-evidence').append(node('p', 'No episode evidence attached.', 'empty'));
  $('story-assessments').replaceChildren(...s.assessments.map((a) => assessmentButton(a)));
  if (!s.assessments.length)
    $('story-assessments').append(
      node(
        'p',
        'No structured criterion assessment attached; see the recorded statements.',
        'small',
      ),
    );
  $('signals').replaceChildren();
  for (const signal of s.signals) {
    const d = node('details');
    d.append(
      node('summary', 'Thing to inspect: ' + signal.note),
      node('p', 'Authored inspection signal, not an automatic root-cause conclusion.', 'small'),
      ...signal.evidence.map(evidenceButton),
    );
    $('signals').append(d);
  }
  renderActionContext();
}
function assessmentButton(a: Assessment, compact = false) {
  const b = node(
    'button',
    compact
      ? `${a.assessment.replaceAll('_', ' ')} · ${a.basis.replaceAll('_', ' ')}`
      : `${a.subject} / ${a.criterion}: ${a.assessment.replaceAll('_', ' ')}`,
  );
  b.dataset.assessment = a.id;
  b.onclick = () => openAssessment(a);
  return b;
}
function openAssessment(a: Assessment) {
  const revision = artifactMap.get(a.artifactId);
  if (revision && stage !== revision.stageIndex) {
    stage = revision.stageIndex;
    renderStory();
  }
  if (revision && !$('compare').hidden) {
    $('after').value = String(revision.stageIndex);
    renderCompare();
  }
  if (revision) {
    $('story-subject').value = a.subject;
    renderStoryImages();
    renderActionContext();
  }
  selectedEvent = null;
  selectedAssessment = a.id;
  const box = drawer(`${a.criterion} · ${a.assessment.replaceAll('_', ' ')}`, revision),
    artifact = artifactMap.get(a.artifactId);
  box.append(
    node('p', `${a.subject} · ${a.actor} · ${a.basis.replaceAll('_', ' ')} assessment`),
    node('p', a.note ?? 'No additional note.'),
    node('p', `Artifact revision: ${a.artifactId}`, 'provenance'),
  );
  if (artifact) {
    box.append(node('p', DATA.stages[artifact.stageIndex].title, 'small'));
    const b = node('button', 'Inspect artifact identity');
    b.onclick = () => openArtifact(artifact);
    box.append(b);
  }
  box.append(node('h3', 'Supporting evidence'));
  if (a.evidence.length) box.append(...a.evidence.map(evidenceButton));
  else
    box.append(
      node(
        'p',
        'No supporting event recorded. This cell describes an explicit record limit, not an inferred result.',
        'warning',
      ),
    );
  saveLocation();
}
function openArtifact(a: Artifact) {
  selectedEvent = null;
  selectedAssessment = null;
  const box = drawer(`Artifact · ${a.subject}`, a);
  box.append(node('p', a.id, 'provenance'), node('p', a.limits.join(' '), 'warning'));
  box.append(
    node(
      'p',
      `Source pairing: ${a.provenance.sourcePairing}; camera ${a.provenance.cameraKnown ? 'documented' : 'unknown'}; lighting ${a.provenance.lightingKnown ? 'documented' : 'unknown'}.`,
      'small',
    ),
  );
  if (!a.captures.length) box.append(node('p', 'No retained capture.'));
  for (const c of a.captures) {
    const link = node('a', c.angle + ' · ' + c.path);
    link.href = c.url;
    link.target = '_blank';
    link.rel = 'noopener';
    box.append(link, node('p', 'SHA-256 ' + c.sha256, 'provenance'));
  }
  if (!a.sources.length)
    box.append(
      node(
        'p',
        'No subject-specific source snapshot attached. Source pairing remains unknown.',
        'small',
      ),
    );
  for (const f of a.sources)
    box.append(node('p', `${f.path}\nKey ${f.sourceKey}\nSHA-256 ${f.sha256}`, 'provenance'));
  const source = node('button', 'Inspect retained source / diff');
  source.onclick = () => openSourceEvidence(DATA.stages[a.stageIndex]);
  box.append(source);
  for (const [label, refs] of [
    ['Associated production records', a.producedBy],
    ['Associated inspections', a.inspectedBy],
  ] as const) {
    box.append(node('h3', label));
    box.append(...refs.map(evidenceButton));
    if (!refs.length) box.append(node('p', 'No exact event attached.', 'small'));
  }
  saveLocation();
}
function openSourceEvidence(s: Revision) {
  const box = drawer('Retained source · ' + s.title);
  box.append(
    node(
      'p',
      'Same-episode retained snapshots; exact source-to-render pairing is unknown.',
      'warning',
    ),
  );
  if (!s.sources.length) box.append(node('p', 'No retained source snapshot.'));
  for (const f of s.sources) {
    const d = node('details');
    d.append(
      node('summary', f.sourceKey),
      node('p', `${f.path}\nSHA-256 ${f.sha256}`, 'provenance'),
    );
    d.append(
      node('h3', 'Changes from previous retained snapshot'),
      node('pre', f.diff?.text ?? 'No earlier snapshot for this source key.'),
    );
    const full = node('details');
    full.append(node('summary', 'Full retained source'), node('pre', f.text));
    d.append(full);
    box.append(d);
  }
}
function renderMatrix(subject: string) {
  const rows = DATA.stages.filter((s) =>
    s.artifacts.some((id) => artifactById(id).subject === subject),
  );
  const criteria = [
    ...new Set(
      rows.flatMap((s) =>
        s.assessments.filter((a) => a.subject === subject).map((a) => a.criterion),
      ),
    ),
  ];
  const table = node('table'),
    caption = node('caption', `${subject}: recorded assessments across revisions`);
  table.append(caption);
  const head = node('thead'),
    tr = node('tr');
  tr.append(node('th', 'Criterion'));
  for (const s of rows) {
    const th = node('th', `${s.index + 1}. ${s.title}`);
    th.scope = 'col';
    tr.append(th);
  }
  head.append(tr);
  table.append(head);
  const body = node('tbody');
  for (const criterion of criteria) {
    const row = node('tr'),
      th = node('th', criterion);
    th.scope = 'row';
    row.append(th);
    for (const s of rows) {
      const cell = node('td'),
        assessments = s.assessments.filter(
          (a) => a.subject === subject && a.criterion === criterion,
        );
      if (!assessments.length) cell.textContent = '—';
      else cell.append(...assessments.map((a) => assessmentButton(a, true)));
      row.append(cell);
    }
    body.append(row);
  }
  table.append(body);
  $('criterion-matrix').replaceChildren(
    criteria.length
      ? table
      : node('p', 'No criterion assessments attached for this subject.', 'empty'),
  );
}
function refreshAgents() {
  for (const id of ['thread-filter', 'conversation-thread'] as const) {
    const select = $(id),
      prior = select.value;
    select.replaceChildren();
    if (id === 'thread-filter')
      option(select, 'all', DATA.sessionTrace ? 'All agents' : 'All threads / actors');
    for (const thread of DATA.threads) {
      if (DATA.sessionTrace && thread.purpose === 'auto-review') continue;
      option(select, thread.id, sessionLabel(thread.id));
    }
    if (
      DATA.sessionTrace &&
      $('show-review').checked &&
      DATA.threads.some((t) => t.purpose === 'auto-review')
    )
      option(select, '__reviews__', 'Auto-review');
    select.value = [...select.options].some((o) => o.value === prior)
      ? prior
      : id === 'thread-filter'
        ? 'all'
        : DATA.threads[0].id;
  }
}
function eligibleActionTurns() {
  return turns.filter(
    (t) => matchesAgent(t.threadId, $('thread-filter').value) && t.events.some(visibleEvent),
  );
}
function refreshTurns() {
  const select = $('turn-filter'),
    prior = select.value;
  select.replaceChildren();
  option(select, 'all', 'All turns');
  for (const t of DATA.sessionTrace ? eligibleActionTurns() : turns) {
    option(
      select,
      JSON.stringify([t.threadId, t.id]),
      `${DATA.sessionTrace ? '' : t.startedAt === undefined ? 'Time unknown · ' : new Date(t.startedAt * 1000).toLocaleTimeString('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit' }) + ' CST · '}${sessionLabel(t.threadId)} · Turn ${turnIndex.get(JSON.stringify([t.threadId, t.id])) ?? '?'}`,
    );
  }
  select.value = [...select.options].some((o) => o.value === prior) ? prior : 'all';
  syncTurnSlider();
}
function syncTurnSlider() {
  const list = eligibleActionTurns(),
    index = list.findIndex((t) => JSON.stringify([t.threadId, t.id]) === $('turn-filter').value);
  $('turn-slider').max = String(list.length);
  $('turn-slider').value = String(index + 1);
  $('turn-slider').disabled = !list.length;
  $('action-earlier').disabled = index < 0;
  $('action-later').disabled = !list.length || index >= list.length - 1;
  $('all-turns').setAttribute('aria-pressed', String(index < 0));
  const t = list[index];
  const caption = t
    ? `${sessionLabel(t.threadId)} · Turn ${turnIndex.get(JSON.stringify([t.threadId, t.id]))} / ${threadMap.get(t.threadId)?.turns.filter((turn) => turn.events.some(visibleEvent)).length}`
    : `All ${list.length} turns`;
  $('turn-position').textContent = caption;
  $('turn-slider').setAttribute('aria-valuetext', caption);
  $('turn-position').title =
    t?.events.find((e) => visibleEvent(e) && ['request', 'goal'].includes(e.kind))?.preview ?? '';
}
function chooseActionTurn(position: number) {
  const t = eligibleActionTurns()[position - 1];
  $('turn-filter').value = t ? JSON.stringify([t.threadId, t.id]) : 'all';
  page = 0;
  selectedEvent = null;
  syncTurnSlider();
  renderEvents();
  saveLocation();
}
$('turn-slider').oninput = () => chooseActionTurn(Number($('turn-slider').value));
$('all-turns').onclick = () => chooseActionTurn(0);
$('action-earlier').onclick = () =>
  chooseActionTurn(Math.max(0, Number($('turn-slider').value) - 1));
$('action-later').onclick = () => chooseActionTurn(Number($('turn-slider').value) + 1);
function renderCoverage() {
  const regular = DATA.threads.filter((t) => !DATA.sessionTrace || t.purpose !== 'auto-review');
  const active = DATA.sessionTrace && $('show-review').checked ? DATA.threads : regular;
  const visible = events.filter((e) => active.some((t) => t.id === e.threadId) && visibleEvent(e));
  const unsupported = active.reduce(
    (n, t) => n + t.coverage.unsupportedItems.reduce((sum, g) => sum + g.count, 0),
    0,
  );
  const metrics = [
    [
      `${regular.length} sessions`,
      'The main conversation and child agent conversations. Auto-review sessions are counted separately. Each session can contain multiple turns.',
    ],
    [
      `${active.flatMap((t) => t.turns).filter((t) => t.events.some(visibleEvent)).length} turns`,
      'A turn starts with a request and can contain messages, tool calls and results. Auto-review is omitted while hidden.',
    ],
    [
      `${visible.length} records`,
      'Indexed observable records before the agent, turn and type filters. Linked tool inputs and outputs appear together as one action.',
    ],
    ...(unsupported
      ? [
          [
            `${unsupported} unsupported`,
            'Unrecognized source types. Their identities and counts appear in Source & provenance.',
          ],
        ]
      : []),
    ...(DATA.sessionTrace && $('show-review').checked
      ? [
          [
            `${DATA.threads.length - regular.length} review sessions`,
            'Separate automatic approval-review conversations, shown only when enabled.',
          ],
        ]
      : []),
  ];
  $('coverage-summary').replaceChildren();
  for (const [label, explanation] of metrics) {
    const item = node('span', label, 'help-target');
    item.tabIndex = 0;
    const tip = node('span', explanation, 'tooltip');
    tip.setAttribute('role', 'tooltip');
    item.append(tip);
    $('coverage-summary').append(item);
  }
}
function actionDescription(action: TraceAction) {
  if (
    action.anchor.callId &&
    /\/(function_call_output|custom_tool_call_output)$/.test(action.anchor.sourceType ?? '')
  )
    return 'Output · ' + action.anchor.callId;
  const e = action.executions[0] ?? action.anchor;
  if (e.kind === 'goal') {
    const objective = e.preview.match(/<objective[^>]*>([\s\S]*?)(?:<\/objective>|$)/)?.[1];
    if (objective) return objective.replace(/\s+/g, ' ').trim().slice(0, 130);
  }
  const text = e.preview.replace(/\s+/g, ' ').trim();
  if (['command', 'edit', 'reference', 'delegation'].includes(e.kind)) {
    const name = e.title.replace(/^Tool (?:call|result)\s*·?\s*/i, '');
    return text && text !== 'Recorded tool result'
      ? text.slice(0, 130)
      : `${name}${e.callId ? ' · ' + e.callId : ''}`;
  }
  return text.slice(0, 130) || e.title;
}
function actionCard(action: TraceAction, open = false, prefix = 'record-') {
  const e = action.anchor,
    row = node('article', undefined, 'event trace-action');
  row.id = prefix + encodeURIComponent(action.key);
  row.dataset.eventKey = action.key;
  if (action.records.some((r) => r.key === selectedEvent)) row.classList.add('selected-event');
  const details = node('details');
  details.open = open;
  const summary = node('summary', undefined, 'action-summary');
  const type = node('button', e.kind, 'type-badge type-' + e.kind);
  type.setAttribute('aria-label', 'Filter ' + e.kind + ' records');
  type.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (prefix === 'turn-record-') {
      $('turn-kind').value = recordType(e);
      renderConversation();
    } else {
      $('kind').value = e.kind;
      page = 0;
      renderEvents();
    }
    saveLocation();
  };
  summary.append(type, node('span', actionDescription(action), 'action-description'));
  const meta = node('div', undefined, 'event-meta');
  const owner = node(
    'span',
    sessionLabel(e.threadId),
    'session-badge ' + (e.threadId === DATA.threads[0].id ? 'session-main' : 'session-child'),
  );
  owner.title = e.threadId;
  const position = node(
    'span',
    action.records.length === 1
      ? `#${e.sourceLine ?? e.ordinal}`
      : '#' + action.records.map((r) => r.sourceLine ?? r.ordinal).join(', '),
  );
  position.title = action.records
    .map(
      (r) =>
        `${r.sourcePath ?? r.threadId}:${r.sourceLine ?? r.ordinal}${r.callId ? ' · ' + r.callId : ''}`,
    )
    .join('\n');
  meta.append(
    owner,
    node('span', `Turn ${turnIndex.get(JSON.stringify([e.threadId, e.turnId])) ?? '?'}`),
    position,
  );
  row.append(meta, details);
  details.append(summary);
  const appendBody = (record: TraceEvent, target: HTMLElement) => {
    const source = eventDetails(record, true);
    source.querySelector(':scope > summary')?.remove();
    target.append(...source.children);
  };
  if (action.executions.length) {
    for (const execution of action.executions) {
      const pair = node('section', undefined, 'execution-pair');
      const status =
        execution.exitCode === undefined || execution.exitCode === null
          ? ''
          : `Exit ${execution.exitCode}`;
      const duration =
        execution.durationMs === undefined
          ? ''
          : execution.durationMs >= 1000
            ? `${(execution.durationMs / 1000).toFixed(2)} s`
            : `${Math.round(execution.durationMs)} ms`;
      if (status || duration)
        pair.append(
          node(
            'p',
            [status, duration].filter(Boolean).join(' · '),
            execution.exitCode ? 'warning execution-status' : 'small execution-status',
          ),
        );
      appendBody(execution, pair);
      details.append(pair);
    }
    const wrapperRecords = action.records.filter((r) => !action.executions.includes(r));
    if (wrapperRecords.length) {
      const wrapper = node('details', undefined, 'tool-wrapper');
      wrapper.append(node('summary', 'Tool wrapper'));
      for (const record of wrapperRecords) appendBody(record, wrapper);
      details.append(wrapper);
    }
  } else {
    appendBody(e, details);
    for (const result of action.results.filter((r) => r !== e)) appendBody(result, details);
  }
  return row;
}
function renderTraceActions(focusId?: string | null) {
  const query = $('search').value.toLowerCase();
  matchingActions = actions.filter((a) => {
    const records = a.records.filter(visibleEvent);
    return (
      records.length &&
      matchesAgent(a.anchor.threadId, $('thread-filter').value) &&
      ($('turn-filter').value === 'all' ||
        JSON.stringify([a.anchor.threadId, a.anchor.turnId]) === $('turn-filter').value) &&
      ($('kind').value === 'all' || records.some((e) => e.kind === $('kind').value)) &&
      records.some((e) =>
        `${e.title}\n${e.text}\n${e.output ?? ''}\n${e.callId ?? ''}`.toLowerCase().includes(query),
      )
    );
  });
  const order = (a: TraceAction, b: TraceAction) =>
    (threadIndex.get(a.anchor.threadId) ?? 0) - (threadIndex.get(b.anchor.threadId) ?? 0) ||
    (a.anchor.sourceLine ?? a.anchor.ordinal) - (b.anchor.sourceLine ?? b.anchor.ordinal);
  const time = (action: TraceAction) =>
    action.anchor.timestamp
      ? Date.parse(action.anchor.timestamp)
      : (turns.find((t) => t.threadId === action.anchor.threadId && t.id === action.anchor.turnId)
          ?.startedAt ?? Infinity) * 1000;
  matchingActions.sort(
    $('event-order').value === 'time'
      ? (a, b) => {
          const delta = time(a) - time(b);
          return Number.isNaN(delta) ? order(a, b) : delta || order(a, b);
        }
      : order,
  );
  if (focusId) {
    const index = matchingActions.findIndex((a) => a.records.some((e) => e.key === focusId));
    if (index >= 0) page = Math.floor(index / pageSize);
  }
  page = Math.max(0, Math.min(page, Math.ceil(matchingActions.length / pageSize) - 1));
  $('event-count').textContent = `${matchingActions.length} actions`;
  $('event-list').replaceChildren(
    ...matchingActions.slice(page * pageSize, (page + 1) * pageSize).map((a) =>
      actionCard(
        a,
        a.records.some((e) => e.key === selectedEvent),
      ),
    ),
  );
  if (!matchingActions.length)
    $('event-list').append(node('p', 'No actions match these filters.', 'empty'));
  $('event-prev').disabled = page === 0;
  $('event-next').disabled = (page + 1) * pageSize >= matchingActions.length;
  $('event-page').textContent =
    `Page ${matchingActions.length ? page + 1 : 0} / ${Math.ceil(matchingActions.length / pageSize)}`;
  syncTurnSlider();
  renderMinimap();
}
function renderMinimap() {
  const context = $('action-context');
  context.replaceChildren(node('h3', 'Jump to action'));
  const map = node('div', undefined, 'action-minimap');
  map.setAttribute('aria-label', 'Action minimap');
  const stride = Math.max(1, Math.ceil(matchingActions.length / 180));
  for (let index = 0; index < matchingActions.length; index += stride) {
    const a = matchingActions[index],
      button = node('button', undefined, 'map-cell type-' + a.anchor.kind);
    const last = Math.min(index + stride, matchingActions.length);
    button.title = `${index + 1}${stride > 1 ? '–' + last : ''} · ${a.anchor.kind} · ${actionDescription(a)}`;
    button.setAttribute('aria-label', `Jump to action ${index + 1}: ${a.anchor.kind}`);
    button.setAttribute('aria-pressed', String(a.records.some((e) => e.key === selectedEvent)));
    if (index < (page + 1) * pageSize && last > page * pageSize) button.classList.add('map-page');
    button.onclick = () => {
      selectedEvent = a.key;
      renderEvents(a.key);
      document
        .getElementById('record-' + encodeURIComponent(a.key))
        ?.scrollIntoView({ block: 'center' });
      saveLocation();
    };
    map.append(button);
  }
  context.append(map);
  const legend = node('div', undefined, 'map-legend');
  const counts = new Map<string, number>();
  for (const a of matchingActions) counts.set(a.anchor.kind, (counts.get(a.anchor.kind) ?? 0) + 1);
  for (const [kind, count] of counts) {
    const button = node('button', `${kind} ${count}`, 'map-key type-' + kind);
    button.setAttribute('aria-label', 'Filter ' + kind + ' actions');
    button.onclick = () => {
      $('kind').value = kind;
      page = 0;
      renderEvents();
      saveLocation();
    };
    legend.append(button);
  }
  context.append(legend);
}

function initEvidence() {
  refreshAgents();
  option($('role-filter'), 'all', 'All evidence roles');
  for (const r of [
    'request',
    'feedback',
    'plan',
    'action',
    'edit',
    'artifact',
    'inspection',
    'verification',
    'assessment',
    'handoff',
    'other',
  ])
    option($('role-filter'), r, r);
  for (const t of DATA.threads) {
    const c = t.coverage;
    const d = node('details');
    d.append(
      node('summary', `${t.role} · ${t.source.name} · schema ${t.source.rawSchemaVersion}`),
      node(
        'p',
        `${c.normalizedItems}/${c.totalItems} items normalized; ${c.truncatedItems} source-truncated; ${c.displayTruncatedItems} shortened previews.`,
      ),
    );
    for (const [label, groups] of [
      ['Unsupported', c.unsupportedItems],
      ['Intentionally excluded', c.excludedItems],
    ] as const)
      for (const g of groups) {
        const detail = node('details');
        detail.append(
          node('summary', `${label}: ${g.type} ×${g.count}`),
          node(
            'pre',
            g.refs
              .map((r) => `${r.thread} / ${r.turn} / ${r.event} · ordinal ${r.ordinal}`)
              .join('\n'),
          ),
        );
        d.append(detail);
      }
    if (!c.unsupportedItems.length)
      d.append(
        node('p', 'Unsupported source items: 0. This describes only the supplied export.', 'small'),
      );
    $('coverage-details').append(d);
  }
  renderCoverage();
  $('close-drawer').onclick = () => {
    closeDrawer();
    saveLocation();
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('evidence-drawer').hidden) {
      closeDrawer();
      saveLocation();
    }
  });
}

function renderStory() {
  if (DATA.sessionTrace) {
    renderActionContext();
    renderSourceFiles();
    return;
  }
  const s = DATA.stages[stage];
  for (const b of $('steps').querySelectorAll<HTMLButtonElement>('.step')) {
    if (Number(b.dataset.stage) === stage) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  }
  required('recorded-quote', HTMLDetailsElement).open = false;
  const rail = $('steps').parentElement!;
  const activeStep = $('steps').querySelectorAll<HTMLButtonElement>('.step')[stage];
  rail.scrollTop = Math.max(0, activeStep.offsetTop - rail.offsetTop - rail.clientHeight * 0.25);
  $('stage-title').textContent = s.title;
  $('stage-status').textContent = s.status ?? '';
  $('step-count').textContent = `${stage + 1} / ${DATA.stages.length}`;
  for (const k of ['question', 'change', 'finding', 'lesson', 'quote'] as const)
    $(k).textContent = s[k] ?? '';
  $('anchor').textContent = `${s.threadId} / ${s.turn} / ${s.anchorId}`;
  $('open-chat').href = `codex://threads/${s.threadId}`;
  $('prev').disabled = stage === 0;
  $('next').disabled = stage === DATA.stages.length - 1;
  $('story-subject').replaceChildren();
  for (const subject of [
    ...new Set([
      ...s.captures.map((c) => c.subject),
      ...s.artifacts.map((id) => artifactById(id).subject),
    ]),
  ])
    option($('story-subject'), subject, subject[0].toUpperCase() + subject.slice(1));
  $('story-subject').value =
    s.subject ??
    (s.captures.some((c) => c.subject === 'hydra')
      ? 'hydra'
      : ($('story-subject').options[0]?.value ?? 'unknown'));
  renderEpisode();
  renderStoryImages();
  renderActionContext();
  $('source-stage').value = String(stage);
  renderSourceFiles();
}
function renderStoryImages() {
  const s = DATA.stages[stage];
  const subject = $('story-subject').value;
  if (s.comparison === 'roundtrip') {
    $('story-images').replaceChildren(
      imageFigure(s, subject, 'roundtrip-live', 'Live model · neutral lighting'),
      imageFigure(s, subject, 'roundtrip-exported', 'Reloaded GLB · same lighting'),
    );
    return;
  }
  const previous = DATA.stages
    .slice(0, stage)
    .findLast((x) => x.captures.some((c) => c.subject === subject && c.angle === 'hero'));
  $('story-images').replaceChildren(
    imageFigure(previous, subject, 'hero', 'Earlier retained revision'),
    imageFigure(s, subject, 'hero', 'This revision'),
  );
}
$('story-subject').onchange = renderStoryImages;
type RecordedTurn = TraceData['threads'][number]['turns'][number];
const conversationSize = 20;
const conversationTurns = () =>
  DATA.threads
    .filter((t) => matchesAgent(t.id, $('conversation-thread').value))
    .flatMap((t) => t.turns)
    .filter((turn) => turn.events.some(visibleEvent));
const assistantMessages = (t: RecordedTurn) =>
  t.events.filter((e) => visibleEvent(e) && e.kind === 'message' && e.title !== 'Recorded message');
const turnResponse = (t: RecordedTurn) =>
  assistantMessages(t).findLast(
    (e) => e.messagePhase === 'final_answer' || e.title === 'Completion report',
  ) ?? assistantMessages(t).at(-1);
function turnPair(t: RecordedTurn, full = false) {
  const box = node('div', undefined, 'conversation-pair');
  const request = node('section'),
    response = node('section');
  const requests = t.events.filter(
    (e) =>
      visibleEvent(e) && (e.kind === 'request' || e.kind === 'goal' || e.kind === 'auto-review'),
  );
  request.append(
    node(
      'h3',
      requests[0]?.kind === 'goal'
        ? 'Goal continuation'
        : requests[0]?.kind === 'auto-review'
          ? 'Approval review'
          : 'User request',
    ),
  );
  if (!requests.length) request.append(node('p', 'Request not recorded.', 'small'));
  for (const [i, e] of (full ? requests : requests.slice(0, 1)).entries()) {
    if (i) request.append(node('h3', `Further user message ${i}`));
    request.append(
      full
        ? recordText(e)
        : presentedText(e.text.slice(0, 360) + (e.text.length > 360 ? '…' : ''), e.kind, textMode),
    );
  }
  if (!full && requests.length > 1)
    request.append(node('p', `+${requests.length - 1} further user messages`, 'small'));
  const answer = turnResponse(t);
  const final = answer?.messagePhase === 'final_answer' || answer?.title === 'Completion report';
  response.append(
    node('h3', final ? 'Assistant response · final' : 'Last recorded assistant message'),
  );
  if (answer)
    response.append(
      full
        ? recordText(answer)
        : presentedText(
            answer.text.slice(0, 480) + (answer.text.length > 480 ? '…' : ''),
            answer.kind,
            textMode,
          ),
    );
  else response.append(node('p', 'Assistant message not recorded.', 'small'));
  if (!final) response.append(node('p', 'Final status unavailable.', 'small'));
  box.append(request, response);
  return box;
}
const isToolResult = (e: TraceEvent) =>
  /\/(function_call_output|custom_tool_call_output)$/.test(e.sourceType ?? '');
const callRecords = new Map<string, TraceEvent[]>();
for (const e of events)
  if (e.callId) {
    const key = JSON.stringify([e.threadId, e.callId]);
    callRecords.set(key, [...(callRecords.get(key) ?? []), e]);
  }
function recordType(e: TraceEvent) {
  return isToolResult(e) ? 'result' : e.kind === 'command' ? 'call' : e.kind;
}
function recordMeta(e: TraceEvent) {
  const meta = node('div', undefined, 'record-meta');
  const type = recordType(e),
    badge = node('button', type, 'type-badge type-' + type);
  badge.title = 'Show only ' + type + ' records in this turn';
  badge.setAttribute('aria-label', 'Filter ' + type + ' records');
  badge.onclick = () => {
    $('turn-kind').value = type;
    renderConversation();
    saveLocation();
  };
  meta.append(badge, node('span', '#' + e.ordinal, 'small'));
  if (e.status) meta.append(node('span', e.status, 'small'));
  return meta;
}
for (const type of new Set(events.map(recordType))) option($('turn-kind'), type, type);
$('turn-kind').onchange = () => {
  if ($('turn-kind').value === 'auto-review') $('show-review').checked = true;
  renderConversation();
  saveLocation();
};
function renderTurn(t: RecordedTurn) {
  const threadTurns = conversationTurns();
  const index = threadTurns.indexOf(t);
  $('turn-title').textContent =
    t.id === 'session-prefix' ? 'Records before a known turn' : `Turn ${index + 1}`;
  const work = t.events.filter(
    (e) =>
      visibleEvent(e) &&
      !['request', 'goal', 'auto-review'].includes(e.kind) &&
      e !== turnResponse(t) &&
      ($('turn-kind').value === 'all' || recordType(e) === $('turn-kind').value),
  );
  $('turn-meta').textContent =
    `${t.events.length} items${t.startedAt === undefined ? '' : ' · ' + new Date(t.startedAt * 1000).toLocaleString()}`;
  $('turn-pair').replaceChildren(...turnPair(t, true).children);
  $('turn-work').replaceChildren();
  if (DATA.sessionTrace) {
    const keys = new Set(work.map((e) => e.key));
    const groups = actions.filter((a) => a.records.some((e) => keys.has(e.key)));
    $('turn-work').append(...groups.map((a) => actionCard(a, false, 'turn-record-')));
  }
  for (const e of DATA.sessionTrace ? [] : work) {
    const row = node(
      'article',
      undefined,
      e.kind === 'message' ? 'turn-commentary' : e.exitCode ? 'turn-failure' : undefined,
    );
    row.id = 'turn-record-' + encodeURIComponent(e.key);
    row.append(recordMeta(e), eventDetails(e, true));
    if (e.callId) {
      const related = (callRecords.get(JSON.stringify([e.threadId, e.callId])) ?? []).filter(
        (other) => other !== e && isToolResult(other) !== isToolResult(e),
      );
      if (!related.length)
        row.append(
          node(
            'p',
            isToolResult(e) ? 'Matching call unavailable.' : 'Result not recorded.',
            'small',
          ),
        );
      for (const other of related) {
        const link = node('button', isToolResult(e) ? 'Jump to tool input' : 'Jump to tool result');
        link.onclick = () => {
          const target = document.getElementById('turn-record-' + encodeURIComponent(other.key));
          if (target) {
            target.tabIndex = -1;
            target.focus();
            target.scrollIntoView({ block: 'center' });
          } else openRaw(other.key);
        };
        row.append(link);
      }
    }
    $('turn-work').append(row);
  }
  if (!work.length) $('turn-work').append(node('p', 'No intervening work recorded.', 'empty'));
  $('turn-earlier').disabled = index <= 0;
  $('turn-later').disabled = index >= threadTurns.length - 1;
  $('turn-earlier').onclick = () => openTurn(threadTurns[index - 1].id);
  $('turn-later').onclick = () => openTurn(threadTurns[index + 1].id);
}
function renderConversation() {
  const all = conversationTurns();
  const chosen = all.find((t) => t.id === selectedTurn);
  const heading = $('conversation').querySelector<HTMLElement>('.panel-heading');
  if (heading) heading.hidden = !!chosen;
  $('turn-detail').hidden = !chosen;
  $('conversation-list').hidden = !!chosen;
  $('conversation-pager').hidden = !!chosen;
  if (chosen) {
    renderTurn(chosen);
    $('conversation-count').hidden = true;
    return;
  }
  selectedTurn = null;
  $('conversation-count').hidden = false;
  const query = $('conversation-search').value.trim().toLowerCase();
  const filtered = all.filter((t) =>
    [
      ...t.events
        .filter((e) => visibleEvent(e) && ['request', 'goal', 'auto-review'].includes(e.kind))
        .map((e) => e.text),
      turnResponse(t)?.text ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
  conversationPage = Math.max(
    0,
    Math.min(conversationPage, Math.ceil(filtered.length / conversationSize) - 1),
  );
  $('conversation-count').textContent =
    `${filtered.length} of ${all.length} recorded turns · page ${filtered.length ? conversationPage + 1 : 0} / ${Math.ceil(filtered.length / conversationSize)}`;
  $('conversation-list').replaceChildren();
  for (const t of filtered.slice(
    conversationPage * conversationSize,
    (conversationPage + 1) * conversationSize,
  )) {
    const card = node('article', undefined, 'process-card');
    card.append(
      node(
        'h3',
        t.id === 'session-prefix' ? 'Records before a known turn' : `Turn ${all.indexOf(t) + 1}`,
      ),
    );
    const kinds = new Map<string, number>();
    for (const e of t.events)
      if (e.kind !== 'request' && e.kind !== 'message')
        kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
    card.append(
      node(
        'p',
        [...kinds].map(([kind, n]) => `${n} ${kind} records`).join(' · ') ||
          'No tool or edit records',
        'small',
      ),
      turnPair(t),
    );
    const button = node('button', 'Inspect turn');
    button.onclick = () => openTurn(t.id);
    card.append(button);
    $('conversation-list').append(card);
  }
  if (!filtered.length)
    $('conversation-list').append(
      node('p', 'No recorded turns match this request or response.', 'empty'),
    );
  $('conversation-prev').disabled = conversationPage === 0;
  $('conversation-next').disabled = (conversationPage + 1) * conversationSize >= filtered.length;
}
function openTurn(id: string) {
  closeDrawer();
  selectedTurn = id;
  tab('conversation');
  $('turn-title').tabIndex = -1;
  $('turn-title').focus();
  window.scrollTo({ top: 0 });
}
refreshAgents();
for (const id of ['conversation-thread', 'conversation-search'] as const)
  $(id).addEventListener(id === 'conversation-search' ? 'input' : 'change', () => {
    selectedTurn = null;
    conversationPage = 0;
    closeDrawer();
    tab('conversation');
  });
$('conversation-prev').onclick = () => {
  conversationPage--;
  tab('conversation');
};
$('conversation-next').onclick = () => {
  conversationPage++;
  tab('conversation');
};
$('turn-back').onclick = () => {
  selectedTurn = null;
  tab('conversation');
};

const processRoles = [
  { title: 'Request', roles: ['request', 'feedback', 'plan'] },
  { title: 'Action', roles: ['action', 'edit', 'artifact'] },
  { title: 'Inspection', roles: ['inspection', 'verification'] },
  { title: 'Assessment / handoff', roles: ['assessment', 'handoff'] },
];
function processSubjects(s: Revision) {
  return [...new Set(s.artifacts.map((id) => artifactById(id).subject))];
}
function processSelection() {
  const query = $('process-search').value.trim().toLowerCase();
  const subject = $('process-subject').value;
  return DATA.stages.filter(
    (s) =>
      (subject === 'all' || processSubjects(s).includes(subject)) &&
      ($('process-lessons').value !== 'lessons' || !!s.lesson?.trim()) &&
      [s.title, s.status, s.question, s.change, s.finding, s.lesson, ...processSubjects(s)]
        .join(' ')
        .toLowerCase()
        .includes(query),
  );
}
function renderProcess() {
  const selected = processSelection();
  $('process-count').textContent =
    `${selected.length} of ${DATA.stages.length} curated episodes · authored order, not elapsed time`;
  $('export-learning').disabled = !selected.length;
  $('process-list').replaceChildren();
  for (const s of selected) {
    const card = node('article', undefined, 'process-card');
    card.append(
      node(
        'p',
        `Episode ${s.index + 1} · ${processSubjects(s).join(', ') || 'Subject unspecified'} · ${s.status || 'Status unrecorded'}`,
        'small',
      ),
    );
    card.append(node('h3', s.title), node('p', s.question || 'No request summary authored.'));
    const roles = node('div', undefined, 'process-roles');
    for (const group of processRoles) {
      const refs = s.evidence.filter((r) => r.roles.some((role) => group.roles.includes(role)));
      const button = node('button', group.title);
      button.append(
        node('small', refs.length ? `${refs.length} linked records` : 'No evidence attached'),
      );
      button.disabled = !refs.length;
      button.onclick = () => {
        closeDrawer();
        stage = s.index;
        renderStory();
        const box = drawer(`${s.title} · ${group.title}`);
        box.append(
          node('p', 'Curated evidence roles; a record can support more than one role.', 'small'),
          ...refs.map(evidenceButton),
        );
        saveLocation('process');
      };
      roles.append(button);
    }
    card.append(roles);
    const summary = node('div', undefined, 'explanation');
    for (const [label, text] of [
      ['Change', s.change],
      ['Finding', s.finding],
    ]) {
      const section = node('section');
      section.append(node('h3', label), node('p', text || 'Not authored.'));
      summary.append(section);
    }
    card.append(
      summary,
      node(
        'p',
        s.lesson ? `Lesson to carry forward: ${s.lesson}` : 'No lesson authored for this episode.',
        s.lesson ? 'lesson' : 'small',
      ),
    );
    if (s.limits?.length) card.append(node('p', s.limits.join(' '), 'small'));
    const open = node('button', 'Open episode');
    open.onclick = () => chooseStage(s.index);
    card.append(open);
    $('process-list').append(card);
  }
  if (!selected.length)
    $('process-list').append(
      node('p', 'No curated episodes match. Clear the search or choose another subject.', 'empty'),
    );
}
for (const subject of [...new Set(DATA.artifacts.map((a) => a.subject))])
  option($('process-subject'), subject, subject);
for (const id of ['process-search', 'process-subject', 'process-lessons'] as const)
  $(id).addEventListener(id === 'process-search' ? 'input' : 'change', () => {
    closeDrawer();
    renderProcess();
    saveLocation('process');
  });
$('export-learning').onclick = () => {
  const lines = [
    `# ${DATA.title} — learning notes`,
    '',
    'Authored interpretations from selected episodes, not automatic root-cause findings or new verification.',
    'Evidence links refer to the accompanying trace bundle. Keep these notes with it.',
    '',
    `Search: ${$('process-search').value || '(none)'}; subject: ${$('process-subject').value}; episodes: ${$('process-lessons').value}.`,
    '',
  ];
  for (const s of processSelection()) {
    const link = (event?: string) =>
      './index.html#' +
      new URLSearchParams({ episode: s.id, view: 'story', ...(event ? { event } : {}) }).toString();
    lines.push(
      `## ${s.title}`,
      '',
      `Status: ${s.status || 'Unrecorded'}`,
      '',
      `Request: ${s.question || 'Not authored.'}`,
      '',
      `Change: ${s.change || 'Not authored.'}`,
      '',
      `Finding: ${s.finding || 'Not authored.'}`,
      '',
      `Lesson: ${s.lesson || 'Not authored.'}`,
      '',
      `Limits: ${s.limits?.join(' ') || 'No episode-specific limits authored; consult source coverage.'}`,
      '',
      `[Open episode](${link()})`,
      '',
      'Supporting episode records (not independent proof of the lesson):',
      '',
      ...s.evidence.map(
        (r) => `- [${r.roles.join(', ')}](${link(r.key)}) — ${r.thread} / ${r.turn} / ${r.event}`,
      ),
      '',
    );
  }
  const url = URL.createObjectURL(
    new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' }),
  );
  const a = node('a');
  a.href = url;
  a.download = 'learning-notes.md';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function chooseStage(i: number) {
  closeDrawer();
  selectedEvent = null;
  selectedAssessment = null;
  stage = i;
  renderStory();
  tab('story');
  window.scrollTo({ top: 0 });
}
DATA.stages.forEach((s, i) => {
  const b = node('button', undefined, 'step');
  b.dataset.stage = String(i);
  b.append(node('span', String(i + 1).padStart(2, '0'), 'num'));
  const text = node('span', s.title);
  text.append(node('small', s.status));
  b.append(text);
  b.onclick = () => chooseStage(i);
  $('steps').append(b);
  option($('source-stage'), i, s.title);
});
$('prev').onclick = () => chooseStage(stage - 1);
$('next').onclick = () => chooseStage(stage + 1);
for (const s of [...new Set(DATA.artifacts.map((a) => a.subject))])
  option($('subject'), s, s[0].toUpperCase() + s.slice(1));
function compareOptions() {
  const available = DATA.stages.filter((s) =>
    s.artifacts.some((id) => artifactById(id).subject === $('subject').value),
  );
  for (const id of ['before', 'after'] as const) {
    const old = $(id).value;
    $(id).replaceChildren();
    available.forEach((s) => option($(id), s.index, s.title));
    if (available.some((s) => String(s.index) === old)) $(id).value = old;
    else $(id).value = String(id === 'before' ? available[0]?.index : available.at(-1)?.index);
  }
  renderCompare();
}
function renderCompare() {
  const a = DATA.stages[Number($('before').value)],
    b = DATA.stages[Number($('after').value)],
    subject = $('subject').value,
    angle = $('angle').value;
  $('compare-images').replaceChildren(
    imageFigure(a, subject, angle, 'Before'),
    imageFigure(b, subject, angle, 'After'),
  );
  $('compare-status').textContent =
    `${subject} · ${angle} · ${a?.title ?? 'Unavailable'} → ${b?.title ?? 'Unavailable'}`;
  renderMatrix(subject);
}
$('subject').onchange = compareOptions;
for (const id of ['angle', 'before', 'after'] as const) $(id).onchange = renderCompare;
refreshTurns();
function renderEvents(focusId?: string | null) {
  if (DATA.sessionTrace) {
    renderTraceActions(focusId);
    return;
  }
  const episodeRefs = new Map(DATA.stages[stage].evidence.map((r) => [r.key, r]));
  const q = $('search').value.toLowerCase();
  const filtered = events.filter(
    (e) =>
      visibleEvent(e) &&
      ($('turn-filter').value === 'all' ||
        JSON.stringify([e.threadId, e.turnId]) === $('turn-filter').value) &&
      ($('thread-filter').value === 'all' || e.threadId === $('thread-filter').value) &&
      ($('episode-filter').value === 'all' || episodeRefs.has(e.key)) &&
      ($('role-filter').value === 'all' ||
        episodeRefs.get(e.key)?.roles.includes($('role-filter').value)) &&
      ($('kind').value === 'all' || e.kind === $('kind').value) &&
      `${e.title}\n${e.text}\n${e.output ?? ''}`.toLowerCase().includes(q),
  );
  const sourceOrder = (a: TraceEvent, b: TraceEvent) =>
    (threadIndex.get(a.threadId) ?? 0) - (threadIndex.get(b.threadId) ?? 0) ||
    (a.sourceLine !== undefined && b.sourceLine !== undefined
      ? a.sourceLine - b.sourceLine
      : (turnIndex.get(JSON.stringify([a.threadId, a.turnId])) ?? 0) -
          (turnIndex.get(JSON.stringify([b.threadId, b.turnId])) ?? 0) || a.ordinal - b.ordinal);
  const recordedTime = (e: TraceEvent) =>
    e.timestamp
      ? Date.parse(e.timestamp)
      : (turns.find((t) => t.threadId === e.threadId && t.id === e.turnId)?.startedAt ??
          Number.POSITIVE_INFINITY) * 1000;
  filtered.sort(
    $('event-order').value === 'time'
      ? (a, b) => {
          const delta = recordedTime(a) - recordedTime(b);
          return Number.isNaN(delta) ? sourceOrder(a, b) : delta || sourceOrder(a, b);
        }
      : sourceOrder,
  );
  if (focusId) {
    const idx = filtered.findIndex((e) => e.key === focusId);
    if (idx >= 0) page = Math.floor(idx / pageSize);
  }
  page = Math.max(0, Math.min(page, Math.ceil(filtered.length / pageSize) - 1));
  $('event-count').textContent =
    `${filtered.length} matching records · ${events.length} included records total`;
  $('event-list').replaceChildren();
  let priorSession = '';
  for (const e of filtered.slice(page * pageSize, (page + 1) * pageSize)) {
    if ($('event-order').value === 'session' && priorSession !== e.threadId) {
      const heading = node('h3', sessionLabel(e.threadId), 'session-heading');
      heading.title = e.threadId;
      $('event-list').append(heading);
      priorSession = e.threadId;
    }
    const row = node('article', undefined, 'event');
    row.id = `record-${encodeURIComponent(e.key)}`;
    if (!DATA.sessionTrace && episodeRefs.has(e.key)) row.classList.add('episode-event');
    if (e.key === selectedEvent) row.classList.add('selected-event');
    const meta = node('div', undefined, 'event-meta');
    const owner = node(
      'span',
      sessionLabel(e.threadId),
      'session-badge ' + (e.threadId === DATA.threads[0].id ? 'session-main' : 'session-child'),
    );
    owner.title = e.threadId;
    const position = node(
      'span',
      e.sourceLine !== undefined ? `Line ${e.sourceLine}` : `#${e.ordinal}`,
    );
    position.title =
      e.sourceLine !== undefined
        ? `Physical line in ${e.sourcePath ?? 'this session’s JSONL file'}. Line numbers are not shared between sessions.`
        : 'Record ordinal within this turn.';
    const type = node('button', e.kind, 'type-badge type-' + e.kind);
    type.setAttribute('aria-label', 'Filter ' + e.kind + ' records');
    type.onclick = () => {
      $('kind').value = e.kind;
      if (e.kind === 'auto-review') $('show-review').checked = true;
      page = 0;
      renderEvents();
      saveLocation();
    };
    meta.append(
      type,
      owner,
      node('span', `Turn ${turnIndex.get(JSON.stringify([e.threadId, e.turnId])) ?? '?'}`),
      position,
    );
    if (!DATA.sessionTrace && episodeRefs.has(e.key))
      meta.append(node('span', 'Episode: ' + episodeRefs.get(e.key)?.roles.join(', ')));
    if (e.exitCode !== undefined && e.exitCode !== null)
      meta.append(
        node(
          'span',
          `Exit ${e.exitCode}${e.durationMs === undefined ? '' : ' · ' + e.durationMs + ' ms'}`,
        ),
      );
    row.append(meta);
    const d = eventDetails(e, e.key === selectedEvent);
    row.append(d);
    const inspect = node('button', 'Inspect evidence');
    inspect.onclick = () => openEvent(e.key);
    row.append(inspect);
    $('event-list').append(row);
  }
  if (!filtered.length)
    $('event-list').append(node('p', 'No records match these filters.', 'empty'));
  $('event-prev').disabled = page === 0;
  $('event-next').disabled = (page + 1) * pageSize >= filtered.length;
  $('event-page').textContent =
    `Page ${filtered.length ? page + 1 : 0} / ${Math.ceil(filtered.length / pageSize)}`;
}
for (const id of [
  'turn-filter',
  'thread-filter',
  'episode-filter',
  'role-filter',
  'kind',
  'event-order',
] as const)
  $(id).onchange = () => {
    page = 0;
    if ($('kind').value === 'auto-review') {
      $('show-review').checked = true;
      refreshAgents();
      renderCoverage();
    }
    if (id === 'thread-filter') {
      $('turn-filter').value = 'all';
      refreshTurns();
    }
    renderEvents();
    renderActionContext();
    saveLocation();
  };
$('search').oninput = () => {
  page = 0;
  renderEvents();
  saveLocation();
};
$('event-prev').onclick = () => {
  page--;
  renderEvents();
};
$('event-next').onclick = () => {
  page++;
  renderEvents();
};
$('show-events').onclick = () => {
  resetEventFilters();
  $('episode-filter').value = 'current';
  openRaw(refKey(DATA.stages[stage].anchorRef), false);
};
function renderSourceFiles() {
  const s = DATA.stages[Number($('source-stage').value)];
  $('source-file').replaceChildren();
  for (const [i, f] of s.sources.entries()) option($('source-file'), i, f.name);
  $('source-file').disabled = !s.sources.length;
  renderSource();
}
function renderSource() {
  const s = DATA.stages[Number($('source-stage').value)],
    f = s.sources[Number($('source-file').value)];
  $('source-code').replaceChildren();
  if (!f) {
    $('source-meta').textContent =
      'No source snapshot is attached to this stage. Inspect recorded commands and patches for the available edit evidence.';
    $('source-code').textContent = 'No retained source snapshot.';
    return;
  }
  $('source-meta').textContent = `${f.path}\nSource key: ${f.sourceKey}\nSHA-256 ${f.sha256}`;
  let text = f.text;
  if ($('source-mode').value === 'diff') {
    text =
      f.diff?.text ??
      'No earlier retained snapshot of this file is attached. Choose Full retained source to inspect it.';
    if (f.diff)
      $('source-meta').textContent += `\nCompared with: ${DATA.stages[f.diff.fromStage].title}`;
  }
  for (const line of text.split('\n'))
    $('source-code').append(
      node(
        'span',
        line || ' ',
        line.startsWith('+') ? 'diff-add' : line.startsWith('-') ? 'diff-remove' : 'diff-line',
      ),
    );
}
$('source-stage').onchange = renderSourceFiles;
$('source-file').onchange = renderSource;
$('source-mode').onchange = renderSource;
$('show-source').onclick = () => {
  $('source-stage').value = String(stage);
  renderSourceFiles();
  tab('sources');
};
for (const t of DATA.threads) {
  const box = node('div', undefined, 'thread');
  box.append(node('h3', t.role));
  const a = node('a', t.title);
  a.href = `codex://threads/${t.id}`;
  box.append(
    a,
    node(
      'p',
      `${t.turns.length} turns · ${t.turns.reduce((n, x) => n + x.events.length, 0)} visible records`,
    ),
  );
  if (t.parent)
    box.append(
      node(
        'p',
        DATA.sessionTrace
          ? 'Parent session: ' + t.parent
          : 'Delegated by the reviewer. Its turns overlap the review turn.',
      ),
    );
  if (t.source.path)
    box.append(
      node(
        'pre',
        `${t.source.path}\nSHA-256: ${t.source.sha256}\nBytes scanned: ${t.source.bytes} · physical lines: ${t.source.lines}`,
      ),
    );
  $('threads').append(box);
}
$('outcome').textContent = DATA.outcome ?? 'Final user approval is not recorded.';
$('collection').textContent = DATA.sessionTrace
  ? `Read ${DATA.collectedAt}. Source hashes cover each bounded file prefix. Later appended records require reopening this trace.`
  : `Collected ${DATA.collectedAt}\n${DATA.media.length} copied captures; input and asset SHA-256 hashes are in manifest.json.`;
for (const d of DATA.documents) {
  const section = node('details');
  section.append(
    node('summary', d.path + ' · collected document'),
    node(
      'p',
      d.revision
        ? `Document pinned to Git commit ${d.revision}; this is not necessarily the version at each historical stage.`
        : 'This is the document as collected now, not a version from each historical stage.',
      'small',
    ),
    node('pre', d.text),
    node('p', `SHA-256 ${d.sha256}`, 'provenance'),
  );
  $('documents').append(section);
}
function restoreLocation() {
  const q = new URLSearchParams(location.hash.slice(1));
  const requestedThread = q.get('thread');
  $('conversation-thread').value = DATA.threads.some((thread) => thread.id === requestedThread)
    ? requestedThread!
    : DATA.threads[0].id;
  selectedTurn = q.get('turn');
  textMode = q.get('text') === 'raw' ? 'raw' : 'rendered';
  $('raw-text').checked = textMode === 'raw';
  $('show-review').checked = q.get('reviews') === 'show';
  refreshAgents();
  $('conversation-thread').value = [...$('conversation-thread').options].some(
    (o) => o.value === requestedThread,
  )
    ? requestedThread!
    : DATA.threads[0].id;
  $('event-order').value = q.get('order') === 'time' ? 'time' : 'session';
  $('turn-kind').value = [...$('turn-kind').options].some((o) => o.value === q.get('type'))
    ? q.get('type')!
    : 'all';
  $('conversation-search').value = q.get('query') ?? '';
  const requestedPage = Number(q.get('turnPage') ?? 0);
  conversationPage = Number.isInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  $('process-search').value = q.get('find') ?? '';
  const subject = q.get('subject') ?? 'all';
  $('process-subject').value = [...$('process-subject').options].some((o) => o.value === subject)
    ? subject
    : 'all';
  $('process-lessons').value = q.get('lessons') === 'true' ? 'lessons' : 'all';
  const requested = q.has('episode')
    ? DATA.stages.findIndex((s) => s.id === q.get('episode'))
    : Number(q.get('stage') ?? 0);
  closeDrawer();
  if (Number.isInteger(requested) && requested >= 0 && requested < DATA.stages.length)
    stage = requested;
  renderStory();
  if (!DATA.sessionTrace) compareOptions();
  resetEventFilters();
  if (DATA.sessionTrace) {
    const legacy = turns.find((t) => JSON.stringify([t.threadId, t.id]) === q.get('actionTurn'));
    $('thread-filter').value = q.get('session') ?? legacy?.threadId ?? 'all';
    if (!$('thread-filter').value) $('thread-filter').value = 'all';
    refreshTurns();
  }
  for (const [id, key] of [
    ['thread-filter', 'session'],
    ['turn-filter', 'actionTurn'],
    ['kind', 'kind'],
    ['episode-filter', 'scope'],
    ['role-filter', 'evidenceRole'],
  ] as const) {
    const value = q.get(key);
    if ([...$(id).options].some((option) => option.value === value)) $(id).value = value!;
  }
  $('search').value = q.get('search') ?? '';
  selectedEvent = eventMap.has(q.get('event') ?? '') ? q.get('event') : null;
  if (selectedEvent && eventMap.has(selectedEvent) && isReview(eventMap.get(selectedEvent)!))
    $('show-review').checked = true;
  renderCoverage();
  refreshTurns();
  renderEvents(selectedEvent);
  tab(q.get('view') ?? (DATA.sessionTrace ? 'conversation' : 'story'));
  if (selectedEvent) {
    if (q.get('view') === 'events')
      document
        .getElementById(
          `record-${encodeURIComponent(DATA.sessionTrace ? (actionMap.get(selectedEvent)?.key ?? selectedEvent) : selectedEvent)}`,
        )
        ?.scrollIntoView({ block: 'center' });
    if (!DATA.sessionTrace) openEvent(selectedEvent);
  } else window.scrollTo({ top: 0 });
  const assessment = DATA.stages
    .flatMap((s) => s.assessments)
    .find((a) => a.id === q.get('assessment'));
  if (assessment) openAssessment(assessment);
}
if (DATA.sessionTrace) {
  document.body.classList.add('session-trace');
  const actionControls = document.querySelector<HTMLElement>('#events .controls')!;
  const orderControls = $('event-order').closest('.controls')!;
  actionControls.append(...orderControls.children);
  orderControls.remove();

  for (const id of ['episode-filter', 'role-filter'] as const)
    $(id).closest('label')!.hidden = true;
  for (const element of document.querySelectorAll<HTMLElement>(
    '#events > .panel-heading > .eyebrow, #events > .panel-heading > h2',
  ))
    element.hidden = true;
  document.getElementById('interpretation-intro')!.textContent = '';
  $('turn-filter').closest('label')!.hidden = true;
  document.getElementById('action-navigation')!.hidden = false;
  $('thread-filter').closest('label')!.firstChild!.textContent = 'Agent';
  document.querySelector<HTMLElement>('#events > .panel-heading')!.hidden = true;
  const searchLabel = $('search').closest('label');
  if (searchLabel?.firstChild)
    searchLabel.firstChild.textContent = 'Search record previews or file';
  document.title = DATA.threads[0].id.slice(0, 8) + ' · Codex trace';
  $('subtitle').hidden = true;
  const copy = node('button', DATA.threads[0].id.slice(0, 8), 'copy-id');
  copy.title = 'Copy session ID: ' + DATA.threads[0].id;
  copy.setAttribute('aria-label', 'Copy full session ID');
  const copied = node('span', undefined, 'copy-status');
  copied.setAttribute('role', 'status');
  copy.onclick = () => {
    void navigator.clipboard
      .writeText(DATA.threads[0].id)
      .then(() => {
        copied.textContent = 'Copied';
        window.setTimeout(() => {
          copied.textContent = '';
        }, 1600);
      })
      .catch(() => {
        copied.textContent = 'Copy unavailable';
      });
  };
  $('title').replaceChildren(copy, copied);
  $('title').setAttribute('aria-label', DATA.threads[0].id.slice(0, 8));
  document.querySelector<HTMLElement>('header .eyebrow')!.textContent = 'Codex session trace';
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-tab="process"],[data-tab="story"],[data-tab="compare"]',
  ))
    button.hidden = true;
  document.getElementById('timing-note')!.textContent =
    'JSONL event timestamps and physical source lines are retained. Across sessions, recorded clocks do not establish exact concurrent interleaving. Only locally indexed child sessions are included; missing descendants remain uncollected.';
  const manifest = document.getElementById('trace-manifest') as HTMLAnchorElement;
  manifest.href = '/trace-manifest?session=' + encodeURIComponent(DATA.threads[0].id);
  const back = node('a', '← Usage dashboard');
  back.href = '/';
  $('title').parentElement?.append(back);
  document.querySelector('footer')!.textContent =
    'Local read-only session trace. Commands are inert. No model requests or trace uploads.';
}
initEvidence();
restoreLocation();
window.addEventListener('hashchange', restoreLocation);
