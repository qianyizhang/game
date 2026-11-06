import type { ArtRevision, ArtAttempt, HistoryState, HistoryDocument } from './history-types';

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = element('status');
const detail = element('detail');
const find = element<HTMLInputElement>('find');
const collection = element<HTMLSelectElement>('collection');
const dialog = element<HTMLDialogElement>('remove-dialog');
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
let state: HistoryState;
let busy = false;
let artwork = new AbortController();
let artworkRequests = new Map<string, Promise<string>>();
interface GifPlayback {
  controller: AbortController;
  reset: () => void;
  image?: HTMLImageElement;
  url?: string;
}
const gifPlaybacks = new Map<Element, GifPlayback>();
const attachmentReads = new Map<Element, AbortController>();
let removeId: string | undefined;
let removeKind: 'revision' | 'attempt' = 'revision';

async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(
    '/__art/' + path,
    body === undefined
      ? { signal }
      : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? 'The action failed. Reload before retrying.');
  return result;
}
function report(error: unknown) {
  status.textContent = error instanceof Error ? error.message : 'The action failed.';
}
async function act(action: () => Promise<unknown>, message: string) {
  if (busy) return;
  busy = true;
  stopPreviews();
  artwork.abort();
  for (const button of detail.querySelectorAll('button')) button.disabled = true;
  try {
    await action();
    state = await request<HistoryState>('api/state');
    render();
    status.textContent = message;
    status.focus();
  } catch (error) {
    report(error);
    renderDetail();
  } finally {
    busy = false;
  }
}
/** A view owns its requests; changing assets or reloading discards every old result. */
function readArtwork(kind: 'asset' | 'revision', id: string, signal: AbortSignal): Promise<string> {
  if (!state.live) return Promise.resolve((kind === 'asset' ? state.current : state.previews)[id]);
  return request<HistoryDocument>(
    `api/artwork?${kind}=${encodeURIComponent(id)}&version=${encodeURIComponent(state.version)}`,
    undefined,
    signal,
  ).then((document) => {
    if (document.kind !== 'image') throw new Error('Artwork preview is unavailable.');
    return document.url;
  });
}
function artworkUrl(kind: 'asset' | 'revision', id: string): Promise<string> {
  const key = kind + ':' + id;
  let pending = artworkRequests.get(key);
  if (!pending) {
    pending = readArtwork(kind, id, artwork.signal);
    artworkRequests.set(key, pending);
  }
  return pending;
}

function stopGif(container: Element) {
  const playback = gifPlaybacks.get(container);
  if (!playback) return;
  gifPlaybacks.delete(container);
  playback.controller.abort();
  playback.image?.removeAttribute('src');
  playback.image?.remove();
  if (playback.url) URL.revokeObjectURL(playback.url);
  playback.reset();
}
function stopPreviews() {
  for (const container of [...gifPlaybacks.keys()]) stopGif(container);
  for (const controller of attachmentReads.values()) controller.abort();
  attachmentReads.clear();
}

/** Fresh native image identity restarts one-shot GIFs; original download bytes stay untouched. */
function playGif(
  container: Element,
  load: (signal: AbortSignal) => Promise<string>,
  alt: string,
  reset: () => void,
  stopLabel = 'Stop GIF',
) {
  stopGif(container);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    status.textContent = 'GIF playback is disabled by reduced motion.';
    reset();
    return;
  }
  const playback: GifPlayback = { controller: new AbortController(), reset };
  gifPlaybacks.set(container, playback);
  const stop = document.createElement('button');
  stop.textContent = stopLabel;
  stop.addEventListener('click', () => stopGif(container));
  container.replaceChildren(document.createTextNode('Loading GIF…'), stop);
  void (async () => {
    const source = await load(playback.controller.signal);
    const response = await fetch(source, { signal: playback.controller.signal });
    if (!response.ok) throw new Error('GIF preview is unavailable.');
    const blob = await response.blob();
    if (playback.controller.signal.aborted || gifPlaybacks.get(container) !== playback) return;
    if (!container.isConnected || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stopGif(container);
      return;
    }
    playback.url = URL.createObjectURL(blob);
    playback.image = document.createElement('img');
    playback.image.src = playback.url;
    playback.image.alt = alt;
    container.replaceChildren(playback.image, stop);
  })().catch((error: unknown) => {
    if (playback.controller.signal.aborted || gifPlaybacks.get(container) !== playback) return;
    stopGif(container);
    report(error);
  });
}

function showArtwork(
  container: Element,
  kind: 'asset' | 'revision',
  id: string,
  show: (url: string) => void,
) {
  const signal = artwork.signal;
  void artworkUrl(kind, id)
    .then((url) => {
      if (!signal.aborted && container.isConnected) show(url);
    })
    .catch((error: unknown) => {
      if (!signal.aborted && container.isConnected)
        container.textContent =
          error instanceof Error ? error.message : 'Artwork preview is unavailable.';
    });
}
function revisionFigures(revision: ArtRevision, url: string) {
  const asset = state.history.assets.find((asset) => asset.id === revision.asset);
  return `<figure><img src="${escape(url)}" alt="${escape(revision.label)}" width="${Math.min(asset?.width ?? 320, 480)}" ${asset ? `height="${(Math.min(asset.width, 480) * asset.height) / asset.width}"` : ''}><figcaption>${asset ? 'Slot size' : 'Source preview'}</figcaption></figure><figure><img src="${escape(url)}" alt="" width="80"${asset ? ` height="${(80 * asset.height) / asset.width}"` : ''}><figcaption>Compact</figcaption></figure>`;
}
function attemptDetails(attempt: ArtAttempt, standalone = false) {
  return `<details><summary>${standalone ? `${escape(attempt.title)} · ${escape(attempt.outcome)}` : 'Prompt, settings and outcome'}</summary><p>${escape(attempt.title)} · ${escape(attempt.date)} · ${escape(attempt.outcome)}</p><p>${escape(attempt.notes)}</p>${attempt.files.map((file) => `<p><button data-file="${escape(file)}">${escape(file.split('/').at(-1)!)}</button></p>`).join('')}<pre hidden></pre>${state.live ? `<button data-remove-attempt="${escape(attempt.id)}">Remove attempt</button>` : ''}</details>`;
}
function revisionCard(revision: ArtRevision) {
  const asset = state.history.assets.find((asset) => asset.id === revision.asset);
  const selected = asset && state.selections[asset.id]?.revision === revision.id;
  const attempt = state.history.attempts.find((attempt) => attempt.id === revision.attempt)!;
  const animated = revision.file.toLowerCase().endsWith('.gif');
  return `<article class="revision" data-revision="${escape(revision.id)}"><div class="revision-head"><h3>${escape(revision.label)}</h3>${selected ? '<span class="badge">In game · canonical</span>' : ''}${!revision.runtimeFile ? '<span class="badge">Source study</span>' : ''}</div><p>${escape(revision.notes)}</p><div class="revision-preview">${animated ? '<button data-play>Play GIF</button>' : '<p>Loading artwork…</p>'}</div><p class="source-note">${escape(revision.id)}</p><div class="actions"><button data-use${!state.live || !revision.runtimeFile || !asset || selected ? ' disabled' : ''}>${selected ? 'Used in game' : 'Use in game'}</button><button data-enlarge>${animated ? 'Download GIF' : 'Inspect source'}</button><button data-remove${!state.live || selected ? ' disabled' : ''}>Remove</button></div>${!state.live ? '<p>Offline snapshot · open the local gallery to change selections or remove records.</p>' : !revision.runtimeFile ? '<p>No game-compatible adaptation is registered for this source.</p>' : ''}${attemptDetails(attempt)}<details><summary>Lineage and files</summary><p>${escape(revision.file)}</p><p>${revision.parents.length ? 'Parents: ' + revision.parents.map(escape).join(', ') : 'Earlier parentage is unknown or this is a source checkpoint.'}</p></details></article>`;
}
function renderDetail() {
  stopPreviews();
  artwork.abort();
  artwork = new AbortController();
  artworkRequests = new Map();
  const id = new URLSearchParams(location.hash.slice(1)).get('asset');
  const asset = state.history.assets.find((asset) => asset.id === id);
  const unassigned = id === '__unassigned';
  const canonical = state.history.revisions.find(
    (revision) => revision.id === state.selections[id ?? '']?.revision,
  );
  if (!asset && !unassigned) {
    detail.innerHTML =
      '<h2>Choose an asset</h2><p>Open its revisions to compare art, reuse settings, or change the game’s default.</p>';
    return;
  }
  detail.innerHTML = `<h2>${escape(asset?.name ?? 'Unassigned source artwork')}</h2><p>${escape(asset?.id ?? 'Retained drawings without a known game slot')}</p>${asset && !state.selections[asset.id] ? '<p>In game: editable source. Its live renderer is shown below; save a checkpoint before editing.</p>' : ''}${asset && state.selections[asset.id] ? '<button id="use-source">Use editable source</button>' : ''}${asset && state.live ? '<button id="snapshot">Save source revision</button>' : ''}${canonical ? revisionCard(canonical) : ''}${asset ? `<article class="revision live-source"><h3>Editable source</h3><p>Source reference: ${escape(asset.sourceRevision ?? 'unknown')}</p><div class="revision-preview" data-source-preview><p>Loading artwork…</p></div><p>Live renderer preview. Freeze only for an explicit checkpoint or a real iteration.</p></article>` : ''}${
    state.history.revisions
      .filter(
        (revision) => revision.asset === (unassigned ? null : id) && revision.id !== canonical?.id,
      )
      .toSorted((left, right) => {
        const rank = (revision: ArtRevision) =>
          state.selections[revision.asset ?? '']?.revision === revision.id
            ? 0
            : revision.attempt.startsWith('source-')
              ? 1
              : 2;
        return rank(left) - rank(right);
      })
      .map(revisionCard)
      .join('') || '<p>No retained revisions.</p>'
  }`;
  if (asset) {
    const preview = detail.querySelector('[data-source-preview]')!;
    showArtwork(preview, 'asset', asset.id, (url) => {
      preview.innerHTML = `<img src="${escape(url)}" alt="${escape(asset.name)} · editable source" width="${Math.min(asset.width, 480)}" height="${(Math.min(asset.width, 480) * asset.height) / asset.width}">`;
    });
  }
  if (!state.live && element<HTMLButtonElement>('use-source'))
    element<HTMLButtonElement>('use-source').disabled = true;
  element('snapshot')?.addEventListener('click', () => {
    void act(
      () => request('api/snapshot', { version: state.version, asset: id }),
      'Source checkpoint saved, or unchanged since its last checkpoint. No generation was run.',
    );
  });
  element('use-source')?.addEventListener('click', () => {
    if (state.live)
      void act(
        () => request('api/use', { version: state.version, asset: id, revision: null }),
        'The game now uses its editable source. Refresh the game to see it.',
      );
  });
  for (const article of detail.querySelectorAll<HTMLElement>('[data-revision]')) {
    const revision = state.history.revisions.find((item) => item.id === article.dataset.revision)!;
    const preview = article.querySelector('.revision-preview')!;
    if (!revision.file.toLowerCase().endsWith('.gif'))
      showArtwork(preview, 'revision', revision.id, (url) => {
        preview.innerHTML = revisionFigures(revision, url);
      });
    article.querySelector('[data-use]')!.addEventListener('click', () => {
      void act(
        () =>
          request('api/use', {
            version: state.version,
            asset: revision.asset,
            revision: revision.id,
          }),
        'Saved as the game’s default. Refresh the game to see it.',
      );
    });
    article.querySelector('[data-remove]')!.addEventListener('click', () => {
      void previewRemoval(revision.id).catch(report);
    });
    article.querySelector('[data-enlarge]')!.addEventListener('click', () => {
      showArtwork(preview, 'revision', revision.id, (url) => {
        if (revision.file.toLowerCase().endsWith('.gif')) {
          const download = document.createElement('a');
          download.href = url;
          download.download = revision.file.split('/').at(-1)!;
          download.click();
          return;
        }
        const image = document.createElement('img');
        image.src = url;
        image.alt = revision.label;
        image.style.width = '100%';
        preview.replaceChildren(image);
      });
    });
    const play = article.querySelector<HTMLButtonElement>('[data-play]');
    play?.addEventListener('click', () => {
      playGif(
        preview,
        (signal) => readArtwork('revision', revision.id, signal),
        revision.label,
        () => preview.replaceChildren(play),
      );
    });
  }
  bindFiles(detail);
}
function bindFiles(parent: HTMLElement) {
  for (const button of parent.querySelectorAll<HTMLButtonElement>('[data-remove-attempt]'))
    button.addEventListener('click', () => {
      void previewRemoval(button.dataset.removeAttempt!, 'attempt').catch(report);
    });
  for (const button of parent.querySelectorAll<HTMLButtonElement>('[data-file]')) {
    button.disabled = !state.live && !state.documents?.[button.dataset.file!];
    button.addEventListener('click', () => {
      const file = button.dataset.file!;
      const owner = button.closest('details')!;
      attachmentReads.get(owner)?.abort();
      attachmentReads.delete(owner);
      for (const preview of owner.querySelectorAll('[data-file-preview]')) {
        stopGif(preview);
        preview.remove();
      }
      if (file.toLowerCase().endsWith('.gif')) {
        const container = button.closest('details')!;
        const pre = container.querySelector('pre')!;
        pre.hidden = true;
        const copy = container.querySelector<HTMLButtonElement>('[data-copy]');
        if (copy) copy.hidden = true;
        const preview = document.createElement('div');
        preview.dataset.filePreview = '';
        preview.className = 'attachment-preview';
        pre.after(preview);
        playGif(
          preview,
          async (signal) => {
            const fileDocument =
              state.documents?.[file] ??
              (await request<HistoryDocument>(
                'api/file?file=' + encodeURIComponent(file),
                undefined,
                signal,
              ));
            if (fileDocument.kind !== 'image' || !fileDocument.animated)
              throw new Error('GIF attachment is unavailable.');
            return fileDocument.url;
          },
          file.split('/').at(-1)!,
          () => preview.remove(),
          'Close attachment',
        );
        return;
      }
      const controller = new AbortController();
      const signal = controller.signal;
      attachmentReads.set(owner, controller);
      void (async () => {
        const fileDocument =
          state.documents?.[button.dataset.file!] ??
          (await request<HistoryDocument>(
            'api/file?file=' + encodeURIComponent(button.dataset.file!),
            undefined,
            signal,
          ));
        if (signal.aborted || !button.isConnected) return;
        const container = button.closest('details')!;
        const pre = container.querySelector('pre')!;
        let copy = container.querySelector<HTMLButtonElement>('[data-copy]');
        if (fileDocument.kind === 'image') {
          pre.hidden = true;
          if (copy) copy.hidden = true;
          const preview = window.document.createElement('div');
          preview.dataset.filePreview = '';
          preview.className = 'attachment-preview';
          if (fileDocument.animated) {
            pre.after(preview);
            playGif(
              preview,
              () => Promise.resolve(fileDocument.url),
              file.split('/').at(-1)!,
              () => preview.remove(),
              'Close attachment',
            );
            return;
          }
          const image = window.document.createElement('img');
          image.src = fileDocument.url;
          image.alt = file.split('/').at(-1)!;
          preview.append(image);
          const close = window.document.createElement('button');
          close.textContent = 'Close attachment';
          close.addEventListener('click', () => preview.remove());
          preview.append(close);
          pre.after(preview);
          return;
        }
        pre.textContent = fileDocument.text;
        pre.hidden = false;
        if (copy) copy.hidden = false;
        if (!copy) {
          copy = document.createElement('button');
          copy.dataset.copy = '';
          copy.textContent = 'Copy displayed settings';
          pre.after(copy);
          copy.addEventListener('click', () => {
            void navigator.clipboard
              .writeText(pre.textContent ?? '')
              .then(() => {
                status.textContent = 'Copied. No generation request was sent.';
              })
              .catch(() => {
                status.textContent = 'Clipboard unavailable. Select and copy the displayed text.';
              });
          });
        }
      })()
        .catch((error: unknown) => {
          if (!signal.aborted) report(error);
        })
        .finally(() => {
          if (attachmentReads.get(owner) === controller) attachmentReads.delete(owner);
        });
    });
  }
}
async function previewRemoval(id: string, kind: 'revision' | 'attempt' = 'revision') {
  const plan = await request<{
    version: string;
    usedBy: string[];
    remove: string[];
    retained: string[];
    descendants: string[];
  }>('api/removal?revision=' + encodeURIComponent(id) + '&kind=' + kind);
  if (plan.version !== state.version)
    throw new Error('History changed. Reload before removing a revision.');
  removeId = id;
  removeKind = kind;
  element('remove-plan').innerHTML =
    `<p>${escape(id)}</p><p>${plan.usedBy.length ? 'Blocked: still referenced by ' + plan.usedBy.map(escape).join(', ') : 'Remove this revision from the gallery.'}</p><p>Owned files to delete:</p><ul>${plan.remove.map((file) => `<li>${escape(file)}</li>`).join('') || '<li>None</li>'}</ul><p>Shared or historical files retained:</p><ul>${plan.retained.map((file) => `<li>${escape(file)}</li>`).join('') || '<li>None</li>'}</ul><p>${plan.descendants.length ? 'Surviving derivatives keep a short parent note.' : 'No registered derivative refers to this revision.'} Git history is unchanged.</p>`;
  element<HTMLButtonElement>('confirm-remove').disabled = plan.usedBy.length > 0;
  dialog.showModal();
}
function renderList() {
  const query = find.value.toLowerCase();
  const assets = state.history.assets.filter(
    (asset) =>
      (!collection.value || asset.group === collection.value) &&
      `${asset.name} ${asset.id}`.toLowerCase().includes(query),
  );
  element('assets').innerHTML =
    assets
      .map(
        (asset) =>
          `<a href="#asset=${encodeURIComponent(asset.id)}"${new URLSearchParams(location.hash.slice(1)).get('asset') === asset.id ? ' aria-current="page"' : ''}>${escape(asset.name)}</a>`,
      )
      .join('') + '<a href="#asset=__unassigned">Unassigned source artwork</a>';
  element('asset-count').textContent = `${assets.length} assets`;
}
function render() {
  const previous = collection.value;
  collection.innerHTML =
    '<option value="">All collections</option>' +
    [...new Set(state.history.assets.map((asset) => asset.group))]
      .sort()
      .map((group) => `<option>${escape(group)}</option>`)
      .join('');
  collection.value = previous;
  element('mode').textContent = state.live
    ? 'All SVG assets · selections are saved for the game · no generation runs here.'
    : 'Offline snapshot · browse preserved iterations. Open /__art/ on the local dev server to change the game.';
  renderList();
  renderDetail();
  if (matchMedia('(max-width: 720px)').matches && location.hash)
    element<HTMLDetailsElement>('browse').open = false;
  const failed = state.history.attempts;
  element('failures').innerHTML = failed.map((attempt) => attemptDetails(attempt, true)).join('');
  bindFiles(element('failures'));
}
element('reload').addEventListener('click', () => {
  stopPreviews();
  if (state.live) void act(() => Promise.resolve(), 'History reloaded.');
  else status.textContent = 'This is an offline snapshot; rebuild the export to refresh it.';
});
find.addEventListener('input', renderList);
collection.addEventListener('change', renderList);
matchMedia('(max-width: 720px)').addEventListener('change', (event) => {
  if (event.matches && location.hash) element<HTMLDetailsElement>('browse').open = false;
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', renderDetail);
document.addEventListener(
  'toggle',
  (event) => {
    const disclosure = event.target;
    if (disclosure instanceof HTMLDetailsElement && !disclosure.open) {
      for (const container of [...gifPlaybacks.keys()])
        if (disclosure.contains(container)) stopGif(container);
      for (const [container, controller] of attachmentReads)
        if (disclosure.contains(container)) {
          controller.abort();
          attachmentReads.delete(container);
        }
    }
  },
  true,
);
window.addEventListener('pagehide', stopPreviews);
window.addEventListener('hashchange', () => {
  renderList();
  renderDetail();
  if (matchMedia('(max-width: 720px)').matches && location.hash)
    element<HTMLDetailsElement>('browse').open = false;
});
element('cancel-remove').addEventListener('click', () => dialog.close());
element('confirm-remove').addEventListener('click', () => {
  const id = removeId;
  dialog.close();
  if (id)
    void act(
      () => request('api/remove', { version: state.version, revision: id, kind: removeKind }),
      'Revision removed. Shared files and surviving artwork were preserved.',
    );
});
void (async () => {
  const initial = JSON.parse(element('history-state').textContent ?? 'null') as HistoryState | null;
  state = initial ?? (await request<HistoryState>('api/state'));
  render();
})().catch(report);
