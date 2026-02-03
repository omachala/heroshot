/**
 * Element finding using Playwright's native locator API.
 * Supports all Playwright selector formats:
 * - CSS: `.class`, `#id`, `div > span` (default)
 * - XPath: `xpath=//button[@id="submit"]`
 * - Text: `text=Submit`
 * - Role: `role=button[name="Submit"]`
 * - Chaining: `div >> span` (pierces shadow DOM)
 *
 * Legacy `>>>` syntax is automatically converted to `>>` for backward compatibility.
 */

import type { ElementHandle, Page } from 'playwright';

/**
 * Normalize selector for Playwright compatibility.
 * Converts legacy `>>>` shadow-piercing syntax to Playwright's `>>`.
 */
export function normalizeSelector(selector: string): string {
  // Convert our legacy >>> to Playwright's >>
  // First normalize whitespace around >>>, then replace with >>
  return selector.replaceAll('>>>', '>>').replaceAll('  ', ' ').trim();
}

/**
 * Find element using Playwright's locator API with retries.
 * Supports all Playwright selector formats including shadow DOM piercing.
 * Automatically scrolls the element into view once found.
 */
export async function findElement(
  page: Page,
  selector: string,
  maxAttempts = 10,
  intervalMs = 500
): Promise<ElementHandle | null> {
  const normalizedSelector = normalizeSelector(selector);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const locator = page.locator(normalizedSelector);
      const element = await locator.elementHandle({ timeout: intervalMs });

      if (element) {
        // Scroll element into view before returning
        await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
        return element;
      }
    } catch {
      // Element not found, retry
    }

    if (attempt < maxAttempts) {
      await page.waitForTimeout(intervalMs);
    }
  }

  return null;
}
