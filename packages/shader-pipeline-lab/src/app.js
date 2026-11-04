import * as pipeline from './pipeline.js';
import { transform, rotation } from './math.js';
import { vertices, triangles } from './mesh.js';
import { lessons } from './lessons.js';
import { controlDefinitions, controlState, stageControlIds } from './controls.js';
import { createGPU, vertexSource, fragmentSource } from './gpu.js';

const $ = (id) => document.getElementById(id);
const settings = { ...pipeline.defaults };
let stage = 0;
let triangleId = 0;
let pixel = [96, 96];
let result;
let drawGPU;
let gpuAvailable = false;
let comparisonOpen = false;
let controlsStage = -1;
const canvas = $('scene');
const context = canvas.getContext('2d');
const pixelCanvas = document.createElement('canvas');
pixelCanvas.width = pipeline.WIDTH;
pixelCanvas.height = pipeline.HEIGHT;
const pixelContext = pixelCanvas.getContext('2d');
const number = (value) => (Number.isFinite(value) ? Number(value.toFixed(4)) : String(value));
const vector = (values) => `[${values.map(number).join(', ')}]`;
// Keep short numeric vectors on one line so the data reads like the math.
const json = (object) =>
  JSON.stringify(
    object,
    (_, value) => (typeof value === 'number' ? number(value) : value),
    2,
  ).replace(
    /\[\s*(-?\d[\d\s.,eE+-]*)\]/g,
    (_, values) =>
      `[${values
        .split(',')
        .map((value) => value.trim())
        .join(', ')}]`,
  );
const write = (id, value) => {
  $(id).textContent = value;
};

lessons.forEach((lesson, index) => {
  const button = document.createElement('button');
  button.className = `stage-button ${index === 1 || index === 5 ? 'programmable' : ''}`;
  button.innerHTML = `<span class="stage-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${lesson.title}</strong><small>${lesson.short}</small></span>`;
  button.onclick = () => {
    setStage(index);
    $('pipeline-picker').open = false;
    $('pipeline-picker').querySelector('summary').focus();
  };
  $('stages').append(button);
});
triangles.forEach((triangle, index) => {
  const option = document.createElement('option');
  option.value = index;
  option.textContent = `${index} · ${triangle.face}`;
  $('triangle').append(option);
});
$('triangle').onchange = (event) => {
  triangleId = Number(event.target.value);
  updateLesson();
};
$('previous').onclick = () => setStage(stage - 1);
$('next').onclick = () => setStage(stage + 1);
function setStage(index) {
  stage = Math.max(0, Math.min(lessons.length - 1, index));
  updateLesson();
}
// Build controls from the same definitions that own stage applicability.
for (const definition of controlDefinitions) {
  const wrapper = document.createElement('div');
  wrapper.className = 'control';
  wrapper.id = `control-${definition.id}`;
  const label = document.createElement('label');
  label.htmlFor = definition.id;
  label.className = definition.type === 'range' ? 'slider-label' : 'checkbox-label';
  const input = document.createElement('input');
  input.id = definition.id;
  input.type = definition.type;
  if (definition.type === 'range') {
    label.append(document.createTextNode(definition.label));
    const output = document.createElement('output');
    output.id = `${definition.id}-value`;
    output.htmlFor = definition.id;
    label.append(output);
    for (const key of ['min', 'max', 'step']) input[key] = definition[key];
    wrapper.append(label, input);
    input.oninput = () => {
      settings[definition.id] = Number(input.value);
      recompute();
    };
  } else {
    label.append(input, document.createTextNode(definition.label));
    wrapper.append(label);
    input.onchange = () => {
      settings[definition.id] = input.checked;
      recompute();
    };
  }
  const reason = document.createElement('small');
  reason.id = `${definition.id}-reason`;
  reason.className = 'control-reason';
  input.setAttribute('aria-describedby', reason.id);
  wrapper.append(reason);
  $('controls').append(wrapper);
}

function setInspector(view, focus = false) {
  for (const name of ['data', 'trace', 'code']) {
    const selected = name === view;
    $(`tab-${name}`).setAttribute('aria-selected', String(selected));
    $(`tab-${name}`).tabIndex = selected ? 0 : -1;
    $(`panel-${name}`).hidden = !selected;
  }
  if (focus) $(`tab-${view}`).focus();
}
for (const [index, name] of ['data', 'trace', 'code'].entries()) {
  $(`tab-${name}`).onclick = () => setInspector(name);
  $(`tab-${name}`).onkeydown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? 2
          : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    setInspector(['data', 'trace', 'code'][next], true);
  };
}
$('compare-gpu').onclick = () => {
  comparisonOpen = !comparisonOpen;
  updateContext();
};
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && $('pipeline-picker').open) {
    $('pipeline-picker').open = false;
    $('pipeline-picker').querySelector('summary').focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.pipeline-dock')) $('pipeline-picker').open = false;
});

function updateContext() {
  if (controlsStage !== stage) {
    // Reorder only on stage changes; moving a focused slider during drag loses focus.
    for (const id of stageControlIds[stage]) $('controls').append($(`control-${id}`));
    controlsStage = stage;
  }
  for (const definition of controlDefinitions) {
    const { visible, disabled, reason } = controlState(definition, stage, settings);
    $(`control-${definition.id}`).hidden = !visible;
    $(definition.id).disabled = disabled;
    write(`${definition.id}-reason`, reason);
    $(`${definition.id}-reason`).hidden = !reason;
  }
  $('controls-empty').hidden = stage !== 0;
  $('clip-preset').hidden = stage !== 2;
  $('depth-preset').hidden = ![6, 7].includes(stage);
  $('pixel-controls').hidden = stage < 4;
  $('geometry-note').hidden = stage >= 4;
  $('pixel-section').hidden = stage < 4;
  $('compare-gpu').hidden = stage !== 7;
  $('compare-gpu').disabled = !gpuAvailable;
  write('compare-gpu', gpuAvailable ? 'Compare GPU' : 'GPU unavailable');
  $('compare-gpu').title = gpuAvailable
    ? 'Compare final CPU and GPU color buffers'
    : $('gpu-status').textContent;
  $('gpu-view').hidden = stage !== 7 || !comparisonOpen;
  $('compare-gpu').setAttribute('aria-pressed', String(stage === 7 && comparisonOpen));
  $('glsl-source').hidden = ![1, 5, 7].includes(stage);
  write('current-stage', lessons[stage].title);
  canvas.setAttribute(
    'aria-label',
    stage < 4
      ? 'Geometry diagram; select a triangle with the triangle control.'
      : 'Stage view. Click to inspect a pixel; use arrow keys to move the selected pixel.',
  );
}
$('reset').onclick = () => {
  Object.assign(settings, pipeline.defaults);
  triangleId = 0;
  pixel = [96, 96];
  $('triangle').value = 0;
  recompute();
};
$('clip-preset').onclick = () => {
  Object.assign(settings, pipeline.defaults, { near: 4.7 });
  recompute();
  setStage(2);
  setInspector('data');
};
$('depth-preset').onclick = () => {
  Object.assign(settings, pipeline.defaults, { depth: false });
  recompute();
  setInspector('trace');
};
function selectPixel(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  pixel = [x, y].map((value) => Math.max(0, Math.min(191, Math.round(value))));
  recompute();
}
canvas.onclick = (event) => {
  if (stage < 4) return;
  const rect = canvas.getBoundingClientRect();
  selectPixel(
    Math.floor(((event.clientX - rect.left) / rect.width) * 192),
    Math.floor(((event.clientY - rect.top) / rect.height) * 192),
  );
};
canvas.onkeydown = (event) => {
  if (stage < 4) return;
  const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (moves[event.key]) {
    event.preventDefault();
    selectPixel(pixel[0] + moves[event.key][0], pixel[1] + moves[event.key][1]);
  }
};
$('pixel-x').onchange = (event) => selectPixel(Number(event.target.value), pixel[1]);
$('pixel-y').onchange = (event) => selectPixel(pixel[0], Number(event.target.value));
try {
  drawGPU = createGPU($('gpu'), vertices, triangles);
  gpuAvailable = true;
  write('gpu-status', 'Live GPU render · same scene, equivalent GLSL');
} catch (error) {
  write('gpu-status', error.message);
}
$('gpu').addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  drawGPU = null;
  gpuAvailable = false;
  write('gpu-status', 'GPU context lost. Reload to restore it; the CPU lesson still works.');
  updateContext();
});
write('vertex-source', vertexSource.trim());
write('fragment-source', fragmentSource.trim());

function recompute() {
  for (const definition of controlDefinitions) {
    const { id, type, unit = '' } = definition;
    if (type === 'range') {
      $(id).value = settings[id];
      write(`${id}-value`, `${settings[id]}${unit}`);
    } else {
      $(id).checked = settings[id];
    }
  }
  $('pixel-x').value = pixel[0];
  $('pixel-y').value = pixel[1];
  result = pipeline.render(settings, pixel);
  if (drawGPU) drawGPU(settings, result.uniforms);
  updateLesson();
}

function stageData() {
  const indices = triangles[triangleId].indices;
  const vertex = result.transformed[indices[0]];
  const parts = result.clipped.filter((triangle) => triangle.id === triangleId);
  const hit = result.hits.find((hit) => hit.triangle === triangleId) ?? result.hits[0];
  const offset = (pixel[1] * 192 + pixel[0]) * 4;
  const pairs = [
    [{ triangle: triangleId, indices }, { firstCorner: vertices[indices[0]] }],
    [
      {
        position: vertex.position,
        matrices: {
          model: result.uniforms.model,
          view: result.uniforms.view,
          projection: result.uniforms.projection,
        },
      },
      {
        world: vertex.world,
        view: vertex.view,
        clip: vertex.clip,
        normal: vertex.normal,
        uv: vertex.uv,
      },
    ],
    [
      { triangle: triangleId, clipCorners: indices.map((i) => result.transformed[i].clip) },
      {
        remainingTriangles: parts.length,
        clipCorners: parts.map((part) => part.vertices.map((v) => v.clip)),
      },
    ],
    [
      { retainedCorner: parts[0]?.vertices[0].clip ?? 'Selected triangle fully clipped' },
      parts[0]
        ? {
            ndc: parts[0].vertices[0].ndc,
            screen: parts[0].vertices[0].screen,
            depth: parts[0].vertices[0].depth,
          }
        : { screen: 'No retained geometry' },
    ],
    [
      {
        pixelCenter: pixel.map((value) => value + 0.5),
        triangle: hit?.triangle ?? 'No coverage',
        correction: settings.correct,
      },
      hit
        ? {
            lambda: hit.weights,
            q: hit.attributeWeights,
            uv: hit.uv,
            normal: hit.normal,
            depth: hit.depth,
          }
        : { fragments: 0 },
    ],
    [
      hit
        ? {
            triangle: hit.triangle,
            uv: hit.uv,
            normal: hit.normal,
            faceColor: hit.color,
            light: result.uniforms.light,
          }
        : { fragments: 0 },
      hit
        ? {
            checker: hit.texel,
            diffuse: hit.diffuse,
            illumination: hit.illumination,
            rgb: hit.rgb,
            rgba: hit.rgba,
          }
        : { color: 'No fragment at selected pixel' },
    ],
    [
      {
        enabled: settings.depth,
        clearDepth: 1,
        incoming: result.hits.map((h) => ({ triangle: h.triangle, depth: h.depth })),
      },
      {
        tests: result.hits.map((h) => ({
          triangle: h.triangle,
          stored: h.previousDepth,
          pass: h.accepted,
        })),
        finalDepth: result.depths[pixel[1] * 192 + pixel[0]],
      },
    ],
    [
      { contributions: result.hits.length, depthTest: settings.depth },
      {
        pixel,
        rgba: [...result.images.final.slice(offset, offset + 4)],
        visibleTriangle: result.owners[pixel[1] * 192 + pixel[0]],
        width: 192,
        height: 192,
      },
    ],
  ];
  return pairs[stage];
}
function sourceForStage() {
  return [
    '// src/mesh.js · actual input records\n' +
      json({ vertices: vertices.slice(0, 4), triangles: triangles.slice(0, 2) }),
    pipeline.vertexShader.toString(),
    pipeline.clipPlanes.map((fn) => fn.toString()).join('\n') +
      '\n\n' +
      pipeline.clipTriangle.toString(),
    pipeline.viewport.toString(),
    [pipeline.edge, pipeline.barycentric, pipeline.covered, pipeline.interpolate]
      .map((fn) => fn.toString())
      .join('\n\n'),
    pipeline.fragmentShader.toString(),
    pipeline.render.toString(),
    pipeline.render.toString(),
  ][stage];
}
function updateLesson() {
  const lesson = lessons[stage];
  updateContext();
  write('stage-title', lesson.title);
  write('stage-kind', `STAGE ${String(stage + 1).padStart(2, '0')} / ${lesson.kind.toUpperCase()}`);
  write('stage-lead', lesson.lead);
  write('step-count', `${stage + 1} / 8`);
  write('input-label', lesson.input);
  write('output-label', lesson.output);
  write('stage-process', lesson.process);
  write('stage-formula', lesson.formula);
  write('stage-hint', lesson.hint);
  write('stage-visual', lesson.visual);
  write('view-label', stage < 4 ? 'GEOMETRY DIAGRAM' : 'STAGE OUTPUT');
  write(
    'view-badge',
    stage < 4
      ? `Triangle ${triangleId} highlighted`
      : ['UV coordinates', 'Before depth test', 'Depth buffer', 'Color buffer'][stage - 4],
  );
  const [input, output] = stageData();
  write('stage-input', json(input));
  write('stage-output', json(output));
  write('cpu-source', sourceForStage());
  $('previous').disabled = stage === 0;
  $('next').disabled = stage === 7;
  [...$('stages').children].forEach((button, index) => {
    if (index === stage) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  drawStage();
  updateTrace();
  updatePixel();
  const stats = result.stats;
  $('stats').replaceChildren();
  for (const [label, value, firstStage] of [
    ['input triangles', stats.inputTriangles, 0],
    ['after clipping', stats.clippedTriangles, 2],
    ['fragments', stats.fragments, 4],
    ['depth rejects', stats.rejected, 6],
    ['visible pixels', stats.pixels, 7],
  ]) {
    if (stage < firstStage) continue;
    const item = document.createElement('span');
    item.innerHTML = `<strong>${value.toLocaleString()}</strong>${label}`;
    $('stats').append(item);
  }
}
function drawStage() {
  const size = canvas.width,
    factor = size / 192;
  context.clearRect(0, 0, size, size);
  if (stage >= 4) {
    const buffer = ['uv', 'shaded', 'depth', 'final'][stage - 4];
    pixelContext.putImageData(new ImageData(result.images[buffer], 192, 192), 0, 0);
    context.imageSmoothingEnabled = false;
    context.drawImage(pixelCanvas, 0, 0, size, size);
    const x = (pixel[0] + 0.5) * factor,
      y = (pixel[1] + 0.5) * factor;
    context.strokeStyle = '#fff';
    context.lineWidth = 1.5;
    context.strokeRect(x - 5, y - 5, 10, 10);
    context.strokeStyle = '#07101b';
    context.lineWidth = 1;
    context.strokeRect(x - 6, y - 6, 12, 12);
    return;
  }
  context.fillStyle = '#0f1723';
  context.fillRect(0, 0, size, size);
  context.strokeStyle = '#233446';
  context.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    context.beginPath();
    context.moveTo((i * size) / 12, 0);
    context.lineTo((i * size) / 12, size);
    context.stroke();
    context.beginPath();
    context.moveTo(0, (i * size) / 12);
    context.lineTo(size, (i * size) / 12);
    context.stroke();
  }
  function path(points, color, dashed = false, fill = false) {
    if (points.some((p) => !p.every(Number.isFinite))) return;
    context.beginPath();
    points.forEach((point, i) => (i ? context.lineTo(...point) : context.moveTo(...point)));
    context.closePath();
    if (fill) {
      context.fillStyle = '#6de0c518';
      context.fill();
    }
    context.strokeStyle = color;
    context.lineWidth = color === '#6de0c5' ? 3 : 1.3;
    context.setLineDash(dashed ? [6, 6] : []);
    context.stroke();
    context.setLineDash([]);
  }
  // Stage 2 shows the vertex shader output before the later clipping stage.
  let visible =
    stage === 1
      ? result.assembled.map((triangle) => ({
          ...triangle,
          vertices: triangle.vertices.map((vertex) => pipeline.viewport(vertex)),
        }))
      : result.clipped;
  if (stage === 0) {
    // Model-space diagram uses a separate, fixed orthographic display camera.
    // This is a diagram only; it is not a hidden stage of the render pipeline.
    const diagramRotation = rotation(-0.42, 0.55);
    visible = triangles.map((triangle, id) => ({
      id,
      vertices: triangle.indices.map((index) => {
        const p = transform(diagramRotation, [...vertices[index].position, 1]);
        return { screen: [96 + p[0] * 43, 96 - p[1] * 43] };
      }),
    }));
  }
  if (stage === 2) {
    for (const triangle of result.assembled) {
      path(
        triangle.vertices.map((vertex) => pipeline.viewport(vertex).screen.map((v) => v * factor)),
        '#627182',
        true,
      );
    }
  }
  for (const triangle of visible) {
    path(
      triangle.vertices.map((vertex) => vertex.screen.map((v) => v * factor)),
      triangle.id === triangleId ? '#6de0c5' : '#58728e',
      false,
      triangle.id === triangleId,
    );
  }
  const selected = visible.filter((triangle) => triangle.id === triangleId);
  for (const triangle of selected) {
    triangle.vertices.forEach((vertex, index) => {
      const [x, y] = vertex.screen.map((v) => v * factor);
      context.fillStyle = '#a2f9df';
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.fill();
      context.font = '14px monospace';
      context.fillText(String.fromCharCode(65 + index), x + 10, y - 10);
    });
  }
  context.strokeStyle = '#678093';
  context.strokeRect(0.5, 0.5, size - 1, size - 1);
  if (stage === 3) {
    context.fillStyle = '#b4cbdc';
    context.font = '14px monospace';
    context.fillText('(0, 0)', 12, 25);
    context.fillText('(192, 192)', size - 110, size - 15);
  }
}
function updateTrace() {
  const vertex = result.transformed[triangles[triangleId].indices[0]];
  const projected = pipeline.viewport(vertex);
  const inside = pipeline.clipPlanes.every((plane) => plane(vertex.clip) >= 0);
  $('coordinate-trace').replaceChildren();
  for (const [label, value, firstStage] of [
    ['Model', vector(vertex.position), 0],
    ['World', vector(vertex.world), 1],
    ['View', vector(vertex.view), 1],
    ['Clip', vector(vertex.clip), 1],
    [
      'NDC → screen',
      `${vector(projected.ndc)}\n→ ${vector(projected.screen)}${inside ? '' : '\nOutside clip volume'}`,
      3,
    ],
  ]) {
    if (stage < firstStage) continue;
    const item = document.createElement('div');
    item.className = 'coordinate-card';
    const title = document.createElement('strong');
    title.textContent = label;
    const code = document.createElement('code');
    code.textContent = value;
    code.style.whiteSpace = 'pre-wrap';
    item.append(title, code);
    $('coordinate-trace').append(item);
  }
}
function updatePixel() {
  write('pixel-title', `Pixel (${pixel.join(', ')})`);
  write('hit-count', `${result.hits.length} CONTRIBUTIONS`);
  const offset = (pixel[1] * 192 + pixel[0]) * 4;
  const viewBuffer =
    result.images[['uv', 'shaded', 'depth', 'final'][stage - 4]] ?? result.images.final;
  write('pixel-color', `View RGBA ${vector([...viewBuffer.slice(offset, offset + 4)])}`);
  $('pixel-hits').replaceChildren();
  for (const hit of result.hits) {
    const row = document.createElement('tr');
    const values = [
      `${hit.triangle} · ${hit.face}`,
      vector(hit.uv),
      vector(hit.weights),
      vector(hit.attributeWeights),
      `${number(hit.depth)} / ${number(hit.previousDepth)}`,
      settings.depth ? (hit.accepted ? 'Pass · write' : 'Reject') : 'Test off · write',
      vector(hit.rgba),
    ];
    values.forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 5) cell.className = hit.accepted ? 'pass' : 'reject';
      row.append(cell);
    });
    $('pixel-hits').append(row);
  }
  if (!result.hits.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No triangle covers this pixel. The clear color remains in the framebuffer.';
    row.append(cell);
    $('pixel-hits').append(row);
  }
}
recompute();
