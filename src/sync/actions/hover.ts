import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.hover() */
export async function executeHover(page: Page, action: Action): Promise<void> {
  if (action.type !== 'hover') return;
  const locator = page.locator(action.selector);
  await (action.timeout ? locator.hover({ timeout: action.timeout }) : locator.hover());
}
