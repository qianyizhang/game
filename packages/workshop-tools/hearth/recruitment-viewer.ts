import type { RecruitmentRuntime } from './recruitment-runtime.ts';
type InspectionData = ReturnType<RecruitmentRuntime['inspectRecruitment']> & {
  provenance: { replayDigest: string; receiptDigest: string; inspectorBundleDigest: string };
};
declare const data: InspectionData;
function required<T extends HTMLElement>(id: string, kind: { new (): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof kind)) throw new Error(`Missing inspector element: ${id}`);
  return element;
}
const elements = {
  case: required('case', HTMLElement),
  previous: required('previous', HTMLButtonElement),
  next: required('next', HTMLButtonElement),
  policy: required('policy', HTMLSelectElement),
  download: required('download', HTMLButtonElement),
  index: required('index', HTMLElement),
  timeline: required('timeline', HTMLInputElement),
  position: required('position', HTMLElement),
  context: required('context', HTMLElement),
  recorded: required('recorded', HTMLElement),
  proposed: required('proposed', HTMLElement),
  reason: required('reason', HTMLElement),
  legacy: required('legacy', HTMLElement),
  guards: required('guards', HTMLElement),
  replacement: required('replacement', HTMLElement),
  values: required('values', HTMLElement),
  provenance: required('provenance', HTMLElement),
};
const $ = <K extends keyof typeof elements>(id: K) => elements[id];
const show = (id: keyof typeof elements, value: unknown) => {
  $(id).textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};
for (const [id, entry] of Object.entries(data.labels)) {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = entry.label + ' · ' + id;
  $('policy').append(option);
}
$('policy').value = data.spec.policy;
show(
  'case',
  `${data.spec.hero} · seat ${data.spec.seat + 1} · ${data.spec.population} rivals · ${data.spec.visibility} labels · ${data.spec.policy} · placement ${data.placement ?? 'unfinished'}`,
);
show('provenance', { spec: data.spec, ...data.provenance });
let index = 0;
$('timeline').max = String(Math.max(0, data.steps.length - 1));
function render() {
  const row = data.steps[index];
  if (!row) {
    show('position', 'No focal decisions');
    return;
  }
  const proposal = row.proposals[$('policy').value],
    d = proposal.diagnostics,
    c = d.context;
  show('index', `${index + 1} / ${data.steps.length}`);
  show('position', `Step ${row.step} · round ${row.round}`);
  show(
    'context',
    `HP ${c.hp} · tier ${c.tier} · gold ${c.gold} · board ${c.boardSize}/7 · hand ${c.handSize} · upgrade ${c.upgradeCost} gold · reserve ${c.survivalReserve} HP`,
  );
  show('recorded', row.recorded);
  show('proposed', proposal.command);
  show('reason', proposal.reason);
  show('legacy', d.legacyDecision);
  show('replacement', d.replacement ?? 'No replacement available');
  $('guards').replaceChildren();
  for (const guard of d.interventions) {
    const title = document.createElement('p');
    title.textContent = `${guard.id}: ${guard.selected ? 'SELECTED' : guard.enabled ? 'enabled' : 'disabled'} · ${guard.eligible ? 'eligible' : 'blocked'}`;
    $('guards').append(title);
    for (const [name, pass] of Object.entries(guard.checks)) {
      const line = document.createElement('div');
      line.className = 'guard';
      const key = document.createElement('span');
      key.textContent = name;
      const result = document.createElement('strong');
      result.className = pass ? 'pass' : 'fail';
      result.textContent = pass ? 'PASS' : 'FAIL';
      line.append(key, result);
      $('guards').append(line);
    }
  }
  $('values').replaceChildren();
  for (const unit of d.unitValues) {
    const tr = document.createElement('tr');
    for (const value of [
      `${unit.definitionId} · ${unit.zone} (${unit.id})`,
      ...(
        [
          'attack',
          'health',
          'keywords',
          'deathrattle',
          'legacyContribution',
          'tempoTotal',
          'classicTotal',
        ] as const
      ).map((k) => Number(unit.value[k].toFixed(3))),
    ]) {
      const td = document.createElement('td');
      td.textContent = String(value);
      tr.append(td);
    }
    $('values').append(tr);
  }
  $('timeline').value = String(index);
  $('previous').disabled = index === 0;
  $('next').disabled = index === data.steps.length - 1;
  history.replaceState(null, '', `#step=${row.step}`);
}
function hash() {
  const match = /^#step=(\d+)$/.exec(location.hash);
  const found = match ? data.steps.findIndex((row) => row.step === Number(match[1])) : -1;
  index = found >= 0 ? found : 0;
  render();
}
$('previous').onclick = () => {
  index = Math.max(0, index - 1);
  render();
};
$('next').onclick = () => {
  index = Math.min(data.steps.length - 1, index + 1);
  render();
};
$('timeline').oninput = () => {
  index = Number($('timeline').value);
  render();
};
$('policy').onchange = render;
window.addEventListener('hashchange', hash);
$('download').onclick = () => {
  const row = data.steps[index];
  if (!row) return;
  const prefix = { ...data.replay, commands: data.replay.commands.slice(0, row.step + 1) };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(prefix, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.spec.id}-through-step-${row.step}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
hash();
