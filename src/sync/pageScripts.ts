/**
 * Browser context scripts for DOM manipulation.
 * These functions execute in the browser via page.evaluate().
 */

import type { Page } from 'playwright';
import { verbose } from '../ui';
import {
  applyBackground,
  applyColorScheme,
  applyTextOverrides as applyTextOverridesBrowser,
  detectBackgroundColor,
  restoreBackground,
} from './browserFunctions';

/**
 * Store original background and apply new background color to element.
 */
export async function applyElementBackground(
  page: Page,
  selector: string,
  bgColor: string
): Promise<void> {
  await page.evaluate(applyBackground, { selector, bgColor });
}

/**
 * Restore original background on element.
 */
export async function restoreElementBackground(page: Page, selector: string): Promise<void> {
  await page.evaluate(restoreBackground, selector);
}

/**
 * Apply text overrides to elements on the page.
 */
export async function applyTextOverrides(
  page: Page,
  selector: string,
  textOverrides: Record<string, string>
): Promise<void> {
  await page.evaluate(applyTextOverridesBrowser, {
    containerSelector: selector,
    overrides: textOverrides,
  });
  await page.waitForTimeout(50);
}

/**
 * Get background color for an element via page.evaluate.
 */
export async function getElementBackgroundColor(page: Page, selector: string): Promise<string> {
  const bgColor = await page.evaluate(detectBackgroundColor, selector);
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
  await page.evaluate(applyColorScheme, colorScheme === 'dark');
}
