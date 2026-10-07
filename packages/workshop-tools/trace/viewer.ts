import type { buildCase } from './build.ts';
import type { EvidenceRef, ResolvedRef, TraceEvent } from './contracts.ts';
type TraceData = Awaited<ReturnType<typeof buildCase>>;
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
  'actions-coverage': required('actions-coverage', HTMLElement),
  'episode-filter': required('episode-filter', HTMLSelectElement),
  'thread-filter': required('thread-filter', HTMLSelectElement),
  'role-filter': required('role-filter', HTMLSelectElement),
  'turn-filter': required('turn-filter', HTMLSelectElement),
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
const turns = DATA.threads
  .flatMap((t) => t.turns)
  .sort((a, b) => (a.startedAt ?? Number.NaN) - (b.startedAt ?? Number.NaN));
const events = turns.flatMap((t) => t.events);
const eventMap = new Map(events.map((e) => [e.key, e]));
const refKey = (r: EvidenceRef) => JSON.stringify([r.thread, r.turn, r.event]);
const artifactMap = new Map(DATA.artifacts.map((a) => [a.id, a]));
function artifactById(id: string): Artifact {
  const artifact = artifactMap.get(id);
  if (!artifact) throw new Error(`Missing artifact: ${id}`);
  return artifact;
}
let selectedEvent: string | null = null;
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
  if (!['story', 'compare', 'events', 'sources'].includes(name ?? '')) name = 'story';
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-tab]'))
    b.setAttribute('aria-pressed', String(b.dataset.tab === name));
  for (const id of ['story', 'compare', 'events', 'sources'] as const) $(id).hidden = id !== name;
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
function eventDetails(e: TraceEvent, open = false) {
  const d = node('details');
  d.open = open;
  d.append(node('summary', e.title));
  if (e.sourceTruncated)
    d.append(
      node('p', 'Source truncated upstream. Expanding cannot recover omitted text.', 'warning'),
    );
  if (e.displayTruncated)
    d.append(
      node('p', 'Viewer preview shortened; full normalized value available below.', 'small'),
    );
  d.append(node('pre', e.text));
  if (e.output !== undefined) {
    const output = node('details');
    output.append(node('summary', 'Recorded output'), node('pre', e.output));
    d.append(output);
  }
  if (e.relatedThreads.length) {
    d.append(node('h3', 'Related threads'));
    for (const id of e.relatedThreads) {
      const th = DATA.threads.find((t) => t.id === id),
        a = node('a', `${th?.role ?? 'Uncollected thread'} · ${id}`);
      a.href = `codex://threads/${encodeURIComponent(id)}`;
      d.append(a, node('br'));
    }
  }
  d.append(
    node(
      'p',
      `${e.threadId} / ${e.turnId} / ${e.id}\nSource type: ${e.sourceType} · ordinal ${e.ordinal}`,
      'provenance',
    ),
  );
  const link = node('a', 'Open source chat ↗');
  link.href = `codex://threads/${encodeURIComponent(e.threadId)}`;
  d.append(link);
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
  const e = eventMap.get(key);
  if (!e) return;
  selectedEvent = key;
  selectedAssessment = null;
  const box = drawer(`${e.kind} · ${e.role}`);
  box.append(node('p', `Episode: ${DATA.stages[stage].title}`, 'small'), eventDetails(e, true));
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
  renderEvents(key);
  renderActionContext();
  tab('events');
  const row = document.getElementById(`record-${encodeURIComponent(key)}`);
  row?.scrollIntoView({ block: 'center' });
}
function renderActionContext() {
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
function initEvidence() {
  option($('thread-filter'), 'all', 'All threads / actors');
  for (const t of DATA.threads) option($('thread-filter'), t.id, t.role);
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
  let total = 0,
    normalized = 0,
    unsupported = 0,
    excluded = 0,
    truncated = 0;
  for (const t of DATA.threads) {
    const c = t.coverage;
    total += c.totalItems;
    normalized += c.normalizedItems;
    unsupported += c.unsupportedItems.reduce((n, g) => n + g.count, 0);
    excluded += c.excludedItems.reduce((n, g) => n + g.count, 0);
    truncated += c.truncatedItems;
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
  const text = `${DATA.threads.length} actors · ${normalized}/${total} source items normalized · ${unsupported} unsupported · ${excluded} intentionally excluded · ${truncated} source-truncated`;
  $('coverage-summary').textContent = text;
  $('actions-coverage').textContent =
    text + ' · Coverage describes the collected exports, not all historical activity.';
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
option($('turn-filter'), 'all', 'All included turns / agents');
for (const t of turns) {
  const th = DATA.threads.find((x) => x.id === t.threadId);
  const date =
    t.startedAt === undefined
      ? 'Time unknown'
      : new Date(t.startedAt * 1000).toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Shanghai',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' CST';
  option(
    $('turn-filter'),
    JSON.stringify([t.threadId, t.id]),
    `${date} · ${th?.role ?? 'Uncollected thread'} · ${(t.events.find((e) => e.kind === 'request')?.text ?? t.events.find((e) => e.kind === 'message')?.text ?? 'Delegated implementation').slice(0, 65)}`,
  );
}
function renderEvents(focusId?: string | null) {
  const episodeRefs = new Map(DATA.stages[stage].evidence.map((r) => [r.key, r]));
  const q = $('search').value.toLowerCase();
  const filtered = events.filter(
    (e) =>
      ($('turn-filter').value === 'all' ||
        JSON.stringify([e.threadId, e.turnId]) === $('turn-filter').value) &&
      ($('thread-filter').value === 'all' || e.threadId === $('thread-filter').value) &&
      ($('episode-filter').value === 'all' || episodeRefs.has(e.key)) &&
      ($('role-filter').value === 'all' ||
        episodeRefs.get(e.key)?.roles.includes($('role-filter').value)) &&
      ($('kind').value === 'all' || e.kind === $('kind').value) &&
      `${e.title}\n${e.text}\n${e.output ?? ''}`.toLowerCase().includes(q),
  );
  if (focusId) {
    const idx = filtered.findIndex((e) => e.key === focusId);
    if (idx >= 0) page = Math.floor(idx / pageSize);
  }
  page = Math.max(0, Math.min(page, Math.ceil(filtered.length / pageSize) - 1));
  $('event-count').textContent =
    `${filtered.length} matching records · ${events.length} included records total`;
  $('event-list').replaceChildren();
  for (const e of filtered.slice(page * pageSize, (page + 1) * pageSize)) {
    const row = node('article', undefined, 'event');
    row.id = `record-${encodeURIComponent(e.key)}`;
    if (episodeRefs.has(e.key)) row.classList.add('episode-event');
    if (e.key === selectedEvent) row.classList.add('selected-event');
    const meta = node('div', undefined, 'event-meta');
    meta.append(
      node('span', e.kind, 'kind'),
      node('span', e.role),
      node('span', `Turn ${e.turnId.slice(0, 8)} · record ${e.ordinal}`),
    );
    if (episodeRefs.has(e.key))
      meta.append(node('span', 'Episode: ' + episodeRefs.get(e.key)?.roles.join(', ')));
    if (e.exitCode !== undefined && e.exitCode !== null)
      meta.append(node('span', `Exit ${e.exitCode} · ${e.durationMs ?? '?'} ms`));
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
for (const id of ['turn-filter', 'thread-filter', 'episode-filter', 'role-filter', 'kind'] as const)
  $(id).onchange = () => {
    page = 0;
    renderEvents();
  };
$('search').oninput = () => {
  page = 0;
  renderEvents();
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
    box.append(node('p', 'Delegated by the reviewer. Its turns overlap the review turn.'));
  $('threads').append(box);
}
$('outcome').textContent = DATA.outcome ?? 'Final user approval is not recorded.';
$('collection').textContent =
  `Collected ${DATA.collectedAt}\n${DATA.media.length} copied captures; input and asset SHA-256 hashes are in manifest.json.`;
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
  const requested = q.has('episode')
    ? DATA.stages.findIndex((s) => s.id === q.get('episode'))
    : Number(q.get('stage') ?? 0);
  closeDrawer();
  if (Number.isInteger(requested) && requested >= 0 && requested < DATA.stages.length)
    stage = requested;
  renderStory();
  compareOptions();
  resetEventFilters();
  selectedEvent = eventMap.has(q.get('event') ?? '') ? q.get('event') : null;
  renderEvents(selectedEvent);
  tab(q.get('view') ?? 'story');
  if (selectedEvent) {
    if (q.get('view') === 'events')
      document
        .getElementById(`record-${encodeURIComponent(selectedEvent)}`)
        ?.scrollIntoView({ block: 'center' });
    openEvent(selectedEvent);
  } else window.scrollTo({ top: 0 });
  const assessment = DATA.stages
    .flatMap((s) => s.assessments)
    .find((a) => a.id === q.get('assessment'));
  if (assessment) openAssessment(assessment);
}
initEvidence();
restoreLocation();
window.addEventListener('hashchange', restoreLocation);
