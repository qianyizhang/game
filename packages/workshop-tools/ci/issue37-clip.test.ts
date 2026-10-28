import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { clipContains, enclosingClip, type PageRect } from '../../../tests/browser/issue37-clip.ts';

function grid(columns: number): PageRect[] {
  return Array.from({ length: 6 }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = 17 + column * 116;
    const top = 29 + row * 187;
    return { left, top, right: left + 100, bottom: top + 172 };
  });
}

for (const [label, columns] of [
  ['desktop', 4],
  ['phone', 2],
] as const) {
  void test(`${label} collection crop contains all six card rectangles`, () => {
    const rects = grid(columns);
    const clip = enclosingClip(rects);
    for (const [index, rect] of rects.entries())
      assert.equal(clipContains(clip, rect), true, `card ${index + 1} is cropped`);
    assert.deepEqual(clip, {
      x: 17,
      y: 29,
      width: columns === 4 ? 448 : 216,
      height: columns === 4 ? 359 : 546,
    });
    if (columns === 4) {
      const sixthCardCrop = { ...clip, width: rects[5].right - clip.x };
      assert.equal(clipContains(sixthCardCrop, rects[3]), false);
    }
  });
}
