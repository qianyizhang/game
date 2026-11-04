// One cube, six faces, two triangles per face. Corners are duplicated at face
// boundaries because a corner has a different normal and UV on each face.
const faces = [
  {
    name: 'Front',
    normal: [0, 0, 1],
    color: [0.18, 0.8, 0.72],
    corners: [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ],
  },
  {
    name: 'Right',
    normal: [1, 0, 0],
    color: [1, 0.55, 0.3],
    corners: [
      [1, -1, 1],
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
    ],
  },
  {
    name: 'Back',
    normal: [0, 0, -1],
    color: [0.56, 0.48, 0.95],
    corners: [
      [1, -1, -1],
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
    ],
  },
  {
    name: 'Left',
    normal: [-1, 0, 0],
    color: [0.38, 0.65, 1],
    corners: [
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
    ],
  },
  {
    name: 'Top',
    normal: [0, 1, 0],
    color: [0.95, 0.79, 0.33],
    corners: [
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
      [-1, 1, -1],
    ],
  },
  {
    name: 'Bottom',
    normal: [0, -1, 0],
    color: [0.93, 0.4, 0.61],
    corners: [
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
      [-1, -1, 1],
    ],
  },
];
const uv = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
export const vertices = faces.flatMap((face) =>
  face.corners.map((position, corner) => ({
    position,
    normal: face.normal,
    color: face.color,
    uv: uv[corner],
  })),
);
export const triangles = faces.flatMap((face, index) =>
  [
    [0, 1, 2],
    [0, 2, 3],
  ].map((corners) => ({
    indices: corners.map((corner) => index * 4 + corner),
    face: face.name,
  })),
);
