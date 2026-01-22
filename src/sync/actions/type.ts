import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.fill(text) or locator.pressSequentially(text) */
export async function executeType(page: Page, action: Action): Promise<void> {
  if (action.type !== 'type') return;
  const locator = page.locator(action.selector);
  await (action.slowly ? locator.pressSequentially(action.text) : locator.fill(action.text));
  if (action.submit) await page.keyboard.press('Enter');
}
