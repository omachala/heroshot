/**
 * Padding mask injection for element screenshots.
 * Handles temporary DOM elements to fill padding areas with background color.
 */

import type { ElementHandle, Page } from 'playwright';
import type { Padding } from './types';

/**
 * Inject temporary mask divs to fill padding areas with background color.
 */
export async function injectPaddingMask(
  page: Page,
  element: ElementHandle,
  padding: Padding,
  bgColor: string
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) return;

  await page.evaluate(`
    (() => {
      const box = ${JSON.stringify(box)};
      const padding = ${JSON.stringify(padding)};
      const bgColor = ${JSON.stringify(bgColor)};
      const maskId = 'heroshot-padding-mask';

      document.querySelector('#' + maskId)?.remove();

      const container = document.createElement('div');
      container.id = maskId;
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646;';

      if (padding.top > 0) {
        const top = document.createElement('div');
        top.style.cssText = 'position:absolute;top:' + (box.y - padding.top) + 'px;left:' + (box.x - padding.left) + 'px;width:' + (box.width + padding.left + padding.right) + 'px;height:' + padding.top + 'px;background:' + bgColor + ';';
        container.append(top);
      }

      if (padding.bottom > 0) {
        const bottom = document.createElement('div');
        bottom.style.cssText = 'position:absolute;top:' + (box.y + box.height) + 'px;left:' + (box.x - padding.left) + 'px;width:' + (box.width + padding.left + padding.right) + 'px;height:' + padding.bottom + 'px;background:' + bgColor + ';';
        container.append(bottom);
      }

      if (padding.left > 0) {
        const left = document.createElement('div');
        left.style.cssText = 'position:absolute;top:' + box.y + 'px;left:' + (box.x - padding.left) + 'px;width:' + padding.left + 'px;height:' + box.height + 'px;background:' + bgColor + ';';
        container.append(left);
      }

      if (padding.right > 0) {
        const right = document.createElement('div');
        right.style.cssText = 'position:absolute;top:' + box.y + 'px;left:' + (box.x + box.width) + 'px;width:' + padding.right + 'px;height:' + box.height + 'px;background:' + bgColor + ';';
        container.append(right);
      }

      document.body.append(container);
    })()
  `);
}

/**
 * Remove injected padding mask.
 */
export async function removePaddingMask(page: Page): Promise<void> {
  await page.evaluate(`document.querySelector('#heroshot-padding-mask')?.remove()`);
}
