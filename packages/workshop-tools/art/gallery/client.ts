const group = document.querySelector<HTMLSelectElement>('#group');
const search = document.querySelector<HTMLInputElement>('#search');
const count = document.querySelector<HTMLOutputElement>('#count');
const empty = document.querySelector<HTMLElement>('#empty');
const cards = [...document.querySelectorAll<HTMLAnchorElement>('.asset')];
function filter() {
  if (!group || !search || !count || !empty) return;
  let visible = 0;
  for (const card of cards) {
    card.hidden = !!(
      (group.value && group.value !== card.dataset.group) ||
      !card.dataset.name!.includes(search.value.trim().toLowerCase())
    );
    const container = card.closest<HTMLElement>('.asset-card');
    if (container) container.hidden = card.hidden;
    if (!card.hidden) visible++;
  }
  count.value = visible + ' illustrations';
  empty.hidden = visible !== 0;
}
group?.addEventListener('change', filter);
search?.addEventListener('input', filter);
filter();

const views = [...document.querySelectorAll<HTMLAnchorElement>('[data-view]')];
const panels = [...document.querySelectorAll<HTMLElement>('[data-panel]')];
function showView() {
  const fragment = location.hash.slice(1) || document.body.dataset.initialView;
  // Keep links to the former candidate view working.
  const requested = fragment === 'candidates' ? 'wip' : fragment;
  const selected = panels.some((panel) => panel.id === requested) ? requested : 'current';
  for (const panel of panels) panel.hidden = panel.id !== selected;
  for (const view of views) {
    if (view.dataset.view === selected) view.setAttribute('aria-current', 'page');
    else view.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', showView);
for (const view of views) {
  view.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    // A srcdoc preview inherits its host's base URL. Set our own fragment instead
    // of letting a relative anchor navigate this frame to the host document.
    event.preventDefault();
    location.hash = view.dataset.view!;
    showView();
  });
}
showView();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
for (const effect of document.querySelectorAll<HTMLElement>('.play-effect')) {
  const image = effect.querySelector<HTMLImageElement>('img')!;
  const play = effect.querySelector<HTMLButtonElement>('[data-play-effect]')!;
  const stop = effect.querySelector<HTMLButtonElement>('[data-stop-effect]')!;
  const status = effect.querySelector<HTMLElement>('[data-effect-status]')!;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function showStill() {
    clearTimeout(timer);
    image.src = effect.dataset.still!;
    stop.disabled = true;
    play.disabled = reducedMotion.matches;
    status.textContent = reducedMotion.matches
      ? 'Still frame · reduced motion is enabled.'
      : 'Still frame · play once to inspect the effect.';
  }
  play.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    clearTimeout(timer);
    image.src = effect.dataset.gif!;
    stop.disabled = false;
    play.textContent = 'Replay effect';
    status.textContent = 'Playing once · inspect the action and settled pose.';
    timer = setTimeout(showStill, Number(effect.dataset.duration));
  });
  stop.addEventListener('click', showStill);
  reducedMotion.addEventListener('change', showStill);
  showStill();
}
export {};
