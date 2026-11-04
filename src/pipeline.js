import { transform, rotation, translation, perspective, normalize, mix, dot } from './math.js';
import { vertices, triangles } from './mesh.js';

export const WIDTH = 192;
export const HEIGHT = 192;
export const defaults = {
  angle: -32,
  tilt: 24,
  distance: 5,
  near: 0.5,
  fov: 48,
  light: 40,
  texture: true,
  lighting: true,
  depth: true,
  correct: true,
};
export const background = [15, 23, 35, 255];

export function uniformsFor(settings) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  return {
    model: rotation(radians(settings.tilt), radians(settings.angle)),
    view: translation(-settings.distance),
    projection: perspective(radians(settings.fov), WIDTH / HEIGHT, settings.near, 30),
    light: normalize([Math.sin(radians(settings.light)), 0.8, Math.cos(radians(settings.light))]),
  };
}

// 1 → 2: This is our vertex shader. Exactly the same matrices go to the GPU.
export function vertexShader(vertex, uniforms) {
  const world = transform(uniforms.model, [...vertex.position, 1]);
  const view = transform(uniforms.view, world);
  const clip = transform(uniforms.projection, view);
  // Rotation only: a general nonuniform scale needs an inverse-transpose matrix.
  const normal = transform(uniforms.model, [...vertex.normal, 0]).slice(0, 3);
  return { ...vertex, world, view, clip, normal };
}

// 3: Sutherland–Hodgman clipping in HOMOGENEOUS coordinates, before division.
// Each signed distance must be >= 0: -w <= x, y, z <= w.
export const clipPlanes = [
  (p) => p[3] + p[0],
  (p) => p[3] - p[0],
  (p) => p[3] + p[1],
  (p) => p[3] - p[1],
  (p) => p[3] + p[2],
  (p) => p[3] - p[2],
];
function interpolateVertex(a, b, t) {
  return Object.fromEntries(Object.keys(a).map((key) => [key, mix(a[key], b[key], t)]));
}
export function clipTriangle(triangle) {
  let polygon = triangle;
  for (const distance of clipPlanes) {
    const output = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % polygon.length];
      const da = distance(a.clip),
        db = distance(b.clip);
      if (da >= 0) output.push(a);
      if (da >= 0 !== db >= 0) {
        const t = da / (da - db);
        output.push(interpolateVertex(a, b, t));
      }
    }
    polygon = output;
  }
  // A clipped triangle can become a polygon. Split it into a triangle fan.
  return polygon.slice(1, -1).map((vertex, i) => [polygon[0], vertex, polygon[i + 2]]);
}

// 4: Clip → normalized device coordinates → a top-left-origin canvas viewport.
export function viewport(vertex, width = WIDTH, height = HEIGHT) {
  const ndc = vertex.clip.slice(0, 3).map((value) => value / vertex.clip[3]);
  return {
    ...vertex,
    ndc,
    screen: [(ndc[0] * 0.5 + 0.5) * width, (0.5 - ndc[1] * 0.5) * height],
    depth: ndc[2] * 0.5 + 0.5,
  };
}

// A signed edge function. It gives the area of the parallelogram a→b→point.
export function edge(a, b, point) {
  return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
}
export function barycentric(triangle, point) {
  const [a, b, c] = triangle.map((vertex) => vertex.screen);
  const area = edge(a, b, c);
  if (Math.abs(area) < 1e-10) return null;
  return [edge(b, c, point) / area, edge(c, a, point) / area, edge(a, b, point) / area];
}
// Include a shared edge in exactly one triangle (top-left rule, canvas Y down).
function topLeft(a, b) {
  return b[1] < a[1] || (b[1] === a[1] && b[0] > a[0]);
}
export function covered(triangle, weights) {
  const points = triangle.map((vertex) => vertex.screen);
  const positive = edge(...points) > 0;
  return weights.every((weight, i) => {
    if (Math.abs(weight) > 1e-10) return weight > 0;
    let a = points[(i + 1) % 3],
      b = points[(i + 2) % 3];
    if (!positive) [a, b] = [b, a];
    return topLeft(a, b);
  });
}

// 5: Perspective-correct attributes: q_i = (lambda_i / w_i) / sum(lambda / w).
// Depth is already post-divide; interpolate it with SCREEN weights, not q.
export function interpolate(triangle, weights, correct = true) {
  let attributeWeights = weights;
  if (correct) {
    const divided = weights.map((weight, i) => weight / triangle[i].clip[3]);
    const total = divided.reduce((sum, value) => sum + value, 0);
    attributeWeights = divided.map((value) => value / total);
  }
  const attribute = (key) =>
    triangle[0][key].map((_, channel) =>
      triangle.reduce((sum, vertex, i) => sum + attributeWeights[i] * vertex[key][channel], 0),
    );
  return {
    weights,
    attributeWeights,
    uv: attribute('uv'),
    normal: normalize(attribute('normal')),
    color: attribute('color'),
    depth: triangle.reduce((sum, vertex, i) => sum + weights[i] * vertex.depth, 0),
  };
}

// 6: The fragment shader returns a color; it does NOT decide visibility.
export function fragmentShader(fragment, settings, uniforms) {
  const [u, v] = fragment.uv;
  const checker = (Math.floor(u * 6) + Math.floor(v * 6)) % 2 === 0 ? 1 : 0.38;
  const texel = settings.texture ? checker : 1;
  const diffuse = Math.max(dot(fragment.normal, uniforms.light), 0);
  const illumination = settings.lighting ? 0.22 + 0.78 * diffuse : 1;
  const rgb = fragment.color.map((channel) => channel * texel * illumination);
  return {
    ...fragment,
    texel,
    diffuse,
    illumination,
    rgb,
    rgba: [...rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255)), 255],
  };
}

function blankImage() {
  const image = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  for (let i = 0; i < image.length; i += 4) image.set(background, i);
  return image;
}

// The deliberately simple CPU pipeline. Store intermediate values for inspection.
// No hidden GPU calls, no workers, no animation loop, no performance shortcuts.
export function render(settings = defaults, selectedPixel = [96, 96]) {
  const uniforms = uniformsFor(settings);
  const transformed = vertices.map((vertex) => vertexShader(vertex, uniforms));
  const assembled = triangles.map((triangle, id) => ({
    id,
    ...triangle,
    vertices: triangle.indices.map((index) => transformed[index]),
  }));
  const clipped = assembled.flatMap((triangle) =>
    clipTriangle(triangle.vertices).map((part) => ({
      ...triangle,
      vertices: part.map((vertex) => viewport(vertex)),
    })),
  );
  const images = {
    coverage: blankImage(),
    uv: blankImage(),
    shaded: blankImage(),
    depth: blankImage(),
    final: blankImage(),
  };
  const depths = new Float64Array(WIDTH * HEIGHT).fill(1);
  const owners = new Int16Array(WIDTH * HEIGHT).fill(-1);
  const hits = [];
  let fragments = 0,
    passed = 0,
    rejected = 0;
  for (const triangle of clipped) {
    const xs = triangle.vertices.map((vertex) => vertex.screen[0]);
    const ys = triangle.vertices.map((vertex) => vertex.screen[1]);
    for (
      let y = Math.max(0, Math.floor(Math.min(...ys)));
      y < Math.min(HEIGHT, Math.ceil(Math.max(...ys)));
      y++
    ) {
      for (
        let x = Math.max(0, Math.floor(Math.min(...xs)));
        x < Math.min(WIDTH, Math.ceil(Math.max(...xs)));
        x++
      ) {
        const weights = barycentric(triangle.vertices, [x + 0.5, y + 0.5]);
        if (!weights || !covered(triangle.vertices, weights)) continue;
        const interpolated = interpolate(triangle.vertices, weights, settings.correct);
        const fragment = fragmentShader(interpolated, settings, uniforms);
        const index = y * WIDTH + x,
          offset = index * 4;
        fragments++;
        // These three buffers intentionally have no depth test: last fragment wins.
        images.coverage.set([...triangle.vertices[0].color.map((c) => c * 255), 255], offset);
        images.uv.set([fragment.uv[0] * 255, fragment.uv[1] * 255, 100, 255], offset);
        images.shaded.set(fragment.rgba, offset);
        // 7: LESS depth test, against the value stored by an earlier fragment.
        const previousDepth = depths[index];
        const accepted = !settings.depth || fragment.depth < previousDepth;
        if (x === selectedPixel[0] && y === selectedPixel[1]) {
          hits.push({
            triangle: triangle.id,
            face: triangle.face,
            ...fragment,
            previousDepth,
            accepted,
          });
        }
        if (accepted) {
          passed++;
          depths[index] = fragment.depth;
          owners[index] = triangle.id;
          images.final.set(fragment.rgba, offset);
          const gray = (1 - fragment.depth) * 255;
          images.depth.set([gray, gray, gray, 255], offset);
        } else rejected++;
      }
    }
  }
  return {
    uniforms,
    transformed,
    assembled,
    clipped,
    images,
    depths,
    owners,
    hits,
    stats: {
      vertices: vertices.length,
      inputTriangles: triangles.length,
      clippedTriangles: clipped.length,
      fragments,
      passed,
      rejected,
      pixels: owners.filter((id) => id >= 0).length,
    },
  };
}
