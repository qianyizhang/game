import test from 'node:test';
import assert from 'node:assert/strict';
import { transform, translation, perspective } from '../src/math.js';
import { vertices, triangles } from '../src/mesh.js';
import {
  defaults,
  render,
  clipTriangle,
  clipPlanes,
  viewport,
  interpolate,
  barycentric,
  covered,
  fragmentShader,
} from '../src/pipeline.js';

const near = (a, b, epsilon = 1e-9) => assert.ok(Math.abs(a - b) < epsilon, `${a} ≈ ${b}`);
function corner(clip, uv = [0, 0]) {
  return { clip, uv, normal: [0, 0, 1], color: [1, 1, 1], position: clip.slice(0, 3) };
}

test('matrix convention: camera translation and projection place near/far on canonical planes', () => {
  assert.deepEqual(transform(translation(-5), [1, 2, 3, 1]), [1, 2, -2, 1]);
  const projection = perspective(Math.PI / 2, 1, 1, 10);
  const nearClip = transform(projection, [0, 0, -1, 1]);
  const farClip = transform(projection, [0, 0, -10, 1]);
  near(nearClip[2] / nearClip[3], -1);
  near(farClip[2] / farClip[3], 1);
  assert.deepEqual(viewport(corner([0, 0, 0, 1])).screen, [96, 96]);
});

test('asset has 24 face-specific records and 12 valid, outward-wound triangles', () => {
  assert.equal(vertices.length, 24);
  assert.equal(triangles.length, 12);
  for (const triangle of triangles) {
    const [a, b, c] = triangle.indices.map((i) => vertices[i].position);
    const ab = b.map((v, i) => v - a[i]),
      ac = c.map((v, i) => v - a[i]);
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    assert.ok(
      cross.reduce((sum, v, i) => sum + v * vertices[triangle.indices[0]].normal[i], 0) > 0,
    );
  }
});

test('six-plane clipping retains, rejects, and creates interpolated edge vertices', () => {
  const input = [
    corner([-0.5, -0.5, 0, 1]),
    corner([0.5, -0.5, 0, 1], [1, 0]),
    corner([0, 0.5, 0, 1], [0.5, 1]),
  ];
  assert.equal(clipTriangle(input).length, 1);
  assert.equal(clipTriangle(input.map((v) => ({ ...v, clip: [3, v.clip[1], 0, 1] }))).length, 0);
  const crossing = [
    corner([-0.5, 0, 0, 1], [0, 0]),
    corner([2, 0, 0, 1], [1, 0]),
    corner([0, 0.5, 0, 1], [0, 1]),
  ];
  const clipped = clipTriangle(crossing);
  assert.equal(clipped.length, 2);
  for (const triangle of clipped)
    for (const vertex of triangle) {
      assert.ok(clipPlanes.every((plane) => plane(vertex.clip) >= -1e-9));
    }
  const intersection = clipped
    .flat()
    .find((v) => Math.abs(v.clip[0] - 1) < 1e-9 && Math.abs(v.clip[1]) < 1e-9);
  near(intersection.uv[0], 0.6);
  // Clip at every plane, including vertices with negative w behind the camera.
  for (const position of [
    [-3, 0, 0, 1],
    [3, 0, 0, 1],
    [0, -3, 0, 1],
    [0, 3, 0, 1],
    [0, 0, -3, 1],
    [0, 0, 3, 1],
    [0, 0, 0, -1],
  ]) {
    for (const triangle of clipTriangle([corner(position), input[0], input[1]])) {
      for (const vertex of triangle)
        assert.ok(clipPlanes.every((plane) => plane(vertex.clip) >= -1e-9));
    }
  }
});

test('perspective interpolation uses reciprocal w while depth stays screen-linear', () => {
  const triangle = [
    corner([0, 0, 0, 1], [0, 0]),
    corner([0, 0, 0, 2], [1, 0]),
    corner([0, 0, 0, 4], [0, 1]),
  ].map((v, i) => ({ ...v, depth: [0.2, 0.6, 1][i] }));
  const result = interpolate(triangle, [1 / 3, 1 / 3, 1 / 3]);
  near(result.uv[0], 2 / 7);
  near(result.uv[1], 1 / 7);
  near(result.depth, 0.6);
  const affine = interpolate(triangle, [1 / 3, 1 / 3, 1 / 3], false);
  near(affine.uv[0], 1 / 3);
  near(affine.uv[1], 1 / 3);
});

test('top-left coverage fills a shared-edge square once, for either winding', () => {
  for (const reverse of [false, true]) {
    const triangleA = [
        [0, 0],
        [4, 0],
        [4, 4],
      ],
      triangleB = [
        [0, 0],
        [4, 4],
        [0, 4],
      ];
    const pair = [triangleA, triangleB].map((points) =>
      (reverse ? points.toReversed() : points).map((screen) => ({ screen })),
    );
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const count = pair.filter((t) => covered(t, barycentric(t, [x + 0.5, y + 0.5]))).length;
        assert.equal(count, 1, `coverage at ${x},${y}`);
      }
  }
});

test('fragment shading has an independent expected diffuse and checker result', () => {
  const fragment = { uv: [0.2, 0], normal: [0, 0, 1], color: [1, 0.5, 0.25] };
  const output = fragmentShader(fragment, defaults, { light: [0, 0, 1] });
  assert.equal(output.texel, 0.38);
  assert.equal(output.illumination, 1);
  assert.deepEqual(output.rgba, [97, 48, 24, 255]);
  const unlit = fragmentShader(
    fragment,
    { ...defaults, texture: false, lighting: false },
    { light: [0, 0, -1] },
  );
  assert.deepEqual(unlit.rgba, [255, 128, 64, 255]);
});

test('end-to-end render resolves actual pixel hits to nearest depth; disabling depth exposes draw order', () => {
  const result = render(defaults, [96, 96]);
  assert.ok(result.stats.pixels > 5000);
  assert.ok(result.stats.rejected > 0);
  assert.ok(result.hits.length >= 2);
  const nearest = result.hits.reduce((a, b) => (a.depth < b.depth ? a : b));
  assert.equal(result.owners[96 * 192 + 96], nearest.triangle);
  assert.deepEqual(
    [...result.images.final.slice((96 * 192 + 96) * 4, (96 * 192 + 96) * 4 + 4)],
    nearest.rgba,
  );
  const noDepth = render({ ...defaults, depth: false });
  assert.equal(noDepth.stats.rejected, 0);
  assert.equal(noDepth.owners[96 * 192 + 96], noDepth.hits.at(-1).triangle);
  assert.notDeepEqual(result.images.final, noDepth.images.final);
});

test('near-plane crossing stays finite; fully clipped scene leaves clear buffers', () => {
  const cut = render({ ...defaults, near: 4.7 });
  assert.ok(cut.clipped.length > 0);
  assert.ok(cut.stats.pixels > 0);
  assert.ok(cut.clipped.flatMap((t) => t.vertices).every((v) => v.screen.every(Number.isFinite)));
  const empty = render({ ...defaults, near: 7 });
  assert.equal(empty.clipped.length, 0);
  assert.equal(empty.stats.fragments, 0);
  assert.equal(empty.hits.length, 0);
  assert.equal(empty.stats.pixels, 0);
  assert.equal(empty.depths[96 * 192 + 96], 1);
  assert.deepEqual([...empty.images.final.slice(0, 4)], [15, 23, 35, 255]);
});
