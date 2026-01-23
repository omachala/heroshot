import type { Page } from 'playwright';
import type { Action } from './types';

/**
 * MCP: page.evaluate(fn) or locator.evaluate(fn)
 * Uses string expression evaluation in the browser context to avoid Node-side eval.
 */
export async function executeEvaluate(page: Page, action: Action): Promise<void> {
  if (action.type !== 'evaluate') return;
  const { selector } = action;
  if (selector) {
    const escapedSelector = selector.replaceAll("'", String.raw`\'`);
    await page.evaluate(`(${action.function})(document.querySelector('${escapedSelector}'))`);
  } else {
    await page.evaluate(`(${action.function})()`);
  }
}
