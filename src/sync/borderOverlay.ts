/**
 * Border overlay injection for element screenshots.
 * Injects a fixed-position div with border styling over the capture region.
 *
 * Uses string-based page.evaluate() for the same reasons as paddingMask.ts.
 */

import type { Page } from 'playwright';

const OVERLAY_ID = 'heroshot-border-overlay';

/**
 * Inject a border overlay div positioned over the clip region.
 */
export async function injectBorderOverlay(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
  borderWidth: number,
  borderColor: string,
  borderRadius: number
): Promise<void> {
  await page.evaluate(
    `(function(config) {
      var OVERLAY_ID = ${JSON.stringify(OVERLAY_ID)};
      var existing = document.querySelector('#' + OVERLAY_ID);
      if (existing) existing.remove();

      var div = document.createElement('div');
      div.id = OVERLAY_ID;
      div.style.cssText = 'position:fixed;'
        + 'left:' + config.x + 'px;'
        + 'top:' + config.y + 'px;'
        + 'width:' + config.width + 'px;'
        + 'height:' + config.height + 'px;'
        + 'border:' + config.borderWidth + 'px solid ' + config.borderColor + ';'
        + 'border-radius:' + config.borderRadius + 'px;'
        + 'box-sizing:border-box;'
        + 'pointer-events:none;'
        + 'z-index:2147483646;';
      document.body.appendChild(div);
    })(${JSON.stringify({ ...clip, borderWidth, borderColor, borderRadius })})`
  );
}

/**
 * Remove border overlay.
 */
export async function removeBorderOverlay(page: Page): Promise<void> {
  await page.evaluate(
    `(function() {
      var el = document.querySelector('#${OVERLAY_ID}');
      if (el) el.remove();
    })()`
  );
}
