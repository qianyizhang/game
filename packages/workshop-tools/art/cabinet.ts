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
  const requested = location.hash.slice(1);
  const selected = panels.some((panel) => panel.id === requested) ? requested : 'current';
  for (const panel of panels) panel.hidden = panel.id !== selected;
  for (const view of views) {
    if (view.dataset.view === selected) view.setAttribute('aria-current', 'page');
    else view.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', showView);
showView();
export {};
