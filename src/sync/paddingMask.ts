/**
 * Padding mask injection for element screenshots.
 * Handles temporary DOM elements to fill padding areas with background color.
 *
 * ============================================================================
 * WHY STRING-BASED EVALUATION?
 * ============================================================================
 *
 * These functions use string-based page.evaluate() for two reasons:
 *
 * 1. MODULE-LEVEL CONSTANTS: The MASK_ID constant is defined at module level.
 *    When Playwright serializes a function for page.evaluate(), it only
 *    serializes the function body - not module-level variables. This causes:
 *    "ReferenceError: MASK_ID is not defined"
 *
 * 2. esbuild __name WRAPPERS: If we inlined the constant inside the function,
 *    esbuild/tsx would wrap nested functions with __name() for debugging.
 *    This helper doesn't exist in the browser, causing:
 *    "ReferenceError: __name is not defined"
 *
 * String-based evaluation bypasses both issues by sending raw JavaScript
 * that runs directly in the browser without any transpilation.
 * ============================================================================
 */

import type { ElementHandle, Page } from 'playwright';
import type { Padding } from './types';

const MASK_ID = 'heroshot-padding-mask';

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

  await page.evaluate(
    `(function(config) {
      var MASK_ID = ${JSON.stringify(MASK_ID)};
      var box = config.box;
      var padding = config.padding;
      var bgColor = config.bgColor;

      // Remove existing mask
      var existing = document.querySelector('#' + MASK_ID);
      if (existing) existing.remove();

      var container = document.createElement('div');
      container.id = MASK_ID;
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646;';

      if (padding.top > 0) {
        var top = document.createElement('div');
        top.style.cssText = 'position:absolute;top:' + (box.y - padding.top) + 'px;left:' + (box.x - padding.left) + 'px;width:' + (box.width + padding.left + padding.right) + 'px;height:' + padding.top + 'px;background:' + bgColor + ';';
        container.appendChild(top);
      }

      if (padding.bottom > 0) {
        var bottom = document.createElement('div');
        bottom.style.cssText = 'position:absolute;top:' + (box.y + box.height) + 'px;left:' + (box.x - padding.left) + 'px;width:' + (box.width + padding.left + padding.right) + 'px;height:' + padding.bottom + 'px;background:' + bgColor + ';';
        container.appendChild(bottom);
      }

      if (padding.left > 0) {
        var left = document.createElement('div');
        left.style.cssText = 'position:absolute;top:' + box.y + 'px;left:' + (box.x - padding.left) + 'px;width:' + padding.left + 'px;height:' + box.height + 'px;background:' + bgColor + ';';
        container.appendChild(left);
      }

      if (padding.right > 0) {
        var right = document.createElement('div');
        right.style.cssText = 'position:absolute;top:' + box.y + 'px;left:' + (box.x + box.width) + 'px;width:' + padding.right + 'px;height:' + box.height + 'px;background:' + bgColor + ';';
        container.appendChild(right);
      }

      document.body.appendChild(container);
    })(${JSON.stringify({ box, padding, bgColor })})`
  );
}

/**
 * Remove injected padding mask.
 */
export async function removePaddingMask(page: Page): Promise<void> {
  await page.evaluate(
    `(function() {
      var MASK_ID = ${JSON.stringify(MASK_ID)};
      var existing = document.querySelector('#' + MASK_ID);
      if (existing) existing.remove();
    })()`
  );
}
