/**
 * Browser context scripts for DOM manipulation.
 * These functions execute in the browser via page.evaluate().
 */

import type { Page } from 'playwright';
import { verbose } from '../ui';

/**
 * Script to detect visible background color by walking up the DOM tree.
 * Must be executed in browser context via page.evaluate().
 */
const GET_BACKGROUND_COLOR_SCRIPT = String.raw`
  (element) => {
    const toHex = (bgColor) => {
      const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
        const red = parseInt(rgbMatch[1], 10);
        const green = parseInt(rgbMatch[2], 10);
        const blue = parseInt(rgbMatch[3], 10);
        return '#' + red.toString(16).padStart(2, '0') + green.toString(16).padStart(2, '0') + blue.toString(16).padStart(2, '0');
      }
      return bgColor;
    };

    const isOpaque = (bgColor) => bgColor && bgColor !== 'transparent' && !bgColor.startsWith('rgba(0, 0, 0, 0)');

    let current = element;
    while (current) {
      const style = globalThis.getComputedStyle(current);
      const bgColor = style.backgroundColor;

      if (isOpaque(bgColor)) {
        return toHex(bgColor);
      }

      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        current = root.host;
      } else {
        current = current.parentElement;
      }
    }

    const bodyBg = globalThis.getComputedStyle(document.body).backgroundColor;
    if (isOpaque(bodyBg)) return toHex(bodyBg);

    const htmlBg = globalThis.getComputedStyle(document.documentElement).backgroundColor;
    if (isOpaque(htmlBg)) return toHex(htmlBg);

    return '#ffffff';
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
  await page.evaluate(`
    (() => {
      const selector = ${JSON.stringify(selector)};
      const bgColor = ${JSON.stringify(bgColor)};

      const parts = selector.split('>>>').map((p) => p.trim());
      let current = document;

      for (const part of parts) {
        if (!part) continue;
        const root = current instanceof Element ? (current.shadowRoot ?? current) : current;
        const found = root.querySelector(part);
        if (!found) return;
        current = found;
      }

      if (!(current instanceof Element)) return;

      current.dataset.heroshotOriginalBg = current.style.backgroundColor;
      current.style.backgroundColor = bgColor;
    })()
  `);
}

/**
 * Restore original background on element.
 */
export async function restoreElementBackground(page: Page, selector: string): Promise<void> {
  await page.evaluate(`
    (() => {
      const selector = ${JSON.stringify(selector)};

      const parts = selector.split('>>>').map((p) => p.trim());
      let current = document;

      for (const part of parts) {
        if (!part) continue;
        const root = current instanceof Element ? (current.shadowRoot ?? current) : current;
        const found = root.querySelector(part);
        if (!found) return;
        current = found;
      }

      if (!(current instanceof Element)) return;

      const original = current.dataset.heroshotOriginalBg;
      if (original !== undefined) {
        current.style.backgroundColor = original;
        delete current.dataset.heroshotOriginalBg;
      }
    })()
  `);
}

/**
 * Apply text overrides to elements on the page.
 */
export async function applyTextOverrides(
  page: Page,
  selector: string,
  textOverrides: Record<string, string>
): Promise<void> {
  await page.evaluate(`
    (() => {
      const mainSelector = ${JSON.stringify(selector)};
      const overrides = ${JSON.stringify(textOverrides)};

      const parts = mainSelector.split('>>>').map((p) => p.trim());
      let mainElement = document;
      for (const part of parts) {
        if (!part) continue;
        const root = mainElement instanceof Element ? (mainElement.shadowRoot ?? mainElement) : mainElement;
        const found = root.querySelector(part);
        if (!found) return;
        mainElement = found;
      }

      if (!(mainElement instanceof Element)) return;

      for (const [relativeSelector, newText] of Object.entries(overrides)) {
        const textEl = mainElement.querySelector(relativeSelector);
        if (textEl) {
          textEl.textContent = newText;
        }
      }
    })()
  `);
  await page.waitForTimeout(50);
}

/**
 * Get background color for an element via page.evaluate.
 */
export async function getElementBackgroundColor(page: Page, selector: string): Promise<string> {
  const bgColorResult = await page.evaluate(`
    (() => {
      const selector = ${JSON.stringify(selector)};
      const parts = selector.split('>>>').map((p) => p.trim());
      let current = document;

      for (const part of parts) {
        if (!part) continue;
        const root = current instanceof Element ? (current.shadowRoot ?? current) : current;
        const found = root.querySelector(part);
        if (!found) return '#ffffff';
        current = found;
      }

      if (!(current instanceof Element)) return '#ffffff';

      const detectBg = ${GET_BACKGROUND_COLOR_SCRIPT};
      return detectBg(current);
    })()
  `);

  const bgColor = typeof bgColorResult === 'string' ? bgColorResult : '#ffffff';
  verbose(`Detected background color: ${bgColor}`);
  return bgColor;
}

/**
 * Apply dark mode class to document based on color scheme.
 */
export async function applyColorSchemeClass(
  page: Page,
  colorScheme: 'light' | 'dark'
): Promise<void> {
  await page.evaluate(`
    (() => {
      const isDark = ${colorScheme === 'dark'};
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    })()
  `);
}
