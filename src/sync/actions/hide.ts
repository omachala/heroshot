import type { Page } from 'playwright';
import type { Action } from './types';

/** Hide elements by setting display: none */
export async function executeHide(page: Page, action: Action): Promise<void> {
  if (action.type !== 'hide') return;
  for (const selector of action.selectors) {
    await page.locator(selector).evaluateAll((elements: HTMLElement[]) => {
      for (const element of elements) {
        element.style.display = 'none';
      }
    });
  }
}
