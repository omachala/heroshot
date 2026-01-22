import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: waitForTimeout / getByText().waitFor() */
export async function executeWait(page: Page, action: Action): Promise<void> {
  if (action.type !== 'wait') return;
  if (action.time !== undefined) {
    await page.waitForTimeout(Math.min(action.time * 1000, 30_000));
  }
  if (action.text) {
    await page.getByText(action.text).first().waitFor({ state: 'visible' });
  }
  if (action.textGone) {
    await page.getByText(action.textGone).first().waitFor({ state: 'hidden' });
  }
}
