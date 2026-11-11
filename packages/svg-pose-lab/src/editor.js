import {
  affineChanges,
  around,
  canTransform,
  canUngroup,
  captureAffine,
  groupingPlan,
  mapPoint as position,
  matrixAttribute,
  poseTransform,
  relativeMatrix,
  selectionBounds,
  screenMatrix,
} from './affine.js';
import { movePoint, parsePath, pathPoints, serializePath } from './path-data.js';
import { readSvg, serializeElement, serializeSvg, svgNS } from './svg-document.js';
import { installShortcuts } from './shortcuts.js';

const get = (id) => document.getElementById(id);
const guides = get('guides');
const artHost = get('art-host');
const layers = get('layers');
const angle = get('angle');
const pointSelect = get('point');
const xInput = get('point-x');
const yInput = get('point-y');
const source = get('source');
const shadow = artHost.attachShadow({ mode: 'open' });
const shadowStyle = document.createElement('style');
shadowStyle.textContent =
  'div { all:initial; display:block; width:100%; height:100%; } div > svg { display:block; width:100%; height:100%; cursor:crosshair; }';
const artwork = document.createElement('div');
shadow.append(shadowStyle, artwork);

const samplePivots = {
  'attached-supported-glove': {
    label: 'Glove',
    name: 'Wrist',
    x: 548,
    y: 553,
    reach: 74,
    direction: 113,
    limit: 35,
  },
  'raised-supporting-knee': {
    label: 'Supporting knee',
    name: 'Knee',
    x: 656,
    y: 587,
    reach: 84,
    direction: 70,
    limit: 20,
  },
  'mask-and-cowl': {
    label: 'Mask and cowl',
    name: 'Neck',
    x: 413,
    y: 425,
    reach: 88,
    direction: -75,
    limit: 25,
  },
};
const sampleNames = {
  'quiet-background': 'Background',
  'quiet-stone-path': 'Stone path',
  'broad-low-stone': 'Seat stone',
  'body-supported-arm-and-knee': 'Cloak and body',
  'two-unbranched-horns': 'Horns',
  'static-bone-mask': 'Bone mask',
  'small-quiet-campfire': 'Campfire',
  'two-crossed-dark-logs': 'Crossed logs',
};
const resources = new Set([
  'defs',
  'title',
  'desc',
  'symbol',
  'clipPath',
  'mask',
  'marker',
  'pattern',
  'linearGradient',
  'radialGradient',
]);
const maxEditablePoints = 800;
const maxLayerDepth = 48;
let scene;
let selection;
let selected = new Set();
let tool = 'transform';
let multi = false;
let expanded = new WeakSet();
let selectedPoint;
let history = [];
let cursor = 0;
let initialReachable = true;
let sliderEdit;
let drag;
let loadVersion = 0;

function notice(text, error = false) {
  const message = get('notice');
  message.textContent = text;
  message.classList.toggle('error', error);
}

function changeAttribute(node, attribute, value) {
  if (value === null) node.removeAttribute(attribute);
  else node.setAttribute(attribute, value);
}

function recordAction(action) {
  history.splice(cursor, history.length - cursor, action);
  cursor++;
  if (history.length > 100) {
    history.shift();
    cursor--;
    initialReachable = false;
  }
  updateActions();
}

function applyAttributes(changes, undo = false) {
  for (const { node, attribute, before, after } of changes)
    changeAttribute(node, attribute, undo ? before : after);
}

function record(changes) {
  const edited = changes.filter(({ before, after }) => before !== after);
  if (edited.length) recordAction({ apply: (undo) => applyAttributes(edited, undo) });
}

function finishSlider() {
  if (!sliderEdit) return;
  const { node, before } = sliderEdit;
  sliderEdit = undefined;
  record([{ node, attribute: 'transform', before, after: node.getAttribute('transform') }]);
}

function stepHistory(direction) {
  if (drag) return;
  finishSlider();
  const index = direction < 0 ? cursor - 1 : cursor;
  if (!history[index]) return;
  const action = history[index];
  cursor += direction;
  if (action.before && tool !== 'transform') useTool('transform');
  action.apply(direction < 0);
  if (action.before) {
    rebuildLayers(direction < 0 ? action.before : action.after);
    restoreActionFocus();
  } else {
    refreshSelection();
  }
}

function isDirty() {
  return !initialReachable || cursor !== 0 || Boolean(drag || sliderEdit);
}

function updateActions() {
  get('undo').disabled = cursor === 0;
  get('redo').disabled = cursor === history.length;
  const reset = get('reset-pose');
  reset.disabled = !scene.pivots.some((pivot) => angleOf(pivot));
  reset.hidden = !scene.example || (tool !== 'pose' && reset.disabled);
  get('group').disabled = Boolean(drag || groupState().reason);
  get('ungroup').disabled = Boolean(
    drag || selected.size !== 1 || !canUngroup(selection?.node, scene.root),
  );
  get('document-meta').textContent =
    (scene.example ? 'Spire story reference · merged in #158' : 'Local SVG · ' + scene.file) +
    (isDirty() ? ' · Edited' : '');
}

function createSvg(name, attrs) {
  const element = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
}

function angleOf(pivot) {
  return poseTransform(pivot.node.getAttribute('transform'), pivot).angle;
}

function transformNodes() {
  return [...selected].filter((node) => {
    if (!canTransform(node, scene.root)) return false;
    for (
      let parent = node.parentElement;
      parent && parent !== scene.root;
      parent = parent.parentElement
    )
      if (selected.has(parent) && canTransform(parent, scene.root)) return false;
    return true;
  });
}

function groupState() {
  return groupingPlan([...selected], scene.root);
}

function frameCorners(frame) {
  const { left, top, right, bottom } = frame;
  return [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ];
}

function drawTransform(marks, width, height) {
  const nodes = transformNodes();
  const active = drag?.kind === 'affine' ? drag : null;
  const frame = active?.frame ?? selectionBounds(nodes, scene.root);
  const rootMatrix = relativeMatrix(scene.root, guides);
  if (!frame || !rootMatrix) return;
  const matrix = active?.delta ? rootMatrix.multiply(active.delta) : rootMatrix;
  const corners = frameCorners(frame).map(([x, y]) => position(matrix, x, y));
  const pointList = (points) => points.map(({ x, y }) => x + ',' + y).join(' ');
  if (nodes.length > 1 && !active) {
    for (const node of nodes) {
      const bounds = selectionBounds([node], scene.root);
      if (bounds)
        marks.push(
          createSvg('polygon', {
            points: pointList(frameCorners(bounds).map(([x, y]) => position(matrix, x, y))),
            class: 'bounds',
          }),
        );
    }
  }
  marks.push(createSvg('polygon', { points: pointList(corners), class: 'selection-frame' }));
  const center = position(matrix, frame.x, frame.y);
  const hit = (point, name, attrs = {}) =>
    createSvg('circle', {
      cx: point.x,
      cy: point.y,
      r: 12,
      class: 'hit',
      'data-affine': name,
      ...attrs,
    });
  const top = position(matrix, frame.x, frame.top);
  const bottom = position(matrix, frame.x, frame.bottom);
  const clamp = (v, max) => Math.max(13, Math.min(max - 13, v));
  const outward = (point, other) => {
    const length = Math.hypot(point.x - other.x, point.y - other.y);
    return {
      x: point.x + (length ? ((point.x - other.x) / length) * 26 : 0),
      y: point.y + (length ? ((point.y - other.y) / length) * 26 : -26),
    };
  };
  const fits = ({ x, y }) => x >= 13 && x <= width - 13 && y >= 13 && y <= height - 13;
  const above = outward(top, bottom);
  const below = outward(bottom, top);
  const edge = active?.rotateBelow ? bottom : active || fits(above) || !fits(below) ? top : bottom;
  const lever = edge === top ? above : below;
  const rotation = { x: clamp(lever.x, width), y: clamp(lever.y, height) };
  marks.push(
    createSvg('line', {
      x1: edge.x,
      y1: edge.y,
      x2: rotation.x,
      y2: rotation.y,
      class: 'transform-stem',
    }),
    createSvg('circle', { cx: rotation.x, cy: rotation.y, r: 6, class: 'transform-grip' }),
    createSvg('circle', { cx: center.x, cy: center.y, r: 7, class: 'transform-grip' }),
    createSvg('path', {
      d: 'M' + (center.x - 4) + ' ' + center.y + 'h8 M' + center.x + ' ' + (center.y - 4) + 'v8',
      class: 'transform-stem',
    }),
    hit(rotation, 'rotate', { 'data-rotate-below': String(edge === bottom) }),
    hit(center, 'move'),
  );
  if (frame.right > frame.left && frame.bottom > frame.top) {
    for (const [index, corner] of corners.entries()) {
      // Small objects keep a center grip; spread out overlapping corner grips.
      const length = Math.hypot(corner.x - center.x, corner.y - center.y);
      const spread = length ? Math.max(1, 22 / length) : 1;
      const point = {
        x: center.x + (corner.x - center.x) * spread,
        y: center.y + (corner.y - center.y) * spread,
      };
      marks.push(
        createSvg('rect', {
          x: point.x - 4,
          y: point.y - 4,
          width: 8,
          height: 8,
          class: 'transform-grip',
        }),
        hit(point, 'scale-' + ['nw', 'ne', 'se', 'sw'][index]),
      );
    }
  }
}

function drawPivot(pivot, matrix, marks) {
  const center = position(matrix, pivot.x, pivot.y);
  const active = selection?.node === pivot.node;
  const circle = (point, r, className, data = {}) =>
    createSvg('circle', { cx: point.x, cy: point.y, r, class: className, ...data });
  if (active) {
    const direction = (pivot.direction * Math.PI) / 180;
    const end = position(
      matrix,
      pivot.x + Math.cos(direction) * pivot.reach,
      pivot.y + Math.sin(direction) * pivot.reach,
    );
    marks.push(
      createSvg('line', { x1: center.x, y1: center.y, x2: end.x, y2: end.y, class: 'pivot-line' }),
      circle(end, 7, 'pivot-active'),
      circle(end, 13, 'hit', { 'data-rotate': pivot.node.id }),
    );
  }
  marks.push(
    circle(center, 5, active ? 'pivot-active' : 'pivot'),
    circle(center, 10, 'hit guide-pick', { 'data-pivot': pivot.node.id }),
  );
}

function drawGuides() {
  if (guides.hasAttribute('hidden')) return;
  const { width, height } = guides.getBoundingClientRect();
  if (width <= 0 || height <= 0) return;
  guides.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
  const marks = [];
  const matrix = selection && relativeMatrix(selection.node, guides);
  if (tool === 'transform') {
    drawTransform(marks, width, height);
  } else if (matrix && selection.segments) {
    const transform = matrixAttribute(matrix);
    marks.push(
      createSvg('path', { d: selection.node.getAttribute('d'), transform, class: 'path-outline' }),
    );
    const hits = [];
    // Render handles before anchors so overlapping curve handles never obscure a point.
    const points = pathPoints(selection.segments).sort(
      (a, b) => Number(a.kind === 'Point') - Number(b.kind === 'Point'),
    );
    for (const point of points) {
      const p = position(matrix, point.x, point.y);
      const active = point.id === selectedPoint;
      if (point.anchor) {
        const anchor = position(matrix, point.anchor.x, point.anchor.y);
        marks.push(
          createSvg('line', { x1: anchor.x, y1: anchor.y, x2: p.x, y2: p.y, class: 'handle-line' }),
        );
      }
      const mark = active ? 'active-point' : point.kind === 'Point' ? 'anchor' : 'control';
      marks.push(
        point.kind === 'Point'
          ? createSvg('rect', { x: p.x - 3.8, y: p.y - 3.8, width: 7.6, height: 7.6, class: mark })
          : createSvg('circle', { cx: p.x, cy: p.y, r: 4.5, class: mark }),
      );
      hits.push(
        createSvg('circle', { cx: p.x, cy: p.y, r: 8, class: 'hit', 'data-point': point.id }),
      );
    }
    marks.push(...hits);
  } else if (matrix && selection.node.getBBox && selection.node !== scene.root) {
    const { x, y, width, height } = selection.node.getBBox();
    const points = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ]
      .map(([x, y]) => position(matrix, x, y))
      .map((point) => point.x + ',' + point.y);
    if (width || height)
      marks.push(createSvg('polygon', { points: points.join(' '), class: 'bounds' }));
  }
  if (tool === 'pose') {
    for (const pivot of scene.pivots) {
      const pivotMatrix = relativeMatrix(pivot.node, guides);
      if (pivotMatrix) drawPivot(pivot, pivotMatrix, marks);
    }
  }
  guides.replaceChildren(...marks);
}

function updateValues() {
  if (tool === 'pose' && selection?.pivot) {
    const value = angleOf(selection.pivot);
    angle.value = value;
    get('angle-value').textContent = value + '°';
  }
  if (selection?.segments) {
    const point = pathPoints(selection.segments).find(({ id }) => id === selectedPoint);
    if (point) {
      pointSelect.value = selectedPoint;
      xInput.value = point.x;
      yInput.value = point.y;
    }
  }
  const details = source.closest('details');
  if (details.open)
    source.textContent =
      selected.size === 1
        ? serializeElement(selection.node)
        : 'Select one object to inspect its SVG.';
  drawGuides();
  updateActions();
}

function refreshSelection() {
  const { node, pivot } = selection ?? {};
  if (selection) selection.segments = null;
  let note = !node
    ? ''
    : node.id
      ? '<' + node.localName + ' id="' + node.id + '">'
      : '<' + node.localName + '>';
  let hint = 'Click artwork or a layer. Shift-click or use Multi-select to add objects.';
  if (tool === 'transform') {
    const nodes = transformNodes();
    if (nodes.length) {
      hint =
        'Drag the center to move, corners to scale, or the ring to rotate. Shift keeps scale proportional or snaps rotation to 15°.';
      note =
        selected.size > 1
          ? (groupState().reason ?? 'Group keeps these objects together.')
          : canUngroup(node, scene.root)
            ? 'Ungroup keeps the children in place.'
            : note;
    } else if (node) {
      note = 'This layer can be inspected but cannot be transformed.';
    }
  } else if (tool === 'pose' && pivot) {
    note = pivot.name + ' pivot · (' + pivot.x + ', ' + pivot.y + ')';
    angle.min = -pivot.limit;
    angle.max = pivot.limit;
    hint = 'Drag the outer pivot handle or use the Angle slider.';
  } else if (tool === 'path' && node?.localName === 'path') {
    try {
      const segments = parsePath(node.getAttribute('d') ?? '');
      const points = pathPoints(segments);
      if (points.length > maxEditablePoints)
        throw new Error('This path has too many points to edit.');
      if (!points.length) throw new Error('This path has no editable points.');
      selection.segments = segments;
      const counts = { Point: 0, Handle: 0 };
      const options = points.map(
        (point) => new Option(point.kind + ' ' + ++counts[point.kind], point.id),
      );
      pointSelect.replaceChildren(...options);
      if (!points.some(({ id }) => id === selectedPoint)) selectedPoint = points[0].id;
      note = 'Squares are points. Circles are curve handles.';
      hint = 'Drag a point or handle. Use the inspector for exact X and Y values.';
    } catch (error) {
      note = error.message;
    }
  }
  if (tool === 'path' && node?.localName !== 'path')
    hint = 'Choose one path on the canvas or in Layers.';
  if (tool === 'pose' && !pivot) hint = 'Select a marked wrist, knee, or neck pivot.';
  get('selected-name').textContent =
    selected.size > 1 ? selected.size + ' objects selected' : (selection?.label ?? 'No selection');
  get('selection-note').textContent = note;
  get('canvas-hint').textContent = hint;
  get('object-controls').hidden = tool !== 'transform';
  get('pose-controls').hidden = tool !== 'pose' || !pivot;
  get('path-controls').hidden = !selection?.segments;
  updateValues();
}

function setSelection(nodes, reveal = false) {
  finishSlider();
  for (const node of selected) scene.layers.get(node)?.button.setAttribute('aria-pressed', 'false');
  selected = new Set(nodes.filter((node) => scene.layers.has(node)));
  selection = scene.layers.get([...selected].at(-1));
  selectedPoint = undefined;
  for (const node of selected) scene.layers.get(node).button.setAttribute('aria-pressed', 'true');
  if (reveal && selection) {
    for (let parent = selection.parent; parent; parent = parent.parent) parent.disclose?.(true);
    const row = selection.button.getBoundingClientRect();
    const list = layers.getBoundingClientRect();
    if (row.top < list.top || row.bottom > list.bottom)
      layers.scrollTop += row.top < list.top ? row.top - list.top : row.bottom - list.bottom;
  }
  refreshSelection();
}

function select(layer, reveal = false, additive = false) {
  if (drag || !layer) return;
  if (tool !== 'transform' || !additive) {
    setSelection([layer.node], reveal);
  } else {
    setSelection(
      selected.has(layer.node)
        ? [...selected].filter((node) => node !== layer.node)
        : [...selected, layer.node],
      reveal,
    );
  }
}

function useTool(next) {
  if (drag || (next === 'pose' && !scene.example)) return;
  tool = next;
  for (const name of ['transform', 'path', 'pose'])
    get('tool-' + name).setAttribute('aria-pressed', String(tool === name));
  get('tool-pose').hidden = !scene.example;
  get('multi').hidden = tool !== 'transform';
  const prior = [...selected];
  const pivot = selection?.pivot ?? scene.pivots[0];
  const nodes = tool === 'pose' ? [pivot?.node] : tool === 'path' ? prior.slice(-1) : prior;
  setSelection(nodes, true);
}

function buildLayers() {
  function disclosureButton(label, nested, withLabel = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = withLabel ? 'disclosure paths-folder' : 'disclosure';
    button.setAttribute('aria-label', 'Expand or collapse ' + label);
    const disclose = (open) => {
      nested.hidden = !open;
      const mark = open ? '▾' : '▸';
      button.textContent = withLabel ? mark + '  ' + label : mark;
      button.setAttribute('aria-expanded', String(open));
    };
    button.addEventListener('click', () => disclose(nested.hidden));
    disclose(false);
    return { button, disclose };
  }

  function addChildren(nodes, parent, list, depth) {
    const counters = Object.create(null);
    const hasGroup = nodes.some((node) => node.localName === 'g');
    for (let index = 0; index < nodes.length;) {
      let end = index;
      while (hasGroup && nodes[end]?.localName === 'path' && !nodes[end].id) end++;
      if (end - index < 4) {
        add(nodes[index++], parent, list, counters, depth);
        continue;
      }
      const branch = document.createElement('li');
      const nested = document.createElement('ul');
      const { button, disclose } = disclosureButton('Paths (' + (end - index) + ')', nested, true);
      const folder = { parent, disclose };
      while (index < end) add(nodes[index++], folder, nested, counters, depth);
      branch.append(button, nested);
      list.append(branch);
    }
  }

  function add(node, parent, list, counters, depth) {
    const pivot =
      scene.example && Object.hasOwn(samplePivots, node.id)
        ? { ...samplePivots[node.id], node }
        : null;
    const tag = node.localName;
    counters[tag] = (counters[tag] ?? 0) + 1;
    const label =
      pivot?.label ??
      (scene.example && Object.hasOwn(sampleNames, node.id) ? sampleNames[node.id] : null) ??
      (node.id
        ? node.id
        : (tag === 'g' ? 'Group' : tag[0].toUpperCase() + tag.slice(1)) + ' ' + counters[tag]);
    const li = document.createElement('li');
    const line = document.createElement('div');
    line.className = 'layer-line';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'layer';
    button.setAttribute('aria-pressed', 'false');
    const mark = document.createElement('span');
    mark.setAttribute('aria-hidden', 'true');
    mark.className = 'mark';
    mark.textContent = pivot ? '◉' : tag === 'path' ? '·' : '◇';
    const text = document.createElement('span');
    text.className = 'label';
    text.textContent = label;
    const type = document.createElement('span');
    type.setAttribute('aria-hidden', 'true');
    type.className = 'type';
    type.textContent = tag;
    button.append(mark, text, type);
    const layer = { node, parent, button, label, pivot };
    if (pivot) scene.pivots.push(pivot);
    scene.layers.set(node, layer);
    button.addEventListener('click', (event) => select(layer, false, event.shiftKey || multi));

    const children = depth < maxLayerDepth && !resources.has(tag) ? [...node.children] : [];
    if (children.length) {
      const nested = document.createElement('ul');
      const disclosure = disclosureButton(label, nested);
      layer.disclose = (open) => {
        if (open) expanded.add(node);
        else expanded.delete(node);
        disclosure.disclose(open);
      };
      disclosure.button.addEventListener('click', () => {
        if (nested.hidden) expanded.delete(node);
        else expanded.add(node);
      });
      layer.disclose(expanded.has(node));
      addChildren(children, layer, nested, depth + 1);
      line.append(disclosure.button);
      li.append(line, nested);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'disclosure-space';
      line.append(spacer);
      li.append(line);
    }
    line.append(button);
    list.append(li);
  }
  scene.layers.clear();
  scene.pivots = [];
  layers.replaceChildren();
  const children = [...scene.root.children];
  addChildren(children.length ? children : [scene.root], null, layers, 1);
}

function rebuildLayers(nodes) {
  const previous = layers.scrollTop;
  buildLayers();
  layers.scrollTop = previous;
  const count = (tag, name) => {
    const n = scene.root.querySelectorAll(tag).length;
    return n + ' ' + name + (n === 1 ? '' : 's');
  };
  get('scene-count').textContent = count('g', 'group') + ' · ' + count('path', 'path');
  setSelection(nodes, true);
}

function restoreActionFocus() {
  if (document.activeElement === document.body || document.activeElement.disabled)
    selection?.button.focus({ preventScroll: true });
}

function runTreeEdit(before, after, apply) {
  apply(false);
  rebuildLayers(after);
  recordAction({ before, after, apply });
  restoreActionFocus();
}

function groupObjects() {
  if (drag || tool !== 'transform') return;
  const { parent, block, reason } = groupState();
  if (reason) return;
  const group = createSvg('g', {});
  runTreeEdit([...selected], [group], (undo) => {
    if (undo) {
      group.before(...block);
      group.remove();
    } else {
      parent.insertBefore(group, block[0]);
      group.append(...block);
    }
  });
}

function ungroupObjects() {
  const group = selection?.node;
  if (drag || tool !== 'transform' || selected.size !== 1 || !canUngroup(group, scene.root)) return;
  const children = [...group.children];
  const block = [...group.childNodes];
  const transform = group.getAttribute('transform');
  const changes = transform
    ? children.map((node) => {
        const before = node.getAttribute('transform');
        return {
          node,
          attribute: 'transform',
          before,
          after: [transform, before].filter(Boolean).join(' '),
        };
      })
    : [];
  runTreeEdit([group], children, (undo) => {
    applyAttributes(changes, undo);
    if (undo) {
      block[0].before(group);
      group.append(...block);
    } else {
      group.before(...block);
      group.remove();
    }
  });
}

function useSvg(document, file, example = false) {
  const { root, ratio, displayBox } = document;
  drag = undefined;
  sliderEdit = undefined;
  selection = undefined;
  selected = new Set();
  expanded = new WeakSet();
  multi = false;
  get('multi').setAttribute('aria-pressed', 'false');
  history = [];
  cursor = 0;
  initialReachable = true;
  scene = { root, displayBox, file, example, layers: new Map(), pivots: [] };
  if (displayBox) root.setAttribute('viewBox', displayBox);
  artHost.style.aspectRatio = ratio;
  artwork.replaceChildren(root);
  root.addEventListener('click', (event) => {
    let node = event.target;
    if (tool === 'pose') {
      while (node && node !== root && !scene.layers.get(node)?.pivot) node = node.parentElement;
    } else {
      while (node && node !== root && !scene.layers.has(node)) node = node.parentElement;
    }
    if (node !== root && scene.layers.has(node))
      select(scene.layers.get(node), true, event.shiftKey || multi);
    else if (tool === 'transform' && !event.shiftKey && !multi) setSelection([]);
  });
  get('document-title').textContent = example ? 'One Quiet Breath' : file.replace(/\.svg$/i, '');
  get('toggle-guides').checked = true;
  guides.removeAttribute('hidden');
  useTool('transform');
  rebuildLayers([]);
  const initial = example
    ? scene.pivots.find(({ node }) => node.id === 'attached-supported-glove')?.node
    : [...scene.layers.keys()].find((node) => node.localName === 'path');
  setSelection(
    [initial ?? [...scene.layers.keys()].find((node) => canTransform(node, root))].filter(Boolean),
    true,
  );
}

function rotate(pivot, value) {
  const degrees = Math.round(Math.max(-pivot.limit, Math.min(pivot.limit, value)));
  const { base } = poseTransform(pivot.node.getAttribute('transform'), pivot);
  const pose = degrees ? 'rotate(' + degrees + ' ' + pivot.x + ' ' + pivot.y + ')' : '';
  changeAttribute(pivot.node, 'transform', [base, pose].filter(Boolean).join(' ') || null);
}

function pointerPoint(event, node) {
  const matrix = screenMatrix(node)?.inverse();
  if (!matrix) return null;
  const point = position(matrix, event.clientX, event.clientY);
  return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
}

function captureTransform(nodes) {
  const captured = captureAffine(nodes, scene.root, (node) => scene.layers.get(node)?.pivot);
  if (!captured) notice('A selected object has a parent transform that cannot be inverted.', true);
  return captured;
}

function transformOnce(deltaFor) {
  if (drag || tool !== 'transform') return;
  const nodes = transformNodes();
  const frame = selectionBounds(nodes, scene.root);
  if (!frame) return;
  const captured = captureTransform(nodes);
  if (!captured) return;
  const changes = affineChanges(captured, deltaFor(frame));
  if (!changes) return;
  applyAttributes(changes);
  record(changes);
  updateValues();
}

function affineDrag(event, handle, rotateBelow) {
  const start = pointerPoint(event, scene.root);
  const nodes = transformNodes();
  const frame = selectionBounds(nodes, scene.root);
  if (!start || !frame) return;
  const captured = captureTransform(nodes);
  if (!captured) return;
  const { x, y, left, top, right, bottom } = frame;
  const side = handle.split('-')[1];
  const corner = side
    ? { x: side.includes('w') ? left : right, y: side.includes('n') ? top : bottom }
    : null;
  const anchor = side
    ? { x: side.includes('w') ? right : left, y: side.includes('n') ? bottom : top }
    : null;
  const bearing = Math.atan2(start.y - y, start.x - x);
  drag = {
    kind: 'affine',
    id: event.pointerId,
    start,
    frame,
    handle,
    corner,
    anchor,
    bearing,
    captured,
    rotateBelow,
    changes: [],
  };
}

function updateAffine(event) {
  const point = pointerPoint(event, scene.root);
  if (!point) return;
  const { handle, frame, start, anchor, corner, bearing } = drag;
  const dx = point.x - start.x;
  const dy = point.y - start.y;
  let delta;
  if (handle === 'move') {
    delta = new DOMMatrix().translate(dx, dy);
  } else if (handle === 'rotate') {
    if (Math.hypot(point.x - frame.x, point.y - frame.y) < 0.001) return;
    const degrees = ((Math.atan2(point.y - frame.y, point.x - frame.x) - bearing) * 180) / Math.PI;
    const snapped = event.shiftKey ? Math.round(degrees / 15) * 15 : degrees;
    delta = around(frame.x, frame.y, new DOMMatrix().rotate(snapped));
  } else {
    const w = corner.x - anchor.x;
    const h = corner.y - anchor.y;
    const clamp = (value) => Math.max(0.02, Math.min(100, value));
    const uniform = clamp(1 + (dx * w + dy * h) / (w * w + h * h));
    delta = around(
      anchor.x,
      anchor.y,
      new DOMMatrix().scale(
        event.shiftKey ? uniform : clamp(1 + dx / w),
        event.shiftKey ? uniform : clamp(1 + dy / h),
      ),
    );
  }
  const changes = affineChanges(drag.captured, delta);
  if (!changes) return;
  drag.delta = delta;
  drag.changes = changes;
  applyAttributes(changes);
}

guides.addEventListener('pointerdown', (event) => {
  if (drag || !event.isPrimary || event.button !== 0) return;
  const { point, rotate: pivotId, pivot: pick, affine, rotateBelow } = event.target.dataset;
  if (pick) {
    select(scene.layers.get(scene.pivots.find(({ node }) => node.id === pick).node), true);
    return;
  }
  if (!point && !pivotId && !affine) return;
  finishSlider();
  const node = selection?.node;
  if (affine) {
    affineDrag(event, affine, rotateBelow === 'true');
  } else if (point) {
    const start = pointerPoint(event, node);
    const target = pathPoints(selection.segments).find(({ id }) => id === point);
    if (!start || !target) return;
    selectedPoint = point;
    drag = {
      kind: 'path',
      id: event.pointerId,
      node,
      attribute: 'd',
      before: node.getAttribute('d'),
      start,
      target,
    };
  } else {
    const pivot = selection?.pivot;
    if (!pivot) return;
    const degrees = angleOf(pivot);
    const inverse = screenMatrix(node)
      ?.multiply(around(pivot.x, pivot.y, new DOMMatrix().rotate(-degrees)))
      .inverse();
    if (!inverse) return;
    const start = position(inverse, event.clientX, event.clientY);
    const previous = (Math.atan2(start.y - pivot.y, start.x - pivot.x) * 180) / Math.PI;
    drag = {
      kind: 'pose',
      id: event.pointerId,
      node,
      attribute: 'transform',
      before: node.getAttribute('transform'),
      pivot,
      inverse,
      previous,
      degrees,
    };
  }
  if (!drag) return;
  guides.setPointerCapture(event.pointerId);
  event.preventDefault();
  updateValues();
});

guides.addEventListener('pointermove', (event) => {
  if (drag?.id !== event.pointerId) return;
  if (drag.kind === 'affine') {
    updateAffine(event);
  } else if (drag.kind === 'pose') {
    const { pivot, inverse } = drag;
    const point = position(inverse, event.clientX, event.clientY);
    if (!Number.isFinite(point.x) || Math.hypot(point.x - pivot.x, point.y - pivot.y) < 4) return;
    const next = (Math.atan2(point.y - pivot.y, point.x - pivot.x) * 180) / Math.PI;
    drag.degrees = Math.max(
      -pivot.limit,
      Math.min(pivot.limit, drag.degrees + ((next - drag.previous + 540) % 360) - 180),
    );
    drag.previous = next;
    rotate(pivot, drag.degrees);
  } else {
    const { node, target, start } = drag;
    const point = pointerPoint(event, node);
    if (!point) return;
    const rounded = (value) => Math.round(value * 1000) / 1000;
    const x = rounded(target.x + point.x - start.x);
    const y = rounded(target.y + point.y - start.y);
    if (!movePoint(selection.segments, selectedPoint, x, y)) return;
    changeAttribute(
      node,
      'd',
      x === target.x && y === target.y ? drag.before : serializePath(selection.segments),
    );
  }
  updateValues();
});

function endDrag(id, cancel) {
  if (!drag || drag.id !== id) return;
  const { kind, changes, node, attribute, before } = drag;
  drag = undefined;
  if (kind === 'affine') {
    if (cancel) applyAttributes(changes, true);
    else record(changes);
  } else if (cancel) {
    changeAttribute(node, attribute, before);
  } else {
    record([{ node, attribute, before, after: node.getAttribute(attribute) }]);
  }
  refreshSelection();
}
guides.addEventListener('pointerup', (event) => endDrag(event.pointerId, false));
guides.addEventListener('pointercancel', (event) => endDrag(event.pointerId, true));
guides.addEventListener('lostpointercapture', (event) => endDrag(event.pointerId, true));

angle.addEventListener('input', () => {
  if (drag || tool !== 'pose' || !selection?.pivot) return;
  const node = selection.node;
  sliderEdit ??= { node, before: node.getAttribute('transform') };
  rotate(selection.pivot, Number(angle.value));
  updateValues();
});
angle.addEventListener('change', () => {
  finishSlider();
  updateActions();
});
pointSelect.addEventListener('change', () => {
  selectedPoint = pointSelect.value;
  updateValues();
});
for (const input of [xInput, yInput]) {
  input.addEventListener('change', () => {
    if (drag || !selection?.segments) return;
    const { node, segments } = selection;
    const before = node.getAttribute('d');
    const current = pathPoints(segments).find(({ id }) => id === selectedPoint);
    const x = xInput.valueAsNumber;
    const y = yInput.valueAsNumber;
    if (x === current.x && y === current.y) return;
    if (!movePoint(segments, selectedPoint, x, y)) {
      notice('Enter finite coordinates between −1,000,000,000 and 1,000,000,000.', true);
      updateValues();
      return;
    }
    const after = serializePath(segments);
    changeAttribute(node, 'd', after);
    record([{ node, attribute: 'd', before, after }]);
    notice('');
    updateValues();
  });
}
source.closest('details').addEventListener('toggle', updateValues);
get('toggle-guides').addEventListener('change', (event) => {
  guides.toggleAttribute('hidden', !event.target.checked);
  drawGuides();
});
get('undo').addEventListener('click', () => stepHistory(-1));
get('redo').addEventListener('click', () => stepHistory(1));
get('reset-pose').addEventListener('click', () => {
  if (drag) return;
  finishSlider();
  const changes = scene.pivots.map((pivot) => {
    const { node } = pivot;
    const before = node.getAttribute('transform');
    const { base, pose } = poseTransform(before, pivot);
    return { node, attribute: 'transform', before, after: pose ? base || null : before };
  });
  applyAttributes(changes);
  record(changes);
  refreshSelection();
});
for (const name of ['transform', 'path', 'pose'])
  get('tool-' + name).addEventListener('click', () => useTool(name));
get('multi').addEventListener('click', () => {
  multi = !multi;
  get('multi').setAttribute('aria-pressed', String(multi));
});
get('group').addEventListener('click', groupObjects);
get('ungroup').addEventListener('click', ungroupObjects);

new ResizeObserver(drawGuides).observe(artHost);

const example = JSON.parse(get('example-data').textContent);
const exampleName = 'one-quiet-breath.svg';
function replaceArtwork(loaded, file, example = false) {
  if (
    isDirty() &&
    !window.confirm('Replace this working copy? Export first to keep your current edits.')
  )
    return;
  useSvg(loaded, file, example);
  notice('');
}

window.addEventListener('beforeunload', (event) => {
  if (!isDirty()) return;
  event.preventDefault();
  event.returnValue = true;
});

get('open').addEventListener('click', () => get('file').click());
get('file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const version = ++loadVersion;
  try {
    if (file.size > 2_000_000) throw new Error('Choose an SVG smaller than 2 MB.');
    const text = await file.text();
    if (version === loadVersion) replaceArtwork(readSvg(text), file.name);
  } catch (error) {
    if (version === loadVersion) notice(error.message + ' The current artwork is unchanged.', true);
  }
});
get('example').addEventListener('click', () => {
  loadVersion++;
  replaceArtwork(readSvg(example), exampleName, true);
});
get('export').addEventListener('click', () => {
  if (drag) return;
  finishSlider();
  const url = URL.createObjectURL(
    new Blob([serializeSvg(scene.root, scene.displayBox)], { type: 'image/svg+xml;charset=utf-8' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = (scene.file.replace(/\.svg$/i, '') || 'artwork') + '-edited.svg';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
  notice('SVG copy sent to your browser for download.');
});

useSvg(readSvg(example), exampleName, true);
installShortcuts({
  canTransform: () => tool === 'transform' && !drag && transformNodes().length > 0,
  transform(kind, first, second) {
    if (kind === 'move') {
      transformOnce(() => new DOMMatrix().translate(first, second));
    } else {
      transformOnce(({ x, y }) =>
        around(
          x,
          y,
          kind === 'rotate' ? new DOMMatrix().rotate(first) : new DOMMatrix().scale(first),
        ),
      );
    }
  },
  cancelOrClear() {
    if (!drag) {
      setSelection([]);
      return;
    }
    const { id } = drag;
    endDrag(id, true);
    if (guides.hasPointerCapture(id)) guides.releasePointerCapture(id);
  },
  isDragging: () => Boolean(drag),
});
