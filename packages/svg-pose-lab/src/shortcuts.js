// One list drives the command keys, control hints, and the reference page.
const catalog = {
  File: [
    { id: 'open', label: 'Open SVG', key: 'o' },
    { id: 'example', label: 'Open example', key: 'o', shift: true },
    { id: 'export', label: 'Export SVG', key: 's', mod: true, commitField: true },
  ],
  Tools: [
    { id: 'tool-transform', label: 'Transform', key: 'v' },
    { id: 'tool-path', label: 'Path', key: 'p' },
    { id: 'tool-pose', label: 'Pose (example)', key: 'j' },
    { id: 'reset-pose', label: 'Reset pose', key: 'r' },
    { id: 'toggle-guides', label: 'Toggle guides', key: 'h' },
    { id: 'show-source', label: 'Show or hide SVG source', key: 'i' },
  ],
  Selection: [
    { id: 'multi', label: 'Toggle multi-select', key: 'm' },
    { label: 'Add or remove an object', display: 'Shift+click' },
    { id: 'group', label: 'Group selection', key: 'g' },
    { id: 'ungroup', label: 'Ungroup selection', key: 'g', shift: true },
    { action: 'nudge', label: 'Move by 1 unit (10 with Shift)', display: 'Arrow keys' },
    { action: 'rotate', label: 'Rotate by 5°', display: '[ / ]' },
    { action: 'scale', label: 'Scale up or down', display: '+ / −' },
    { action: 'escape', label: 'Clear selection or cancel drag', key: 'Escape' },
  ],
  'History and navigation': [
    { id: 'undo', label: 'Undo', key: 'z', mod: true },
    { id: 'redo', label: 'Redo', key: 'z', mod: true, shift: true, alternate: 'y' },
    { id: 'open-shortcuts', label: 'Open shortcuts', key: '?' },
    { id: 'back-to-editor', label: 'Back to editor', key: 'Escape', page: true },
    { label: 'Move focus between controls', display: 'Tab / Shift+Tab' },
    { label: 'Activate a focused button', display: 'Enter / Space' },
  ],
};
const get = (id) => document.getElementById(id);
const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const keyName = (key) => (key === 'Escape' ? 'Esc' : key.toUpperCase());
const combination = (entry, prefix = '', key = keyName(entry.key)) =>
  prefix + (entry.shift ? 'Shift+' : '') + key;
function display(entry) {
  if (entry.display) return entry.display;
  const main = combination(entry, entry.mod ? '⌘/Ctrl+' : '');
  return entry.alternate ? main + ' / Ctrl+Y' : main;
}

export function installShortcuts({ canTransform, transform, cancelOrClear, isDragging }) {
  const editor = get('editor-view');
  const reference = get('shortcuts-view');
  const help = get('shortcut-title');
  const list = get('shortcut-list');
  const open = get('open-shortcuts');
  const entries = Object.values(catalog).flat();
  let previousFocus;
  let previousScroll = 0;

  for (const [category, commands] of Object.entries(catalog)) {
    const section = document.createElement('section');
    section.className = 'panel shortcut-section';
    const heading = document.createElement('h2');
    heading.textContent = category;
    const rows = document.createElement('dl');
    for (const entry of commands) {
      const keys = display(entry);
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      const key = document.createElement('kbd');
      term.textContent = entry.label;
      key.textContent = keys;
      detail.append(key);
      rows.append(term, detail);

      const control = get(entry.id);
      if (!control) continue;
      control.title = entry.label + ' (' + keys + ')';
      const prefix = entry.mod ? ['Meta+', 'Control+'] : [''];
      const aria = prefix.map((name) =>
        combination(entry, name, entry.key === 'Escape' ? 'Escape' : keyName(entry.key)),
      );
      if (entry.alternate) aria.push('Control+' + keyName(entry.alternate));
      control.setAttribute('aria-keyshortcuts', aria.join(' '));
    }
    section.append(heading, rows);
    list.append(section);
  }

  function updatePage() {
    const show = location.hash === '#shortcuts';
    if (show === !reference.hidden) return;
    if (show) {
      if (isDragging()) cancelOrClear();
      previousFocus = document.activeElement;
      previousScroll = window.scrollY;
    }
    editor.hidden = show;
    reference.hidden = !show;
    if (show) {
      help.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    } else {
      const target = previousFocus && editor.contains(previousFocus) ? previousFocus : open;
      target.focus({ preventScroll: true });
      window.scrollTo(0, previousScroll);
    }
  }

  function matches(entry, event, mod, onReference) {
    if (Boolean(entry.page) !== onReference || Boolean(entry.mod) !== mod) return false;
    if (entry.action === 'nudge') return canTransform() && Object.hasOwn(arrows, event.key);
    if (entry.action === 'rotate') return canTransform() && ['[', ']'].includes(event.key);
    if (entry.action === 'scale') return canTransform() && ['+', '=', '-'].includes(event.key);
    if (!entry.key) return false;
    const key = event.key.toLowerCase();
    if (entry.alternate && key === entry.alternate && event.ctrlKey && !event.shiftKey) return true;
    return (
      key === entry.key.toLowerCase() &&
      (entry.key === '?' || Boolean(entry.shift) === event.shiftKey)
    );
  }

  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.isComposing || event.altKey) return;
    const mod = event.metaKey || event.ctrlKey;
    const entry = entries.find((entry) => matches(entry, event, mod, !reference.hidden));
    if (!entry) return;
    const target = event.target;
    const typing = target.closest?.(
      'textarea, select, [contenteditable], input:not([type=checkbox], [type=radio], [type=range])',
    );
    const rangeKey = target.matches?.('input[type=range]') && Object.hasOwn(arrows, event.key);
    if ((typing || rangeKey) && !entry.commitField && !(entry.action === 'escape' && isDragging()))
      return;

    const control = get(entry.id);
    if (control?.disabled || control?.closest('[hidden]')) return;
    event.preventDefault();
    if (control) {
      if (entry.commitField && typing) target.blur();
      control.click();
    } else if (entry.action === 'escape') {
      cancelOrClear();
    } else if (entry.action === 'nudge') {
      const [x, y] = arrows[event.key];
      const step = event.shiftKey ? 10 : 1;
      transform('move', x * step, y * step);
    } else if (entry.action === 'rotate') {
      transform('rotate', event.key === '[' ? -5 : 5);
    } else if (entry.action === 'scale') {
      transform('scale', event.key === '-' ? 1 / 1.1 : 1.1);
    }
  });
  window.addEventListener('hashchange', updatePage);
  updatePage();
}
