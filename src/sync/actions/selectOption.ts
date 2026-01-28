import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.selectOption(values) */
export async function executeSelectOption(page: Page, action: Action): Promise<void> {
  if (action.type !== 'select_option') return;
  const locator = page.locator(action.selector);
  await (action.timeout
    ? locator.selectOption(action.values, { timeout: action.timeout })
    : locator.selectOption(action.values));
}
