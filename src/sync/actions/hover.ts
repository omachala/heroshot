import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.hover() */
export async function executeHover(page: Page, action: Action): Promise<void> {
  if (action.type !== 'hover') return;
  await page.locator(action.selector).hover();
}
