export const svgNS = 'http://www.w3.org/2000/svg';

const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const xmlnsNS = 'http://www.w3.org/2000/xmlns/';
const xlinkNS = 'http://www.w3.org/1999/xlink';
const set = (s) => new Set(s.split(/\s+/));
const elements = set(
  'svg g defs symbol use title desc path rect circle ellipse line polyline polygon text tspan ' +
    'linearGradient radialGradient stop clipPath mask pattern marker',
);
const paint = set(
  'fill fill-rule fill-opacity stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin ' +
    'stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color display visibility ' +
    'stop-color stop-opacity clip-path clip-rule mask marker-start marker-mid marker-end ' +
    'vector-effect paint-order shape-rendering color-interpolation font-family font-size font-style ' +
    'font-weight text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing',
);
const attributes = set(
  'id class role tabindex viewBox preserveAspectRatio version width height x y x1 x2 y1 y2 cx cy ' +
    'rx ry r fx fy fr dx dy d points pathLength transform rotate textLength lengthAdjust ' +
    'gradientUnits gradientTransform spreadMethod offset clipPathUnits maskUnits maskContentUnits ' +
    'patternUnits patternContentUnits patternTransform markerUnits markerWidth markerHeight refX refY orient',
);
const reference = /^#[\w:.%-]+$/u;
const localPaint =
  /^url\(\s*(['"]?)(#[\w:.%-]+)\1\s*\)(?:\s+(?:none|currentColor|#[\da-f]{3,8}|[a-z]+))?$/iu;
const urlPaint = set('fill stroke clip-path mask marker-start marker-mid marker-end');
const safeValue = /^[\w\s.,#%+()'"-]*$/u;
const links = set('use linearGradient radialGradient pattern');
const serializer = new XMLSerializer();

function checkPaint(name, value) {
  const cleaned = value.trim();
  if (urlPaint.has(name) && localPaint.test(cleaned)) return;
  // Exclude CSS escapes, substitution, at-rules and URI functions. Only plain values
  // and literal color functions are needed for this static editor.
  const literals = cleaned.replace(
    /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)/gi,
    '',
  );
  if (!safeValue.test(cleaned) || /[()]/.test(literals))
    throw new Error('Only plain paint values and local SVG references are supported.');
}

function checkAttribute(element, attribute) {
  const { name, localName, namespaceURI, value } = attribute;
  if (namespaceURI === xmlnsNS) return;
  if (namespaceURI === xmlNS && ['lang', 'space'].includes(localName)) return;
  if (localName === 'href' && (namespaceURI === xlinkNS || namespaceURI === null)) {
    if (!links.has(element.localName) || !reference.test(value))
      throw new Error('Only local SVG references are supported.');
    return;
  }
  if (namespaceURI !== null) throw new Error('Unsupported SVG attribute: ' + name);
  if (name === 'style') {
    for (const declaration of value.split(';').filter((part) => part.trim())) {
      const colon = declaration.indexOf(':');
      const property = declaration.slice(0, colon).trim().toLowerCase();
      if (colon < 0 || !paint.has(property))
        throw new Error('Unsupported SVG style: ' + (property || declaration));
      checkPaint(property, declaration.slice(colon + 1));
    }
    return;
  }
  if (paint.has(name)) {
    checkPaint(name, value);
    return;
  }
  if (!attributes.has(name) && !/^(?:data|aria)-[\w-]+$/.test(name))
    throw new Error('Unsupported SVG attribute: ' + name);
}

function dimensions(root) {
  const box = root.getAttribute('viewBox');
  const raw = box
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const length = (name) => {
    const value = root.getAttribute(name)?.trim();
    return value && /^\d*\.?\d+(?:px)?$/.test(value) ? Number.parseFloat(value) : 0;
  };
  const width = length('width');
  const height = length('height');
  if (
    box !== null &&
    (raw.length !== 4 || !raw.every(Number.isFinite) || raw[2] <= 0 || raw[3] <= 0)
  )
    throw new Error('The SVG viewBox must have a positive width and height.');
  if (!raw && !(width > 0 && height > 0))
    throw new Error('The SVG needs a viewBox or numeric width and height.');
  const ratio = width > 0 && height > 0 ? width / height : raw[2] / raw[3];
  if (!Number.isFinite(ratio) || ratio <= 0 || !Number.isFinite(width + height))
    throw new Error('The SVG dimensions are outside the supported range.');
  return {
    ratio,
    displayBox: raw ? null : '0 0 ' + width + ' ' + height,
  };
}

export function readSvg(text) {
  if (text.length > 2_000_000) throw new Error('Choose an SVG smaller than 2 MB.');
  if (/<!DOCTYPE|<!ENTITY/i.test(text))
    throw new Error('SVG document types and entities are not supported.');
  const document = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = document.documentElement;
  if (
    root.localName !== 'svg' ||
    root.namespaceURI !== svgNS ||
    document.querySelector('parsererror')
  )
    throw new Error('Choose a valid SVG file with an SVG namespace.');
  const all = root.querySelectorAll('*');
  if (all.length > 5_000) throw new Error('This SVG has too many elements for the editor.');
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_PROCESSING_INSTRUCTION);
  if (walker.nextNode()) throw new Error('SVG processing instructions are not supported.');
  const ids = new Set();
  for (const element of [root, ...all]) {
    if (element.namespaceURI !== svgNS || !elements.has(element.localName))
      throw new Error('Unsupported SVG element: <' + element.localName + '>.');
    for (const attribute of element.attributes) checkAttribute(element, attribute);
    if (element.id) {
      if (ids.has(element.id)) throw new Error('SVG element IDs must be unique.');
      ids.add(element.id);
    }
  }
  return { root, ...dimensions(root) };
}

export function serializeSvg(root, displayBox) {
  const copy = root.cloneNode(true);
  if (displayBox) copy.removeAttribute('viewBox');
  return serializer.serializeToString(copy);
}

export const serializeElement = (element) => serializer.serializeToString(element);
