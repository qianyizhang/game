const group = document.querySelector<HTMLSelectElement>('#group')!;
const search = document.querySelector<HTMLInputElement>('#search')!;
const count = document.querySelector<HTMLOutputElement>('#count')!;
const empty = document.querySelector<HTMLElement>('#empty')!;
const cards = [...document.querySelectorAll<HTMLAnchorElement>('.asset')];
function filter() {
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
group.addEventListener('change', filter);
search.addEventListener('input', filter);
filter();
export {};
