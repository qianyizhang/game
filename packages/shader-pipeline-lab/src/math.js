// Matrices are column-major, as in GLSL. Vectors are columns: result = M × v.
export const scale = (a, amount) => a.map((value) => value * amount);
export const mix = (a, b, t) => a.map((value, i) => value * (1 - t) + b[i] * t);
export const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const normalize = (vector) => scale(vector, 1 / (Math.hypot(...vector) || 1));

export function transform(matrix, vector) {
  return [0, 1, 2, 3].map(
    (row) =>
      matrix[row] * vector[0] +
      matrix[4 + row] * vector[1] +
      matrix[8 + row] * vector[2] +
      matrix[12 + row] * vector[3],
  );
}

export function multiply(a, b) {
  const result = [];
  for (let column = 0; column < 4; column++) {
    result.push(...transform(a, b.slice(column * 4, column * 4 + 4)));
  }
  return result;
}

export function rotation(x, y) {
  const cx = Math.cos(x),
    sx = Math.sin(x);
  const cy = Math.cos(y),
    sy = Math.sin(y);
  const aroundX = [1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1];
  const aroundY = [cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1];
  return multiply(aroundY, aroundX);
}

export function translation(z) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1];
}

// Right-handed camera looks along -Z. OpenGL NDC depth is [-1, +1].
export function perspective(fovRadians, aspect, near, far) {
  const f = 1 / Math.tan(fovRadians / 2);
  return [
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far),
    0,
  ];
}
