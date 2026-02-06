/**
 * Border radius mask injection for rounded-corner screenshots.
 * Applies CSS clip-path: inset(...round Xpx) to <html> and temporarily
 * removes html/body backgrounds so corners become transparent.
 *
 * The CSS spec propagates root element backgrounds to the canvas, so
 * clip-path alone doesn't make corners transparent — we must also clear
 * the html/body CSS backgrounds and rely on omitBackground: true.
 *
 * Uses string-based page.evaluate() for the same reasons as paddingMask.ts:
 * - Module-level constants aren't available in serialized functions
 * - esbuild __name wrappers don't exist in the browser
 */

import type { Page } from 'playwright';

/**
 * Apply CSS clip-path with rounded inset to <html> and remove backgrounds.
 * Coordinates are viewport-relative (from Playwright boundingBox/clip).
 */
export async function injectBorderRadiusMask(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
  borderRadius: number
): Promise<void> {
  await page.evaluate(
    `(function(config) {
      var scrollX = window.scrollX || 0;
      var scrollY = window.scrollY || 0;
      var docWidth = document.documentElement.scrollWidth;
      var docHeight = document.documentElement.scrollHeight;

      // Convert viewport coords to document coords for inset calculation
      var top = config.y + scrollY;
      var left = config.x + scrollX;
      var bottom = docHeight - (top + config.height);
      var right = docWidth - (left + config.width);

      // Clamp to non-negative (avoid invalid inset values)
      top = Math.max(0, top);
      left = Math.max(0, left);
      bottom = Math.max(0, bottom);
      right = Math.max(0, right);

      var html = document.documentElement;
      var body = document.body;

      // Save original styles
      html.dataset.heroshotOriginalClip = html.style.clipPath || '';
      html.dataset.heroshotOriginalHtmlBg = html.style.background || '';
      html.dataset.heroshotOriginalBodyBg = body.style.background || '';
      html.dataset.heroshotOriginalHtmlBgColor = html.style.backgroundColor || '';
      html.dataset.heroshotOriginalBodyBgColor = body.style.backgroundColor || '';

      // Apply clip-path with rounded corners
      html.style.clipPath = 'inset(' + top + 'px ' + right + 'px ' + bottom + 'px ' + left + 'px round ' + config.borderRadius + 'px)';

      // Remove html/body backgrounds so canvas is transparent
      // (CSS spec: root element bg propagates to canvas, bypassing clip-path)
      html.style.setProperty('background', 'transparent', 'important');
      html.style.setProperty('background-color', 'transparent', 'important');
      body.style.setProperty('background', 'transparent', 'important');
      body.style.setProperty('background-color', 'transparent', 'important');
    })(${JSON.stringify({ ...clip, borderRadius })})`
  );
}

/**
 * Remove border radius clip mask and restore original styles.
 */
export async function removeBorderRadiusMask(page: Page): Promise<void> {
  await page.evaluate(
    `(function() {
      var html = document.documentElement;
      var body = document.body;

      // Restore clip-path
      if (html.dataset.heroshotOriginalClip !== undefined) {
        html.style.clipPath = html.dataset.heroshotOriginalClip;
        delete html.dataset.heroshotOriginalClip;
      }

      // Restore html background
      if (html.dataset.heroshotOriginalHtmlBg !== undefined) {
        html.style.background = html.dataset.heroshotOriginalHtmlBg;
        html.style.backgroundColor = html.dataset.heroshotOriginalHtmlBgColor || '';
        delete html.dataset.heroshotOriginalHtmlBg;
        delete html.dataset.heroshotOriginalHtmlBgColor;
      }

      // Restore body background
      if (html.dataset.heroshotOriginalBodyBg !== undefined) {
        body.style.background = html.dataset.heroshotOriginalBodyBg;
        body.style.backgroundColor = html.dataset.heroshotOriginalBodyBgColor || '';
        delete html.dataset.heroshotOriginalBodyBg;
        delete html.dataset.heroshotOriginalBodyBgColor;
      }
    })()`
  );
}
