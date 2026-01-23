import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.selectOption(values) */
export async function executeSelectOption(page: Page, action: Action): Promise<void> {
  if (action.type !== 'select_option') return;
  await page.locator(action.selector).selectOption(action.values);
}
