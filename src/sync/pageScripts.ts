/**
 * Browser context scripts for DOM manipulation.
 * Uses Playwright's locator API for selector handling, supporting all formats:
 * - CSS: `.class`, `#id`, `div > span`
 * - Role: `role=button[name="Submit"]`
 * - Text: `text="Submit"`
 * - Shadow DOM: `host >> inner` (Playwright's piercing syntax)
 *
 * Functions use locator.evaluate() to run code on found elements,
 * avoiding the need for selector parsing in browser context.
 */

import type { Page } from 'playwright';
import { verbose } from '../ui';
import { applyColorScheme } from './browserFunctions';
import { normalizeSelector } from './elementFinder';

/**
 * Store original background and apply new background color to element.
 * Uses Playwright's locator API to support all selector formats.
 */
export async function applyElementBackground(
  page: Page,
  selector: string,
  bgColor: string
): Promise<void> {
  const locator = page.locator(normalizeSelector(selector));
  try {
    await locator.evaluate(
      (element, color) => {
        if (element instanceof HTMLElement) {
          element.dataset['heroshotOriginalBg'] = element.style.backgroundColor;
          element.style.backgroundColor = color;
        }
      },
      bgColor,
      { timeout: 5000 }
    );
  } catch {
    // Element not found, ignore
  }
}

/**
 * Restore original background on element.
 * Uses Playwright's locator API to support all selector formats.
 */
export async function restoreElementBackground(page: Page, selector: string): Promise<void> {
  const locator = page.locator(normalizeSelector(selector));
  try {
    await locator.evaluate(
      element => {
        if (element instanceof HTMLElement) {
          // eslint-disable-next-line prefer-destructuring -- computed property name
          const originalBg = element.dataset['heroshotOriginalBg'];
          if (originalBg !== undefined) {
            element.style.backgroundColor = originalBg;
            delete element.dataset['heroshotOriginalBg'];
          }
        }
      },
      { timeout: 5000 }
    );
  } catch {
    // Element not found, ignore
  }
}

/**
 * Apply text overrides to elements on the page.
 * Uses Playwright's locator API for the container, then CSS selectors for relative paths.
 */
export async function applyTextOverrides(
  page: Page,
  selector: string,
  textOverrides: Record<string, string>
): Promise<void> {
  const locator = page.locator(normalizeSelector(selector));
  try {
    await locator.evaluate(
      (container, overrides) => {
        for (const [relativeSelector, newText] of Object.entries(overrides)) {
          const textElement = container.querySelector(relativeSelector);
          if (textElement) {
            textElement.textContent = newText;
          }
        }
      },
      textOverrides,
      { timeout: 5000 }
    );
  } catch {
    // Container not found, ignore
  }
  await page.waitForTimeout(50);
}

/**
 * Get background color for an element.
 * Uses Playwright's locator API to support all selector formats.
 */
export async function getElementBackgroundColor(page: Page, selector: string): Promise<string> {
  const locator = page.locator(normalizeSelector(selector));

  try {
    const bgColor = await locator.evaluate(
      element => {
        // eslint-disable-next-line unicorn/consistent-function-scoping -- browser context
        function rgbToHex(color: string): string {
          const rgbMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
          if (rgbMatch?.[1] && rgbMatch[2] && rgbMatch[3]) {
            const red = Number.parseInt(rgbMatch[1], 10);
            const green = Number.parseInt(rgbMatch[2], 10);
            const blue = Number.parseInt(rgbMatch[3], 10);
            return (
              '#' +
              red.toString(16).padStart(2, '0') +
              green.toString(16).padStart(2, '0') +
              blue.toString(16).padStart(2, '0')
            );
          }
          return color;
        }

        // eslint-disable-next-line unicorn/consistent-function-scoping -- browser context
        function isOpaqueColor(color: string): boolean {
          return Boolean(color && color !== 'transparent' && !color.startsWith('rgba(0, 0, 0, 0)'));
        }

        let current: Element | null = element;
        while (current) {
          const { backgroundColor } = getComputedStyle(current);
          if (isOpaqueColor(backgroundColor)) {
            return rgbToHex(backgroundColor);
          }
          const root = current.getRootNode();
          current = root instanceof ShadowRoot ? root.host : current.parentElement;
        }

        const { backgroundColor: bodyBg } = getComputedStyle(document.body);
        if (isOpaqueColor(bodyBg)) return rgbToHex(bodyBg);

        const { backgroundColor: htmlBg } = getComputedStyle(document.documentElement);
        if (isOpaqueColor(htmlBg)) return rgbToHex(htmlBg);

        return '#ffffff';
      },
      { timeout: 5000 }
    );

    verbose(`Detected background color: ${bgColor}`);
    return bgColor;
  } catch {
    verbose('Could not detect background color, using default #ffffff');
    return '#ffffff';
  }
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
