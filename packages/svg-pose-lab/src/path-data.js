// Normalize drawing commands only when the user edits a point. Untouched paths keep their d strings.
const sizes = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
const number = /[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/y;
const command = /[MLHVCSQTAZmlhvcsqtaz]/;
const gap = /[\x20\t\r\n\f]*/y;
const maxSegments = 2_000;

export function parsePath(input) {
  const segments = [];
  let i = 0;
  let active;
  let x = 0;
  let y = 0;
  let start = [0, 0];
  const invalid = () => new Error('This path has malformed or unsupported coordinates.');
  function skipSpace() {
    gap.lastIndex = i;
    i += gap.exec(input)[0].length;
  }
  function readValue(flag, allowComma) {
    skipSpace();
    if (allowComma && input[i] === ',') {
      i++;
      skipSpace();
    }
    if (flag) {
      if (input[i] !== '0' && input[i] !== '1') throw invalid();
      return Number(input[i++]);
    }
    number.lastIndex = i;
    const match = number.exec(input);
    if (!match || !Number.isFinite(Number(match[0]))) throw invalid();
    i = number.lastIndex;
    return Number(match[0]);
  }
  skipSpace();
  while (i < input.length) {
    if (segments.length >= maxSegments) throw new Error('This path has too many segments to edit.');
    const explicit = command.test(input[i]);
    if (explicit) active = input[i++];
    if (!active) throw invalid();
    const type = active.toUpperCase();
    if (!segments.length && type !== 'M') throw invalid();
    const relative = active !== type;
    const values = [];
    for (let j = 0; j < sizes[type]; j++)
      values.push(readValue(type === 'A' && (j === 3 || j === 4), !explicit || j > 0));

    const pair = (j) => [values[j] + (relative ? x : 0), values[j + 1] + (relative ? y : 0)];
    const previous = segments.at(-1);
    const reflected = (kind, index) =>
      previous?.type === kind
        ? [2 * x - previous.values[index], 2 * y - previous.values[index + 1]]
        : [x, y];

    let segment = { type, values };
    switch (type) {
      case 'M':
        start = pair(0);
        segment.values = start;
        active = relative ? 'l' : 'L';
        break;
      case 'L':
        segment.values = pair(0);
        break;
      case 'H':
        segment = { type: 'L', values: [values[0] + (relative ? x : 0), y] };
        break;
      case 'V':
        segment = { type: 'L', values: [x, values[0] + (relative ? y : 0)] };
        break;
      case 'C':
        segment.values = [...pair(0), ...pair(2), ...pair(4)];
        break;
      case 'S':
        segment = { type: 'C', values: [...reflected('C', 2), ...pair(0), ...pair(2)] };
        break;
      case 'Q':
        segment.values = [...pair(0), ...pair(2)];
        break;
      case 'T':
        segment = { type: 'Q', values: [...reflected('Q', 0), ...pair(0)] };
        break;
      case 'A':
        segment.values = [...values.slice(0, 5), ...pair(5)];
        break;
      case 'Z':
        active = undefined;
        break;
    }
    if (!segment.values.every(Number.isFinite)) throw invalid();
    [x, y] = segment.type === 'Z' ? start : segment.values.slice(-2);
    segments.push(segment);
    skipSpace();
  }
  return segments;
}

export function serializePath(segments) {
  return segments
    .map(({ type, values }) => type + (values.length ? values.join(' ') : ''))
    .join(' ');
}

export function pathPoints(segments) {
  const points = [];
  let previous;
  let start;
  for (const [index, segment] of segments.entries()) {
    if (segment.type === 'Z') {
      previous = start;
      continue;
    }
    const { values } = segment;
    const make = (offset, kind, anchor) => ({
      id: index + ':' + offset,
      segment: index,
      offset,
      kind,
      x: values[offset],
      y: values[offset + 1],
      anchor,
    });
    const end = make(values.length - 2, 'Point');
    if (segment.type === 'M') start = end;
    if (segment.type === 'C') points.push(make(0, 'Handle', previous), make(2, 'Handle', end));
    if (segment.type === 'Q') points.push(make(0, 'Handle', end));
    points.push(end);
    previous = end;
  }
  return points;
}

export function movePoint(segments, id, x, y) {
  if (![x, y].every((n) => Number.isFinite(n) && Math.abs(n) <= 1e9)) return false;
  const [segment, offset] = id.split(':').map(Number);
  const values = segments[segment].values;
  values[offset] = x;
  values[offset + 1] = y;
  return true;
}
