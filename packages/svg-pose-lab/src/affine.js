const editable = new Set([
  'g',
  'svg',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'use',
]);

export function canTransform(node, root) {
  return node !== root && editable.has(node.localName) && Boolean(node.transform);
}

const finite = (matrix) => components(matrix).every(Number.isFinite);
const components = ({ a, b, c, d, e, f }) => [a, b, c, d, e, f];
export const matrixAttribute = (matrix) => 'matrix(' + components(matrix).join(' ') + ')';
export const mapPoint = (matrix, x, y) => new DOMPoint(x, y).matrixTransform(matrix);

// Some browsers expose a legacy SVGMatrix. Convert it before combining it
// with DOMMatrix values so a document and its canvas guides share one type.
export function screenMatrix(node) {
  const matrix = node.getScreenCTM?.();
  return matrix ? new DOMMatrix(components(matrix)) : null;
}

export function relativeMatrix(node, reference) {
  const source = screenMatrix(node);
  const basis = screenMatrix(reference);
  if (!source || !basis) return null;
  const matrix = basis.inverse().multiply(source);
  return finite(matrix) ? matrix : null;
}

export function selectionBounds(nodes, root) {
  const corners = [];
  for (const node of nodes) {
    const matrix = relativeMatrix(node, root);
    if (!matrix) continue;
    const { x, y, width, height } = node.getBBox();
    if (!width && !height) continue;
    for (const [px, py] of [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ]) {
      corners.push(mapPoint(matrix, px, py));
    }
  }
  if (!corners.length) return null;
  const xs = corners.map(({ x }) => x);
  const ys = corners.map(({ y }) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  if (![left, top, right, bottom].every(Number.isFinite)) return null;
  return { left, top, right, bottom, x: (left + right) / 2, y: (top + bottom) / 2 };
}

export function around(x, y, matrix) {
  return new DOMMatrix().translate(x, y).multiply(matrix).translate(-x, -y);
}

// The sample's dedicated local rotation is a suffix so general transforms and Reset pose can coexist.
export function poseTransform(value, pivot) {
  const match =
    pivot &&
    new RegExp('(?:^|\\s)(rotate\\((-?\\d+) ' + pivot.x + ' ' + pivot.y + '\\))$').exec(
      value ?? '',
    );
  return match
    ? { base: value.slice(0, match.index).trim(), pose: match[1], angle: Number(match[2]) }
    : { base: value ?? '', pose: '', angle: 0 };
}

export function captureAffine(nodes, root, pivotFor) {
  const result = [];
  for (const node of nodes) {
    const parent = relativeMatrix(node.parentElement, root);
    if (!parent) return null;
    const inverse = parent.inverse();
    if (!finite(inverse)) return null;
    const before = node.getAttribute('transform');
    const { pose } = poseTransform(before, pivotFor(node));
    const list = node.transform.baseVal;
    let original = new DOMMatrix();
    for (let i = 0; i < list.numberOfItems - (pose ? 1 : 0); i++) {
      original = original.multiply(new DOMMatrix(components(list.getItem(i).matrix)));
    }
    result.push({ node, before, parent, inverse, original, pose });
  }
  return result;
}

export function affineChanges(captured, delta) {
  const changes = [];
  for (const { node, before, parent, inverse, original, pose } of captured) {
    const next = inverse.multiply(delta).multiply(parent).multiply(original);
    if (!finite(next)) return null;
    const after = delta.isIdentity
      ? before
      : [matrixAttribute(next), pose].filter(Boolean).join(' ');
    changes.push({ node, attribute: 'transform', before, after });
  }
  return changes;
}

export function groupingPlan(nodes, root) {
  if (nodes.length < 2) return { reason: 'Select two or more objects to group.' };
  const parent = nodes[0].parentElement;
  if (
    !['svg', 'g'].includes(parent.localName) ||
    !nodes.every((node) => node.parentElement === parent && canTransform(node, root))
  )
    return { reason: 'Grouping needs objects in the same layer group.' };
  const selected = new Set(nodes);
  const siblings = [...parent.children];
  const first = siblings.findIndex((node) => selected.has(node));
  if (!siblings.slice(first, first + nodes.length).every((node) => selected.has(node)))
    return { reason: 'Select adjacent objects in Layers to keep their paint order.' };
  const block = [];
  const last = siblings[first + nodes.length - 1];
  for (let node = siblings[first]; node; node = node.nextSibling) {
    block.push(node);
    if (node === last) break;
  }
  return { parent, block };
}

export function canUngroup(node, root) {
  return (
    node?.localName === 'g' &&
    node.children.length > 0 &&
    [...node.attributes].every(({ name }) => name === 'transform') &&
    [...node.children].every((child) => canTransform(child, root))
  );
}
