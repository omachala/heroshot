/**
 * Element finding with shadow DOM support.
 * Uses >>> syntax to pierce shadow DOM boundaries.
 */

import type { ElementHandle, Page } from 'playwright';

/**
 * Find element using shadow-piercing selector with retries.
 * The >>> syntax pierces shadow DOM boundaries.
 */
export async function findElement(
  page: Page,
  selector: string,
  maxAttempts = 10,
  intervalMs = 500
): Promise<ElementHandle | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const handle = await page.evaluateHandle(`
      (() => {
        const selector = ${JSON.stringify(selector)};
        const parts = selector.split('>>>').map((part) => part.trim());
        let current = document;

        for (const part of parts) {
          if (!part) continue;

          const root = current instanceof Element
            ? (current.shadowRoot ?? current)
            : current;

          const found = root.querySelector(part);
          if (!found) return null;

          current = found;
        }

        return current instanceof Element ? current : null;
      })()
    `);

    const element = handle.asElement();
    if (element) {
      return element;
    }

    await handle.dispose();

    if (attempt < maxAttempts) {
      await page.waitForTimeout(intervalMs);
    }
  }

  return null;
}
