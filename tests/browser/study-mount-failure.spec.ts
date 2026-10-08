import { expect, test } from '@playwright/test';

// Fail after WebGL canvas allocation to cover cleanup beyond constructor failure.
test('gallery releases a partially mounted scene and can load another study', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')!
      .value as HTMLCanvasElement['getContext'];
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      writable: true,
      value: function (this: HTMLCanvasElement, kind: string, ...args: unknown[]): unknown {
        if (
          kind === '2d' &&
          this.width === 256 &&
          document.querySelector('.study-render canvas[role="img"]')
        ) {
          Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: original });
          return null;
        }
        return Reflect.apply(original, this, [kind, ...args]);
      },
    });
  });
  await page.goto('/?art=3d');
  await expect(page.getByRole('alert')).toContainText('sculpture could not be loaded');
  await expect(page.locator('.study-render canvas')).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Choose a 3D study' })
    .getByRole('button', { name: /Spiral/ })
    .click();
  await expect(page.locator('.study-render')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.study-render canvas')).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
