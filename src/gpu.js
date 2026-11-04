// The GPU executes only these two programmable stages. Clipping, rasterization,
// interpolation and depth testing are provided by WebGL, not by GLSL functions.
export const vertexSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
attribute vec2 aUV;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform bool uCorrect;
varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vUV;
varying float vCorrection;
void main() {
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
  vNormal = mat3(uModel) * aNormal;
  vColor = aColor;
  // Multiplying by w cancels WebGL's perspective correction for the experiment.
  vCorrection = uCorrect ? 1.0 : gl_Position.w;
  vUV = aUV * vCorrection;
}`;
export const fragmentSource = `
precision highp float;
uniform vec3 uLight;
uniform bool uTexture;
uniform bool uLighting;
varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vUV;
varying float vCorrection;
void main() {
  vec2 uv = vUV / vCorrection;
  float parity = mod(floor(uv.x * 6.0) + floor(uv.y * 6.0), 2.0);
  float checker = parity < 1.0 ? 1.0 : 0.38;
  float texel = uTexture ? checker : 1.0;
  float diffuse = max(dot(normalize(vNormal), uLight), 0.0);
  float light = uLighting ? 0.22 + 0.78 * diffuse : 1.0;
  gl_FragColor = vec4(vColor * texel * light, 1.0);
}`;

export function createGPU(canvas, vertices, triangles) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('WebGL is unavailable. The complete CPU lesson still works.');
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  // The same indexed mesh as the CPU. One interleaved vertex: pos, normal, color, UV.
  const data = vertices.flatMap((vertex) => [
    ...vertex.position,
    ...vertex.normal,
    ...vertex.color,
    ...vertex.uv,
  ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  for (const [name, size, offset] of [
    ['aPosition', 3, 0],
    ['aNormal', 3, 3],
    ['aColor', 3, 6],
    ['aUV', 2, 9],
  ]) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 11 * 4, offset * 4);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(triangles.flatMap((t) => t.indices)),
    gl.STATIC_DRAW,
  );
  const location = (name) => gl.getUniformLocation(program, name);
  return (settings, uniforms) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(15 / 255, 23 / 255, 35 / 255, 1);
    gl.clearDepth(1);
    // Restore depth writes before clearing, including after the disabled experiment.
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    settings.depth ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    for (const key of ['model', 'view', 'projection']) {
      gl.uniformMatrix4fv(
        location(`u${key[0].toUpperCase()}${key.slice(1)}`),
        false,
        new Float32Array(uniforms[key]),
      );
    }
    gl.uniform3fv(location('uLight'), uniforms.light);
    gl.uniform1i(location('uTexture'), settings.texture);
    gl.uniform1i(location('uLighting'), settings.lighting);
    gl.uniform1i(location('uCorrect'), settings.correct);
    gl.drawElements(gl.TRIANGLES, triangles.length * 3, gl.UNSIGNED_SHORT, 0);
  };
}
