/**
 * Browser context scripts for DOM manipulation.
 * These functions execute in the browser via page.evaluate().
 *
 * ============================================================================
 * CRITICAL: esbuild __name HELPER ISSUE - READ THIS BEFORE MODIFYING
 * ============================================================================
 *
 * BACKGROUND:
 * When we run the CLI with `tsx` (which uses esbuild under the hood), esbuild
 * adds a __name() helper function to preserve function names for debugging.
 *
 * THE PROBLEM:
 * When Playwright's page.evaluate(fn, args) is called, it serializes the
 * function using Function.prototype.toString(). If esbuild has modified the
 * function to include __name() calls, the serialized code will reference
 * __name - but __name doesn't exist in the browser context!
 *
 * This causes: ReferenceError: __name is not defined
 *
 * WHEN DOES esbuild ADD __name?
 * esbuild adds __name() wrapper specifically when:
 *   1. A function is EXPORTED from a module, AND
 *   2. That function contains a NESTED FUNCTION (including inline helpers)
 *
 * SOLUTION:
 * Functions that need nested helpers (like querySelectorDeep) must use
 * STRING-BASED evaluation. The string is passed directly to page.evaluate()
 * and bypasses esbuild transpilation entirely.
 *
 * Simple functions without nested helpers (like applyColorScheme) can still
 * use typed function references safely.
 * ============================================================================
 */

import type { Page } from 'playwright';
import { verbose } from '../ui';
import { applyColorScheme } from './browserFunctions';

/**
 * Shared helper function for shadow DOM piercing selectors.
 * Defined as a string to be inlined into page.evaluate() calls.
 *
 * WHY STRING-BASED: If this were a regular function inlined into an exported
 * function, esbuild/tsx would wrap it with __name() which doesn't exist in
 * the browser, causing "ReferenceError: __name is not defined".
 */
const QUERY_SELECTOR_DEEP = `
function querySelectorDeep(selector) {
  var parts = selector.split('>>>').map(function(p) { return p.trim(); });
  var current = document;
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part) continue;
    var root = (current instanceof Element && current.shadowRoot) ? current.shadowRoot : current;
    var found = root.querySelector(part);
    if (!found) return null;
    current = found;
  }
  return current instanceof Element ? current : null;
}
`;

/**
 * Store original background and apply new background color to element.
 */
export async function applyElementBackground(
  page: Page,
  selector: string,
  bgColor: string
): Promise<void> {
  await page.evaluate(
    `(function(selector, bgColor) {
      ${QUERY_SELECTOR_DEEP}
      var element = querySelectorDeep(selector);
      if (!element || !(element instanceof HTMLElement)) return;
      element.dataset.heroshotOriginalBg = element.style.backgroundColor;
      element.style.backgroundColor = bgColor;
    })(${JSON.stringify(selector)}, ${JSON.stringify(bgColor)})`
  );
}

/**
 * Restore original background on element.
 */
export async function restoreElementBackground(page: Page, selector: string): Promise<void> {
  await page.evaluate(
    `(function(selector) {
      ${QUERY_SELECTOR_DEEP}
      var element = querySelectorDeep(selector);
      if (!element || !(element instanceof HTMLElement)) return;
      var originalBg = element.dataset.heroshotOriginalBg;
      if (originalBg !== undefined) {
        element.style.backgroundColor = originalBg;
        delete element.dataset.heroshotOriginalBg;
      }
    })(${JSON.stringify(selector)})`
  );
}

/**
 * Apply text overrides to elements on the page.
 */
export async function applyTextOverrides(
  page: Page,
  selector: string,
  textOverrides: Record<string, string>
): Promise<void> {
  await page.evaluate(
    `(function(containerSelector, overrides) {
      ${QUERY_SELECTOR_DEEP}
      var container = querySelectorDeep(containerSelector);
      if (!container) return;
      var keys = Object.keys(overrides);
      for (var i = 0; i < keys.length; i++) {
        var relativeSelector = keys[i];
        var newText = overrides[relativeSelector];
        var textElement = container.querySelector(relativeSelector);
        if (textElement) {
          textElement.textContent = newText;
        }
      }
    })(${JSON.stringify(selector)}, ${JSON.stringify(textOverrides)})`
  );
  await page.waitForTimeout(50);
}

/**
 * Get background color for an element via page.evaluate.
 */
export async function getElementBackgroundColor(page: Page, selector: string): Promise<string> {
  // Build the script with regex pattern - using concatenation to avoid eslint String.raw requirement
  const rgbRegex = '/rgba?' + String.raw`\((\d+),\s*(\d+),\s*(\d+)/`;
  const script = `(function(selector) {
      ${QUERY_SELECTOR_DEEP}

      function rgbToHex(bgColor) {
        var rgbMatch = ${rgbRegex}.exec(bgColor);
        if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
          var red = parseInt(rgbMatch[1], 10);
          var green = parseInt(rgbMatch[2], 10);
          var blue = parseInt(rgbMatch[3], 10);
          return '#' +
            red.toString(16).padStart(2, '0') +
            green.toString(16).padStart(2, '0') +
            blue.toString(16).padStart(2, '0');
        }
        return bgColor;
      }

      function isOpaqueColor(bgColor) {
        return Boolean(bgColor && bgColor !== 'transparent' && !bgColor.startsWith('rgba(0, 0, 0, 0)'));
      }

      var element = querySelectorDeep(selector);
      if (!element) return '#ffffff';

      var current = element;
      while (current) {
        var backgroundColor = getComputedStyle(current).backgroundColor;
        if (isOpaqueColor(backgroundColor)) {
          return rgbToHex(backgroundColor);
        }
        var root = current.getRootNode();
        current = (root instanceof ShadowRoot) ? root.host : current.parentElement;
      }

      var bodyBg = getComputedStyle(document.body).backgroundColor;
      if (isOpaqueColor(bodyBg)) return rgbToHex(bodyBg);

      var htmlBg = getComputedStyle(document.documentElement).backgroundColor;
      if (isOpaqueColor(htmlBg)) return rgbToHex(htmlBg);

      return '#ffffff';
    })(${JSON.stringify(selector)})`;

  const bgColor: string = await page.evaluate(script);
  verbose(`Detected background color: ${bgColor}`);
  return bgColor;
}

/**
 * Apply dark mode class to document based on color scheme.
 * This function has no nested helpers, so typed evaluation is safe.
 */
export async function applyColorSchemeClass(
  page: Page,
  colorScheme: 'light' | 'dark'
): Promise<void> {
  await page.evaluate(applyColorScheme, colorScheme === 'dark');
}
